package com.fast.manger.food.presentation.navigation

/**
 * Sealed class representing all navigation destinations in the app
 */
sealed class Screen(val route: String) {
    /**
     * Restaurant Code screen - Enter restaurant code (first-time user)
     */
    data object RestaurantCode : Screen("restaurant_code")

    /**
     * QR Scanner screen - Scan restaurant QR code
     */
    data object QRScanner : Screen("qr_scanner")

    /**
     * Sign Up screen - Register new client account
     */
    data object SignUp : Screen("signup")

    /**
     * Login screen - Authentication
     */
    data object Login : Screen("login")

    /**
     * Restaurant Selection screen - Choose active restaurant (for users with multiple restaurants)
     */
    data object RestaurantSelection : Screen("restaurant_selection")

    /**
     * Menu screen - Browse menu items
     */
    data object Menu : Screen("menu")

    /**
     * Cart screen - View and manage cart
     */
    data object Cart : Screen("cart")

    /**
     * Orders screen - View order history
     */
    data object Orders : Screen("orders")

    /**
     * Profile screen - User profile and settings
     */
    data object Profile : Screen("profile")
}
