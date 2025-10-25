package com.fast.manger.food.data.repository

import com.fast.manger.food.data.local.dao.MenuItemDao
import com.fast.manger.food.data.local.entity.MenuItemEntity
import com.fast.manger.food.data.remote.api.FirestoreMenuService
import com.fast.manger.food.domain.model.MenuCategory
import com.fast.manger.food.domain.model.MenuItem
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.MenuRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Menu Repository Implementation
 * Offline-first strategy: Room is the single source of truth
 * Firestore provides real-time updates that sync to Room
 */
@Singleton
class MenuRepositoryImpl @Inject constructor(
    private val menuItemDao: MenuItemDao,
    private val firestoreMenuService: FirestoreMenuService
) : MenuRepository {

    /**
     * Get all menu items
     * Returns cached data immediately, then syncs with Firestore if forceRefresh
     */
    override suspend fun getMenuItems(forceRefresh: Boolean): Result<List<MenuItem>> {
        return try {
            // Get from local cache first
            val cachedItems = menuItemDao.getAll().map { it.toDomainModel() }

            if (!forceRefresh && cachedItems.isNotEmpty()) {
                // Sync in background without waiting
                syncMenuInBackground()
                return Result.Success(cachedItems)
            }

            // Force refresh or cache is empty - fetch from Firestore
            when (val result = firestoreMenuService.getMenuItems()) {
                is Result.Success -> {
                    // Update local cache
                    val entities = result.data.map { MenuItemEntity.fromDomainModel(it) }
                    menuItemDao.insertAll(entities)
                    Result.Success(result.data)
                }
                is Result.Error -> {
                    // Return cached data if available, even on error
                    if (cachedItems.isNotEmpty()) {
                        Result.Success(cachedItems)
                    } else {
                        result
                    }
                }
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            // Fallback to cache on any error
            try {
                val cachedItems = menuItemDao.getAll().map { it.toDomainModel() }
                if (cachedItems.isNotEmpty()) {
                    Result.Success(cachedItems)
                } else {
                    Result.Error(Exception("No menu data available: ${e.message}"))
                }
            } catch (cacheError: Exception) {
                Result.Error(Exception("Failed to get menu: ${e.message}"))
            }
        }
    }

    /**
     * Get menu items by category
     */
    override suspend fun getMenuItemsByCategory(category: MenuCategory): Result<List<MenuItem>> {
        return try {
            // Get from local cache
            val cachedItems = menuItemDao.getByCategory(category.toApiString())
                .map { it.toDomainModel() }

            if (cachedItems.isNotEmpty()) {
                return Result.Success(cachedItems)
            }

            // Fetch from Firestore if cache is empty
            when (val result = firestoreMenuService.getMenuItemsByCategory(category.toApiString())) {
                is Result.Success -> {
                    val entities = result.data.map { MenuItemEntity.fromDomainModel(it) }
                    menuItemDao.insertAll(entities)
                    Result.Success(result.data)
                }
                is Result.Error -> result
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get menu by category: ${e.message}"))
        }
    }

    /**
     * Get only available menu items
     */
    override suspend fun getAvailableMenuItems(): Result<List<MenuItem>> {
        return try {
            val cachedItems = menuItemDao.getAvailable().map { it.toDomainModel() }

            if (cachedItems.isNotEmpty()) {
                return Result.Success(cachedItems)
            }

            // Fetch from Firestore if cache is empty
            when (val result = firestoreMenuService.getAvailableMenuItems()) {
                is Result.Success -> {
                    val entities = result.data.map { MenuItemEntity.fromDomainModel(it) }
                    menuItemDao.insertAll(entities)
                    Result.Success(result.data)
                }
                is Result.Error -> result
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get available menu: ${e.message}"))
        }
    }

    /**
     * Get menu item by ID
     */
    override suspend fun getMenuItemById(id: String): Result<MenuItem> {
        return try {
            // Try cache first
            val cachedItem = menuItemDao.getById(id)
            if (cachedItem != null) {
                return Result.Success(cachedItem.toDomainModel())
            }

            // Fetch from Firestore
            when (val result = firestoreMenuService.getMenuItemById(id)) {
                is Result.Success -> {
                    menuItemDao.insert(MenuItemEntity.fromDomainModel(result.data))
                    Result.Success(result.data)
                }
                is Result.Error -> result
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Failed to get menu item: ${e.message}"))
        }
    }

    /**
     * Search menu items by name (local search for better performance)
     */
    override suspend fun searchMenuItems(query: String): Result<List<MenuItem>> {
        return try {
            val results = menuItemDao.search(query).map { it.toDomainModel() }
            Result.Success(results)
        } catch (e: Exception) {
            Result.Error(Exception("Search failed: ${e.message}"))
        }
    }

    /**
     * Observe all menu items with real-time Firestore updates
     * Room is the single source of truth, Firestore updates sync to Room
     */
    override fun observeMenuItems(): Flow<Result<List<MenuItem>>> {
        return menuItemDao.observeAll()
            .map<List<MenuItemEntity>, Result<List<MenuItem>>> { entities ->
                Result.Success(entities.map { it.toDomainModel() })
            }
            .onStart {
                // Start Firestore listener to sync updates to Room
                startFirestoreSync()
            }
            .catch { e ->
                emit(Result.Error(Exception("Menu observation error: ${e.message}")))
            }
    }

    /**
     * Observe available menu items with real-time updates
     */
    override fun observeAvailableMenuItems(): Flow<Result<List<MenuItem>>> {
        return menuItemDao.observeAvailable()
            .map<List<MenuItemEntity>, Result<List<MenuItem>>> { entities ->
                Result.Success(entities.map { it.toDomainModel() })
            }
            .onStart {
                startFirestoreSync()
            }
            .catch { e ->
                emit(Result.Error(Exception("Menu observation error: ${e.message}")))
            }
    }

    /**
     * Observe menu items by category with real-time updates
     */
    override fun observeMenuItemsByCategory(category: MenuCategory): Flow<Result<List<MenuItem>>> {
        return menuItemDao.observeByCategory(category.toApiString())
            .map<List<MenuItemEntity>, Result<List<MenuItem>>> { entities ->
                Result.Success(entities.map { it.toDomainModel() })
            }
            .onStart {
                startFirestoreSync()
            }
            .catch { e ->
                emit(Result.Error(Exception("Menu observation error: ${e.message}")))
            }
    }

    /**
     * Sync menu from Firestore to Room
     */
    override suspend fun syncMenu(): Result<Unit> {
        return try {
            when (val result = firestoreMenuService.getMenuItems()) {
                is Result.Success -> {
                    val entities = result.data.map { MenuItemEntity.fromDomainModel(it) }
                    menuItemDao.insertAll(entities)
                    Result.Success(Unit)
                }
                is Result.Error -> result as Result<Unit>
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(Exception("Menu sync failed: ${e.message}"))
        }
    }

    /**
     * Start Firestore real-time sync in background
     */
    private fun startFirestoreSync() {
        // Collect Firestore updates and sync to Room
        CoroutineScope(Dispatchers.IO).launch {
            firestoreMenuService.observeMenuItems().collect { result ->
                if (result is Result.Success) {
                    val entities = result.data.map { MenuItemEntity.fromDomainModel(it) }
                    menuItemDao.insertAll(entities)
                }
            }
        }
    }

    /**
     * Sync menu in background without blocking
     */
    private fun syncMenuInBackground() {
        CoroutineScope(Dispatchers.IO).launch {
            syncMenu()
        }
    }
}
