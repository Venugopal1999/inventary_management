import { Link } from 'react-router-dom';

export default function Settings() {
  const settingsCategories = [
    {
      title: 'Inventory Settings',
      description: 'Configure inventory management settings',
      items: [
        {
          name: 'Reorder Rules',
          description: 'Configure min/max stock levels for automatic replenishment',
          path: '/settings/reorder-rules',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
        },
        {
          name: 'Warehouses',
          description: 'Manage warehouse locations and configurations',
          path: '/warehouses',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Alerts & Notifications',
      description: 'Configure alerting and notification preferences',
      items: [
        {
          name: 'Low Stock Alerts',
          description: 'View and manage low stock alerts',
          path: '/alerts/low-stock',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        },
        {
          name: 'Replenishment Suggestions',
          description: 'View automatic replenishment suggestions',
          path: '/replenishment/suggestions',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'System Settings',
      description: 'General system configuration',
      items: [
        {
          name: 'User Profile',
          description: 'Manage your account settings and preferences',
          path: '#',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          comingSoon: true,
        },
        {
          name: 'Company Settings',
          description: 'Configure company details and branding',
          path: '#',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          comingSoon: true,
        },
        {
          name: 'Email Configuration',
          description: 'Configure email notification settings',
          path: '#',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          comingSoon: true,
        },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your inventory system settings and preferences
        </p>
      </div>

      <div className="space-y-8">
        {settingsCategories.map((category) => (
          <div key={category.title}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
              <p className="text-sm text-gray-500">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 ${
                    item.comingSoon ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  onClick={(e) => item.comingSoon && e.preventDefault()}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-lg ${item.comingSoon ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-600'}`}>
                        {item.icon}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                        {item.comingSoon && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                    </div>
                    {!item.comingSoon && (
                      <div className="flex-shrink-0 ml-2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/settings/reorder-rules"
            className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Reorder Rule
          </Link>
          <Link
            to="/replenishment/suggestions"
            className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            View Suggestions
          </Link>
          <Link
            to="/alerts/low-stock"
            className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Check Alerts
          </Link>
        </div>
      </div>
    </div>
  );
}
