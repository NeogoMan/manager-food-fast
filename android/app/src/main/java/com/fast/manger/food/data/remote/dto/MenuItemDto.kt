package com.fast.manger.food.data.remote.dto

import com.fast.manger.food.domain.model.MenuCategory
import com.fast.manger.food.domain.model.MenuItem
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.PropertyName

/**
 * Data Transfer Object for Menu Item from Firestore
 * Matches the Firestore document structure
 */
data class MenuItemDto(
    @PropertyName("name")
    val name: String = "",

    @PropertyName("description")
    val description: String = "",

    @PropertyName("price")
    val price: Double = 0.0,

    @PropertyName("category")
    val category: String = "",

    @PropertyName("isAvailable")
    val isAvailable: Boolean = true,

    @PropertyName("createdAt")
    val createdAt: Timestamp? = null,

    @PropertyName("updatedAt")
    val updatedAt: Timestamp? = null
) {
    /**
     * Convert DTO to Domain model
     */
    fun toDomainModel(id: String): MenuItem {
        return MenuItem(
            id = id,
            name = name,
            description = description,
            price = price,
            category = MenuCategory.fromString(category),
            isAvailable = isAvailable,
            createdAt = createdAt?.toDate()?.time ?: System.currentTimeMillis(),
            updatedAt = updatedAt?.toDate()?.time ?: System.currentTimeMillis()
        )
    }

    companion object {
        /**
         * Create DTO from Firestore DocumentSnapshot
         */
        fun fromDocument(document: DocumentSnapshot): MenuItemDto? {
            return try {
                document.toObject(MenuItemDto::class.java)
            } catch (e: Exception) {
                null
            }
        }

        /**
         * Create DTO from Domain model
         */
        fun fromDomainModel(menuItem: MenuItem): Map<String, Any> {
            return hashMapOf(
                "name" to menuItem.name,
                "description" to menuItem.description,
                "price" to menuItem.price,
                "category" to menuItem.category.toApiString(),
                "isAvailable" to menuItem.isAvailable,
                "createdAt" to Timestamp(java.util.Date(menuItem.createdAt)),
                "updatedAt" to Timestamp(java.util.Date(menuItem.updatedAt))
            )
        }
    }
}
