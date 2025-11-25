import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ReceiveItemsStep = ({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
  onCancel,
}) => {
  const [scanInput, setScanInput] = useState('');
  const [receivedQty, setReceivedQty] = useState({});

  const handleScan = (e) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      // Find item by SKU or barcode
      const item = wizardData.purchaseOrder?.items.find(
        (i) => i.sku.toLowerCase() === scanInput.toLowerCase()
      );

      if (item) {
        // Focus on quantity input for this item
        document.getElementById(`qty-${item.id}`)?.focus();
      } else {
        alert('SKU not found in this purchase order');
      }

      setScanInput('');
    }
  };

  const handleQtyChange = (itemId, value) => {
    const numValue = parseFloat(value) || 0;
    setReceivedQty((prev) => ({
      ...prev,
      [itemId]: numValue,
    }));
  };

  const handleNext = () => {
    // Validate that at least one item has received qty
    const hasReceivedItems = Object.values(receivedQty).some((qty) => qty > 0);

    if (!hasReceivedItems) {
      alert('Please receive at least one item');
      return;
    }

    // Validate received quantities don't exceed remaining
    const items = wizardData.purchaseOrder?.items || [];
    for (const item of items) {
      const received = receivedQty[item.id] || 0;
      if (received > item.remaining_qty) {
        alert(
          `Cannot receive ${received} of ${item.sku}. Only ${item.remaining_qty} remaining.`
        );
        return;
      }
    }

    // Build received items array
    const receivedItems = items
      .filter((item) => (receivedQty[item.id] || 0) > 0)
      .map((item) => ({
        po_item_id: item.id,
        product_variant_id: item.product_variant_id,
        sku: item.sku,
        product_name: item.product_name,
        received_qty: receivedQty[item.id],
        unit_cost: item.unit_cost,
        uom: item.uom,
      }));

    updateWizardData({ receivedItems });
    onNext();
  };

  const getTotalReceived = () => {
    return Object.values(receivedQty).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Receive Items
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Scan items or enter quantities to receive. PO #{wizardData.purchaseOrder?.id} -{' '}
        {wizardData.purchaseOrder?.supplier?.name}
      </p>

      {/* Scan Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scan Barcode / Enter SKU
        </label>
        <div className="relative">
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={handleScan}
            placeholder="Scan barcode or type SKU and press Enter..."
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent text-lg"
            autoFocus
          />
          <MagnifyingGlassIcon className="absolute right-3 top-3.5 w-6 h-6 text-gray-400" />
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
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
                Ordered
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                Already Received
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                Remaining
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                Receive Now
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {wizardData.purchaseOrder?.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.sku}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.product_name}
                  <span className="text-gray-500 ml-2">({item.uom})</span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">
                  {item.ordered_qty}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-500">
                  {item.received_qty}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span
                    className={`font-medium ${
                      item.remaining_qty > 0 ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {item.remaining_qty}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    id={`qty-${item.id}`}
                    type="number"
                    min="0"
                    max={item.remaining_qty}
                    step="0.01"
                    value={receivedQty[item.id] || ''}
                    onChange={(e) => handleQtyChange(item.id, e.target.value)}
                    disabled={item.remaining_qty === 0}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-[#FF9900] focus:border-transparent disabled:bg-gray-100"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900">
            Total Items Receiving:
          </span>
          <span className="text-lg font-bold text-blue-900">
            {Object.keys(receivedQty).filter((key) => receivedQty[key] > 0).length}{' '}
            items
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium text-blue-900">
            Total Quantity:
          </span>
          <span className="text-lg font-bold text-blue-900">
            {getTotalReceived().toFixed(2)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
        >
          Back
        </button>
        <div className="space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={getTotalReceived() === 0}
            className={`
              px-6 py-2 rounded-md text-white transition
              ${
                getTotalReceived() === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#FF9900] hover:bg-orange-600'
              }
            `}
          >
            Next: Lot Numbers
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiveItemsStep;
