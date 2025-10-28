package com.fast.manger.food.presentation.notifications

import com.fast.manger.food.data.remote.api.FirebaseAuthService
import com.fast.manger.food.data.remote.api.FirestoreUserService
import com.fast.manger.food.domain.model.OrderStatus
import com.fast.manger.food.util.NotificationHelper
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Firebase Cloud Messaging Service
 * Handles FCM token registration and incoming push notifications
 */
@AndroidEntryPoint
class FCMService : FirebaseMessagingService() {

    @Inject
    lateinit var authService: FirebaseAuthService

    @Inject
    lateinit var userService: FirestoreUserService

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /**
     * Called when a new FCM token is generated
     * This happens on app install, reinstall, or token refresh
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)

        // Update token in Firestore
        serviceScope.launch {
            try {
                val currentUserId = authService.getCurrentUserId()
                if (currentUserId != null) {
                    userService.updateFcmToken(currentUserId, token)
                }
            } catch (e: Exception) {
                // Failed to update token
            }
        }
    }

    /**
     * Called when a push notification message is received
     * Handle both foreground and background notifications here
     *
     * IMPORTANT: This method is called whether the app is:
     * - In foreground (app is open and visible)
     * - In background (app is running but not visible)
     * - Terminated (app is completely closed)
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // Check if message contains data payload
        // Data messages are always delivered to onMessageReceived
        if (remoteMessage.data.isNotEmpty()) {
            handleDataMessage(remoteMessage.data)
        }

        // Check if message contains notification payload
        // When app is in background/terminated, notification payload is handled by system
        // When app is in foreground, we need to manually show the notification
        remoteMessage.notification?.let {
            // If data is also present, we already handled it above
            // Otherwise, show a generic notification from the notification payload
            if (remoteMessage.data.isEmpty()) {
                // Show notification using the title and body from FCM
                // This handles the case when backend sends notification-only messages
                showGenericNotification(it.title ?: "Notification", it.body ?: "")
            }
        }
    }

    /**
     * Show a generic notification from FCM notification payload
     */
    private fun showGenericNotification(title: String, body: String) {
        NotificationHelper.showOrderStatusNotification(
            context = applicationContext,
            orderId = "unknown",
            orderNumber = title,
            status = OrderStatus.PENDING,
            rejectionReason = body
        )
    }

    /**
     * Handle data message and show custom notification
     */
    private fun handleDataMessage(data: Map<String, String>) {
        try {
            val type = data["type"]

            when (type) {
                "order_status_update" -> {
                    val orderId = data["orderId"]
                    val orderNumber = data["orderNumber"]
                    val statusStr = data["status"]
                    val rejectionReason = data["rejectionReason"]

                    if (orderId != null && orderNumber != null && statusStr != null) {
                        val status = OrderStatus.fromString(statusStr)

                        // Show notification
                        NotificationHelper.showOrderStatusNotification(
                            context = applicationContext,
                            orderId = orderId,
                            orderNumber = orderNumber,
                            status = status,
                            rejectionReason = rejectionReason
                        )
                    }
                }
                "order_confirmation" -> {
                    val orderId = data["orderId"]
                    val orderNumber = data["orderNumber"]

                    if (orderId != null && orderNumber != null) {
                        // Show order received notification
                        NotificationHelper.showOrderStatusNotification(
                            context = applicationContext,
                            orderId = orderId,
                            orderNumber = orderNumber,
                            status = OrderStatus.AWAITING_APPROVAL
                        )
                    }
                }
            }
        } catch (e: Exception) {
            // Error handling data message
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // Cancel coroutine scope when service is destroyed
        serviceScope.coroutineContext.cancel()
    }
}
