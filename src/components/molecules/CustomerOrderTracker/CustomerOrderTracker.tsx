import React from "react";
import { 
  FaClipboardList, 
  FaHourglassHalf, 
  FaCheckCircle, 
  FaShippingFast, 
  FaCheck,
  FaTimes 
} from "react-icons/fa";

interface CustomerOrderTrackerProps {
  status: string;
  orderId: string;
  productName: string;
  orderDate: string;
  message: string;
  compact?: boolean;
}

const CustomerOrderTracker: React.FC<CustomerOrderTrackerProps> = ({
  status,
  orderId,
  productName,
  orderDate,
  message,
  compact = false
}) => {
  // Define order stages with customer-friendly names
  const orderStages = [
    {
      key: "new_request",
      label: "Order Placed",
      description: "Your order has been received",
      icon: FaClipboardList,
      color: "blue"
    },
    {
      key: "order_received",
      label: "Order Received",
      description: "Your order has been received and is being reviewed",
      icon: FaHourglassHalf,
      color: "yellow"
    },
    {
      key: "order_confirm",
      label: "Order Confirm",
      description: "Order has been approved",
      icon: FaCheckCircle,
      color: "green"
    },
    {
      key: "order_processing",
      label: "Order In Progress",
      description: "Order is being prepared for delivery",
      icon: FaShippingFast,
      color: "purple"
    },
    {
      key: "order_in_progress",
      label: "Order In Progress",
      description: "Order is being prepared for delivery",
      icon: FaShippingFast,
      color: "purple"
    },
    {
      key: "order_delivered",
      label: "Order Delivered",
      description: "Order has been delivered",
      icon: FaCheck,
      color: "green"
    }
  ];

  // Handle rejected status
  if (status === "rejected") {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} border border-red-200 rounded-lg bg-red-50`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <FaTimes className="text-white text-sm" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-red-800">Order Rejected</h4>
              <span className="text-xs text-red-600">#{orderId}</span>
            </div>
            <p className="text-sm text-red-600">{productName}</p>
            <p className="text-xs text-red-500 mt-1">
              Unfortunately, your order could not be processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Find current stage index
  const currentStageIndex = orderStages.findIndex(stage => stage.key === status);
  const currentStage = orderStages[currentStageIndex];

  // If status not found, default to first stage
  const activeStageIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  if (compact) {
    return (
      <div className="p-3 border border-gray-200 rounded-lg bg-white">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 bg-${currentStage?.color || 'blue'}-500 rounded-full flex items-center justify-center`}>
              {currentStage?.icon && <currentStage.icon className="text-white text-sm" />}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">{currentStage?.label || "Order Placed"}</h4>
              <span className="text-xs text-gray-500">#{orderId}</span>
            </div>
            <p className="text-sm text-gray-600">{productName}</p>
            <p className="text-xs text-gray-500 mt-1">{currentStage?.description || "Processing your order"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      {/* Order Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Order #{orderId}</h3>
          <p className="text-sm text-gray-600">{productName}</p>
          <p className="text-xs text-gray-500">Placed on {new Date(orderDate).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${currentStage?.color || 'blue'}-100 text-${currentStage?.color || 'blue'}-800`}>
            {currentStage?.label || "Processing"}
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {orderStages.map((stage, index) => {
            const isCompleted = index <= activeStageIndex;
            const isCurrent = index === activeStageIndex;
            const IconComponent = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center relative">
                {/* Connection Line */}
                {index < orderStages.length - 1 && (
                  <div 
                    className={`absolute top-4 left-8 w-full h-0.5 ${
                      index < activeStageIndex ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    style={{ width: 'calc(100% + 2rem)' }}
                  />
                )}
                
                {/* Stage Icon */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${
                    isCompleted 
                      ? isCurrent 
                        ? `bg-${stage.color}-500` 
                        : 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                >
                  <IconComponent 
                    className={`text-sm ${
                      isCompleted ? 'text-white' : 'text-gray-500'
                    }`} 
                  />
                </div>
                
                {/* Stage Label */}
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${
                    isCompleted ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-gray-600 mt-1 max-w-20">
                      {stage.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Message */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Current Status:</strong> {currentStage?.description || "Your order is being processed"}
        </p>
        
        {/* Order Status Message from Admin/Moderator */}
        {message && message.trim() !== "" && message !== "No Message" && (
          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-sm text-blue-800">
              <strong>Status Update:</strong> {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


export default CustomerOrderTracker;
