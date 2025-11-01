package com.fast.manger.food.presentation.auth

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.usecase.auth.SignUpClientUseCase
import com.fast.manger.food.domain.usecase.restaurant.GetSavedRestaurantUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Sign Up Screen
 */
@HiltViewModel
class SignUpViewModel @Inject constructor(
    private val signUpClientUseCase: SignUpClientUseCase,
    private val getSavedRestaurantUseCase: GetSavedRestaurantUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _state = MutableStateFlow(SignUpState())
    val state: StateFlow<SignUpState> = _state.asStateFlow()

    init {
        // Load restaurant info
        viewModelScope.launch {
            val restaurantId = getSavedRestaurantUseCase.getId()
            val restaurantName = getSavedRestaurantUseCase.getName()
            _state.update {
                it.copy(
                    restaurantId = restaurantId ?: "",
                    restaurantName = restaurantName ?: ""
                )
            }
        }
    }

    fun onNameChange(name: String) {
        _state.update { it.copy(name = name, nameError = null) }
    }

    fun onPhoneChange(phone: String) {
        _state.update { it.copy(phone = phone, phoneError = null) }
    }

    fun onPasswordChange(password: String) {
        _state.update { it.copy(password = password, passwordError = null) }
    }

    fun onConfirmPasswordChange(confirmPassword: String) {
        _state.update { it.copy(confirmPassword = confirmPassword, confirmPasswordError = null) }
    }

    fun onPasswordVisibilityToggle() {
        _state.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun onConfirmPasswordVisibilityToggle() {
        _state.update { it.copy(isConfirmPasswordVisible = !it.isConfirmPasswordVisible) }
    }

    fun onSignUp() {
        // Clear previous errors
        _state.update {
            it.copy(
                nameError = null,
                phoneError = null,
                passwordError = null,
                confirmPasswordError = null,
                error = null
            )
        }

        val currentState = _state.value

        // Validate locally first
        var hasError = false

        if (currentState.name.isBlank()) {
            _state.update { it.copy(nameError = "Le nom est requis") }
            hasError = true
        } else if (currentState.name.length < 2) {
            _state.update { it.copy(nameError = "Le nom doit contenir au moins 2 caractères") }
            hasError = true
        }

        if (currentState.phone.isBlank()) {
            _state.update { it.copy(phoneError = "Le numéro de téléphone est requis") }
            hasError = true
        }

        if (currentState.password.isBlank()) {
            _state.update { it.copy(passwordError = "Le mot de passe est requis") }
            hasError = true
        } else if (currentState.password.length < 6) {
            _state.update { it.copy(passwordError = "Le mot de passe doit contenir au moins 6 caractères") }
            hasError = true
        }

        if (currentState.confirmPassword != currentState.password) {
            _state.update { it.copy(confirmPasswordError = "Les mots de passe ne correspondent pas") }
            hasError = true
        }

        if (hasError) return

        // Proceed with sign up
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            when (val result = signUpClientUseCase(
                restaurantId = currentState.restaurantId,
                name = currentState.name,
                phone = currentState.phone,
                password = currentState.password,
                confirmPassword = currentState.confirmPassword
            )) {
                is Result.Success -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            signUpSuccess = true
                        )
                    }
                }
                is Result.Error -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = result.exception.message ?: "Erreur lors de l'inscription"
                        )
                    }
                }
                is Result.Loading -> {}
            }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * UI State for Sign Up Screen
 */
data class SignUpState(
    val restaurantId: String = "",
    val restaurantName: String = "",
    val name: String = "",
    val phone: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val isPasswordVisible: Boolean = false,
    val isConfirmPasswordVisible: Boolean = false,
    val nameError: String? = null,
    val phoneError: String? = null,
    val passwordError: String? = null,
    val confirmPasswordError: String? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val signUpSuccess: Boolean = false
)
