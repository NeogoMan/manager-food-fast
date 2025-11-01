package com.fast.manger.food.domain.usecase.restaurant

import com.fast.manger.food.domain.model.Restaurant
import com.fast.manger.food.domain.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use case to validate restaurant code and fetch restaurant details
 */
class ValidateRestaurantCodeUseCase @Inject constructor(
    private val repository: RestaurantRepository
) {
    suspend operator fun invoke(code: String): Result<Restaurant> {
        // Validate code format
        if (code.isBlank()) {
            return Result.failure(Exception("Restaurant code cannot be empty"))
        }

        if (code.length < 4) {
            return Result.failure(Exception("Restaurant code must be at least 4 characters"))
        }

        // Call repository to validate
        return repository.validateRestaurantCode(code)
    }
}
