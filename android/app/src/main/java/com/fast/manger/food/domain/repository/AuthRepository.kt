package com.fast.manger.food.domain.repository

import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.model.User
import kotlinx.coroutines.flow.Flow

/**
 * Authentication Repository Interface
 * Defines contract for authentication operations
 */
interface AuthRepository {
    /**
     * Login with username and password
     */
    suspend fun login(username: String, password: String): Result<User>

    /**
     * Login with username or phone number and password
     * @param identifier Username or phone number
     * @param password User password
     * @return Result with User or error
     */
    suspend fun loginWithIdentifier(identifier: String, password: String): Result<User>

    /**
     * Sign up new client user
     * @param restaurantId Restaurant ID to associate with
     * @param name User's full name
     * @param phone User's phone number
     * @param password User's password
     * @return Result with User or error
     */
    suspend fun signUpClient(
        restaurantId: String,
        name: String,
        phone: String,
        password: String
    ): Result<User>

    /**
     * Logout current user
     */
    suspend fun logout(): Result<Unit>

    /**
     * Get current authenticated user
     */
    suspend fun getCurrentUser(): Result<User?>

    /**
     * Observe current user (reactive)
     */
    fun observeCurrentUser(): Flow<User?>

    /**
     * Check if user is authenticated
     */
    suspend fun isAuthenticated(): Boolean

    /**
     * Get Firebase ID token for API calls
     */
    suspend fun getIdToken(): Result<String>

    /**
     * Refresh authentication token
     */
    suspend fun refreshToken(): Result<String>

    /**
     * Add restaurant to user's account
     * @param restaurantCode Restaurant short code
     * @return Result with success message and restaurant info
     */
    suspend fun addRestaurantToUser(restaurantCode: String): Result<Map<String, Any>>

    /**
     * Set active restaurant for user
     * @param restaurantId Restaurant ID to set as active
     * @return Result with success message and restaurant info
     */
    suspend fun setActiveRestaurant(restaurantId: String): Result<Map<String, Any>>
}
