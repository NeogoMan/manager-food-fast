package com.fast.manger.food.domain.usecase.order

import com.fast.manger.food.domain.model.Order
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.OrderRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Use Case: Get My Orders
 * Retrieves orders for the current user
 */
class GetMyOrdersUseCase @Inject constructor(
    private val orderRepository: OrderRepository
) {
    /**
     * Get all orders for current user (one-time)
     */
    suspend operator fun invoke(): Result<List<Order>> {
        return orderRepository.getMyOrders()
    }

    /**
     * Observe all orders (reactive with real-time updates)
     */
    fun observe(): Flow<Result<List<Order>>> {
        return orderRepository.observeMyOrders()
    }

    /**
     * Get only active orders (not completed/rejected)
     */
    suspend fun getActive(): Result<List<Order>> {
        return orderRepository.getMyActiveOrders()
    }

    /**
     * Observe only active orders (reactive)
     */
    fun observeActive(): Flow<Result<List<Order>>> {
        return orderRepository.observeMyActiveOrders()
    }
}
