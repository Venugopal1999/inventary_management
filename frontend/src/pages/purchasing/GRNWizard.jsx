import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import WizardStepper from '../../components/wizard/WizardStepper';
import SelectPOStep from './grn/SelectPOStep';
import ReceiveItemsStep from './grn/ReceiveItemsStep';
import InventoryLotsStep from './grn/InventoryLotsStep';
import PutawayStep from './grn/PutawayStep';
import ReviewStep from './grn/ReviewStep';

const steps = [
  { name: 'Select PO', description: 'Choose purchase order' },
  { name: 'Receive Items', description: 'Scan and receive quantities' },
  { name: 'Lot Numbers', description: 'Create inventory lots' },
  { name: 'Putaway', description: 'Assign locations' },
  { name: 'Review & Post', description: 'Confirm and complete' },
];

const GRNWizard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(isEditMode);
  const [wizardData, setWizardData] = useState({
    purchaseOrder: null,
    goodsReceiptId: null,
    receivedItems: [],
    lots: {},
    locations: {},
    warehouses: [],
  });

  const updateWizardData = (updates) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  // Load existing GRN data in edit mode
  useEffect(() => {
    const loadGRNData = async () => {
      if (!isEditMode) return;

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

        const grnData = response.data.data || response.data;

        // Pre-populate wizard data with existing GRN
        setWizardData({
          purchaseOrder: grnData.purchase_order,
          goodsReceiptId: grnData.id,
          receivedItems: grnData.items || [],
          lots: grnData.lots || {},
          locations: grnData.locations || {},
          warehouses: grnData.warehouses || [],
        });
      } catch (error) {
        console.error('Failed to load GRN data:', error);
        alert('Failed to load goods receipt data. Redirecting to list...');
        navigate('/goods-receipts');
      } finally {
        setLoading(false);
      }
    };

    loadGRNData();
  }, [id, isEditMode, navigate]);

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All progress will be lost.')) {
      navigate('/purchase-orders');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <SelectPOStep
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onNext={goToNextStep}
            onCancel={handleCancel}
          />
        );
      case 1:
        return (
          <ReceiveItemsStep
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={handleCancel}
          />
        );
      case 2:
        return (
          <InventoryLotsStep
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={handleCancel}
          />
        );
      case 3:
        return (
          <PutawayStep
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={handleCancel}
          />
        );
      case 4:
        return (
          <ReviewStep
            wizardData={wizardData}
            onBack={goToPreviousStep}
            onCancel={handleCancel}
            onComplete={() => navigate('/goods-receipts')}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-12">
          <div className="flex justify-center items-center">
            <div className="text-gray-600">Loading goods receipt data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Goods Receipt (GRN)' : 'Goods Receipt (GRN)'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isEditMode ? 'Update goods receipt details' : 'Receive goods from purchase order'}
          </p>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <WizardStepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {renderStepContent()}
        </div>
      </div>
  );
};

export default GRNWizard;
