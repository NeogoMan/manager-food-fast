/**
 * WebSocket Manager for Real-Time Order Notifications
 * Handles Socket.io connections, rooms, and event broadcasting
 */

import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.io server
 * @param {Object} httpServer - HTTP server instance
 * @param {String} frontendUrl - Frontend URL for CORS
 * @returns {Object} Socket.io server instance
 */
export function initializeSocket(httpServer, frontendUrl) {
  io = new Server(httpServer, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Handle client joining specific rooms
    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`📍 Client ${socket.id} joined room: ${room}`);

      // Send confirmation to client
      socket.emit('room-joined', { room, socketId: socket.id });
    });

    // Handle client leaving room
    socket.on('leave-room', (room) => {
      socket.leave(room);
      console.log(`📍 Client ${socket.id} left room: ${room}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });

    // Heartbeat/ping to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  console.log('🔌 WebSocket server initialized');
  return io;
}

/**
 * Get the Socket.io instance
 * @returns {Object} Socket.io server instance
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized! Call initializeSocket first.');
  }
  return io;
}

/**
 * Emit new order event to all kitchen clients
 * @param {Object} order - Order object with all details
 */
export function emitNewOrder(order) {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized, skipping event emit');
    return;
  }

  console.log(`📢 Broadcasting new order: ${order.order_number}`);

  // Broadcast to all clients in 'kitchen' room
  io.to('kitchen').emit('new-order', {
    order,
    timestamp: new Date().toISOString()
  });

  // Also broadcast to 'orders' room for order station updates
  io.to('orders').emit('new-order', {
    order,
    timestamp: new Date().toISOString()
  });

  // Broadcast to manager dashboard if exists
  io.to('manager').emit('new-order', {
    order,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit order status update to all connected clients
 * @param {Object} order - Updated order object
 */
export function emitOrderStatusUpdate(order) {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized, skipping event emit');
    return;
  }

  console.log(`📢 Broadcasting order status update: ${order.order_number} → ${order.status}`);

  // Broadcast to all rooms
  io.to('kitchen').emit('order-status-updated', {
    order,
    timestamp: new Date().toISOString()
  });

  io.to('orders').emit('order-status-updated', {
    order,
    timestamp: new Date().toISOString()
  });

  io.to('manager').emit('order-status-updated', {
    order,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit order approval request to Gestionnaire and Caissier
 * @param {Object} order - Order object requiring approval
 */
export function emitOrderApprovalRequest(order) {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized, skipping event emit');
    return;
  }

  console.log(`📢 Broadcasting approval request: ${order.order_number}`);

  // Broadcast to approval-staff room (Gestionnaire and Caissier)
  io.to('approval-staff').emit('order-approval-request', {
    order,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit order accepted event
 * @param {Object} order - Approved order object
 */
export function emitOrderAccepted(order) {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized, skipping event emit');
    return;
  }

  console.log(`📢 Broadcasting order accepted: ${order.order_number}`);

  // Notify client
  if (order.user_id) {
    io.to(`client-${order.user_id}`).emit('order-accepted', {
      order,
      timestamp: new Date().toISOString()
    });
  }

  // Notify kitchen
  io.to('kitchen').emit('new-order', {
    order,
    timestamp: new Date().toISOString()
  });

  // Notify all approval staff (to remove notification)
  io.to('approval-staff').emit('order-approved', {
    orderId: order.id,
    timestamp: new Date().toISOString()
  });

  // Notify orders room
  io.to('orders').emit('order-status-updated', {
    order,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit order rejected event
 * @param {Object} order - Rejected order object
 */
export function emitOrderRejected(order) {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized, skipping event emit');
    return;
  }

  console.log(`📢 Broadcasting order rejected: ${order.order_number}`);

  // Notify client
  if (order.user_id) {
    io.to(`client-${order.user_id}`).emit('order-rejected', {
      order,
      timestamp: new Date().toISOString()
    });
  }

  // Notify all approval staff (to remove notification)
  io.to('approval-staff').emit('order-rejected-by-staff', {
    orderId: order.id,
    timestamp: new Date().toISOString()
  });

  // Notify orders room
  io.to('orders').emit('order-status-updated', {
    order,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get connection statistics
 * @returns {Object} Connection stats
 */
export function getConnectionStats() {
  if (!io) {
    return { connected: 0, rooms: {} };
  }

  const sockets = io.sockets.sockets;
  const stats = {
    connected: sockets.size,
    rooms: {}
  };

  // Count clients in each room
  ['kitchen', 'orders', 'manager', 'approval-staff'].forEach(room => {
    const roomSockets = io.sockets.adapter.rooms.get(room);
    stats.rooms[room] = roomSockets ? roomSockets.size : 0;
  });

  return stats;
}

export default {
  initializeSocket,
  getIO,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitOrderApprovalRequest,
  emitOrderAccepted,
  emitOrderRejected,
  getConnectionStats
};
