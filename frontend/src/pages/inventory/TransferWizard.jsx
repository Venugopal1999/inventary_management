import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WizardStepper from '../../components/wizard/WizardStepper';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function TransferWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [uoms, setUoms] = useState([]);

  const [formData, setFormData] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    carrier: '',
    tracking_number: '',
    notes: '',
    items: [],
  });

  const [newItem, setNewItem] = useState({
    product_variant_id: '',
    qty_requested: '',
    uom_id: '',
    unit_cost: '',
    notes: '',
  });

  const steps = [
    { name: 'Select From Warehouse' },
    { name: 'Select To Warehouse' },
    { name: 'Add Items' },
    { name: 'Review & Submit' },
  ];

  useEffect(() => {
    fetchMasterData();
    if (id) {
      fetchTransfer();
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

  const fetchTransfer = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/transfers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transfer = response.data;
      setFormData({
        from_warehouse_id: transfer.from_warehouse_id,
        to_warehouse_id: transfer.to_warehouse_id,
        carrier: transfer.carrier || '',
        tracking_number: transfer.tracking_number || '',
        notes: transfer.notes || '',
        items: transfer.items || [],
      });
    } catch (err) {
      console.error('Error fetching transfer:', err);
      alert('Failed to load transfer');
      navigate('/inventory/transfers');
    }
  };

  const handleAddItem = () => {
    if (!newItem.product_variant_id || !newItem.qty_requested || !newItem.uom_id) {
      alert('Please fill in all required fields');
      return;
    }

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ...newItem,
          qty_requested: parseFloat(newItem.qty_requested),
          unit_cost: newItem.unit_cost ? parseFloat(newItem.unit_cost) : null,
        },
      ],
    });

    setNewItem({
      product_variant_id: '',
      qty_requested: '',
      uom_id: '',
      unit_cost: '',
      notes: '',
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleNext = () => {
    if (currentStep === 0 && !formData.from_warehouse_id) {
      alert('Please select a source warehouse');
      return;
    }
    if (currentStep === 1 && !formData.to_warehouse_id) {
      alert('Please select a destination warehouse');
      return;
    }
    if (currentStep === 1 && formData.from_warehouse_id === formData.to_warehouse_id) {
      alert('Source and destination warehouses must be different');
      return;
    }
    if (currentStep === 2 && formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
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
          qty_requested: parseFloat(item.qty_requested),
          uom_id: parseInt(item.uom_id),
          unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : null,
          notes: item.notes || null,
        })),
      };

      if (id) {
        await axios.put(`${API_URL}/transfers/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Transfer updated successfully!');
      } else {
        await axios.post(`${API_URL}/transfers`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Transfer created successfully!');
      }

      navigate('/inventory/transfers');
    } catch (err) {
      console.error('Error saving transfer:', err);
      alert('Failed to save transfer: ' + (err.response?.data?.message || err.message));
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

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === parseInt(warehouseId));
    return warehouse?.name || 'N/A';
  };

  return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit' : 'New'} Inter-Warehouse Transfer
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Transfer inventory between warehouses with full tracking
          </p>
        </div>

        <WizardStepper steps={steps} currentStep={currentStep} />

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          {/* Step 1: Select From Warehouse */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Step 1: Select Source Warehouse
              </h2>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Warehouse *
                </label>
                <select
                  value={formData.from_warehouse_id}
                  onChange={(e) => setFormData({ ...formData, from_warehouse_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Source Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Select To Warehouse */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Step 2: Select Destination Warehouse
              </h2>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Warehouse *
                </label>
                <select
                  value={formData.to_warehouse_id}
                  onChange={(e) => setFormData({ ...formData, to_warehouse_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Destination Warehouse</option>
                  {warehouses
                    .filter(w => w.id !== parseInt(formData.from_warehouse_id))
                    .map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Add Items */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Step 3: Add Items to Transfer
              </h2>

              {/* Add Item Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Add Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
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
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.qty_requested}
                      onChange={(e) => setNewItem({ ...newItem, qty_requested: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                      placeholder="0"
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
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add Item
                </button>
              </div>

              {/* Items Table */}
              {formData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">UoM</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">{getProductName(item.product_variant_id)}</td>
                          <td className="px-4 py-2 text-sm">{item.qty_requested}</td>
                          <td className="px-4 py-2 text-sm">
                            {uoms.find(u => u.id === parseInt(item.uom_id))?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm text-right">
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No items added yet. Use the form above to add items.
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Step 4: Review & Submit
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">From Warehouse</label>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {getWarehouseName(formData.from_warehouse_id)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">To Warehouse</label>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {getWarehouseName(formData.to_warehouse_id)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Items to Transfer</label>
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">UoM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">{getProductName(item.product_variant_id)}</td>
                          <td className="px-4 py-2 text-sm">{item.qty_requested}</td>
                          <td className="px-4 py-2 text-sm">
                            {uoms.find(u => u.id === parseInt(item.uom_id))?.name || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Carrier (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.carrier}
                      onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., FedEx, UPS"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.tracking_number}
                      onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Tracking number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                    placeholder="Additional notes about this transfer..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            <div className="space-x-3">
              <button
                type="button"
                onClick={() => navigate('/inventory/transfers')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#FF9900] hover:bg-[#E88B00] text-white px-6 py-2 rounded-md font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-[#FF9900] hover:bg-[#E88B00] text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Transfer'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
