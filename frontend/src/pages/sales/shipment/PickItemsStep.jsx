import { useState, useEffect, useRef } from 'react';
import api from '../../../utils/api';

const PickItemsStep = ({ data, setData, onNext, onBack }) => {
  const [items, setItems] = useState([]);
  const [scanMode, setScanMode] = useState(false);
  const [pickedItems, setPickedItems] = useState({}); // { itemId: { picked: true, qty: number } }
  const [barcode, setBarcode] = useState('');
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    console.log('PickItemsStep - data.salesOrder:', data.salesOrder);
    if (data.salesOrder) {
      // Items might be directly on salesOrder or nested
      const soItems = data.salesOrder.items || [];
      console.log('PickItemsStep - items:', soItems);
      setItems(soItems);

      // Initialize picked items with full quantities
      const initialPicked = {};
      soItems.forEach(item => {
        const remainingQty = parseFloat(item.ordered_qty || 0) - parseFloat(item.shipped_qty || 0);
        initialPicked[item.id] = {
          picked: false,
          qty: remainingQty,
          maxQty: remainingQty
        };
      });
      setPickedItems(initialPicked);
    }
  }, [data.salesOrder]);

  useEffect(() => {
    if (scanMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scanMode]);

  const handleScan = async (e) => {
    if (e.key === 'Enter' && barcode) {
      try {
        // Find item by barcode
        const item = items.find(
          (item) => item.product_variant?.barcode === barcode
        );

        if (item) {
          setPickedItems(prev => ({
            ...prev,
            [item.id]: { ...prev[item.id], picked: true }
          }));
          setBarcode('');

          // Show success feedback
          alert(`✓ Scanned: ${item.product_variant?.sku}`);
        } else {
          alert('Item not found in this order');
          setBarcode('');
        }
      } catch (error) {
        console.error('Scan error:', error);
        alert('Scan failed');
      }
    }
  };

  const toggleItemPicked = (itemId) => {
    setPickedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], picked: !prev[itemId]?.picked }
    }));
  };

  const handleQtyChange = (itemId, newQty) => {
    const maxQty = pickedItems[itemId]?.maxQty || 0;
    const qty = Math.max(0, Math.min(parseFloat(newQty) || 0, maxQty));
    setPickedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], qty }
    }));
  };

  const pickedCount = Object.values(pickedItems).filter(item => item.picked).length;
  const allItemsPicked = items.length > 0 && pickedCount === items.length;

  const handleNext = () => {
    // Check if any items are picked
    const anyPicked = Object.values(pickedItems).some(item => item.picked && item.qty > 0);

    if (!anyPicked) {
      alert('Please pick at least one item to continue.');
      return;
    }

    if (!allItemsPicked) {
      const confirm = window.confirm(
        'Not all items have been picked. This will create a partial shipment. Do you want to continue?'
      );
      if (!confirm) return;
    }

    // Save picked quantities to parent data
    const pickedItemsList = items
      .filter(item => pickedItems[item.id]?.picked && pickedItems[item.id]?.qty > 0)
      .map(item => ({
        ...item,
        ship_qty: pickedItems[item.id].qty
      }));

    setData(prev => ({
      ...prev,
      pickedItems: pickedItemsList,
      isPartialShipment: !allItemsPicked || pickedItemsList.some(
        item => item.ship_qty < (parseFloat(item.ordered_qty) - parseFloat(item.shipped_qty || 0))
      )
    }));

    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pick Items</h2>
      <p className="text-sm text-gray-500 mb-6">
        Scan or mark items as picked from the warehouse
      </p>

      {/* Scan Mode Toggle */}
      <div className="mb-6 flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setScanMode(!scanMode)}
            className={`px-4 py-2 rounded-md font-medium transition ${
              scanMode
                ? 'bg-[#FF9900] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {scanMode ? '📱 Scan Mode: ON' : '📱 Enable Scan Mode'}
          </button>

          {scanMode && (
            <div className="flex-1">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleScan}
                placeholder="Scan barcode or type SKU and press Enter..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>

        <div className="text-sm font-medium text-gray-700">
          {pickedCount} / {items.length} items picked
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3 mb-6">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items to pick
          </div>
        ) : (
          items.map((item) => {
            const itemState = pickedItems[item.id] || { picked: false, qty: 0, maxQty: 0 };
            const isPicked = itemState.picked;
            const remainingQty = parseFloat(item.ordered_qty || 0) - parseFloat(item.shipped_qty || 0);
            return (
              <div
                key={item.id}
                className={`border rounded-lg p-4 transition ${
                  isPicked
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleItemPicked(item.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        isPicked
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {isPicked && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.product_variant?.sku || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.product_variant?.product?.name || 'Unknown Product'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Barcode: {item.product_variant?.barcode || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-xs text-gray-500">
                      Ordered: {parseFloat(item.ordered_qty || 0).toFixed(2)}
                      {parseFloat(item.shipped_qty || 0) > 0 && (
                        <span className="ml-2">
                          (Shipped: {parseFloat(item.shipped_qty).toFixed(2)})
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Ship Qty:</label>
                      <input
                        type="number"
                        min="0"
                        max={remainingQty}
                        step="0.01"
                        value={itemState.qty}
                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                        className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-xs text-gray-500">/ {remainingQty.toFixed(2)}</span>
                    </div>
                    {isPicked && (
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        ✓ PICKED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
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
          Next: Pack
        </button>
      </div>
    </div>
  );
};

export default PickItemsStep;
