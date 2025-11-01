package com.fast.manger.food.domain.usecase.restaurant

import com.fast.manger.food.domain.repository.AuthRepository
import javax.inject.Inject
import com.fast.manger.food.domain.model.Result as AppResult

/**
 * Use case to add a restaurant to user's account using restaurant code
 * Calls Cloud Function to add restaurant to user's restaurantIds list
 */
class AddRestaurantByCodeUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    /**
     * Execute use case
     * @param restaurantCode Restaurant short code (e.g., "MN0UTJ")
     * @return Result with success message or error
     */
    suspend operator fun invoke(restaurantCode: String): AppResult<String> {
        return try {
            // Validate input
            val code = restaurantCode.trim().uppercase()
            if (code.isEmpty()) {
                return AppResult.Error(Exception("Restaurant code cannot be empty"))
            }

            // Call repository to add restaurant
            val result = authRepository.addRestaurantToUser(code)

            if (result is AppResult.Success) {
                val responseData = result.data
                val message = responseData["message"] as? String ?: "Restaurant added successfully"
                AppResult.Success(message)
            } else if (result is AppResult.Error) {
                result
            } else {
                AppResult.Error(Exception("Unknown error"))
            }
        } catch (e: Exception) {
            AppResult.Error(Exception("Failed to add restaurant: ${e.message}"))
        }
    }
}
