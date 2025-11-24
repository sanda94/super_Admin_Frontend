import React, { useEffect, useState } from "react";
import { PageHeader, DataTable, ImageModal } from "../../components/molecules";
import { OrderWorkflowSummary } from "../../components/molecules/OrderWorkflowSummary";
import { useNavigate, useLocation } from "react-router-dom";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import { useToast } from "../../context/Alert/AlertContext";
import DownloadExcel from "../../helper/DownloadXcel";
import DownloadPDF from "../../helper/DownloadPDF";
import ActivityLog from "../../helper/ActivtyLog";
import { GenerateQRCode, ScanQRCode } from "../../helper/QRCode";
import { FaFileExcel, FaFilePdf } from "react-icons/fa6";
import axios from "axios";
import { Images } from "../../constants";
import Swal from "sweetalert2";
import { GridColDef, GridAlignment } from "@mui/x-data-grid";
import { useTheme } from "../../context/Theme/ThemeContext";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

// Order Type
type OrderType = {
  _id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  productImages?: string[];
  salePrice: string;
  orderCount: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  deviceId: string | null;
  deviceName: string | null;
  poNumber: string;
  skuNumber: string;
  inventory: string;
  totalPrice: string;
  orderStatus: string;
  message: string;
  managerApproval: string;
  customerDeliveryVerification: boolean;
  qrCodeGenerateStatus: boolean;
  qrCode: string;
  deliveryDate: string;
  remakr?: string;
  dateCreated?: string;
};

// Product Type
// type ProductType = {
//   _id: string;
//   inventory: string;
//   imageUrl?: string | string[];
// };

const useQuery = () => new URLSearchParams(useLocation().search);

