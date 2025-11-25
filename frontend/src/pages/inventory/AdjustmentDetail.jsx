import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
};

export default function AdjustmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [adjustment, setAdjustment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdjustment();
  }, [id]);

  const fetchAdjustment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/stock-adjustments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdjustment(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching adjustment:', err);
      setError('Failed to load adjustment details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this adjustment?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-adjustments/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdjustment();
      alert('Adjustment approved successfully!');
    } catch (err) {
      alert('Failed to approve adjustment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-adjustments/${id}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdjustment();
      alert('Adjustment rejected!');
    } catch (err) {
      alert('Failed to reject adjustment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePost = async () => {
    if (!confirm('Are you sure you want to post this adjustment? This will update inventory levels.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-adjustments/${id}/post`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdjustment();
      alert('Adjustment posted successfully! Inventory has been updated.');
    } catch (err) {
      alert('Failed to post adjustment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this adjustment?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/stock-adjustments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Adjustment cancelled!');
      navigate('/inventory/adjustments');
    } catch (err) {
      alert('Failed to cancel adjustment: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading adjustment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">{error}</div>
        <div className="text-center mt-4">
          <Link to="/inventory/adjustments" className="text-blue-600 hover:text-blue-800">
            Back to Adjustments
          </Link>
        </div>
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Adjustment not found</div>
      </div>
    );
  }

  const reasonLabels = {
    damage: 'Damage',
    writeoff: 'Write-off',
    found: 'Found',
    loss: 'Loss',
    expired: 'Expired',
    quality_issue: 'Quality Issue',
    miscellaneous: 'Miscellaneous',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {adjustment.adjustment_number}
            </h1>
            <AdjustmentStatusBadge status={adjustment.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Stock Adjustment Details
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/inventory/adjustments"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </Link>
          {adjustment.status === 'draft' && (
            <Link
              to={`/inventory/adjustments/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjustment Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Warehouse</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {adjustment.warehouse?.name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Reason</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {reasonLabels[adjustment.reason] || adjustment.reason}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Created Date</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {new Date(adjustment.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Created By</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {adjustment.created_by?.name || adjustment.user?.name || 'N/A'}
            </p>
          </div>
          {adjustment.approved_by && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Approved By</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {adjustment.approved_by?.name || 'N/A'}
              </p>
            </div>
          )}
          {adjustment.approved_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Approved Date</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {new Date(adjustment.approved_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          {adjustment.posted_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Posted Date</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {new Date(adjustment.posted_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
        {adjustment.reason_notes && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-500">Notes</label>
            <p className="mt-1 text-base text-gray-700 bg-gray-50 p-3 rounded">
              {adjustment.reason_notes}
            </p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Adjustment Items</h2>
        </div>
        {adjustment.items && adjustment.items.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Qty Change</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">UoM</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Unit Cost</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {adjustment.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.product_variant?.product?.name || item.product?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {item.product_variant?.sku || item.sku || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className={`font-semibold ${item.qty_delta < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.qty_delta > 0 ? '+' : ''}{item.qty_delta}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.uom?.name || item.uom?.abbreviation || 'EA'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">
                    {item.unit_cost ? `$${parseFloat(item.unit_cost).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No items in this adjustment
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {adjustment.status === 'pending_approval' && (
            <>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Reject
              </button>
            </>
          )}
          {adjustment.status === 'approved' && (
            <button
              onClick={handlePost}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
            >
              Post to Inventory
            </button>
          )}
          {['draft', 'pending_approval', 'approved'].includes(adjustment.status) && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Cancel Adjustment
            </button>
          )}
          {adjustment.status === 'posted' && (
            <p className="text-green-600 font-medium">
              This adjustment has been posted and inventory has been updated.
            </p>
          )}
          {adjustment.status === 'rejected' && (
            <p className="text-red-600 font-medium">
              This adjustment was rejected.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
