package com.fast.manger.food.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.usecase.auth.GetCurrentUserUseCase
import com.fast.manger.food.domain.usecase.restaurant.GetSavedRestaurantUseCase
import com.fast.manger.food.presentation.navigation.Screen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Main Screen
 * Determines the start destination based on restaurant and auth state
 */
@HiltViewModel
class MainViewModel @Inject constructor(
    private val getSavedRestaurantUseCase: GetSavedRestaurantUseCase,
    private val getCurrentUserUseCase: GetCurrentUserUseCase
) : ViewModel() {

    private val _startDestination = MutableStateFlow<String?>(null)
    val startDestination: StateFlow<String?> = _startDestination.asStateFlow()

    init {
        determineStartDestination()
    }

    /**
     * Determine start destination based on authentication state:
     * 1. If user is logged in with multiple restaurants -> RestaurantSelectionScreen
     * 2. If user is logged in with single restaurant -> MenuScreen
     * 3. If user is NOT logged in -> RestaurantCodeScreen (with login option)
     */
    private fun determineStartDestination() {
        viewModelScope.launch {
            // Check if user is logged in first
            val currentUserResult = getCurrentUserUseCase()
            if (currentUserResult is com.fast.manger.food.domain.model.Result.Success && currentUserResult.data != null) {
                val user = currentUserResult.data

                // User is logged in - check if they have multiple restaurants
                if (user.hasMultipleRestaurants()) {
                    // User has multiple restaurants, show restaurant selection screen
                    _startDestination.value = Screen.RestaurantSelection.route
                } else {
                    // User has single restaurant, go directly to menu
                    _startDestination.value = Screen.Menu.route
                }
            } else {
                // User not logged in, go to restaurant code screen
                // From there they can either signup (enter code) or login
                _startDestination.value = Screen.RestaurantCode.route
            }
        }
    }
}
