# 🍔 Fast Food Restaurant Management System

A complete web application for managing a fast food restaurant's orders and menu. Built with React, Node.js, Express, and SQLite.

## ✨ Features

### Menu Management
- ✅ Add, edit, and delete menu items
- ✅ Organize items by categories (Burgers, Sides, Drinks, Desserts)
- ✅ Set item availability status
- ✅ Include prices, descriptions, and images (optional)

### Order Management
- ✅ Create new orders with multiple items
- ✅ Real-time order status tracking
- ✅ Order workflow: Pending → Preparing → Ready → Completed
- ✅ View order history
- ✅ Automatic total calculation

### Kitchen Display
- ✅ Kanban-style board for order status
- ✅ Separate columns for Pending, Preparing, and Ready orders
- ✅ Quick status updates
- ✅ **Real-time notifications** with WebSocket
- ✅ **Instant order updates** across all devices
- ✅ **Audio alerts** for new orders
- ✅ **Visual toast notifications**
- ✅ **Browser notifications** support
- ✅ **Connection status** indicator
- ✅ **Multi-device synchronization**

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or extract the project**
   ```bash
   cd fast-food-manager
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```
   This will install dependencies for both backend and frontend.

3. **Set up environment variables**
   ```bash
   # Copy the example env file in backend
   cp backend/.env.example backend/.env
   ```

4. **Start the application**
   ```bash
   npm start
   ```
   This will start both the backend server (port 3000) and frontend dev server (port 5173).

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api

The database will be automatically created and seeded with sample data on first run.

## 📁 Project Structure

```
fast-food-manager/
├── backend/
│   ├── database/
│   │   ├── schema.sql          # Database schema
│   │   ├── seed.sql            # Sample data
│   │   └── init.js             # Database initialization
│   ├── routes/
│   │   ├── menu.js             # Menu API routes
│   │   └── orders.js           # Orders API routes
│   ├── server.js               # Express server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── utils/              # Utility functions
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── package.json                # Root package.json
└── README.md
```

## 🔌 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Menu Endpoints

#### Get all menu items
```
GET /api/menu
Query params:
  - category: Filter by category (optional)
  - available: Filter by availability (true/false, optional)
```

#### Get menu item by ID
```
GET /api/menu/:id
```

#### Get all categories
```
GET /api/menu/categories
```

#### Create menu item
```
POST /api/menu
Body: {
  "name": "Classic Burger",
  "description": "Juicy beef patty...",
  "price": 8.99,
  "category": "Burgers",
  "is_available": 1
}
```

#### Update menu item
```
PUT /api/menu/:id
Body: {
  "name": "Updated name",
  "price": 9.99,
  ...
}
```

#### Delete menu item
```
DELETE /api/menu/:id
```

### Order Endpoints

#### Get all orders
```
GET /api/orders
Query params:
  - status: Filter by status (optional)
  - limit: Limit results (optional)
```

#### Get order by ID
```
GET /api/orders/:id
```

#### Create order
```
POST /api/orders
Body: {
  "customer_name": "John Doe",
  "notes": "No onions",
  "items": [
    {
      "menu_item_id": 1,
      "quantity": 2
    }
  ]
}
```

#### Update order status
```
PUT /api/orders/:id
Body: {
  "status": "preparing"
}
Valid statuses: pending, preparing, ready, completed, cancelled
```

#### Delete order
```
DELETE /api/orders/:id
```

### Health Check
```
GET /api/health
```

## 💻 Usage Guide

### Managing Menu Items

1. Navigate to **Menu** tab
2. Click **+ Add Menu Item**
3. Fill in the item details:
   - Name (required)
   - Description (optional)
   - Price (required)
   - Category (required)
   - Availability status
4. Click **Add Item**

To edit or delete items, use the buttons on each menu card.

### Creating Orders

1. Navigate to **Orders** tab
2. Click **+ New Order**
3. Click menu items from the left panel to add them
4. Adjust quantities as needed
5. Optionally add customer name and notes
6. Click **Create Order**

### Kitchen Workflow

1. Navigate to **Kitchen** tab
2. View orders organized by status:
   - **Pending**: New orders awaiting preparation
   - **Preparing**: Orders currently being prepared
   - **Ready**: Orders ready for pickup

3. **Real-Time Features**:
   - 🔔 Automatic audio alert when new order arrives
   - 📢 Toast notification with order details
   - 🔊 Sound toggle button (mute/unmute)
   - ✅ Connection status indicator
   - 📊 Active order count badge

4. Update order status by clicking the action buttons:
   - Pending → **Start Preparing**
   - Preparing → **Mark as Ready**
   - Ready → **Complete Order**

5. Click any order card to view full details

6. **Multi-Device Setup**:
   - Open `/kitchen` on dedicated tablet/display
   - All updates sync automatically
   - No manual refresh needed

## 🗄️ Database

The application uses SQLite for data storage:

- **Location**: `backend/database/restaurant.db`
- **Schema**: Auto-created on first run
- **Seed Data**: Sample menu items automatically loaded

### Tables

