import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PutawayStep = ({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
  onCancel,
}) => {
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState({});
  const [assignments, setAssignments] = useState(wizardData.locations || {});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/warehouses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Handle paginated response from Laravel
      const data = response.data.data?.data || response.data.data || response.data;
      const warehousesData = Array.isArray(data) ? data : [];
      setWarehouses(warehousesData);

      // Set default warehouse for all items (first warehouse)
      if (warehousesData.length > 0) {
        const defaultWarehouseId = warehousesData[0].id;
        const defaultAssignments = {};

        wizardData.receivedItems?.forEach((item) => {
          defaultAssignments[item.po_item_id] = {
            warehouse_id: defaultWarehouseId,
            location_id: null,
          };
        });

        setAssignments(defaultAssignments);

        // Fetch locations for default warehouse
        fetchLocations(defaultWarehouseId);
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (warehouseId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/warehouses/${warehouseId}/locations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Handle paginated response from Laravel
      const data = response.data.data?.data || response.data.data || response.data;
      const locationsData = Array.isArray(data) ? data : [];
      setLocations((prev) => ({
        ...prev,
        [warehouseId]: locationsData,
      }));
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const handleWarehouseChange = (itemId, warehouseId) => {
    setAssignments((prev) => ({
      ...prev,
      [itemId]: {
        warehouse_id: parseInt(warehouseId),
        location_id: null,
      },
    }));

    // Fetch locations for this warehouse if not already loaded
    if (!locations[warehouseId]) {
      fetchLocations(warehouseId);
    }
  };

  const handleLocationChange = (itemId, locationId) => {
    setAssignments((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        location_id: locationId ? parseInt(locationId) : null,
      },
    }));
  };

  const handleNext = () => {
    // Validate that all items have warehouse assigned
    const allAssigned = wizardData.receivedItems?.every(
      (item) => assignments[item.po_item_id]?.warehouse_id
    );

    if (!allAssigned) {
      alert('Please assign a warehouse for all items');
      return;
    }

    updateWizardData({ locations: assignments, warehouses });
    onNext();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading warehouses...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Putaway</h2>
      <p className="text-sm text-gray-600 mb-6">
        Assign warehouses and bin locations for received items. Location is
        optional, but warehouse is required.
      </p>

      {/* Items Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Product
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Warehouse *
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Location
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {wizardData.receivedItems?.map((item) => {
              const warehouseId = assignments[item.po_item_id]?.warehouse_id;
              const availableLocations = warehouseId
                ? locations[warehouseId] || []
                : [];

              return (
                <tr key={item.po_item_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {item.sku}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.product_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    {item.received_qty}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={warehouseId || ''}
                      onChange={(e) =>
                        handleWarehouseChange(item.po_item_id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                      required
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={assignments[item.po_item_id]?.location_id || ''}
                      onChange={(e) =>
                        handleLocationChange(item.po_item_id, e.target.value)
                      }
                      disabled={!warehouseId || availableLocations.length === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">None (Bulk)</option>
                      {availableLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.code} ({loc.type})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              About Putaway
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Putaway determines where received goods are stored. Warehouse is
              mandatory, but specific bin location is optional. Items without a
              location are stored in bulk areas.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
        >
          Back
        </button>
        <div className="space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-[#FF9900] hover:bg-orange-600 text-white rounded-md transition"
          >
            Next: Review & Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default PutawayStep;
