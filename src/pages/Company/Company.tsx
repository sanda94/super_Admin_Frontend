import React, { useState, useEffect } from "react";
import { PageHeader, DataTable } from "../../components/molecules";
import { GridColDef } from "@mui/x-data-grid";
import { useTheme } from "../../context/Theme/ThemeContext";
import Swal from "sweetalert2";
import { useToast } from "../../context/Alert/AlertContext";
import axios from "axios";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import { useNavigate } from "react-router-dom";
import { Images } from "../../constants";
import {
  GetUserSessionBySessionType,
  SaveUserSession,
} from "../../helper/HandleLocalStorageData";

type Company = {
  _id: string;
  companyName: string;
  companyEmail: string;
  companyPhoneNumber: string;
  companyAddress: string;
  image: File | null;
  imageUrl?: string;
  description: string;
};

const Company: React.FC = () => {
  const savedUserData = GetUserSessionBySessionType("Primary");
  const UserType = savedUserData?.userType;
  const Token = savedUserData?.accessToken;
  const UserId = savedUserData?.userId;
  const { colors, theme } = useTheme();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { baseUrl } = useBaseUrl();

  const [isLoading, setLoading] = useState<boolean>(false);
  const [isCreateNewCompanyFormOpen, setCreateNewCompanyFormOpen] =
    useState<boolean>(false);
  const [newCompany, setNewCompany] = useState<Company>({
    _id: "",
    companyName: "",
    companyEmail: "",
    companyPhoneNumber: "",
    companyAddress: "",
    image: null,
    description: "",
  });
  const [companyData, setCompnayData] = useState<Company[]>([]);

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      FetchCompanies();
    }
  }, [Token]);

  // Fetch All Companies
  const FetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/companies/all`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Token}`,
        },
      });
      if (response.data.status) {
        setCompnayData(response.data.companies);
      } else {
        notify(response.data.message || "Failed to fetch companies.", "error");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      notify("An error occurred while fetching companies.", "error");
      console.error(error);
    }
  };

  // Handle Save button
  const handleSubmit = async () => {
    // Basic Validations
    if (
      !newCompany.companyName ||
      !newCompany.companyEmail ||
      !newCompany.companyPhoneNumber ||
      !newCompany.companyAddress
    ) {
      notify("Please fill all required fields.", "error");
      return;
    }

    if (!isValidEmail(newCompany.companyEmail)) {
      notify("Please enter a valid email address.", "error");
      return;
    }

    if (!isTeleValid(newCompany.companyPhoneNumber)) {
      notify("Please enter a valid phone number.", "error");
      return;
    }

    Swal.fire({
      title: "",
      text: "Are you sure to Create New User?",
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
        CreateNewCompany();
      }
    });
  };

  // Function to create new Company
  const CreateNewCompany = async () => {
    try {
      setLoading(true);
      const imageFileName = await ImageUpload();
      const data = {
        companyName: newCompany.companyName,
        companyEmail: newCompany.companyEmail,
        companyPhoneNumber: newCompany.companyPhoneNumber,
        companyAddress: newCompany.companyAddress,
        imageUrl:
          imageFileName !== null
            ? `https://www.xpacc.online/uploads/${imageFileName}`
            : null,
        description: newCompany.description,
      };
      console.log("Data: ", data);
      const response = await axios.post(`${baseUrl}/companies/create`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Token}`,
        },
      });

      if (response.data.status) {
        notify("New company created successfully.", "success");
        setCreateNewCompanyFormOpen(false);
        setNewCompany({
          _id: "",
          companyName: "",
          companyEmail: "",
          companyPhoneNumber: "",
          companyAddress: "",
          image: null,
          description: "",
        });
        FetchCompanies();
      } else {
        notify(response.data.message || "Failed to create company.", "error");
      }
      setLoading(false);
    } catch (error: any) {
      setLoading(false);

      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "An error occurred while creating the company.";

      notify(errorMessage, "error");
      console.error(error);
    }
  };

  // Validate Email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate Telephone Number
  const isTeleValid = (phoneNumber: string) => {
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    return phoneRegex.test(phoneNumber);
  };

  // Function to Upload Image
  const ImageUpload = async () => {
    if (newCompany.image === null) {
      return null;
    }

    const formData = new FormData();
    formData.append("file", newCompany.image);

    try {
      const response = await axios.post(`${baseUrl}/files/save`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          token: `Bearer ${Token}`,
        },
      });
      return response.data.fileName;
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  // ---------- FUnction loging as Admin ----------
  const HandleLoginAsAdmin = (companyId: string) => {
    const userData = {
      emailAddress: savedUserData?.emailAddress || "",
      userId: savedUserData?.userId || "",
      userType: "Admin",
      userName: savedUserData?.userName || "",
      accessToken: savedUserData?.accessToken || "",
      companyId: companyId || "",
      sessionType: "Secondary",
    };
    SaveUserSession(userData);

    const url = `/home?userId=${userData.userId}&companyId=${companyId}`;
    window.open(url, "_blank");
  };

  // Data Table Colums
  const columns: GridColDef[] = [
    {
      field: "_id",
      headerName: "Id",
      minWidth: 250,
    },
    {
      field: "profile",
      headerName: "Company Name",
      maxWidth: 300,
      minWidth: 150,
      renderCell: (params: any) => {
        return (
          <div className="flex items-center w-full h-full space-x-3">
            <img
              className="w-[40px] h-[40px] object-cover rounded-full"
              src={
                params.row.imageUrl
                  ? params.row.imageUrl
                  : Images.unknownCompany
              }
              alt="Profile"
            />
            <span>{params.row.companyName}</span>
          </div>
        );
      },
    },
    {
      field: "companyEmail",
      type: "string",
      headerName: "Email Address",
      minWidth: 150,
    },
    {
      field: "companyPhoneNumber",
      type: "string",
      headerName: "Phone Number",
      minWidth: 150,
    },
    {
      field: "companyAddress",
      type: "string",
      headerName: "Address",
      minWidth: 150,
    },
    {
      field: "description",
      type: "string",
      headerName: "Description",
      minWidth: 150,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (params: any) => (
        <div className="flex items-center justify-center w-full h-full">
          <button
            onClick={() => HandleLoginAsAdmin(params.row._id)}
            className={`px-3 py-2 h-[62%] min-w-[85px] w-full flex items-center text-[12px] justify-center rounded-md transition-colors duration-300 text-white bg-green-500 hover:bg-green-400`}
          >
            Loging as Admin
          </button>
        </div>
      ),
    },
  ];

  const updateStatus = () => {
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-10 lg:justify-start">
        {/* Page Header */}
        <PageHeader
          title="COMPANIES"
          subTitle="This is the company mamagement page."
        />
        {UserType === "SuperAdmin" && !isLoading ? (
          <button
            onClick={() => setCreateNewCompanyFormOpen(true)}
            className={`bg-orange-400 px-4 py-3 rounded-md text-[12px] hover:bg-orange-300 duration-300 transition-colors`}
          >
            Add New Company
          </button>
        ) : null}
      </div>

      {/* Company Data table */}
      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : (
        <div>
          {companyData.length > 0 ? (
            <div className="min-h-[100vh] mt-5 overflow-y-auto">
              <DataTable
                slug="companies"
                statusChange={updateStatus}
                columns={columns}
                rows={companyData}
                fetchData={FetchCompanies}
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

      {/* Create New Company Form */}
      {isCreateNewCompanyFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black bg-opacity-50">
          <div className="w-full p-6 bg-white rounded-lg h-auto max-h-[90vh] overflow-y-auto shadow-lg lg:w-2/3">
            <h2 className="mb-4 text-lg font-bold text-center text-black">
              Add New Company
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Company Name{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <input
                  type="text"
                  name="companyName"
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      companyName: e.target.value,
                    })
                  }
                  placeholder="Company Name"
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Choose Image
                </label>
                <input
                  type="file"
                  name="image"
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      image: e.target.files ? e.target.files[0] : null,
                    })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Email Address{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <input
                  type="email"
                  name="emailAddress"
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      companyEmail: e.target.value,
                    })
                  }
                  placeholder="Company Email Address"
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Phone Number{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      companyPhoneNumber: e.target.value,
                    })
                  }
                  placeholder="Company Phone Number"
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              <div className="md:col-span-2">
                <label className="w-full font-semibold text-[13px]">
                  Company Address{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <textarea
                  name="address"
                  placeholder="Company Address"
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      companyAddress: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              <div className="md:col-span-2">
                <label className="w-full font-semibold text-[13px]">
                  Description{" "}
                </label>
                <textarea
                  name="description"
                  placeholder="Description"
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                onClick={() => setCreateNewCompanyFormOpen(false)}
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
      ) : null}
    </div>
  );
};

export default Company;
