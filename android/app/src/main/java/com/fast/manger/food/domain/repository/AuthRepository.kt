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
}
