import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AllocateDrawer = ({ isOpen, onClose, salesOrder, onAllocated }) => {
  const [allocating, setAllocating] = useState(false);
  const [atpResults, setAtpResults] = useState({});

  useEffect(() => {
    if (isOpen && salesOrder) {
      checkATPForAllItems();
    }
  }, [isOpen, salesOrder]);

  const checkATPForAllItems = async () => {
    if (!salesOrder?.items) return;

    const results = {};
    for (const item of salesOrder.items) {
      const remainingToAllocate = (item.ordered_qty || 0) - (item.allocated_qty || 0);

      // If already fully allocated, no need to check ATP
      if (remainingToAllocate <= 0) {
        results[item.id] = {
          can_fulfill: true,
          shortage: 0,
          on_hand: 0,
          reserved: 0,
          available: 0,
          fully_allocated: true
        };
        continue;
      }

      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/atp/check`,
          {
            product_variant_id: item.product_variant_id,
            required_qty: remainingToAllocate,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        results[item.id] = response.data.data;
      } catch (err) {
        console.error('ATP check failed:', err);
        results[item.id] = { can_fulfill: false, shortage: remainingToAllocate };
      }
    }
    setAtpResults(results);
  };

  const handleAllocate = async () => {
    if (!salesOrder) return;

    if (!confirm('Allocate stock for this sales order using FEFO/FIFO logic?')) {
      return;
    }

    try {
      setAllocating(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/sales-orders/${salesOrder.id}/allocate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('Stock allocated successfully!');
      if (onAllocated) {
        onAllocated(response.data.data.sales_order);
      }
      onClose();
    } catch (err) {
      alert('Failed to allocate stock: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setAllocating(false);
    }
  };

  const handleReleaseReservations = async () => {
    if (!salesOrder) return;

    if (!confirm('Release all stock reservations for this sales order?')) {
      return;
    }

    try {
      setAllocating(true);
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/sales-orders/${salesOrder.id}/release-reservations`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('Stock reservations released successfully!');
      if (onAllocated) {
        onAllocated();
      }
      onClose();
    } catch (err) {
      alert('Failed to release reservations: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setAllocating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Stock Allocation</h2>
              <p className="text-sm text-gray-600 mt-1">
                Review stock availability and allocate using FEFO/FIFO logic
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Sales Order Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">SO Number:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {salesOrder?.so_number || `SO-${salesOrder?.id}`}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {salesOrder?.customer?.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Order Date:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {salesOrder?.order_date}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">
                  {salesOrder?.status}
                </span>
              </div>
            </div>
          </div>

          {/* Items and ATP Check */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Items & Availability</h3>

            {salesOrder?.items?.map((item) => {
              const atp = atpResults[item.id];
              const remainingToAllocate = item.ordered_qty - item.allocated_qty;

              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  {/* Product Info */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.product_variant?.product?.name} - {item.product_variant?.sku}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Ordered: {item.ordered_qty} | Allocated: {item.allocated_qty} |
                        Remaining: {remainingToAllocate}
                      </div>
                    </div>
                    {atp && (
                      <div>
                        {atp.fully_allocated ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircleIcon className="w-5 h-5 mr-1" />
                            <span className="text-sm font-medium">Fully Allocated</span>
                          </div>
                        ) : atp.can_fulfill ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircleIcon className="w-5 h-5 mr-1" />
                            <span className="text-sm font-medium">Can Fulfill</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <ExclamationTriangleIcon className="w-5 h-5 mr-1" />
                            <span className="text-sm font-medium">Short {atp.shortage} units</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ATP Details */}
                  {atp && !atp.fully_allocated && (
                    <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">On Hand:</span>
                        <span className="font-medium text-gray-900">{atp.on_hand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reserved:</span>
                        <span className="font-medium text-gray-900">{atp.reserved}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="text-gray-600 font-medium">Available:</span>
                        <span className="font-bold text-gray-900">{atp.available}</span>
                      </div>
                    </div>
                  )}

                  {/* Reservations */}
                  {item.reservations && item.reservations.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Current Reservations:
                      </div>
                      <div className="space-y-1">
                        {item.reservations.map((res, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex justify-between bg-blue-50 p-2 rounded">
                            <span>
                              {res.warehouse?.name || 'Warehouse'}
                              {res.location?.code && ` - ${res.location.code}`}
                              {res.lot?.lot_no && ` (Lot: ${res.lot.lot_no})`}
                            </span>
                            <span className="font-medium">{res.qty_reserved} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Allocation Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 text-sm text-blue-700">
                <p className="font-medium">FEFO/FIFO Allocation</p>
                <p className="mt-1">
                  Stock will be allocated using First Expiry First Out (FEFO) for lot-tracked items,
                  falling back to First In First Out (FIFO) for standard items.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              disabled={allocating}
            >
              Close
            </button>
            {salesOrder?.status === 'allocated' && (
              <button
                onClick={handleReleaseReservations}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition disabled:opacity-50"
                disabled={allocating}
              >
                {allocating ? 'Releasing...' : 'Release Reservations'}
              </button>
            )}
            {(salesOrder?.status === 'confirmed' || salesOrder?.status === 'allocated') && (
              <button
                onClick={handleAllocate}
                className="flex-1 px-4 py-2 bg-[#FF9900] hover:bg-orange-600 text-white rounded-md transition disabled:opacity-50"
                disabled={allocating}
              >
                {allocating ? 'Allocating...' : 'Allocate Stock'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AllocateDrawer;
