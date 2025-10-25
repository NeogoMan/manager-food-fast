package com.fast.manger.food.data.local.entity

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.fast.manger.food.domain.model.Order
import com.fast.manger.food.domain.model.OrderItem
import com.fast.manger.food.domain.model.OrderStatus
import com.fast.manger.food.domain.model.PaymentStatus

@Entity(tableName = "orders")
@TypeConverters(Converters::class)
data class OrderEntity(
    @PrimaryKey
    val id: String,
    val orderNumber: String,
    val userId: String? = null,
    val customerName: String? = null,
    val items: List<OrderItemEntity>,
    val totalAmount: Double,
    val itemCount: Int,
    val notes: String? = null,
    val status: String,
    val paymentStatus: String,
    val paymentAmount: Double? = null,
    val changeGiven: Double? = null,
    val paymentTime: Long? = null,
    val paymentMethod: String? = null,
    val rejectionReason: String? = null,
    val createdAt: Long,
    val updatedAt: Long
) {
    fun toDomainModel(): Order {
        // Debug logging to see what's in Room database
        android.util.Log.d("OrderEntity", "Converting from Room DB - Order $orderNumber - Status in DB: '$status'")

        return Order(
            id = id,
            orderNumber = orderNumber,
            userId = userId,
            customerName = customerName,
            items = items.map { it.toDomainModel() },
            totalAmount = totalAmount,
            itemCount = itemCount,
            notes = notes,
            status = OrderStatus.fromString(status),
            paymentStatus = PaymentStatus.fromString(paymentStatus),
            paymentAmount = paymentAmount,
            changeGiven = changeGiven,
            paymentTime = paymentTime,
            paymentMethod = paymentMethod,
            rejectionReason = rejectionReason,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }

    companion object {
        fun fromDomainModel(order: Order): OrderEntity {
            return OrderEntity(
                id = order.id,
                orderNumber = order.orderNumber,
                userId = order.userId,
                customerName = order.customerName,
                items = order.items.map { OrderItemEntity.fromDomainModel(it) },
                totalAmount = order.totalAmount,
                itemCount = order.itemCount,
                notes = order.notes,
                status = order.status.toApiString(),
                paymentStatus = order.paymentStatus.toApiString(),
                paymentAmount = order.paymentAmount,
                changeGiven = order.changeGiven,
                paymentTime = order.paymentTime,
                paymentMethod = order.paymentMethod,
                rejectionReason = order.rejectionReason,
                createdAt = order.createdAt,
                updatedAt = order.updatedAt
            )
        }
    }
}

data class OrderItemEntity(
    val menuItemId: String,
    val name: String,
    val price: Double,
    val quantity: Int,
    val notes: String? = null
) {
    fun toDomainModel(): OrderItem {
        return OrderItem(
            menuItemId = menuItemId,
            name = name,
            price = price,
            quantity = quantity,
            notes = notes
        )
    }

    companion object {
        fun fromDomainModel(item: OrderItem): OrderItemEntity {
            return OrderItemEntity(
                menuItemId = item.menuItemId,
                name = item.name,
                price = item.price,
                quantity = item.quantity,
                notes = item.notes
            )
        }
    }
}
