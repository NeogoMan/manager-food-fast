# Fast Food Manager - Android Client App

Modern Android application for the Fast Food Management System built with Jetpack Compose and Clean Architecture.

## 🏗️ Architecture

### Clean Architecture Layers
```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│   (Compose UI + ViewModels)         │
├─────────────────────────────────────┤
│          Domain Layer               │
│   (Use Cases + Domain Models)       │
├─────────────────────────────────────┤
│           Data Layer                │
│  (Repositories + Room + Firebase)   │
└─────────────────────────────────────┘
```

### Tech Stack
- **UI**: Jetpack Compose + Material Design 3
- **Architecture**: MVVM + Clean Architecture
- **DI**: Hilt
- **Local DB**: Room
- **Remote DB**: Firebase Firestore
- **Auth**: Firebase Authentication (Custom Tokens)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Networking**: Retrofit + OkHttp
- **Async**: Kotlin Coroutines + Flow
- **Navigation**: Navigation Compose
- **Image Loading**: Coil
- **Preferences**: DataStore

## 📱 Features

### Client Features (MVP)
- ✅ Browse menu items by category
- ✅ Search menu items
- ✅ Add items to cart with quantity and notes
- ✅ View and manage shopping cart
- ✅ Place orders (approval workflow)
- ✅ Real-time order status tracking
- ✅ Order history
- ✅ User profile management
- ✅ Dark/Light theme toggle
- ✅ Offline support (Room caching)
- ✅ Push notifications for order updates
- ✅ French localization
- ✅ MAD currency formatting

### User Flow
```
Login → Browse Menu → Add to Cart → Review Cart → Place Order
                                                        ↓
  ← View Order History ← Track Order Status ← Order Placed
```

## 🚀 Getting Started

### Prerequisites
- **Android Studio**: Koala (2024.1.1) or later
- **JDK**: Version 11 or later
- **Android SDK**: API 27+ (Target: API 36)
- **Firebase Project**: Access to `fast-food-manager-b1f54`

### Firebase Setup

1. **Download Configuration File**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: `fast-food-manager-b1f54`
   - Add Android app (if not exists):
     - Package name: `com.fast.manger.food`
     - App nickname: `Fast Food Manager Android`
     - Debug SHA-1 (optional for testing)
   - Download `google-services.json`
   - Place it in: `android/app/google-services.json`

2. **Get Debug SHA-1 (for testing)**
   ```bash
   cd android
   ./gradlew signingReport
   ```

3. **Firebase Services Required**
   - ✅ Authentication (Enable Custom Authentication)
   - ✅ Firestore Database
   - ✅ Cloud Functions
   - ✅ Cloud Messaging (FCM)
   - ✅ Analytics (optional)

### Installation

1. **Clone the repository**
   ```bash
   cd "Fasr food project"
   cd android
   ```

2. **Add Firebase configuration**
   ```bash
   # Place google-services.json in app/ directory
   cp /path/to/downloaded/google-services.json app/
   ```

3. **Sync Gradle**
   ```bash
   ./gradlew build
   ```

4. **Run on device/emulator**
   ```bash
   ./gradlew installDebug
   ```

   Or use Android Studio:
   - Open project in Android Studio
   - Click "Run" ▶️ button
   - Select device/emulator

## 🔧 Configuration

### Build Variants
- **Debug**: Development build with logging enabled
- **Release**: Production build with ProGuard enabled

### API Endpoints
- **Firestore Collections**:
  - `menu` - Menu items
  - `orders` - Customer orders
  - `users` - User accounts
  - `notifications` - Push notifications

- **Cloud Functions**:
  - `authenticateUser` - Custom token authentication

### Environment Variables
Configure in `local.properties`:
```properties
# Firebase
firebase.emulator.enabled=false
firebase.emulator.host=localhost

# API
api.timeout=30000
```

