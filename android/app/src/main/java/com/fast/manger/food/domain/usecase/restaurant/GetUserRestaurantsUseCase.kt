package com.fast.manger.food.domain.usecase.restaurant

import com.fast.manger.food.domain.model.Restaurant
import com.fast.manger.food.domain.model.User
import com.fast.manger.food.domain.repository.AuthRepository
import com.fast.manger.food.domain.repository.RestaurantRepository
import javax.inject.Inject
import com.fast.manger.food.domain.model.Result as AppResult

/**
 * Use case to get list of restaurants user has access to
 * Returns list of Restaurant objects with details
 */
class GetUserRestaurantsUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val restaurantRepository: RestaurantRepository
) {
    /**
     * Execute use case
     * @return Result with list of restaurants or error
     */
    suspend operator fun invoke(): AppResult<List<Restaurant>> {
        return try {
            // Get current user
            val userResult = authRepository.getCurrentUser()
            if (userResult !is AppResult.Success || userResult.data == null) {
                return AppResult.Error(Exception("User not authenticated"))
            }

            val user = userResult.data
            val restaurantIds = user.restaurantIds

            if (restaurantIds.isEmpty()) {
                return AppResult.Success(emptyList())
            }

            // Fetch restaurant details
            val restaurantsResult = restaurantRepository.getRestaurantsByIds(restaurantIds)
            if (restaurantsResult.isFailure) {
                return AppResult.Error(
                    (restaurantsResult.exceptionOrNull() as? Exception) ?: Exception("Failed to fetch restaurants")
                )
            }

            val restaurants = restaurantsResult.getOrNull() ?: emptyList()
            AppResult.Success(restaurants)
        } catch (e: Exception) {
            AppResult.Error(Exception("Failed to get user restaurants: ${e.message}"))
        }
    }
}
