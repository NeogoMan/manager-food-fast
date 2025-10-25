package com.fast.manger.food.presentation.menu

import com.fast.manger.food.domain.model.MenuCategory
import com.fast.manger.food.domain.model.MenuItem

/**
 * UI State for Menu Screen
 */
data class MenuUiState(
    val menuItems: List<MenuItem> = emptyList(),
    val filteredItems: List<MenuItem> = emptyList(),
    val selectedCategory: MenuCategory? = null,
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val showAddToCartDialog: Boolean = false,
    val addedItem: MenuItem? = null
)
