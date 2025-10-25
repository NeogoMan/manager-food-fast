package com.fast.manger.food.util

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * Utility object for date and time formatting
 * Uses French locale for consistent formatting
 */
object DateFormatter {

    private val frenchLocale = Locale.FRENCH

    /**
     * Format timestamp to full date and time
     * Example: 15 janv. 2024, 14:30
     */
    fun formatDateTime(timestamp: Long): String {
        val sdf = SimpleDateFormat("dd MMM yyyy, HH:mm", frenchLocale)
        return sdf.format(Date(timestamp))
    }

    /**
     * Format timestamp to date only
     * Example: 15 janvier 2024
     */
    fun formatDate(timestamp: Long): String {
        val sdf = SimpleDateFormat("dd MMMM yyyy", frenchLocale)
        return sdf.format(Date(timestamp))
    }

    /**
     * Format timestamp to short date
     * Example: 15/01/2024
     */
    fun formatShortDate(timestamp: Long): String {
        val sdf = SimpleDateFormat("dd/MM/yyyy", frenchLocale)
        return sdf.format(Date(timestamp))
    }

    /**
     * Format timestamp to time only
     * Example: 14:30
     */
    fun formatTime(timestamp: Long): String {
        val sdf = SimpleDateFormat("HH:mm", frenchLocale)
        return sdf.format(Date(timestamp))
    }

    /**
     * Format timestamp to relative time
     * Examples: "Il y a 5 minutes", "Il y a 2 heures", "Il y a 3 jours"
     */
    fun formatRelativeTime(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp

        return when {
            diff < TimeUnit.MINUTES.toMillis(1) -> "À l'instant"
            diff < TimeUnit.HOURS.toMillis(1) -> {
                val minutes = TimeUnit.MILLISECONDS.toMinutes(diff)
                "Il y a $minutes minute${if (minutes > 1) "s" else ""}"
            }
            diff < TimeUnit.DAYS.toMillis(1) -> {
                val hours = TimeUnit.MILLISECONDS.toHours(diff)
                "Il y a $hours heure${if (hours > 1) "s" else ""}"
            }
            diff < TimeUnit.DAYS.toMillis(7) -> {
                val days = TimeUnit.MILLISECONDS.toDays(diff)
                "Il y a $days jour${if (days > 1) "s" else ""}"
            }
            else -> formatShortDate(timestamp)
        }
    }

    /**
     * Format timestamp to day and time
     * Example: Aujourd'hui à 14:30, Hier à 09:15
     */
    fun formatDayAndTime(timestamp: Long): String {
        val date = Date(timestamp)
        val calendar = Calendar.getInstance()
        calendar.time = date

        val today = Calendar.getInstance()
        val yesterday = Calendar.getInstance()
        yesterday.add(Calendar.DAY_OF_YEAR, -1)

        val time = formatTime(timestamp)

        return when {
            isSameDay(calendar, today) -> "Aujourd'hui à $time"
            isSameDay(calendar, yesterday) -> "Hier à $time"
            else -> formatDateTime(timestamp)
        }
    }

    /**
     * Check if two calendars represent the same day
     */
    private fun isSameDay(cal1: Calendar, cal2: Calendar): Boolean {
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
                cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)
    }

    /**
     * Get day of week in French
     * Example: Lundi, Mardi, etc.
     */
    fun getDayOfWeek(timestamp: Long): String {
        val sdf = SimpleDateFormat("EEEE", frenchLocale)
        return sdf.format(Date(timestamp)).replaceFirstChar { it.uppercase() }
    }

    /**
     * Get month name in French
     * Example: Janvier, Février, etc.
     */
    fun getMonthName(timestamp: Long): String {
        val sdf = SimpleDateFormat("MMMM", frenchLocale)
        return sdf.format(Date(timestamp)).replaceFirstChar { it.uppercase() }
    }

    /**
     * Format timestamp for order number
     * Example: 20240115-1430
     */
    fun formatOrderTimestamp(timestamp: Long): String {
        val sdf = SimpleDateFormat("yyyyMMdd-HHmm", Locale.US)
        return sdf.format(Date(timestamp))
    }
}

/**
 * Extension function to format Long timestamp to date time
 */
fun Long.toDateTime(): String = DateFormatter.formatDateTime(this)

/**
 * Extension function to format Long timestamp to date only
 */
fun Long.toDate(): String = DateFormatter.formatDate(this)

/**
 * Extension function to format Long timestamp to short date
 */
fun Long.toShortDate(): String = DateFormatter.formatShortDate(this)

/**
 * Extension function to format Long timestamp to time only
 */
fun Long.toTime(): String = DateFormatter.formatTime(this)

/**
 * Extension function to format Long timestamp to relative time
 */
fun Long.toRelativeTime(): String = DateFormatter.formatRelativeTime(this)

/**
 * Extension function to format Long timestamp to day and time
 */
fun Long.toDayAndTime(): String = DateFormatter.formatDayAndTime(this)
