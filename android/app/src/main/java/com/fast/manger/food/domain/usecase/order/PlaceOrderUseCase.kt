package com.fast.manger.food.domain.usecase.order

import com.fast.manger.food.domain.model.Order
import com.fast.manger.food.domain.model.OrderStatus
import com.fast.manger.food.domain.model.PaymentStatus
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.AuthRepository
import com.fast.manger.food.domain.repository.CartRepository
import com.fast.manger.food.domain.repository.OrderRepository
import com.google.firebase.auth.FirebaseAuth
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

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
     * Extract restaurantId from Firebase Auth token claims
     */
    private suspend fun getRestaurantId(): String? = suspendCancellableCoroutine { continuation ->
        val currentUser = FirebaseAuth.getInstance().currentUser
        if (currentUser == null) {
            continuation.resume(null)
            return@suspendCancellableCoroutine
        }

        currentUser.getIdToken(false)
            .addOnSuccessListener { result ->
                val restaurantId = result.claims["restaurantId"] as? String
                continuation.resume(restaurantId)
            }
            .addOnFailureListener { exception ->
                continuation.resumeWithException(exception)
            }
    }

    /**
     * Place order from cart
     * @param notes Optional order notes
     */
    suspend operator fun invoke(notes: String? = null): Result<String> {
        try {
            // Get current user
            val userResult = authRepository.getCurrentUser()
            if (userResult !is Result.Success || userResult.data == null) {
                return Result.Error(Exception("Utilisateur non authentifié"))
            }
            val user = userResult.data

            // Get restaurantId from Firebase Auth token claims
            val restaurantId = try {
                getRestaurantId()
            } catch (e: Exception) {
                null
            }

            if (restaurantId == null) {
                return Result.Error(Exception("Restaurant non identifié"))
            }

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
                restaurantId = restaurantId,
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
            val result = orderRepository.placeOrder(order)

            // Clear cart on success
            if (result is Result.Success) {
                cartRepository.clearCart()
            }

            return result
        } catch (e: Exception) {
            return Result.Error(Exception("Échec de la commande: ${e.message}"))
        }
    }
}
