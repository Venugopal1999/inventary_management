import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CountSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [count, setCount] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [countedQty, setCountedQty] = useState('');
  const scanInputRef = useRef(null);

  useEffect(() => {
    fetchCount();
  }, [id]);

  const fetchCount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/stock-counts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCount(response.data);
      setItems(response.data.items || []);
    } catch (err) {
      console.error('Error fetching count:', err);
      alert('Failed to load count');
      navigate('/inventory/counts');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (e) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      const searchTerm = scanInput.trim().toLowerCase();

      // Find item by barcode/SKU - check multiple possible data structures
      const foundItem = items.find(item => {
        const sku = item.product_variant?.sku || item.sku || '';
        const barcode = item.product_variant?.barcode || item.barcode || '';

        return sku.toLowerCase() === searchTerm ||
               barcode.toLowerCase() === searchTerm ||
               sku.toLowerCase().includes(searchTerm) ||
               barcode.toLowerCase().includes(searchTerm);
      });

      if (foundItem) {
        setSelectedItem(foundItem);
        setCountedQty('');
        setScanInput('');
      } else {
        alert(`Product with SKU/barcode "${scanInput}" not found in this count`);
        setScanInput('');
      }
    }
  };

  const handleRecordCount = async () => {
    if (!selectedItem || !countedQty) {
      alert('Please select an item and enter counted quantity');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_URL}/stock-counts/${id}/items/${selectedItem.id}/record`,
        { counted_qty: parseFloat(countedQty) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh count data
      await fetchCount();

      setSelectedItem(null);
      setCountedQty('');
      alert('Count recorded successfully!');

      // Focus back on scan input
      scanInputRef.current?.focus();
    } catch (err) {
      alert('Failed to record count: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleManualSelect = (item) => {
    setSelectedItem(item);
    setCountedQty('');
  };

  const handleComplete = async () => {
    const uncountedCount = items.filter(i => i.counted_qty === null).length;

    if (uncountedCount > 0) {
      if (!confirm(`There are ${uncountedCount} uncounted items. Are you sure you want to mark this count as completed?`)) {
        return;
      }
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/stock-counts/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Count marked as completed!');
      navigate('/inventory/counts');
    } catch (err) {
      alert('Failed to complete count: ' + (err.response?.data?.message || err.message));
    }
  };

  const getProgressStats = () => {
    const totalItems = items.length;
    const countedItems = items.filter(i => i.counted_qty !== null).length;
    const withVariance = items.filter(i => i.variance !== null && i.variance !== 0).length;

    return { totalItems, countedItems, withVariance };
  };

  const stats = getProgressStats();
  const progress = stats.totalItems > 0 ? (stats.countedItems / stats.totalItems) * 100 : 0;

  if (loading) {
    return (
        <div className="p-8 text-center text-gray-500">Loading...</div>
    );
  }

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Count Session: {count?.count_number}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {count?.warehouse?.name} - {count?.scope === 'cycle' ? 'Cycle Count' : 'Full Count'}
          </p>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {stats.countedItems}/{stats.totalItems}
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#FF9900] h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Counted</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              {stats.countedItems}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Remaining</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">
              {stats.totalItems - stats.countedItems}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">With Variance</div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {stats.withVariance}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Instructions & Scan */}
          <div className="lg:col-span-1 space-y-4">
            {/* Scan Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Item</h2>
              <input
                ref={scanInputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={handleScan}
                placeholder="Scan barcode or enter SKU..."
                className="w-full text-2xl border-2 border-gray-300 rounded-md px-4 py-3 focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900]"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Press Enter after scanning
              </p>
            </div>

            {/* Selected Item */}
            {selectedItem && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">Selected Item</h2>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-blue-600 font-medium">Product</div>
                    <div className="text-sm font-semibold text-blue-900">
                      {selectedItem.product_variant?.product?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-blue-700">
                      SKU: {selectedItem.product_variant?.sku || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-blue-600 font-medium">Expected Qty</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {selectedItem.expected_qty}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-blue-600 font-medium mb-1">
                      Counted Qty *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={countedQty}
                      onChange={(e) => setCountedQty(e.target.value)}
                      className="w-full text-2xl border-2 border-blue-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleRecordCount}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold text-lg"
                  >
                    Record Count
                  </button>

                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      setCountedQty('');
                      scanInputRef.current?.focus();
                    }}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-md font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#FF9900] text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">1</span>
                  <span>Scan item barcode or select from table</span>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#FF9900] text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">2</span>
                  <span>Enter the actual counted quantity</span>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#FF9900] text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">3</span>
                  <span>Click "Record Count" to save</span>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#FF9900] text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">4</span>
                  <span>Repeat for all items</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Right: Items Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Count Items</h2>
                <button
                  onClick={handleComplete}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm"
                >
                  Complete Count
                </button>
              </div>

              <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">SKU</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Expected</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Counted</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Variance</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 transition ${
                          selectedItem?.id === item.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-sm">
                          {item.product_variant?.product?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {item.product_variant?.sku || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {item.expected_qty}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.counted_qty !== null ? (
                            <span className="font-semibold text-blue-600">
                              {item.counted_qty}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.variance !== null && item.variance !== 0 ? (
                            <span className={`font-semibold ${
                              item.variance > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.variance > 0 ? '+' : ''}{item.variance}
                            </span>
                          ) : item.variance === 0 ? (
                            <span className="text-gray-500">0</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.counted_qty !== null ? (
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              item.variance === 0
                                ? 'bg-green-100 text-green-800'
                                : item.variance > 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.variance === 0 ? 'Match' : item.variance > 0 ? 'Over' : 'Under'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <button
                            onClick={() => handleManualSelect(item)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {item.counted_qty !== null ? 'Recount' : 'Count'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
