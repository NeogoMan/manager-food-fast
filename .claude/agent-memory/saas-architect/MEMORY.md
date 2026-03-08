# SaaS Architect Memory - Fast Food Manager

## Tech Stack
- **Frontend**: React 18 + Vite 5, Tailwind CSS 3, MUI 7, React Router 6
- **Backend**: Firebase (Firestore, Cloud Functions v2, Auth, Storage, Hosting)
- **Cloud Functions**: Node 20, ESM modules, bcrypt for auth
- **Languages**: French-first UI (Moroccan market, MAD currency)
- **Realtime**: Firestore `onSnapshot` listeners (no WebSockets)

## Architecture
- **Multi-tenant**: restaurantId in JWT custom claims + Firestore security rules
- **Auth**: Custom token auth via Cloud Functions (username/password, not email)
- **Roles**: superAdmin, manager, cashier, cook, client (RBAC via ProtectedRoute)
- **PWA**: Manifest exists (fullscreen, landscape), NO service worker, NO offline cache
- **Kiosk mode**: Custom `useKioskMode` hook (fullscreen, keyboard blocking, context menu)

## Key Interfaces
- **Orders (Cashier)**: Create/manage orders, payment, printer integration (Staff Layout + Sidebar)
- **Kitchen**: Full-screen, drag-and-drop (dnd-kit with TouchSensor), audio notifications
- **Dashboard (Manager)**: Statistics, filters, revenue tracking
- **Guest Order**: Public self-service via QR/URL, MUI components, no auth required
- **Order Tracking**: Public order status tracking with secret URL
- **Admin**: Super admin restaurant management

## Printing
- Web USB API (ESC/POS thermal printers)
- Designed for "Android tablet" per code comments
- Auto-reconnect, connection monitoring
- Order tickets + kitchen tickets + logo printing
- Web USB NOT supported on iOS Safari

## Responsive/Touch Design
- touch-target class (44px min), touch-spacing utilities
- Tablet grid utilities exist, mobile breakpoints
- Kitchen has TouchSensor with 250ms delay for tablets
- Sidebar responsive (hamburger on mobile, fixed on desktop)

## Key File Paths
- App entry: `frontend/src/App.jsx`
- Auth context: `frontend/src/contexts/AuthContext.jsx`
- Firestore service: `frontend/src/services/firestore.js`
- Printer service: `frontend/src/services/printerService.js`
- Kitchen: `frontend/src/pages/Kitchen.jsx`
- Orders (cashier): `frontend/src/pages/Orders.jsx`
- Settings: `frontend/src/contexts/SettingsContext.jsx`
- Security rules: `firestore.rules`
- Cloud Functions: `functions/index.js`
