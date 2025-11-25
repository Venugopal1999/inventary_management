import React, { useState } from 'react';

const InventoryLotsStep = ({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
  onCancel,
}) => {
  const [lots, setLots] = useState(wizardData.lots || {});

  const handleLotChange = (itemId, field, value) => {
    setLots((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleNext = () => {
    updateWizardData({ lots });
    onNext();
  };

  const handleSkip = () => {
    // Skip lot assignment (items without lots won't have lot tracking)
    updateWizardData({ lots: {} });
    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Inventory Lots (Optional)
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Create lot numbers for batch tracking and expiry management. You can skip
        this step if lot tracking is not required.
      </p>

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
                Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Lot Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Mfg Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Exp Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {wizardData.receivedItems?.map((item) => (
              <tr key={item.po_item_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.sku}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.product_name}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">
                  {item.received_qty}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={lots[item.po_item_id]?.lot_no || ''}
                    onChange={(e) =>
                      handleLotChange(item.po_item_id, 'lot_no', e.target.value)
                    }
                    placeholder="LOT-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={lots[item.po_item_id]?.mfg_date || ''}
                    onChange={(e) =>
                      handleLotChange(item.po_item_id, 'mfg_date', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={lots[item.po_item_id]?.exp_date || ''}
                    onChange={(e) =>
                      handleLotChange(item.po_item_id, 'exp_date', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              About Lot Tracking
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Lot numbers help you track batches for quality control, recalls, and
              FEFO (First Expiry First Out) picking. This is especially important
              for perishable goods or products with expiration dates.
            </p>
          </div>
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
            onClick={handleSkip}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-[#FF9900] hover:bg-orange-600 text-white rounded-md transition"
          >
            Next: Putaway
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryLotsStep;
