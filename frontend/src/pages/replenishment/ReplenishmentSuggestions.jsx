import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function ReplenishmentSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [filter, setFilter] = useState({
    priority: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchSuggestions();
    fetchSummary();
  }, [filter]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (filter.priority) params.append('priority', filter.priority);
      if (filter.status) params.append('status', filter.status);

      const response = await axios.get(`${API_URL}/replenishment/suggestions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuggestions(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch replenishment suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/replenishment/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const generateSuggestions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/replenishment/suggestions/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSuggestions();
      fetchSummary();
      alert('Replenishment suggestions generated successfully!');
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      alert('Failed to generate suggestions');
    }
  };

  const dismissSuggestion = async (id, reason = null) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/replenishment/suggestions/${id}/dismiss`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSuggestions();
      fetchSummary();
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
    }
  };

  const createPurchaseOrder = async () => {
    if (selectedSuggestions.length === 0) {
      alert('Please select at least one suggestion');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/replenishment/create-purchase-order`,
        { suggestion_ids: selectedSuggestions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Purchase Order ${response.data.data.po_number} created successfully!`);
      setSelectedSuggestions([]);
      fetchSuggestions();
      fetchSummary();
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      alert(error.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const toggleSelection = (id) => {
    setSelectedSuggestions((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allIds = suggestions.map((s) => s.id);
    setSelectedSuggestions(allIds);
  };

  const clearSelection = () => {
    setSelectedSuggestions([]);
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return badges[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading replenishment suggestions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Replenishment Suggestions</h1>
              <p className="text-sm text-gray-500 mt-1">
                Auto-generated purchase recommendations based on reorder rules
              </p>
            </div>
            <button
              onClick={generateSuggestions}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition"
            >
              Refresh Suggestions
            </button>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-5 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{summary.total_pending}</div>
                <div className="text-sm text-gray-500">Total Pending</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{summary.by_priority?.critical || 0}</div>
                <div className="text-sm text-gray-500">Critical</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{summary.by_priority?.high || 0}</div>
                <div className="text-sm text-gray-500">High</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">{summary.by_priority?.medium || 0}</div>
                <div className="text-sm text-gray-500">Medium</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">${summary.total_suggested_value?.toFixed(2) || 0}</div>
                <div className="text-sm text-gray-500">Est. Value</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="pending">Pending</option>
                <option value="ordered">Ordered</option>
                <option value="dismissed">Dismissed</option>
                <option value="">All Statuses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSuggestions.length > 0 && (
          <div className="bg-blue-50 rounded-lg shadow p-4 mb-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <strong>{selectedSuggestions.length}</strong> suggestion(s) selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={createPurchaseOrder}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
              >
                Create Purchase Order
              </button>
              <button
                onClick={clearSelection}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Suggestions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Suggestions</h2>
            {suggestions.length > 0 && (
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
            )}
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Current</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Min</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Suggested</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suggestions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No suggestions found. Click "Refresh Suggestions" to generate new ones.
                  </td>
                </tr>
              ) : (
                suggestions.map((suggestion) => (
                  <tr key={suggestion.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.includes(suggestion.id)}
                        onChange={() => toggleSelection(suggestion.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {suggestion.product_variant?.product?.name || 'N/A'}
                      <br />
                      <span className="text-xs text-gray-500">{suggestion.product_variant?.sku}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {suggestion.warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {suggestion.supplier?.name || 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{suggestion.current_qty}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{suggestion.min_qty}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {suggestion.suggested_qty}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(suggestion.priority)}`}>
                        {suggestion.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {suggestion.status === 'pending' && (
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for dismissing (optional):');
                            dismissSuggestion(suggestion.id, reason);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Dismiss
                        </button>
                      )}
                      {suggestion.status === 'ordered' && (
                        <span className="text-green-600">PO Created</span>
                      )}
                      {suggestion.status === 'dismissed' && (
                        <span className="text-gray-600">Dismissed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
