package com.fast.manger.food.data.repository

import com.fast.manger.food.data.local.PreferencesManager
import com.fast.manger.food.data.remote.dto.RestaurantDto
import com.fast.manger.food.data.remote.dto.toDomain
import com.fast.manger.food.domain.model.Restaurant
import com.fast.manger.food.domain.repository.RestaurantRepository
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.functions.FirebaseFunctions
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implementation of RestaurantRepository
 */
@Singleton
class RestaurantRepositoryImpl @Inject constructor(
    private val functions: FirebaseFunctions,
    private val firestore: FirebaseFirestore,
    private val preferencesManager: PreferencesManager
) : RestaurantRepository {

    override suspend fun validateRestaurantCode(code: String): Result<Restaurant> {
        return try {
            val data = hashMapOf("code" to code)

            val result = functions
                .getHttpsCallable("validateRestaurantCode")
                .call(data)
                .await()

            val response = result.getData() as? Map<*, *>
                ?: return Result.failure(Exception("Invalid response format"))

            val success = response["success"] as? Boolean ?: false
            if (!success) {
                val error = response["error"] as? String ?: "Restaurant code not found"
                return Result.failure(Exception(error))
            }

            val restaurantMap = response["restaurant"] as? Map<*, *>
                ?: return Result.failure(Exception("No restaurant data in response"))

            val restaurant = RestaurantDto(
                id = restaurantMap["id"] as? String ?: "",
                name = restaurantMap["name"] as? String ?: "",
                shortCode = restaurantMap["shortCode"] as? String ?: "",
                email = restaurantMap["email"] as? String,
                phone = restaurantMap["phone"] as? String,
                status = restaurantMap["status"] as? String ?: "",
                plan = restaurantMap["plan"] as? String ?: ""
            ).toDomain()

            Result.success(restaurant)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun saveRestaurantCode(
        code: String,
        restaurantId: String,
        restaurantName: String
    ) {
        preferencesManager.saveRestaurantCode(code, restaurantId, restaurantName)
    }

    override suspend fun getSavedRestaurantCode(): String? {
        return preferencesManager.getRestaurantCode()
    }

    override suspend fun getSavedRestaurantId(): String? {
        return preferencesManager.getRestaurantId()
    }

    override suspend fun getSavedRestaurantName(): String? {
        return preferencesManager.getRestaurantName()
    }

    override suspend fun clearRestaurantData() {
        preferencesManager.clearRestaurantData()
    }

    override suspend fun hasRestaurantCode(): Boolean {
        return preferencesManager.hasRestaurantCode()
    }

    override suspend fun getRestaurantsByIds(restaurantIds: List<String>): Result<List<Restaurant>> {
        return try {
            if (restaurantIds.isEmpty()) {
                return Result.success(emptyList())
            }

            // Firestore 'in' query limitation: max 10 items
            // If more than 10, we need to batch the requests
            val restaurants = mutableListOf<Restaurant>()

            restaurantIds.chunked(10).forEach { chunk ->
                val snapshot = firestore.collection("restaurants")
                    .whereIn("__name__", chunk)
                    .get()
                    .await()

                val chunkRestaurants = snapshot.documents.mapNotNull { doc ->
                    try {
                        RestaurantDto(
                            id = doc.id,
                            name = doc.getString("name") ?: "",
                            shortCode = doc.getString("shortCode") ?: "",
                            email = doc.getString("email"),
                            phone = doc.getString("phone"),
                            status = doc.getString("status") ?: "",
                            plan = doc.getString("plan") ?: ""
                        ).toDomain()
                    } catch (e: Exception) {
                        null
                    }
                }

                restaurants.addAll(chunkRestaurants)
            }

            Result.success(restaurants)
        } catch (e: Exception) {
            Result.failure(Exception("Failed to fetch restaurants: ${e.message}"))
        }
    }
}
