import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import SelectSOStep from './shipment/SelectSOStep';
import PickItemsStep from './shipment/PickItemsStep';
import PackStep from './shipment/PackStep';
import ShipStep from './shipment/ShipStep';
import ReviewStep from './shipment/ReviewStep';

const ShipmentWizard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id } = useParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [shipmentData, setShipmentData] = useState({
    sales_order_id: searchParams.get('so_id') || null,
    salesOrder: null,
    shipment: null,
    items: [],
    carrier: '',
    tracking_number: '',
    shipping_cost: 0,
    box_weight: 0,
    box_dimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: 'cm',
    },
  });
  const [loading, setLoading] = useState(false);

  const steps = [
    { name: 'Select Sales Order', component: SelectSOStep },
    { name: 'Pick Items', component: PickItemsStep },
    { name: 'Pack', component: PackStep },
    { name: 'Ship', component: ShipStep },
    { name: 'Review', component: ReviewStep },
  ];

  useEffect(() => {
    if (id) {
      loadShipment(id);
    } else if (searchParams.get('so_id')) {
      loadSalesOrder(searchParams.get('so_id'));
    }
  }, [id, searchParams]);

  const loadShipment = async (shipmentId) => {
    try {
      setLoading(true);
      const response = await api.get(`/shipments/${shipmentId}`);
      setShipmentData({
        ...shipmentData,
        shipment: response.data,
        sales_order_id: response.data.sales_order_id,
        salesOrder: response.data.sales_order,
        items: response.data.items || [],
        carrier: response.data.carrier || '',
        tracking_number: response.data.tracking_number || '',
        shipping_cost: response.data.shipping_cost || 0,
        box_weight: response.data.box_weight || 0,
        box_dimensions: response.data.box_dimensions || {
          length: 0,
          width: 0,
          height: 0,
          unit: 'cm',
        },
      });
      setCurrentStep(1); // Start at pick items step
    } catch (error) {
      console.error('Failed to load shipment:', error);
      alert('Failed to load shipment');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesOrder = async (soId) => {
    try {
      setLoading(true);
      const response = await api.get(`/sales-orders/${soId}`);
      // API returns { success: true, data: {...} }
      const salesOrder = response.data.data || response.data;
      console.log('Loaded sales order:', salesOrder);
      setShipmentData({
        ...shipmentData,
        sales_order_id: soId,
        salesOrder: salesOrder,
      });
      setCurrentStep(1); // Skip SO selection step
    } catch (error) {
      console.error('Failed to load sales order:', error);
      alert('Failed to load sales order');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      // If shipment exists, just ship it
      if (shipmentData.shipment) {
        await api.post(`/shipments/${shipmentData.shipment.id}/ship`, {
          carrier: shipmentData.carrier,
          tracking_number: shipmentData.tracking_number,
          shipped_at: new Date().toISOString(),
        });
      } else {
        // Create shipment and ship it
        const createResponse = await api.post('/shipments', {
          sales_order_id: shipmentData.sales_order_id,
          carrier: shipmentData.carrier,
          tracking_number: shipmentData.tracking_number,
          shipping_cost: shipmentData.shipping_cost,
        });

        const shipmentId = createResponse.data.data.id;

        // Mark as picked
        await api.post(`/shipments/${shipmentId}/mark-picked`);

        // Mark as packed
        await api.post(`/shipments/${shipmentId}/mark-packed`, {
          box_weight: shipmentData.box_weight,
          box_dimensions: shipmentData.box_dimensions,
        });

        // Ship
        await api.post(`/shipments/${shipmentId}/ship`, {
          carrier: shipmentData.carrier,
          tracking_number: shipmentData.tracking_number,
          shipped_at: new Date().toISOString(),
        });
      }

      alert('Shipment completed successfully!');
      navigate('/shipments');
    } catch (error) {
      console.error('Failed to complete shipment:', error);
      console.error('Server response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      alert('Failed to complete shipment: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Process Shipment' : 'Create New Shipment'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Pick, pack, and ship orders</p>
      </div>

      {/* Stepper */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    idx <= currentStep
                      ? 'bg-[#FF9900] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  idx <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  idx < currentStep ? 'bg-[#FF9900]' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <CurrentStepComponent
            data={shipmentData}
            setData={setShipmentData}
            onNext={handleNext}
            onBack={handleBack}
            onComplete={handleComplete}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
          />
        )}
      </div>
    </div>
  );
};

export default ShipmentWizard;
