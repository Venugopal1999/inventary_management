import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import StockBadge from '../../components/common/StockBadge';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [search, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/products', { params });
      const productsData = response.data.data || [];
      setProducts(productsData);

      // Fetch stock data for all product variants
      await fetchStockData(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      // For now, use mock data if API fails
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = async (productsData) => {
    const stockDataMap = {};

    // Fetch stock for each product's first variant
    const stockPromises = productsData.map(async (product) => {
      const variantId = product.variants?.[0]?.id;
      if (variantId) {
        try {
          const response = await api.get(`/stock/variants/${variantId}/summary`);
          stockDataMap[variantId] = response.data.data || response.data;
        } catch (error) {
          console.error(`Error fetching stock for variant ${variantId}:`, error);
          // Set default values if fetch fails
          stockDataMap[variantId] = {
            qty_on_hand: 0,
            qty_available: 0,
            state: 'out_of_stock'
          };
        }
      }
    });

    await Promise.all(stockPromises);
    setStockData(stockDataMap);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleImportClick = () => {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.onchange = (e) => handleFileSelect(e.target.files[0]);
    fileInput.click();
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/products/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Products imported successfully!');
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error('Error importing products:', error);
      alert('Failed to import products: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="px-3 sm:px-4 lg:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Products</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <button onClick={handleImportClick} className="btn-secondary text-sm sm:text-base">
            Import CSV
          </button>
          <Link to="/products/new" className="btn-primary text-sm sm:text-base text-center">
            Add New Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 sm:mb-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-sm sm:text-base"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card p-0 sm:p-0">
        {loading ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-500 text-sm sm:text-base">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-6 sm:py-8 px-4">
            <p className="text-gray-500 mb-4 text-sm sm:text-base">No products found</p>
            <Link to="/products/new" className="btn-primary text-sm sm:text-base">
              Create Your First Product
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-xs">ID</th>
                    <th className="text-xs">Name</th>
                    <th className="text-xs">SKU</th>
                    <th className="text-xs">Category</th>
                    <th className="text-xs">UOM</th>
                    <th className="text-xs">Stock</th>
                    <th className="text-xs">Status</th>
                    <th className="text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const variantId = product.variants?.[0]?.id;
                    const stock = variantId ? stockData[variantId] : null;

                    return (
                      <tr key={product.id}>
                        <td className="text-sm">{product.id}</td>
                        <td className="font-medium text-sm">{product.name}</td>
                        <td className="text-sm">{product.variants?.[0]?.sku || '-'}</td>
                        <td className="text-sm">{product.category?.name || '-'}</td>
                        <td className="text-sm">{product.uom?.symbol || '-'}</td>
                        <td>
                          {stock ? (
                            <div className="flex flex-col space-y-1">
                              <StockBadge
                                state={stock.state}
                                size="sm"
                              />
                              <span className="text-xs text-gray-600">
                                On Hand: {Math.floor(stock.qty_on_hand || 0)}
                              </span>
                              <span className="text-xs text-gray-600">
                                Reserved: {Math.floor(stock.qty_reserved || 0)}
                              </span>
                              <span className="text-xs text-gray-600">
                                Available: {Math.floor(stock.qty_available || 0)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Loading...</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              product.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : product.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <Link
                              to={`/products/${product.id}/edit`}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {products.map((product) => {
                const variantId = product.variants?.[0]?.id;
                const stock = variantId ? stockData[variantId] : null;

                return (
                  <div key={product.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{product.name}</h3>
                        <p className="text-xs text-gray-500">SKU: {product.variants?.[0]?.sku || '-'}</p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                      <div>
                        <span className="text-gray-500">Category:</span> {product.category?.name || '-'}
                      </div>
                      <div>
                        <span className="text-gray-500">UOM:</span> {product.uom?.symbol || '-'}
                      </div>
                    </div>
                    {stock && (
                      <div className="flex items-center gap-2 mb-3">
                        <StockBadge state={stock.state} size="sm" />
                        <span className="text-xs text-gray-600">
                          {Math.floor(stock.qty_available || 0)} available
                        </span>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductList;
