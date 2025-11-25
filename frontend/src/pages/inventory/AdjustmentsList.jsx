import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdjustmentStatusBadge = ({ status }) => {
  const statusClasses = {
    draft: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    posted: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    posted: 'Posted',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
};

export default function AdjustmentsList() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    reason: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdjustments();
  }, [filters]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.reason) params.reason = filters.reason;

      const response = await axios.get(`${API_URL}/stock-adjustments`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setAdjustments(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching adjustments:', err);
      setError('Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to cancel this adjustment?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/stock-adjustments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdjustments();
    } catch (err) {
      alert('Failed to cancel adjustment');
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this adjustment?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-adjustments/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdjustments();
    } catch (err) {
      alert('Failed to approve adjustment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePost = async (id) => {
    if (!confirm('Are you sure you want to post this adjustment? This will create stock movements.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-adjustments/${id}/post`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdjustments();
      alert('Adjustment posted successfully!');
    } catch (err) {
      alert('Failed to post adjustment: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage inventory adjustments for damage, write-off, found items, and more
            </p>
          </div>
          <Link
            to="/inventory/adjustments/new"
            className="bg-[#FF9900] hover:bg-[#E88B00] text-white px-6 py-2 rounded-md font-medium transition"
          >
            New Adjustment
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
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="posted">Posted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                value={filters.reason}
                onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Reasons</option>
                <option value="damage">Damage</option>
                <option value="writeoff">Write-off</option>
                <option value="found">Found</option>
                <option value="loss">Loss</option>
                <option value="expired">Expired</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="miscellaneous">Miscellaneous</option>
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
          ) : adjustments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No adjustments found. Create your first adjustment!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Adjustment #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Reason
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
                {adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {adjustment.adjustment_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {adjustment.warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                      {adjustment.reason?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <AdjustmentStatusBadge status={adjustment.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(adjustment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <Link
                        to={`/inventory/adjustments/${adjustment.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                      {adjustment.status === 'pending_approval' && (
                        <button
                          onClick={() => handleApprove(adjustment.id)}
                          className="text-green-600 hover:text-green-800 ml-2"
                        >
                          Approve
                        </button>
                      )}
                      {adjustment.status === 'approved' && (
                        <button
                          onClick={() => handlePost(adjustment.id)}
                          className="text-purple-600 hover:text-purple-800 ml-2"
                        >
                          Post
                        </button>
                      )}
                      {['draft', 'pending_approval', 'approved'].includes(adjustment.status) && (
                        <button
                          onClick={() => handleDelete(adjustment.id)}
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
