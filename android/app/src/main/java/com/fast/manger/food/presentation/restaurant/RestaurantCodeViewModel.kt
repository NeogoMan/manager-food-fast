package com.fast.manger.food.presentation.restaurant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.Restaurant
import com.fast.manger.food.domain.usecase.restaurant.SaveRestaurantUseCase
import com.fast.manger.food.domain.usecase.restaurant.ValidateRestaurantCodeUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Restaurant Code Entry Screen
 */
@HiltViewModel
class RestaurantCodeViewModel @Inject constructor(
    private val validateRestaurantCodeUseCase: ValidateRestaurantCodeUseCase,
    private val saveRestaurantUseCase: SaveRestaurantUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(RestaurantCodeState())
    val state: StateFlow<RestaurantCodeState> = _state.asStateFlow()

    fun onCodeChange(code: String) {
        _state.update { it.copy(code = code.uppercase(), error = null) }
    }

    fun onValidateCode() {
        val code = _state.value.code.trim()

        if (code.isBlank()) {
            _state.update { it.copy(error = "Please enter a restaurant code") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            validateRestaurantCodeUseCase(code)
                .onSuccess { restaurant ->
                    // Save restaurant locally
                    saveRestaurantUseCase(restaurant)
                    _state.update {
                        it.copy(
                            isLoading = false,
                            restaurant = restaurant,
                            validationSuccess = true
                        )
                    }
                }
                .onFailure { exception ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Invalid restaurant code"
                        )
                    }
                }
        }
    }

    fun onQRCodeDetected(code: String) {
        // Update code field and auto-validate
        _state.update { it.copy(code = code.uppercase()) }
        onValidateCode()
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * UI State for Restaurant Code Screen
 */
data class RestaurantCodeState(
    val code: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val restaurant: Restaurant? = null,
    val validationSuccess: Boolean = false
)
