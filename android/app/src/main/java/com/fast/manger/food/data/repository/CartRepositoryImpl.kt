package com.fast.manger.food.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.fast.manger.food.di.RestaurantDataStore
import com.fast.manger.food.domain.model.CartItem
import com.fast.manger.food.domain.model.MenuItem
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.CartRepository
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Shopping Cart Repository Implementation
 * Uses DataStore for cart persistence across app restarts
 */
@Singleton
class CartRepositoryImpl @Inject constructor(
    @RestaurantDataStore private val dataStore: DataStore<Preferences>,
    private val gson: Gson
) : CartRepository {

    companion object {
        private val KEY_CART_ITEMS = stringPreferencesKey("cart_items")
    }

    /**
     * Data class for cart item serialization
     */
    private data class CartItemData(
        val menuItemId: String,
        val menuItemName: String,
        val menuItemDescription: String,
        val menuItemPrice: Double,
        val menuItemCategory: String,
        val quantity: Int,
        val notes: String? = null
    ) {
        fun toCartItem(): CartItem {
            return CartItem(
                menuItem = MenuItem(
                    id = menuItemId,
                    name = menuItemName,
                    description = menuItemDescription,
                    price = menuItemPrice,
                    category = com.fast.manger.food.domain.model.MenuCategory.fromString(menuItemCategory),
                    isAvailable = true
                ),
                quantity = quantity,
                notes = notes
            )
        }

        companion object {
            fun fromCartItem(item: CartItem): CartItemData {
                return CartItemData(
                    menuItemId = item.menuItem.id,
                    menuItemName = item.menuItem.name,
                    menuItemDescription = item.menuItem.description,
                    menuItemPrice = item.menuItem.price,
                    menuItemCategory = item.menuItem.category.toApiString(),
                    quantity = item.quantity,
                    notes = item.notes
                )
            }
        }
    }

    /**
     * Add item to cart or update quantity if already exists
     */
    override suspend fun addToCart(menuItem: MenuItem, quantity: Int, notes: String?): Result<Unit> {
        return try {
            val currentItems = getCartItemsList()

            // Check if item already exists in cart (same item + same notes)
            val existingItemIndex = currentItems.indexOfFirst {
                it.menuItem.id == menuItem.id && it.notes == notes
            }

            val updatedItems = if (existingItemIndex >= 0) {
                // Update quantity of existing item
                currentItems.toMutableList().apply {
                    val existingItem = currentItems[existingItemIndex]
                    this[existingItemIndex] = existingItem.copy(
                        quantity = existingItem.quantity + quantity
                    )
                }
            } else {
                // Add new item
                currentItems + CartItem(menuItem, quantity, notes)
            }

            saveCartItems(updatedItems)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to add to cart: ${e.message}"))
        }
    }

    /**
     * Remove item from cart
     */
    override suspend fun removeFromCart(menuItemId: String, notes: String?): Result<Unit> {
        return try {
            val currentItems = getCartItemsList()
            val updatedItems = currentItems.filter {
                !(it.menuItem.id == menuItemId && it.notes == notes)
            }

            saveCartItems(updatedItems)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to remove from cart: ${e.message}"))
        }
    }

    /**
     * Update item quantity in cart
     */
    override suspend fun updateQuantity(menuItemId: String, notes: String?, newQuantity: Int): Result<Unit> {
        return try {
            if (newQuantity <= 0) {
                return removeFromCart(menuItemId, notes)
            }

            val currentItems = getCartItemsList()
            val updatedItems = currentItems.map { item ->
                if (item.menuItem.id == menuItemId && item.notes == notes) {
                    item.copy(quantity = newQuantity)
                } else {
                    item
                }
            }

            saveCartItems(updatedItems)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to update quantity: ${e.message}"))
        }
    }

    /**
     * Clear entire cart
     */
    override suspend fun clearCart(): Result<Unit> {
        return try {
            dataStore.edit { preferences ->
                preferences.remove(KEY_CART_ITEMS)
            }
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to clear cart: ${e.message}"))
        }
    }

    /**
     * Get all cart items
     */
    override suspend fun getCartItems(): Result<List<CartItem>> {
        return try {
            val items = getCartItemsList()
            Result.Success(items)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get cart items: ${e.message}"))
        }
    }

    /**
     * Observe cart items (reactive)
     */
    override fun observeCartItems(): Flow<List<CartItem>> {
        return dataStore.data.map { preferences ->
            val json = preferences[KEY_CART_ITEMS] ?: return@map emptyList()
            deserializeCartItems(json)
        }
    }

    /**
     * Get total cart amount
     */
    override suspend fun getCartTotal(): Result<Double> {
        return try {
            val items = getCartItemsList()
            val total = items.sumOf { it.subtotal }
            Result.Success(total)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to calculate total: ${e.message}"))
        }
    }

    /**
     * Get cart items count (total items, not unique)
     */
    override suspend fun getCartItemsCount(): Result<Int> {
        return try {
            val items = getCartItemsList()
            val count = items.sumOf { it.quantity }
            Result.Success(count)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get cart count: ${e.message}"))
        }
    }

    /**
     * Observe cart total (reactive)
     */
    override fun observeCartTotal(): Flow<Double> {
        return observeCartItems().map { items ->
            items.sumOf { it.subtotal }
        }
    }

    /**
     * Observe cart items count (reactive)
     */
    override fun observeCartItemsCount(): Flow<Int> {
        return observeCartItems().map { items ->
            items.sumOf { it.quantity }
        }
    }

    /**
     * Helper: Get cart items list from DataStore
     */
    private suspend fun getCartItemsList(): List<CartItem> {
        val json = dataStore.data.first()[KEY_CART_ITEMS] ?: return emptyList()
        return deserializeCartItems(json)
    }

    /**
     * Helper: Save cart items to DataStore
     */
    private suspend fun saveCartItems(items: List<CartItem>) {
        val json = serializeCartItems(items)
        dataStore.edit { preferences ->
            preferences[KEY_CART_ITEMS] = json
        }
    }

    /**
     * Helper: Serialize cart items to JSON
     */
    private fun serializeCartItems(items: List<CartItem>): String {
        val dataItems = items.map { CartItemData.fromCartItem(it) }
        return gson.toJson(dataItems)
    }

    /**
     * Helper: Deserialize cart items from JSON
     */
    private fun deserializeCartItems(json: String): List<CartItem> {
        return try {
            val type = object : TypeToken<List<CartItemData>>() {}.type
            val dataItems: List<CartItemData> = gson.fromJson(json, type)
            dataItems.map { it.toCartItem() }
        } catch (e: Exception) {
            emptyList()
        }
    }
}
