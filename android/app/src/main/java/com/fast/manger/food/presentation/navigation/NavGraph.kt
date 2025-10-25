package com.fast.manger.food.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.fast.manger.food.presentation.auth.LoginScreen
import com.fast.manger.food.presentation.cart.CartScreen
import com.fast.manger.food.presentation.menu.MenuScreen
import com.fast.manger.food.presentation.orders.OrdersScreen
import com.fast.manger.food.presentation.profile.ProfileScreen

/**
 * Main navigation graph for the app
 * Defines all navigation routes and destinations
 */
@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        // Login screen - Authentication entry point
        composable(route = Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Menu.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        // Menu screen - Browse and select food items
        composable(route = Screen.Menu.route) {
            MenuScreen(
                onCartClick = {
                    navController.navigate(Screen.Cart.route)
                }
            )
        }

        // Cart screen - Review and place order
        composable(route = Screen.Cart.route) {
            CartScreen(
                onNavigateBack = { navController.popBackStack() },
                onOrderPlaced = {
                    navController.navigate(Screen.Orders.route) {
                        popUpTo(Screen.Menu.route)
                    }
                }
            )
        }

        // Orders screen - View order history and status
        composable(route = Screen.Orders.route) {
            OrdersScreen()
        }

        // Profile screen - User settings and logout
        composable(route = Screen.Profile.route) {
            ProfileScreen(
                onLogoutSuccess = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
