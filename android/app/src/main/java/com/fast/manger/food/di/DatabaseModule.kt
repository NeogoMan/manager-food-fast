package com.fast.manger.food.di

import android.content.Context
import androidx.room.Room
import com.fast.manger.food.data.local.FastFoodDatabase
import com.fast.manger.food.data.local.dao.MenuItemDao
import com.fast.manger.food.data.local.dao.OrderDao
import com.fast.manger.food.data.local.dao.UserDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Database Module - Provides Room database and DAOs
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    /**
     * Provides Room database instance
     * Database name: fast_food_db
     */
    @Provides
    @Singleton
    fun provideFastFoodDatabase(@ApplicationContext context: Context): FastFoodDatabase {
        return Room.databaseBuilder(
            context,
            FastFoodDatabase::class.java,
            "fast_food_db"
        )
            .fallbackToDestructiveMigration() // For development - remove in production
            .build()
    }

    /**
     * Provides MenuItemDao for menu operations
     */
    @Provides
    @Singleton
    fun provideMenuItemDao(database: FastFoodDatabase): MenuItemDao {
        return database.menuItemDao()
    }

    /**
     * Provides OrderDao for order operations
     */
    @Provides
    @Singleton
    fun provideOrderDao(database: FastFoodDatabase): OrderDao {
        return database.orderDao()
    }

    /**
     * Provides UserDao for user operations
     */
    @Provides
    @Singleton
    fun provideUserDao(database: FastFoodDatabase): UserDao {
        return database.userDao()
    }
}
