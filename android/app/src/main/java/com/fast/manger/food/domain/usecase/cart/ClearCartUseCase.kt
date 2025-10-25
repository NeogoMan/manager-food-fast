package com.fast.manger.food.domain.usecase.cart

import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.CartRepository
import javax.inject.Inject

/**
 * Use Case: Clear Cart
 * Removes all items from shopping cart
 */
class ClearCartUseCase @Inject constructor(
    private val cartRepository: CartRepository
) {
    /**
     * Clear all items from cart
     */
    suspend operator fun invoke(): Result<Unit> {
        return cartRepository.clearCart()
    }
}
