package com.fast.manger.food.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
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
    version = 2,
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

        /**
         * Migration from version 1 to 2
         * Adds restaurantId column to orders table for multi-tenant support
         */
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // Add restaurantId column to orders table
                database.execSQL("ALTER TABLE orders ADD COLUMN restaurantId TEXT")
            }
        }
    }
}
