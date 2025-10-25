package com.fast.manger.food.domain.usecase.menu

import com.fast.manger.food.domain.model.MenuItem
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.MenuRepository
import javax.inject.Inject

/**
 * Use Case: Search Menu Items
 * Searches menu items by name
 */
class SearchMenuUseCase @Inject constructor(
    private val menuRepository: MenuRepository
) {
    /**
     * Search menu items
     * @param query Search query (case-insensitive)
     * @return List of matching menu items
     */
    suspend operator fun invoke(query: String): Result<List<MenuItem>> {
        // Validate query
        if (query.isBlank()) {
            return Result.Success(emptyList())
        }

        // Minimum 2 characters for search
        if (query.length < 2) {
            return Result.Error(Exception("Veuillez saisir au moins 2 caractères"))
        }

        return menuRepository.searchMenuItems(query.trim())
    }
}
