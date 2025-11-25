import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import StockBadge from '../../components/common/StockBadge';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [stockData, setStockData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku_policy: 'simple',
    category_id: '',
    uom_id: '',
    barcode: '',
    track_serial: false,
    track_batch: false,
    shelf_life_days: '',
    tax_rate: 0,
    status: 'active',
    image_url: '',
    // Simple SKU fields
    sku: '',
    cost: '',
    price: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDropdownData();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [categoriesRes, uomsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/uoms'),
      ]);
      setCategories(categoriesRes.data || []);
      setUoms(uomsRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      const product = response.data;

      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku_policy: product.sku_policy || 'simple',
        category_id: product.category_id || '',
        uom_id: product.uom_id || '',
        barcode: product.barcode || '',
        track_serial: product.track_serial || false,
        track_batch: product.track_batch || false,
        shelf_life_days: product.shelf_life_days || '',
        tax_rate: product.tax_rate || 0,
        status: product.status || 'active',
        image_url: product.image_url || '',
        sku: product.variants?.[0]?.sku || '',
        cost: product.variants?.[0]?.cost || '',
        price: product.variants?.[0]?.price || '',
      });

      // Fetch stock data for the first variant
      const variantId = product.variants?.[0]?.id;
      if (variantId) {
        await fetchStockData(variantId);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = async (variantId) => {
    try {
      const response = await api.get(`/stock/variants/${variantId}/summary`);
      setStockData(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      // Set default if fetch fails
      setStockData(null);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Failed to save product');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="card">
        <p className="text-center text-gray-500">Loading product...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Product' : 'Create New Product'}
      </h1>

      {/* Stock Information - Only show when editing */}
      {isEdit && stockData && (
        <div className="card mb-6 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Current Stock Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <StockBadge state={stockData.state} size="md" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">On Hand</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor(stockData.qty_on_hand || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.floor(stockData.qty_available || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reserved</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.floor(stockData.qty_reserved || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input"
            />
          </div>

          {/* SKU (for simple products) */}
          {formData.sku_policy === 'simple' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="input"
                required
              />
              {errors.sku && (
                <p className="text-red-500 text-sm mt-1">{errors.sku[0]}</p>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* UOM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit of Measure *
            </label>
            <select
              name="uom_id"
              value={formData.uom_id}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select UOM</option>
              {uoms.map((uom) => (
                <option key={uom.id} value={uom.id}>
                  {uom.name} ({uom.symbol})
                </option>
              ))}
            </select>
            {errors.uom_id && (
              <p className="text-red-500 text-sm mt-1">{errors.uom_id[0]}</p>
            )}
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* Cost */}
          {formData.sku_policy === 'simple' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input"
              />
            </div>
          )}

          {/* Price */}
          {formData.sku_policy === 'simple' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input"
              />
            </div>
          )}

          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              name="tax_rate"
              value={formData.tax_rate}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="100"
              className="input"
            />
          </div>

          {/* Shelf Life Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shelf Life (Days)
            </label>
            <input
              type="number"
              name="shelf_life_days"
              value={formData.shelf_life_days}
              onChange={handleChange}
              min="0"
              className="input"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div className="md:col-span-2 flex space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="track_serial"
                checked={formData.track_serial}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Track Serial Numbers</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="track_batch"
                checked={formData.track_batch}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Track Batch/Lot Numbers</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="md:col-span-2 flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
