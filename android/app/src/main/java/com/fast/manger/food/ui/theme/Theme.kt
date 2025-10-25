package com.fast.manger.food.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Dark color scheme - Fast Food Theme
 */
private val DarkColorScheme = darkColorScheme(
    primary = RedPrimary,
    onPrimary = Color.White,
    primaryContainer = RedPrimaryDark,
    onPrimaryContainer = RedPrimaryLight,

    secondary = OrangePrimary,
    onSecondary = Color.White,
    secondaryContainer = OrangeDark,
    onSecondaryContainer = OrangeLight,

    tertiary = OrangeLight,
    onTertiary = Color.Black,
    tertiaryContainer = OrangeDark,
    onTertiaryContainer = OrangeLight,

    background = BackgroundDark,
    onBackground = TextPrimaryDark,
    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
    surfaceVariant = Grey800,
    onSurfaceVariant = TextSecondaryDark,

    error = ErrorRed,
    onError = Color.White,
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),

    outline = Grey600,
    outlineVariant = Grey700,
    scrim = Color.Black
)

/**
 * Light color scheme - Fast Food Theme
 */
private val LightColorScheme = lightColorScheme(
    primary = RedPrimary,
    onPrimary = Color.White,
    primaryContainer = RedPrimaryLight,
    onPrimaryContainer = RedPrimaryDark,

    secondary = OrangePrimary,
    onSecondary = Color.White,
    secondaryContainer = OrangeLight,
    onSecondaryContainer = OrangeDark,

    tertiary = OrangeLight,
    onTertiary = Color.White,
    tertiaryContainer = OrangeLight,
    onTertiaryContainer = OrangeDark,

    background = BackgroundLight,
    onBackground = TextPrimaryLight,
    surface = SurfaceLight,
    onSurface = TextPrimaryLight,
    surfaceVariant = Grey100,
    onSurfaceVariant = TextSecondaryLight,

    error = ErrorRed,
    onError = Color.White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),

    outline = Grey400,
    outlineVariant = Grey300,
    scrim = Color.Black
)

/**
 * Fast Food Manager Theme
 * Red/Orange color scheme inspired by the web app
 *
 * @param darkTheme Follow system dark mode setting
 * @param dynamicColor Use Material You dynamic colors (disabled by default for brand consistency)
 * @param content Composable content
 */
@Composable
fun FastFoodManagerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color disabled by default to maintain brand colors
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    // Update system bars
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}