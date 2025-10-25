package com.fast.manger.food.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
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

    private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
        name = "fast_food_preferences"
    )

    /**
     * Provides application context
     */
    @Provides
    @Singleton
    fun provideApplicationContext(@ApplicationContext context: Context): Context {
        return context
    }

    /**
     * Provides DataStore for preferences and cart storage
     */
    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return context.dataStore
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
