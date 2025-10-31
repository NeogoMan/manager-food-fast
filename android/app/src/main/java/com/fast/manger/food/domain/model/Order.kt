package com.fast.manger.food.domain.model

/**
 * Domain model for Order
 * Represents a customer order in the system
 */
data class Order(
    val id: String,
    val orderNumber: String,
    val userId: String? = null,
    val restaurantId: String? = null,
    val customerName: String? = null,
    val items: List<OrderItem>,
    val totalAmount: Double,
    val itemCount: Int,
    val notes: String? = null,
    val status: OrderStatus,
    val paymentStatus: PaymentStatus,
    val paymentAmount: Double? = null,
    val changeGiven: Double? = null,
    val paymentTime: Long? = null,
    val paymentMethod: String? = null,
    val rejectionReason: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun canBeCancelled(): Boolean {
        return status in listOf(
            OrderStatus.AWAITING_APPROVAL,
            OrderStatus.PENDING
        ) && paymentStatus == PaymentStatus.UNPAID
    }

    fun isActive(): Boolean {
        return status !in listOf(
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED,
            OrderStatus.REJECTED
        )
    }
}

data class OrderItem(
    val menuItemId: String,
    val name: String,
    val price: Double,
    val quantity: Int,
    val notes: String? = null
) {
    val subtotal: Double
        get() = price * quantity
}

enum class OrderStatus {
    AWAITING_APPROVAL,
    PENDING,
    PREPARING,
    READY,
    COMPLETED,
    CANCELLED,
    REJECTED;

    companion object {
        fun fromString(value: String): OrderStatus {
            val normalizedValue = value.trim().lowercase()

            val status = when (normalizedValue) {
                "awaiting_approval", "awaiting approval", "en_attente_approbation" -> AWAITING_APPROVAL
                "pending", "en_attente" -> PENDING
                "preparing", "en_preparation", "preparation" -> PREPARING
                "ready", "pret", "prêt" -> READY
                "completed", "complete", "terminé", "termine", "complété", "complete" -> COMPLETED
                "cancelled", "annulé", "annule" -> CANCELLED
                "rejected", "rejeté", "rejete", "refusé", "refuse" -> REJECTED
                else -> PENDING
            }

            return status
        }
    }

    fun toApiString(): String = name.lowercase()

    fun getDisplayName(): String {
        return when (this) {
            AWAITING_APPROVAL -> "En attente d'approbation"
            PENDING -> "En attente"
            PREPARING -> "En préparation"
            READY -> "Prêt"
            COMPLETED -> "Complété"
            CANCELLED -> "Annulé"
            REJECTED -> "Rejeté"
        }
    }

    fun getStatusColor(): String {
        return when (this) {
            AWAITING_APPROVAL -> "#f59e0b" // Orange
            PENDING -> "#3b82f6" // Blue
            PREPARING -> "#6366f1" // Indigo
            READY -> "#10b981" // Green
            COMPLETED -> "#6b7280" // Gray
            CANCELLED -> "#dc2626" // Dark Red
            REJECTED -> "#f59e0b" // Orange
        }
    }
}

enum class PaymentStatus {
    UNPAID,
    PAID;

    companion object {
        fun fromString(value: String): PaymentStatus {
            return when (value.lowercase()) {
                "paid" -> PAID
                "unpaid" -> UNPAID
                else -> UNPAID
            }
        }
    }

    fun toApiString(): String = name.lowercase()

    fun getDisplayName(): String {
        return when (this) {
            PAID -> "Payé"
            UNPAID -> "Non payé"
        }
    }
}
