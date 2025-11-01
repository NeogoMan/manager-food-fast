package com.fast.manger.food.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.core.DataStoreFactory
import androidx.datastore.dataStoreFile
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStoreFile
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * App Module - Provides application-wide dependencies
 * - Application context
 * - DataStore for preferences
 * - Gson for JSON serialization
 */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    /**
     * Provides application context
     */
    @Provides
    @Singleton
    fun provideApplicationContext(@ApplicationContext context: Context): Context {
        return context
    }

    /**
     * Provides DataStore for restaurant preferences (restaurant code and details)
     * Used by data.local.PreferencesManager
     */
    @Provides
    @Singleton
    @RestaurantDataStore
    fun provideRestaurantDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return androidx.datastore.preferences.core.PreferenceDataStoreFactory.create(
            produceFile = { context.preferencesDataStoreFile("fast_food_preferences") }
        )
    }

    /**
     * Provides DataStore for app preferences (notification permissions)
     * Used by util.PreferencesManager
     */
    @Provides
    @Singleton
    @AppDataStore
    fun provideAppDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return androidx.datastore.preferences.core.PreferenceDataStoreFactory.create(
            produceFile = { context.preferencesDataStoreFile("app_preferences") }
        )
    }

    /**
     * Provides Gson instance for JSON serialization/deserialization
     */
    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setLenient()
            .create()
    }
}
