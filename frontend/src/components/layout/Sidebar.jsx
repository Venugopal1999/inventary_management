import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    purchasing: false,
    sales: false,
    inventory: false,
    replenishment: false,
    reports: true, // Week 9 - Expand reports by default
  });

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const mainNav = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Products', path: '/products', icon: '📦' },
    { name: 'Warehouses', path: '/warehouses', icon: '🏭' },
  ];

  const purchasingNav = [
    { name: 'Purchase Orders', path: '/purchase-orders', icon: '🛒' },
    { name: 'Goods Receipts', path: '/goods-receipts', icon: '📥' },
  ];

  const salesNav = [
    { name: 'Sales Orders', path: '/sales-orders', icon: '💰' },
    { name: 'Shipments', path: '/shipments', icon: '📦' },
  ];

  const inventoryNav = [
    { name: 'Stock Adjustments', path: '/inventory/adjustments', icon: '🔧' },
    { name: 'Transfers', path: '/inventory/transfers', icon: '🔄' },
    { name: 'Stock Counts', path: '/inventory/counts', icon: '📋' },
  ];

  const replenishmentNav = [
    { name: 'Replenishment Suggestions', path: '/replenishment/suggestions', icon: '🔄' },
    { name: 'Low Stock Alerts', path: '/alerts/low-stock', icon: '⚠️' },
    { name: 'Reorder Rules', path: '/settings/reorder-rules', icon: '📏' },
  ];

  const reportsNav = [
    { name: 'Reports Dashboard', path: '/reports', icon: '📊' },
    { name: 'Stock on Hand', path: '/reports/stock_on_hand', icon: '🏭' },
    { name: 'Inventory Valuation', path: '/reports/inventory_valuation', icon: '💰' },
    { name: 'Stock Movements', path: '/reports/stock_movement', icon: '📜' },
    { name: 'Expiry Aging', path: '/reports/expiry_aging', icon: '⏰' },
    { name: 'Top/Slow Movers', path: '/reports/movers_analysis', icon: '📈' },
  ];

  const bottomNav = [
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-[#232F3E] text-white flex-shrink-0 flex flex-col">
      <div className="p-4 font-bold text-xl border-b border-gray-700">
        Inventory Pro
      </div>

      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {/* Main Navigation */}
        {mainNav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-2 rounded hover:bg-[#37475A] transition ${
              isActive(item.path) ? 'bg-[#37475A]' : ''
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.name}
          </Link>
        ))}

        {/* Purchasing Section */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('purchasing')}
            className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase hover:text-white transition flex items-center justify-between"
          >
            <span>Purchasing</span>
            <span className="text-sm">{expandedSections.purchasing ? '▼' : '▶'}</span>
          </button>
          {expandedSections.purchasing && (
            <div className="mt-1 space-y-1">
              {purchasingNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2 rounded hover:bg-[#37475A] transition text-sm ${
                    isActive(item.path) ? 'bg-[#37475A]' : ''
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sales Section */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('sales')}
            className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase hover:text-white transition flex items-center justify-between"
          >
            <span>Sales & Fulfillment</span>
            <span className="text-sm">{expandedSections.sales ? '▼' : '▶'}</span>
          </button>
          {expandedSections.sales && (
            <div className="mt-1 space-y-1">
              {salesNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2 rounded hover:bg-[#37475A] transition text-sm ${
                    isActive(item.path) ? 'bg-[#37475A]' : ''
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Control Section (Week 7) */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('inventory')}
            className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase hover:text-white transition flex items-center justify-between"
          >
            <span>Inventory Control</span>
            <span className="text-sm">{expandedSections.inventory ? '▼' : '▶'}</span>
          </button>
          {expandedSections.inventory && (
            <div className="mt-1 space-y-1">
              {inventoryNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2 rounded hover:bg-[#37475A] transition text-sm ${
                    isActive(item.path) ? 'bg-[#37475A]' : ''
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Replenishment & Alerts Section (Week 8) */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('replenishment')}
            className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase hover:text-white transition flex items-center justify-between"
          >
            <span>Replenishment</span>
            <span className="text-sm">{expandedSections.replenishment ? '▼' : '▶'}</span>
          </button>
          {expandedSections.replenishment && (
            <div className="mt-1 space-y-1">
              {replenishmentNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2 rounded hover:bg-[#37475A] transition text-sm ${
                    isActive(item.path) ? 'bg-[#37475A]' : ''
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reports & Analytics Section (Week 9) */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('reports')}
            className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase hover:text-white transition flex items-center justify-between"
          >
            <span>Reports & Analytics</span>
            <span className="text-sm">{expandedSections.reports ? '▼' : '▶'}</span>
          </button>
          {expandedSections.reports && (
            <div className="mt-1 space-y-1">
              {reportsNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2 rounded hover:bg-[#37475A] transition text-sm ${
                    isActive(item.path) ? 'bg-[#37475A]' : ''
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="pt-4 border-t border-gray-700">
          {bottomNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded hover:bg-[#37475A] transition ${
                isActive(item.path) ? 'bg-[#37475A]' : ''
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
