import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

const ReportDetail = () => {
  const { reportId } = useParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);

  const reportConfig = {
    stock_on_hand: {
      name: 'Stock on Hand by Warehouse',
      endpoint: '/reports/stock-on-hand',
      filters: ['warehouse_id', 'category_id', 'search'],
    },
    inventory_valuation: {
      name: 'Inventory Valuation (FIFO)',
      endpoint: '/reports/inventory-valuation',
      filters: ['warehouse_id', 'category_id'],
    },
    stock_movement: {
      name: 'Stock Movement History',
      endpoint: '/reports/stock-movement',
      filters: ['warehouse_id', 'ref_type', 'date_from', 'date_to'],
    },
    expiry_aging: {
      name: 'Expiry Aging Report',
      endpoint: '/reports/expiry-aging',
      filters: ['warehouse_id', 'days_threshold'],
    },
    movers_analysis: {
      name: 'Top/Slow Movers Analysis',
      endpoint: '/reports/movers-analysis',
      filters: ['warehouse_id', 'date_from', 'date_to', 'limit'],
    },
  };

  useEffect(() => {
    const config = reportConfig[reportId];
    if (config) {
      setReport(config);
      fetchReferenceData();
      fetchReport();
    } else {
      setError('Unknown report type');
      setLoading(false);
    }
  }, [reportId]);

  const fetchReferenceData = async () => {
    try {
      const [warehousesRes, categoriesRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/categories'),
      ]);
      setWarehouses(warehousesRes.data.data || warehousesRes.data || []);
      setCategories(categoriesRes.data.data || categoriesRes.data || []);
    } catch (err) {
      console.error('Error fetching reference data:', err);
    }
  };

  const fetchReport = async (customFilters = {}) => {
    const config = reportConfig[reportId];
    if (!config) return;

    try {
      setLoading(true);
      const params = { ...filters, ...customFilters };
      const res = await api.get(config.endpoint, { params });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    fetchReport(filters);
  };

  const handleExport = async (format) => {
    const config = reportConfig[reportId];
    if (!config) return;

    try {
      const response = await api.get(config.endpoint, {
        params: { ...filters, format },
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportId}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const renderFilters = () => {
    const config = reportConfig[reportId];
    if (!config) return null;

    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {config.filters.includes('warehouse_id') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.warehouse_id || ''}
                onChange={(e) => handleFilterChange('warehouse_id', e.target.value)}
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          {config.filters.includes('category_id') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.category_id || ''}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {config.filters.includes('search') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="SKU or product name"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          )}

          {config.filters.includes('ref_type') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.ref_type || ''}
                onChange={(e) => handleFilterChange('ref_type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="GRN">Goods Receipt</option>
                <option value="SHIPMENT">Shipment</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="TRANSFER">Transfer</option>
                <option value="COUNT">Stock Count</option>
              </select>
            </div>
          )}

          {config.filters.includes('date_from') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
          )}

          {config.filters.includes('date_to') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          )}

          {config.filters.includes('days_threshold') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days Threshold</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.days_threshold || ''}
                onChange={(e) => handleFilterChange('days_threshold', e.target.value)}
              >
                <option value="">All</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
              </select>
            </div>
          )}

          {config.filters.includes('limit') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.limit || '20'}
                onChange={(e) => handleFilterChange('limit', e.target.value)}
              >
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
                <option value="100">Top 100</option>
              </select>
            </div>
          )}

          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (!data?.summary) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.summary).map(([key, value]) => {
            if (typeof value === 'object') return null;
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            const displayValue = key.includes('value') || key.includes('cost')
              ? formatCurrency(value)
              : formatNumber(value);
            return (
              <div key={key} className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-lg font-semibold">{displayValue}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStockOnHandData = () => {
    if (!data?.data) return null;

    return (
      <div className="space-y-6">
        {data.data.map((warehouse) => (
          <div key={warehouse.warehouse_id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="font-semibold text-lg">{warehouse.warehouse_name}</h3>
              <div className="text-sm text-gray-500 mt-1">
                {warehouse.total_items} items | {formatNumber(warehouse.total_qty)} units | {formatCurrency(warehouse.total_value)}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">On Hand</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Reserved</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Available</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {warehouse.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{item.product_name}</td>
                      <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(item.qty_on_hand)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(item.qty_reserved)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(item.qty_available)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(item.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderValuationData = () => {
    if (!data?.data) return null;

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Warehouse</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Avg Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">FIFO Value</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Std Value</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{item.product_name}</td>
                  <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                  <td className="px-4 py-3 text-sm">{item.warehouse_name}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatNumber(item.qty_on_hand)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.avg_unit_cost)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(item.fifo_value)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.standard_value)}</td>
                  <td className={`px-4 py-3 text-sm text-right ${item.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(item.variance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMovementData = () => {
    if (!data?.data) return null;

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Direction</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(item.date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{item.product_name}</td>
                  <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                  <td className="px-4 py-3 text-sm">{item.ref_type}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.direction === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">{formatNumber(Math.abs(item.qty_delta))}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.total_value)}</td>
                  <td className="px-4 py-3 text-sm">{item.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderExpiryData = () => {
    if (!data?.data) return null;

    const buckets = [
      { key: 'expired', label: 'Expired', color: 'red' },
      { key: 'expiring_30_days', label: 'Expiring in 30 Days', color: 'yellow' },
      { key: 'expiring_60_days', label: 'Expiring in 60 Days', color: 'orange' },
      { key: 'expiring_90_days', label: 'Expiring in 90 Days', color: 'blue' },
      { key: 'beyond_90_days', label: 'Beyond 90 Days', color: 'green' },
    ];

    return (
      <div className="space-y-6">
        {buckets.map((bucket) => {
          const items = data.data[bucket.key] || [];
          if (items.length === 0) return null;

          return (
            <div key={bucket.key} className="bg-white rounded-lg shadow overflow-hidden">
              <div className={`bg-${bucket.color}-50 px-6 py-4 border-b border-${bucket.color}-200`}>
                <h3 className={`font-semibold text-lg text-${bucket.color}-800`}>
                  {bucket.label} ({items.length} lots)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Lot No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Exp Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Days Left</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{item.lot_no}</td>
                        <td className="px-4 py-3 text-sm">{item.product_name}</td>
                        <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatNumber(item.qty_on_hand)}</td>
                        <td className="px-4 py-3 text-sm">{item.exp_date}</td>
                        <td className={`px-4 py-3 text-sm text-right ${item.days_until_expiry < 0 ? 'text-red-600 font-medium' : ''}`}>
                          {item.days_until_expiry}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.total_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMoversData = () => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* Top Movers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b">
            <h3 className="font-semibold text-lg text-green-800">Top Movers</h3>
            <p className="text-sm text-green-600">Fast-selling products in the period</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Qty Sold</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Movements</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total Value</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Avg Daily</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.top_movers?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatNumber(item.total_qty_sold)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatNumber(item.movement_count)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.total_value)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatNumber(item.avg_daily_sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slow Movers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b">
            <h3 className="font-semibold text-lg text-orange-800">Slow Movers</h3>
            <p className="text-sm text-orange-600">Low-turnover products with stock on hand</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Qty Sold</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Turnover</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Stock Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.slow_movers?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatNumber(item.stock_on_hand)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatNumber(item.qty_sold)}</td>
                    <td className="px-4 py-3 text-sm text-right">{(item.turnover_rate * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">{formatCurrency(item.stock_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderData = () => {
    switch (reportId) {
      case 'stock_on_hand':
        return renderStockOnHandData();
      case 'inventory_valuation':
        return renderValuationData();
      case 'stock_movement':
        return renderMovementData();
      case 'expiry_aging':
        return renderExpiryData();
      case 'movers_analysis':
        return renderMoversData();
      default:
        return <div className="text-gray-500">No data renderer for this report type</div>;
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
        <Link to="/reports" className="ml-4 text-red-600 underline">Back to Reports</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link to="/reports" className="text-orange-500 hover:text-orange-600 text-sm mb-2 inline-block">
            &larr; Back to Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{report?.name || 'Report'}</h1>
          {data?.generated_at && (
            <p className="text-gray-500 text-sm mt-1">
              Generated: {new Date(data.generated_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Summary & Data */}
      {!loading && data && (
        <>
          {renderSummary()}
          {renderData()}
        </>
      )}
    </div>
  );
};

export default ReportDetail;
