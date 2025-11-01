package com.fast.manger.food.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.fast.manger.food.di.RestaurantDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manager for storing and retrieving app preferences using DataStore
 * DataStore instance is injected via Dagger Hilt to ensure singleton behavior
 */
@Singleton
class PreferencesManager @Inject constructor(
    @RestaurantDataStore private val dataStore: DataStore<Preferences>
) {

    companion object {
        private val RESTAURANT_CODE_KEY = stringPreferencesKey("restaurant_code")
        private val RESTAURANT_ID_KEY = stringPreferencesKey("restaurant_id")
        private val RESTAURANT_NAME_KEY = stringPreferencesKey("restaurant_name")
    }

    /**
     * Save restaurant code and details
     */
    suspend fun saveRestaurantCode(code: String, restaurantId: String, restaurantName: String) {
        dataStore.edit { preferences ->
            preferences[RESTAURANT_CODE_KEY] = code
            preferences[RESTAURANT_ID_KEY] = restaurantId
            preferences[RESTAURANT_NAME_KEY] = restaurantName
        }
    }

    /**
     * Get saved restaurant code
     */
    suspend fun getRestaurantCode(): String? {
        val preferences = dataStore.data.first()
        return preferences[RESTAURANT_CODE_KEY]
    }

    /**
     * Get saved restaurant ID
     */
    suspend fun getRestaurantId(): String? {
        val preferences = dataStore.data.first()
        return preferences[RESTAURANT_ID_KEY]
    }

    /**
     * Get saved restaurant name
     */
    suspend fun getRestaurantName(): String? {
        val preferences = dataStore.data.first()
        return preferences[RESTAURANT_NAME_KEY]
    }

    /**
     * Flow of restaurant code
     */
    val restaurantCodeFlow: Flow<String?> = dataStore.data.map { preferences ->
        preferences[RESTAURANT_CODE_KEY]
    }

    /**
     * Flow of restaurant ID
     */
    val restaurantIdFlow: Flow<String?> = dataStore.data.map { preferences ->
        preferences[RESTAURANT_ID_KEY]
    }

    /**
     * Clear restaurant data (for switching restaurants)
     */
    suspend fun clearRestaurantData() {
        dataStore.edit { preferences ->
            preferences.remove(RESTAURANT_CODE_KEY)
            preferences.remove(RESTAURANT_ID_KEY)
            preferences.remove(RESTAURANT_NAME_KEY)
        }
    }

    /**
     * Check if restaurant code exists
     */
    suspend fun hasRestaurantCode(): Boolean {
        return getRestaurantCode() != null
    }
}
