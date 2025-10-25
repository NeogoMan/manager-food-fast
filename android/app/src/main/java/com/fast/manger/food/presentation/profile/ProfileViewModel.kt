package com.fast.manger.food.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.usecase.auth.GetCurrentUserUseCase
import com.fast.manger.food.domain.usecase.auth.LogoutUseCase
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
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadUser()
        observeUser()
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
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
