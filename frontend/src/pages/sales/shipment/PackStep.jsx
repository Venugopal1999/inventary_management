const PackStep = ({ data, setData, onNext, onBack }) => {
  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setData({
        ...data,
        [parent]: {
          ...data[parent],
          [child]: value,
        },
      });
    } else {
      setData({ ...data, [field]: value });
    }
  };

  const handleNext = () => {
    if (!data.box_weight || data.box_weight <= 0) {
      alert('Please enter box weight');
      return;
    }
    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pack Shipment</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter packaging details for this shipment
      </p>

      <div className="space-y-6 mb-8">
        {/* Box Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Box Weight * <span className="text-gray-500 font-normal">(kg)</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={data.box_weight || ''}
            onChange={(e) => handleChange('box_weight', parseFloat(e.target.value) || 0)}
            placeholder="Enter total weight in kg"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        {/* Box Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Box Dimensions (Optional)
          </label>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <input
                type="number"
                step="0.1"
                value={data.box_dimensions?.length || ''}
                onChange={(e) => handleChange('box_dimensions.length', parseFloat(e.target.value) || 0)}
                placeholder="Length"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <input
                type="number"
                step="0.1"
                value={data.box_dimensions?.width || ''}
                onChange={(e) => handleChange('box_dimensions.width', parseFloat(e.target.value) || 0)}
                placeholder="Width"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <input
                type="number"
                step="0.1"
                value={data.box_dimensions?.height || ''}
                onChange={(e) => handleChange('box_dimensions.height', parseFloat(e.target.value) || 0)}
                placeholder="Height"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <select
                value={data.box_dimensions?.unit || 'cm'}
                onChange={(e) => handleChange('box_dimensions.unit', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500"
              >
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter dimensions as Length × Width × Height
          </p>
        </div>

        {/* Visual Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Packing Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Items to pack:</span>
              <span className="ml-2 font-medium text-gray-900">
                {data.salesOrder?.items?.length || 0} items
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total weight:</span>
              <span className="ml-2 font-medium text-gray-900">
                {data.box_weight || 0} kg
              </span>
            </div>
            {data.box_dimensions?.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-600">Dimensions:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {data.box_dimensions.length} × {data.box_dimensions.width} × {data.box_dimensions.height} {data.box_dimensions.unit}
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
          Next: Ship
        </button>
      </div>
    </div>
  );
};

export default PackStep;
