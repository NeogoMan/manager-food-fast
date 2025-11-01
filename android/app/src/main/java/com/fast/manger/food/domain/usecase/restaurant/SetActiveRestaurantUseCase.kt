package com.fast.manger.food.domain.usecase.restaurant

import com.fast.manger.food.domain.repository.AuthRepository
import com.fast.manger.food.domain.repository.RestaurantRepository
import javax.inject.Inject
import com.fast.manger.food.domain.model.Result as AppResult

/**
 * Use case to set active restaurant for current user
 * Updates user's activeRestaurantId and authentication token
 */
class SetActiveRestaurantUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val restaurantRepository: RestaurantRepository
) {
    /**
     * Execute use case
     * @param restaurantId Restaurant ID to set as active
     * @return Result with success message or error
     */
    suspend operator fun invoke(restaurantId: String): AppResult<String> {
        return try {
            // Call repository to set active restaurant
            val result = authRepository.setActiveRestaurant(restaurantId)

            if (result is AppResult.Success) {
                val responseData = result.data
                val message = responseData["message"] as? String ?: "Restaurant switched successfully"

                // Update local restaurant data
                val restaurantData = responseData["restaurant"] as? Map<*, *>
                if (restaurantData != null) {
                    val name = restaurantData["name"] as? String ?: ""
                    val code = restaurantData["shortCode"] as? String ?: ""
                    restaurantRepository.saveRestaurantCode(code, restaurantId, name)
                }

                AppResult.Success(message)
            } else if (result is AppResult.Error) {
                result
            } else {
                AppResult.Error(Exception("Unknown error"))
            }
        } catch (e: Exception) {
            AppResult.Error(Exception("Failed to set active restaurant: ${e.message}"))
        }
    }
}
