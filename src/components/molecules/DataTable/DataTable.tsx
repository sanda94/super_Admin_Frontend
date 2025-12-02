import React, { useState } from "react";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import "./dataTable.scss";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { useTheme } from "../../../context/Theme/ThemeContext";
import RulePopup from "../Rule/Rule";
import CategoryPopup from "../Category/Category";
import LocationPopup from "../Location/Location";
import OrderPopup from "../Order/Order";
import CompanyPopup from "../Company/Company";
import ManagerRulePopUp from "../ManagerRulePopUp/ManagerRulePopUp";
import ProductRulePopUp from "../ProductRulePopUp/ProductRulePopUp";
import axios from "axios";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import { useToast } from "../../../context/Alert/AlertContext";
import ActivityLog from "../../../helper/ActivtyLog";
import { useLocation } from "react-router-dom";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

type Props = {
  columns: GridColDef[];
  rows: Object[];
  slug: string;
  statusChange: (id: string, newStatus: string) => void;
  fetchData: () => void;
  actionColumnHeaderName?: string;
};

// ---------- Rule Data Interface ----------
interface RuleData {
  _id: string;
  deviceId: string;
  userId: string;
  userName: string;
  deviceName: string;
  imageUrl: string;
  emailStatus: string;
}

// ---------- Category Data Interface ----------
interface CategoryData {
  _id: string;
  category: string;
  description: string;
}

// ---------- Location Data Interface ----------
interface LocationData {
  _id: string;
  location: string;
  description: string;
}

// ---------- Order Data Interface ----------
interface OrderData {
  _id: string;
  productId: string;
  productName: string;
  orderStatus: string;
  message: string;
  salePrice: string;
  orderCount: string;
  totalPrice: string;
  inventory: string;
  customerDeliveryVerification: boolean;
  deliveryDate: string;
}

// ---------- Company Data Interface ----------
interface CompanyData {
  _id: string;
  companyName: string;
  companyEmail: string;
  companyPhoneNumber: string;
  companyAddress: string;
  imageUrl: string;
  description: string;
}

// ---------- Manager Rule Data Interface ----------
interface ManagerRuleData {
  _id: string;
  managerId: string;
  managerName: string;
  customerId: string;
  customerName: string;
  imageUrl: string;
}

// ---------- Product Rule Data Interface ----------
interface ProductRuleData {
  _id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  imageUrl: string;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const DataTable: React.FC<Props> = (props: Props) => {
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
  const UserType = savedUserData?.userType;
  const Token = savedUserData?.accessToken;
  const UserId = savedUserData?.userId;
  const CompanyId = savedUserData?.companyId;
  const SessionType = savedUserData?.sessionType;
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedRuleData, setSelectedRuleData] = useState<RuleData | null>(
    null
  );
  const [selectCategorydata, setSelectCategoryData] =
    useState<CategoryData | null>(null);
  const [selectLocationData, setSelectLocationData] =
    useState<LocationData | null>(null);
  const [selectedOrderData, setSelectedOrderData] = useState<OrderData | null>(
    null
  );
  const [selectedCompanyData, setSelectedCompanyData] =
    useState<CompanyData | null>(null);
  const [selectedManagerRuleData, setSelectedManagerRuleData] =
    useState<ManagerRuleData | null>(null);
  const [selectedProductRuleData, setSelectedProductRuleData] =
    useState<ProductRuleData | null>(null);
  const { theme, colors } = useTheme();
  const { baseUrl } = useBaseUrl();
  const { notify } = useToast();

