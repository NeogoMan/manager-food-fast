package com.fast.manger.food.presentation.navigation

/**
 * Sealed class representing all navigation destinations in the app
 */
sealed class Screen(val route: String) {
    /**
     * Login screen - Authentication
     */
    data object Login : Screen("login")

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
