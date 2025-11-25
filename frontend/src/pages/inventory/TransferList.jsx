import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    <span className={`px-2 py-1 text-xs font-semibold rounded ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
};

export default function TransferList() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransfers();
  }, [filters]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = {};
      if (filters.status) params.status = filters.status;

      const response = await axios.get(`${API_URL}/transfers`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setTransfers(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this transfer?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/transfers/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransfers();
    } catch (err) {
      alert('Failed to approve transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleShip = async (id) => {
    if (!confirm('Are you sure you want to ship this transfer? This will remove stock from the source warehouse.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/transfers/${id}/ship`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransfers();
      alert('Transfer shipped successfully!');
    } catch (err) {
      alert('Failed to ship transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReceive = async (id) => {
    if (!confirm('Are you sure you want to receive this transfer? This will add stock to the destination warehouse.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/transfers/${id}/receive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransfers();
      alert('Transfer received successfully!');
    } catch (err) {
      alert('Failed to receive transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/transfers/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransfers();
    } catch (err) {
      alert('Failed to cancel transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inter-Warehouse Transfers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Transfer inventory between warehouses
            </p>
          </div>
          <Link
            to="/inventory/transfers/new"
            className="bg-[#FF9900] hover:bg-[#E88B00] text-white px-6 py-2 rounded-md font-medium transition"
          >
            New Transfer
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
                <option value="approved">Approved</option>
                <option value="in_transit">In Transit</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
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
          ) : transfers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transfers found. Create your first transfer!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Transfer #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    From Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    To Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {transfer.transfer_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transfer.from_warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transfer.to_warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <TransferStatusBadge status={transfer.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(transfer.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <Link
                        to={`/inventory/transfers/${transfer.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                      {transfer.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleApprove(transfer.id)}
                            className="text-green-600 hover:text-green-800 ml-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleCancel(transfer.id)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {transfer.status === 'approved' && (
                        <>
                          <button
                            onClick={() => handleShip(transfer.id)}
                            className="text-purple-600 hover:text-purple-800 ml-2"
                          >
                            Ship
                          </button>
                          <button
                            onClick={() => handleCancel(transfer.id)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {transfer.status === 'in_transit' && (
                        <button
                          onClick={() => handleReceive(transfer.id)}
                          className="text-green-600 hover:text-green-800 ml-2"
                        >
                          Receive
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
