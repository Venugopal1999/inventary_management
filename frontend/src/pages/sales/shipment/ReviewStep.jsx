const ReviewStep = ({ data, onBack, onComplete, isLastStep }) => {
  const handleSubmit = () => {
    const confirmed = window.confirm(
      'Are you sure you want to ship this order? This will reduce inventory and update stock movements.'
    );
    if (confirmed) {
      onComplete();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Confirm Shipment</h2>
      <p className="text-sm text-gray-500 mb-6">
        Please review all details before confirming the shipment
      </p>

      {/* Sales Order Details */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Sales Order Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">SO Number:</span>
            <span className="ml-2 font-medium text-gray-900">
              {data.salesOrder?.so_number || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Customer:</span>
            <span className="ml-2 font-medium text-gray-900">
              {data.salesOrder?.customer?.name || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Order Date:</span>
            <span className="ml-2 font-medium text-gray-900">
              {data.salesOrder?.order_date
                ? new Date(data.salesOrder.order_date).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Amount:</span>
            <span className="ml-2 font-medium text-gray-900">
              ${parseFloat(data.salesOrder?.total || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Items ({data.salesOrder?.items?.length || 0})
        </h3>
        <div className="space-y-2">
          {data.salesOrder?.items?.map((item, index) => (
            <div key={index} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
              <div>
                <span className="font-medium text-gray-900">
                  {item.product_variant?.sku || 'N/A'}
                </span>
                <span className="ml-2 text-gray-600">
                  - {item.product_variant?.product?.name || 'Unknown'}
                </span>
              </div>
              <span className="text-gray-900">
                Qty: {parseFloat(item.ordered_qty || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Packing Details */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Packing Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Box Weight:</span>
            <span className="ml-2 font-medium text-gray-900">
              {data.box_weight || 0} kg
            </span>
          </div>
          {data.box_dimensions?.length > 0 && (
            <div>
              <span className="text-gray-600">Dimensions:</span>
              <span className="ml-2 font-medium text-gray-900">
                {data.box_dimensions.length} × {data.box_dimensions.width} × {data.box_dimensions.height} {data.box_dimensions.unit}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Details */}
      <div className="mb-8 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Shipping Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Carrier:</span>
            <span className="ml-2 font-medium text-gray-900">
              {data.carrier || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Tracking Number:</span>
            <span className="ml-2 font-medium text-gray-900">
              {data.tracking_number || 'N/A'}
            </span>
          </div>
          {data.shipping_cost > 0 && (
            <div>
              <span className="text-gray-600">Shipping Cost:</span>
              <span className="ml-2 font-medium text-gray-900">
                ${parseFloat(data.shipping_cost).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Warning Notice */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>Confirming this shipment will:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Reduce inventory stock levels (FIFO cost tracking)</li>
                <li>Post negative stock movements</li>
                <li>Release stock reservations</li>
                <li>Update the sales order status to "Shipped"</li>
                <li>Create shipment tracking record</li>
              </ul>
              <p className="mt-2 font-medium">This action cannot be easily reversed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="rounded-md bg-green-600 px-6 py-2 text-white font-medium hover:bg-green-700 transition"
        >
          Confirm & Ship Order
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;
