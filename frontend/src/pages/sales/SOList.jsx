import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SOStatusBadge from '../../components/sales/SOStatusBadge';
import { PlusIcon, EyeIcon, PencilIcon, CheckCircleIcon, TruckIcon } from '@heroicons/react/24/outline';

const SOList = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    customer_id: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    fetchSalesOrders();
  }, [filters]);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/sales-orders`,
        {
          params: filters,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Handle paginated response from Laravel
      const data = response.data.data?.data || response.data.data || response.data;
      setSalesOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load sales orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      customer_id: '',
      date_from: '',
      date_to: '',
    });
  };

  const handleConfirm = async (id) => {
    if (!confirm('Confirm this sales order? Stock will be allocated automatically.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/sales-orders/${id}/confirm`,
        { auto_allocate: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('Sales order confirmed and stock allocated successfully!');
      fetchSalesOrders();
    } catch (err) {
      alert('Failed to confirm sales order: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss" formats
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length !== 3) return '-';
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '-';
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            View and manage all sales orders
          </p>
        </div>
        <Link
          to="/sales-orders/new"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#FF9900] hover:bg-orange-600 text-white rounded-md transition text-sm sm:text-base"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          New Sales Order
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="allocated">Allocated</option>
              <option value="partial">Partial</option>
              <option value="shipped">Shipped</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#FF9900]"></div>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading sales orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-red-600 text-sm sm:text-base">{error}</p>
            <button
              onClick={fetchSalesOrders}
              className="mt-4 px-4 py-2 bg-[#FF9900] text-white rounded-md hover:bg-orange-600 text-sm sm:text-base"
            >
              Retry
            </button>
          </div>
        ) : salesOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-gray-600 text-sm sm:text-base">No sales orders found</p>
            <Link
              to="/sales-orders/new"
              className="mt-4 inline-block px-4 py-2 bg-[#FF9900] text-white rounded-md hover:bg-orange-600 text-sm sm:text-base"
            >
              Create First Sales Order
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      SO Number
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                      Promise Date
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                      Items
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesOrders.map((so) => (
                    <tr key={so.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {so.so_number || `SO-${so.id}`}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {so.customer?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {so.customer?.code || ''}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(so.order_date)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                        {formatDate(so.promise_date)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <SOStatusBadge status={so.status} />
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(so.total, so.currency)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                        {so.items?.length || 0} items
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/sales-orders/${so.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </Link>
                          {so.status === 'draft' && (
                            <>
                              <Link
                                to={`/sales-orders/${so.id}/edit`}
                                className="text-gray-600 hover:text-gray-800"
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={() => handleConfirm(so.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Confirm & Allocate"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {salesOrders.map((so) => (
                <div key={so.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {so.so_number || `SO-${so.id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {so.customer?.name || 'N/A'}
                      </div>
                    </div>
                    <SOStatusBadge status={so.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <div>
                      <span className="text-gray-500">Order:</span> {formatDate(so.order_date)}
                    </div>
                    <div>
                      <span className="text-gray-500">Promise:</span> {formatDate(so.promise_date)}
                    </div>
                    <div>
                      <span className="text-gray-500">Items:</span> {so.items?.length || 0}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(so.total, so.currency)}
                    </div>
                    <div className="flex gap-3">
                      <Link
                        to={`/sales-orders/${so.id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      {so.status === 'draft' && (
                        <>
                          <Link
                            to={`/sales-orders/${so.id}/edit`}
                            className="text-gray-600 hover:text-gray-800"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleConfirm(so.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Confirm & Allocate"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SOList;
