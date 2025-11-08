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
    private val authRepository: AuthRepository,
    private val restaurantRepository: com.fast.manger.food.domain.repository.RestaurantRepository
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
            android.util.Log.d("PlaceOrderUseCase", "=== PLACING ORDER START ===")

            // Get current user
            val userResult = authRepository.getCurrentUser()
            if (userResult !is Result.Success || userResult.data == null) {
                android.util.Log.e("PlaceOrderUseCase", "User not authenticated")
                return Result.Error(Exception("Utilisateur non authentifié"))
            }
            val user = userResult.data
            android.util.Log.d("PlaceOrderUseCase", "User ID: ${user.id}")
            android.util.Log.d("PlaceOrderUseCase", "User name: ${user.name}")
            android.util.Log.d("PlaceOrderUseCase", "User role: ${user.role}")

            // Get restaurantId from Firebase Auth token claims
            val restaurantId = try {
                val id = getRestaurantId()
                android.util.Log.d("PlaceOrderUseCase", "✅ RestaurantId from token: $id")
                id
            } catch (e: Exception) {
                android.util.Log.e("PlaceOrderUseCase", "❌ Failed to get restaurantId from token", e)
                null
            }

            if (restaurantId == null) {
                android.util.Log.e("PlaceOrderUseCase", "❌ RestaurantId is NULL - cannot create order")
                return Result.Error(Exception("Restaurant non identifié"))
            }

            // Check if restaurant is accepting orders
            android.util.Log.d("PlaceOrderUseCase", "🔍 Checking if restaurant is accepting orders...")
            val restaurantSettingsResult = restaurantRepository.getRestaurantSettings(restaurantId)
            if (restaurantSettingsResult.isSuccess) {
                val restaurant = restaurantSettingsResult.getOrNull()
                if (restaurant != null && !restaurant.acceptingOrders) {
                    android.util.Log.w("PlaceOrderUseCase", "⏸ Restaurant is NOT accepting orders")
                    return Result.Error(Exception("Le restaurant n'accepte pas de commandes pour le moment. Veuillez réessayer plus tard."))
                }
                android.util.Log.d("PlaceOrderUseCase", "✅ Restaurant is accepting orders")
            } else {
                android.util.Log.e("PlaceOrderUseCase", "❌ Failed to check restaurant settings: ${restaurantSettingsResult.exceptionOrNull()?.message}")
                return Result.Error(Exception("Impossible de vérifier le statut du restaurant"))
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

            android.util.Log.d("PlaceOrderUseCase", "📦 Creating order:")
            android.util.Log.d("PlaceOrderUseCase", "  - Order number: $orderNumber")
            android.util.Log.d("PlaceOrderUseCase", "  - User ID: ${user.id}")
            android.util.Log.d("PlaceOrderUseCase", "  - Restaurant ID: $restaurantId ⭐")
            android.util.Log.d("PlaceOrderUseCase", "  - Customer name: ${user.name}")
            android.util.Log.d("PlaceOrderUseCase", "  - Total amount: $total")
            android.util.Log.d("PlaceOrderUseCase", "  - Item count: ${cartItems.sumOf { it.quantity }}")
            android.util.Log.d("PlaceOrderUseCase", "  - Status: ${OrderStatus.AWAITING_APPROVAL}")

            // Place order
            val result = orderRepository.placeOrder(order)

            when (result) {
                is Result.Success -> {
                    android.util.Log.d("PlaceOrderUseCase", "✅ Order created successfully with ID: ${result.data}")
                    android.util.Log.d("PlaceOrderUseCase", "🧹 Clearing cart...")
                    cartRepository.clearCart()
                }
                is Result.Error -> {
                    android.util.Log.e("PlaceOrderUseCase", "❌ Order creation failed: ${result.exception.message}")
                }
                else -> {
                    android.util.Log.w("PlaceOrderUseCase", "⏳ Order creation in progress...")
                }
            }

            android.util.Log.d("PlaceOrderUseCase", "=== PLACING ORDER END ===")
            return result
        } catch (e: Exception) {
            return Result.Error(Exception("Échec de la commande: ${e.message}"))
        }
    }
}
