import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState([
    { label: 'Total Products', value: '0', icon: '📦', color: 'bg-blue-500' },
    { label: 'Warehouses', value: '0', icon: '🏭', color: 'bg-green-500' },
    { label: 'Low Stock Items', value: '0', icon: '⚠️', color: 'bg-yellow-500' },
    { label: 'Pending Orders', value: '0', icon: '📋', color: 'bg-purple-500' },
  ]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/dashboard/metrics');
      const data = response.data;

      setMetrics([
        { label: 'Total Products', value: data.total_products.toString(), icon: '📦', color: 'bg-blue-500' },
        { label: 'Warehouses', value: data.total_warehouses.toString(), icon: '🏭', color: 'bg-green-500' },
        { label: 'Low Stock Items', value: data.low_stock_items.toString(), icon: '⚠️', color: 'bg-yellow-500' },
        { label: 'Pending Orders', value: data.pending_orders.toString(), icon: '📋', color: 'bg-purple-500' },
      ]);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h1>

      {/* Metric Cards - Responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">{metric.label}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${metric.color} rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl flex-shrink-0 ml-2`}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Welcome Message */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Welcome to Inventory Management System</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          Get started by managing your products, warehouses, and inventory operations.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/products/new')}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium text-sm sm:text-base"
          >
            Add New Product
          </button>
          <button
            onClick={() => navigate('/products')}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium text-sm sm:text-base"
          >
            View All Products
          </button>
        </div>
      </div>

      {/* Quick Actions - Mobile friendly */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-4 sm:mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/purchase-orders/new')}
            className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl sm:text-3xl mb-2">🛒</span>
            <span className="text-xs sm:text-sm text-gray-700 text-center">New Purchase Order</span>
          </button>
          <button
            onClick={() => navigate('/sales-orders/new')}
            className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl sm:text-3xl mb-2">💰</span>
            <span className="text-xs sm:text-sm text-gray-700 text-center">New Sales Order</span>
          </button>
          <button
            onClick={() => navigate('/goods-receipts/new')}
            className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl sm:text-3xl mb-2">📥</span>
            <span className="text-xs sm:text-sm text-gray-700 text-center">Receive Goods</span>
          </button>
          <button
            onClick={() => navigate('/inventory/adjustments/new')}
            className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl sm:text-3xl mb-2">🔧</span>
            <span className="text-xs sm:text-sm text-gray-700 text-center">Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-4 sm:mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No recent activity to display</p>
      </div>
    </div>
  );
};

export default Dashboard;
