package com.fast.manger.food.presentation.cart

import com.fast.manger.food.domain.model.CartItem

/**
 * UI State for Cart Screen
 */
data class CartUiState(
    val cartItems: List<CartItem> = emptyList(),
    val totalAmount: Double = 0.0,
    val itemsCount: Int = 0,
    val isLoading: Boolean = false,
    val isClearingCart: Boolean = false,
    val isPlacingOrder: Boolean = false,
    val orderNotes: String = "",
    val error: String? = null,
    val orderPlacedSuccessfully: Boolean = false,
    val orderId: String? = null,
    val requiresAuthentication: Boolean = false
)
