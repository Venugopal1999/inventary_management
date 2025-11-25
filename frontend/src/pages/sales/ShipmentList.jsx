import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const ShipmentList = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    tracking_number: '',
  });

  useEffect(() => {
    fetchShipments();
  }, [filters]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      // Filter out empty string values to avoid query issues
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const response = await api.get('/shipments', { params: cleanFilters });
      // Handle paginated response from Laravel
      const data = response.data.data?.data || response.data.data || response.data || [];
      setShipments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: 'bg-gray-100 text-gray-800',
      picking: 'bg-blue-100 text-blue-800',
      packed: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage outbound shipments and deliveries</p>
        </div>
        <Link
          to="/sales-orders"
          className="rounded-md bg-[#FF9900] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
        >
          View Sales Orders
        </Link>
      </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="picking">Picking</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
              <input
                type="text"
                value={filters.tracking_number}
                onChange={(e) => setFilters({ ...filters, tracking_number: e.target.value })}
                placeholder="Search by tracking number..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading shipments...</div>
          ) : shipments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No shipments found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Shipment #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sales Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Carrier</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Shipped Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{shipment.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {shipment.sales_order?.so_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {shipment.sales_order?.customer?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {shipment.tracking_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {shipment.carrier || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(shipment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {shipment.shipped_at ? new Date(shipment.shipped_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={`/shipments/${shipment.id}`}
                        className="text-[#FF9900] hover:text-orange-700 font-medium"
                      >
                        View Details
                      </Link>
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

export default ShipmentList;
