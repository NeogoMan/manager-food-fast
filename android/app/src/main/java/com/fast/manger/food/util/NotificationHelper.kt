package com.fast.manger.food.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.fast.manger.food.MainActivity
import com.fast.manger.food.R
import com.fast.manger.food.domain.model.OrderStatus

/**
 * Notification Helper
 * Manages notification channels and displays order status notifications
 */
object NotificationHelper {

    private const val CHANNEL_ID_ORDER_UPDATES = "order_status_updates"
    private const val CHANNEL_ID_ORDER_GENERAL = "order_general"

    const val NOTIFICATION_ID_ORDER_UPDATE = 1001

    /**
     * Create notification channels (Android 8.0+)
     */
    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // High priority channel for status updates
            val statusChannel = NotificationChannel(
                CHANNEL_ID_ORDER_UPDATES,
                "Order Status Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for order status changes"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }

            // Default priority for general notifications
            val generalChannel = NotificationChannel(
                CHANNEL_ID_ORDER_GENERAL,
                "Order Confirmations",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "General order notifications"
                enableLights(true)
                setShowBadge(true)
            }

            notificationManager.createNotificationChannel(statusChannel)
            notificationManager.createNotificationChannel(generalChannel)
        }
    }

    /**
     * Show order status notification
     */
    fun showOrderStatusNotification(
        context: Context,
        orderId: String,
        orderNumber: String,
        status: OrderStatus,
        rejectionReason: String? = null
    ) {
        val (title, message) = getNotificationContent(orderNumber, status, rejectionReason)

        // Intent to open order details when notification is tapped
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("orderId", orderId)
            putExtra("openOrderDetails", true)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            orderId.hashCode(),
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Select channel based on status importance
        val channelId = when (status) {
            OrderStatus.READY, OrderStatus.REJECTED -> CHANNEL_ID_ORDER_UPDATES
            else -> CHANNEL_ID_ORDER_GENERAL
        }

        // Build notification
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification) // Custom notification icon
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .apply {
                // Add sound for important notifications
                if (status == OrderStatus.READY || status == OrderStatus.REJECTED) {
                    setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                    setVibrate(longArrayOf(0, 250, 250, 250))
                }

                // Add color for status (shows in notification icon background)
                color = android.graphics.Color.parseColor(status.getStatusColor())
            }
            .build()

        // Show notification
        try {
            NotificationManagerCompat.from(context).notify(
                orderId.hashCode(), // Unique ID per order
                notification
            )
        } catch (e: SecurityException) {
            // Permission not granted - handle silently
            android.util.Log.w("NotificationHelper", "Notification permission not granted")
        }
    }

    /**
     * Get notification content based on order status
     */
    private fun getNotificationContent(
        orderNumber: String,
        status: OrderStatus,
        rejectionReason: String?
    ): Pair<String, String> {
        return when (status) {
            OrderStatus.AWAITING_APPROVAL -> {
                "Commande reçue" to
                "Votre commande $orderNumber a été reçue et attend l'approbation."
            }
            OrderStatus.PENDING -> {
                "Commande approuvée" to
                "Votre commande $orderNumber a été approuvée et sera bientôt préparée."
            }
            OrderStatus.PREPARING -> {
                "Préparation en cours" to
                "Votre commande $orderNumber est en cours de préparation."
            }
            OrderStatus.READY -> {
                "Commande prête!" to
                "Votre commande $orderNumber est prête! Venez la récupérer."
            }
            OrderStatus.COMPLETED -> {
                "Merci!" to
                "Votre commande $orderNumber est terminée. Merci de votre visite!"
            }
            OrderStatus.REJECTED -> {
                "Commande refusée" to
                "Désolé, votre commande $orderNumber a été refusée. ${rejectionReason ?: ""}"
            }
        }
    }

    /**
     * Cancel notification for an order
     */
    fun cancelNotification(context: Context, orderId: String) {
        NotificationManagerCompat.from(context).cancel(orderId.hashCode())
    }

    /**
     * Cancel all notifications
     */
    fun cancelAllNotifications(context: Context) {
        NotificationManagerCompat.from(context).cancelAll()
    }

    /**
     * Check if notification permission is granted (Android 13+)
     */
    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED
        } else {
            // Before Android 13, notifications are enabled by default
            true
        }
    }
}
