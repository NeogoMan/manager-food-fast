package com.fast.manger.food.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Preferences Manager using DataStore
 * Manages app preferences including notification permission state
 */
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "app_preferences")

@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val KEY_NOTIFICATION_PERMISSION_REQUESTED = booleanPreferencesKey("notification_permission_requested")
        private val KEY_NOTIFICATION_PERMISSION_GRANTED = booleanPreferencesKey("notification_permission_granted")
        private val KEY_SHOULD_SHOW_PERMISSION_RATIONALE = booleanPreferencesKey("should_show_permission_rationale")
        private val KEY_PERMISSION_DISMISSED_COUNT = intPreferencesKey("permission_dismissed_count")
        private val KEY_PERMISSION_MAYBE_LATER_COUNT = intPreferencesKey("permission_maybe_later_count")
    }

    /**
     * Check if notification permission has been requested before
     */
    val hasRequestedNotificationPermission: Flow<Boolean> = context.dataStore.data
        .map { preferences ->
            preferences[KEY_NOTIFICATION_PERMISSION_REQUESTED] ?: false
        }

    /**
     * Check if notification permission was granted
     */
    val isNotificationPermissionGranted: Flow<Boolean> = context.dataStore.data
        .map { preferences ->
            preferences[KEY_NOTIFICATION_PERMISSION_GRANTED] ?: false
        }

    /**
     * Check if we should show permission rationale (user denied before)
     */
    val shouldShowPermissionRationale: Flow<Boolean> = context.dataStore.data
        .map { preferences ->
            preferences[KEY_SHOULD_SHOW_PERMISSION_RATIONALE] ?: false
        }

    /**
     * Get the number of times user dismissed the permission bottom sheet
     */
    val permissionDismissedCount: Flow<Int> = context.dataStore.data
        .map { preferences ->
            preferences[KEY_PERMISSION_DISMISSED_COUNT] ?: 0
        }

    /**
     * Get the number of times user clicked "Maybe Later"
     */
    val permissionMaybeLaterCount: Flow<Int> = context.dataStore.data
        .map { preferences ->
            preferences[KEY_PERMISSION_MAYBE_LATER_COUNT] ?: 0
        }

    /**
     * Mark that notification permission has been requested
     */
    suspend fun setNotificationPermissionRequested() {
        context.dataStore.edit { preferences ->
            preferences[KEY_NOTIFICATION_PERMISSION_REQUESTED] = true
        }
    }

    /**
     * Update notification permission grant status
     */
    suspend fun setNotificationPermissionGranted(granted: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_NOTIFICATION_PERMISSION_GRANTED] = granted
            preferences[KEY_NOTIFICATION_PERMISSION_REQUESTED] = true
        }
    }

    /**
     * Mark that we should show rationale (user denied permission)
     */
    suspend fun setShouldShowPermissionRationale(shouldShow: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_SHOULD_SHOW_PERMISSION_RATIONALE] = shouldShow
        }
    }

    /**
     * Increment the dismissed count
     */
    suspend fun incrementDismissedCount() {
        context.dataStore.edit { preferences ->
            val currentCount = preferences[KEY_PERMISSION_DISMISSED_COUNT] ?: 0
            preferences[KEY_PERMISSION_DISMISSED_COUNT] = currentCount + 1
        }
    }

    /**
     * Increment the "Maybe Later" count
     */
    suspend fun incrementMaybeLaterCount() {
        context.dataStore.edit { preferences ->
            val currentCount = preferences[KEY_PERMISSION_MAYBE_LATER_COUNT] ?: 0
            preferences[KEY_PERMISSION_MAYBE_LATER_COUNT] = currentCount + 1
        }
    }

    /**
     * Clear all preferences (for testing or logout)
     */
    suspend fun clearPreferences() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
