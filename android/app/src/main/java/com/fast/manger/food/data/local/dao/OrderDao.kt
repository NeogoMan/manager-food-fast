package com.fast.manger.food.data.local.dao

import androidx.room.*
import com.fast.manger.food.data.local.entity.OrderEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface OrderDao {
    /**
     * Observe all orders (reactive)
     */
    @Query("SELECT * FROM orders ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<OrderEntity>>

    /**
     * Get all orders (one-time)
     */
    @Query("SELECT * FROM orders ORDER BY createdAt DESC")
    suspend fun getAll(): List<OrderEntity>

    /**
     * Observe orders by user ID
     */
    @Query("SELECT * FROM orders WHERE userId = :userId ORDER BY createdAt DESC")
    fun observeByUserId(userId: String): Flow<List<OrderEntity>>

    /**
     * Get orders by user ID (one-time)
     */
    @Query("SELECT * FROM orders WHERE userId = :userId ORDER BY createdAt DESC")
    suspend fun getByUserId(userId: String): List<OrderEntity>

    /**
     * Observe orders by status
     */
    @Query("SELECT * FROM orders WHERE status = :status ORDER BY createdAt DESC")
    fun observeByStatus(status: String): Flow<List<OrderEntity>>

    /**
     * Get orders by status (one-time)
     */
    @Query("SELECT * FROM orders WHERE status = :status ORDER BY createdAt DESC")
    suspend fun getByStatus(status: String): List<OrderEntity>

    /**
     * Observe active orders (not completed or rejected)
     */
    @Query("SELECT * FROM orders WHERE status NOT IN ('completed', 'rejected') ORDER BY createdAt DESC")
    fun observeActiveOrders(): Flow<List<OrderEntity>>

    /**
     * Get active orders for a user
     */
    @Query("SELECT * FROM orders WHERE userId = :userId AND status NOT IN ('completed', 'rejected') ORDER BY createdAt DESC")
    fun observeActiveOrdersByUser(userId: String): Flow<List<OrderEntity>>

    /**
     * Get order by ID
     */
    @Query("SELECT * FROM orders WHERE id = :id")
    suspend fun getById(id: String): OrderEntity?

    /**
     * Observe order by ID
     */
    @Query("SELECT * FROM orders WHERE id = :id")
    fun observeById(id: String): Flow<OrderEntity?>

    /**
     * Get order by order number
     */
    @Query("SELECT * FROM orders WHERE orderNumber = :orderNumber")
    suspend fun getByOrderNumber(orderNumber: String): OrderEntity?

    /**
     * Get orders created after timestamp
     */
    @Query("SELECT * FROM orders WHERE createdAt > :timestamp ORDER BY createdAt DESC")
    suspend fun getOrdersAfter(timestamp: Long): List<OrderEntity>

    /**
     * Get orders by date range
     */
    @Query("SELECT * FROM orders WHERE createdAt BETWEEN :startTime AND :endTime ORDER BY createdAt DESC")
    suspend fun getOrdersByDateRange(startTime: Long, endTime: Long): List<OrderEntity>

    /**
     * Insert order (replace if exists)
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(order: OrderEntity)

    /**
     * Insert multiple orders
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(orders: List<OrderEntity>)

    /**
     * Update order
     */
    @Update
    suspend fun update(order: OrderEntity)

    /**
     * Update order status
     */
    @Query("UPDATE orders SET status = :status, updatedAt = :updatedAt WHERE id = :orderId")
    suspend fun updateStatus(orderId: String, status: String, updatedAt: Long)

    /**
     * Update payment status
     */
    @Query("UPDATE orders SET paymentStatus = :paymentStatus, paymentAmount = :amount, paymentTime = :time, paymentMethod = :method, updatedAt = :updatedAt WHERE id = :orderId")
    suspend fun updatePayment(
        orderId: String,
        paymentStatus: String,
        amount: Double?,
        time: Long?,
        method: String?,
        updatedAt: Long
    )

    /**
     * Delete order
     */
    @Delete
    suspend fun delete(order: OrderEntity)

    /**
     * Delete order by ID
     */
    @Query("DELETE FROM orders WHERE id = :id")
    suspend fun deleteById(id: String)

    /**
     * Delete all orders
     */
    @Query("DELETE FROM orders")
    suspend fun deleteAll()

    /**
     * Delete completed orders older than timestamp
     */
    @Query("DELETE FROM orders WHERE status = 'completed' AND createdAt < :timestamp")
    suspend fun deleteCompletedOrdersBefore(timestamp: Long)

    /**
     * Get count of orders
     */
    @Query("SELECT COUNT(*) FROM orders")
    suspend fun getCount(): Int

    /**
     * Get count of orders by status
     */
    @Query("SELECT COUNT(*) FROM orders WHERE status = :status")
    suspend fun getCountByStatus(status: String): Int
}
