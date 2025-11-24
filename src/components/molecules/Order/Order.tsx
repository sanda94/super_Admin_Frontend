import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./order.scss";
import { useTheme } from "../../../context/Theme/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import { useToast } from "../../../context/Alert/AlertContext";
import ActivityLog from "../../../helper/ActivtyLog";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

// ---------- Rule Data Interface ----------
interface OrderData {
  _id: string;
  productId: string;
  productName: string;
  orderStatus: string;
  customerDeliveryVerification: boolean;
  message: string;
  salePrice: string;
  orderCount: string;
  totalPrice: string;
  inventory: string;
  deliveryDate: string;
}

// ---------- Rule Interface ----------
interface OrderProps {
  onClose: () => void;
  orderData: OrderData | null;
  fetchData: () => void;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const OrderPopup: React.FC<OrderProps> = ({
  onClose,
  orderData,
  fetchData,
}) => {
  // LocalStorage variables
  const query = useQuery();
  const userId = query.get("userId");
  const companyId = query.get("companyId");

  let savedUserData;

  if (userId !== null && companyId !== null) {
    savedUserData = GetUserSessionByUserIdAndCompanyId(userId, companyId);
  } else {
    savedUserData = GetUserSessionBySessionType("Primary");
  }
  const Token = savedUserData?.accessToken;
  const UserType = savedUserData?.userType;

  const today = new Date().toISOString().split("T")[0];

  const [order, setOrder] = useState<OrderData>({
    _id: orderData?._id || "",
    productId: orderData?.productId || "",
    productName: orderData?.productName || "",
    orderStatus: orderData?.orderStatus || "",
    salePrice: orderData?.salePrice || "",
    orderCount: orderData?.orderCount || "",
    totalPrice: orderData?.totalPrice || "",
    message: orderData?.message || "",
    customerDeliveryVerification:
      orderData?.customerDeliveryVerification || false,
    inventory: orderData?.inventory || "",
    deliveryDate: orderData?.deliveryDate || "",
  });
  const { colors, theme } = useTheme();
  const navigate = useNavigate();
  const { baseUrl } = useBaseUrl();
  const { notify } = useToast();

  useEffect(() => {
    if (!Token) {
      navigate("/");
    }
  }, [Token]);

  const handleSave = () => {
    if (Number(order.inventory) < Number(order.orderCount)) {
      notify("Inventory is not enough", "error");
      return;
    }
    Swal.fire({
      title: "",
      text: "Are you sure to Update Order?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      iconColor: colors.blueAccent[400],
      confirmButtonText: "Ok",
      color: colors.grey[100],
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrder();
      }
    });
  };

