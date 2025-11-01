package com.fast.manger.food.presentation.restaurant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.AuthRepository
import com.fast.manger.food.domain.usecase.restaurant.AddRestaurantByCodeUseCase
import com.fast.manger.food.domain.usecase.restaurant.GetUserRestaurantsUseCase
import com.fast.manger.food.domain.usecase.restaurant.SetActiveRestaurantUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Restaurant Selection Screen
 * Manages user's restaurant list, active restaurant selection, and adding new restaurants
 */
@HiltViewModel
class RestaurantSelectionViewModel @Inject constructor(
    private val getUserRestaurantsUseCase: GetUserRestaurantsUseCase,
    private val setActiveRestaurantUseCase: SetActiveRestaurantUseCase,
    private val addRestaurantByCodeUseCase: AddRestaurantByCodeUseCase,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RestaurantSelectionUiState())
    val uiState: StateFlow<RestaurantSelectionUiState> = _uiState.asStateFlow()

    init {
        loadUserRestaurants()
    }

    /**
     * Load list of restaurants user has access to
     */
    fun loadUserRestaurants() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                // Get current user to get activeRestaurantId
                val userResult = authRepository.getCurrentUser()
                val activeRestaurantId = if (userResult is Result.Success && userResult.data != null) {
                    userResult.data.getCurrentRestaurantId()
                } else {
                    null
                }

                // Get restaurants
                when (val result = getUserRestaurantsUseCase()) {
                    is Result.Success -> {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                restaurants = result.data,
                                activeRestaurantId = activeRestaurantId,
                                error = null
                            )
                        }
                    }
                    is Result.Error -> {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                error = result.exception.message ?: "Failed to load restaurants"
                            )
                        }
                    }
                    is Result.Loading -> {
                        _uiState.update { it.copy(isLoading = true) }
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load restaurants"
                    )
                }
            }
        }
    }

    /**
     * Select a restaurant as active
     */
    fun selectRestaurant(restaurantId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSettingActive = true, error = null) }

            when (val result = setActiveRestaurantUseCase(restaurantId)) {
                is Result.Success -> {
                    _uiState.update {
                        it.copy(
                            isSettingActive = false,
                            activeRestaurantId = restaurantId,
                            successMessage = result.data,
                            selectionSuccessful = true
                        )
                    }
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(
                            isSettingActive = false,
                            error = result.exception.message ?: "Failed to select restaurant"
                        )
                    }
                }
                is Result.Loading -> {
                    _uiState.update { it.copy(isSettingActive = true) }
                }
            }
        }
    }

    /**
     * Show add restaurant dialog
     */
    fun showAddRestaurantDialog() {
        _uiState.update {
            it.copy(showAddRestaurantDialog = true, addRestaurantCode = "")
        }
    }

    /**
     * Hide add restaurant dialog
     */
    fun hideAddRestaurantDialog() {
        _uiState.update {
            it.copy(showAddRestaurantDialog = false, addRestaurantCode = "")
        }
    }

    /**
     * Update restaurant code input
     */
    fun updateRestaurantCode(code: String) {
        _uiState.update { it.copy(addRestaurantCode = code) }
    }

    /**
     * Add restaurant by code
     */
    fun addRestaurant() {
        viewModelScope.launch {
            val code = _uiState.value.addRestaurantCode.trim()
            if (code.isEmpty()) {
                _uiState.update { it.copy(error = "Please enter a restaurant code") }
                return@launch
            }

            _uiState.update { it.copy(isAddingRestaurant = true, error = null) }

            when (val result = addRestaurantByCodeUseCase(code)) {
                is Result.Success -> {
                    _uiState.update {
                        it.copy(
                            isAddingRestaurant = false,
                            showAddRestaurantDialog = false,
                            successMessage = result.data
                        )
                    }
                    // Reload restaurants list
                    loadUserRestaurants()
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(
                            isAddingRestaurant = false,
                            error = result.exception.message ?: "Failed to add restaurant"
                        )
                    }
                }
                is Result.Loading -> {
                    _uiState.update { it.copy(isAddingRestaurant = true) }
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
     * Clear success message
     */
    fun clearSuccessMessage() {
        _uiState.update { it.copy(successMessage = null) }
    }

    /**
     * Reset selection state
     */
    fun resetSelectionState() {
        _uiState.update { it.copy(selectionSuccessful = false) }
    }
}
