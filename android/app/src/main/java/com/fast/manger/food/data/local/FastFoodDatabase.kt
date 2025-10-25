package com.fast.manger.food.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.fast.manger.food.data.local.dao.MenuItemDao
import com.fast.manger.food.data.local.dao.OrderDao
import com.fast.manger.food.data.local.dao.UserDao
import com.fast.manger.food.data.local.entity.Converters
import com.fast.manger.food.data.local.entity.MenuItemEntity
import com.fast.manger.food.data.local.entity.OrderEntity
import com.fast.manger.food.data.local.entity.UserEntity

/**
 * Room Database for Fast Food Manager
 * Local database for offline support and caching
 */
@Database(
    entities = [
        MenuItemEntity::class,
        OrderEntity::class,
        UserEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class FastFoodDatabase : RoomDatabase() {

    /**
     * DAO for menu items
     */
    abstract fun menuItemDao(): MenuItemDao

    /**
     * DAO for orders
     */
    abstract fun orderDao(): OrderDao

    /**
     * DAO for users
     */
    abstract fun userDao(): UserDao

    companion object {
        const val DATABASE_NAME = "fast_food_database"
    }
}
