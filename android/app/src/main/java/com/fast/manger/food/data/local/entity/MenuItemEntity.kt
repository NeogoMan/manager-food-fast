package com.fast.manger.food.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.fast.manger.food.domain.model.MenuCategory
import com.fast.manger.food.domain.model.MenuItem

@Entity(tableName = "menu_items")
data class MenuItemEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val category: String,
    val isAvailable: Boolean,
    val createdAt: Long,
    val updatedAt: Long
) {
    fun toDomainModel(): MenuItem {
        return MenuItem(
            id = id,
            name = name,
            description = description,
            price = price,
            category = MenuCategory.fromString(category),
            isAvailable = isAvailable,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }

    companion object {
        fun fromDomainModel(menuItem: MenuItem): MenuItemEntity {
            return MenuItemEntity(
                id = menuItem.id,
                name = menuItem.name,
                description = menuItem.description,
                price = menuItem.price,
                category = menuItem.category.toApiString(),
                isAvailable = menuItem.isAvailable,
                createdAt = menuItem.createdAt,
                updatedAt = menuItem.updatedAt
            )
        }
    }
}
