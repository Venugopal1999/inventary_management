import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdjustmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [uoms, setUoms] = useState([]);

  const [formData, setFormData] = useState({
    warehouse_id: '',
    reason: 'damage',
    reason_notes: '',
    requires_approval: true,
    items: [],
  });

  const [newItem, setNewItem] = useState({
    product_variant_id: '',
    qty_delta: '',
    uom_id: '',
    unit_cost: '',
    note: '',
  });

  useEffect(() => {
    fetchMasterData();
    if (id) {
      fetchAdjustment();
    }
  }, [id]);

  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const [warehousesRes, productsRes, uomsRes] = await Promise.all([
        axios.get(`${API_URL}/warehouses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/uoms`),
      ]);

      setWarehouses(warehousesRes.data.data || warehousesRes.data);
      setProducts(productsRes.data.data || productsRes.data);
      setUoms(uomsRes.data.data || uomsRes.data);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const fetchAdjustment = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/stock-adjustments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adjustment = response.data;
      setFormData({
        warehouse_id: adjustment.warehouse_id,
        reason: adjustment.reason,
        reason_notes: adjustment.reason_notes || '',
        requires_approval: adjustment.requires_approval,
        items: adjustment.items || [],
      });
    } catch (err) {
      console.error('Error fetching adjustment:', err);
      alert('Failed to load adjustment');
      navigate('/inventory/adjustments');
    }
  };

  const handleAddItem = () => {
    if (!newItem.product_variant_id || !newItem.qty_delta || !newItem.uom_id) {
      alert('Please fill in all required fields');
      return;
    }

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ...newItem,
          qty_delta: parseFloat(newItem.qty_delta),
          unit_cost: newItem.unit_cost ? parseFloat(newItem.unit_cost) : null,
        },
      ],
    });

    setNewItem({
      product_variant_id: '',
      qty_delta: '',
      uom_id: '',
      unit_cost: '',
      note: '',
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          product_variant_id: parseInt(item.product_variant_id),
          qty_delta: parseFloat(item.qty_delta),
          uom_id: parseInt(item.uom_id),
          unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : null,
          note: item.note || null,
        })),
      };

      if (id) {
        await axios.put(`${API_URL}/stock-adjustments/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Adjustment updated successfully!');
      } else {
        const response = await axios.post(`${API_URL}/stock-adjustments`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Auto-submit for approval if required
        if (formData.requires_approval) {
          await axios.post(
            `${API_URL}/stock-adjustments/${response.data.data.id}/submit`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alert('Adjustment created and submitted for approval!');
        } else {
          alert('Adjustment created successfully!');
        }
      }

      navigate('/inventory/adjustments');
    } catch (err) {
      console.error('Error saving adjustment:', err);
      alert('Failed to save adjustment: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (variantId) => {
    const product = products.find(p =>
      p.variants?.some(v => v.id === parseInt(variantId))
    );
    if (!product) return 'Unknown';

    const variant = product.variants?.find(v => v.id === parseInt(variantId));
    return variant ? `${product.name} - ${variant.sku}` : product.name;
  };

  return (
      <div className="p-3 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {id ? 'Edit' : 'New'} Stock Adjustment
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Create a stock adjustment for damage, write-off, found items, etc.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Adjustment Details */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Adjustment Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Warehouse *
                </label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base"
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base"
                  required
                >
                  <option value="damage">Damage</option>
                  <option value="writeoff">Write-off</option>
                  <option value="found">Found</option>
                  <option value="loss">Loss</option>
                  <option value="expired">Expired</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Reason Notes
                </label>
                <textarea
                  value={formData.reason_notes}
                  onChange={(e) => setFormData({ ...formData, reason_notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base"
                  rows="3"
                  placeholder="Explain the reason for this adjustment..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.requires_approval}
                    onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                    className="rounded border-gray-300 text-[#FF9900] focus:ring-[#FF9900]"
                  />
                  <span className="ml-2 text-xs sm:text-sm text-gray-700">
                    Requires supervisor approval
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Items</h2>

            {/* Add Item Form */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded border border-gray-200">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">Add Item</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Product *
                  </label>
                  <select
                    value={newItem.product_variant_id}
                    onChange={(e) => setNewItem({ ...newItem, product_variant_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  >
                    <option value="">Select Product</option>
                    {products.flatMap((product) =>
                      (product.variants || []).map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {product.name} - {variant.sku}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Qty Delta *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.qty_delta}
                    onChange={(e) => setNewItem({ ...newItem, qty_delta: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                    placeholder="e.g., -10 or +5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    UoM *
                  </label>
                  <select
                    value={newItem.uom_id}
                    onChange={(e) => setNewItem({ ...newItem, uom_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  >
                    <option value="">Select</option>
                    {uoms.map((uom) => (
                      <option key={uom.id} value={uom.id}>
                        {uom.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Unit Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.unit_cost}
                    onChange={(e) => setNewItem({ ...newItem, unit_cost: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={newItem.note}
                  onChange={(e) => setNewItem({ ...newItem, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  placeholder="Additional notes for this item..."
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="mt-3 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Item
              </button>
            </div>

            {/* Items Table/Cards */}
            {formData.items.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700">Qty Delta</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700">UoM</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700">Note</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 sm:px-4 py-2 text-sm">{getProductName(item.product_variant_id)}</td>
                          <td className="px-3 sm:px-4 py-2 text-sm">
                            <span className={item.qty_delta < 0 ? 'text-red-600' : 'text-green-600'}>
                              {item.qty_delta > 0 ? '+' : ''}{item.qty_delta}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-sm">
                            {uoms.find(u => u.id === parseInt(item.uom_id))?.name || 'N/A'}
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-sm text-gray-600">{item.note || '-'}</td>
                          <td className="px-3 sm:px-4 py-2 text-sm text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900 flex-1">
                          {getProductName(item.product_variant_id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 text-xs ml-2"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>
                          Qty: <span className={item.qty_delta < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                            {item.qty_delta > 0 ? '+' : ''}{item.qty_delta}
                          </span>
                        </span>
                        <span>UoM: {uoms.find(u => u.id === parseInt(item.uom_id))?.name || 'N/A'}</span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-gray-500 mt-1 truncate">Note: {item.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                No items added yet. Use the form above to add items.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/inventory/adjustments')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-[#FF9900] hover:bg-[#E88B00] text-white px-4 sm:px-6 py-2 rounded-md font-medium disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Saving...' : id ? 'Update' : 'Create'} Adjustment
            </button>
          </div>
        </form>
      </div>
  );
}
