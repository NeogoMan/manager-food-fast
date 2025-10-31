package com.fast.manger.food.data.remote.api

import com.fast.manger.food.data.remote.dto.OrderDto
import com.fast.manger.food.domain.model.Order
import com.fast.manger.food.domain.model.OrderStatus
import com.fast.manger.food.domain.model.Result
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Firestore Order Service
 * Handles order CRUD operations and real-time updates
 */
@Singleton
class FirestoreOrderService @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    companion object {
        private const val COLLECTION_ORDERS = "orders"
    }

    /**
     * Create a new order
     */
    suspend fun createOrder(order: Order): Result<String> {
        return try {
            val orderData = OrderDto.fromDomainModel(order)
            val docRef = firestore.collection(COLLECTION_ORDERS)
                .add(orderData)
                .await()

            Result.Success(docRef.id)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to create order: ${e.message}"))
        }
    }

    /**
     * Get orders by user ID
     * @param userId User ID to filter by
     * @param restaurantId Restaurant ID to filter by (for multi-tenant isolation)
     */
    suspend fun getOrdersByUserId(userId: String, restaurantId: String? = null): Result<List<Order>> {
        return try {
            var query = firestore.collection(COLLECTION_ORDERS)
                .whereEqualTo("userId", userId)

            // IMPORTANT: Filter by restaurantId for multi-tenant isolation
            if (restaurantId != null) {
                query = query.whereEqualTo("restaurantId", restaurantId)
            }

            val snapshot = query
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()

            val orders = snapshot.documents.mapNotNull { doc ->
                OrderDto.fromDocument(doc)?.toDomainModel(doc.id)
            }

            Result.Success(orders)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to fetch orders: ${e.message}"))
        }
    }

    /**
     * Get order by ID
     */
    suspend fun getOrderById(orderId: String): Result<Order> {
        return try {
            val document = firestore.collection(COLLECTION_ORDERS)
                .document(orderId)
                .get()
                .await()

            val order = OrderDto.fromDocument(document)?.toDomainModel(document.id)
                ?: return Result.Error(Exception("Order not found"))

            Result.Success(order)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to fetch order: ${e.message}"))
        }
    }

    /**
     * Get all orders (for staff)
     */
    suspend fun getAllOrders(): Result<List<Order>> {
        return try {
            val snapshot = firestore.collection(COLLECTION_ORDERS)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()

            val orders = snapshot.documents.mapNotNull { doc ->
                OrderDto.fromDocument(doc)?.toDomainModel(doc.id)
            }

            Result.Success(orders)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to fetch all orders: ${e.message}"))
        }
    }

    /**
     * Get orders by status
     */
    suspend fun getOrdersByStatus(status: OrderStatus): Result<List<Order>> {
        return try {
            val snapshot = firestore.collection(COLLECTION_ORDERS)
                .whereEqualTo("status", status.toApiString())
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()

            val orders = snapshot.documents.mapNotNull { doc ->
                OrderDto.fromDocument(doc)?.toDomainModel(doc.id)
            }

            Result.Success(orders)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to fetch orders by status: ${e.message}"))
        }
    }

    /**
     * Observe orders by user ID in real-time
     * @param userId User ID to filter by
     * @param restaurantId Restaurant ID to filter by (for multi-tenant isolation)
     */
    fun observeOrdersByUserId(userId: String, restaurantId: String? = null): Flow<Result<List<Order>>> = callbackFlow {
        var query = firestore.collection(COLLECTION_ORDERS)
            .whereEqualTo("userId", userId)

        // IMPORTANT: Filter by restaurantId for multi-tenant isolation
        if (restaurantId != null) {
            query = query.whereEqualTo("restaurantId", restaurantId)
        }

        val listenerRegistration = query
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.Error(Exception("Real-time orders error: ${error.message}")))
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val orders = snapshot.documents.mapNotNull { doc ->
                        OrderDto.fromDocument(doc)?.toDomainModel(doc.id)
                    }
                    trySend(Result.Success(orders))
                }
            }

        awaitClose { listenerRegistration.remove() }
    }

    /**
     * Observe single order by ID in real-time
     */
    fun observeOrderById(orderId: String): Flow<Result<Order>> = callbackFlow {
        val listenerRegistration = firestore.collection(COLLECTION_ORDERS)
            .document(orderId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.Error(Exception("Real-time order error: ${error.message}")))
                    return@addSnapshotListener
                }

                if (snapshot != null && snapshot.exists()) {
                    val order = OrderDto.fromDocument(snapshot)?.toDomainModel(snapshot.id)
                    if (order != null) {
                        trySend(Result.Success(order))
                    }
                }
            }

        awaitClose { listenerRegistration.remove() }
    }

    /**
     * Observe active orders (not completed/rejected) for user
     * @param userId User ID to filter by
     * @param restaurantId Restaurant ID to filter by (for multi-tenant isolation)
     */
    fun observeActiveOrdersByUserId(userId: String, restaurantId: String? = null): Flow<Result<List<Order>>> = callbackFlow {
        var query = firestore.collection(COLLECTION_ORDERS)
            .whereEqualTo("userId", userId)

        // IMPORTANT: Filter by restaurantId for multi-tenant isolation
        if (restaurantId != null) {
            query = query.whereEqualTo("restaurantId", restaurantId)
        }

        val listenerRegistration = query
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.Error(Exception("Real-time orders error: ${error.message}")))
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val orders = snapshot.documents.mapNotNull { doc ->
                        OrderDto.fromDocument(doc)?.toDomainModel(doc.id)
                    }.filter { order ->
                        order.status != OrderStatus.COMPLETED &&
                        order.status != OrderStatus.REJECTED
                    }
                    trySend(Result.Success(orders))
                }
            }

        awaitClose { listenerRegistration.remove() }
    }

    /**
     * Update order status
     */
    suspend fun updateOrderStatus(orderId: String, status: OrderStatus): Result<Unit> {
        return try {
            firestore.collection(COLLECTION_ORDERS)
                .document(orderId)
                .update(
                    mapOf(
                        "status" to status.toApiString(),
                        "updatedAt" to Timestamp.now()
                    )
                )
                .await()

            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to update order status: ${e.message}"))
        }
    }

    /**
     * Cancel order (client action)
     * @param orderId ID of the order to cancel
     * @param reason Optional cancellation reason provided by client
     */
    suspend fun cancelOrder(orderId: String, reason: String? = null): Result<Unit> {
        return try {
            android.util.Log.d("FirestoreOrderService", "=== CANCEL ORDER START ===")
            android.util.Log.d("FirestoreOrderService", "Order ID: $orderId")
            android.util.Log.d("FirestoreOrderService", "Reason: ${reason ?: "null"}")

            // Log current user's auth info
            val currentUser = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser
            android.util.Log.d("FirestoreOrderService", "Current user UID: ${currentUser?.uid}")

            // Get and log ID token claims
            currentUser?.getIdToken(false)?.await()?.let { tokenResult ->
                android.util.Log.d("FirestoreOrderService", "Token claims: ${tokenResult.claims}")
                android.util.Log.d("FirestoreOrderService", "restaurantId claim: ${tokenResult.claims["restaurantId"]}")
                android.util.Log.d("FirestoreOrderService", "role claim: ${tokenResult.claims["role"]}")
            }

            // First, get the current order to log its state
            val orderDoc = firestore.collection(COLLECTION_ORDERS)
                .document(orderId)
                .get()
                .await()

            android.util.Log.d("FirestoreOrderService", "Current order status: ${orderDoc.getString("status")}")
            android.util.Log.d("FirestoreOrderService", "Current order restaurantId: ${orderDoc.getString("restaurantId")}")
            android.util.Log.d("FirestoreOrderService", "Current order userId: ${orderDoc.getString("userId")}")

            val updateData = mutableMapOf<String, Any>(
                "status" to OrderStatus.CANCELLED.toApiString(),
                "updatedAt" to Timestamp.now()
            )

            // Add rejection reason if provided
            if (!reason.isNullOrBlank()) {
                updateData["rejectionReason"] = reason
            }

            android.util.Log.d("FirestoreOrderService", "Update data: $updateData")
            android.util.Log.d("FirestoreOrderService", "Status value being sent: ${OrderStatus.CANCELLED.toApiString()}")

            firestore.collection(COLLECTION_ORDERS)
                .document(orderId)
                .update(updateData)
                .await()

            android.util.Log.d("FirestoreOrderService", "=== CANCEL ORDER SUCCESS ===")
            Result.Success(Unit)
        } catch (e: Exception) {
            android.util.Log.e("FirestoreOrderService", "=== CANCEL ORDER FAILED ===")
            android.util.Log.e("FirestoreOrderService", "Error: ${e.message}")
            android.util.Log.e("FirestoreOrderService", "Error type: ${e.javaClass.simpleName}")
            e.printStackTrace()
            Result.Error(Exception("Failed to cancel order: ${e.message}"))
        }
    }

    /**
     * Delete order (soft delete - mark as cancelled)
     */
    suspend fun deleteOrder(orderId: String): Result<Unit> {
        return try {
            firestore.collection(COLLECTION_ORDERS)
                .document(orderId)
                .delete()
                .await()

            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to delete order: ${e.message}"))
        }
    }
}
