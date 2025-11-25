import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import GRNStatusBadge from '../../components/purchasing/GRNStatusBadge';
import { PlusIcon, EyeIcon, DocumentTextIcon, PencilIcon } from '@heroicons/react/24/outline';

const GRNList = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    from_date: '',
    to_date: '',
  });

  useEffect(() => {
    fetchReceipts();
  }, [filters]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/goods-receipts`,
        {
          params: filters,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Handle paginated response from Laravel
      const data = response.data.data?.data || response.data.data || response.data;
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load goods receipts');
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
      from_date: '',
      to_date: '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Goods Receipts (GRN)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              View and manage all goods receipts
            </p>
          </div>
          <Link
            to="/goods-receipts/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#FF9900] hover:bg-orange-600 text-white rounded-md transition"
          >
            <PlusIcon className="w-5 h-5" />
            New Goods Receipt
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="partial">Partial</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => handleFilterChange('from_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => handleFilterChange('to_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : receipts.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No goods receipts found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new goods receipt.
              </p>
              <div className="mt-6">
                <Link
                  to="/goods-receipts/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF9900] hover:bg-orange-600 text-white rounded-md transition"
                >
                  <PlusIcon className="w-5 h-5" />
                  New Goods Receipt
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    GRN #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    PO #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Received At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Items
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      GRN-{receipt.id.toString().padStart(5, '0')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      PO #{receipt.purchase_order?.id || receipt.purchase_order_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {receipt.purchase_order?.supplier?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(receipt.received_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <GRNStatusBadge status={receipt.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      {receipt.items?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {(receipt.status === 'draft' || receipt.status === 'partial') && (
                          <Link
                            to={`/goods-receipts/${receipt.id}/edit`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Edit
                          </Link>
                        )}
                        <Link
                          to={`/goods-receipts/${receipt.id}`}
                          className="inline-flex items-center gap-1 text-[#FF9900] hover:text-orange-600 transition"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
  );
};

export default GRNList;
