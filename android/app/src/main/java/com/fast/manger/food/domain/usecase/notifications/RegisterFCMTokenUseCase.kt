package com.fast.manger.food.domain.usecase.notifications

import android.util.Log
import com.fast.manger.food.data.remote.api.FirebaseAuthService
import com.fast.manger.food.data.remote.api.FirestoreUserService
import com.fast.manger.food.domain.model.Result
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

/**
 * Use Case: Register FCM Token
 * Gets the FCM token from Firebase and saves it to user's Firestore document
 */
class RegisterFCMTokenUseCase @Inject constructor(
    private val authService: FirebaseAuthService,
    private val userService: FirestoreUserService,
    private val firebaseMessaging: FirebaseMessaging
) {
    companion object {
        private const val TAG = "RegisterFCMToken"
    }

    /**
     * Register FCM token for current user
     */
    suspend operator fun invoke(): Result<Unit> {
        return try {
            // Get current authenticated user ID
            val currentUserId = authService.getCurrentUserId()
            if (currentUserId == null) {
                Log.w(TAG, "No user logged in, cannot register FCM token")
                return Result.Error(Exception("User not authenticated"))
            }

            // Get FCM token from Firebase Messaging
            val fcmToken = try {
                firebaseMessaging.token.await()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to get FCM token", e)
                return Result.Error(Exception("Failed to retrieve FCM token: ${e.message}"))
            }

            Log.d(TAG, "FCM Token retrieved: $fcmToken")

            // Save token to Firestore user document
            val result = userService.updateFcmToken(currentUserId, fcmToken)

            when (result) {
                is Result.Success -> {
                    Log.d(TAG, "FCM token registered successfully for user: $currentUserId")
                    Result.Success(Unit)
                }
                is Result.Error -> {
                    Log.e(TAG, "Failed to save FCM token", result.exception)
                    result
                }
                else -> Result.Error(Exception("Unexpected result type"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error during FCM token registration", e)
            Result.Error(Exception("Failed to register FCM token: ${e.message}"))
        }
    }

    /**
     * Remove FCM token (call on logout)
     */
    suspend fun removeToken(): Result<Unit> {
        return try {
            val currentUserId = authService.getCurrentUserId()
            if (currentUserId == null) {
                return Result.Success(Unit) // No user, nothing to remove
            }

            // Remove token from Firestore
            val result = userService.removeFcmToken(currentUserId)

            when (result) {
                is Result.Success -> {
                    Log.d(TAG, "FCM token removed for user: $currentUserId")

                    // Delete instance ID to prevent receiving notifications
                    try {
                        firebaseMessaging.deleteToken().await()
                        Log.d(TAG, "FCM instance ID deleted")
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to delete FCM instance ID", e)
                    }

                    Result.Success(Unit)
                }
                is Result.Error -> {
                    Log.e(TAG, "Failed to remove FCM token", result.exception)
                    result
                }
                else -> Result.Error(Exception("Unexpected result type"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error during FCM token removal", e)
            Result.Error(Exception("Failed to remove FCM token: ${e.message}"))
        }
    }
}
