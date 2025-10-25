package com.fast.manger.food.domain.usecase.menu

import com.fast.manger.food.domain.model.MenuItem
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.MenuRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Use Case: Get Menu Items
 * Retrieves all available menu items
 */
class GetMenuItemsUseCase @Inject constructor(
    private val menuRepository: MenuRepository
) {
    /**
     * Get all menu items (one-time)
     * @param forceRefresh Force fetch from network
     */
    suspend operator fun invoke(forceRefresh: Boolean = false): Result<List<MenuItem>> {
        return menuRepository.getMenuItems(forceRefresh)
    }

    /**
     * Observe menu items (reactive with real-time updates)
     */
    fun observe(): Flow<Result<List<MenuItem>>> {
        return menuRepository.observeMenuItems()
    }

    /**
     * Get only available menu items
     */
    suspend fun getAvailable(): Result<List<MenuItem>> {
        return menuRepository.getAvailableMenuItems()
    }

    /**
     * Observe only available menu items (reactive)
     */
    fun observeAvailable(): Flow<Result<List<MenuItem>>> {
        return menuRepository.observeAvailableMenuItems()
    }
}
