import React, { useEffect, useState } from "react";
import { GridColDef } from "@mui/x-data-grid";
import { useTheme } from "../../context/Theme/ThemeContext";
import { DataTable, PageHeader } from "../../components/molecules";
import { Images } from "../../constants";
import Swal from "sweetalert2";
import { useToast } from "../../context/Alert/AlertContext";
import axios from "axios";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

// User Type Definition
type User = {
  _id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: number;
  address: string;
  organization: string;
  status: string;
  userType: string;
  imageUrl: string;
  companyId?: string;
};

// Company Type Definition
type Company = {
  _id: string;
  companyName: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const Users: React.FC = () => {
  // Local Storage variables
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

  const { colors, theme } = useTheme();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { baseUrl } = useBaseUrl();
  const [isOpenForm, setIsFormOpen] = useState<boolean>(false);
  const [userData, setUserData] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<{
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    address: string;
    organization: string;
    userType: string;
    status: string;
    image: File | null;
    password: string;
    companyId?: string;
  }>({
    fullName: "",
    emailAddress: "",
    phoneNumber: "",
    address: "",
    organization: "",
    userType: "Customer",
    status: "Active",
    image: null,
    password: "",
    companyId: "",
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      FetchUsersAndCompanies();
    }
  }, [Token]);

  const FetchUsersAndCompanies = async () => {
    let url: string;
    if (UserType === "SuperAdmin" || UserType === "Admin") {
      url = `${baseUrl}/users/all/company/${CompanyId}/user/${UserId}/type/${UserType}/except`;
    } else if (UserType === "Moderator") {
      url = `${baseUrl}/users/all/company/${CompanyId}/nonadmin/moderator/${UserId}`;
    } else {
      return;
    }

    //const data = { userId: UserId, companyId: CompanyId, userType: UserType };

    try {
      // Fetch both users and companies in parallel
      const [usersRes, companiesRes] = await Promise.all([
        axios.get(url, {
          headers: { token: `Bearer ${Token}` },
        }),
        axios.get(`${baseUrl}/companies/all`, {
          headers: { token: `Bearer ${Token}` },
        }),
      ]);

      if (usersRes.data.status && companiesRes.data.status) {
        let users: User[] = usersRes.data.users;
        const companies: Company[] = companiesRes.data.companies;

        // 🔑 Merge only if logged-in user is SuperAdmin
        if (UserType === "SuperAdmin") {
          users = users.map((user) => {
            if (user.userType === "SuperAdmin") {
              return { ...user, companyName: "N/A" };
            }
            const company = companies.find((c) => c._id === user.companyId);
            return {
              ...user,
              companyName: company ? company.companyName : "Unknown",
            };
          });
        }

        setUserData(users);
        setCompanies(companies);
      } else {
        notify("Failed to fetch users or companies", "error");
      }
    } catch (error: any) {
      console.log(error);
      notify(
        error.response?.data?.error?.message || "Something went wrong",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const openForm = () => {
    setIsFormOpen(!isOpenForm);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isTeleValid = (phoneNumber: string) => {
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    return phoneRegex.test(phoneNumber);
  };

  const HandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      setNewUser((prevUser) => ({
        ...prevUser,
        image: files[0],
      }));
    }
  };

  const GeneratePassword = () => {
    const timestamp = Date.now();
    const password = timestamp.toString().slice(-5);
    return password;
  };

  const ImageUpload = async () => {
    if (newUser.image === null) {
      return null;
    }
    const data = {
      file: newUser.image,
    };
    console.log(newUser);
    console.log(data);
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
      notify(error.response.data.error.message, "error");
    }
  };

  const RegisterUser = async () => {
    try {
      const password = GeneratePassword();
      const ImageUrl = await ImageUpload();
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().split(" ")[0];

      const data = {
        fullName: newUser.fullName,
        emailAddress: newUser.emailAddress,
        address: newUser.address,
        phoneNumber: newUser.phoneNumber,
        organization: newUser.organization,
        status: newUser.status,
        userType: newUser.userType,
        companyId: UserType === "SuperAdmin" ? newUser.companyId : CompanyId,
        imageUrl:
          ImageUrl !== null
            ? `https://www.xpac.online/uploads/${ImageUrl}`
            : null,
        password: password,
        dateCreated: date,
        timeCreated: time,
        dateUpdated: date,
        timeUpdated: time,
      };

      console.log("Register Data", data);

      const response = await axios.post(`${baseUrl}/users/register`, data, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      if (response.data.status) {
        Swal.fire({
          title: "",
          text: "User Create Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        FetchUsersAndCompanies();
        setIsFormOpen(false);
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const updateStatus = (id: string, newStatus: string) => {
    Swal.fire({
      title: "",
      text: "Are you sure you want to update user status?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      iconColor: colors.blueAccent[400],
      confirmButtonText: "Ok",
      color: colors.grey[100],
      allowOutsideClick: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const now = new Date();
        const date = now.toISOString().split("T")[0];
        const time = now.toTimeString().split(" ")[0];
        const data = {
          status: newStatus,
          dateUpdated: date,
          timeUpdated: time,
        };
        console.log("data", data);
        try {
          const response = await axios.put(
            `${baseUrl}/users/update/${id}`,
            data,
            {
              headers: {
                token: `Bearer ${Token}`,
              },
            }
          );
          console.log(response);
          if (response.data.status) {
            Swal.fire({
              title: "",
              text: "User Status Updated Successfully!",
              icon: "success",
              showCancelButton: false,
              confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
              background: colors.primary[400],
              iconColor: "#06D001",
              confirmButtonText: "Ok",
              color: colors.grey[100],
              allowOutsideClick: false,
            });
            FetchUsersAndCompanies();
          }
        } catch (error: any) {
          console.log(error);
          notify(error.response.data.error.message, "error");
        }
      }
    });
  };

  const handleSubmit = () => {
    if (
      !newUser.fullName ||
      !newUser.emailAddress ||
      !newUser.address ||
      !newUser.phoneNumber ||
      (UserType === "SuperAdmin" && !newUser.companyId)
    ) {
      notify("Fill all required field before click Save button", "error");
      return;
    } else if (!isValidEmail(newUser.emailAddress)) {
      notify("Please enter a valid Email Address.", "error");
      return;
    } else if (!isTeleValid(newUser.phoneNumber)) {
      notify("Please enter a valid Phone Number.", "error");
      return;
    } else {
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
          RegisterUser();
        }
      });
    }
  };

  const columns: GridColDef[] = [
    {
      field: "_id",
      headerName: "Id",
      minWidth: 250,
    },
    {
      field: "profile",
      headerName: "Profile",
      maxWidth: 300,
      minWidth: 150,
      renderCell: (params: any) => {
        return (
          <div className="flex items-center w-full h-full space-x-3">
            <img
              className="w-[40px] h-[40px] object-cover rounded-full"
              src={
                params.row.imageUrl ? params.row.imageUrl : Images.unknownUser
              }
              alt="Profile"
            />
            <span>{params.row.fullName}</span>
          </div>
        );
      },
    },
    {
      field: "emailAddress",
      type: "string",
      headerName: "Email Address",
      minWidth: 150,
    },
    {
      field: "phoneNumber",
      type: "string",
      headerName: "Phone Number",
      minWidth: 150,
    },
    {
      field: "address",
      type: "string",
      headerName: "Address",
      minWidth: 150,
    },
    {
      field: "organization",
      type: "string",
      headerName: "Organization",
      minWidth: 150,
    },
    {
      field: "userType",
      type: "string",
      headerName: "User Type",
      minWidth: 150,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 150,
      renderCell: (params: any) => {
        const isActive = params.row.status === "Active";
        return (
          <div className="flex items-center justify-center w-full h-full">
            <button
              onClick={() =>
                updateStatus(params.row._id, isActive ? "Inactive" : "Active")
              }
              className={`px-3 py-2 h-[62%] min-w-[85px] w-full flex items-center text-[12px] justify-center rounded-md transition-colors duration-300 text-black ${
                isActive
                  ? "bg-green-500 hover:bg-green-400"
                  : "bg-red-500 hover:bg-red-400"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </button>
          </div>
        );
      },
    },
  ];

  if (UserType === "SuperAdmin") {
    columns.splice(6, 0, {
      field: "companyName",
      type: "string",
      headerName: "Company Name",
      minWidth: 150,
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-10 lg:justify-start">
        <PageHeader title="USERS MANAGEMENT" subTitle="" />
        {(UserType === "Admin" || UserType === "SuperAdmin") && !isLoading ? (
          <button
            onClick={openForm}
            className={`bg-orange-400 px-4 py-3 rounded-md text-[12px] hover:bg-orange-300 duration-300 transition-colors`}
          >
            Add New User
          </button>
        ) : null}
      </div>
      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : (
        <div>
          {userData.length > 0 ? (
            <div className="min-h-[100vh] mt-5 overflow-y-auto">
              <DataTable
                slug="users"
                statusChange={updateStatus}
                columns={columns}
                rows={userData}
                fetchData={FetchUsersAndCompanies}
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
      {isOpenForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black bg-opacity-50">
          <div className="w-full p-6 bg-white rounded-lg h-auto max-h-[90vh] overflow-y-auto shadow-lg lg:w-2/3">
            <h2 className="mb-4 text-lg font-bold text-center text-black">
              Add New User
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Full Name{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <input
                  type="text"
                  name="fullName"
                  onChange={(e) =>
                    setNewUser({ ...newUser, fullName: e.target.value })
                  }
                  placeholder="Full Name"
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
                  onChange={HandleFileChange}
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
                    setNewUser({ ...newUser, emailAddress: e.target.value })
                  }
                  placeholder="Email Address"
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
                    setNewUser({ ...newUser, phoneNumber: e.target.value })
                  }
                  placeholder="Phone Number"
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Organization
                </label>
                <input
                  type="text"
                  name="organization"
                  onChange={(e) =>
                    setNewUser({ ...newUser, organization: e.target.value })
                  }
                  placeholder="Organization"
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {UserType === "SuperAdmin" && (
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Company{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <select
                    name="companyId"
                    onChange={(e) =>
                      setNewUser({ ...newUser, companyId: e.target.value })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="w-full font-semibold text-[13px]">
                  Address{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <textarea
                  name="address"
                  placeholder="Address"
                  onChange={(e) =>
                    setNewUser({ ...newUser, address: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Status <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="status"
                  onChange={(e) =>
                    setNewUser({ ...newUser, status: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="w-full font-semibold text-[13px]">
                  User Type{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="userType"
                  onChange={(e) =>
                    setNewUser({ ...newUser, userType: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                >
                  <option value="Customer">Customer</option>
                  <option value="Admin">Admin</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Manager">Manager</option>
                  {UserType === "SuperAdmin" && (
                    <option value="SuperAdmin">Super Admin</option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                onClick={() => setIsFormOpen(false)}
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
    </div>
  );
};

export default Users;
