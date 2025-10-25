package com.fast.manger.food

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.fast.manger.food.presentation.MainScreen
import com.fast.manger.food.ui.theme.FastFoodManagerTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Main Activity - Entry point of the application
 * Uses Jetpack Compose for UI
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Extract notification data if launched from notification
        val orderId = intent?.getStringExtra("orderId")
        val openOrderDetails = intent?.getBooleanExtra("openOrderDetails", false) ?: false

        setContent {
            FastFoodManagerTheme {
                MainScreen(
                    initialOrderId = orderId,
                    openOrderDetails = openOrderDetails
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Handle notification tap when app is already running
        setIntent(intent)

        val orderId = intent.getStringExtra("orderId")
        val openOrderDetails = intent.getBooleanExtra("openOrderDetails", false)

        // Navigate to orders screen - handled in MainScreen via deep link
    }
}