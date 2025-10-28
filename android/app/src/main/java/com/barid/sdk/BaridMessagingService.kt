package com.barid.sdk

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Firebase Messaging Service for handling push notifications
 * Add this service to your AndroidManifest.xml
 */
class BaridMessagingService : FirebaseMessagingService() {

    companion object {
        private const val CHANNEL_ID = "barid_notifications"
        private const val CHANNEL_NAME = "Barid Notifications"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Update token in Barid SDK
        BaridSDK.getInstance().updateToken(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        // Create notification channel (for Android O+)
        createNotificationChannel()

        // Get notification data
        val title = message.notification?.title ?: "New Message"
        val body = message.notification?.body ?: ""
        val campaignId = message.data["campaignId"] ?: ""
        val deepLink = message.data["deepLink"]

        // Create intent for notification tap
        val intent = Intent(this, getLauncherActivity()).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            deepLink?.let { putExtra("deepLink", it) }
            putExtra("campaignId", campaignId)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Build notification
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(getNotificationIcon())
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        // Show notification
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)

        // Track delivery
        if (campaignId.isNotEmpty()) {
            // Track notification delivered event can be added here if needed
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Barid platform notifications"
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun getLauncherActivity(): Class<*> {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val componentName = intent?.component
        return Class.forName(componentName?.className ?: "")
    }

    private fun getNotificationIcon(): Int {
        // Override this in your app to provide custom notification icon
        // For now, return a default Android icon
        return android.R.drawable.ic_dialog_info
    }
}
