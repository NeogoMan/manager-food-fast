package com.fast.manger.food

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.barid.sdk.BaridSDK
import com.fast.manger.food.presentation.MainScreen
import com.fast.manger.food.ui.theme.FastFoodManagerTheme
import com.google.firebase.messaging.FirebaseMessaging
import dagger.hilt.android.AndroidEntryPoint

/**
 * Main Activity - Entry point of the application
 * Uses Jetpack Compose for UI
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Get FCM token for testing (log it to use in Barid dashboard)
        getFCMToken()

        // Extract notification data if launched from notification
        val orderId = intent?.getStringExtra("orderId")
        val openOrderDetails = intent?.getBooleanExtra("openOrderDetails", false) ?: false

        // Handle Barid campaign notifications
        val campaignId = intent?.getStringExtra("campaignId")
        if (campaignId != null) {
            Log.d(TAG, "Opened from Barid campaign: $campaignId")
            BaridSDK.getInstance().handleNotificationOpened(campaignId)
        }

        setContent {
            FastFoodManagerTheme {
                MainScreen(
                    initialOrderId = orderId,
                    openOrderDetails = openOrderDetails
                )
            }
        }
    }

    private fun getFCMToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                Log.d(TAG, "========================================")
                Log.d(TAG, "FCM Token for Barid Testing:")
                Log.d(TAG, token)
                Log.d(TAG, "========================================")
                Log.d(TAG, "Copy this token to use in Barid dashboard")
            } else {
                Log.w(TAG, "Failed to get FCM token", task.exception)
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