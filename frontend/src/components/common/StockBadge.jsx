import React from 'react';
import PropTypes from 'prop-types';
import Badge from './Badge';

/**
 * Stock state badge component for displaying inventory status.
 * Maps stock states to visual badges with appropriate colors.
 *
 * Stock States:
 * - in_stock: Green (good stock levels)
 * - low_stock: Yellow/Warning (below reorder threshold)
 * - out_of_stock: Red/Error (no stock available)
 * - on_order: Blue/Info (stock on order, not yet received)
 * - allocated: Orange (stock reserved for orders)
 *
 * @param {string} state - Stock state (in_stock, low_stock, out_of_stock, on_order, allocated)
 * @param {number} quantity - Optional quantity to display alongside badge
 * @param {string} size - Badge size (sm, md, lg)
 * @param {boolean} showQuantity - Whether to display quantity
 * @param {string} className - Additional CSS classes
 */
const StockBadge = ({
  state,
  quantity = null,
  size = 'md',
  showQuantity = false,
  className = ''
}) => {
  const stateConfig = {
    in_stock: {
      variant: 'success',
      label: 'In Stock',
      icon: '✓',
    },
    low_stock: {
      variant: 'warning',
      label: 'Low Stock',
      icon: '⚠',
    },
    out_of_stock: {
      variant: 'error',
      label: 'Out of Stock',
      icon: '✕',
    },
    on_order: {
      variant: 'info',
      label: 'On Order',
      icon: '↻',
    },
    allocated: {
      variant: 'orange',
      label: 'Allocated',
      icon: '🔒',
    },
  };

  const config = stateConfig[state] || {
    variant: 'neutral',
    label: 'Unknown',
    icon: '?',
  };

  const displayText = showQuantity && quantity !== null
    ? `${config.label} (${quantity})`
    : config.label;

  return (
    <Badge variant={config.variant} size={size} className={className}>
      <span className="mr-1">{config.icon}</span>
      {displayText}
    </Badge>
  );
};

StockBadge.propTypes = {
  state: PropTypes.oneOf(['in_stock', 'low_stock', 'out_of_stock', 'on_order', 'allocated']).isRequired,
  quantity: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showQuantity: PropTypes.bool,
  className: PropTypes.string,
};

export default StockBadge;
