package com.fast.manger.food

import android.app.Application
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
    }
}
