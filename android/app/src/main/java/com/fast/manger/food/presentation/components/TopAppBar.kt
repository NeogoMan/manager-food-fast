package com.fast.manger.food.presentation.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow

/**
 * Reusable top app bar component
 * Supports title, navigation icon, and action buttons
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FastFoodTopAppBar(
    title: String,
    onNavigateBack: (() -> Unit)? = null,
    onSearchClick: (() -> Unit)? = null,
    onCartClick: (() -> Unit)? = null,
    cartItemCount: Int = 0,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        title = {
            Text(
                text = title,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        },
        navigationIcon = {
            if (onNavigateBack != null) {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Retour"
                    )
                }
            }
        },
        actions = {
            if (onSearchClick != null) {
                IconButton(onClick = onSearchClick) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Rechercher"
                    )
                }
            }
            if (onCartClick != null) {
                IconButton(onClick = onCartClick) {
                    if (cartItemCount > 0) {
                        BadgedBox(
                            badge = {
                                Badge {
                                    AnimatedContent(
                                        targetState = cartItemCount,
                                        transitionSpec = {
                                            scaleIn(
                                                animationSpec = spring(
                                                    dampingRatio = Spring.DampingRatioMediumBouncy,
                                                    stiffness = Spring.StiffnessMedium
                                                )
                                            ) togetherWith scaleOut()
                                        },
                                        label = "cart_badge_animation"
                                    ) { count ->
                                        Text(text = count.toString())
                                    }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.ShoppingCart,
                                contentDescription = "Panier"
                            )
                        }
                    } else {
                        Icon(
                            imageVector = Icons.Default.ShoppingCart,
                            contentDescription = "Panier"
                        )
                    }
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.primary,
            titleContentColor = MaterialTheme.colorScheme.onPrimary,
            navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
            actionIconContentColor = MaterialTheme.colorScheme.onPrimary
        ),
        modifier = modifier
    )
}
