import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge component for displaying status labels with different variants.
 * Amazon Seller Central inspired design with clean, professional appearance.
 *
 * @param {string} variant - Badge color variant (success, warning, error, info, neutral)
 * @param {string} size - Badge size (sm, md, lg)
 * @param {React.ReactNode} children - Badge content
 * @param {string} className - Additional CSS classes
 */
const Badge = ({ variant = 'neutral', size = 'md', children, className = '' }) => {
  const baseClasses = 'inline-flex items-center font-medium rounded';

  const variantClasses = {
    success: 'bg-green-50 text-green-800 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    error: 'bg-red-50 text-red-800 border border-red-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    neutral: 'bg-gray-50 text-gray-700 border border-gray-200',
    orange: 'bg-orange-50 text-orange-800 border border-orange-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.neutral} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  variant: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'neutral', 'orange']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Badge;