  // Handle Approve action for Stage 1: Customer Request
  const handleApprove = () => {
    Swal.fire({
      title: "Approve Order",
      text: "Are you sure you want to approve this order?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      iconColor: colors.blueAccent[400],
      confirmButtonText: "✅ Approve",
      cancelButtonText: "Cancel",
      color: colors.grey[100],
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        // Changed to "order_confirm" to match new workflow
        updateOrderStatus(
          "order_confirm",
          "Order approved and moved to confirmed status."
        );
      }
    });
  };

  // Handle Reject action for Stage 1: Customer Request
  const handleReject = () => {
    Swal.fire({
      title: "Cancel Order",
      text: "Are you sure you want to cancel this order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      cancelButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      background: colors.primary[400],
      iconColor: "#ff6b6b",
      confirmButtonText: "❌ Cancel Order",
      cancelButtonText: "Cancel",
      color: colors.grey[100],
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrderStatus("order_cancel", "Order cancelled.");
      }
    });
  };

  // Handle Confirm action for Stage 2: Moderator Approval
  const handleConfirm = () => {
    Swal.fire({
      title: "Confirm Order",
      text: "Are you sure you want to confirm this order?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      iconColor: colors.blueAccent[400],
      confirmButtonText: "✅ Confirm",
      cancelButtonText: "Cancel",
      color: colors.grey[100],
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrderStatus("order_confirm", "Order confirmed by moderator.");
      }
    });
  };

  // Handle Mark as Finished action for Stage 3: Admin Approval
  const handleMarkAsFinished = () => {
    Swal.fire({
      title: "Mark as In Progress",
      text: "Are you sure you want to mark this order as in progress?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      iconColor: colors.blueAccent[400],
      confirmButtonText: "🚀 Mark as In Progress",
      cancelButtonText: "Cancel",
      color: colors.grey[100],
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrderStatus(
          "order_in_progress",
          "Order marked as in progress by Moderator"
        );
      }
    });
  };

  // Handle Mark as Delivered action for Stage 4: Final Approval & Delivery
  const handleMarkAsDelivered = () => {
    Swal.fire({
      title: "Mark as Delivered",
      text: "Are you sure you want to mark this order as delivered?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      iconColor: colors.blueAccent[400],
      confirmButtonText: "✅ Mark as Delivered",
      cancelButtonText: "Cancel",
      color: colors.grey[100],
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrderStatus("order_delivered", "Order delivered successfully.");
      }
    });
  };

  // Save message and deliveryDate only (without changing order status)
  const saveChanges = async () => {
    try {
      const orderData = {
        message: order.message,
        deliveryDate: order.deliveryDate,
      };

      const orderResponse = await axios.put(
        `${baseUrl}/orders/update/${order._id}`,
        orderData,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (!orderResponse.data.status) {
        notify(
          orderResponse.data.error?.message || "Failed to save message.",
          "error"
        );
        return;
      }

      // Success notification
      notify("Changes saved successfully!", "success");
      fetchData();
    } catch (error: any) {
      console.error(error);
      notify(
        error.response?.data?.error?.message ||
          "Something went wrong while saving message.",
        "error"
      );
    }
  };

  // Update order status for workflow actions
  const updateOrderStatus = async (newStatus: string, message: string) => {
    try {
      const orderData = {
        orderStatus: newStatus,
        message: message,
      };

      if (
        !order.customerDeliveryVerification &&
        newStatus == "order_delivered"
      ) {
        notify("The customer has not yet received this product.", "info");
        return;
      }

      const orderResponse = await axios.put(
        `${baseUrl}/orders/update/${order._id}`,
        orderData,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (!orderResponse.data.status) {
        notify(
          orderResponse.data.error?.message || "Failed to update order.",
          "error"
        );
        return;
      }

      // Deduct PO balance if status is 'order_received' (approved)
      if (newStatus === "order_received") {
        const newInventory = Number(order.inventory) - Number(order.orderCount);
        if (newInventory < 0) {
          notify("Inventory is insufficient to approve this order.", "error");
        } else {
          const inventoryResponse = await axios.put(
            `${baseUrl}/products/update/${order.productId}`,
            { inventory: String(newInventory) },
            {
              headers: {
                token: `Bearer ${Token}`,
              },
            }
          );
          if (!inventoryResponse.data.status) {
            notify(
              inventoryResponse.data.error?.message ||
                "Failed to update inventory.",
              "error"
            );
          }
        }
      }

      // Success alert - Updated message
      Swal.fire({
        title: "Success!",
        text: `Order ${
          newStatus === "order_confirm" ? "confirmed" : newStatus
        } successfully!`,
        icon: "success",
        showCancelButton: false,
        confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
        background: colors.primary[400],
        iconColor: "#06D001",
        confirmButtonText: "Ok",
        color: colors.grey[100],
        allowOutsideClick: false,
      });

      await ActivityLog({
        url: `${baseUrl}/activity-logs/create`,
        category: "Order",
        actionType:
          newStatus == "order_cancel"
            ? "Order Cancelled"
            : newStatus == "order_confirm"
            ? "Order Confirmed"
            : newStatus == "order_in_progress"
            ? "Order in Progress"
            : newStatus == "order_delivered"
            ? "Order Delivered"
            : newStatus == "order_received"
            ? "Order approved and moved to order received status"
            : "",
        itemId: orderResponse.data.order._id,
      });

      fetchData();
      onClose();
    } catch (error: any) {
      console.error(error);
      notify(
        error.response?.data?.error?.message ||
          "Something went wrong while updating.",
        "error"
      );
    }
  };

  const updateOrder = async () => {
    try {
      // Always update order
      const orderData = {
        orderStatus: order.orderStatus,
        message: order.message,
      };

      if (
        !order.customerDeliveryVerification &&
        order.orderStatus == "order_delivered"
      ) {
        notify("The customer has not yet received this product.", "info");
        return;
      }

      const orderResponse = await axios.put(
        `${baseUrl}/orders/update/${order._id}`,
        orderData,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (!orderResponse.data.status) {
        notify(
          orderResponse.data.error?.message || "Failed to update order.",
          "error"
        );
        return;
      }

      // If Confirmed, also update inventory
      // if (
      //   order.orderStatus &&
      //   ["confirm", "confirmed", "order_confirm"].includes(
      //     order.orderStatus.toLowerCase()
      //   )
      // ) {
      //   const newInventory = Number(order.inventory) - Number(order.orderCount);

      //   if (newInventory < 0) {
      //     notify("Inventory is insufficient to confirm this order.", "error");
      //     return;
      //   }

      //   const inventoryResponse = await axios.put(
      //     `${baseUrl}/products/update/${order.productId}`,
      //     { inventory: String(newInventory) },
      //     {
      //       headers: {
      //         token: `Bearer ${Token}`,
      //       },
      //     }
      //   );

      //   if (!inventoryResponse.data.status) {
      //     notify(
      //       inventoryResponse.data.error?.message ||
      //         "Failed to update inventory.",
      //       "error"
      //     );
      //     return;
      //   }
      // }

      // Final success alert
      Swal.fire({
        title: "",
        text:
          order.orderStatus == "Confirm"
            ? "Order confirm successfully!"
            : "Order updated successfully!",
        icon: "success",
        showCancelButton: false,
        confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
        background: colors.primary[400],
        iconColor: "#06D001",
        confirmButtonText: "Ok",
        color: colors.grey[100],
        allowOutsideClick: false,
      });

      fetchData();
      onClose();
    } catch (error: any) {
      console.error(error);
      notify(
        error.response?.data?.error?.message ||
          "Something went wrong while updating.",
        "error"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex p-5 items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full p-6 text-black lg:max-[90vh] md:max-h-[85vh] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg lg:w-2/3">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-transparent border-none text-xl"
        >
          ✕
        </button>
        <h2 className="mb-4 text-lg font-bold text-center text-black">
          Edit Order
        </h2>
        <div></div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <p className="text-[18px] font-semibold">{order.productName}</p>
            {UserType !== "Customer" && (
              <p className="font-semibold">
                {order.salePrice} X{" "}
                {Number(order.orderCount) < 10
                  ? "0" + order.orderCount
                  : order.orderCount}{" "}
                = $ {order.totalPrice}
              </p>
            )}
            <p className="text-green-500 italic">
              PO Balance:{" "}
              {Number(order.inventory) < 10
                ? "0" + order.inventory
                : order.inventory}
            </p>
          </div>

          <div className="">
            <label className="w-full font-semibold text-[13px]">
              Order Status{" "}
              <strong className="text-red-500 text-[12px]">*</strong>
            </label>
            <div className="w-full p-2 mt-2 text-[12px] border rounded-md bg-gray-100">
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  order.orderStatus === "new_request"
                    ? "bg-blue-100 text-blue-800"
                    : order.orderStatus === "order_received"
                    ? "bg-yellow-100 text-yellow-800"
                    : order.orderStatus === "confirmed" ||
                      order.orderStatus === "order_confirm"
                    ? "bg-blue-100 text-blue-800"
                    : order.orderStatus === "finished" ||
                      order.orderStatus === "order_processing" ||
                      order.orderStatus === "order_in_progress"
                    ? "bg-purple-100 text-purple-800"
                    : order.orderStatus === "delivered" ||
                      order.orderStatus === "order_delivered"
                    ? "bg-green-100 text-green-800"
                    : order.orderStatus === "order_cancel"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {order.orderStatus === "new_request"
                  ? "New Order"
                  : order.orderStatus === "order_received"
                  ? "Order Received"
                  : order.orderStatus === "confirmed"
                  ? "Confirmed"
                  : order.orderStatus === "order_confirm"
                  ? "Order Confirmed"
                  : order.orderStatus === "finished"
                  ? "Finished"
                  : order.orderStatus === "order_processing" ||
                    order.orderStatus === "order_in_progress"
                  ? "Order In Progress"
                  : order.orderStatus === "delivered"
                  ? "Delivered"
                  : order.orderStatus === "order_delivered"
                  ? "Order Delivered"
                  : order.orderStatus === "order_cancel"
                  ? "Order Cancelled"
                  : order.orderStatus}
              </span>
            </div>
          </div>
          {order.orderStatus !== "order_cancel" &&
          order.orderStatus !== "delivered" &&
          order.orderStatus !== "order_delivered" ? (
            <div className="col-span-1 md:col-span-1">
              <label className="w-full font-semibold text-[13px]">
                Delivery Date{" "}
                <strong className="text-red-500 text-[12px]">*</strong>
              </label>
              <input
                type="date"
                min={today}
                name="deliveryDate"
                value={order.deliveryDate}
                onChange={(e) =>
                  setOrder({
                    ...order,
                    deliveryDate: e.target.value,
                  })
                }
                className="w-full p-2 mt-2 text-[12px] border rounded-md"
              />
            </div>
          ) : null}
        </div>
        <div>
          <label className="w-full font-semibold text-[13px]">Message</label>
          <textarea
            name="message"
            placeholder="Message"
            value={order.message}
            onChange={(e) => setOrder({ ...order, message: e.target.value })}
            className="w-full p-2 mt-2 text-[12px] border rounded-md"
          />
        </div>

        {/* Button-Driven Workflow - Each stage shows only its relevant action button */}
        {/* Stage 1: New Request - Show Approve and Reject buttons */}
        {order.orderStatus === "new_request" ? (
          <div className="mt-6">
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                🟢 Stage 1: New Order
              </h3>
              <p className="text-xs text-blue-700">
                
              </p>
              {order.message && (
                <p className="text-xs mt-2 italic text-blue-600">
                  Message: {order.message}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <button
                  className="px-3 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 text-[12px]"
                  onClick={handleReject}
                >
                  ❌ Cancel Order
                </button>
              </div>
              <div className="flex-1 mx-4">
                <button
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-[12px] flex items-center justify-center gap-1"
                  onClick={saveChanges}
                >
                  💾 Save Message
                </button>
              </div>
              <div className="min-w-[140px]">
                <button
                  className="w-full px-4 py-3 text-white bg-green-500 rounded-md hover:bg-green-600 text-[12px] flex items-center justify-center gap-1"
                  onClick={handleApprove}
                >
                  ✅ Accept
                </button>
              </div>
            </div>
          </div>
        ) : /* Stage 2: Order Received (Previously Pending) - Show Confirm button only */
        order.orderStatus === "order_received" ? (
          <div className="mt-6">
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                🟡 Stage 2: Order Received
              </h3>
              <p className="text-xs text-yellow-700">
                The order has been approved and received. Ready for
                confirmation.
              </p>
              {order.message && (
                <p className="text-xs mt-2 italic text-yellow-600">
                  Message: {order.message}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div />
              <div className="flex-1 mx-4">
                <button
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-[12px] flex items-center justify-center gap-1"
                  onClick={saveChanges}
                >
                  💾 Save Changes
                </button>
              </div>
              <div className="min-w-[140px]">
                <button
                  className="w-full px-4 py-3 text-white bg-blue-500 rounded-md hover:bg-blue-600 text-[12px] flex items-center justify-center gap-2"
                  onClick={handleConfirm}
                >
                  ✅ Confirm
                </button>
              </div>
            </div>
          </div>
        ) : /* Stage 3: Confirmed - Show Finish button only */
        order.orderStatus === "confirmed" ||
          order.orderStatus === "order_confirm" ? (
          <div className="mt-6">
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                🔵 Stage 3: Confirmed
              </h3>
              <p className="text-xs text-blue-700">
                The order has been confirmed and is now in production.
              </p>
              {order.message && (
                <p className="text-xs mt-2 italic text-blue-600">
                  Message: {order.message}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div />
              <div className="flex-1 mx-4">
                <button
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-[12px] flex items-center justify-center gap-1"
                  onClick={saveChanges}
                >
                  💾 Save Changes
                </button>
              </div>
              <div className="min-w-[140px]">
                <button
                  className="w-full px-4 py-3 text-white bg-purple-500 rounded-md hover:bg-purple-600 text-[12px] flex items-center justify-center gap-2"
                  onClick={handleMarkAsFinished}
                >
                  ✅ Order In Progress
                </button>
              </div>
            </div>
          </div>
        ) : /* Stage 4: Finished - Show Deliver button only */
        order.orderStatus === "finished" ||
          order.orderStatus === "order_processing" ||
          order.orderStatus === "order_in_progress" ? (
          <div className="mt-6">
            <div className="mb-4 p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
              <h3 className="text-sm font-semibold text-purple-800 mb-2">
                🟣 Stage 4: Order In Progress
              </h3>
              <p className="text-xs text-purple-700">
                The order has been Progress and is ready for delivery.
              </p>
              {order.message && (
                <p className="text-xs mt-2 italic text-purple-600">
                  Message: {order.message}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div />
              <div className="flex-1 mx-4">
                <button
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-[12px] flex items-center justify-center gap-1"
                  onClick={saveChanges}
                >
                  💾 Save Changes
                </button>
              </div>
              <div className="min-w-[140px]">
                <button
                  className="w-full px-4 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 text-[12px] flex items-center justify-center gap-2"
                  onClick={handleMarkAsDelivered}
                >
                  ✅ Delivered
                </button>
              </div>
            </div>
          </div>
        ) : /* Final Stage: Delivered/Rejected - Read-only, no action buttons */
        order.orderStatus === "delivered" ||
          order.orderStatus === "order_delivered" ||
          order.orderStatus === "order_cancel" ? (
          <div className="mt-6">
            <div
              className={`mb-4 p-4 border-l-4 rounded ${
                order.orderStatus === "delivered" ||
                order.orderStatus === "order_delivered"
                  ? "bg-green-50 border-green-500"
                  : "bg-red-50 border-red-500"
              }`}
            >
              <h3
                className={`text-sm font-semibold mb-2 ${
                  order.orderStatus === "delivered" ||
                  order.orderStatus === "order_delivered"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                🔒 Final Stage:{" "}
                {order.orderStatus === "delivered" ||
                order.orderStatus === "order_delivered"
                  ? "Order Delivered"
                  : "Order Cancelled"}
              </h3>
              <p
                className={`text-xs ${
                  order.orderStatus === "delivered" ||
                  order.orderStatus === "order_delivered"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {order.orderStatus === "delivered" ||
                order.orderStatus === "order_delivered"
                  ? "This order has been successfully delivered. The process is complete."
                  : "This order has been Cancelled. No further actions are available."}
              </p>
              {order.message && (
                <p
                  className={`text-xs mt-2 italic ${
                    order.orderStatus === "delivered" ||
                    order.orderStatus === "order_delivered"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  Message: {order.message}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end">
              <div className="w-full max-w-[420px]">
                <button
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-[12px] flex items-center justify-center gap-1"
                  onClick={saveChanges}
                >
                  💾 Save Message
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-6">
            <div />
            <div className="w-full max-w-[220px]">
              <button
                className="w-full px-4 py-3 text-white bg-blue-500 rounded-md hover:bg-blue-600 text-[12px]"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPopup;
