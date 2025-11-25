import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import GRNStatusBadge from '../../components/purchasing/GRNStatusBadge';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const GRNDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGRN();
  }, [id]);

  const fetchGRN = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/goods-receipts/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data.data || response.data;
      setGrn(data);
    } catch (err) {
      setError('Failed to load goods receipt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#FF9900]"></div>
        <p className="ml-4 text-gray-600">Loading goods receipt...</p>
      </div>
    );
  }

  if (error || !grn) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">{error || 'Goods receipt not found'}</p>
        <button
          onClick={() => navigate('/goods-receipts')}
          className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/goods-receipts"
          className="inline-flex items-center text-[#FF9900] hover:text-[#E88B00] mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Goods Receipts
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#232F3E]">
              GRN-{String(grn.id).padStart(5, '0')}
            </h1>
            <p className="text-gray-600 mt-1">Goods Receipt Details</p>
          </div>
          <GRNStatusBadge status={grn.status} />
        </div>
      </div>

      {/* GRN Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Receipt Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Order
            </label>
            <Link
              to={`/purchase-orders/${grn.purchase_order?.id}`}
              className="text-[#FF9900] hover:text-[#E88B00] font-medium"
            >
              {grn.purchase_order?.po_number || `PO #${grn.purchase_order_id}`}
            </Link>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <p className="text-gray-900">
              {grn.purchase_order?.supplier?.name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Received At
            </label>
            <p className="text-gray-900">{formatDate(grn.received_at)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Received By
            </label>
            <p className="text-gray-900">
              {grn.receiver?.name || grn.received_by || 'N/A'}
            </p>
          </div>
          {grn.notes && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">{grn.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Received Items</h2>
        </div>
        {grn.items && grn.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Received Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Lot #
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Unit Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grn.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.product_variant?.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.product_variant?.product?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {parseFloat(item.received_qty).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.location?.code || 'Bulk'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.lot?.lot_no || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      ${parseFloat(item.unit_cost).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600">No items received yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GRNDetailPage;