- `menu_items`: Menu item details
- `orders`: Order information
- `order_items`: Order line items (junction table)

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Build Frontend for Production
```bash
cd frontend
npm run build
```

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
PORT=3000
DATABASE_PATH=./database/restaurant.db
FRONTEND_URL=http://localhost:5173
```

### Frontend Proxy

The frontend is configured to proxy API requests to the backend in `frontend/vite.config.js`.

## 📱 Mobile Responsive

The application is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones

## 🔔 Real-Time Notifications (WebSocket)

The application features a comprehensive real-time notification system using **Socket.io** for instant order updates across all connected devices.

### Features

#### For Kitchen Staff
- **Instant Notifications**: Receive immediate alerts when new orders are created
- **Audio Alerts**: Customizable sound notification (kitchen bell)
- **Visual Alerts**: Toast notifications with order details
- **Browser Notifications**: Desktop notifications when tab is not focused
- **Connection Status**: Real-time connection indicator
- **Sound Control**: Mute/unmute audio notifications

#### Multi-Device Support
- **Kitchen Displays**: Connect multiple kitchen screens simultaneously
- **Order Stations**: All order stations receive real-time status updates
- **Auto-Sync**: Changes made on any device instantly sync to all others

### Setting Up Kitchen Display on Separate Device

1. **Start the Application**
   ```bash
   npm start
   ```

2. **Find Your Computer's IP Address**
   - macOS/Linux: Run `ifconfig` or `ip addr`
   - Windows: Run `ipconfig`
   - Look for your local IP (e.g., 192.168.1.100)

3. **Update Frontend Environment Variable**
   Edit `frontend/.env`:
   ```env
   VITE_SOCKET_URL=http://YOUR_IP_ADDRESS:3000
   ```

4. **Open Kitchen Display on Separate Device**
   - On the kitchen device, open browser and navigate to:
   - `http://YOUR_IP_ADDRESS:5173/kitchen`
   - Example: `http://192.168.1.100:5173/kitchen`

5. **Enable Browser Notifications**
   - When prompted, click "Allow" for notifications
   - This enables desktop notifications when tab is not focused

### WebSocket Configuration

#### Backend
The WebSocket server runs on the same port as the HTTP server (default: 3000).

Configuration in `backend/.env`:
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
```

#### Frontend
Configuration in `frontend/.env`:
```env
VITE_SOCKET_URL=http://localhost:3000
```

### WebSocket Rooms
The system uses three rooms for organized communication:
- **kitchen**: Kitchen display devices
- **orders**: Order station devices
- **manager**: Manager dashboard (future use)

### Adding Custom Notification Sound

1. Place your sound file in `frontend/public/sounds/`
2. Rename it to `kitchen-bell.mp3` (or update the path in Kitchen.jsx)
3. Recommended format: MP3 or WAV
4. Recommended duration: 1-3 seconds

Free sound resources:
- [Freesound.org](https://freesound.org)
- [Mixkit.co](https://mixkit.co/free-sound-effects/notification/)
- [Pixabay](https://pixabay.com/sound-effects/search/bell/)

### Browser Compatibility

Real-time notifications require:
- **WebSocket support**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Audio**: HTML5 Audio API
- **Browser Notifications**: Chrome, Firefox, Safari, Edge

For best experience, use:
- Google Chrome 90+
- Firefox 88+
- Safari 14+
- Microsoft Edge 90+

## 🎨 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Socket.io Client** - Real-time WebSocket communication

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.io** - WebSocket server
- **better-sqlite3** - SQLite database
- **CORS** - Cross-origin support

## 🐛 Troubleshooting

### Database Issues

If you encounter database errors:

1. Delete the database file:
   ```bash
   rm backend/database/restaurant.db
   ```

2. Restart the server (database will be recreated)

### Port Conflicts

If ports 3000 or 5173 are in use:

1. Backend: Change `PORT` in `backend/.env`
2. Frontend: Change `port` in `frontend/vite.config.js`

### CORS Errors

Ensure `FRONTEND_URL` in `backend/.env` matches your frontend URL.

### WebSocket Connection Issues

If real-time notifications aren't working:

1. **Check Connection Status**
   - Look for the connection indicator (green = connected, red = disconnected)
   - Check browser console for connection errors

2. **Verify Backend is Running**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return WebSocket connection stats

3. **Check Frontend Environment**
   - Ensure `frontend/.env` has correct `VITE_SOCKET_URL`
   - For multi-device setup, use your computer's IP address

4. **Firewall Issues**
   - Ensure port 3000 is open for incoming connections
   - Check firewall settings if connecting from another device

5. **Browser Console**
   - Open DevTools → Console
   - Look for WebSocket connection messages
   - Should see: "✅ WebSocket connected"

### Audio Notifications Not Playing

1. **Check Sound File**
   - Ensure `/frontend/public/sounds/kitchen-bell.mp3` exists
   - Try playing the file directly in browser

2. **Check Mute Status**
   - Look for speaker icon in Kitchen page header
   - 🔊 = unmuted, 🔇 = muted

3. **Browser Autoplay Policy**
   - Some browsers block autoplay
   - Interact with the page first (click anywhere)
   - Check browser console for autoplay errors

### Browser Notifications Not Showing

1. **Check Permissions**
   - Browser Settings → Notifications
   - Ensure notifications are allowed for your site

2. **Desktop Requirements**
   - Notifications only show when tab is not focused
   - Check OS notification settings

3. **HTTPS Requirement**
   - Some browsers require HTTPS for notifications in production

## 📄 License

MIT

## 👨‍💻 Author

Built with ❤️ for fast food restaurant management
