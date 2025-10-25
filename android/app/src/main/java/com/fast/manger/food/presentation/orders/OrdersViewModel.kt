package com.fast.manger.food.presentation.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.usecase.order.CancelOrderUseCase
import com.fast.manger.food.domain.usecase.order.GetMyOrdersUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Orders Screen
 * Handles order viewing and cancellation with real-time updates
 */
@HiltViewModel
class OrdersViewModel @Inject constructor(
    private val getMyOrdersUseCase: GetMyOrdersUseCase,
    private val cancelOrderUseCase: CancelOrderUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrdersUiState())
    val uiState: StateFlow<OrdersUiState> = _uiState.asStateFlow()

    init {
        loadOrders()
        observeOrders()
    }

    /**
     * Load orders (one-time)
     */
    private fun loadOrders() {
        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            // Load all orders
            launch {
                when (val result = getMyOrdersUseCase()) {
                    is Result.Success -> {
                        _uiState.update {
                            it.copy(
                                orders = result.data,
                                isLoading = false
                            )
                        }
                    }
                    is Result.Error -> {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                error = result.exception.message ?: "Erreur de chargement des commandes"
                            )
                        }
                    }
                    is Result.Loading -> {
                        // Already handled
                    }
                }
            }

            // Load active orders
            launch {
                when (val result = getMyOrdersUseCase.getActive()) {
                    is Result.Success -> {
                        _uiState.update { it.copy(activeOrders = result.data) }
                    }
                    is Result.Error -> {
                        // Error already handled in all orders
                    }
                    is Result.Loading -> {
                        // Loading already handled
                    }
                }
            }
        }
    }

    /**
     * Observe orders for real-time updates
     */
    private fun observeOrders() {
        viewModelScope.launch {
            // Observe all orders
            launch {
                getMyOrdersUseCase.observe().collect { result ->
                    when (result) {
                        is Result.Success -> {
                            _uiState.update { it.copy(orders = result.data) }
                        }
                        is Result.Error -> {
                            // Error already handled in loadOrders
                        }
                        is Result.Loading -> {
                            // Loading handled in loadOrders
                        }
                    }
                }
            }

            // Observe active orders
            launch {
                getMyOrdersUseCase.observeActive().collect { result ->
                    when (result) {
                        is Result.Success -> {
                            _uiState.update { it.copy(activeOrders = result.data) }
                        }
                        is Result.Error -> {
                            // Error already handled
                        }
                        is Result.Loading -> {
                            // Loading already handled
                        }
                    }
                }
            }
        }
    }

    /**
     * Handle pull-to-refresh
     */
    fun onRefresh() {
        _uiState.update { it.copy(isRefreshing = true) }

        viewModelScope.launch {
            loadOrders()
            delay(500) // Smooth UX
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }

    /**
     * Switch between tabs
     */
    fun onTabSelected(tab: OrderTab) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    /**
     * Cancel order
     */
    fun cancelOrder(orderId: String) {
        _uiState.update {
            it.copy(
                isCancellingOrder = true,
                cancellingOrderId = orderId,
                error = null
            )
        }

        viewModelScope.launch {
            when (val result = cancelOrderUseCase(orderId)) {
                is Result.Success -> {
                    _uiState.update {
                        it.copy(
                            isCancellingOrder = false,
                            cancellingOrderId = null
                        )
                    }
                    // Order will be updated via real-time observer
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(
                            isCancellingOrder = false,
                            cancellingOrderId = null,
                            error = result.exception.message ?: "Erreur d'annulation de la commande"
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
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
