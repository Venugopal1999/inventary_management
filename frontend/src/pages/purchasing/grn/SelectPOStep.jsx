import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SelectPOStep = ({ wizardData, updateWizardData, onNext, onCancel }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPOId, setSelectedPOId] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/purchase-orders`,
        {
          params: {
            status: ['approved', 'ordered', 'partial'].join(','),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Handle paginated response from Laravel
      const data = response.data.data?.data || response.data.data || response.data;
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load purchase orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPO = async () => {
    if (!selectedPOId) {
      alert('Please select a purchase order');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('auth_token');

      // Fetch PO details for receiving
      const poResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/purchase-orders/${selectedPOId}/for-receiving`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const poData = poResponse.data.data;

      // Create goods receipt
      const grnResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/goods-receipts`,
        {
          purchase_order_id: selectedPOId,
          received_at: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update wizard data
      updateWizardData({
        purchaseOrder: poData,
        goodsReceiptId: grnResponse.data.data.id,
      });

      // Proceed to next step
      onNext();
    } catch (err) {
      setError('Failed to create goods receipt');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading purchase orders...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Select Purchase Order
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose a purchase order to receive goods for. Only approved and ordered
        POs are shown.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* PO List */}
      <div className="space-y-3">
        {purchaseOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No purchase orders available for receiving
          </div>
        ) : (
          purchaseOrders.map((po) => (
            <div
              key={po.id}
              onClick={() => setSelectedPOId(po.id)}
              className={`
                border rounded-lg p-4 cursor-pointer transition
                ${
                  selectedPOId === po.id
                    ? 'border-[#FF9900] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="font-semibold text-gray-900">
                      PO #{po.id}
                    </div>
                    <div className="text-sm text-gray-600">
                      {po.supplier?.name || 'N/A'}
                    </div>
                    <div
                      className={`
                        text-xs px-2 py-1 rounded-full
                        ${
                          po.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : po.status === 'ordered'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      `}
                    >
                      {po.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Order Date: {new Date(po.order_date).toLocaleDateString()}
                    {po.expected_date && (
                      <span className="ml-4">
                        Expected: {new Date(po.expected_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Items: {po.items?.length || 0}
                  </div>
                </div>
                <div>
                  <input
                    type="radio"
                    checked={selectedPOId === po.id}
                    onChange={() => setSelectedPOId(po.id)}
                    className="w-5 h-5 text-[#FF9900]"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSelectPO}
          disabled={!selectedPOId || creating}
          className={`
            px-6 py-2 rounded-md text-white transition
            ${
              !selectedPOId || creating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#FF9900] hover:bg-orange-600'
            }
          `}
        >
          {creating ? 'Creating...' : 'Next: Receive Items'}
        </button>
      </div>
    </div>
  );
};

export default SelectPOStep;
