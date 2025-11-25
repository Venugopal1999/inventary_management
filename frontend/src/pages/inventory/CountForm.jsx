import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CountForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({
    warehouse_id: '',
    location_id: '',
    scope: 'cycle',
    scheduled_at: '',
    notes: '',
    auto_post_if_no_variance: false,
    variance_threshold: '',
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (formData.warehouse_id) {
      fetchLocations(formData.warehouse_id);
    } else {
      setLocations([]);
    }
  }, [formData.warehouse_id]);

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWarehouses(response.data.data || response.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const fetchLocations = async (warehouseId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/warehouses/${warehouseId}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setLocations([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        warehouse_id: parseInt(formData.warehouse_id),
        location_id: formData.location_id ? parseInt(formData.location_id) : null,
        scope: formData.scope,
        scheduled_at: formData.scheduled_at || null,
        notes: formData.notes || null,
        auto_post_if_no_variance: formData.auto_post_if_no_variance,
        variance_threshold: formData.variance_threshold ? parseFloat(formData.variance_threshold) : null,
      };

      const response = await axios.post(`${API_URL}/stock-counts`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Stock count created successfully!');

      // Ask if user wants to start counting now
      if (confirm('Do you want to start counting now?')) {
        const countId = response.data.data.id;
        await axios.post(`${API_URL}/stock-counts/${countId}/start`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        navigate(`/inventory/counts/${countId}/session`);
      } else {
        navigate('/inventory/counts');
      }
    } catch (err) {
      console.error('Error creating count:', err);
      alert('Failed to create count: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Stock Count</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new cycle count or full stock take
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Count Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse *
                </label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value, location_id: '' })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
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
                  Scope *
                </label>
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="cycle">Cycle Count (Specific Location)</option>
                  <option value="full">Full Count (Entire Warehouse)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.scope === 'cycle'
                    ? 'Count specific locations for routine accuracy checks'
                    : 'Count all items in the warehouse for comprehensive audit'}
                </p>
              </div>

              {formData.scope === 'cycle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (Optional)
                  </label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">All Locations</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.code} - {location.type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                  placeholder="Additional notes about this count..."
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.auto_post_if_no_variance}
                    onChange={(e) => setFormData({ ...formData, auto_post_if_no_variance: e.target.checked })}
                    className="rounded border-gray-300 text-[#FF9900] focus:ring-[#FF9900]"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Auto-post if no variances found
                  </span>
                </label>
                <p className="ml-6 mt-1 text-xs text-gray-500">
                  Automatically post the count if all items match expected quantities
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variance Threshold (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.variance_threshold}
                  onChange={(e) => setFormData({ ...formData, variance_threshold: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., 5.00"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Flag items with variance exceeding this percentage
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/inventory/counts')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#FF9900] hover:bg-[#E88B00] text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Count'}
            </button>
          </div>
        </form>
      </div>
  );
}
