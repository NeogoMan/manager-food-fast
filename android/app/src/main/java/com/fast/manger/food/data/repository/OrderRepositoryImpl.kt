package com.fast.manger.food.data.repository

import android.content.Context
import com.fast.manger.food.data.local.dao.OrderDao
import com.fast.manger.food.data.local.entity.OrderEntity
import com.fast.manger.food.data.remote.api.FirebaseAuthService
import com.fast.manger.food.data.remote.api.FirestoreOrderService
import com.fast.manger.food.domain.model.Order
import com.fast.manger.food.domain.model.OrderStatus
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.OrderRepository
import com.fast.manger.food.util.NotificationHelper
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Order Repository Implementation
 * Offline-first with real-time Firestore sync
 */
@Singleton
class OrderRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val orderDao: OrderDao,
    private val firestoreOrderService: FirestoreOrderService,
    private val firebaseAuthService: FirebaseAuthService
) : OrderRepository {

    /**
     * Place a new order
     * Creates order in Firestore and caches locally
     */
    override suspend fun placeOrder(order: Order): Result<String> {
        return try {
            // Create order in Firestore
            when (val result = firestoreOrderService.createOrder(order)) {
                is Result.Success -> {
                    val orderId = result.data
                    // Cache locally with the generated ID
                    val orderWithId = order.copy(id = orderId)
                    orderDao.insert(OrderEntity.fromDomainModel(orderWithId))
                    Result.Success(orderId)
                }
                is Result.Error -> result
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Failed to place order: ${e.message}"))
        }
    }

    /**
     * Get orders for current user
     */
    override suspend fun getMyOrders(): Result<List<Order>> {
        return try {
            val userId = firebaseAuthService.getCurrentUserId()
                ?: return Result.Error(Exception("User not authenticated"))

            // Try cache first
            val cachedOrders = orderDao.getByUserId(userId).map { it.toDomainModel() }

            if (cachedOrders.isNotEmpty()) {
                // Sync in background
                syncOrdersInBackground(userId)
                return Result.Success(cachedOrders)
            }

            // Fetch from Firestore if cache is empty
            when (val result = firestoreOrderService.getOrdersByUserId(userId)) {
                is Result.Success -> {
                    val entities = result.data.map { OrderEntity.fromDomainModel(it) }
                    orderDao.insertAll(entities)
                    Result.Success(result.data)
                }
                is Result.Error -> result
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get orders: ${e.message}"))
        }
    }

    /**
     * Get active orders for current user (not completed/rejected)
     */
    override suspend fun getMyActiveOrders(): Result<List<Order>> {
        return try {
            val userId = firebaseAuthService.getCurrentUserId()
                ?: return Result.Error(Exception("User not authenticated"))

            val cachedOrders = orderDao.getByUserId(userId)
                .map { it.toDomainModel() }
                .filter { it.isActive() }

            Result.Success(cachedOrders)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get active orders: ${e.message}"))
        }
    }

    /**
     * Get order by ID
     */
    override suspend fun getOrderById(orderId: String): Result<Order> {
        return try {
            // Try cache first
            val cachedOrder = orderDao.getById(orderId)
            if (cachedOrder != null) {
                return Result.Success(cachedOrder.toDomainModel())
            }

            // Fetch from Firestore
            when (val result = firestoreOrderService.getOrderById(orderId)) {
                is Result.Success -> {
                    orderDao.insert(OrderEntity.fromDomainModel(result.data))
                    Result.Success(result.data)
                }
                is Result.Error -> result
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get order: ${e.message}"))
        }
    }

    /**
     * Get orders by status
     */
    override suspend fun getOrdersByStatus(status: OrderStatus): Result<List<Order>> {
        return try {
            val cachedOrders = orderDao.getByStatus(status.toApiString())
                .map { it.toDomainModel() }

            Result.Success(cachedOrders)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get orders by status: ${e.message}"))
        }
    }

    /**
     * Observe orders for current user with real-time updates
     */
    override fun observeMyOrders(): Flow<Result<List<Order>>> {
        val userId = firebaseAuthService.getCurrentUserId()
            ?: return kotlinx.coroutines.flow.flow {
                emit(Result.Error(Exception("User not authenticated")))
            }

        return orderDao.observeByUserId(userId)
            .map<List<OrderEntity>, Result<List<Order>>> { entities ->
                Result.Success(entities.map { it.toDomainModel() })
            }
            .onStart {
                // Start Firestore real-time sync
                startFirestoreOrderSync(userId)
            }
            .catch { e ->
                emit(Result.Error(Exception("Orders observation error: ${e.message}")))
            }
    }

    /**
     * Observe active orders for current user (real-time)
     */
    override fun observeMyActiveOrders(): Flow<Result<List<Order>>> {
        val userId = firebaseAuthService.getCurrentUserId()
            ?: return kotlinx.coroutines.flow.flow {
                emit(Result.Error(Exception("User not authenticated")))
            }

        return orderDao.observeActiveOrdersByUser(userId)
            .map<List<OrderEntity>, Result<List<Order>>> { entities ->
                Result.Success(entities.map { it.toDomainModel() })
            }
            .onStart {
                startFirestoreOrderSync(userId)
            }
            .catch { e ->
                emit(Result.Error(Exception("Active orders observation error: ${e.message}")))
            }
    }

    /**
     * Observe single order by ID with real-time updates
     */
    override fun observeOrderById(orderId: String): Flow<Result<Order>> {
        return orderDao.observeById(orderId)
            .map<OrderEntity?, Result<Order>> { entity ->
                if (entity != null) {
                    Result.Success(entity.toDomainModel())
                } else {
                    Result.Error(Exception("Order not found"))
                }
            }
            .onStart {
                // Start Firestore sync for this specific order
                startSingleOrderSync(orderId)
            }
            .catch { e ->
                emit(Result.Error(Exception("Order observation error: ${e.message}")))
            }
    }

    /**
     * Cancel order (client action)
     */
    override suspend fun cancelOrder(orderId: String): Result<Unit> {
        return try {
            // Cancel in Firestore
            when (val result = firestoreOrderService.cancelOrder(orderId)) {
                is Result.Success -> {
                    // Update local cache
                    orderDao.updateStatus(
                        orderId,
                        OrderStatus.REJECTED.toApiString(),
                        System.currentTimeMillis()
                    )
                    Result.Success(Unit)
                }
                is Result.Error -> result
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Failed to cancel order: ${e.message}"))
        }
    }

    /**
     * Update order status
     */
    override suspend fun updateOrderStatus(orderId: String, status: OrderStatus): Result<Unit> {
        return try {
            // Update in Firestore
            when (val result = firestoreOrderService.updateOrderStatus(orderId, status)) {
                is Result.Success -> {
                    // Update local cache
                    orderDao.updateStatus(
                        orderId,
                        status.toApiString(),
                        System.currentTimeMillis()
                    )
                    Result.Success(Unit)
                }
                is Result.Error -> result
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Failed to update order status: ${e.message}"))
        }
    }

    /**
     * Sync orders from Firestore to local database
     */
    override suspend fun syncOrders(): Result<Unit> {
        return try {
            val userId = firebaseAuthService.getCurrentUserId()
                ?: return Result.Error(Exception("User not authenticated"))

            when (val result = firestoreOrderService.getOrdersByUserId(userId)) {
                is Result.Success -> {
                    val entities = result.data.map { OrderEntity.fromDomainModel(it) }
                    orderDao.insertAll(entities)
                    Result.Success(Unit)
                }
                is Result.Error -> result as Result<Unit>
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Order sync failed: ${e.message}"))
        }
    }

    /**
     * Start Firestore real-time sync for user's orders
     */
    private fun startFirestoreOrderSync(userId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            firestoreOrderService.observeOrdersByUserId(userId).collect { result ->
                if (result is Result.Success) {
                    android.util.Log.d("OrderRepository", "Firestore sync received ${result.data.size} orders")

                    // For each order, check if status changed before updating
                    result.data.forEach { newOrder ->
                        val existingOrder = orderDao.getById(newOrder.id)

                        // Detect status change
                        if (existingOrder != null) {
                            val oldStatus = OrderStatus.fromString(existingOrder.status)
                            val newStatus = newOrder.status

                            android.util.Log.d("OrderRepository", "Order ${newOrder.orderNumber}: Old status='${existingOrder.status}' ($oldStatus) → New status='${newOrder.status.toApiString()}' ($newStatus)")

                            // Show notification if status changed to important states
                            if (oldStatus != newStatus && shouldNotifyForStatus(newStatus)) {
                                android.util.Log.d("OrderRepository", "Showing notification for status change to $newStatus")
                                NotificationHelper.showOrderStatusNotification(
                                    context = context,
                                    orderId = newOrder.id,
                                    orderNumber = newOrder.orderNumber,
                                    status = newStatus,
                                    rejectionReason = newOrder.rejectionReason
                                )
                            }
                        } else {
                            android.util.Log.d("OrderRepository", "New order ${newOrder.orderNumber} with status ${newOrder.status}")
                        }
                    }

                    // Update all orders in database
                    val entities = result.data.map { OrderEntity.fromDomainModel(it) }
                    orderDao.insertAll(entities)
                    android.util.Log.d("OrderRepository", "Updated ${entities.size} orders in Room database")
                }
            }
        }
    }

    /**
     * Determine if we should show notification for this status
     * Show for: PREPARING, READY, COMPLETED, REJECTED
     * Don't show for: AWAITING_APPROVAL, PENDING (less critical)
     */
    private fun shouldNotifyForStatus(status: OrderStatus): Boolean {
        return status in listOf(
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.COMPLETED,
            OrderStatus.REJECTED
        )
    }

    /**
     * Start Firestore sync for a single order
     */
    private fun startSingleOrderSync(orderId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            firestoreOrderService.observeOrderById(orderId).collect { result ->
                if (result is Result.Success) {
                    val newOrder = result.data
                    val existingOrder = orderDao.getById(orderId)

                    // Detect status change for single order
                    if (existingOrder != null) {
                        val oldStatus = OrderStatus.fromString(existingOrder.status)
                        val newStatus = newOrder.status

                        // Show notification if status changed to important states
                        if (oldStatus != newStatus && shouldNotifyForStatus(newStatus)) {
                            NotificationHelper.showOrderStatusNotification(
                                context = context,
                                orderId = newOrder.id,
                                orderNumber = newOrder.orderNumber,
                                status = newStatus,
                                rejectionReason = newOrder.rejectionReason
                            )
                        }
                    }

                    // Update order in database
                    orderDao.insert(OrderEntity.fromDomainModel(newOrder))
                }
            }
        }
    }

    /**
     * Sync orders in background
     */
    private fun syncOrdersInBackground(userId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            syncOrders()
        }
    }
}
