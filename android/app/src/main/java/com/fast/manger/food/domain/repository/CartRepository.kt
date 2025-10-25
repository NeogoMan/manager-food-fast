package com.fast.manger.food.domain.repository

import com.fast.manger.food.domain.model.CartItem
import com.fast.manger.food.domain.model.MenuItem
import com.fast.manger.food.domain.model.Result
import kotlinx.coroutines.flow.Flow

/**
 * Cart Repository Interface
 * Defines contract for shopping cart operations
 */
interface CartRepository {
    /**
     * Add item to cart
     */
    suspend fun addToCart(menuItem: MenuItem, quantity: Int, notes: String? = null): Result<Unit>

    /**
     * Remove item from cart
     */
    suspend fun removeFromCart(menuItemId: String, notes: String? = null): Result<Unit>

    /**
     * Update item quantity in cart
     */
    suspend fun updateQuantity(menuItemId: String, notes: String? = null, newQuantity: Int): Result<Unit>

    /**
     * Clear entire cart
     */
    suspend fun clearCart(): Result<Unit>

    /**
     * Get all cart items
     */
    suspend fun getCartItems(): Result<List<CartItem>>

    /**
     * Observe cart items (reactive)
     */
    fun observeCartItems(): Flow<List<CartItem>>

    /**
     * Get total cart amount
     */
    suspend fun getCartTotal(): Result<Double>

    /**
     * Get cart items count
     */
    suspend fun getCartItemsCount(): Result<Int>

    /**
     * Observe cart total (reactive)
     */
    fun observeCartTotal(): Flow<Double>

    /**
     * Observe cart items count (reactive)
     */
    fun observeCartItemsCount(): Flow<Int>
}