  const openPopup = (rowData: any) => {
    setIsFormOpen(true);
    if (props.slug === "rules") {
      setSelectedRuleData(rowData);
    } else if (props.slug === "categories") {
      setSelectCategoryData(rowData);
    } else if (props.slug === "locations") {
      setSelectLocationData(rowData);
    } else if (props.slug === "orders") {
      setSelectedOrderData(rowData);
    } else if (props.slug === "companies") {
      setSelectedCompanyData(rowData);
    } else if (props.slug === "manager-rules") {
      setSelectedManagerRuleData(rowData);
    } else if (props.slug === "product-rules") {
      setSelectedProductRuleData(rowData);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleDelete = (id: any, imageUrl: any, slug: string) => {
    Swal.fire({
      title: "",
      text: "Are you sure you want to delete data?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      iconColor: "#FF0000",
      confirmButtonText: "Ok",
      color: colors.grey[100],
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        DeleteData(id, imageUrl, slug);
      }
    });
  };

  const DeleteImage = async (url: string) => {
    if (url === null || url === undefined) {
      return;
    }
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    try {
      await axios.delete(`${baseUrl}/files/delete/${fileName}`, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const DeleteData = async (id: string, imageUrl: string, slug: string) => {
    try {
      if (imageUrl) {
        DeleteImage(imageUrl);
      }
      const response = await axios.delete(`${baseUrl}/${slug}/delete/${id}`, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
      if (response.data.status) {
        Swal.fire({
          title: "",
          text: "Delete Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        if (slug == "orders") {
          await ActivityLog({
            url: `${baseUrl}/activity-logs/create`,
            category: "Order",
            actionType: "Order Deleted",
            itemId: id,
          });
        }
        props.fetchData();
      } else {
        Swal.fire({
          title: "",
          text: "Delete Failed!",
          icon: "error",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const actionColumn: GridColDef = {
    field: "action",
    headerName: props.actionColumnHeaderName || "Information",
    minWidth: 115,
    maxWidth: 120,
    flex: 1,
    renderCell: (params) => {
      return (
        <div className="action">
          {props.slug !== "rules" &&
          props.slug !== "categories" &&
          props.slug !== "locations" &&
          props.slug !== "companies" &&
          props.slug !== "orders" &&
          props.slug !== "activity-logs" &&
          props.slug !== "manager-rules" &&
          props.slug !== "product-rules" ? (
            <Link
              to={
                SessionType === "Secondary"
                  ? `/${props.slug}/${params.row._id}?userId=${UserId}&companyId=${CompanyId}`
                  : `/${props.slug}/${params.row._id}`
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="icon view w-[20px] h-[20px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </Link>
          ) : (UserType === "Admin" ||
              UserType === "Moderator" ||
              (UserType === "SuperAdmin" && props.slug == "companies")) &&
            props.slug !== "activity-logs" ? (
            props.slug === "orders" ? (
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-[12px] font-medium"
                onClick={() => openPopup(params.row)}
              >
                Open
              </button>
            ) : (
              <div className="edit" onClick={() => openPopup(params.row)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="icon w-[20px] h-[20px]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
              </div>
            )
          ) : null}
          {UserType === "Admin" || UserType === "SuperAdmin" ? (
            <div
              className="delete"
              onClick={() => {
                handleDelete(
                  params.row._id,
                  params.row.imageUrl ? params.row.imageUrl : "",
                  props.slug
                );
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="icon w-[20px] h-[20px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>
          ) : null}
          {UserType === "Manager" &&
          params.row.managerApproval !== "Yes" &&
          props.slug === "orders" ? (
            <div
              className="delete"
              onClick={() => {
                handleDelete(
                  params.row._id,
                  params.row.imageUrl ? params.row.imageUrl : "",
                  props.slug
                );
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="icon w-[20px] h-[20px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>
          ) : UserType === "Manager" && params.row.managerApproval === "Yes" ? (
            <p className="flex items-center justify-center gap-2 text-red-600 bg-red-100 border border-red-300 px-4 py-[6px] w-[95px] h-[30px] rounded-lg text-[12px] font-semibold shadow-sm">
              🚫 Can’t Delete
            </p>
          ) : null}
        </div>
      );
    },
  };

  return (
    <div className="z-0 dataTable">
      <DataGrid
        className="dataGrid"
        rows={props.rows}
        getRowId={(row: any) => row._id}
        columns={[
          ...props.columns.map((column) => ({
            ...column,
            flex: 1, // Apply flex to make columns responsive
          })),
          ...((["rules", "orders", "companies"].includes(props.slug) &&
            UserType == "Customer") ||
          (["activity-logs"].includes(props.slug) &&
            UserType != "Admin" &&
            UserType != "SuperAdmin")
            ? []
            : [actionColumn]),
        ]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
          filter: {
            filterModel: {
              items: [],
              quickFilterValues: [""],
            },
          },
        }}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
            printOptions: { disableToolbarButton: true },
          },
        }}
        pageSizeOptions={[5]}
        disableRowSelectionOnClick
        disableDensitySelector
        style={{ minHeight: "500px" }}
      />

      {isFormOpen && props.slug === "rules" && (
        <RulePopup
          ruleData={selectedRuleData}
          onClose={() => closeForm()}
          fetchData={props.fetchData}
        />
      )}
      {isFormOpen && props.slug === "categories" && (
        <CategoryPopup
          categoryData={selectCategorydata}
          onClose={() => closeForm()}
          fetchData={props.fetchData}
        />
      )}
      {isFormOpen && props.slug === "locations" && (
        <LocationPopup
          locationData={selectLocationData}
          onClose={() => closeForm()}
          fetchData={props.fetchData}
        />
      )}
      {isFormOpen && props.slug === "orders" && (
        <OrderPopup
          orderData={selectedOrderData}
          onClose={() => closeForm()}
          fetchData={props.fetchData}
        />
      )}
      {isFormOpen && props.slug === "companies" && (
        <CompanyPopup
          companyData={selectedCompanyData}
          onClose={() => closeForm()}
          fetchData={props.fetchData}
        />
      )}
      {isFormOpen && props.slug === "manager-rules" && (
        <ManagerRulePopUp
          managerRuleData={selectedManagerRuleData}
          onClose={() => closeForm()}
          fetchData={props.fetchData}
        />
      )}
      {isFormOpen && props.slug === "product-rules" && (
        <ProductRulePopUp
          productRuleData={selectedProductRuleData}
          onClose={() => closeForm()}
          fetchData={props.fetchData}
        />
      )}
    </div>
  );
};

export default DataTable;
