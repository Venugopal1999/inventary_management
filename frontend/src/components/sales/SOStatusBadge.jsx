import React from 'react';

const SOStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      draft: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        label: 'Draft'
      },
      confirmed: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Confirmed'
      },
      allocated: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        label: 'Allocated'
      },
      partial: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Partial'
      },
      shipped: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Shipped'
      },
      closed: {
        bg: 'bg-gray-200',
        text: 'text-gray-700',
        label: 'Closed'
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Cancelled'
      }
    };

    return configs[status] || configs.draft;
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default SOStatusBadge;
