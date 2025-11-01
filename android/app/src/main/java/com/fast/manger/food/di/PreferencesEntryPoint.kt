package com.fast.manger.food.di

import com.fast.manger.food.util.PreferencesManager
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/**
 * Entry point for accessing PreferencesManager in Composables
 * This allows us to access Hilt-injected dependencies in Composable functions
 */
@EntryPoint
@InstallIn(SingletonComponent::class)
interface PreferencesEntryPoint {
    fun preferencesManager(): PreferencesManager
}
