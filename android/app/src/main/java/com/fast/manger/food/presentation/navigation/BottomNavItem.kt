package com.fast.manger.food.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.ui.graphics.vector.ImageVector

/**
 * Bottom navigation bar items
 */
data class BottomNavItem(
    val screen: Screen,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

/**
 * List of bottom navigation items
 */
val bottomNavItems = listOf(
    BottomNavItem(
        screen = Screen.Menu,
        title = "Menu",
        selectedIcon = Icons.Filled.Home,
        unselectedIcon = Icons.Outlined.Home
    ),
    BottomNavItem(
        screen = Screen.Orders,
        title = "Commandes",
        selectedIcon = Icons.Filled.ShoppingCart,
        unselectedIcon = Icons.Outlined.ShoppingCart
    ),
    BottomNavItem(
        screen = Screen.Profile,
        title = "Profil",
        selectedIcon = Icons.Filled.Person,
        unselectedIcon = Icons.Outlined.Person
    )
)
