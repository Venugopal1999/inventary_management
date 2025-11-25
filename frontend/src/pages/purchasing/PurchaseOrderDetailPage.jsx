import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import POStatusBadge from '../../components/purchasing/POStatusBadge';

/**
 * Purchase Order Detail Page
 * Displays complete details of a purchase order
 */
const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchaseOrder();
  }, [id]);

  const fetchPurchaseOrder = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPo(data.data);
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Parse date as local date to avoid timezone shift
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#FF9900]"></div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Purchase Order not found</p>
        <button
          onClick={() => navigate('/purchase-orders')}
          className="mt-4 bg-[#FF9900] hover:bg-[#E88B00] text-white px-6 py-3 rounded-lg font-medium transition"
        >
          Back to Purchase Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#232F3E]">{po.po_number}</h1>
            <p className="text-gray-600 mt-1">Purchase Order Details</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/purchase-orders')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to List
            </button>
            {['draft', 'submitted'].includes(po.status) && (
              <button
                onClick={() => navigate(`/purchase-orders/${id}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PO Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className="mt-2">
              <POStatusBadge status={po.status} />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Order Date</div>
            <div className="mt-2 text-lg font-semibold">{formatDate(po.order_date)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Expected Date</div>
            <div className="mt-2 text-lg font-semibold">{formatDate(po.expected_date)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="mt-2 text-lg font-bold text-green-600">
              {formatCurrency(po.total_amount)}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier & Warehouse Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Supplier Information</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{po.supplier?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Code:</span>
              <span className="ml-2 font-medium">{po.supplier?.code || 'N/A'}</span>
            </div>
            {po.supplier?.email && (
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2">{po.supplier.email}</span>
              </div>
            )}
            {po.supplier?.phone && (
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2">{po.supplier.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Warehouse</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{po.warehouse?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Code:</span>
              <span className="ml-2 font-medium">{po.warehouse?.code || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">Line Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Ordered Qty</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Received Qty</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Unit Cost</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {po.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product_variant?.product?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.product_variant?.sku || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm text-gray-900">{item.ordered_qty}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm text-gray-900">{item.received_qty}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm text-gray-900">{formatCurrency(item.unit_cost)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.line_total)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-md ml-auto space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(po.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax:</span>
            <span className="font-medium">{formatCurrency(po.tax_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping:</span>
            <span className="font-medium">{formatCurrency(po.shipping_cost)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-bold text-lg">Total:</span>
            <span className="font-bold text-lg text-green-600">
              {formatCurrency(po.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {po.notes && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="font-semibold text-lg mb-2">Notes</h3>
          <p className="text-gray-700">{po.notes}</p>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderDetailPage;
