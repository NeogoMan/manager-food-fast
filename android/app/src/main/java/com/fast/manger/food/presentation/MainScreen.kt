package com.fast.manger.food.presentation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.fast.manger.food.presentation.navigation.NavGraph
import com.fast.manger.food.presentation.navigation.Screen
import com.fast.manger.food.presentation.navigation.bottomNavItems

/**
 * Main screen with bottom navigation
 * Container for the entire authenticated app experience
 */
@Composable
fun MainScreen(
    startDestination: String = Screen.Login.route,
    cartItemCount: Int = 0,
    initialOrderId: String? = null,
    openOrderDetails: Boolean = false
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    // Handle notification deep link - navigate to Orders screen
    LaunchedEffect(initialOrderId, openOrderDetails) {
        if (openOrderDetails && initialOrderId != null) {
            // Wait for nav controller to be ready, then navigate to orders
            navController.navigate(Screen.Orders.route) {
                launchSingleTop = true
            }
        }
    }

    Scaffold(
        bottomBar = {
            // Show bottom bar only on main screens (not on login)
            if (currentDestination?.route != Screen.Login.route) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        val isSelected = currentDestination?.hierarchy?.any {
                            it.route == item.screen.route
                        } == true

                        NavigationBarItem(
                            selected = isSelected,
                            onClick = {
                                navController.navigate(item.screen.route) {
                                    // Pop up to the start destination to avoid building up a large stack
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    // Avoid multiple copies of the same destination
                                    launchSingleTop = true
                                    // Restore state when re-selecting a previously selected item
                                    restoreState = true
                                }
                            },
                            icon = {
                                // Show badge on Orders tab for cart items
                                if (item.screen == Screen.Orders && cartItemCount > 0) {
                                    BadgedBox(
                                        badge = {
                                            Badge {
                                                Text(text = cartItemCount.toString())
                                            }
                                        }
                                    ) {
                                        Icon(
                                            imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                                            contentDescription = item.title
                                        )
                                    }
                                } else {
                                    Icon(
                                        imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                                        contentDescription = item.title
                                    )
                                }
                            },
                            label = {
                                Text(text = item.title)
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavGraph(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding)
        )
    }
}
