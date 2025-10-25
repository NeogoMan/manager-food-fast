package com.fast.manger.food.domain.usecase.order

import com.fast.manger.food.domain.model.Order
import com.fast.manger.food.domain.model.OrderStatus
import com.fast.manger.food.domain.model.PaymentStatus
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.AuthRepository
import com.fast.manger.food.domain.repository.CartRepository
import com.fast.manger.food.domain.repository.OrderRepository
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

/**
 * Use Case: Place Order
 * Creates an order from cart items
 */
class PlaceOrderUseCase @Inject constructor(
    private val orderRepository: OrderRepository,
    private val cartRepository: CartRepository,
    private val authRepository: AuthRepository
) {
    /**
     * Place order from cart
     * @param notes Optional order notes
     */
    suspend operator fun invoke(notes: String? = null): Result<String> {
        try {
            android.util.Log.d("PlaceOrderUseCase", "Starting order placement...")

            // Get current user
            val userResult = authRepository.getCurrentUser()
            android.util.Log.d("PlaceOrderUseCase", "User result = $userResult")
            if (userResult !is Result.Success || userResult.data == null) {
                android.util.Log.e("PlaceOrderUseCase", "User not authenticated")
                return Result.Error(Exception("Utilisateur non authentifié"))
            }
            val user = userResult.data
            android.util.Log.d("PlaceOrderUseCase", "User = ${user.id}, ${user.name}, ${user.role}")

            // Get cart items
            val cartResult = cartRepository.getCartItems()
            if (cartResult !is Result.Success) {
                return Result.Error(Exception("Impossible de récupérer le panier"))
            }

            val cartItems = cartResult.data
            if (cartItems.isEmpty()) {
                return Result.Error(Exception("Le panier est vide"))
            }

            // Calculate total
            val totalResult = cartRepository.getCartTotal()
            if (totalResult !is Result.Success) {
                return Result.Error(Exception("Impossible de calculer le total"))
            }
            val total = totalResult.data

            // Validate notes
            if (notes != null && notes.length > 500) {
                return Result.Error(Exception("Les notes ne doivent pas dépasser 500 caractères"))
            }

            // Generate order number (format: ORD-timestamp)
            val orderNumber = "ORD-${System.currentTimeMillis()}"

            // Create order
            val order = Order(
                id = "", // Will be assigned by Firestore
                orderNumber = orderNumber,
                userId = user.id,
                customerName = user.name,
                items = cartItems.map { it.toOrderItem() },
                totalAmount = total,
                itemCount = cartItems.sumOf { it.quantity },
                notes = notes?.trim(),
                status = OrderStatus.AWAITING_APPROVAL,
                paymentStatus = PaymentStatus.UNPAID,
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )

            // Place order
            android.util.Log.d("PlaceOrderUseCase", "Placing order... orderNumber=${order.orderNumber}, userId=${order.userId}, items=${order.items.size}, total=${order.totalAmount}")
            val result = orderRepository.placeOrder(order)
            android.util.Log.d("PlaceOrderUseCase", "Place order result = $result")

            // Clear cart on success
            if (result is Result.Success) {
                android.util.Log.d("PlaceOrderUseCase", "Order placed successfully, clearing cart...")
                cartRepository.clearCart()
            } else if (result is Result.Error) {
                android.util.Log.e("PlaceOrderUseCase", "Order placement failed: ${result.exception.message}")
            }

            return result
        } catch (e: Exception) {
            android.util.Log.e("PlaceOrderUseCase", "Exception caught: ${e.message}", e)
            return Result.Error(Exception("Échec de la commande: ${e.message}"))
        }
    }
}
