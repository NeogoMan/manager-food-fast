package com.fast.manger.food.domain.usecase.restaurant

import com.fast.manger.food.domain.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use case to clear saved restaurant data (for switching restaurants)
 */
class ClearRestaurantUseCase @Inject constructor(
    private val repository: RestaurantRepository
) {
    suspend operator fun invoke() {
        repository.clearRestaurantData()
    }
}
