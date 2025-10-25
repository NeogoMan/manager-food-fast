package com.fast.manger.food.data.remote.dto

import com.fast.manger.food.domain.model.Order
import com.fast.manger.food.domain.model.OrderItem
import com.fast.manger.food.domain.model.OrderStatus
import com.fast.manger.food.domain.model.PaymentStatus
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.PropertyName

/**
 * Data Transfer Object for Order from Firestore
 */
data class OrderDto(
    @PropertyName("orderNumber")
    val orderNumber: String = "",

    @PropertyName("userId")
    val userId: String? = null,

    @PropertyName("customerName")
    val customerName: String? = null,

    @PropertyName("items")
    val items: List<OrderItemDto> = emptyList(),

    @PropertyName("totalAmount")
    val totalAmount: Double = 0.0,

    @PropertyName("itemCount")
    val itemCount: Int = 0,

    @PropertyName("notes")
    val notes: String? = null,

    @PropertyName("status")
    val status: String = "awaiting_approval",

    @PropertyName("paymentStatus")
    val paymentStatus: String = "unpaid",

    @PropertyName("paymentAmount")
    val paymentAmount: Double? = null,

    @PropertyName("changeGiven")
    val changeGiven: Double? = null,

    @PropertyName("paymentTime")
    val paymentTime: Timestamp? = null,

    @PropertyName("paymentMethod")
    val paymentMethod: String? = null,

    @PropertyName("rejectionReason")
    val rejectionReason: String? = null,

    @PropertyName("createdAt")
    val createdAt: Timestamp? = null,

    @PropertyName("updatedAt")
    val updatedAt: Timestamp? = null
) {
    /**
     * Convert DTO to Domain model
     */
    fun toDomainModel(id: String): Order {
        // Debug logging to see raw Firestore data
        android.util.Log.d("OrderDto", "Converting order $orderNumber - Status from Firestore: '$status', Payment: '$paymentStatus'")

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
            paymentTime = paymentTime?.toDate()?.time,
            paymentMethod = paymentMethod,
            rejectionReason = rejectionReason,
            createdAt = createdAt?.toDate()?.time ?: System.currentTimeMillis(),
            updatedAt = updatedAt?.toDate()?.time ?: System.currentTimeMillis()
        )
    }

    companion object {
        /**
         * Create DTO from Firestore DocumentSnapshot
         */
        fun fromDocument(document: DocumentSnapshot): OrderDto? {
            return try {
                document.toObject(OrderDto::class.java)
            } catch (e: Exception) {
                null
            }
        }

        /**
         * Create DTO from Domain model
         */
        fun fromDomainModel(order: Order): Map<String, Any> {
            return hashMapOf<String, Any>(
                "orderNumber" to order.orderNumber,
                "items" to order.items.map { OrderItemDto.fromDomainModel(it) },
                "totalAmount" to order.totalAmount,
                "itemCount" to order.itemCount,
                "status" to order.status.toApiString(),
                "paymentStatus" to order.paymentStatus.toApiString(),
                "createdAt" to Timestamp(java.util.Date(order.createdAt)),
                "updatedAt" to Timestamp(java.util.Date(order.updatedAt))
            ).apply {
                order.userId?.let { put("userId", it) }
                order.customerName?.let { put("customerName", it) }
                order.notes?.let { put("notes", it) }
                order.paymentAmount?.let { put("paymentAmount", it) }
                order.changeGiven?.let { put("changeGiven", it) }
                order.paymentTime?.let { put("paymentTime", Timestamp(java.util.Date(it))) }
                order.paymentMethod?.let { put("paymentMethod", it) }
                order.rejectionReason?.let { put("rejectionReason", it) }
            }
        }
    }
}

/**
 * DTO for Order Item (nested in OrderDto)
 */
data class OrderItemDto(
    @PropertyName("menuItemId")
    val menuItemId: String = "",

    @PropertyName("name")
    val name: String = "",

    @PropertyName("price")
    val price: Double = 0.0,

    @PropertyName("quantity")
    val quantity: Int = 0,

    @PropertyName("notes")
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
        fun fromDomainModel(item: OrderItem): Map<String, Any> {
            return hashMapOf<String, Any>(
                "menuItemId" to item.menuItemId,
                "name" to item.name,
                "price" to item.price,
                "quantity" to item.quantity
            ).apply {
                item.notes?.let { put("notes", it) }
            }
        }
    }
}
