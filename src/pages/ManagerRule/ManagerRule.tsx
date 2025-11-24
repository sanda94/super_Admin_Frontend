import React, { useState, useEffect } from "react";
import { GridColDef, GridAlignment } from "@mui/x-data-grid";
import { useTheme } from "../../context/Theme/ThemeContext";
import { DataTable, PageHeader, ImageModal } from "../../components/molecules";
import { Images } from "../../constants";
import { useNavigate, useLocation } from "react-router-dom";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import axios from "axios";
import { useToast } from "../../context/Alert/AlertContext";
import Swal from "sweetalert2";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

// User Type Definition
type User = {
  _id: string;
  fullName: string;
};

// Manager Rule Type Definition
type ManagerRule = {
  _id: string;
  managerId: string;
  managerName: string;
  managerImageUrl?: string;
  customerImageUrl?: string;
  customerId: string;
  customerName: string;
  imageUrl: string;
  companyId?: string;
  dateCreated: string;
  dateUpdated: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const ManagerRule: React.FC = () => {
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
  const Token = savedUserData?.accessToken;
  const UserType = savedUserData?.userType;
  const CompanyId = savedUserData?.companyId;

  const [managerRules, setManagerRules] = useState<ManagerRule[]>([]);
  const [newManagerRule, setNewManagerRule] = useState({
    managerName: "",
    image: null as File | null,
    managerId: "",
    customerId: "",
    customerName: "",
  });
  const [managers, setManagers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");

  const { notify } = useToast();
  const { baseUrl } = useBaseUrl();
  const { colors, theme } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      FetchData();
      FetchManagersAndCustomers();
    }
  }, [Token]);

  // ---------- Function to Fetch Manager Rules Data ----------
  const FetchData = async () => {
    try {
      setLoading(true);
      const managerRulesResponce = await axios.get(
        `${baseUrl}/manager-rules/company/${CompanyId}`,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );
      if (managerRulesResponce.data.status) {
        setManagerRules(managerRulesResponce.data.managerRules);
      }
    } catch (error: any) {
      console.error(error);
      notify(
        error.response?.data?.error?.message || "An error occurred",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------- Function to get Managers and Customers ----------
  const FetchManagersAndCustomers = async () => {
    try {
      const managersResponse = await axios.get(
        `${baseUrl}/users/all/managers/company/${CompanyId}`,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );
      if (managersResponse.data.status) {
        setManagers(managersResponse.data.managers);
      }

      const customersResponse = await axios.get(
        `${baseUrl}/users/all/customers/company/${CompanyId}`,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );
      if (customersResponse.data.status) {
        setCustomers(customersResponse.data.customers);
      }
    } catch (error: any) {
      console.error(error);
      notify(
        error.response?.data?.error?.message || "An error occurred",
        "error"
      );
    }
  };

  const HandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      setNewManagerRule((prevUser) => ({
        ...prevUser,
        image: files[0],
      }));
    }
  };

  // ---------- Function to Upload Image ----------
  const ImageUpload = async () => {
    if (!newManagerRule.image) {
      return null;
    }
    const data = {
      file: newManagerRule.image,
    };
    try {
      const response = await axios.post(`${baseUrl}/files/save`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          token: `Bearer ${Token}`,
        },
      });
      return response.data.fileName;
    } catch (error: any) {
      console.log(error);
      //notify(error.response.data.error.message, "error");
    }
  };

  // ---------- Function to Create New Manager Rule ----------
  const CreateManagerRule = async () => {
    const ImageUrl = await ImageUpload();
    const data = {
      managerId: newManagerRule.managerId,
      imageUrl:
        ImageUrl !== null
          ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
          : null,
      customerId: newManagerRule.customerId,
      companyId: CompanyId,
    };
    console.log("Rule Data ", data);
    try {
      const response = await axios.post(
        `${baseUrl}/manager-rules/create`,
        data,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (response.data.status) {
        Swal.fire({
          title: "",
          text: "New Rule Created Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        FetchData();
        FetchManagersAndCustomers();
        setIsFormOpen(false);
        setNewManagerRule({
          managerName: "",
          image: null,
          managerId: "",
          customerId: "",
          customerName: "",
        });
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const handleSubmit = () => {
    if (!newManagerRule.managerName) {
      notify("Select Manager Name before click save button.", "info");
      return;
    }
    if (!newManagerRule.customerName) {
      notify("Select Customer Name before click save button.", "info");
      return;
    }
    Swal.fire({
      title: "",
      text: "Are you sure, you want to Create New Rule?",
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
        CreateManagerRule();
      }
    });
  };
  // Handle Image Click to open modal
  const handleImageClick = (imageUrl: string, altText: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageAlt(altText);
    setIsImageModalOpen(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageUrl("");
    setSelectedImageAlt("");
  };

  // Handel cancel button click
  const handleCancelButtonClick = () => {
    setIsFormOpen(false);
    setNewManagerRule({
      managerName: "",
      image: null,
      managerId: "",
      customerId: "",
      customerName: "",
    });
  };

  const statusChange = () => {};

  // Define columns for Manager Rules page
  const columns: GridColDef[] = [
    {
      field: "managerProfile",
      headerName: "Manager",
      minWidth: 300,
      renderCell: (params: any) => {
        return (
          <div className="flex items-center w-full h-full space-x-3">
            <img
              className="w-[40px] h-[40px] object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              src={
                params.row.managerImageUrl
                  ? params.row.managerImageUrl
                  : Images.unknownUser
              }
              alt="Manager Profile"
              onClick={() =>
                handleImageClick(
                  params.row.managerImageUrl || Images.unknownUser,
                  `${params.row.managerName}'s Profile`
                )
              }
            />
            <span className="font-bold text-gray-800">
              {params.row.managerName}
            </span>
          </div>
        );
      },
    },
    {
      field: "customerProfile",
      headerName: "Customer",
      minWidth: 300,
      renderCell: (params: any) => {
        return (
          <div className="flex items-center w-full h-full space-x-3">
            <img
              className="w-[40px] h-[40px] object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              src={
                params.row.customerImageUrl
                  ? params.row.customerImageUrl
                  : Images.unknownUser
              }
              alt="Customer Profile"
              onClick={() =>
                handleImageClick(
                  params.row.customerImageUrl || Images.unknownUser,
                  `${params.row.customerName}'s Profile`
                )
              }
            />
            <span className="font-bold text-gray-700">
              {params.row.customerName}
            </span>
          </div>
        );
      },
    },
    // ...(UserType === "SuperAdmin"
    //   ? [
    //       {
    //         field: "companyName",
    //         headerName: "Company",
    //         minWidth: 250,
    //         renderCell: (params: any) => (
    //           <span className="font-semibold text-gray-800">
    //             {params.value || "N/A"}
    //           </span>
    //         ),
    //       },
    //     ]
    //   : []),
    // {
    //   field: "imageUrl",
    //   headerName: "Rule Image",
    //   minWidth: 150,
    //   renderCell: (params: any) => (
    //     <img
    //       className="w-[40px] h-[40px] object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
    //       src={params.value ? params.value : Images.unknownRule}
    //       alt="Rule"
    //       onClick={() =>
    //         handleImageClick(params.value || Images.unknownRule, "Rule Image")
    //       }
    //     />
    //   ),
    // },
    {
      field: "dateCreated",
      headerName: "Created At",
      minWidth: 150,
      align: "center" as GridAlignment,
      renderCell: (params: any) => (
        <span className="text-gray-600 font-mono text-sm">{params.value}</span>
      ),
    },
    {
      field: "dateUpdated",
      headerName: "Updated At",
      minWidth: 150,
      align: "center" as GridAlignment,
      renderCell: (params: any) => (
        <span className="text-gray-600 font-mono text-sm">{params.value}</span>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between gap-10 lg:justify-start">
        <PageHeader title="MANAGER RULES MANAGEMENT" subTitle="" />
        {(UserType === "SuperAdmin" || UserType === "Admin") && !isLoading && (
          <button
            onClick={() => setIsFormOpen(true)}
            className={`bg-orange-400 px-4 py-3 text-[12px] rounded-md hover:bg-orange-300 duration-300 transition-colors`}
          >
            Add New Manager Rule
          </button>
        )}
      </div>
      {/* Data Table */}
      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : (
        <div>
          {managerRules.length > 0 ? (
            <div className="min-h-[75vh] mt-5 overflow-y-auto">
              <DataTable
                slug="manager-rules"
                columns={columns}
                rows={managerRules}
                statusChange={statusChange}
                fetchData={FetchData}
              />
            </div>
          ) : (
            <p
              style={{ color: colors.grey[100] }}
              className="mt-10 text-lg font-semibold"
            >
              No Data Available...
            </p>
          )}
        </div>
      )}

      {/* Popup Form for Adding New Rule */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 overflow-y-auto bg-black bg-opacity-50">
          <div className="w-full p-8 bg-white rounded-lg max-h-[90vh] overflow-y-auto lg:w-2/3">
            <h2 className="mb-4 text-lg font-bold text-center text-black">
              Add New Manager Rule
            </h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Manager Name */}
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Manager Name{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="managerName"
                  value={newManagerRule.managerId}
                  onChange={(e) =>
                    setNewManagerRule({
                      ...newManagerRule,
                      managerId: e.target.value,
                      managerName: e.target.selectedOptions[0].text,
                    })
                  }
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                >
                  <option>None</option>
                  {managers.length > 0 &&
                    managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.fullName}
                      </option>
                    ))}
                </select>
              </div>
              {/* Customer Name */}
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Customer Name{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="customerName"
                  value={newManagerRule.customerId}
                  onChange={(e) =>
                    setNewManagerRule({
                      ...newManagerRule,
                      customerId: e.target.value,
                      customerName: e.target.selectedOptions[0].text,
                    })
                  }
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                >
                  {" "}
                  <option>None</option>
                  {customers.length > 0 &&
                    customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.fullName}
                      </option>
                    ))}
                </select>
              </div>
              {/* Image Upload */}
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Choose Image
                </label>
                <input
                  type="file"
                  name="image"
                  onChange={HandleFileChange}
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end mt-5 space-x-4">
              <button
                className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                onClick={handleCancelButtonClick}
              >
                Cancel
              </button>
              <button
                className="px-4 py-3 w-full text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
                onClick={handleSubmit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal for Rule Images */}
      {isImageModalOpen && (
        <ImageModal
          isOpen={isImageModalOpen}
          imageUrl={[selectedImageUrl]}
          altText={selectedImageAlt}
          onClose={closeImageModal}
        />
      )}
    </div>
  );
};

export default ManagerRule;
