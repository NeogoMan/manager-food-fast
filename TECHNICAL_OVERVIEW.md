# Technical Overview - Fast Food Restaurant Management System

## Table of Contents
- [Introduction](#introduction)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Multi-Tenant Model](#multi-tenant-model)
- [Project Structure](#project-structure)
- [Key Features](#key-features)

## Introduction

This is a comprehensive **Multi-Tenant SaaS Fast Food Restaurant Management System** that enables:
- Restaurant owners to manage their business operations
- Staff to process orders and manage the kitchen
- Customers to browse menus and place orders via mobile app
- Guests to order without authentication using QR codes

The system supports multiple restaurants (multi-tenancy) with complete data isolation, role-based access control, and real-time updates.

## Technology Stack

### Frontend (Web Application)
- **Framework**: React 18 with Hooks
- **Build Tool**: Vite 5.4
- **Routing**: React Router DOM v6
- **UI Library**: Material-UI (MUI) v7
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: React Context API
- **Real-time Updates**: Firebase Firestore listeners

### Backend
- **Platform**: Firebase (Google Cloud)
  - **Authentication**: Firebase Authentication with custom tokens
  - **Database**: Cloud Firestore (NoSQL)
  - **Functions**: Cloud Functions (Node.js, ES Modules)
  - **Storage**: Firebase Cloud Storage
  - **Messaging**: Firebase Cloud Messaging (FCM)
  - **Hosting**: Firebase Hosting

### Mobile (Android)
- **Language**: Kotlin
- **UI**: Jetpack Compose
- **Architecture**: MVVM with Clean Architecture
- **Camera**: CameraX for QR scanning
- **ML**: ML Kit for barcode detection

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint
- **Environment**: Node.js 18+

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                       │
│  ┌──────────────┬──────────────┬──────────────────────────┐│
│  │ Web App      │ Android App  │  QR Code (Guest Access)  ││
│  │ (React)      │ (Kotlin)     │  (No App Required)       ││
│  └──────────────┴──────────────┴──────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE SERVICES                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authentication (Custom Tokens + Phone Auth)         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cloud Functions (Backend Logic)                     │  │
│  │  - User Auth & Management                            │  │
│  │  - Restaurant CRUD                                    │  │
│  │  - Order Processing                                   │  │
│  │  - Push Notifications                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cloud Firestore (NoSQL Database)                    │  │
│  │  - Multi-tenant data isolation                        │  │
│  │  - Real-time synchronization                          │  │
│  │  - Security rules enforcement                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Order Creation Flow:**
```
Guest/Client → Frontend → Cloud Function → Firestore
                                  ↓
                          Kitchen Display (Real-time Listener)
                                  ↓
                          Staff Updates Status
                                  ↓
                          Client Notification (FCM)
```

**Authentication Flow:**
```
User Login → Cloud Function (Verify Credentials)
                    ↓
            Create Custom Token with Claims
                    ↓
            Frontend Signs In with Token
                    ↓
            Access Protected Routes/Data
```

## Multi-Tenant Model

### Tenancy Architecture
- **Model**: Shared Database, Logical Isolation
- **Tenant Identifier**: `restaurantId` field in all documents
- **Isolation**: Enforced by Firestore security rules
- **Super Admin**: Can access all tenants
- **Restaurant Users**: Can only access their tenant data

### Restaurant (Tenant) Structure
Each restaurant is a separate tenant with:
- Unique short code (e.g., "BURGER01")
- Own set of users (managers, cashiers, cooks)
- Own menu items
- Own orders and customers
- Own settings and branding
- Subscription plan (Basic, Pro, Enterprise)

### Data Isolation
```javascript
// Firestore Security Rule Example
match /orders/{orderId} {
  allow read: if request.auth.token.restaurantIds.hasAny([
    resource.data.restaurantId
  ]);
}
```

## Project Structure

```
/Users/elmehdimotaqi/Documents/Fasr food project/
│
├── frontend/                          # React web application
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   │   ├── ProtectedRoute.jsx   # Route guard
│   │   │   ├── ErrorBoundary.jsx    # Error handling
│   │   │   └── ...
│   │   │
│   │   ├── contexts/                # React Context providers
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   ├── CartContext.jsx      # Shopping cart state
│   │   │   ├── ThemeContext.jsx     # Dark/light mode
│   │   │   └── SettingsContext.jsx  # Restaurant settings
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── Login.jsx            # Restaurant user login
│   │   │   ├── PlatformAdminLogin.jsx  # Super admin login
│   │   │   ├── Orders.jsx           # Order management
│   │   │   ├── Kitchen.jsx          # Kitchen display
│   │   │   ├── Menu.jsx             # Menu management
│   │   │   ├── GuestOrder.jsx       # Guest self-service
│   │   │   ├── OrderTracking.jsx    # Order tracking
│   │   │   └── admin/               # Super admin pages
│   │   │       ├── Restaurants.jsx
│   │   │       └── CreateRestaurant.jsx
│   │   │
│   │   ├── services/                # API services
│   │   │   ├── firestore.js         # Firestore operations
│   │   │   ├── restaurantService.js # Restaurant APIs
│   │   │   └── printerService.js    # Printer integration
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── sessionManager.js    # Guest sessions
│   │   │   ├── orderNumberGenerator.js
│   │   │   └── currency.js
│   │   │
│   │   ├── config/                  # Configuration
│   │   │   └── firebase.js          # Firebase config
│   │   │
│   │   ├── App.jsx                  # Root component
│   │   └── main.jsx                 # Entry point
│   │
│   ├── public/                      # Static assets
│   ├── package.json                 # Dependencies
│   └── vite.config.js              # Vite configuration
│
├── functions/                       # Firebase Cloud Functions
│   ├── index.js                    # All backend functions
│   └── package.json
│
├── android/                         # Android mobile app
│   └── app/src/main/java/com/fast/manger/food/
│       ├── data/                   # Data layer
│       ├── domain/                 # Business logic
│       └── presentation/           # UI layer
│
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Database indexes
├── firebase.json                   # Firebase configuration
├── .firebaserc                     # Firebase project aliases
│
└── Documentation Files
    ├── README.md
    ├── TECHNICAL_OVERVIEW.md       # This file
    ├── DATABASE_SCHEMA.md
    ├── AUTHENTICATION_GUIDE.md
    ├── GUEST_SELF_SERVICE.md
    ├── API_REFERENCE.md
    ├── FRONTEND_GUIDE.md
    ├── DEPLOYMENT_GUIDE.md
    └── DEVELOPMENT_GUIDE.md
```

## Key Features

### 1. Multi-Tenant Restaurant Management
- Super admin can create and manage multiple restaurants
- Each restaurant has unique short code
- Complete data isolation between restaurants
- Subscription-based plans (Basic, Pro, Enterprise)
- Restaurant branding customization (logo, colors)

### 2. Role-Based Access Control (RBAC)

**User Roles:**
- **Super Admin**: Platform owner, manages all restaurants
- **Manager**: Restaurant administrator, full control
- **Cashier**: Create/manage orders, menu access
- **Cook**: Kitchen display access, update order status
- **Client**: Mobile app users, can browse and order
- **Guest**: Unauthenticated QR code users

**Permissions Matrix:**

| Feature | Super Admin | Manager | Cashier | Cook | Client | Guest |
|---------|------------|---------|---------|------|--------|-------|
| Manage Restaurants | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Users | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create Orders | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Edit Orders | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Kitchen Display | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage Menu | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Analytics | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Browse Menu | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Track Orders | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

### 3. Guest Self-Service System
- **QR Code Access**: No app installation required
- **Session-Based**: 60-minute localStorage sessions
- **Order Tracking**: Secret URL for order status
- **Approval Workflow**: Staff must approve guest orders
- **Table Assignment**: QR codes can be table-specific

**Guest Flow:**
```
1. Scan QR Code
2. Enter Name & Phone
3. Browse Menu
4. Add Items to Cart
5. Add Notes (optional)
6. Place Order → Awaiting Approval
7. Staff Approves → Kitchen Prepares
8. Track Order Status (Real-time)
9. Order Ready → Thank You Message
```

### 4. Kitchen Display System
- Real-time order updates via Firestore listeners
- Kanban-style board: Pending | Preparing | Ready
- Drag-and-drop to update status
- Audio notifications for new orders
- Full-screen mode for kitchen tablets
- Filter by status, time, type

### 5. Order Management
- Create orders (staff-created or customer-placed)
- Edit orders (staff only, with audit trail)
- Multiple order statuses: awaiting_approval, pending, preparing, ready, completed, cancelled, rejected
- Payment tracking (cash, card, mobile)
- Order history with filters
- Print receipts

### 6. Menu Management
- CRUD operations on menu items
- Categories: Burgers, Sides, Drinks, Desserts, etc.
- Item availability toggle
- Pricing management
- Image upload support
- Multi-restaurant menu isolation

### 7. Real-Time Synchronization
- Firestore listeners for instant updates
- Order status changes propagate to all connected clients
- Kitchen display updates automatically
- Customer order tracking updates in real-time
- No page refresh required

### 8. Push Notifications
- Firebase Cloud Messaging (FCM)
- Notify clients when order status changes
- Notify kitchen when new orders arrive
- In-app notification center
- Badge counts for unread notifications

### 9. Analytics Dashboard
- Total revenue
- Orders per day/week/month
- Popular menu items
- Order status distribution
- Payment method breakdown
- Revenue trends (charts)

### 10. Mobile App Support
- Native Android app (Kotlin)
- Same backend (Firebase)
- QR code scanner for guest mode
- Push notifications
- Order history
- Real-time order tracking

## Security Features

### Authentication
- Custom token-based authentication
- Bcrypt password hashing
- Secure password reset flow
- Session management with expiration
- Rate limiting on login attempts

### Authorization
- Firestore security rules enforce RBAC
- Custom claims in JWT tokens
- Multi-tenant data isolation
- Protected API endpoints
- Audit logging for super admin actions

### Data Protection
- HTTPS only
- Firestore rules prevent unauthorized access
- Guest orders require approval
- Tracking secrets for order tracking
- Input validation and sanitization

## Performance Optimizations

### Frontend
- Code splitting with React.lazy
- Image lazy loading
- Debounced search inputs
- Optimistic UI updates
- Service worker for offline capability

### Backend
- Firestore composite indexes
- Batch writes for bulk operations
- Efficient query patterns
- Caching for restaurant data
- Connection pooling

### Database
- Denormalized data for read performance
- Indexed fields for common queries
- Pagination for large lists
- Real-time listeners with cleanup

## Scalability

### Horizontal Scaling
- Stateless Cloud Functions auto-scale
- Firebase handles database scaling
- CDN for static assets (Firebase Hosting)

### Multi-Tenancy
- Shared infrastructure reduces costs
- Logical isolation via security rules
- Per-tenant usage tracking
- Subscription-based monetization

## Next Steps

For detailed information, refer to:
- **[Database Schema](./DATABASE_SCHEMA.md)** - Firestore collections and structure
- **[Authentication Guide](./AUTHENTICATION_GUIDE.md)** - Login flows and RBAC
- **[Guest Self-Service](./GUEST_SELF_SERVICE.md)** - QR code ordering system
- **[API Reference](./API_REFERENCE.md)** - Cloud Functions documentation
- **[Frontend Guide](./FRONTEND_GUIDE.md)** - React components and architecture
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Getting started for developers
