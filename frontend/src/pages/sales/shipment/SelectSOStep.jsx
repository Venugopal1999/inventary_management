import { useState, useEffect } from 'react';
import api from '../../../utils/api';

const SelectSOStep = ({ data, setData, onNext }) => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSO, setSelectedSO] = useState(data.sales_order_id || null);

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sales-orders', {
        params: { status: 'allocated' }
      });
      setSalesOrders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch sales orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (soId) => {
    try {
      const response = await api.get(`/sales-orders/${soId}`);
      setData({
        ...data,
        sales_order_id: soId,
        salesOrder: response.data,
      });
      setSelectedSO(soId);
    } catch (error) {
      console.error('Failed to load sales order:', error);
      alert('Failed to load sales order');
    }
  };

  const handleNext = () => {
    if (!selectedSO) {
      alert('Please select a sales order');
      return;
    }
    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Sales Order to Ship</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose an allocated sales order that is ready to be picked and shipped
      </p>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading sales orders...</div>
      ) : salesOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No allocated sales orders found
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {salesOrders.map((so) => (
            <div
              key={so.id}
              onClick={() => handleSelect(so.id)}
              className={`border rounded-lg p-4 cursor-pointer transition ${
                selectedSO === so.id
                  ? 'border-[#FF9900] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{so.so_number}</h3>
                  <p className="text-sm text-gray-600">
                    Customer: {so.customer?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Order Date: {new Date(so.order_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {so.status?.toUpperCase()}
                  </span>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    Total: ${parseFloat(so.total || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!selectedSO}
          className="rounded-md bg-[#FF9900] px-6 py-2 text-white font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Pick Items
        </button>
      </div>
    </div>
  );
};

export default SelectSOStep;
