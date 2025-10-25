import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, closePool } from './database/postgres.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import { initializeSocket, getConnectionStats } from './utils/socketManager.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Test database connection
await testConnection();

// Initialize WebSocket server
const io = initializeSocket(httpServer, FRONTEND_URL);

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Make Socket.io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const socketStats = getConnectionStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
    websocket: {
      connected: socketStats.connected,
      rooms: socketStats.rooms
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server - bind to 0.0.0.0 to accept connections from any network interface
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Fast Food Manager API Server running on port ${PORT}`);
  console.log(`🌐 Accessible at: http://localhost:${PORT} and http://192.168.11.100:${PORT}`);
  console.log(`📡 CORS enabled for: ${FRONTEND_URL}`);
  console.log(`🔌 WebSocket server running on port ${PORT}`);
  console.log(`🗄️  Database: PostgreSQL (${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT})`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  - GET    /api/health (includes WebSocket stats)`);
  console.log(`  - GET    /api/menu`);
  console.log(`  - POST   /api/menu`);
  console.log(`  - PUT    /api/menu/:id`);
  console.log(`  - DELETE /api/menu/:id`);
  console.log(`  - GET    /api/orders`);
  console.log(`  - POST   /api/orders`);
  console.log(`  - PUT    /api/orders/:id`);
  console.log(`\nWebSocket rooms: kitchen, orders, manager`);
  console.log(`\n✨ Server ready! Access from other devices at http://192.168.11.100:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await closePool();
  process.exit(0);
});