## 📁 Project Structure

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/mmg/moteur/fastfoodmanager/
│   │   │   │   ├── data/              # Data layer
│   │   │   │   │   ├── local/         # Room database
│   │   │   │   │   │   ├── dao/       # Data Access Objects
│   │   │   │   │   │   └── entity/    # Room entities
│   │   │   │   │   ├── remote/        # Firebase services
│   │   │   │   │   │   ├── api/       # API services
│   │   │   │   │   │   └── dto/       # Data Transfer Objects
│   │   │   │   │   └── repository/    # Repository implementations
│   │   │   │   ├── domain/            # Domain layer
│   │   │   │   │   ├── model/         # Domain models ✅
│   │   │   │   │   ├── repository/    # Repository interfaces
│   │   │   │   │   └── usecase/       # Business logic
│   │   │   │   ├── presentation/      # Presentation layer
│   │   │   │   │   ├── auth/          # Authentication screens
│   │   │   │   │   ├── menu/          # Menu browsing
│   │   │   │   │   ├── cart/          # Shopping cart
│   │   │   │   │   ├── orders/        # Order tracking
│   │   │   │   │   ├── profile/       # User profile
│   │   │   │   │   ├── components/    # Reusable UI
│   │   │   │   │   ├── navigation/    # Navigation setup
│   │   │   │   │   └── theme/         # Material3 theme
│   │   │   │   ├── di/                # Hilt modules
│   │   │   │   └── utils/             # Utilities
│   │   │   ├── res/                   # Resources
│   │   │   └── AndroidManifest.xml
│   │   └── test/                      # Unit tests
│   ├── build.gradle.kts               # App build config ✅
│   └── google-services.json           # Firebase config (⚠️ required)
├── gradle/
│   └── libs.versions.toml             # Version catalog ✅
├── build.gradle.kts                   # Root build config ✅
├── settings.gradle.kts
├── README.md                          # This file
└── IMPLEMENTATION_STATUS.md           # Development status ✅
```

## 🧪 Testing

### Run Unit Tests
```bash
./gradlew test
```

### Run Instrumentation Tests
```bash
./gradlew connectedAndroidTest
```

### Test Coverage
```bash
./gradlew jacocoTestReport
```

## 🎨 Design System

### Material Design 3
- **Primary Color**: Red (#ef4444)
- **Secondary Color**: Orange (#f97316)
- **Tertiary Color**: Green (#10b981)

### Typography
- **Display**: Large headlines
- **Headline**: Section titles
- **Body**: Content text
- **Label**: UI labels and buttons

### Components
- Cards with rounded corners
- Floating Action Buttons (FAB)
- Bottom Navigation Bar
- Material3 dialogs and sheets

## 🌐 Localization

### Supported Languages
- **French (fr)**: Primary language
- **English (en)**: Fallback

### Currency
- **MAD (Moroccan Dirham)**: Primary currency
- Format: `123.45 MAD`

## 📦 Dependencies

### Core
- Kotlin 2.0.21
- Compose BOM 2024.09.00
- Material3
- Lifecycle 2.9.4

### Firebase
- Firebase BOM 33.7.0
- Firebase Auth
- Firebase Firestore
- Firebase Messaging
- Firebase Analytics

### Architecture
- Hilt 2.54
- Room 2.6.1
- Navigation Compose 2.8.5

### Networking
- Retrofit 2.11.0
- OkHttp 4.12.0

### Utilities
- Coil 2.7.0 (Image loading)
- Kotlin Coroutines 1.8.1
- DataStore 1.1.1

See `gradle/libs.versions.toml` for complete list.

## 📝 Development Status

**Current Status**: Foundation Complete (15%)

### Completed ✅
- Project structure
- Gradle configuration
- Domain models
- Dependency setup

### In Progress ⏳
- Data layer (Room + Firebase)
- Repository implementations

### Pending 📋
- Use cases
- ViewModels
- UI screens
- Navigation
- Testing

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for detailed progress.

## 🤝 Contributing

### Code Style
- Follow [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Use meaningful variable/function names
- Add KDoc comments for public APIs
- Keep functions small and focused

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/menu-screen

# Make changes and commit
git add .
git commit -m "feat: add menu browsing screen"

# Push and create PR
git push origin feature/menu-screen
```

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructure
- `test:` Tests
- `chore:` Build/config

## 🐛 Troubleshooting

### Build Issues

**Problem**: `google-services.json not found`
```bash
# Solution: Download from Firebase Console and place in app/
cp /path/to/google-services.json app/
```

**Problem**: Gradle sync failed
```bash
# Solution: Clean and rebuild
./gradlew clean build --refresh-dependencies
```

**Problem**: Hilt compilation error
```bash
# Solution: Invalidate caches in Android Studio
File → Invalidate Caches / Restart
```

### Runtime Issues

**Problem**: Firebase authentication fails
- Check if `google-services.json` is correct
- Verify SHA-1 fingerprint in Firebase Console
- Ensure Authentication is enabled in Firebase

**Problem**: Firestore permission denied
- Check Firestore security rules
- Verify user is authenticated
- Check user role permissions

## 📞 Support

### Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [Jetpack Compose Docs](https://developer.android.com/jetpack/compose)
- [Material Design 3](https://m3.material.io/)
- [Clean Architecture Guide](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Contact
- **Project**: Fast Food Manager
- **Repository**: Local development
- **Firebase Project**: `fast-food-manager-b1f54`

## 📄 License

This project is proprietary software developed for internal use.

---

**Built with ❤️ using Jetpack Compose and Clean Architecture**
