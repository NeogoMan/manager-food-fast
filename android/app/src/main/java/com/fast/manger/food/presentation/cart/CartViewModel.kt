package com.fast.manger.food.presentation.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.usecase.cart.ClearCartUseCase
import com.fast.manger.food.domain.usecase.cart.GetCartUseCase
import com.fast.manger.food.domain.usecase.cart.UpdateCartItemUseCase
import com.fast.manger.food.domain.usecase.order.PlaceOrderUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Cart Screen
 * Handles cart operations and order placement
 */
@HiltViewModel
class CartViewModel @Inject constructor(
    private val getCartUseCase: GetCartUseCase,
    private val updateCartItemUseCase: UpdateCartItemUseCase,
    private val clearCartUseCase: ClearCartUseCase,
    private val placeOrderUseCase: PlaceOrderUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(CartUiState())
    val uiState: StateFlow<CartUiState> = _uiState.asStateFlow()

    init {
        observeCart()
    }

    /**
     * Observe cart items and total in real-time
     */
    private fun observeCart() {
        viewModelScope.launch {
            // Observe cart items
            launch {
                getCartUseCase.observeItems().collect { cartItems ->
                    _uiState.update {
                        it.copy(
                            cartItems = cartItems,
                            isLoading = false
                        )
                    }
                }
            }

            // Observe cart total
            launch {
                getCartUseCase.observeTotal().collect { totalAmount ->
                    _uiState.update {
                        it.copy(totalAmount = totalAmount)
                    }
                }
            }
        }
    }

    /**
     * Update item quantity
     */
    fun updateQuantity(menuItemId: String, notes: String?, newQuantity: Int) {
        viewModelScope.launch {
            when (val result = updateCartItemUseCase.updateQuantity(menuItemId, notes, newQuantity)) {
                is Result.Success -> {
                    // Success handled by observer
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(error = result.exception.message ?: "Erreur de mise à jour")
                    }
                }
                is Result.Loading -> {
                    // Handle loading if needed
                }
            }
        }
    }

    /**
     * Remove item from cart
     */
    fun removeItem(menuItemId: String, notes: String?) {
        viewModelScope.launch {
            when (val result = updateCartItemUseCase.removeItem(menuItemId, notes)) {
                is Result.Success -> {
                    // Success handled by observer
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(error = result.exception.message ?: "Erreur de suppression")
                    }
                }
                is Result.Loading -> {
                    // Handle loading if needed
                }
            }
        }
    }

    /**
     * Clear entire cart
     */
    fun clearCart() {
        _uiState.update { it.copy(isClearingCart = true) }

        viewModelScope.launch {
            when (val result = clearCartUseCase()) {
                is Result.Success -> {
                    _uiState.update { it.copy(isClearingCart = false) }
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(
                            isClearingCart = false,
                            error = result.exception.message ?: "Erreur de vidage du panier"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled
                }
            }
        }
    }

    /**
     * Update order notes
     */
    fun onOrderNotesChange(notes: String) {
        _uiState.update { it.copy(orderNotes = notes, error = null) }
    }

    /**
     * Place order
     */
    fun placeOrder() {
        android.util.Log.d("CartViewModel", "=== PLACE ORDER BUTTON CLICKED ===")
        android.util.Log.d("CartViewModel", "placeOrder() called - START")
        android.util.Log.d("CartViewModel", "Cart items count: ${_uiState.value.cartItems.size}")

        // Force show error to test if function is called
        _uiState.update { it.copy(error = "TEST: placeOrder function was called!") }

        if (_uiState.value.cartItems.isEmpty()) {
            android.util.Log.e("CartViewModel", "Cart is empty!")
            _uiState.update { it.copy(error = "Le panier est vide") }
            return
        }

        android.util.Log.d("CartViewModel", "Setting isPlacingOrder = true")
        _uiState.update { it.copy(isPlacingOrder = true, error = null) }

        viewModelScope.launch {
            val notes = _uiState.value.orderNotes.ifBlank { null }

            android.util.Log.d("CartViewModel", "Calling placeOrderUseCase with notes: $notes")

            when (val result = placeOrderUseCase(notes)) {
                is Result.Success -> {
                    android.util.Log.d("CartViewModel", "Order placed successfully! ID: ${result.data}")
                    _uiState.update {
                        it.copy(
                            isPlacingOrder = false,
                            orderPlacedSuccessfully = true,
                            orderId = result.data,
                            orderNotes = ""
                        )
                    }
                }
                is Result.Error -> {
                    android.util.Log.e("CartViewModel", "Order placement failed: ${result.exception.message}")
                    _uiState.update {
                        it.copy(
                            isPlacingOrder = false,
                            error = result.exception.message ?: "Erreur de commande"
                        )
                    }
                }
                is Result.Loading -> {
                    android.util.Log.d("CartViewModel", "Order placement loading...")
                }
            }
        }
    }

    /**
     * Reset order placed state (after navigation)
     */
    fun resetOrderPlacedState() {
        _uiState.update {
            it.copy(
                orderPlacedSuccessfully = false,
                orderId = null
            )
        }
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
