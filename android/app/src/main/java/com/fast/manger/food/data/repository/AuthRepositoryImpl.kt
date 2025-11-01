package com.fast.manger.food.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.fast.manger.food.data.local.dao.UserDao
import com.fast.manger.food.data.local.entity.UserEntity
import com.fast.manger.food.data.remote.api.FirebaseAuthService
import com.fast.manger.food.data.remote.api.FirestoreUserService
import com.fast.manger.food.di.RestaurantDataStore
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.model.User
import com.fast.manger.food.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Authentication Repository Implementation
 * Handles user authentication with offline support using DataStore and Room
 */
@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val firebaseAuthService: FirebaseAuthService,
    private val firestoreUserService: FirestoreUserService,
    private val userDao: UserDao,
    @RestaurantDataStore private val dataStore: DataStore<Preferences>
) : AuthRepository {

    companion object {
        private val KEY_USER_ID = stringPreferencesKey("user_id")
        private val KEY_USERNAME = stringPreferencesKey("username")
    }

    /**
     * Login with username and password
     * Authenticates via Firebase and caches user data locally
     */
    override suspend fun login(username: String, password: String): Result<User> {
        return try {
            // Authenticate with Firebase Cloud Function
            val authResult = firebaseAuthService.authenticateUser(username, password)

            if (authResult is Result.Success) {
                val user = authResult.data

                // Cache user data locally
                userDao.insert(UserEntity.fromDomainModel(user))

                // Save user ID in DataStore for session persistence
                dataStore.edit { preferences ->
                    preferences[KEY_USER_ID] = user.id
                    preferences[KEY_USERNAME] = user.username
                }

                // Fetch full user profile from Firestore
                when (val profileResult = firestoreUserService.getUserById(user.id)) {
                    is Result.Success -> {
                        val fullUser = profileResult.data
                        userDao.update(UserEntity.fromDomainModel(fullUser))
                        Result.Success(fullUser)
                    }
                    is Result.Error -> {
                        // Use the basic user data from auth if profile fetch fails
                        Result.Success(user)
                    }
                    is Result.Loading -> Result.Success(user)
                }
            } else {
                authResult as Result.Error
            }
        } catch (e: Exception) {
            Result.Error(Exception("Login failed: ${e.message}"))
        }
    }

    /**
     * Login with username or phone number and password
     * Supports both username and phone number as identifier
     */
    override suspend fun loginWithIdentifier(identifier: String, password: String): Result<User> {
        return try {
            // Use the same authenticateUser function (backend supports both)
            val authResult = firebaseAuthService.authenticateUser(identifier, password)

            if (authResult is Result.Success) {
                val user = authResult.data

                // Cache user data locally
                userDao.insert(UserEntity.fromDomainModel(user))

                // Save user ID in DataStore for session persistence
                dataStore.edit { preferences ->
                    preferences[KEY_USER_ID] = user.id
                    preferences[KEY_USERNAME] = user.username
                }

                // Fetch full user profile from Firestore
                when (val profileResult = firestoreUserService.getUserById(user.id)) {
                    is Result.Success -> {
                        val fullUser = profileResult.data
                        userDao.update(UserEntity.fromDomainModel(fullUser))
                        Result.Success(fullUser)
                    }
                    is Result.Error -> {
                        // Use the basic user data from auth if profile fetch fails
                        Result.Success(user)
                    }
                    is Result.Loading -> Result.Success(user)
                }
            } else {
                authResult as Result.Error
            }
        } catch (e: Exception) {
            Result.Error(Exception("Login failed: ${e.message}"))
        }
    }

    /**
     * Sign up new client user
     * Creates account via Firebase Cloud Function and auto-logs in
     */
    override suspend fun signUpClient(
        restaurantId: String,
        name: String,
        phone: String,
        password: String
    ): Result<User> {
        return try {
            // Call Firebase Cloud Function to create client account
            val signUpResult = firebaseAuthService.signUpClient(restaurantId, name, phone, password)

            if (signUpResult is Result.Success) {
                val user = signUpResult.data

                // Cache user data locally
                userDao.insert(UserEntity.fromDomainModel(user))

                // Save user ID in DataStore for session persistence
                dataStore.edit { preferences ->
                    preferences[KEY_USER_ID] = user.id
                    preferences[KEY_USERNAME] = user.username
                }

                Result.Success(user)
            } else {
                signUpResult as Result.Error
            }
        } catch (e: Exception) {
            Result.Error(Exception("Sign up failed: ${e.message}"))
        }
    }

    /**
     * Logout current user
     * Clears Firebase session and local cache
     */
    override suspend fun logout(): Result<Unit> {
        return try {
            // Sign out from Firebase
            firebaseAuthService.signOut()

            // Clear local cache
            userDao.deleteAll()

            // Clear DataStore
            dataStore.edit { preferences ->
                preferences.clear()
            }

            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(Exception("Logout failed: ${e.message}"))
        }
    }

    /**
     * Get current authenticated user
     * Returns cached user if available, otherwise fetches from Firestore
     */
    override suspend fun getCurrentUser(): Result<User?> {
        return try {
            // Check if user is authenticated in Firebase
            val firebaseUserId = firebaseAuthService.getCurrentUserId()
            if (firebaseUserId == null) {
                return Result.Success(null)
            }

            // Try to get from local cache first
            val cachedUser = userDao.getCurrentUser()
            if (cachedUser != null) {
                return Result.Success(cachedUser.toDomainModel())
            }

            // Fetch from Firestore if not in cache
            when (val result = firestoreUserService.getUserById(firebaseUserId)) {
                is Result.Success -> {
                    val user = result.data
                    // Cache for future use
                    userDao.insert(UserEntity.fromDomainModel(user))
                    Result.Success(user)
                }
                is Result.Error -> Result.Error(result.exception)
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get current user: ${e.message}"))
        }
    }

    /**
     * Observe current user (reactive)
     * Returns Flow that emits user changes in real-time
     */
    override fun observeCurrentUser(): Flow<User?> {
        return userDao.observeCurrentUser().map { entity ->
            entity?.toDomainModel()
        }
    }

    /**
     * Check if user is authenticated
     */
    override suspend fun isAuthenticated(): Boolean {
        return try {
            // Check Firebase auth state
            if (!firebaseAuthService.isAuthenticated()) {
                return false
            }

            // Verify we have user data cached
            val userId = dataStore.data.map { preferences ->
                preferences[KEY_USER_ID]
            }.firstOrNull()

            userId != null
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Get Firebase ID token for API calls
     */
    override suspend fun getIdToken(): Result<String> {
        return firebaseAuthService.getIdToken()
    }

    /**
     * Refresh authentication token
     */
    override suspend fun refreshToken(): Result<String> {
        return firebaseAuthService.refreshToken()
    }

    /**
     * Add restaurant to user's account
     * Calls Cloud Function and updates local user cache
     */
    override suspend fun addRestaurantToUser(restaurantCode: String): Result<Map<String, Any>> {
        return try {
            val result = firebaseAuthService.addRestaurantToUser(restaurantCode)

            if (result is Result.Success) {
                // Refresh user data to get updated restaurantIds list
                val userId = firebaseAuthService.getCurrentUserId()
                if (userId != null) {
                    when (val userResult = firestoreUserService.getUserById(userId)) {
                        is Result.Success -> {
                            val updatedUser = userResult.data
                            userDao.update(UserEntity.fromDomainModel(updatedUser))
                        }
                        else -> {
                            // Ignore error, proceed with add result
                        }
                    }
                }
            }

            result
        } catch (e: Exception) {
            Result.Error(Exception("Failed to add restaurant: ${e.message}"))
        }
    }

    /**
     * Set active restaurant for user
     * Calls Cloud Function and updates local user cache with new active restaurant
     */
    override suspend fun setActiveRestaurant(restaurantId: String): Result<Map<String, Any>> {
        return try {
            val result = firebaseAuthService.setActiveRestaurant(restaurantId)

            if (result is Result.Success) {
                // Refresh user data to get updated activeRestaurantId
                val userId = firebaseAuthService.getCurrentUserId()
                if (userId != null) {
                    when (val userResult = firestoreUserService.getUserById(userId)) {
                        is Result.Success -> {
                            val updatedUser = userResult.data
                            userDao.update(UserEntity.fromDomainModel(updatedUser))
                        }
                        else -> {
                            // Ignore error, proceed with set result
                        }
                    }
                }
            }

            result
        } catch (e: Exception) {
            Result.Error(Exception("Failed to set active restaurant: ${e.message}"))
        }
    }
}
