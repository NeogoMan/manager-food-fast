package com.fast.manger.food.domain.model

/**
 * Domain model for User
 * Represents a user in the application
 */
data class User(
    val id: String,
    val username: String,
    val name: String,
    val phone: String? = null,
    val role: UserRole,
    val isActive: Boolean = true,
    val fcmToken: String? = null,
    val fcmTokenUpdatedAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

enum class UserRole {
    CLIENT,
    MANAGER,
    CASHIER,
    COOK;

    fun getDisplayName(): String {
        return when (this) {
            CLIENT -> "Client"
            MANAGER -> "Gestionnaire"
            CASHIER -> "Caissier"
            COOK -> "Cuisinier"
        }
    }

    companion object {
        fun fromString(value: String): UserRole {
            return when (value.lowercase()) {
                "client" -> CLIENT
                "manager" -> MANAGER
                "cashier" -> CASHIER
                "cook" -> COOK
                else -> CLIENT
            }
        }
    }

    fun toApiString(): String = name.lowercase()
}
