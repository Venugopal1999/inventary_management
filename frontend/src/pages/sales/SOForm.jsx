import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const SOForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    promise_date: '',
    currency: 'USD',
    tax_rate: 0,
    notes: '',
    items: [],
  });

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    if (isEditMode) {
      fetchSalesOrder();
    }
  }, [id]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/customers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = response.data.data?.data || response.data.data || response.data;
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/products`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = response.data.data?.data || response.data.data || response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchSalesOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/sales-orders/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const so = response.data.data;
      setFormData({
        customer_id: so.customer_id,
        order_date: so.order_date,
        promise_date: so.promise_date || '',
        currency: so.currency || 'USD',
        tax_rate: so.tax_rate || 0,
        notes: so.notes || '',
        items: so.items.map(item => ({
          product_variant_id: item.product_variant_id,
          ordered_qty: item.ordered_qty,
          unit_price: item.unit_price,
          notes: item.notes || '',
        })),
      });
    } catch (err) {
      alert('Failed to fetch sales order: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_variant_id: '',
          ordered_qty: 1,
          unit_price: 0,
          notes: '',
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.ordered_qty) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (parseFloat(formData.tax_rate) || 0) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    for (const item of formData.items) {
      if (!item.product_variant_id || item.ordered_qty <= 0 || item.unit_price < 0) {
        alert('Please fill all item fields correctly');
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      if (isEditMode) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/sales-orders/${id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert('Sales order updated successfully!');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/sales-orders`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert('Sales order created successfully!');
      }
      navigate('/sales-orders');
    } catch (err) {
      alert('Failed to save sales order: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (variantId) => {
    for (const product of products) {
      const variant = product.variants?.find(v => v.id === parseInt(variantId));
      if (variant) {
        return `${product.name} - ${variant.sku}`;
      }
    }
    return 'Unknown';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/sales-orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Sales Orders
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Sales Order' : 'New Sales Order'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode ? 'Update sales order details' : 'Create a new sales order'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Order Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => handleInputChange('customer_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.order_date}
                onChange={(e) => handleInputChange('order_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promise Date
              </label>
              <input
                type="date"
                value={formData.promise_date}
                onChange={(e) => handleInputChange('promise_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tax_rate}
                onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF9900] hover:bg-orange-600 text-white rounded-md transition"
            >
              <PlusIcon className="w-5 h-5" />
              Add Item
            </button>
          </div>

          {formData.items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No items added. Click "Add Item" to start.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Notes
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <select
                          value={item.product_variant_id}
                          onChange={(e) => handleItemChange(index, 'product_variant_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                          required
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
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.ordered_qty}
                          onChange={(e) => handleItemChange(index, 'ordered_qty', e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                          required
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formData.currency} {((parseFloat(item.ordered_qty) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                          placeholder="Notes..."
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals */}
        {formData.items.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  {formData.currency} {calculateSubtotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                <span className="font-medium text-gray-900">
                  {formData.currency} {calculateTax().toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    {formData.currency} {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/sales-orders')}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[#FF9900] hover:bg-orange-600 text-white rounded-md transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Sales Order' : 'Create Sales Order')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SOForm;
