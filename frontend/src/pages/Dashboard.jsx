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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`w-12 h-12 ${metric.color} rounded-full flex items-center justify-center text-2xl`}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Welcome Message */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Welcome to Inventory Management System</h2>
        <p className="text-gray-600 mb-4">
          Get started by managing your products, warehouses, and inventory operations.
        </p>
        <div className="flex space-x-4">
          <button onClick={() => navigate('/products/new')} className="btn-primary">
            Add New Product
          </button>
          <button onClick={() => navigate('/products')} className="btn-secondary">
            View All Products
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card mt-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-center py-8">No recent activity to display</p>
      </div>
    </div>
  );
};

export default Dashboard;
