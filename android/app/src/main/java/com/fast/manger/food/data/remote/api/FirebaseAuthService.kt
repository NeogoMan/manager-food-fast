package com.fast.manger.food.data.remote.api

import com.fast.manger.food.data.remote.dto.AuthResponseDto
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.model.User
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Firebase Authentication Service
 * Handles user authentication using Firebase Auth with custom tokens
 */
@Singleton
class FirebaseAuthService @Inject constructor(
    private val auth: FirebaseAuth,
    private val functions: FirebaseFunctions
) {
    /**
     * Authenticate user with username and password via Cloud Function
     * Returns custom token and user data
     */
    suspend fun authenticateUser(username: String, password: String): Result<User> {
        return try {
            // Call Cloud Function to verify credentials and get custom token
            val data = hashMapOf(
                "username" to username,
                "password" to password
            )

            val result = functions
                .getHttpsCallable("authenticateUser")
                .call(data)
                .await()

            // Parse response
            val responseData = result.getData() as? Map<*, *>
            val success = responseData?.get("success") as? Boolean ?: false

            if (!success) {
                val errorMessage = responseData?.get("message") as? String
                    ?: responseData?.get("error") as? String
                    ?: "Authentication failed"
                return Result.Error(Exception(errorMessage))
            }

            // Get custom token and user data
            val token = responseData["token"] as? String
                ?: return Result.Error(Exception("No token received"))

            val userData = responseData["user"] as? Map<*, *>
                ?: return Result.Error(Exception("No user data received"))

            // Sign in with custom token
            auth.signInWithCustomToken(token).await()

            // Convert user data to User object
            val user = User(
                id = userData["id"] as? String ?: "",
                username = userData["username"] as? String ?: "",
                name = userData["name"] as? String ?: "",
                phone = userData["phone"] as? String,
                role = com.fast.manger.food.domain.model.UserRole.fromString(
                    userData["role"] as? String ?: "client"
                ),
                isActive = true,
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )

            Result.Success(user)
        } catch (e: Exception) {
            Result.Error(
                when {
                    e.message?.contains("UNAUTHENTICATED") == true ->
                        Exception("Invalid username or password")
                    e.message?.contains("PERMISSION_DENIED") == true ->
                        Exception("Account is inactive")
                    e.message?.contains("network") == true ->
                        Exception("Network error. Please check your connection")
                    else -> Exception("Login failed: ${e.message}")
                }
            )
        }
    }

    /**
     * Sign out current user
     */
    suspend fun signOut(): Result<Unit> {
        return try {
            auth.signOut()
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(Exception("Logout failed: ${e.message}"))
        }
    }

    /**
     * Get current Firebase user ID
     */
    fun getCurrentUserId(): String? {
        return auth.currentUser?.uid
    }

    /**
     * Check if user is authenticated
     */
    fun isAuthenticated(): Boolean {
        return auth.currentUser != null
    }

    /**
     * Get current user ID token (for authenticated API calls)
     */
    suspend fun getIdToken(): Result<String> {
        return try {
            val token = auth.currentUser?.getIdToken(false)?.await()?.token
                ?: return Result.Error(Exception("User not authenticated"))
            Result.Success(token)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get token: ${e.message}"))
        }
    }

    /**
     * Refresh ID token
     */
    suspend fun refreshToken(): Result<String> {
        return try {
            val token = auth.currentUser?.getIdToken(true)?.await()?.token
                ?: return Result.Error(Exception("User not authenticated"))
            Result.Success(token)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to refresh token: ${e.message}"))
        }
    }
}
