package com.fast.manger.food.data.local.dao

import androidx.room.*
import com.fast.manger.food.data.local.entity.MenuItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MenuItemDao {
    /**
     * Get all menu items as Flow (reactive)
     */
    @Query("SELECT * FROM menu_items ORDER BY name ASC")
    fun observeAll(): Flow<List<MenuItemEntity>>

    /**
     * Get all menu items (one-time)
     */
    @Query("SELECT * FROM menu_items ORDER BY name ASC")
    suspend fun getAll(): List<MenuItemEntity>

    /**
     * Get menu items by category
     */
    @Query("SELECT * FROM menu_items WHERE category = :category ORDER BY name ASC")
    suspend fun getByCategory(category: String): List<MenuItemEntity>

    /**
     * Get menu items by category as Flow
     */
    @Query("SELECT * FROM menu_items WHERE category = :category ORDER BY name ASC")
    fun observeByCategory(category: String): Flow<List<MenuItemEntity>>

    /**
     * Get only available menu items
     */
    @Query("SELECT * FROM menu_items WHERE isAvailable = 1 ORDER BY name ASC")
    suspend fun getAvailable(): List<MenuItemEntity>

    /**
     * Get only available menu items as Flow
     */
    @Query("SELECT * FROM menu_items WHERE isAvailable = 1 ORDER BY name ASC")
    fun observeAvailable(): Flow<List<MenuItemEntity>>

    /**
     * Get menu item by ID
     */
    @Query("SELECT * FROM menu_items WHERE id = :id")
    suspend fun getById(id: String): MenuItemEntity?

    /**
     * Search menu items by name
     */
    @Query("SELECT * FROM menu_items WHERE name LIKE '%' || :query || '%' ORDER BY name ASC")
    suspend fun search(query: String): List<MenuItemEntity>

    /**
     * Insert menu item (replace if exists)
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(menuItem: MenuItemEntity)

    /**
     * Insert multiple menu items
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(menuItems: List<MenuItemEntity>)

    /**
     * Update menu item
     */
    @Update
    suspend fun update(menuItem: MenuItemEntity)

    /**
     * Delete menu item
     */
    @Delete
    suspend fun delete(menuItem: MenuItemEntity)

    /**
     * Delete menu item by ID
     */
    @Query("DELETE FROM menu_items WHERE id = :id")
    suspend fun deleteById(id: String)

    /**
     * Delete all menu items
     */
    @Query("DELETE FROM menu_items")
    suspend fun deleteAll()

    /**
     * Get count of menu items
     */
    @Query("SELECT COUNT(*) FROM menu_items")
    suspend fun getCount(): Int
}
