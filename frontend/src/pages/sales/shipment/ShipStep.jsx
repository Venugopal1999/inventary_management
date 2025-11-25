const ShipStep = ({ data, setData, onNext, onBack }) => {
  const handleChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const handleNext = () => {
    if (!data.carrier) {
      alert('Please enter carrier name');
      return;
    }
    if (!data.tracking_number) {
      alert('Please enter tracking number');
      return;
    }
    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Ship Package</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter shipping details and carrier information
      </p>

      <div className="space-y-6 mb-8">
        {/* Carrier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Carrier *
          </label>
          <select
            value={data.carrier || ''}
            onChange={(e) => handleChange('carrier', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500"
            required
          >
            <option value="">Select carrier</option>
            <option value="FedEx">FedEx</option>
            <option value="UPS">UPS</option>
            <option value="DHL">DHL</option>
            <option value="USPS">USPS</option>
            <option value="Local Courier">Local Courier</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Tracking Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tracking Number *
          </label>
          <input
            type="text"
            value={data.tracking_number || ''}
            onChange={(e) => handleChange('tracking_number', e.target.value)}
            placeholder="Enter tracking number"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        {/* Shipping Cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shipping Cost (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              value={data.shipping_cost || ''}
              onChange={(e) => handleChange('shipping_cost', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md pl-8 pr-4 py-2 focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Shipping Summary */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Shipping Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Customer:</span>
              <span className="font-medium text-blue-900">
                {data.salesOrder?.customer?.name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Carrier:</span>
              <span className="font-medium text-blue-900">
                {data.carrier || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Tracking #:</span>
              <span className="font-medium text-blue-900">
                {data.tracking_number || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Weight:</span>
              <span className="font-medium text-blue-900">
                {data.box_weight || 0} kg
              </span>
            </div>
            {data.shipping_cost > 0 && (
              <div className="flex justify-between">
                <span className="text-blue-700">Shipping Cost:</span>
                <span className="font-medium text-blue-900">
                  ${parseFloat(data.shipping_cost).toFixed(2)}
                </span>
              </div>
            )}
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
          onClick={handleNext}
          className="rounded-md bg-[#FF9900] px-6 py-2 text-white font-medium hover:bg-orange-600 transition"
        >
          Next: Review
        </button>
      </div>
    </div>
  );
};

export default ShipStep;
