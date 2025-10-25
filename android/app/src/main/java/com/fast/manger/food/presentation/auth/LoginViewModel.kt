package com.fast.manger.food.presentation.auth

import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.usecase.auth.GetCurrentUserUseCase
import com.fast.manger.food.domain.usecase.auth.LoginUseCase
import com.fast.manger.food.domain.usecase.notifications.RegisterFCMTokenUseCase
import com.fast.manger.food.util.PreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Login Screen
 * Handles authentication logic and UI state
 */
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val registerFCMTokenUseCase: RegisterFCMTokenUseCase,
    private val preferencesManager: PreferencesManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    init {
        // Check if user is already logged in
        checkCurrentUser()
    }

    /**
     * Check if user is already logged in on app start
     */
    private fun checkCurrentUser() {
        viewModelScope.launch {
            when (val result = getCurrentUserUseCase()) {
                is Result.Success -> {
                    if (result.data != null) {
                        _uiState.update {
                            it.copy(
                                isLoggedIn = true,
                                currentUser = result.data
                            )
                        }
                    }
                }
                is Result.Error -> {
                    // User not logged in, do nothing
                }
                is Result.Loading -> {
                    // Handle loading if needed
                }
            }
        }
    }

    /**
     * Update username field
     */
    fun onUsernameChange(username: String) {
        _uiState.update { it.copy(username = username, error = null) }
    }

    /**
     * Update password field
     */
    fun onPasswordChange(password: String) {
        _uiState.update { it.copy(password = password, error = null) }
    }

    /**
     * Handle login button click
     */
    fun onLoginClick() {
        val currentState = _uiState.value

        // Show loading
        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            when (val result = loginUseCase(currentState.username, currentState.password)) {
                is Result.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isLoggedIn = false, // Keep false until after permission sheet
                            currentUser = result.data,
                            error = null
                        )
                    }

                    // Register FCM token for push notifications
                    registerFCMToken()

                    // Check if we should show notification permission bottom sheet
                    checkAndShowNotificationPermission()

                    // Delay navigation to allow permission sheet to show
                    kotlinx.coroutines.delay(500)

                    // If sheet wasn't shown, navigate immediately
                    if (!_uiState.value.showNotificationPermissionSheet) {
                        _uiState.update { it.copy(isLoggedIn = true) }
                    }
                }
                is Result.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = result.exception.message ?: "Erreur de connexion"
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
     * Register FCM token for push notifications after login
     */
    private fun registerFCMToken() {
        viewModelScope.launch {
            // Register token silently, errors are logged but don't affect UI
            registerFCMTokenUseCase()
        }
    }

    /**
     * Check if we should show notification permission bottom sheet
     *
     * Smart Logic:
     * - Always show if permission granted → Don't show
     * - First time user → Show
     * - User dismissed 1-2 times → Show again (give them another chance)
     * - User dismissed 3+ times → Don't show anymore (they clearly don't want it)
     * - User clicked "Maybe Later" 1-3 times → Show every 3rd login
     * - User clicked "Maybe Later" 4+ times → Don't show anymore
     */
    private fun checkAndShowNotificationPermission() {
        viewModelScope.launch {
            android.util.Log.d("LoginViewModel", "checkAndShowNotificationPermission called")

            val isGranted = preferencesManager.isNotificationPermissionGranted.first()
            val dismissedCount = preferencesManager.permissionDismissedCount.first()
            val maybeLaterCount = preferencesManager.permissionMaybeLaterCount.first()

            android.util.Log.d("LoginViewModel", "isGranted: $isGranted, dismissedCount: $dismissedCount, maybeLaterCount: $maybeLaterCount")

            // Don't show if permission already granted
            if (isGranted) {
                android.util.Log.d("LoginViewModel", "Permission already granted - not showing sheet")
                return@launch
            }

            // Don't show if user has dismissed too many times (respecting user choice)
            if (dismissedCount >= 3) {
                android.util.Log.d("LoginViewModel", "User dismissed 3+ times - respecting their choice")
                return@launch
            }

            // Don't show if user has clicked "Maybe Later" too many times
            if (maybeLaterCount >= 4) {
                android.util.Log.d("LoginViewModel", "User clicked 'Maybe Later' 4+ times - not showing anymore")
                return@launch
            }

            // Show the bottom sheet
            android.util.Log.d("LoginViewModel", "Showing notification permission sheet")
            _uiState.update { it.copy(showNotificationPermissionSheet = true) }
        }
    }

    /**
     * User dismissed notification permission bottom sheet (tapped outside or back button)
     * We'll ask again next time, but track how many times they've dismissed
     */
    fun onDismissNotificationPermission() {
        viewModelScope.launch {
            android.util.Log.d("LoginViewModel", "User dismissed notification sheet")
            preferencesManager.incrementDismissedCount()
            _uiState.update { it.copy(showNotificationPermissionSheet = false, isLoggedIn = true) }
        }
    }

    /**
     * User clicked "Maybe Later" on notification permission
     * We'll ask again, but track how many times they've clicked "Maybe Later"
     */
    fun onNotificationPermissionMaybeLater() {
        viewModelScope.launch {
            android.util.Log.d("LoginViewModel", "User clicked 'Maybe Later'")
            preferencesManager.incrementMaybeLaterCount()
            _uiState.update { it.copy(showNotificationPermissionSheet = false, isLoggedIn = true) }
        }
    }

    /**
     * User accepted notification permission
     * Mark as requested so we don't show the bottom sheet again
     */
    fun onNotificationPermissionAccepted() {
        viewModelScope.launch {
            android.util.Log.d("LoginViewModel", "User accepted notification permission")
            preferencesManager.setNotificationPermissionRequested()
            // Note: The actual permission grant is tracked by the permission launcher callback
            _uiState.update { it.copy(showNotificationPermissionSheet = false, isLoggedIn = true) }
        }
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
