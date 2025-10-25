package com.fast.manger.food.domain.usecase.menu

import com.fast.manger.food.domain.model.MenuCategory
import com.fast.manger.food.domain.model.MenuItem
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.MenuRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Use Case: Get Menu Items by Category
 * Filters menu items by category (burgers, drinks, etc.)
 */
class GetMenuByCategoryUseCase @Inject constructor(
    private val menuRepository: MenuRepository
) {
    /**
     * Get menu items for a specific category
     */
    suspend operator fun invoke(category: MenuCategory): Result<List<MenuItem>> {
        return menuRepository.getMenuItemsByCategory(category)
    }

    /**
     * Observe menu items by category (reactive)
     */
    fun observe(category: MenuCategory): Flow<Result<List<MenuItem>>> {
        return menuRepository.observeMenuItemsByCategory(category)
    }
}
