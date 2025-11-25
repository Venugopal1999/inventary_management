import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SOStatusBadge from '../../components/sales/SOStatusBadge';
import AllocateDrawer from '../../components/sales/AllocateDrawer';
import { ArrowLeftIcon, PencilIcon, CheckCircleIcon, XCircleIcon, TruckIcon, CubeIcon } from '@heroicons/react/24/outline';

const SODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [salesOrder, setSalesOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAllocateDrawerOpen, setIsAllocateDrawerOpen] = useState(false);

  useEffect(() => {
    fetchSalesOrder();
  }, [id]);

  const fetchSalesOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/sales-orders/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSalesOrder(response.data.data || response.data);
    } catch (err) {
      setError('Failed to load sales order details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length !== 3) return '-';
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '-';
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  const handleConfirm = async () => {
    if (!confirm('Confirm this sales order? Stock will be allocated automatically.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/sales-orders/${id}/confirm`,
        { auto_allocate: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('Sales order confirmed and stock allocated successfully!');
      fetchSalesOrder();
    } catch (err) {
      alert('Failed to confirm sales order: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this sales order?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/sales-orders/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('Sales order cancelled successfully!');
      fetchSalesOrder();
    } catch (err) {
      alert('Failed to cancel sales order: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9900]"></div>
          <p className="mt-2 text-gray-600">Loading sales order...</p>
        </div>
      </div>
    );
  }

  if (error || !salesOrder) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Sales order not found'}</p>
          <Link
            to="/sales-orders"
            className="mt-4 inline-block px-4 py-2 bg-[#FF9900] text-white rounded-md hover:bg-orange-600"
          >
            Back to Sales Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/sales-orders"
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {salesOrder.so_number || `SO-${salesOrder.id}`}
              </h1>
              <SOStatusBadge status={salesOrder.status} />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Created on {formatDate(salesOrder.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {salesOrder.status === 'draft' && (
            <>
              <Link
                to={`/sales-orders/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Confirm & Allocate
              </button>
            </>
          )}
          {['draft', 'confirmed', 'allocated'].includes(salesOrder.status) && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition"
            >
              <XCircleIcon className="w-4 h-4" />
              Cancel
            </button>
          )}
          {['confirmed', 'allocated', 'partial'].includes(salesOrder.status) && (
            <button
              onClick={() => setIsAllocateDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              <CubeIcon className="w-4 h-4" />
              View ATP / Allocate
            </button>
          )}
          {['allocated', 'partial'].includes(salesOrder.status) && (
            <Link
              to={`/shipments/new?so_id=${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF9900] text-white rounded-md hover:bg-orange-600 transition"
            >
              <TruckIcon className="w-4 h-4" />
              Create Shipment
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Order Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Customer</label>
                <p className="mt-1 text-gray-900">{salesOrder.customer?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">{salesOrder.customer?.code || ''}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Order Date</label>
                <p className="mt-1 text-gray-900">{formatDate(salesOrder.order_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Promise Date</label>
                <p className="mt-1 text-gray-900">{formatDate(salesOrder.promise_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Currency</label>
                <p className="mt-1 text-gray-900">{salesOrder.currency || 'USD'}</p>
              </div>
              {salesOrder.notes && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-gray-900">{salesOrder.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
            {salesOrder.items && salesOrder.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Ordered</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Allocated</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Shipped</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesOrder.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {item.product_variant?.product?.name || 'Product'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.product_variant?.sku || ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {Math.floor(item.ordered_qty || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span className={item.allocated_qty >= item.ordered_qty ? 'text-green-600' : 'text-orange-600'}>
                            {Math.floor(item.allocated_qty || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span className={item.shipped_qty >= item.ordered_qty ? 'text-green-600' : 'text-gray-600'}>
                            {Math.floor(item.shipped_qty || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {formatCurrency(item.unit_price, salesOrder.currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(item.line_total, salesOrder.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No items in this order</p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(salesOrder.subtotal, salesOrder.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({salesOrder.tax_rate || 0}%)</span>
                <span className="text-gray-900">{formatCurrency(salesOrder.tax_amount, salesOrder.currency)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-lg text-gray-900">
                  {formatCurrency(salesOrder.total, salesOrder.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Progress */}
          {salesOrder.status !== 'draft' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fulfillment Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Allocated</span>
                    <span className="text-gray-900">{salesOrder.allocation_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${salesOrder.allocation_percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Shipped</span>
                    <span className="text-gray-900">{salesOrder.shipment_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${salesOrder.shipment_percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stock Reservations */}
          {salesOrder.items?.some(item => item.reservations?.length > 0) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Reservations</h2>
              <div className="space-y-3 text-sm">
                {salesOrder.items?.map((item) =>
                  item.reservations?.map((res, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{item.product_variant?.sku}</p>
                        <p className="text-gray-500 text-xs">
                          {res.warehouse?.name || 'Warehouse'}
                          {res.lot?.lot_no && ` - Lot: ${res.lot.lot_no}`}
                        </p>
                      </div>
                      <span className="text-gray-900">{Math.floor(res.qty_reserved)} units</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Allocate Drawer */}
      <AllocateDrawer
        isOpen={isAllocateDrawerOpen}
        onClose={() => setIsAllocateDrawerOpen(false)}
        salesOrder={salesOrder}
        onAllocated={() => {
          fetchSalesOrder();
        }}
      />
    </div>
  );
};

export default SODetail;
