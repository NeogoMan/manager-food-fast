package com.fast.manger.food.presentation.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.usecase.auth.GetCurrentUserUseCase
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
    private val placeOrderUseCase: PlaceOrderUseCase,
    private val getCurrentUserUseCase: GetCurrentUserUseCase
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
     * Checks authentication first - if user is not authenticated, triggers signup flow
     */
    fun placeOrder() {
        if (_uiState.value.cartItems.isEmpty()) {
            _uiState.update { it.copy(error = "Le panier est vide") }
            return
        }

        _uiState.update { it.copy(isPlacingOrder = true, error = null) }

        viewModelScope.launch {
            // Check if user is authenticated
            val currentUser = getCurrentUserUseCase()
            if (currentUser !is Result.Success || currentUser.data == null) {
                // User not authenticated, trigger signup flow
                _uiState.update {
                    it.copy(
                        isPlacingOrder = false,
                        requiresAuthentication = true
                    )
                }
                return@launch
            }

            // User is authenticated, proceed with order placement
            val notes = _uiState.value.orderNotes.ifBlank { null }

            when (val result = placeOrderUseCase(notes)) {
                is Result.Success -> {
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
                    _uiState.update {
                        it.copy(
                            isPlacingOrder = false,
                            error = result.exception.message ?: "Erreur de commande"
                        )
                    }
                }
                is Result.Loading -> {
                    // Loading state handled by isPlacingOrder
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
     * Reset authentication required state (after navigation to signup)
     */
    fun resetAuthenticationState() {
        _uiState.update { it.copy(requiresAuthentication = false) }
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
