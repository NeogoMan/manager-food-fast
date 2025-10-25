package com.fast.manger.food.domain.model

/**
 * Domain model for Order
 * Represents a customer order in the system
 */
data class Order(
    val id: String,
    val orderNumber: String,
    val userId: String? = null,
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
    REJECTED;

    companion object {
        fun fromString(value: String): OrderStatus {
            val normalizedValue = value.trim().lowercase()

            // Debug logging to see what we're getting from Firestore
            android.util.Log.d("OrderStatus", "Parsing status string: '$value' (normalized: '$normalizedValue')")

            val status = when (normalizedValue) {
                "awaiting_approval", "awaiting approval", "en_attente_approbation" -> AWAITING_APPROVAL
                "pending", "en_attente" -> PENDING
                "preparing", "en_preparation", "preparation" -> PREPARING
                "ready", "pret", "prêt" -> READY
                "completed", "complete", "terminé", "termine", "complété", "complete" -> COMPLETED
                "rejected", "rejeté", "rejete", "annulé", "annule" -> REJECTED
                else -> {
                    android.util.Log.w("OrderStatus", "Unknown status string: '$value', defaulting to PENDING")
                    PENDING
                }
            }

            android.util.Log.d("OrderStatus", "Parsed to: $status")
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
            REJECTED -> "#ef4444" // Red
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