const Orders: React.FC = () => {
  // Local storage variables
  const query = useQuery();
  const userId = query.get("userId");
  const companyId = query.get("companyId");

  let savedUserData;

  if (userId !== null && companyId !== null) {
    savedUserData = GetUserSessionByUserIdAndCompanyId(userId, companyId);
  } else {
    savedUserData = GetUserSessionBySessionType("Primary");
  }
  const UserType = savedUserData?.userType;
  const Token = savedUserData?.accessToken;
  const UserId = savedUserData?.userId;
  const CompanyId = savedUserData?.companyId;
  const { baseUrl } = useBaseUrl();
  const { notify } = useToast();
  const { colors, theme } = useTheme();

  const [isLoading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  // Add search query state
  const [searchQuery] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      GetAllOrdersWithInventory();
    }
  }, []);

  useEffect(() => {
    setStatusFilter("new_request");
  }, []);

  // Calculate order counts for workflow summary
  const getOrderCounts = () => {
    const counts = {
      new_request: 0,
      order_confirm: 0,
      order_processing: 0,
      order_delivered: 0,
      order_cancel: 0,
    };

    orders.forEach((order) => {
      const status = order.orderStatus.toLowerCase();
      if (status === "order_in_progress") {
        counts.order_processing++; // Combine both statuses into order_processing count
      } else if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  // Filter orders based on selected status and search query
  const getFilteredOrders = () => {
    let filtered = orders;

    // Apply status filter if set
    if (statusFilter) {
      if (statusFilter === "order_processing") {
        // Filter for both order_processing and order_in_progress
        filtered = filtered.filter(
          (order) =>
            order.orderStatus.toLowerCase() === "order_processing" ||
            order.orderStatus.toLowerCase() === "order_in_progress"
        );
      } else {
        filtered = filtered.filter(
          (order) => order.orderStatus.toLowerCase() === statusFilter
        );
      }
    }

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (order) =>
          order.productName.toLowerCase().includes(query) ||
          order._id.toLowerCase().includes(query) ||
          (order.message && order.message.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  // Handle status filter change
  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
  };

  // Format status for display
  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "new_request":
        return "New Order";
      case "order_confirm":
        return "Order Confirmed";
      case "order_processing":
      case "order_in_progress":
        return "Order In Progress";
      case "order_delivered":
        return "Order Delivered";
      case "order_cancel":
        return "Order Cancel";
      case "finished":
        return "Finished";
      case "delivered":
        return "Delivered";
      case "confirmed":
        return "Confirmed";
      default:
        return status;
    }
  };

  // Fetch Data
  const GetAllOrdersWithInventory = async () => {
    try {
      setLoading(true);

      const orderUrl =
        UserType === "SuperAdmin"
          ? `${baseUrl}/orders/all`
          : UserType === "Customer"
          ? `${baseUrl}/orders/company/${savedUserData?.companyId}/customer/${UserId}`
          : UserType === "Manager"
          ? `${baseUrl}/orders/company/${savedUserData?.companyId}/manager/${UserId}`
          : `${baseUrl}/orders/company/${savedUserData?.companyId}`;

      const ordersResponse = await axios.get(orderUrl, {
        headers: { token: `Bearer ${Token}` },
      });

      if (ordersResponse.data.status) {
        setOrders(ordersResponse.data.orders);
      } else {
        const errorMessage =
          ordersResponse.data?.error?.message ||
          ordersResponse.data?.message ||
          "Failed to fetch orders!";
        notify(errorMessage, "error");
      }
    } catch (error) {
      console.error("❌ Error in GetAllOrdersWithInventory:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to update Delivery status
  const UpdateDeliveryStatus = async (orderId: string) => {
    try {
      const data = {
        orderStatus: "order_delivered",
      };
      const orderResponse = await axios.put(
        `${baseUrl}/orders/update/company/${CompanyId}/user/${UserId}/order/${orderId}`,
        data,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (orderResponse.data.status) {
        notify("Order Deliverd Successfully", "success");
        GetAllOrdersWithInventory();
      } else {
        notify("Order update faield!", "error");
      }
    } catch (error: any) {
      console.error(error);
      notify(
        error.response?.data?.error?.message ||
          "Something went wrong while updating.",
        "error"
      );
    }
  };

  // Table colums
  const columns: GridColDef[] = [
    // Always show these columns for all user types
    {
      field: "customerRequestDate",
      headerName: "Request Date",
      minWidth: 150,
      renderCell: (params: any) => {
        const date = params.row.dateCreated
          ? new Date(params.row.dateCreated)
          : null;
        return <span>{date ? date.toLocaleDateString() : "-"}</span>;
      },
    },
    ...(UserType !== "Customer"
      ? [
          {
            field: "_id",
            headerName: "Order Id",
            minWidth: 250,
            renderCell: (params: any) => (
              <span className="truncate max-w-[180px] block">
                {params.value}
              </span>
            ),
          },
          {
            field: "profile",
            headerName: "Customer Profile",
            minWidth: 300,
            renderCell: (params: any) => {
              return (
                <div className="flex items-center w-full h-full space-x-3">
                  <img
                    className="w-[40px] h-[40px] object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                    src={
                      params.row.userImageUrl
                        ? params.row.userImageUrl
                        : Images.unknownUser
                    }
                    alt="Customer Profile"
                    onClick={() =>
                      handleImageClick(
                        params.row.userImageUrl || Images.unknownUser,
                        `${params.row.userName}'s Profile`
                      )
                    }
                    onError={(e) => {
                      e.currentTarget.src = Images.unknownUser;
                    }}
                  />
                  <span className="font-bold">{params.row.userName}</span>
                </div>
              );
            },
          },
        ]
      : []),
    {
      field: "productName",
      headerName: "Product",
      minWidth: 250,
      renderCell: (params: any) => (
        <span className="truncate max-w-[180px] font-bold">{params.value}</span>
      ),
    },
    {
      field: "productImage",
      headerName: "Product Image",
      minWidth: 120,
      align: "center" as GridAlignment,
      renderCell: (params: any) => {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <img
              className="w-[40px] h-[40px] object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              src={
                params.row.productImageUrl
                  ? params.row.productImageUrl
                  : "/unknown-product.png"
              }
              alt="Product"
              onClick={() =>
                handleImageClick(
                  params.row.productImageUrl || "/unknown-product.png",
                  `${params.row.productName} Product`,
                  params.row.productImages,
                  params.row.productImages?.indexOf(
                    params.row.productImageUrl || ""
                  )
                )
              }
              onError={(e) => {
                e.currentTarget.src = "/unknown-product.png";
              }}
            />
          </div>
        );
      },
    },
    {
      field: "skuNumber",
      headerName: "SKU Number",
      minWidth: 200,
      renderCell: (params: any) => (
        <span className="truncate max-w-[180px] font-bold italic text-gray-500">
          {params.value}
        </span>
      ),
    },
    {
      field: "poNumber",
      headerName: "Po Number",
      minWidth: 200,
      renderCell: (params: any) => (
        <span className="truncate max-w-[180px] font-semobold">
          {params.value}
        </span>
      ),
    },
    ...(UserType !== "Customer"
      ? [
          {
            field: "salePrice",
            headerName: "Sale Price",
            minWidth: 100,
            align: "right" as GridAlignment,
            renderCell: (params: any) => (
              <span className="font-mono text-green-700 font-semibold block w-full text-right">
                $
                {Number(params.value).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            ),
          },
        ]
      : []),
    {
      field: "orderCount",
      headerName: "Order quantity",
      minWidth: 120,
      align: "center" as GridAlignment,
      renderCell: (params: any) => (
        <span className="px-2 py-2 bg-blue-100 text-blue-800 rounded-full font-bold text-center min-w-[32px]">
          {params.value}
        </span>
      ),
    },
    {
      field: "inventory",
      headerName: "PO Balance",
      minWidth: 100,
      align: "center" as GridAlignment,
      renderCell: (params: any) => (
        <span className=" text-gray-800 rounded-full font-bold text-center min-w-[32px]">
          {params.value}
        </span>
      ),
    },
    ...(UserType !== "Customer"
      ? [
          {
            field: "totalPrice",
            headerName: "Total",
            minWidth: 100,
            align: "right" as GridAlignment,
            renderCell: (params: any) => (
              <span className="font-mono text-green-900 font-bold block w-full text-right">
                $
                {Number(params.value).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            ),
          },
        ]
      : []),
    {
      field: "deliveryDate",
      headerName: "Delivery Date",
      align: "center",
      minWidth: 150,
      renderCell: (params: any) => (
        <span className="truncate max-w-[180px] font-semibold text-center">
          {params.value}
        </span>
      ),
    },
    {
      field: "remark",
      headerName: "Remark",
      minWidth: 350,
      align: "left",
      renderCell: (params: any) => (
        <span className="truncate max-w-[320px] block text-black">
          {params.value}
        </span>
      ),
    },
    {
      field: "message",
      headerName: "Message",
      minWidth: 350,
      align: "left",
      renderCell: (params: any) => (
        <span className="truncate max-w-[320px] block text-black">
          {params.value}
        </span>
      ),
    },
    ...(UserType === "Manager"
      ? [
          {
            field: "managerApproval",
            headerName: "Manager Approval",
            minWidth: 180,
            align: "center" as GridAlignment,
            renderCell: (params: any) => {
              const [approval, setApproval] = React.useState(
                params.row.managerApproval
              );

              const handleChange = async (
                event: React.ChangeEvent<HTMLSelectElement>
              ) => {
                const newValue = event.target.value;
                setApproval(newValue);

                const message =
                  newValue === "Yes"
                    ? "Are you sure you want to approve this order?"
                    : "Are you sure you want to reject this order?";

                Swal.fire({
                  title: "",
                  text: message,
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
                  cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
                  background: colors.primary[400],
                  iconColor: colors.blueAccent[400],
                  confirmButtonText: "OK",
                  color: colors.grey[100],
                  allowOutsideClick: false,
                }).then(async (result) => {
                  if (result.isConfirmed) {
                    try {
                      const response = await axios.put(
                        `${baseUrl}/orders/update/${params.row._id}`,
                        { managerApproval: newValue },
                        { headers: { token: `Bearer ${Token}` } }
                      );

                      if (response.data.status) {
                        notify("Approval updated successfully!", "success");
                        await ActivityLog({
                          url: `${baseUrl}/activity-logs/create`,
                          category: "Order",
                          actionType:
                            newValue == "Yes"
                              ? "Approved order by Manager"
                              : "Reject order by Manager",
                          itemId: response.data.order._id || "",
                        });
                        GetAllOrdersWithInventory();
                      }
                    } catch (error) {
                      notify("Failed to update approval", "error");
                    }
                  } else {
                    // revert back to old value if cancelled
                    setApproval(params.row.managerApproval);
                  }
                });
              };

              return (
                <select
                  value={approval || "Pending"}
                  onChange={handleChange}
                  className={`px-2 py-1 rounded text-white text-xs font-bold cursor-pointer
                ${
                  approval === "Yes"
                    ? "bg-green-500"
                    : approval === "No"
                    ? "bg-red-500"
                    : "bg-gray-400"
                }
              `}
                >
                  <option value="Pending">Pending</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              );
            },
          },
        ]
      : []),

    {
      field: "orderStatus",
      headerName: "Order Status",
      minWidth: 120,
      align: "center",
      renderCell: (params: any) => {
        let color = "bg-gray-400";
        if (typeof params.value === "string") {
          const status = params.value.toLowerCase();
          if (status === "pending") color = "bg-yellow-400";
          else if (
            status === "confirm" ||
            status === "confirmed" ||
            status === "order_confirm"
          )
            color = "bg-green-500";
          else if (
            status === "cancelled" ||
            status === "canceled" ||
            status === "cancel" ||
            status === "order_cancel"
          )
            color = "bg-red-500";
          else if (
            status === "deliver" ||
            status === "delivered" ||
            status === "order_delivered"
          )
            color = "bg-blue-500";
          else if (status === "new_request") color = "bg-blue-400";
          else if (status === "finished" || status === "order_processing")
            color = "bg-purple-500";
        }
        return (
          <span
            className={`px-2 py-1 rounded text-white text-xs font-bold ${color}`}
          >
            {getStatusLabel(params.value)}
          </span>
        );
      },
    },
    ...(UserType !== "Customer" &&
    UserType !== "Manager" &&
    statusFilter == "order_processing"
      ? [
          {
            field: "qrCode",
            headerName: "QR Code",
            minWidth: 160,
            align: "center" as GridAlignment,
            renderCell: (params: any) => {
              const [loading, setLoading] = React.useState(false);

              const handleGenerate = async () => {
                try {
                  Swal.fire({
                    title: "",
                    text: "Are you sure you want to create QR Code for this order?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor:
                      theme === "dark" ? "#86D293" : "#73EC8B",
                    cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
                    background: colors.primary[400],
                    iconColor: colors.blueAccent[400],
                    confirmButtonText: "OK",
                    color: colors.grey[100],
                    allowOutsideClick: false,
                  }).then(async (result) => {
                    if (result.isConfirmed) {
                      setLoading(true);

                      const qrResponse = await GenerateQRCode({
                        url: `${baseUrl}/qrcode/create`,
                        userId: params.row.userId,
                        itemId: params.row.productId,
                        type: "order",
                        typeId: params.row._id,
                        token: Token || "",
                      });

                      if (qrResponse) {
                        Swal.fire({
                          title: "",
                          text: "QR Code Created Successfully!",
                          icon: "success",
                          showCancelButton: false,
                          confirmButtonColor:
                            theme === "dark" ? "#86D293" : "#73EC8B",
                          background: colors.primary[400],
                          iconColor: "#06D001",
                          confirmButtonText: "Ok",
                          color: colors.grey[100],
                          allowOutsideClick: false,
                        });
                        GetAllOrdersWithInventory();
                      } else {
                        notify("QR Code Generation Failed!", "error");
                      }
                    }
                  });
                } catch (error) {
                  console.error("Failed to generate QR code", error);
                } finally {
                  setLoading(false);
                }
              };

              const handleDownload = () => {
                if (!params.row.qrCode?.qrCode) return;

                const link = document.createElement("a");
                link.href = params.row.qrCode.qrCode; // base64 string
                link.download = `Order_${params.row._id}_QRCode.png`;
                link.click();
              };

              // Only show button for order_in_progress / order_processing
              const isOrderInProgress =
                params.row.orderStatus.toLowerCase() === "order_in_progress" ||
                params.row.orderStatus.toLowerCase() === "order_processing";

              if (!isOrderInProgress)
                return (
                  <p className="flex items-center justify-center text-red-600 text-[12px] font-semibold">
                    🚫 Not Allowed!
                  </p>
                );

              return (
                <div className="">
                  {!params.row.qrCodeGenerateStatus ? (
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                      title="Generate QR Code"
                    >
                      {loading ? "Generating..." : "Generate QR"}
                    </button>
                  ) : (
                    <button
                      onClick={handleDownload}
                      className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                      title="Download QR Code"
                    >
                      Download QR
                    </button>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
    ...(UserType === "Customer" && statusFilter == "order_processing"
      ? [
          {
            field: "qrCode",
            headerName: "Scan QR",
            minWidth: 180,
            align: "center" as GridAlignment,
            renderCell: (params: any) => {
              const [loading, setLoading] = React.useState(false);

              const handleScanClick = async () => {
                setLoading(true);

                try {
                  const isValid = await ScanQRCode({
                    userId: params.row.userId,
                    itemId: params.row.productId,
                    typeId: params.row._id,
                  });
                  if (isValid) {
                    await UpdateDeliveryStatus(params.row._id);
                  } else {
                    notify("Invalid QR Code for this order.", "error");
                  }
                } catch (error: any) {
                } finally {
                  setLoading(false);
                }
              };

              const orderStatus = params.row.orderStatus?.toLowerCase();

              if (
                orderStatus !== "order_in_progress" &&
                orderStatus !== "order_processing"
              ) {
                return (
                  <p className="flex items-center justify-center text-red-600 text-[12px] font-semibold">
                    🚫 Not Allowed!
                  </p>
                );
              }

              return (
                <div className="">
                  <button
                    onClick={handleScanClick}
                    disabled={loading}
                    className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded text-xs"
                  >
                    {loading ? "Scanning..." : "Scan QR"}
                  </button>
                </div>
              );
            },
          },
        ]
      : []),
    {
      field: "downloadPDF",
      headerName: "",
      minWidth: 80,
      align: "center",
      sortable: false,
      filterable: false,
      renderCell: (params: any) => (
        <div className="flex items-center justify-center w-full h-full">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await DownloadPDF({
                  data: [params.row],
                  type: "orders",
                  url: `${baseUrl}/pdf/order/orders`,
                });
              } catch (error) {
                notify("Failed to download PDF file", "error");
              }
            }}
            className="px-2 py-1 bg-orange-400 hover:bg-orange-300 text-white rounded-md text-xs font-semibold flex items-center gap-1"
            title="Download PDF for this order"
          >
            <FaFilePdf size={16} />
          </button>
        </div>
      ),
    },
  ];

  const HandleState = () => {};

  // Handle image click to open modal
  const handleImageClick = (
    imageUrl: string,
    altText: string,
    allImages?: string[],
    startIndex?: number
  ) => {
    if (allImages && allImages.length > 0) {
      // For product images - show carousel
      setSelectedImages(allImages);
      setCurrentImageIndex(startIndex || 0);
      setSelectedImageAlt(altText);
      setIsImageModalOpen(true);
    } else {
      // For profile images - show single image
      setSelectedImageUrl(imageUrl);
      setSelectedImageAlt(altText);
      setIsImageModalOpen(true);
    }
  };

  // Close image modal
  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageUrl("");
    setSelectedImageAlt("");
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  // Function to download Excel file
  const downloadExcelFile = async () => {
    if (orders.length === 0) {
      notify("No data available to download", "error");
      return;
    }

    try {
      await DownloadExcel({
        data: { orders },
        type: "orders",
        url: `${baseUrl}/excel/order/orders`,
      });
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      notify("Failed to download Excel file", "error");
    }
  };

  // Function to download PDF file
  const downloadPDFFile = async () => {
    if (orders.length === 0) {
      notify("No data available to download", "error");
      return;
    }

    try {
      await DownloadPDF({
        data: orders,
        type: "orders",
        url: `${baseUrl}/pdf/order/orders`,
      });
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      notify("Failed to download PDF file", "error");
    }
  };

  return (
    <div>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 lg:justify-start">
        <PageHeader
          title={UserType == "Customer" ? "eShop Orders" : "ORDER MANAGEMENT"}
          subTitle=""
        />
        {/* Export buttons for Customer - CSV button hidden as requested */}
        {!isLoading && UserType === "Customer" && orders.length > 0 && (
          <div className="flex flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={downloadPDFFile}
              className="px-4 py-3 text-[12px] w-full md:w-auto bg-red-600 hover:bg-red-700 flex items-center justify-center gap-3 rounded-md text-white duration-300 transition-colors"
            >
              <FaFilePdf size={20} />
              Download PDF
            </button>
          </div>
        )}
        {/* Export buttons for Admin/Moderator */}
        {!isLoading && UserType !== "Customer" && (
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={downloadExcelFile}
              className="px-4 py-3 text-[12px] w-full md:w-auto bg-green-600 hover:bg-green-700 flex items-center justify-center gap-3 rounded-md text-white duration-300 transition-colors"
            >
              <FaFileExcel size={20} />
              Download Excel
            </button>
            <button
              onClick={downloadPDFFile}
              className="px-4 py-3 text-[12px] w-full md:w-auto bg-red-600 hover:bg-red-700 flex items-center justify-center gap-3 rounded-md text-white duration-300 transition-colors"
            >
              <FaFilePdf size={20} />
              Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Order Workflow Summary - Only show for Admin/Moderator */}
      {!isLoading && orders.length > 0 && (
        <div className="mt-8">
          <OrderWorkflowSummary
            orderCounts={getOrderCounts()}
            onStatusFilter={handleStatusFilter}
            activeFilter={statusFilter}
          />
        </div>
      )}

      {/* Order Section */}
      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : (
        <div>
          {/* Filter indicator */}
          {statusFilter && (
            <div className="mb-4 mt-5 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {" "}
                  <strong className="capitalize">
                    {getStatusLabel(statusFilter)}
                  </strong>
                </span>
                <span className="text-xs text-blue-600">
                  {getFilteredOrders().length} of {orders.length} orders
                </span>
              </div>
            </div>
          )}

          {getFilteredOrders().length > 0 ? (
            <div className="min-h-[100vh] mt-5 overflow-y-auto">
              <DataTable
                slug="orders"
                columns={columns}
                rows={getFilteredOrders()}
                statusChange={HandleState}
                fetchData={GetAllOrdersWithInventory}
              />
            </div>
          ) : (
            <p
              style={{ color: colors.grey[100] }}
              className="mt-10 text-lg font-semibold"
            >
              {searchQuery.trim()
                ? `No orders found matching "${searchQuery}"`
                : statusFilter
                ? `No orders found with status "${getStatusLabel(
                    statusFilter
                  )}"`
                : "No Data Available..."}
            </p>
          )}
        </div>
      )}

      {/* Image Modal for Profile and Product Images */}
      {isImageModalOpen && (
        <ImageModal
          isOpen={isImageModalOpen}
          imageUrl={
            selectedImages.length > 0 ? selectedImages : [selectedImageUrl]
          }
          altText={selectedImageAlt}
          onClose={closeImageModal}
          startIndex={selectedImages.length > 0 ? currentImageIndex : 0}
        />
      )}
    </div>
  );
};

export default Orders;
