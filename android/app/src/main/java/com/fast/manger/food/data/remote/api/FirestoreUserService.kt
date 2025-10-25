package com.fast.manger.food.data.remote.api

import com.fast.manger.food.data.remote.dto.UserDto
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.model.User
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Firestore User Service
 * Handles user profile operations
 */
@Singleton
class FirestoreUserService @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    companion object {
        private const val COLLECTION_USERS = "users"
    }

    /**
     * Get user by ID
     */
    suspend fun getUserById(userId: String): Result<User> {
        return try {
            val document = firestore.collection(COLLECTION_USERS)
                .document(userId)
                .get()
                .await()

            val user = UserDto.fromDocument(document)?.toDomainModel(document.id)
                ?: return Result.Error(Exception("User not found"))

            Result.Success(user)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to fetch user: ${e.message}"))
        }
    }

    /**
     * Observe user by ID in real-time
     */
    fun observeUserById(userId: String): Flow<Result<User>> = callbackFlow {
        val listenerRegistration = firestore.collection(COLLECTION_USERS)
            .document(userId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.Error(Exception("Real-time user error: ${error.message}")))
                    return@addSnapshotListener
                }

                if (snapshot != null && snapshot.exists()) {
                    val user = UserDto.fromDocument(snapshot)?.toDomainModel(snapshot.id)
                    if (user != null) {
                        trySend(Result.Success(user))
                    }
                }
            }

        awaitClose { listenerRegistration.remove() }
    }

    /**
     * Update user profile
     */
    suspend fun updateUser(userId: String, updates: Map<String, Any>): Result<Unit> {
        return try {
            val updateMap = updates.toMutableMap()
            updateMap["updatedAt"] = Timestamp.now()

            firestore.collection(COLLECTION_USERS)
                .document(userId)
                .update(updateMap)
                .await()

            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to update user: ${e.message}"))
        }
    }

    /**
     * Update user phone number
     */
    suspend fun updatePhoneNumber(userId: String, phone: String): Result<Unit> {
        return updateUser(userId, mapOf("phone" to phone))
    }

    /**
     * Check if user exists
     */
    suspend fun userExists(userId: String): Result<Boolean> {
        return try {
            val document = firestore.collection(COLLECTION_USERS)
                .document(userId)
                .get()
                .await()

            Result.Success(document.exists())
        } catch (e: Exception) {
            Result.Error(Exception("Failed to check user existence: ${e.message}"))
        }
    }

    /**
     * Update FCM token for push notifications
     */
    suspend fun updateFcmToken(userId: String, fcmToken: String): Result<Unit> {
        return updateUser(
            userId,
            mapOf(
                "fcmToken" to fcmToken,
                "fcmTokenUpdatedAt" to Timestamp.now()
            )
        )
    }

    /**
     * Remove FCM token (on logout)
     */
    suspend fun removeFcmToken(userId: String): Result<Unit> {
        return updateUser(
            userId,
            mapOf(
                "fcmToken" to com.google.firebase.firestore.FieldValue.delete(),
                "fcmTokenUpdatedAt" to com.google.firebase.firestore.FieldValue.delete()
            )
        )
    }
}
