import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function ReorderRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    product_variant_id: '',
    warehouse_id: '',
    min_qty: '',
    max_qty: '',
    reorder_qty: '',
    preferred_supplier_id: '',
    lead_time_days: 7,
    is_active: true,
    notes: '',
  });

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchRules();
    fetchWarehouses();
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/reorder-rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data || response.data;
      setRules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch reorder rules:', error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data || response.data;
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      setWarehouses([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data || response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data || response.data;
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      setSuppliers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      if (editingRule) {
        await axios.put(`${API_URL}/reorder-rules/${editingRule.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/reorder-rules`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Failed to save reorder rule:', error);
      alert(error.response?.data?.message || 'Failed to save reorder rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      product_variant_id: rule.product_variant_id,
      warehouse_id: rule.warehouse_id,
      min_qty: rule.min_qty,
      max_qty: rule.max_qty,
      reorder_qty: rule.reorder_qty || '',
      preferred_supplier_id: rule.preferred_supplier_id || '',
      lead_time_days: rule.lead_time_days,
      is_active: rule.is_active,
      notes: rule.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reorder rule?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/reorder-rules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRules();
    } catch (error) {
      console.error('Failed to delete reorder rule:', error);
    }
  };

  const toggleActive = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/reorder-rules/${id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRules();
    } catch (error) {
      console.error('Failed to toggle rule status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      product_variant_id: '',
      warehouse_id: '',
      min_qty: '',
      max_qty: '',
      reorder_qty: '',
      preferred_supplier_id: '',
      lead_time_days: 7,
      is_active: true,
      notes: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reorder rules...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reorder Rules</h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure min/max stock levels for automatic replenishment
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRule(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition"
            >
              Add Reorder Rule
            </button>
          </div>
        </div>

        {/* Rules Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Min Qty</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Max Qty</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Lead Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No reorder rules configured. Click "Add Reorder Rule" to create one.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {rule.product_variant?.product?.name || 'N/A'}
                      <br />
                      <span className="text-xs text-gray-500">{rule.product_variant?.sku}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {rule.warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rule.min_qty}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rule.max_qty}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {rule.preferred_supplier?.name || 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rule.lead_time_days} days</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(rule.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          rule.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingRule ? 'Edit Reorder Rule' : 'Add Reorder Rule'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Variant *
                    </label>
                    <select
                      value={formData.product_variant_id}
                      onChange={(e) =>
                        setFormData({ ...formData, product_variant_id: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                      required
                      disabled={editingRule}
                    >
                      <option value="">Select Product</option>
                      {products.map((product) =>
                        product.variants?.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {product.name} - {variant.sku}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warehouse *
                    </label>
                    <select
                      value={formData.warehouse_id}
                      onChange={(e) =>
                        setFormData({ ...formData, warehouse_id: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                      required
                      disabled={editingRule}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Qty (Reorder Point) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_qty}
                      onChange={(e) => setFormData({ ...formData, min_qty: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Qty (Order Up To) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_qty}
                      onChange={(e) => setFormData({ ...formData, max_qty: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Qty (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.reorder_qty}
                      onChange={(e) => setFormData({ ...formData, reorder_qty: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                      placeholder="Leave blank to order to max qty"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Supplier
                    </label>
                    <select
                      value={formData.preferred_supplier_id}
                      onChange={(e) =>
                        setFormData({ ...formData, preferred_supplier_id: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      value={formData.lead_time_days}
                      onChange={(e) =>
                        setFormData({ ...formData, lead_time_days: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2"
                      rows="2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
