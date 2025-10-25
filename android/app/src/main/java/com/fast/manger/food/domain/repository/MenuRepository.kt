package com.fast.manger.food.domain.repository

import com.fast.manger.food.domain.model.MenuCategory
import com.fast.manger.food.domain.model.MenuItem
import com.fast.manger.food.domain.model.Result
import kotlinx.coroutines.flow.Flow

/**
 * Menu Repository Interface
 * Defines contract for menu operations
 */
interface MenuRepository {
    /**
     * Get all menu items (from cache or network)
     */
    suspend fun getMenuItems(forceRefresh: Boolean = false): Result<List<MenuItem>>

    /**
     * Get menu items by category
     */
    suspend fun getMenuItemsByCategory(category: MenuCategory): Result<List<MenuItem>>

    /**
     * Get only available menu items
     */
    suspend fun getAvailableMenuItems(): Result<List<MenuItem>>

    /**
     * Get menu item by ID
     */
    suspend fun getMenuItemById(id: String): Result<MenuItem>

    /**
     * Search menu items by name
     */
    suspend fun searchMenuItems(query: String): Result<List<MenuItem>>

    /**
     * Observe all menu items (real-time updates)
     */
    fun observeMenuItems(): Flow<Result<List<MenuItem>>>

    /**
     * Observe available menu items (real-time updates)
     */
    fun observeAvailableMenuItems(): Flow<Result<List<MenuItem>>>

    /**
     * Observe menu items by category (real-time updates)
     */
    fun observeMenuItemsByCategory(category: MenuCategory): Flow<Result<List<MenuItem>>>

    /**
     * Sync menu from Firestore to local database
     */
    suspend fun syncMenu(): Result<Unit>
}
