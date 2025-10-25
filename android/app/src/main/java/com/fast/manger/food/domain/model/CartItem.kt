package com.fast.manger.food.domain.model

/**
 * Domain model for Cart Item
 * Represents an item in the shopping cart
 */
data class CartItem(
    val menuItem: MenuItem,
    val quantity: Int,
    val notes: String? = null
) {
    val subtotal: Double
        get() = menuItem.price * quantity

    fun toOrderItem(): OrderItem {
        return OrderItem(
            menuItemId = menuItem.id,
            name = menuItem.name,
            price = menuItem.price,
            quantity = quantity,
            notes = notes
        )
    }
}
