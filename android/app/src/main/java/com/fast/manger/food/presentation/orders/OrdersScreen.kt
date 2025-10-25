package com.fast.manger.food.presentation.orders

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fast.manger.food.domain.model.Order
import com.fast.manger.food.presentation.components.EmptyStateScreen
import com.fast.manger.food.presentation.components.ErrorScreen
import com.fast.manger.food.presentation.components.FastFoodTopAppBar
import com.fast.manger.food.presentation.components.LoadingScreen
import com.fast.manger.food.presentation.components.OrderStatusBadge
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Orders Screen - View order history with real-time updates
 * Shows active and completed orders with status tracking
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    modifier: Modifier = Modifier,
    viewModel: OrdersViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    // Show error message
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            FastFoodTopAppBar(title = "Mes Commandes")
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
                    LoadingScreen(message = "Chargement des commandes...")
                }
                uiState.error != null -> {
                    ErrorScreen(
                        message = uiState.error ?: "Erreur inconnue",
                        onRetry = { viewModel.onRefresh() }
                    )
                }
                else -> {
                    OrdersContent(
                        activeOrders = uiState.activeOrders,
                        allOrders = uiState.orders,
                        selectedTab = uiState.selectedTab,
                        isCancellingOrder = uiState.isCancellingOrder,
                        cancellingOrderId = uiState.cancellingOrderId,
                        onTabSelected = viewModel::onTabSelected,
                        onCancelOrder = viewModel::cancelOrder
                    )
                }
            }
        }
    }
}

@Composable
private fun OrdersContent(
    activeOrders: List<Order>,
    allOrders: List<Order>,
    selectedTab: OrderTab,
    isCancellingOrder: Boolean,
    cancellingOrderId: String?,
    onTabSelected: (OrderTab) -> Unit,
    onCancelOrder: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxSize()) {
        // Tabs
        TabRow(selectedTabIndex = selectedTab.ordinal) {
            Tab(
                selected = selectedTab == OrderTab.ACTIVE,
                onClick = { onTabSelected(OrderTab.ACTIVE) },
                text = { Text("Actives (${activeOrders.size})") }
            )
            Tab(
                selected = selectedTab == OrderTab.ALL,
                onClick = { onTabSelected(OrderTab.ALL) },
                text = { Text("Historique") }
            )
        }

        // Orders list
        val ordersToShow = if (selectedTab == OrderTab.ACTIVE) activeOrders else allOrders

        if (ordersToShow.isEmpty()) {
            EmptyStateScreen(
                message = if (selectedTab == OrderTab.ACTIVE) {
                    "Aucune commande active"
                } else {
                    "Aucune commande"
                },
                icon = Icons.Default.Receipt
            )
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(
                    items = ordersToShow,
                    key = { it.id }
                ) { order ->
                    OrderCard(
                        order = order,
                        isCancelling = isCancellingOrder && cancellingOrderId == order.id,
                        onCancelOrder = { onCancelOrder(order.id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun OrderCard(
    order: Order,
    isCancelling: Boolean,
    onCancelOrder: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showCancelDialog by remember { mutableStateOf(false) }

    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Order header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = order.orderNumber,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = formatDate(order.createdAt),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    // DEBUG: Show raw status enum value
                    Text(
                        text = "DEBUG: ${order.status.name} | canCancel: ${order.canBeCancelled()}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                OrderStatusBadge(status = order.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Order items
            order.items.forEach { orderItem ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "${orderItem.quantity}x ${orderItem.name}",
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = "${String.format("%.2f", orderItem.subtotal)} MAD",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                if (!orderItem.notes.isNullOrBlank()) {
                    Text(
                        text = "  Note: ${orderItem.notes}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Notes
            if (!order.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Notes: ${order.notes}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Total and cancel button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Total: ${String.format("%.2f", order.totalAmount)} MAD",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )

                if (order.canBeCancelled()) {
                    TextButton(
                        onClick = { showCancelDialog = true },
                        enabled = !isCancelling
                    ) {
                        Text(
                            text = if (isCancelling) "Annulation..." else "Annuler",
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }

    // Cancel order confirmation dialog
    if (showCancelDialog) {
        AlertDialog(
            onDismissRequest = { showCancelDialog = false },
            title = { Text("Annuler la commande") },
            text = { Text("Êtes-vous sûr de vouloir annuler cette commande?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onCancelOrder()
                        showCancelDialog = false
                    }
                ) {
                    Text("Confirmer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCancelDialog = false }) {
                    Text("Retour")
                }
            }
        )
    }
}

/**
 * Format timestamp to readable date
 */
private fun formatDate(timestamp: Long): String {
    val sdf = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.FRENCH)
    return sdf.format(Date(timestamp))
}
