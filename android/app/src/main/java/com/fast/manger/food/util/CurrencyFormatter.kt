package com.fast.manger.food.util

import java.text.NumberFormat
import java.util.Locale

/**
 * Utility object for currency formatting
 * Formats amounts in Moroccan Dirham (MAD)
 */
object CurrencyFormatter {

    private val madLocale = Locale("ar", "MA") // Arabic Morocco locale
    private val frenchLocale = Locale.FRENCH

    /**
     * Format amount in MAD with 2 decimal places
     * Example: 125.50 MAD
     */
    fun formatMAD(amount: Double): String {
        return String.format(frenchLocale, "%.2f MAD", amount)
    }

    /**
     * Format amount in MAD with custom decimal places
     */
    fun formatMAD(amount: Double, decimalPlaces: Int): String {
        return String.format(frenchLocale, "%.${decimalPlaces}f MAD", amount)
    }

    /**
     * Format amount with MAD symbol (د.م.)
     * Example: 125.50 د.م.
     */
    fun formatMADWithSymbol(amount: Double): String {
        val numberFormat = NumberFormat.getInstance(frenchLocale)
        numberFormat.minimumFractionDigits = 2
        numberFormat.maximumFractionDigits = 2
        return "${numberFormat.format(amount)} د.م."
    }

    /**
     * Format amount without currency symbol
     * Example: 125.50
     */
    fun formatAmount(amount: Double): String {
        return String.format(frenchLocale, "%.2f", amount)
    }

    /**
     * Parse string to double, returns 0.0 if parsing fails
     */
    fun parseAmount(amountString: String): Double {
        return try {
            amountString.replace(",", ".")
                .replace("[^\\d.]".toRegex(), "")
                .toDoubleOrNull() ?: 0.0
        } catch (e: Exception) {
            0.0
        }
    }
}

/**
 * Extension function to format Double as MAD currency
 */
fun Double.toMAD(): String = CurrencyFormatter.formatMAD(this)

/**
 * Extension function to format Double with custom decimals
 */
fun Double.toMAD(decimalPlaces: Int): String = CurrencyFormatter.formatMAD(this, decimalPlaces)

/**
 * Extension function to format Double as amount only (no currency)
 */
fun Double.formatAmount(): String = CurrencyFormatter.formatAmount(this)
