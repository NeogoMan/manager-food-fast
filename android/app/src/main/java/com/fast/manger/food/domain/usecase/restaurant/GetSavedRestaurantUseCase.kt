package com.fast.manger.food.domain.usecase.restaurant

import com.fast.manger.food.domain.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use case to get saved restaurant data from local storage
 */
class GetSavedRestaurantUseCase @Inject constructor(
    private val repository: RestaurantRepository
) {
    suspend fun getCode(): String? = repository.getSavedRestaurantCode()

    suspend fun getId(): String? = repository.getSavedRestaurantId()

    suspend fun getName(): String? = repository.getSavedRestaurantName()

    suspend fun hasRestaurant(): Boolean = repository.hasRestaurantCode()
}
