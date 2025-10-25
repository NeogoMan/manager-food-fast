package com.fast.manger.food.domain.usecase.cart

import com.fast.manger.food.domain.model.CartItem
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.CartRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Use Case: Get Cart
 * Retrieves shopping cart items and calculations
 */
class GetCartUseCase @Inject constructor(
    private val cartRepository: CartRepository
) {
    /**
     * Get cart items (one-time)
     */
    suspend fun getItems(): Result<List<CartItem>> {
        return cartRepository.getCartItems()
    }

    /**
     * Observe cart items (reactive)
     */
    fun observeItems(): Flow<List<CartItem>> {
        return cartRepository.observeCartItems()
    }

    /**
     * Get cart total
     */
    suspend fun getTotal(): Result<Double> {
        return cartRepository.getCartTotal()
    }

    /**
     * Observe cart total (reactive)
     */
    fun observeTotal(): Flow<Double> {
        return cartRepository.observeCartTotal()
    }

    /**
     * Get cart items count
     */
    suspend fun getItemsCount(): Result<Int> {
        return cartRepository.getCartItemsCount()
    }

    /**
     * Observe cart items count (reactive)
     */
    fun observeItemsCount(): Flow<Int> {
        return cartRepository.observeCartItemsCount()
    }
}
