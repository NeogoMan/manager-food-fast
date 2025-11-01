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

            // Convert user data to User object with multi-restaurant support
            @Suppress("UNCHECKED_CAST")
            val restaurantIds = (userData["restaurantIds"] as? List<String>)
                ?: (userData["restaurantId"] as? String)?.let { listOf(it) }
                ?: emptyList()

            val user = User(
                id = userData["id"] as? String ?: "",
                username = userData["username"] as? String ?: "",
                name = userData["name"] as? String ?: "",
                phone = userData["phone"] as? String,
                role = com.fast.manger.food.domain.model.UserRole.fromString(
                    userData["role"] as? String ?: "client"
                ),
                isActive = true,
                restaurantId = userData["restaurantId"] as? String,
                restaurantIds = restaurantIds,
                activeRestaurantId = userData["activeRestaurantId"] as? String ?: userData["restaurantId"] as? String,
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
     * Sign up new client user via Cloud Function
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
    ): Result<User> {
        return try {
            // Call Cloud Function to create client account
            val data = hashMapOf(
                "restaurantId" to restaurantId,
                "name" to name,
                "phone" to phone,
                "password" to password
            )

            val result = functions
                .getHttpsCallable("signUpClient")
                .call(data)
                .await()

            // Parse response
            val responseData = result.getData() as? Map<*, *>
            val success = responseData?.get("success") as? Boolean ?: false

            if (!success) {
                val errorMessage = responseData?.get("message") as? String
                    ?: responseData?.get("error") as? String
                    ?: "Sign up failed"
                return Result.Error(Exception(errorMessage))
            }

            // Get custom token and user data
            val token = responseData["token"] as? String
                ?: return Result.Error(Exception("No token received"))

            val userData = responseData["user"] as? Map<*, *>
                ?: return Result.Error(Exception("No user data received"))

            // Sign in with custom token (auto-login after signup)
            auth.signInWithCustomToken(token).await()

            // Convert user data to User object with multi-restaurant support
            @Suppress("UNCHECKED_CAST")
            val restaurantIds = (userData["restaurantIds"] as? List<String>)
                ?: (userData["restaurantId"] as? String)?.let { listOf(it) }
                ?: emptyList()

            val user = User(
                id = userData["id"] as? String ?: "",
                username = userData["username"] as? String ?: "",
                name = userData["name"] as? String ?: "",
                phone = userData["phone"] as? String,
                role = com.fast.manger.food.domain.model.UserRole.fromString(
                    userData["role"] as? String ?: "client"
                ),
                isActive = true,
                restaurantId = userData["restaurantId"] as? String,
                restaurantIds = restaurantIds,
                activeRestaurantId = userData["activeRestaurantId"] as? String ?: userData["restaurantId"] as? String,
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )

            Result.Success(user)
        } catch (e: Exception) {
            Result.Error(
                when {
                    e.message?.contains("already-exists") == true || e.message?.contains("already registered") == true ->
                        Exception("Phone number already registered")
                    e.message?.contains("invalid-argument") == true ->
                        Exception("Invalid input. Please check all fields")
                    e.message?.contains("not-found") == true ->
                        Exception("Restaurant not found")
                    e.message?.contains("network") == true ->
                        Exception("Network error. Please check your connection")
                    else -> Exception("Sign up failed: ${e.message}")
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

    /**
     * Add restaurant to user's list via Cloud Function
     * @param restaurantCode Restaurant short code to add
     * @return Result with success message and restaurant info
     */
    suspend fun addRestaurantToUser(restaurantCode: String): Result<Map<String, Any>> {
        return try {
            if (auth.currentUser == null) {
                return Result.Error(Exception("User not authenticated"))
            }

            val data = hashMapOf(
                "restaurantCode" to restaurantCode
            )

            val result = functions
                .getHttpsCallable("addRestaurantToUser")
                .call(data)
                .await()

            val responseData = result.getData() as? Map<*, *>
            val success = responseData?.get("success") as? Boolean ?: false

            if (!success) {
                val errorMessage = responseData?.get("message") as? String
                    ?: responseData?.get("error") as? String
                    ?: "Failed to add restaurant"
                return Result.Error(Exception(errorMessage))
            }

            @Suppress("UNCHECKED_CAST")
            Result.Success(responseData as Map<String, Any>)
        } catch (e: Exception) {
            Result.Error(
                when {
                    e.message?.contains("not-found") == true ->
                        Exception("Restaurant code not found or inactive")
                    e.message?.contains("unauthenticated") == true ->
                        Exception("Please log in first")
                    e.message?.contains("network") == true ->
                        Exception("Network error. Please check your connection")
                    else -> Exception("Failed to add restaurant: ${e.message}")
                }
            )
        }
    }

    /**
     * Set active restaurant via Cloud Function
     * @param restaurantId Restaurant ID to set as active
     * @return Result with new token and restaurant info
     */
    suspend fun setActiveRestaurant(restaurantId: String): Result<Map<String, Any>> {
        return try {
            if (auth.currentUser == null) {
                return Result.Error(Exception("User not authenticated"))
            }

            val data = hashMapOf(
                "restaurantId" to restaurantId
            )

            val result = functions
                .getHttpsCallable("setActiveRestaurant")
                .call(data)
                .await()

            val responseData = result.getData() as? Map<*, *>
            val success = responseData?.get("success") as? Boolean ?: false

            if (!success) {
                val errorMessage = responseData?.get("message") as? String
                    ?: responseData?.get("error") as? String
                    ?: "Failed to set active restaurant"
                return Result.Error(Exception(errorMessage))
            }

            // Get new token from response and re-authenticate
            val token = responseData["token"] as? String
            if (token != null) {
                auth.signInWithCustomToken(token).await()
            }

            @Suppress("UNCHECKED_CAST")
            Result.Success(responseData as Map<String, Any>)
        } catch (e: Exception) {
            Result.Error(
                when {
                    e.message?.contains("permission-denied") == true ->
                        Exception("You don't have access to this restaurant")
                    e.message?.contains("unauthenticated") == true ->
                        Exception("Please log in first")
                    e.message?.contains("network") == true ->
                        Exception("Network error. Please check your connection")
                    else -> Exception("Failed to set active restaurant: ${e.message}")
                }
            )
        }
    }
}
