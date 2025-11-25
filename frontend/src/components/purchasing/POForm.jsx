import React, { useState, useEffect } from 'react';

/**
 * Purchase Order Form Component
 * Form for creating and editing purchase orders
 */
const POForm = ({ poId = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    warehouse_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    shipping_cost: '0.00',
    notes: '',
    items: [],
  });

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFormData();
    if (poId) {
      fetchPurchaseOrder();
    }
  }, [poId]);

  const fetchFormData = async () => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      // Fetch suppliers
      const suppliersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers?active=true`, { headers });
      const suppliersData = await suppliersRes.json();
      if (suppliersData.success) {
        setSuppliers(suppliersData.data.data || []);
      }

      // Fetch warehouses (from public endpoint)
      const warehousesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
      // Note: In production, you'd have a dedicated warehouses endpoint

      // Fetch product variants (simplified)
      const variantsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, { headers });
      const variantsData = await variantsRes.json();
      if (variantsData.success) {
        setProductVariants(variantsData.data.data || []);
      }

      // Fetch UOMs
      const uomsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/uoms`);
      const uomsData = await uomsRes.json();
      if (uomsData.success) {
        setUoms(uomsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const fetchPurchaseOrder = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/purchase-orders/${poId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_variant_id: '',
          uom_id: '',
          ordered_qty: '1',
          unit_cost: '0.00',
          discount_percent: '0',
          tax_percent: '8.5',
          notes: '',
        },
      ],
    });
  };

  const removeLineItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateLineTotal = (item) => {
    const qty = parseFloat(item.ordered_qty) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    const discount = parseFloat(item.discount_percent) || 0;
    const tax = parseFloat(item.tax_percent) || 0;

    const subtotal = qty * cost;
    const discountAmount = (subtotal * discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * tax) / 100;
    const total = afterDiscount + taxAmount;

    return total.toFixed(2);
  };

  const calculateGrandTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => {
      return sum + parseFloat(calculateLineTotal(item));
    }, 0);
    const shipping = parseFloat(formData.shipping_cost) || 0;
    return (itemsTotal + shipping).toFixed(2);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplier_id) newErrors.supplier_id = 'Supplier is required';
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Warehouse is required';
    if (formData.items.length === 0) newErrors.items = 'At least one line item is required';

    formData.items.forEach((item, index) => {
      if (!item.product_variant_id) newErrors[`item_${index}_product`] = 'Product is required';
      if (!item.ordered_qty || item.ordered_qty <= 0) newErrors[`item_${index}_qty`] = 'Quantity must be greater than 0';
      if (!item.unit_cost || item.unit_cost < 0) newErrors[`item_${index}_cost`] = 'Unit cost is required';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const url = poId
        ? `${import.meta.env.VITE_API_URL}/api/purchase-orders/${poId}`
        : `${import.meta.env.VITE_API_URL}/api/purchase-orders`;

      const method = poId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Purchase order ${poId ? 'updated' : 'created'} successfully!`);
        if (onSave) onSave(data.data);
      } else {
        alert('Error saving purchase order: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      alert('Error saving purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#232F3E]">
            {poId ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h1>
          <p className="text-gray-600 mt-1">Fill in the details to create a new purchase order</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* PO Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#232F3E] mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent ${
                    errors.supplier_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.code})
                    </option>
                  ))}
                </select>
                {errors.supplier_id && <p className="text-red-500 text-xs mt-1">{errors.supplier_id}</p>}
              </div>

              {/* Warehouse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  name="warehouse_id"
                  value={formData.warehouse_id}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent ${
                    errors.warehouse_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select warehouse...</option>
                  <option value="1">Main Warehouse</option>
                  <option value="2">Secondary Warehouse</option>
                </select>
                {errors.warehouse_id && <p className="text-red-500 text-xs mt-1">{errors.warehouse_id}</p>}
              </div>

              {/* Order Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                <input
                  type="date"
                  name="order_date"
                  value={formData.order_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                />
              </div>

              {/* Expected Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  name="expected_date"
                  value={formData.expected_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                />
              </div>

              {/* Shipping Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost</label>
                <input
                  type="number"
                  name="shipping_cost"
                  value={formData.shipping_cost}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                  placeholder="Add any notes or special instructions..."
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#232F3E]">Line Items</h2>
              <button
                type="button"
                onClick={addLineItem}
                className="bg-[#FF9900] hover:bg-[#E88B00] text-white px-4 py-2 rounded-md font-medium transition"
              >
                + Add Item
              </button>
            </div>

            {errors.items && <p className="text-red-500 text-sm mb-4">{errors.items}</p>}

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                      <select
                        value={item.product_variant_id}
                        onChange={(e) => updateLineItem(index, 'product_variant_id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors[`item_${index}_product`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select...</option>
                        {productVariants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.sku}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.ordered_qty}
                        onChange={(e) => updateLineItem(index, 'ordered_qty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost</label>
                      <input
                        type="number"
                        value={item.unit_cost}
                        onChange={(e) => updateLineItem(index, 'unit_cost', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Discount %</label>
                      <input
                        type="number"
                        value={item.discount_percent}
                        onChange={(e) => updateLineItem(index, 'discount_percent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-semibold">
                          ${calculateLineTotal(item)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="ml-2 text-red-600 hover:text-red-800 p-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">${calculateGrandTotal()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Shipping:</span>
                  <span className="font-semibold">${parseFloat(formData.shipping_cost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg font-bold text-[#232F3E]">
                  <span>TOTAL:</span>
                  <span>${calculateGrandTotal()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#FF9900] hover:bg-[#E88B00] text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (poId ? 'Update Purchase Order' : 'Create Purchase Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default POForm;
