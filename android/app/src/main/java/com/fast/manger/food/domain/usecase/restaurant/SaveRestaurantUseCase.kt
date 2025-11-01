package com.fast.manger.food.domain.usecase.restaurant

import com.fast.manger.food.domain.model.Restaurant
import com.fast.manger.food.domain.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use case to save restaurant data locally
 */
class SaveRestaurantUseCase @Inject constructor(
    private val repository: RestaurantRepository
) {
    suspend operator fun invoke(restaurant: Restaurant) {
        repository.saveRestaurantCode(
            code = restaurant.shortCode,
            restaurantId = restaurant.id,
            restaurantName = restaurant.name
        )
    }
}
