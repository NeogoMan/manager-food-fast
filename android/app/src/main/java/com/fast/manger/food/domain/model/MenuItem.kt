package com.fast.manger.food.domain.model

/**
 * Domain model for Menu Item
 * Represents a product available in the menu
 */
data class MenuItem(
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val category: MenuCategory,
    val isAvailable: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

enum class MenuCategory {
    BURGERS,
    SIDES,
    DRINKS,
    DESSERTS,
    SALADS,
    APPETIZERS;

    companion object {
        fun fromString(value: String): MenuCategory {
            return when (value.lowercase()) {
                "burgers" -> BURGERS
                "sides" -> SIDES
                "drinks" -> DRINKS
                "desserts" -> DESSERTS
                "salads" -> SALADS
                "appetizers" -> APPETIZERS
                else -> BURGERS
            }
        }
    }

    fun toApiString(): String = name.lowercase()

    fun getDisplayName(): String {
        return when (this) {
            BURGERS -> "Burgers"
            SIDES -> "Accompagnements"
            DRINKS -> "Boissons"
            DESSERTS -> "Desserts"
            SALADS -> "Salades"
            APPETIZERS -> "Entrées"
        }
    }
}
