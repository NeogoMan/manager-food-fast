package com.fast.manger.food.presentation.menu

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.MenuCategory
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.usecase.cart.AddToCartUseCase
import com.fast.manger.food.domain.usecase.menu.GetMenuByCategoryUseCase
import com.fast.manger.food.domain.usecase.menu.GetMenuItemsUseCase
import com.fast.manger.food.domain.usecase.menu.SearchMenuUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Menu Screen
 * Handles menu browsing, filtering, and adding to cart
 */
@HiltViewModel
class MenuViewModel @Inject constructor(
    private val getMenuItemsUseCase: GetMenuItemsUseCase,
    private val getMenuByCategoryUseCase: GetMenuByCategoryUseCase,
    private val searchMenuUseCase: SearchMenuUseCase,
    private val addToCartUseCase: AddToCartUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(MenuUiState())
    val uiState: StateFlow<MenuUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadMenu()
        observeMenu()
    }

    /**
     * Load menu items (one-time)
     */
    private fun loadMenu(forceRefresh: Boolean = false) {
        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            when (val result = getMenuItemsUseCase(forceRefresh)) {
                is Result.Success -> {
                    _uiState.update {
                        it.copy(
                            menuItems = result.data,
                            filteredItems = result.data,
                            isLoading = false,
                            error = null
                        )
                    }
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = result.exception.message ?: "Erreur de chargement du menu"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled
                }
            }
        }
    }

    /**
     * Observe menu items for real-time updates
     */
    private fun observeMenu() {
        viewModelScope.launch {
            getMenuItemsUseCase.observe().collect { result ->
                when (result) {
                    is Result.Success -> {
                        _uiState.update {
                            it.copy(
                                menuItems = result.data,
                                filteredItems = applyFilters(result.data)
                            )
                        }
                    }
                    is Result.Error -> {
                        // Error already handled in loadMenu
                    }
                    is Result.Loading -> {
                        // Loading state handled in loadMenu
                    }
                }
            }
        }
    }

    /**
     * Apply current filters (category and search) to menu items
     */
    private fun applyFilters(items: List<com.fast.manger.food.domain.model.MenuItem>): List<com.fast.manger.food.domain.model.MenuItem> {
        val state = _uiState.value
        var filtered = items

        // Apply category filter
        state.selectedCategory?.let { category ->
            filtered = filtered.filter { it.category == category }
        }

        // Apply search filter
        if (state.searchQuery.isNotBlank()) {
            filtered = filtered.filter {
                it.name.contains(state.searchQuery, ignoreCase = true) ||
                it.description.contains(state.searchQuery, ignoreCase = true)
            }
        }

        return filtered
    }

    /**
     * Handle pull-to-refresh
     */
    fun onRefresh() {
        _uiState.update { it.copy(isRefreshing = true) }

        viewModelScope.launch {
            loadMenu(forceRefresh = true)
            delay(500) // Smooth UX
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }

    /**
     * Handle category selection
     */
    fun onCategorySelected(category: MenuCategory?) {
        _uiState.update {
            it.copy(
                selectedCategory = category,
                filteredItems = applyFilters(it.menuItems)
            )
        }
    }

    /**
     * Handle search query change
     */
    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }

        // Debounce search
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300) // Debounce delay
            _uiState.update {
                it.copy(filteredItems = applyFilters(it.menuItems))
            }
        }
    }

    /**
     * Clear search query
     */
    fun clearSearch() {
        _uiState.update {
            it.copy(
                searchQuery = "",
                filteredItems = applyFilters(it.menuItems)
            )
        }
    }

    /**
     * Add item to cart
     */
    fun addToCart(menuItemId: String, quantity: Int, notes: String? = null) {
        viewModelScope.launch {
            // Find the menu item from current state
            val menuItem = _uiState.value.menuItems.find { it.id == menuItemId }

            if (menuItem == null) {
                _uiState.update {
                    it.copy(error = "Article introuvable")
                }
                return@launch
            }

            when (val result = addToCartUseCase(menuItem, quantity, notes)) {
                is Result.Success -> {
                    // Show add to cart dialog
                    _uiState.update {
                        it.copy(
                            showAddToCartDialog = true,
                            addedItem = menuItem
                        )
                    }
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(error = result.exception.message ?: "Erreur d'ajout au panier")
                    }
                }
                is Result.Loading -> {
                    // Handle loading if needed
                }
            }
        }
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    /**
     * Dismiss add to cart dialog
     */
    fun dismissAddToCartDialog() {
        _uiState.update {
            it.copy(
                showAddToCartDialog = false,
                addedItem = null
            )
        }
    }
}
