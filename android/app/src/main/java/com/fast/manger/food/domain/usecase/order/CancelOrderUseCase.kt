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
     * @param reason Optional cancellation reason
     */
    suspend operator fun invoke(orderId: String, reason: String? = null): Result<Unit> {
        android.util.Log.d("CancelOrderUseCase", "=== USE CASE START ===")
        android.util.Log.d("CancelOrderUseCase", "Order ID: $orderId")
        android.util.Log.d("CancelOrderUseCase", "Reason: ${reason ?: "null"}")

        // Get order to validate it can be cancelled
        android.util.Log.d("CancelOrderUseCase", "Fetching order by ID...")
        val orderResult = orderRepository.getOrderById(orderId)
        if (orderResult !is Result.Success) {
            android.util.Log.e("CancelOrderUseCase", "Order not found!")
            return Result.Error(Exception("Commande introuvable"))
        }

        val order = orderResult.data
        android.util.Log.d("CancelOrderUseCase", "Order found - Status: ${order.status}, Payment: ${order.paymentStatus}")
        android.util.Log.d("CancelOrderUseCase", "canBeCancelled: ${order.canBeCancelled()}")

        // Check if order can be cancelled
        if (!order.canBeCancelled()) {
            android.util.Log.e("CancelOrderUseCase", "Order cannot be cancelled! Status: ${order.status.getDisplayName()}")
            return Result.Error(
                Exception("Cette commande ne peut plus être annulée (statut: ${order.status.getDisplayName()})")
            )
        }

        // Cancel the order with optional reason
        android.util.Log.d("CancelOrderUseCase", "Order can be cancelled, proceeding to repository...")
        return orderRepository.cancelOrder(orderId, reason)
    }
}
