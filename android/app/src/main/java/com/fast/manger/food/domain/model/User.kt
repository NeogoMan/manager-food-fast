package com.fast.manger.food.domain.model

/**
 * Domain model for User
 * Represents a user in the application
 * Supports multi-restaurant access for clients
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
    // Multi-restaurant support
    val restaurantId: String? = null, // Legacy field - kept for backwards compatibility
    val restaurantIds: List<String> = emptyList(), // NEW: List of restaurants user has access to
    val activeRestaurantId: String? = null, // NEW: Currently selected restaurant
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    /**
     * Check if user has access to multiple restaurants
     */
    fun hasMultipleRestaurants(): Boolean = restaurantIds.size > 1

    /**
     * Check if user has access to a specific restaurant
     */
    fun hasAccessTo(restaurantId: String): Boolean = restaurantIds.contains(restaurantId)

    /**
     * Get the restaurant ID to use (active or first available)
     */
    fun getCurrentRestaurantId(): String? = activeRestaurantId ?: restaurantIds.firstOrNull()
}

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
