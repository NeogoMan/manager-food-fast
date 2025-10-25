package com.fast.manger.food.domain.usecase.cart

import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.CartRepository
import javax.inject.Inject

/**
 * Use Case: Update Cart Item
 * Updates quantity or removes item from cart
 */
class UpdateCartItemUseCase @Inject constructor(
    private val cartRepository: CartRepository
) {
    /**
     * Update item quantity
     * If quantity is 0 or negative, item will be removed
     */
    suspend fun updateQuantity(
        menuItemId: String,
        notes: String? = null,
        newQuantity: Int
    ): Result<Unit> {
        if (newQuantity < 0) {
            return Result.Error(Exception("La quantité ne peut pas être négative"))
        }

        if (newQuantity > 99) {
            return Result.Error(Exception("La quantité maximale est de 99"))
        }

        return cartRepository.updateQuantity(menuItemId, notes, newQuantity)
    }

    /**
     * Remove item from cart
     */
    suspend fun removeItem(menuItemId: String, notes: String? = null): Result<Unit> {
        return cartRepository.removeFromCart(menuItemId, notes)
    }
}
