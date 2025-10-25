package com.fast.manger.food.domain.usecase.cart

import com.fast.manger.food.domain.model.MenuItem
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.CartRepository
import javax.inject.Inject

/**
 * Use Case: Add Item to Cart
 * Adds menu item to shopping cart with quantity and optional notes
 */
class AddToCartUseCase @Inject constructor(
    private val cartRepository: CartRepository
) {
    /**
     * Add item to cart
     * @param menuItem The menu item to add
     * @param quantity Quantity (must be positive)
     * @param notes Optional special instructions
     */
    suspend operator fun invoke(
        menuItem: MenuItem,
        quantity: Int,
        notes: String? = null
    ): Result<Unit> {
        // Validate quantity
        if (quantity <= 0) {
            return Result.Error(Exception("La quantité doit être positive"))
        }

        if (quantity > 99) {
            return Result.Error(Exception("La quantité maximale est de 99"))
        }

        // Check if item is available
        if (!menuItem.isAvailable) {
            return Result.Error(Exception("Cet article n'est plus disponible"))
        }

        // Validate notes length
        if (notes != null && notes.length > 200) {
            return Result.Error(Exception("Les notes ne doivent pas dépasser 200 caractères"))
        }

        return cartRepository.addToCart(menuItem, quantity, notes?.trim())
    }
}
