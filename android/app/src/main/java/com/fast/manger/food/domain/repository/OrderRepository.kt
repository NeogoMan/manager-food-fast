package com.fast.manger.food.domain.repository

import com.fast.manger.food.domain.model.Order
import com.fast.manger.food.domain.model.OrderStatus
import com.fast.manger.food.domain.model.Result
import kotlinx.coroutines.flow.Flow

/**
 * Order Repository Interface
 * Defines contract for order operations
 */
interface OrderRepository {
    /**
     * Create a new order
     */
    suspend fun placeOrder(order: Order): Result<String>

    /**
     * Get orders for current user
     */
    suspend fun getMyOrders(): Result<List<Order>>

    /**
     * Get active orders for current user (not completed/rejected)
     */
    suspend fun getMyActiveOrders(): Result<List<Order>>

    /**
     * Get order by ID
     */
    suspend fun getOrderById(orderId: String): Result<Order>

    /**
     * Get orders by status
     */
    suspend fun getOrdersByStatus(status: OrderStatus): Result<List<Order>>

    /**
     * Observe orders for current user (real-time updates)
     */
    fun observeMyOrders(): Flow<Result<List<Order>>>

    /**
     * Observe active orders for current user (real-time)
     */
    fun observeMyActiveOrders(): Flow<Result<List<Order>>>

    /**
     * Observe single order by ID (real-time)
     */
    fun observeOrderById(orderId: String): Flow<Result<Order>>

    /**
     * Cancel order (client action)
     * @param orderId ID of the order to cancel
     * @param reason Optional cancellation reason
     */
    suspend fun cancelOrder(orderId: String, reason: String? = null): Result<Unit>

    /**
     * Update order status
     */
    suspend fun updateOrderStatus(orderId: String, status: OrderStatus): Result<Unit>

    /**
     * Sync orders from Firestore to local database
     */
    suspend fun syncOrders(): Result<Unit>
}
