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
     */
    suspend fun getOrdersByUserId(userId: String): Result<List<Order>> {
        return try {
            val snapshot = firestore.collection(COLLECTION_ORDERS)
                .whereEqualTo("userId", userId)
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
     */
    fun observeOrdersByUserId(userId: String): Flow<Result<List<Order>>> = callbackFlow {
        val listenerRegistration = firestore.collection(COLLECTION_ORDERS)
            .whereEqualTo("userId", userId)
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
     */
    fun observeActiveOrdersByUserId(userId: String): Flow<Result<List<Order>>> = callbackFlow {
        val listenerRegistration = firestore.collection(COLLECTION_ORDERS)
            .whereEqualTo("userId", userId)
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
     */
    suspend fun cancelOrder(orderId: String): Result<Unit> {
        return try {
            firestore.collection(COLLECTION_ORDERS)
                .document(orderId)
                .update(
                    mapOf(
                        "status" to OrderStatus.REJECTED.toApiString(),
                        "rejectionReason" to "Cancelled by customer",
                        "updatedAt" to Timestamp.now()
                    )
                )
                .await()

            Result.Success(Unit)
        } catch (e: Exception) {
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
