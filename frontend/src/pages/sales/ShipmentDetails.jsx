import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const ShipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShipment();
  }, [id]);

  const fetchShipment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/shipments/${id}`);
      setShipment(response.data);
    } catch (err) {
      console.error('Failed to fetch shipment:', err);
      setError('Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this shipment? This action cannot be undone.')) {
      return;
    }

    try {
      setCancelling(true);
      await api.post(`/shipments/${id}/cancel`);
      alert('Shipment cancelled successfully');
      fetchShipment(); // Refresh the data
    } catch (err) {
      console.error('Failed to cancel shipment:', err);
      alert('Failed to cancel shipment: ' + (err.response?.data?.message || err.message));
    } finally {
      setCancelling(false);
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
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Loading shipment details...
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">
          {error || 'Shipment not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipment #{shipment.id}</h1>
          <p className="mt-1 text-sm text-gray-500">View shipment details and tracking information</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/shipments"
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
          >
            Back to Shipments
          </Link>
          {shipment.status !== 'shipped' && shipment.status !== 'delivered' && shipment.status !== 'cancelled' && (
            <>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Shipment'}
              </button>
              <Link
                to={`/shipments/${shipment.id}/process`}
                className="rounded-md bg-[#FF9900] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
              >
                Continue Processing
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Status</h2>
            <div className="flex items-center gap-4">
              {getStatusBadge(shipment.status)}
              {shipment.shipped_at && (
                <span className="text-sm text-gray-500">
                  Shipped on {formatDate(shipment.shipped_at)}
                </span>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${shipment.created_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-600">Created: {formatDate(shipment.created_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${shipment.picked_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-600">Picked: {formatDate(shipment.picked_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${shipment.packed_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-600">Packed: {formatDate(shipment.packed_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${shipment.shipped_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-600">Shipped: {formatDate(shipment.shipped_at)}</span>
                </div>
                {shipment.delivered_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600">Delivered: {formatDate(shipment.delivered_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipped Items</h2>
            {shipment.items && shipment.items.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Lot</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Qty Shipped</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shipment.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.product_variant?.product?.name || 'Unknown Product'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.product_variant?.sku || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.lot?.lot_no || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.shipped_qty} {item.uom?.abbreviation || ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        ${parseFloat(item.unit_cost_fifo_snap || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">No items in this shipment</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sales Order Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Order</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Order Number</span>
                <p className="font-medium text-gray-900">
                  <Link to={`/sales-orders/${shipment.sales_order_id}`} className="text-[#FF9900] hover:underline">
                    {shipment.sales_order?.so_number || `SO-${shipment.sales_order_id}`}
                  </Link>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Customer</span>
                <p className="font-medium text-gray-900">
                  {shipment.sales_order?.customer?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Carrier</span>
                <p className="font-medium text-gray-900">{shipment.carrier || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Tracking Number</span>
                <p className="font-medium text-gray-900">{shipment.tracking_number || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Shipping Cost</span>
                <p className="font-medium text-gray-900">
                  {shipment.shipping_cost ? `$${parseFloat(shipment.shipping_cost).toFixed(2)}` : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Package Info */}
          {(shipment.box_weight || shipment.box_dimensions) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h2>
              <div className="space-y-3">
                {shipment.box_weight && (
                  <div>
                    <span className="text-sm text-gray-500">Weight</span>
                    <p className="font-medium text-gray-900">{shipment.box_weight} kg</p>
                  </div>
                )}
                {shipment.box_dimensions && (
                  <div>
                    <span className="text-sm text-gray-500">Dimensions</span>
                    <p className="font-medium text-gray-900">
                      {shipment.box_dimensions.length} x {shipment.box_dimensions.width} x {shipment.box_dimensions.height} {shipment.box_dimensions.unit || 'cm'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {shipment.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-600">{shipment.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetails;
