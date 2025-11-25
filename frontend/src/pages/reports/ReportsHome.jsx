import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const ReportsHome = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, reportsRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports'),
      ]);
      setDashboard(dashboardRes.data);
      setReports(reportsRes.data.data);
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to load reports data');
    } finally {
      setLoading(false);
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

  const getReportIcon = (icon) => {
    const icons = {
      warehouse: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      dollar: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      history: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      clock: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      trending: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    };
    return icons[icon] || icons.warehouse;
  };

  const getCategoryColor = (category) => {
    const colors = {
      inventory: 'bg-blue-100 text-blue-800',
      financial: 'bg-green-100 text-green-800',
      analytics: 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
        <button onClick={fetchData} className="ml-4 text-red-600 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">View inventory reports and export data</p>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Inventory Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboard.inventory_summary?.total_value)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">SKUs: </span>
                <span className="font-medium">{formatNumber(dashboard.inventory_summary?.total_skus)}</span>
              </div>
              <div>
                <span className="text-gray-500">Units: </span>
                <span className="font-medium">{formatNumber(dashboard.inventory_summary?.total_qty)}</span>
              </div>
            </div>
          </div>

          {/* Valuation Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">FIFO Valuation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboard.valuation_summary?.fifo_value)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Variance: </span>
                <span className={`font-medium ${(dashboard.valuation_summary?.variance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(dashboard.valuation_summary?.variance)}
                </span>
              </div>
            </div>
          </div>

          {/* Expiry Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expiry Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatNumber(dashboard.expiry_summary?.expired_lots)} expired
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <span className="text-yellow-600 font-medium">{dashboard.expiry_summary?.expiring_30_days || 0}</span>
                <p className="text-gray-500">30 days</p>
              </div>
              <div className="text-center">
                <span className="text-orange-600 font-medium">{dashboard.expiry_summary?.expiring_60_days || 0}</span>
                <p className="text-gray-500">60 days</p>
              </div>
              <div className="text-center">
                <span className="text-gray-600 font-medium">{dashboard.expiry_summary?.expiring_90_days || 0}</span>
                <p className="text-gray-500">90 days</p>
              </div>
            </div>
          </div>

          {/* Movers Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Product Movement</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(dashboard.movers_summary?.top_movers_count)} top
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Slow movers: </span>
                <span className="font-medium text-orange-600">
                  {dashboard.movers_summary?.slow_movers_count || 0}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Slow stock value: </span>
                <span className="font-medium">{formatCurrency(dashboard.movers_summary?.slow_movers_stock_value)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Reports */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Available Reports</h2>
          <p className="text-sm text-gray-500 mt-1">Click a report to view details and export options</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link
              key={report.id}
              to={`/reports/${report.id}`}
              className="block bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition border border-gray-200 hover:border-orange-300"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getCategoryColor(report.category).replace('text-', 'bg-').replace('800', '200')}`}>
                  <span className={getCategoryColor(report.category).split(' ')[1]}>
                    {getReportIcon(report.icon)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  <div className="mt-3 flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(report.category)}`}>
                      {report.category}
                    </span>
                    {report.supports_export?.map((format) => (
                      <span key={format} className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                        {format.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Export</h2>
        <p className="text-sm text-gray-500 mb-4">Click a report above to view data and export with authentication</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/reports/stock_on_hand"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Stock on Hand Report
          </Link>
          <Link
            to="/reports/inventory_valuation"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Inventory Valuation
          </Link>
          <Link
            to="/reports/expiry_aging"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expiry Aging
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReportsHome;
