package com.fast.manger.food.util

/**
 * Utility object for input validation
 * Provides validation functions with French error messages
 */
object ValidationUtils {

    /**
     * Validate username
     * Must be at least 3 characters
     */
    fun validateUsername(username: String): ValidationResult {
        return when {
            username.isBlank() -> ValidationResult.Error("Le nom d'utilisateur est requis")
            username.length < 3 -> ValidationResult.Error("Le nom d'utilisateur doit contenir au moins 3 caractères")
            else -> ValidationResult.Success
        }
    }

    /**
     * Validate password
     * Must be at least 6 characters
     */
    fun validatePassword(password: String): ValidationResult {
        return when {
            password.isBlank() -> ValidationResult.Error("Le mot de passe est requis")
            password.length < 6 -> ValidationResult.Error("Le mot de passe doit contenir au moins 6 caractères")
            else -> ValidationResult.Success
        }
    }

    /**
     * Validate phone number (Moroccan format)
     * Must be 10 digits starting with 0
     */
    fun validatePhone(phone: String?): ValidationResult {
        if (phone.isNullOrBlank()) {
            return ValidationResult.Success // Phone is optional
        }

        val cleanPhone = phone.replace(Regex("[^0-9]"), "")
        return when {
            cleanPhone.length != 10 -> ValidationResult.Error("Le numéro doit contenir 10 chiffres")
            !cleanPhone.startsWith("0") -> ValidationResult.Error("Le numéro doit commencer par 0")
            else -> ValidationResult.Success
        }
    }

    /**
     * Validate quantity
     * Must be between 1 and 99
     */
    fun validateQuantity(quantity: Int): ValidationResult {
        return when {
            quantity < 1 -> ValidationResult.Error("La quantité doit être au moins 1")
            quantity > 99 -> ValidationResult.Error("La quantité maximale est de 99")
            else -> ValidationResult.Success
        }
    }

    /**
     * Validate notes length
     * Must not exceed maxLength
     */
    fun validateNotes(notes: String?, maxLength: Int = 500): ValidationResult {
        if (notes.isNullOrBlank()) {
            return ValidationResult.Success
        }

        return when {
            notes.length > maxLength -> ValidationResult.Error("Les notes ne doivent pas dépasser $maxLength caractères")
            else -> ValidationResult.Success
        }
    }

    /**
     * Validate price
     * Must be positive
     */
    fun validatePrice(price: Double): ValidationResult {
        return when {
            price < 0 -> ValidationResult.Error("Le prix doit être positif")
            price == 0.0 -> ValidationResult.Error("Le prix ne peut pas être zéro")
            else -> ValidationResult.Success
        }
    }

    /**
     * Validate search query
     * Must be at least 2 characters
     */
    fun validateSearchQuery(query: String): ValidationResult {
        if (query.isBlank()) {
            return ValidationResult.Success
        }

        return when {
            query.length < 2 -> ValidationResult.Error("Entrez au moins 2 caractères pour rechercher")
            else -> ValidationResult.Success
        }
    }

    /**
     * Validate email format
     */
    fun validateEmail(email: String): ValidationResult {
        if (email.isBlank()) {
            return ValidationResult.Error("L'email est requis")
        }

        val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$".toRegex()
        return when {
            !email.matches(emailRegex) -> ValidationResult.Error("Format d'email invalide")
            else -> ValidationResult.Success
        }
    }
}

/**
 * Validation result sealed class
 */
sealed class ValidationResult {
    object Success : ValidationResult()
    data class Error(val message: String) : ValidationResult()

    fun isValid(): Boolean = this is Success
    fun getErrorOrNull(): String? = (this as? Error)?.message
}

/**
 * Extension function to validate and get error message
 */
fun String.validateUsername(): String? = ValidationUtils.validateUsername(this).getErrorOrNull()
fun String.validatePassword(): String? = ValidationUtils.validatePassword(this).getErrorOrNull()
fun String?.validatePhone(): String? = ValidationUtils.validatePhone(this).getErrorOrNull()
fun Int.validateQuantity(): String? = ValidationUtils.validateQuantity(this).getErrorOrNull()
fun String?.validateNotes(maxLength: Int = 500): String? = ValidationUtils.validateNotes(this, maxLength).getErrorOrNull()
fun Double.validatePrice(): String? = ValidationUtils.validatePrice(this).getErrorOrNull()
fun String.validateSearchQuery(): String? = ValidationUtils.validateSearchQuery(this).getErrorOrNull()
fun String.validateEmail(): String? = ValidationUtils.validateEmail(this).getErrorOrNull()
