import React, { useState } from "react";
import {
  FaBox,
  FaChevronRight,
  FaChevronDown,
  FaCalendarAlt,
  FaShoppingBag,
} from "react-icons/fa";
import { FaFilePdf } from "react-icons/fa6";
import CustomerOrderTracker from "../CustomerOrderTracker/CustomerOrderTracker";
import DownloadPDF from "../../../helper/DownloadPDF";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import { useToast } from "../../../context/Alert/AlertContext";

interface Order {
  _id: string;
  productName: string;
  orderStatus: string;
  dateCreated?: string;
  productImageUrl?: string;
  productImages?: string[];
  salePrice: string;
  orderCount: string;
  totalPrice: string;
  userName: string;
  userImageUrl?: string;
  deviceId: string | null;
  deviceName: string | null;
  inventory: string;
  message: string;
}

interface CustomerOrderListProps {
  orders: Order[];
}

const CustomerOrderList: React.FC<CustomerOrderListProps> = ({ orders }) => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { baseUrl } = useBaseUrl();
  const { notify } = useToast();

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handlePDFDownload = async (order: Order) => {
    try {
      // Use the exact same logic as the working moderator/admin implementation
      await DownloadPDF({
        data: [order],
        type: "orders",
        url: `${baseUrl}/pdf/order/orders`,
      });
    } catch (error) {
      console.error("PDF download failed:", error);
      notify("Failed to download PDF file", "error");
    }
  };

  const handleDownloadAllOrdersPDF = async () => {
    try {
      if (orders.length === 0) {
        notify("No orders available to download", "warning");
        return;
      }

      // Download all orders in a single PDF
      await DownloadPDF({
        data: orders,
        type: "orders",
        url: `${baseUrl}/pdf/order/orders`,
      });
    } catch (error) {
      console.error("Download all orders PDF failed:", error);
      notify("Failed to download all orders PDF file", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new_request":
        return "text-blue-600 bg-blue-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "confirmed":
      case "order_confirm":
        return "text-green-600 bg-green-50";
      case "finished":
      case "order_processing":
      case "order_in_progress":
        return "text-purple-600 bg-purple-50";
      case "delivered":
      case "order_delivered":
        return "text-green-700 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new_request":
        return "Order Placed";
      case "pending":
        return "Order Received";
      case "confirmed":
      case "order_confirm":
        return "Order Confirm";
      case "finished":
      case "order_processing":
      case "order_in_progress":
        return "Order In Progress";
      case "delivered":
      case "order_delivered":
        return "Order Delivered";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <FaShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No Orders Yet
        </h3>
        <p className="text-gray-500">
          You haven't placed any orders yet. Start shopping to see your orders
          here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaBox className="text-2xl text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </span>
        </div>
        {/* Download All Orders PDF Button */}
        {orders.length > 0 && (
          <button
            onClick={handleDownloadAllOrdersPDF}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
            title="Download all orders as PDF"
          >
            <FaFilePdf className="text-lg" />
            <span>Download All PDF</span>
          </button>
        )}
      </div>
      {orders.map((order) => (
        <div
          key={order._id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
          {/* Order Header - Clickable */}
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
            onClick={() => toggleOrderExpansion(order._id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Product Image Placeholder */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  {order.productImageUrl ||
                  (order.productImages && order.productImages[0]) ? (
                    <img
                      src={order.productImageUrl || order.productImages?.[0]}
                      alt={order.productName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <FaBox className="text-2xl text-gray-400" />
                  )}
                </div>
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-lg">
                    {order.productName}
                  </h3>
                  {/* Quantity Display */}
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Qty: {order.orderCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt className="text-xs" />
                      <span>{formatDate(order.dateCreated || "")}</span>
                    </span>
                  </div>
                  {/* PDF Download Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePDFDownload(order);
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-150"
                    title="Download PDF"
                  >
                    <FaFilePdf size={16} />
                    <span>PDF</span>
                  </button>
                  {/* Status Badge */}
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.orderStatus
                      )}`}
                    >
                      {getStatusLabel(order.orderStatus)}
                    </span>
                  </div>
                  {/* If you display status anywhere else, use getStatusLabel too */}
                </div>
              </div>
              {/* Expand/Collapse Icon */}
              <div className="ml-4">
                {expandedOrder === order._id ? (
                  <FaChevronDown className="text-gray-400 text-lg" />
                ) : (
                  <FaChevronRight className="text-gray-400 text-lg" />
                )}
              </div>
            </div>
          </div>
          {/* Expanded Order Details */}
          {expandedOrder === order._id && (
            <div className="border-t border-gray-100 bg-gray-50">
              <div className="p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaBox className="text-blue-600" />
                  Order Tracking
                </h4>
                {/* Order Tracker Component */}
                <CustomerOrderTracker
                  status={order.orderStatus}
                  orderId={order._id}
                  productName={order.productName}
                  orderDate={order.dateCreated || ""}
                  message={order.message}
                  compact={false}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CustomerOrderList;
