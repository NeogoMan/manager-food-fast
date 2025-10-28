package com.fast.manger.food

import android.app.Application
import android.provider.Settings
import com.barid.sdk.BaridSDK
import com.fast.manger.food.util.NotificationHelper
import dagger.hilt.android.HiltAndroidApp

/**
 * Fast Food Application Class
 * Annotated with @HiltAndroidApp to enable Hilt dependency injection
 */
@HiltAndroidApp
class FastFoodApp : Application() {

    override fun onCreate() {
        super.onCreate()
        // Application initialization
        // Firebase is initialized automatically via google-services.json

        // Initialize notification channels for order status updates
        NotificationHelper.createNotificationChannels(this)

        // Initialize Barid SDK for marketing campaigns
        initializeBaridSDK()
    }

    private fun initializeBaridSDK() {
        // Use device ID as user ID for testing
        // In production, replace with actual restaurant manager ID from authentication
        val userId = "manager_${Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ANDROID_ID
        )}"

        BaridSDK.getInstance().initialize(this, userId)

        // Set user attributes for campaign targeting
        BaridSDK.getInstance().setAttributes(mapOf(
            "platform" to "android",
            "appType" to "restaurant_manager",
            "appVersion" to BuildConfig.VERSION_NAME
        ))
    }
}
