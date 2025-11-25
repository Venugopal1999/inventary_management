import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const CountStatusBadge = ({ status }) => {
  const statusClasses = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-purple-100 text-purple-800',
    posted: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    draft: 'Draft',
    in_progress: 'In Progress',
    completed: 'Completed',
    reviewed: 'Reviewed',
    posted: 'Posted',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
};

export default function CountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCount();
  }, [id]);

  const fetchCount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/stock-counts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCount(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching count:', err);
      setError('Failed to load stock count details');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!confirm('Are you sure you want to start this count?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate(`/inventory/counts/${id}/session`);
    } catch (err) {
      alert('Failed to start count: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleComplete = async () => {
    if (!confirm('Are you sure you want to mark this count as completed?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCount();
      alert('Count marked as completed!');
    } catch (err) {
      alert('Failed to complete count: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReview = async () => {
    if (!confirm('Are you sure you want to review this count?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/review`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCount();
      alert('Count reviewed successfully!');
    } catch (err) {
      alert('Failed to review count: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePost = async () => {
    if (!confirm('Are you sure you want to post this count? This will create stock adjustment movements for all variances.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/post`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCount();
      alert('Count posted successfully! Inventory has been adjusted.');
    } catch (err) {
      alert('Failed to post count: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this count?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCount();
      alert('Count cancelled!');
    } catch (err) {
      alert('Failed to cancel count: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading stock count details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">{error}</div>
        <div className="text-center mt-4">
          <Link to="/inventory/counts" className="text-blue-600 hover:text-blue-800">
            Back to Stock Counts
          </Link>
        </div>
      </div>
    );
  }

  if (!count) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Stock count not found</div>
      </div>
    );
  }

  // Calculate statistics
  const items = count.items || [];
  const totalItems = items.length;
  const countedItems = items.filter(i => i.counted_qty !== null).length;
  const withVariance = items.filter(i => i.variance !== null && i.variance !== 0).length;
  const totalVarianceValue = items.reduce((sum, i) => {
    if (i.variance && i.unit_cost) {
      return sum + (i.variance * parseFloat(i.unit_cost));
    }
    return sum;
  }, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {count.count_number}
            </h1>
            <CountStatusBadge status={count.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {count.scope === 'cycle' ? 'Cycle Count' : 'Full Stock Take'} - {count.warehouse?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/inventory/counts"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </Link>
          {count.status === 'in_progress' && (
            <Link
              to={`/inventory/counts/${id}/session`}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Continue Counting
            </Link>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Items</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{totalItems}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Counted</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{countedItems}</div>
          <div className="text-xs text-gray-400">{totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0}% complete</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">With Variance</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{withVariance}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Variance Value</div>
          <div className={`mt-1 text-2xl font-bold ${totalVarianceValue < 0 ? 'text-red-600' : totalVarianceValue > 0 ? 'text-green-600' : 'text-gray-900'}`}>
            ${Math.abs(totalVarianceValue).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Count Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Count Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Warehouse</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {count.warehouse?.name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Scope</label>
            <p className="mt-1 text-base font-semibold text-gray-900 capitalize">
              {count.scope === 'cycle' ? 'Cycle Count' : 'Full Stock Take'}
            </p>
          </div>
          {count.location && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Location</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {count.location?.code || 'All Locations'}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-500">Created Date</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {new Date(count.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Created By</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {count.created_by?.name || count.user?.name || 'N/A'}
            </p>
          </div>
          {count.started_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Started Date</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {new Date(count.started_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          {count.completed_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Completed Date</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {new Date(count.completed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          {count.posted_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Posted Date</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {new Date(count.posted_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
        {count.notes && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-500">Notes</label>
            <p className="mt-1 text-base text-gray-700 bg-gray-50 p-3 rounded">
              {count.notes}
            </p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Count Items</h2>
        </div>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Expected</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Counted</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Variance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.product_variant?.product?.name || item.product?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {item.product_variant?.sku || item.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      {item.expected_qty}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {item.counted_qty !== null ? (
                        <span className="font-semibold text-blue-600">{item.counted_qty}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {item.variance !== null && item.variance !== 0 ? (
                        <span className={`font-semibold ${item.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.variance > 0 ? '+' : ''}{item.variance}
                        </span>
                      ) : item.variance === 0 ? (
                        <span className="text-gray-500">0</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.counted_qty !== null ? (
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          item.variance === 0
                            ? 'bg-green-100 text-green-800'
                            : item.variance > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.variance === 0 ? 'Match' : item.variance > 0 ? 'Over' : 'Under'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No items in this count
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {count.status === 'draft' && (
            <>
              <button
                onClick={handleStart}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Start Count
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Cancel Count
              </button>
            </>
          )}
          {count.status === 'in_progress' && (
            <>
              <Link
                to={`/inventory/counts/${id}/session`}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                Continue Counting
              </Link>
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Mark as Complete
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Cancel Count
              </button>
            </>
          )}
          {count.status === 'completed' && (
            <>
              <button
                onClick={handleReview}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                Review Count
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Cancel Count
              </button>
            </>
          )}
          {count.status === 'reviewed' && (
            <>
              <button
                onClick={handlePost}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Post to Inventory
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Cancel Count
              </button>
            </>
          )}
          {count.status === 'posted' && (
            <p className="text-green-600 font-medium">
              This count has been posted. Inventory adjustments have been applied.
            </p>
          )}
          {count.status === 'cancelled' && (
            <p className="text-red-600 font-medium">
              This count was cancelled.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
