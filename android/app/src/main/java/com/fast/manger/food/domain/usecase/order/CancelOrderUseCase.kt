package com.fast.manger.food.domain.usecase.order

import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.OrderRepository
import javax.inject.Inject

/**
 * Use Case: Cancel Order
 * Allows user to cancel an order if allowed
 */
class CancelOrderUseCase @Inject constructor(
    private val orderRepository: OrderRepository
) {
    /**
     * Cancel order
     * @param orderId ID of the order to cancel
     */
    suspend operator fun invoke(orderId: String): Result<Unit> {
        // Get order to validate it can be cancelled
        val orderResult = orderRepository.getOrderById(orderId)
        if (orderResult !is Result.Success) {
            return Result.Error(Exception("Commande introuvable"))
        }

        val order = orderResult.data

        // Check if order can be cancelled
        if (!order.canBeCancelled()) {
            return Result.Error(
                Exception("Cette commande ne peut plus être annulée (statut: ${order.status.getDisplayName()})")
            )
        }

        // Cancel the order
        return orderRepository.cancelOrder(orderId)
    }
}
