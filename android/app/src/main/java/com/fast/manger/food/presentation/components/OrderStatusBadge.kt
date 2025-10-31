package com.fast.manger.food.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.fast.manger.food.domain.model.OrderStatus
import com.fast.manger.food.ui.theme.ErrorRed
import com.fast.manger.food.ui.theme.InfoBlue
import com.fast.manger.food.ui.theme.OrangePrimary
import com.fast.manger.food.ui.theme.SuccessGreen
import com.fast.manger.food.ui.theme.WarningYellow

/**
 * Reusable order status badge component
 * Shows order status with appropriate color coding
 */
@Composable
fun OrderStatusBadge(
    status: OrderStatus,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, textColor) = when (status) {
        OrderStatus.AWAITING_APPROVAL -> WarningYellow to Color.Black
        OrderStatus.PENDING -> InfoBlue to Color.White
        OrderStatus.PREPARING -> OrangePrimary to Color.White
        OrderStatus.READY -> SuccessGreen to Color.White
        OrderStatus.COMPLETED -> SuccessGreen.copy(alpha = 0.7f) to Color.White
        OrderStatus.CANCELLED -> ErrorRed to Color.White
        OrderStatus.REJECTED -> WarningYellow to Color.Black
    }

    Text(
        text = status.getDisplayName(),
        style = MaterialTheme.typography.labelSmall,
        color = textColor,
        modifier = modifier
            .background(
                color = backgroundColor,
                shape = RoundedCornerShape(12.dp)
            )
            .padding(horizontal = 12.dp, vertical = 4.dp)
    )
}
