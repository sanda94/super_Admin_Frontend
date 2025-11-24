import React from "react";
import {
  FaClipboardList,
  FaCheckCircle,
  FaCog,
  FaTruck,
  FaTimes
} from "react-icons/fa";

interface OrderWorkflowSummaryProps {
  orderCounts: {
    new_request: number;
    order_confirm: number;
    order_processing: number;
    order_delivered: number;
    rejected: number;
  };
  onStatusFilter: (status: string | null) => void;
  activeFilter: string | null;
}

const OrderWorkflowSummary: React.FC<OrderWorkflowSummaryProps> = ({ orderCounts, onStatusFilter, activeFilter }) => {
  const workflowSteps = [
    {
      status: "new_request",
      label: "New Orders",
      icon: FaClipboardList,
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgLight: "bg-blue-50",
      count: orderCounts.new_request
    },
    {
      status: "order_confirm",
      label: "Order Confirm",
      icon: FaCheckCircle,
      color: "bg-green-500",
      textColor: "text-green-700",
      bgLight: "bg-green-50",
      count: orderCounts.order_confirm
    },
    {
      status: "order_processing",
      label: "Order In Progress",
      icon: FaCog,
      color: "bg-purple-500",
      textColor: "text-purple-700",
      bgLight: "bg-purple-50",
      count: orderCounts.order_processing
    },
    {
      status: "order_delivered",
      label: "Order Delivered",
      icon: FaTruck,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgLight: "bg-emerald-50",
      count: orderCounts.order_delivered
    },
    {
      status: "rejected",
      label: "Rejected",
      icon: FaTimes,
      color: "bg-red-500",
      textColor: "text-red-700",
      bgLight: "bg-red-50",
      count: orderCounts.rejected
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Order Workflow Summary</h3>
        {activeFilter && (
          <button
            onClick={() => onStatusFilter(null)}
            className="px-3 py-1 text-xs bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
          >
            Clear Filter
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {workflowSteps.map((step) => {
          const IconComponent = step.icon;
          const isActive = activeFilter === step.status;
          const isClickable = step.count > 0;
          
          return (
            <div
              key={step.status}
              onClick={() => isClickable && onStatusFilter(step.status)}
              className={`${
                isActive 
                  ? `${step.color} text-white shadow-lg transform scale-105` 
                  : step.bgLight
              } rounded-lg p-4 text-center transition-all duration-200 ${
                isClickable 
                  ? 'hover:shadow-md cursor-pointer hover:transform hover:scale-105' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                {/* Icon Circle */}
                <div className={`${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : `${step.color} text-white`
                } w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200`}>
                  <IconComponent className="text-lg" />
                </div>
                
                {/* Count */}
                <div className={`text-2xl font-bold ${
                  isActive ? 'text-white' : 'text-gray-800'
                } transition-all duration-200`}>
                  {step.count}
                </div>
                
                {/* Label */}
                <div className={`text-sm font-medium ${
                  isActive ? 'text-white' : step.textColor
                } transition-all duration-200`}>
                  {step.label}
                </div>
                
                {/* Click hint */}
                {isClickable && !isActive && (
                  <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to filter
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Workflow Progress Line */}
      <div className="mt-6 flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
        {workflowSteps.slice(0, 4).map((step) => (
          <div
            key={step.status}
            className={`${step.color} w-4 h-4 rounded-full relative z-10 shadow-sm`}
          ></div>
        ))}
      </div>
      
      {/* Progress Labels - Updated */}
      <div className="mt-2 flex justify-between text-xs text-gray-600">
        <span>Request</span>
        <span>Order Confirm</span>
        <span>Order In Progress</span>
        <span>Order Delivered</span>
      </div>
    </div>
  );
};

export default OrderWorkflowSummary;