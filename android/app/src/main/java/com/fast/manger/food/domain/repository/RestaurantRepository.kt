package com.fast.manger.food.domain.repository

import com.fast.manger.food.domain.model.Restaurant

/**
 * Repository interface for Restaurant-related operations
 */
interface RestaurantRepository {
    /**
     * Validate restaurant code and fetch restaurant details
     * @param code Restaurant short code
     * @return Result with Restaurant or error
     */
    suspend fun validateRestaurantCode(code: String): Result<Restaurant>

    /**
     * Save restaurant code locally
     * @param code Restaurant short code
     * @param restaurantId Restaurant ID
     * @param restaurantName Restaurant name
     */
    suspend fun saveRestaurantCode(code: String, restaurantId: String, restaurantName: String)

    /**
     * Get saved restaurant code
     * @return Saved restaurant code or null
     */
    suspend fun getSavedRestaurantCode(): String?

    /**
     * Get saved restaurant ID
     * @return Saved restaurant ID or null
     */
    suspend fun getSavedRestaurantId(): String?

    /**
     * Get saved restaurant name
     * @return Saved restaurant name or null
     */
    suspend fun getSavedRestaurantName(): String?

    /**
     * Clear saved restaurant data (for switching restaurants)
     */
    suspend fun clearRestaurantData()

    /**
     * Check if restaurant code exists locally
     * @return True if code exists
     */
    suspend fun hasRestaurantCode(): Boolean

    /**
     * Get restaurants by their IDs
     * @param restaurantIds List of restaurant IDs to fetch
     * @return Result with list of restaurants
     */
    suspend fun getRestaurantsByIds(restaurantIds: List<String>): Result<List<Restaurant>>

    /**
     * Get restaurant settings by ID
     * @param restaurantId Restaurant ID
     * @return Result with Restaurant or error
     */
    suspend fun getRestaurantSettings(restaurantId: String): Result<Restaurant>
}
