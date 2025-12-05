import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import POStatusBadge from './POStatusBadge';

/**
 * Purchase Orders List Component
 * Displays a table of purchase orders with filtering and sorting
 */
const POList = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    supplier_id: '',
  });
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchPurchaseOrders();
  }, [filters, sortBy, sortOrder]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const params = new URLSearchParams({
        ...filters,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPurchaseOrders(data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setFilters({ ...filters, status });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Parse the date - handle both ISO format and date-only strings
      let date;
      if (dateString.includes('T')) {
        // Already has time component
        date = new Date(dateString);
      } else {
        // Date-only string (YYYY-MM-DD), parse as UTC to avoid timezone shift
        date = new Date(dateString + 'T00:00:00Z');
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const handleCreatePO = () => {
    navigate('/purchase-orders/new');
  };

  const handleViewPO = (id) => {
    navigate(`/purchase-orders/${id}`);
  };

  const handleEditPO = (id) => {
    navigate(`/purchase-orders/${id}/edit`);
  };

  const handleDownloadPDF = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders/${id}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PO-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  return (
    <div className="px-3 sm:px-4 lg:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#232F3E]">Purchase Orders</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage supplier purchase orders</p>
          </div>
          <button
            onClick={handleCreatePO}
            className="w-full sm:w-auto bg-[#FF9900] hover:bg-[#E88B00] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base"
          >
            + Create Purchase Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <input
              type="text"
              placeholder="Search PO# or supplier..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="partial">Partial</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={() => setFilters({ search: '', status: '', supplier_id: '' })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-gray-200 border-t-[#FF9900]"></div>
            <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">Loading purchase orders...</p>
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-gray-600 text-base sm:text-lg">No purchase orders found</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Try adjusting your filters or create a new purchase order</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('po_number')}
                    >
                      PO Number {sortBy === 'po_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('supplier_id')}
                    >
                      Supplier
                    </th>
                    <th
                      className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('order_date')}
                    >
                      Order Date {sortBy === 'order_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                      Expected Date
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('total_amount')}
                    >
                      Total {sortBy === 'total_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{po.po_number}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-900">{po.supplier?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{po.supplier?.code || ''}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(po.order_date)}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-gray-900">
                          {po.expected_date ? formatDate(po.expected_date) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <POStatusBadge status={po.status} />
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(po.total_amount)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleViewPO(po.id)}
                          className="text-[#FF9900] hover:text-[#E88B00] mr-2 lg:mr-3"
                        >
                          View
                        </button>
                        {['draft', 'submitted'].includes(po.status) && (
                          <button
                            onClick={() => handleEditPO(po.id)}
                            className="text-blue-600 hover:text-blue-800 mr-2 lg:mr-3"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadPDF(po.id)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{po.po_number}</div>
                      <div className="text-xs text-gray-500">{po.supplier?.name || 'N/A'}</div>
                    </div>
                    <POStatusBadge status={po.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <div>
                      <span className="text-gray-500">Order:</span> {formatDate(po.order_date)}
                    </div>
                    <div>
                      <span className="text-gray-500">Expected:</span> {po.expected_date ? formatDate(po.expected_date) : 'N/A'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(po.total_amount)}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewPO(po.id)}
                        className="text-[#FF9900] hover:text-[#E88B00] text-sm font-medium"
                      >
                        View
                      </button>
                      {['draft', 'submitted'].includes(po.status) && (
                        <button
                          onClick={() => handleEditPO(po.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPDF(po.id)}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Total Orders</div>
          <div className="text-lg sm:text-2xl font-bold text-[#232F3E] mt-1">{purchaseOrders.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Pending Approval</div>
          <div className="text-lg sm:text-2xl font-bold text-blue-600 mt-1">
            {purchaseOrders.filter((po) => po.status === 'submitted').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Awaiting Receipt</div>
          <div className="text-lg sm:text-2xl font-bold text-yellow-600 mt-1">
            {purchaseOrders.filter((po) => ['ordered', 'partial'].includes(po.status)).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Total Value</div>
          <div className="text-lg sm:text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(purchaseOrders.reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POList;
