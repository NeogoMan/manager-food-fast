package com.fast.manger.food.presentation.restaurant

import com.fast.manger.food.domain.model.Restaurant

/**
 * UI State for Restaurant Selection Screen
 */
data class RestaurantSelectionUiState(
    val isLoading: Boolean = false,
    val restaurants: List<Restaurant> = emptyList(),
    val activeRestaurantId: String? = null,
    val error: String? = null,
    val isSettingActive: Boolean = false,
    val isAddingRestaurant: Boolean = false,
    val addRestaurantCode: String = "",
    val showAddRestaurantDialog: Boolean = false,
    val successMessage: String? = null,
    val selectionSuccessful: Boolean = false
)
