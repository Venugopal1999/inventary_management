import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TransferStatusBadge = ({ status }) => {
  const statusClasses = {
    draft: 'bg-gray-100 text-gray-800',
    approved: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-yellow-100 text-yellow-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    draft: 'Draft',
    approved: 'Approved',
    in_transit: 'In Transit',
    received: 'Received',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
};

export default function TransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransfer();
  }, [id]);

  const fetchTransfer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/transfers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransfer(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching transfer:', err);
      setError('Failed to load transfer details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this transfer?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/transfers/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransfer();
      alert('Transfer approved successfully!');
    } catch (err) {
      alert('Failed to approve transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleShip = async () => {
    if (!confirm('Are you sure you want to ship this transfer? This will remove stock from the source warehouse.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/transfers/${id}/ship`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransfer();
      alert('Transfer shipped successfully!');
    } catch (err) {
      alert('Failed to ship transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReceive = async () => {
    if (!confirm('Are you sure you want to receive this transfer? This will add stock to the destination warehouse.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/transfers/${id}/receive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransfer();
      alert('Transfer received successfully!');
    } catch (err) {
      alert('Failed to receive transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/transfers/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransfer();
      alert('Transfer cancelled!');
    } catch (err) {
      alert('Failed to cancel transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading transfer details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">{error}</div>
        <div className="text-center mt-4">
          <Link to="/inventory/transfers" className="text-blue-600 hover:text-blue-800">
            Back to Transfers
          </Link>
        </div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Transfer not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {transfer.transfer_number}
            </h1>
            <TransferStatusBadge status={transfer.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Inter-Warehouse Transfer Details
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/inventory/transfers"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </Link>
          {transfer.status === 'draft' && (
            <Link
              to={`/inventory/transfers/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Transfer Summary Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">From Warehouse</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {transfer.from_warehouse?.name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">To Warehouse</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {transfer.to_warehouse?.name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Requested Date</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {transfer.requested_at ? new Date(transfer.requested_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Requested By</label>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {transfer.requested_by?.name || transfer.user?.name || 'N/A'}
            </p>
          </div>
          {transfer.approved_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Approved Date</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {new Date(transfer.approved_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          {transfer.shipped_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Shipped Date</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {new Date(transfer.shipped_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          {transfer.received_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Received Date</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {new Date(transfer.received_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          {transfer.carrier && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Carrier</label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {transfer.carrier}
              </p>
            </div>
          )}
          {transfer.tracking_number && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Tracking Number</label>
              <p className="mt-1 text-base font-semibold text-gray-900 font-mono">
                {transfer.tracking_number}
              </p>
            </div>
          )}
        </div>
        {transfer.notes && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-500">Notes</label>
            <p className="mt-1 text-base text-gray-700 bg-gray-50 p-3 rounded">
              {transfer.notes}
            </p>
          </div>
        )}
      </div>

      {/* Transfer Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer Progress</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              ['draft', 'approved', 'in_transit', 'received'].includes(transfer.status)
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Created</p>
              <p className="text-xs text-gray-500">Draft</p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 ${
            ['approved', 'in_transit', 'received'].includes(transfer.status)
              ? 'bg-green-500'
              : 'bg-gray-300'
          }`} />
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              ['approved', 'in_transit', 'received'].includes(transfer.status)
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Approved</p>
              <p className="text-xs text-gray-500">Ready to ship</p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 ${
            ['in_transit', 'received'].includes(transfer.status)
              ? 'bg-green-500'
              : 'bg-gray-300'
          }`} />
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              ['in_transit', 'received'].includes(transfer.status)
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">In Transit</p>
              <p className="text-xs text-gray-500">Shipped</p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 ${
            transfer.status === 'received'
              ? 'bg-green-500'
              : 'bg-gray-300'
          }`} />
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              transfer.status === 'received'
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              4
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Received</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transfer Items</h2>
        </div>
        {transfer.items && transfer.items.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Requested Qty</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Shipped Qty</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Received Qty</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">UoM</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transfer.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.product_variant?.product?.name || item.product?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {item.product_variant?.sku || item.sku || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                    {item.qty_requested}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {item.qty_shipped !== null ? (
                      <span className="font-semibold text-blue-600">{item.qty_shipped}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {item.qty_received !== null ? (
                      <span className="font-semibold text-green-600">{item.qty_received}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.uom?.name || item.uom?.abbreviation || 'EA'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No items in this transfer
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {transfer.status === 'draft' && (
            <>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Approve Transfer
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Cancel Transfer
              </button>
            </>
          )}
          {transfer.status === 'approved' && (
            <>
              <button
                onClick={handleShip}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                Ship Transfer
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Cancel Transfer
              </button>
            </>
          )}
          {transfer.status === 'in_transit' && (
            <button
              onClick={handleReceive}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              Receive Transfer
            </button>
          )}
          {transfer.status === 'received' && (
            <p className="text-green-600 font-medium">
              This transfer has been completed. Items have been received at {transfer.to_warehouse?.name}.
            </p>
          )}
          {transfer.status === 'cancelled' && (
            <p className="text-red-600 font-medium">
              This transfer was cancelled.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
