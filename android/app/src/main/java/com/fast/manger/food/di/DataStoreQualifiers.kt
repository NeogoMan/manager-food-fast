package com.fast.manger.food.di

import javax.inject.Qualifier

/**
 * Qualifier for Restaurant DataStore (fast_food_preferences)
 * Used by data.local.PreferencesManager for restaurant code and details
 */
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class RestaurantDataStore

/**
 * Qualifier for App DataStore (app_preferences)
 * Used by util.PreferencesManager for notification permissions
 */
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class AppDataStore
