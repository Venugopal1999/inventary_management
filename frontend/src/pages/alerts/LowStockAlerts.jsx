import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function LowStockAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState({
    severity: '',
    is_resolved: false,
  });

  useEffect(() => {
    fetchAlerts();
    fetchSummary();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (filter.severity) params.append('severity', filter.severity);
      params.append('is_resolved', filter.is_resolved);

      const response = await axios.get(`${API_URL}/low-stock-alerts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch low stock alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/low-stock-alerts/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const generateAlerts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/low-stock-alerts/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAlerts();
      fetchSummary();
      alert('Low stock alerts refreshed successfully!');
    } catch (error) {
      console.error('Failed to generate alerts:', error);
      alert('Failed to refresh alerts');
    }
  };

  const resolveAlert = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/low-stock-alerts/${id}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAlerts();
      fetchSummary();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const sendNotifications = async () => {
    if (!confirm('Send email/webhook notifications for all pending alerts?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/low-stock-alerts/send-notifications`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`${response.data.sent} notification(s) sent successfully!`);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to send notifications:', error);
      alert('Failed to send notifications');
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: 'bg-red-100 text-red-800',
      warning: 'bg-orange-100 text-orange-800',
      info: 'bg-yellow-100 text-yellow-800',
    };
    return badges[severity] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟠';
      case 'info':
        return '🟡';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading low stock alerts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor and manage low stock warnings across all warehouses
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={sendNotifications}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition"
              >
                Send Notifications
              </button>
              <button
                onClick={generateAlerts}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition"
              >
                Refresh Alerts
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{summary.total_unresolved}</div>
                <div className="text-sm text-gray-500">Total Unresolved</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{summary.critical || 0}</div>
                <div className="text-sm text-gray-500">Critical</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{summary.warning || 0}</div>
                <div className="text-sm text-gray-500">Warning</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">{summary.notifications_pending || 0}</div>
                <div className="text-sm text-gray-500">Pending Notifications</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filter.severity}
                onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.is_resolved}
                onChange={(e) => setFilter({ ...filter, is_resolved: e.target.value === 'true' })}
                className="border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="false">Unresolved</option>
                <option value="true">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Alerts</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Current Qty</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Min Qty</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Shortage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Notification</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No alerts found. Click "Refresh Alerts" to check for low stock items.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getSeverityBadge(alert.severity)}`}>
                        <span>{getSeverityIcon(alert.severity)}</span>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {alert.product_variant?.product?.name || 'N/A'}
                      <br />
                      <span className="text-xs text-gray-500">{alert.product_variant?.sku}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {alert.warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600">
                      {alert.current_qty}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{alert.min_qty}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                      -{alert.shortage_qty}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {alert.notification_sent ? (
                        <span className="text-green-600 text-xs">
                          Sent {new Date(alert.notification_sent_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {!alert.is_resolved ? (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-gray-500">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg shadow p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">About Low Stock Alerts</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Alerts are automatically generated when stock falls below the minimum quantity defined in reorder rules</li>
            <li>• Critical alerts (red) indicate out-of-stock or items below 25% of minimum</li>
            <li>• Warning alerts (orange) indicate items at 26-50% of minimum quantity</li>
            <li>• Info alerts (yellow) indicate items at 51-100% of minimum quantity</li>
            <li>• Use "Send Notifications" to email or webhook alert these alerts to stakeholders</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
