import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

const WizardStepper = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex items-center">
            {/* Step Circle */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-medium
                ${
                  idx < currentStep
                    ? 'bg-green-600 text-white'
                    : idx === currentStep
                    ? 'bg-[#FF9900] text-white'
                    : 'bg-gray-200 text-gray-600'
                }
              `}
            >
              {idx < currentStep ? (
                <CheckIcon className="w-6 h-6" />
              ) : (
                idx + 1
              )}
            </div>

            {/* Step Label */}
            <div className="ml-3">
              <div
                className={`text-sm font-medium ${
                  idx <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.name}
              </div>
              {step.description && (
                <div className="text-xs text-gray-500">{step.description}</div>
              )}
            </div>
          </div>

          {/* Connector Line */}
          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-4 ${
                idx < currentStep ? 'bg-green-600' : 'bg-gray-300'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default WizardStepper;
