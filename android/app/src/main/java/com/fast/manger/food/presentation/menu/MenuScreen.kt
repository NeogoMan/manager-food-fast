package com.fast.manger.food.presentation.menu

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fast.manger.food.domain.model.MenuCategory
import com.fast.manger.food.presentation.components.AddToCartDialog
import com.fast.manger.food.presentation.components.CategoryChip
import com.fast.manger.food.presentation.components.EmptyStateScreen
import com.fast.manger.food.presentation.components.ErrorScreen
import com.fast.manger.food.presentation.components.FastFoodTopAppBar
import com.fast.manger.food.presentation.components.LoadingScreen
import com.fast.manger.food.presentation.components.MenuItemCard

/**
 * Menu Screen - Browse and filter menu items
 * Main screen showing available food items with category filtering and search
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuScreen(
    onCartClick: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MenuViewModel = hiltViewModel(),
    cartViewModel: com.fast.manger.food.presentation.cart.CartViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cartUiState by cartViewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    // Get cart item count from cart state
    val cartItemCount = cartUiState.cartItems.size

    // Show error message
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }

    // Show add to cart dialog
    if (uiState.showAddToCartDialog && uiState.addedItem != null) {
        AddToCartDialog(
            item = uiState.addedItem!!,
            onDismiss = { viewModel.dismissAddToCartDialog() },
            onViewCart = {
                viewModel.dismissAddToCartDialog()
                onCartClick()
            }
        )
    }

    Scaffold(
        topBar = {
            FastFoodTopAppBar(
                title = "Menu",
                onCartClick = onCartClick,
                cartItemCount = cartItemCount
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        modifier = modifier
    ) { paddingValues ->
        PullToRefreshBox(
            isRefreshing = uiState.isRefreshing,
            onRefresh = { viewModel.onRefresh() },
            modifier = Modifier.padding(paddingValues)
        ) {
            when {
                uiState.isLoading -> {
                    LoadingScreen(message = "Chargement du menu...")
                }
                uiState.error != null -> {
                    ErrorScreen(
                        message = uiState.error ?: "Erreur inconnue",
                        onRetry = { viewModel.onRefresh() }
                    )
                }
                else -> {
                    MenuContent(
                        filteredItems = uiState.filteredItems,
                        selectedCategory = uiState.selectedCategory,
                        searchQuery = uiState.searchQuery,
                        onCategorySelected = viewModel::onCategorySelected,
                        onSearchQueryChange = viewModel::onSearchQueryChange,
                        onClearSearch = viewModel::clearSearch,
                        onAddToCart = { menuItem ->
                            viewModel.addToCart(menuItem.id, 1)
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun MenuContent(
    filteredItems: List<com.fast.manger.food.domain.model.MenuItem>,
    selectedCategory: MenuCategory?,
    searchQuery: String,
    onCategorySelected: (MenuCategory?) -> Unit,
    onSearchQueryChange: (String) -> Unit,
    onClearSearch: () -> Unit,
    onAddToCart: (com.fast.manger.food.domain.model.MenuItem) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize()
    ) {
        // Search bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchQueryChange,
            placeholder = { Text("Rechercher un plat...") },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "Search"
                )
            },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = onClearSearch) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Clear"
                        )
                    }
                }
            },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        )

        // Category filter chips
        LazyRow(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            // "All" chip
            item {
                CategoryChip(
                    category = MenuCategory.BURGERS, // Placeholder, won't be displayed
                    isSelected = selectedCategory == null,
                    onClick = { onCategorySelected(null) },
                    modifier = Modifier
                ) {
                    Text("Tout")
                }
            }

            // Category chips
            items(MenuCategory.entries) { category ->
                CategoryChip(
                    category = category,
                    isSelected = selectedCategory == category,
                    onClick = { onCategorySelected(category) }
                )
            }
        }

        // Menu items list
        if (filteredItems.isEmpty()) {
            EmptyStateScreen(
                message = if (searchQuery.isNotEmpty()) {
                    "Aucun plat trouvé pour \"$searchQuery\""
                } else {
                    "Aucun plat disponible"
                },
                icon = Icons.Default.ShoppingBag
            )
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(
                    items = filteredItems,
                    key = { it.id }
                ) { menuItem ->
                    MenuItemCard(
                        menuItem = menuItem,
                        onAddToCart = onAddToCart
                    )
                }

                // Bottom spacing
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
private fun CategoryChip(
    category: MenuCategory,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    androidx.compose.material3.FilterChip(
        selected = isSelected,
        onClick = onClick,
        label = content,
        colors = androidx.compose.material3.FilterChipDefaults.filterChipColors(
            selectedContainerColor = MaterialTheme.colorScheme.primary,
            selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
            labelColor = MaterialTheme.colorScheme.onSurfaceVariant
        ),
        modifier = modifier.padding(horizontal = 4.dp)
    )
}
