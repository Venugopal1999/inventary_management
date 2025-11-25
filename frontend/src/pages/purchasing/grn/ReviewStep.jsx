import React, { useState } from 'react';
import axios from 'axios';

const ReviewStep = ({ wizardData, onBack, onCancel, onComplete }) => {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  const getWarehouseName = (warehouseId) => {
    const warehouse = wizardData.warehouses?.find((w) => w.id === warehouseId);
    return warehouse?.name || 'N/A';
  };

  const handlePost = async () => {
    if (!window.confirm('Are you sure you want to post this goods receipt? This action cannot be undone.')) {
      return;
    }

    try {
      setPosting(true);
      setError(null);
      const token = localStorage.getItem('auth_token');

      // Build items payload
      const items = wizardData.receivedItems.map((item) => {
        const assignment = wizardData.locations[item.po_item_id];
        const lotData = wizardData.lots[item.po_item_id];

        return {
          po_item_id: item.po_item_id,
          received_qty: item.received_qty,
          warehouse_id: assignment.warehouse_id,
          location_id: assignment.location_id,
          lot_data: lotData && lotData.lot_no ? lotData : null,
        };
      });

      // Receive items
      await axios.post(
        `${import.meta.env.VITE_API_URL}/goods-receipts/${wizardData.goodsReceiptId}/receive-items`,
        { items },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Post the goods receipt
      await axios.post(
        `${import.meta.env.VITE_API_URL}/goods-receipts/${wizardData.goodsReceiptId}/post`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Success - redirect to goods receipts list
      alert('Goods receipt posted successfully! Stock has been updated.');
      onComplete();
    } catch (err) {
      console.error('Failed to post goods receipt:', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to post goods receipt. Please try again.'
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Review & Post
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Review all details before posting. Posting will create stock movements and
        update inventory balances.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Purchase Order</div>
            <div className="font-medium text-gray-900">
              PO #{wizardData.purchaseOrder?.id}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Supplier</div>
            <div className="font-medium text-gray-900">
              {wizardData.purchaseOrder?.supplier?.name}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Items</div>
            <div className="font-medium text-gray-900">
              {wizardData.receivedItems?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Quantity</div>
            <div className="font-medium text-gray-900">
              {wizardData.receivedItems
                ?.reduce((sum, item) => sum + parseFloat(item.received_qty), 0)
                .toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Items Detail Table */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Items Detail</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Warehouse
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Lot #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Exp Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {wizardData.receivedItems?.map((item) => {
                const assignment = wizardData.locations[item.po_item_id];
                const lot = wizardData.lots[item.po_item_id];

                return (
                  <tr key={item.po_item_id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.product_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {item.received_qty}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {getWarehouseName(assignment?.warehouse_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {lot?.lot_no || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {lot?.exp_date
                        ? new Date(lot.exp_date).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-900">
              Important Notice
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Posting this goods receipt will:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-yellow-700">
              <li>Create stock movements for all items</li>
              <li>Update stock balances and quantities on hand</li>
              <li>Create or update inventory lots</li>
              <li>Update the purchase order status</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={posting}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Back
        </button>
        <div className="space-x-3">
          <button
            onClick={onCancel}
            disabled={posting}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={posting}
            className={`
              px-8 py-2 rounded-md text-white font-medium transition
              ${
                posting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }
            `}
          >
            {posting ? 'Posting...' : 'Post Goods Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
