package com.fast.manger.food.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.fast.manger.food.presentation.auth.LoginScreen
import com.fast.manger.food.presentation.auth.SignUpScreen
import com.fast.manger.food.presentation.cart.CartScreen
import com.fast.manger.food.presentation.menu.MenuScreen
import com.fast.manger.food.presentation.orders.OrdersScreen
import com.fast.manger.food.presentation.profile.ProfileScreen
import com.fast.manger.food.presentation.restaurant.QRScannerScreen
import com.fast.manger.food.presentation.restaurant.RestaurantCodeScreen
import com.fast.manger.food.presentation.restaurant.RestaurantCodeViewModel
import com.fast.manger.food.presentation.restaurant.RestaurantSelectionScreen

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
        // Restaurant Code screen - Enter restaurant code
        composable(route = Screen.RestaurantCode.route) {
            RestaurantCodeScreen(
                onCodeValidated = {
                    navController.navigate(Screen.SignUp.route)
                },
                onScanQRCode = {
                    navController.navigate(Screen.QRScanner.route)
                },
                onLoginClick = {
                    navController.navigate(Screen.Login.route)
                }
            )
        }

        // QR Scanner screen - Scan restaurant QR code
        composable(route = Screen.QRScanner.route) {
            // Share ViewModel with RestaurantCodeScreen
            val parentEntry = navController.getBackStackEntry(Screen.RestaurantCode.route)
            val viewModel: RestaurantCodeViewModel = hiltViewModel(parentEntry)

            QRScannerScreen(
                onQRCodeDetected = { code ->
                    // Pass code to shared ViewModel and navigate back
                    viewModel.onQRCodeDetected(code)
                    navController.popBackStack()
                },
                onManualEntry = {
                    navController.popBackStack()
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        // Login screen - Authentication entry point for existing users
        composable(route = Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    // After login, navigate to restaurant selection or menu
                    // MainViewModel will determine the correct start destination
                    navController.navigate(Screen.Menu.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onSignUpClick = {
                    // Navigate to restaurant code screen to start signup flow
                    navController.navigate(Screen.RestaurantCode.route)
                }
            )
        }

        // Restaurant Selection screen - For users with multiple restaurants
        composable(route = Screen.RestaurantSelection.route) {
            RestaurantSelectionScreen(
                onRestaurantSelected = {
                    navController.navigate(Screen.Menu.route) {
                        popUpTo(Screen.RestaurantSelection.route) { inclusive = true }
                    }
                }
            )
        }

        // Sign Up screen - New user registration
        composable(route = Screen.SignUp.route) {
            SignUpScreen(
                onSignUpSuccess = {
                    navController.navigate(Screen.Menu.route) {
                        popUpTo(Screen.SignUp.route) { inclusive = true }
                    }
                },
                onNavigateBack = {
                    navController.popBackStack()
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
                },
                onNavigateToSignUp = {
                    navController.navigate(Screen.SignUp.route)
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
