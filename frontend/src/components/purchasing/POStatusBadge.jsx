import React from 'react';

/**
 * Purchase Order Status Badge Component
 * Displays color-coded status badges for purchase orders
 */
const POStatusBadge = ({ status, showIcon = true, size = 'md' }) => {
  const statusConfig = {
    draft: {
      label: 'Draft',
      color: 'bg-gray-100 text-gray-700 border-gray-300',
      icon: '📝',
    },
    submitted: {
      label: 'Submitted',
      color: 'bg-blue-50 text-blue-700 border-blue-300',
      icon: '📤',
    },
    approved: {
      label: 'Approved',
      color: 'bg-green-50 text-green-700 border-green-300',
      icon: '✓',
    },
    ordered: {
      label: 'Ordered',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-300',
      icon: '📦',
    },
    partial: {
      label: 'Partial',
      color: 'bg-orange-50 text-orange-700 border-orange-300',
      icon: '⚠',
    },
    received: {
      label: 'Received',
      color: 'bg-green-100 text-green-800 border-green-400',
      icon: '✓✓',
    },
    closed: {
      label: 'Closed',
      color: 'bg-gray-200 text-gray-600 border-gray-400',
      icon: '🔒',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-50 text-red-700 border-red-300',
      icon: '✕',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};

export default POStatusBadge;
