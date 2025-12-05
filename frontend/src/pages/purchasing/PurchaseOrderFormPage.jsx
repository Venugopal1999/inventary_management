import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Purchase Order Form Page
 * For creating new or editing existing purchase orders
 */
const PurchaseOrderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    supplier_id: '',
    warehouse_id: '',
    status: 'draft',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    currency: 'USD',
    shipping_cost: '0.00',
    notes: '',
    terms_and_conditions: 'Standard terms and conditions apply.',
    supplier_reference: '',
  });

  const [lineItems, setLineItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFormData();
    if (id) {
      fetchPurchaseOrder();
    }
  }, [id]);

  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch suppliers
      const suppliersRes = await fetch(`${import.meta.env.VITE_API_URL}/suppliers`, { headers });
      const suppliersData = await suppliersRes.json();
      if (suppliersData.success) {
        const suppliersList = suppliersData.data?.data || suppliersData.data || [];
        setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);
      }

      // Fetch warehouses - mock for now
      setWarehouses([
        { id: 1, name: 'Main Warehouse', code: 'WH-001' },
        { id: 2, name: 'Secondary Warehouse', code: 'WH-002' },
      ]);

      // Fetch products
      const productsRes = await fetch(`${import.meta.env.VITE_API_URL}/products`, { headers });
      const productsData = await productsRes.json();

      let productsList = [];
      if (Array.isArray(productsData)) {
        productsList = productsData;
      } else if (productsData.success && productsData.data) {
        productsList = Array.isArray(productsData.data) ? productsData.data : [];
      } else if (productsData.data) {
        productsList = Array.isArray(productsData.data) ? productsData.data : [];
      }

      const variants = [];
      productsList.forEach(product => {
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach(variant => {
            variants.push({
              id: variant.id,
              name: `${product.name} - ${variant.sku}`,
              sku: variant.sku,
              product_id: product.id,
            });
          });
        }
      });
      setProducts(variants);

      // Fetch UOMs
      const uomsRes = await fetch(`${import.meta.env.VITE_API_URL}/uoms`, { headers });
      const uomsData = await uomsRes.json();

      let uomsList = [];
      if (Array.isArray(uomsData)) {
        uomsList = uomsData;
      } else if (uomsData.success && uomsData.data) {
        uomsList = Array.isArray(uomsData.data) ? uomsData.data : [];
      }
      setUoms(uomsList);

    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrder = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data) {
        const po = data.data;

        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        setFormData({
          supplier_id: po.supplier_id || '',
          warehouse_id: po.warehouse_id || '',
          status: po.status || 'draft',
          order_date: formatDateForInput(po.order_date) || new Date().toISOString().split('T')[0],
          expected_date: formatDateForInput(po.expected_date) || '',
          currency: po.currency || 'USD',
          shipping_cost: po.shipping_cost || '0.00',
          notes: po.notes || '',
          terms_and_conditions: po.terms_and_conditions || 'Standard terms and conditions apply.',
          supplier_reference: po.supplier_reference || '',
        });

        if (po.items && Array.isArray(po.items)) {
          const items = po.items.map(item => ({
            id: item.id || Date.now() + Math.random(),
            product_variant_id: item.product_variant_id || '',
            uom_id: item.uom_id || '',
            ordered_qty: item.ordered_qty || 0,
            unit_cost: item.unit_cost || 0,
            discount_percent: item.discount_percent || 0,
            tax_percent: item.tax_percent || 8.5,
            notes: item.notes || '',
          }));
          setLineItems(items);
        }
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: Date.now(),
      product_variant_id: '',
      uom_id: uoms[0]?.id || '',
      ordered_qty: 1,
      unit_cost: 0,
      discount_percent: 0,
      tax_percent: 8.5,
      notes: '',
    }]);
  };

  const removeLineItem = (id) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateLineTotal = (item) => {
    const subtotal = parseFloat(item.ordered_qty || 0) * parseFloat(item.unit_cost || 0);
    const discount = subtotal * (parseFloat(item.discount_percent || 0) / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (parseFloat(item.tax_percent || 0) / 100);
    return afterDiscount + tax;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    lineItems.forEach(item => {
      const itemSubtotal = parseFloat(item.ordered_qty || 0) * parseFloat(item.unit_cost || 0);
      const discount = itemSubtotal * (parseFloat(item.discount_percent || 0) / 100);
      const afterDiscount = itemSubtotal - discount;
      const tax = afterDiscount * (parseFloat(item.tax_percent || 0) / 100);

      subtotal += afterDiscount;
      totalTax += tax;
    });

    const shipping = parseFloat(formData.shipping_cost || 0);
    const total = subtotal + totalTax + shipping;

    return { subtotal, tax: totalTax, shipping, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('auth_token');

      const payload = {
        ...formData,
        items: lineItems.map(item => ({
          product_variant_id: item.product_variant_id,
          uom_id: item.uom_id,
          ordered_qty: parseFloat(item.ordered_qty),
          unit_cost: parseFloat(item.unit_cost),
          discount_percent: parseFloat(item.discount_percent || 0),
          tax_percent: parseFloat(item.tax_percent || 0),
          notes: item.notes || null,
        })),
      };

      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/purchase-orders/${id}`
        : `${import.meta.env.VITE_API_URL}/purchase-orders`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(isEditMode ? 'Purchase Order updated successfully!' : 'Purchase Order created successfully!');
        navigate('/purchase-orders');
      } else {
        const errorMessage = data.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`;
        setErrors(data.errors || { general: errorMessage });
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error submitting purchase order:', error);
      const errorMsg = `Error ${isEditMode ? 'updating' : 'creating'} purchase order: ${error.message}`;
      setErrors({ general: errorMsg });
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#FF9900]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#232F3E]">
              {isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {isEditMode ? `Editing PO #${id}` : 'Create a new purchase order'}
            </p>
          </div>
          <button
            onClick={() => navigate('/purchase-orders')}
            className="self-start sm:self-auto px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
          >
            ← Back to List
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* General Errors */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 sm:mb-6 text-sm">
            {errors.general}
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                name="warehouse_id"
                value={formData.warehouse_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="ordered">Ordered</option>
                <option value="partial">Partial</option>
                <option value="received">Received</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="order_date"
                value={formData.order_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Expected Delivery Date
              </label>
              <input
                type="date"
                name="expected_date"
                value={formData.expected_date}
                onChange={handleChange}
                min={formData.order_date}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Shipping Cost
              </label>
              <input
                type="number"
                name="shipping_cost"
                value={formData.shipping_cost}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Supplier Reference
              </label>
              <input
                type="text"
                name="supplier_reference"
                value={formData.supplier_reference}
                onChange={handleChange}
                placeholder="e.g., SUP-REF-123456"
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-3 sm:mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Internal notes about this purchase order..."
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            />
          </div>

          <div className="mt-3 sm:mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Terms and Conditions
            </label>
            <textarea
              name="terms_and_conditions"
              value={formData.terms_and_conditions}
              onChange={handleChange}
              rows="2"
              placeholder="Standard terms and conditions apply..."
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-base sm:text-lg">Line Items</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="bg-[#FF9900] hover:bg-[#E88B00] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition text-sm sm:text-base"
            >
              + Add Item
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
              No items added yet. Click "Add Item" to start.
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="font-medium text-sm sm:text-base">Item #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div className="col-span-2 sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Product <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.product_variant_id}
                        onChange={(e) => updateLineItem(item.id, 'product_variant_id', e.target.value)}
                        required
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        UOM <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.uom_id}
                        onChange={(e) => updateLineItem(item.id, 'uom_id', e.target.value)}
                        required
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                      >
                        {uoms.map(uom => (
                          <option key={uom.id} value={uom.id}>
                            {uom.symbol}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Qty <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.ordered_qty}
                        onChange={(e) => updateLineItem(item.id, 'ordered_qty', e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Unit Cost <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.unit_cost}
                        onChange={(e) => updateLineItem(item.id, 'unit_cost', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                      />
                    </div>

                    <div className="hidden sm:block">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        value={item.discount_percent}
                        onChange={(e) => updateLineItem(item.id, 'discount_percent', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                      />
                    </div>

                    <div className="hidden sm:block">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Tax %
                      </label>
                      <input
                        type="number"
                        value={item.tax_percent}
                        onChange={(e) => updateLineItem(item.id, 'tax_percent', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Mobile-only: Discount and Tax in one row */}
                  <div className="grid grid-cols-2 gap-2 mt-2 sm:hidden">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        value={item.discount_percent}
                        onChange={(e) => updateLineItem(item.id, 'discount_percent', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tax %
                      </label>
                      <input
                        type="number"
                        value={item.tax_percent}
                        onChange={(e) => updateLineItem(item.id, 'tax_percent', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateLineItem(item.id, 'notes', e.target.value)}
                      placeholder="Item notes (optional)"
                      className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                    />
                    <div className="text-right sm:ml-4">
                      <span className="text-xs sm:text-sm text-gray-600">Line Total: </span>
                      <span className="font-bold text-base sm:text-lg">
                        ${calculateLineTotal(item).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Order Summary</h3>
          <div className="max-w-md ml-auto space-y-2 text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">${totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium">${totals.shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold text-base sm:text-lg">Total:</span>
              <span className="font-bold text-base sm:text-lg text-green-600">
                ${totals.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/purchase-orders')}
            className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || lineItems.length === 0}
            className="w-full sm:w-auto bg-[#FF9900] hover:bg-[#E88B00] text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {submitting
              ? (isEditMode ? 'Updating...' : 'Creating...')
              : (isEditMode ? 'Update Purchase Order' : 'Create Purchase Order')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderFormPage;
