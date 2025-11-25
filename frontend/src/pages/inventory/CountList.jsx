import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    <span className={`px-2 py-1 text-xs font-semibold rounded ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
};

export default function CountList() {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    scope: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCounts();
  }, [filters]);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.scope) params.scope = filters.scope;

      const response = await axios.get(`${API_URL}/stock-counts`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setCounts(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching counts:', err);
      setError('Failed to load stock counts');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id) => {
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

  const handleComplete = async (id) => {
    if (!confirm('Are you sure you want to mark this count as completed?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCounts();
      alert('Count marked as completed!');
    } catch (err) {
      alert('Failed to complete count: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReview = async (id) => {
    if (!confirm('Are you sure you want to review this count?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/review`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCounts();
      alert('Count reviewed successfully!');
    } catch (err) {
      alert('Failed to review count: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePost = async (id) => {
    if (!confirm('Are you sure you want to post this count? This will create stock adjustment movements for all variances.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/post`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCounts();
      alert('Count posted successfully!');
    } catch (err) {
      alert('Failed to post count: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this count?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCounts();
    } catch (err) {
      alert('Failed to cancel count: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Counts</h1>
            <p className="mt-1 text-sm text-gray-500">
              Conduct cycle counts and full stock takes with variance tracking
            </p>
          </div>
          <Link
            to="/inventory/counts/new"
            className="bg-[#FF9900] hover:bg-[#E88B00] text-white px-6 py-2 rounded-md font-medium transition"
          >
            New Count
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="reviewed">Reviewed</option>
                <option value="posted">Posted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scope
              </label>
              <select
                value={filters.scope}
                onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Scopes</option>
                <option value="cycle">Cycle Count</option>
                <option value="full">Full Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : counts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No stock counts found. Create your first count!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Count #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Scope
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {counts.map((count) => (
                  <tr key={count.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {count.count_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {count.warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                      {count.scope === 'cycle' ? 'Cycle' : 'Full'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <CountStatusBadge status={count.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(count.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <Link
                        to={`/inventory/counts/${count.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                      {count.status === 'draft' && (
                        <button
                          onClick={() => handleStart(count.id)}
                          className="text-green-600 hover:text-green-800 ml-2"
                        >
                          Start
                        </button>
                      )}
                      {count.status === 'in_progress' && (
                        <>
                          <Link
                            to={`/inventory/counts/${count.id}/session`}
                            className="text-purple-600 hover:text-purple-800 ml-2"
                          >
                            Continue
                          </Link>
                          <button
                            onClick={() => handleComplete(count.id)}
                            className="text-green-600 hover:text-green-800 ml-2"
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {count.status === 'completed' && (
                        <button
                          onClick={() => handleReview(count.id)}
                          className="text-purple-600 hover:text-purple-800 ml-2"
                        >
                          Review
                        </button>
                      )}
                      {count.status === 'reviewed' && (
                        <button
                          onClick={() => handlePost(count.id)}
                          className="text-green-600 hover:text-green-800 ml-2"
                        >
                          Post
                        </button>
                      )}
                      {['draft', 'in_progress', 'completed', 'reviewed'].includes(count.status) && (
                        <button
                          onClick={() => handleCancel(count.id)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
  );
}
