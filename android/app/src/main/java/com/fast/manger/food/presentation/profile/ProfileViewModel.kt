package com.fast.manger.food.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.usecase.auth.GetCurrentUserUseCase
import com.fast.manger.food.domain.usecase.auth.LogoutUseCase
import com.fast.manger.food.domain.usecase.cart.ClearCartUseCase
import com.fast.manger.food.domain.usecase.restaurant.AddRestaurantByCodeUseCase
import com.fast.manger.food.domain.usecase.restaurant.ClearRestaurantUseCase
import com.fast.manger.food.domain.usecase.restaurant.GetSavedRestaurantUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Profile Screen
 * Handles user profile display and logout
 */
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val logoutUseCase: LogoutUseCase,
    private val getSavedRestaurantUseCase: GetSavedRestaurantUseCase,
    private val clearRestaurantUseCase: ClearRestaurantUseCase,
    private val clearCartUseCase: ClearCartUseCase,
    private val addRestaurantByCodeUseCase: AddRestaurantByCodeUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadUser()
        observeUser()
        loadRestaurantName()
    }

    /**
     * Load current user (one-time)
     */
    private fun loadUser() {
        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            when (val result = getCurrentUserUseCase()) {
                is Result.Success -> {
                    _uiState.update {
                        it.copy(
                            user = result.data,
                            isLoading = false
                        )
                    }
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = result.exception.message ?: "Erreur de chargement du profil"
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
     * Observe current user for real-time updates
     */
    private fun observeUser() {
        viewModelScope.launch {
            getCurrentUserUseCase.observe().collect { result ->
                when (result) {
                    is Result.Success<*> -> {
                        _uiState.update { it.copy(user = result.data as com.fast.manger.food.domain.model.User?) }
                    }
                    is Result.Error -> {
                        // Error already handled in loadUser
                    }
                    is Result.Loading -> {
                        // Loading handled in loadUser
                    }
                }
            }
        }
    }

    /**
     * Handle logout
     */
    fun logout() {
        _uiState.update { it.copy(isLoggingOut = true, error = null) }

        viewModelScope.launch {
            when (val result = logoutUseCase()) {
                is Result.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoggingOut = false,
                            logoutSuccessful = true,
                            user = null
                        )
                    }
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoggingOut = false,
                            error = result.exception.message ?: "Erreur de déconnexion"
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
     * Reset logout state (after navigation)
     */
    fun resetLogoutState() {
        _uiState.update { it.copy(logoutSuccessful = false) }
    }

    /**
     * Load restaurant name
     */
    private fun loadRestaurantName() {
        viewModelScope.launch {
            val restaurantName = getSavedRestaurantUseCase.getName()
            _uiState.update { it.copy(restaurantName = restaurantName) }
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
                _uiState.update { it.copy(error = "Veuillez entrer un code restaurant") }
                return@launch
            }

            _uiState.update { it.copy(isAddingRestaurant = true, error = null) }

            when (val result = addRestaurantByCodeUseCase(code)) {
                is Result.Success -> {
                    _uiState.update {
                        it.copy(
                            isAddingRestaurant = false,
                            showAddRestaurantDialog = false,
                            addRestaurantSuccessMessage = result.data
                        )
                    }
                    // Reload user to update restaurant count
                    loadUser()
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(
                            isAddingRestaurant = false,
                            error = result.exception.message ?: "Erreur lors de l'ajout du restaurant"
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
     * Clear success message
     */
    fun clearSuccessMessage() {
        _uiState.update { it.copy(addRestaurantSuccessMessage = null) }
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
