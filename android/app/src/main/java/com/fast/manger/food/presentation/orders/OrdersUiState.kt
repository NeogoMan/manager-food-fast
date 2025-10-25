package com.fast.manger.food.presentation.orders

import com.fast.manger.food.domain.model.Order

/**
 * UI State for Orders Screen
 */
data class OrdersUiState(
    val orders: List<Order> = emptyList(),
    val activeOrders: List<Order> = emptyList(),
    val selectedTab: OrderTab = OrderTab.ACTIVE,
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val isCancellingOrder: Boolean = false,
    val cancellingOrderId: String? = null,
    val error: String? = null
)

/**
 * Tabs for Orders Screen
 */
enum class OrderTab {
    ACTIVE,  // Orders in progress (not completed/rejected)
    ALL      // All orders (history)
}
