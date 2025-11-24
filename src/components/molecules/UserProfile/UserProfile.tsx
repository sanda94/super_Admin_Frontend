import React, { useState, useEffect } from "react";
import { useTheme } from "../../../context/Theme/ThemeContext";
import { Images } from "../../../constants";
import { GridColDef } from "@mui/x-data-grid";
import DataTable from "../DataTable/DataTable";
import Swal from "sweetalert2";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import { useToast } from "../../../context/Alert/AlertContext";
import ImageModal from "../ImageModal/ImageModal";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

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
  image: File;
  companyId: string;
  companyName: string;
  dateCreated: string;
  timeCreated: string;
  dateUpdated: string;
  timeUpdated: string;
  currentPassword: string;
  confirmPassword: string;
  newPassword: string;
};

type Rule = {
  _id: string;
  userId: string;
  userName: string;
  deviceId: string;
  deviceName: string;
  imageUrl: string;
  emailStatus: string;
};

type Device = {
  _id: string;
  title: string;
};

type Company = {
  _id: string;
  companyName: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const columns: GridColDef[] = [
  {
    field: "imageTitle",
    headerName: "Device",
    width: 100,
    renderCell: (params: any) => {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <img
            className="w-[40px] h-[40px] object-cover rounded-full"
            src={params.row.imageUrl ? params.row.imageUrl : Images.unknownRule}
            alt="Device Image"
          />
        </div>
      );
    },
  },
  {
    field: "deviceName",
    headerName: "Title",
    width: 200,
  },
  {
    field: "emailStatus",
    headerName: "Email Status",
    width: 100,
  },
  {
    field: "dateCreated",
    headerName: "Created At",
    width: 150,
  },
  {
    field: "dateUpdated",
    headerName: "Updated At",
    width: 150,
  },
];

const UserProfile: React.FC = () => {
  // LocalStorage variables
  const query = useQuery();
  const userIdLocal = query.get("userId");
  const companyId = query.get("companyId");

  let savedUserData;

  if (userIdLocal !== null && companyId !== null) {
    savedUserData = GetUserSessionByUserIdAndCompanyId(userIdLocal, companyId);
  } else {
    savedUserData = GetUserSessionBySessionType("Primary");
  }
  const UserId = savedUserData?.userId;
  const UserType = savedUserData?.userType;
  const Token = savedUserData?.accessToken;
  const CompanyId = savedUserData?.companyId;
  const SessionType = savedUserData?.sessionType;

  const { theme, colors } = useTheme();
  const { notify } = useToast();
  const { baseUrl } = useBaseUrl();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [UserData, setUserData] = useState<User>();
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);
  const [UserUpdateData, setUserUpdateData] = useState<{
    id: string;
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    address: string;
    organization: string;
    userType: string;
    status: string;
    image: File | null;
    imageUrl: string;
    companyId: string;
    companyName: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    id: "",
    fullName: "",
    emailAddress: "",
    imageUrl: "",
    image: null,
    companyId: "",
    companyName: "",
    phoneNumber: "",
    address: "",
    organization: "",
    status: "",
    userType: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [rules, setRules] = useState<Rule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [newRule, setNewRule] = useState<{
    deviceId: string;
    deviceName: string;
    image: File | null;
    emailStatus: string;
  }>({
    deviceId: "",
    deviceName: "",
    image: null,
    emailStatus: "",
  });
  const [companies, setCompanies] = useState<Company[]>([]);

  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      FetchData();
    }
  }, [Token, userId]);

  const FetchData = async () => {
    try {
      // Always fetch user data
      const userRequest = axios.get(`${baseUrl}/users/one/${userId}`, {
        headers: { token: `Bearer ${Token}` },
      });

      // Fetch rules only if user is not a Manager
      const ruleRequest =
        UserType !== "Manager"
          ? axios.get(`${baseUrl}/rules/all/user/${userId}`, {
              headers: { token: `Bearer ${Token}` },
            })
          : Promise.resolve({ data: { status: false, rules: [] } });

      let deviceRequest;

      // Fetch devices only if user is not a Manager
      if (UserType === "Moderator") {
        deviceRequest = axios.get(
          `${baseUrl}/device/company/${CompanyId}/moderator/${UserId}`,
          { headers: { token: `Bearer ${Token}` } }
        );
      } else if (
        UserType !== "Manager" &&
        UserType !== "SuperAdmin" &&
        UserType !== "Customer"
      ) {
        // Admin & any other allowed types
        deviceRequest = axios.get(`${baseUrl}/device/company/${CompanyId}`, {
          headers: { token: `Bearer ${Token}` },
        });
      } else {
        deviceRequest = Promise.resolve({
          data: { status: false, devices: [] },
        });
      }

      // Run all valid requests in parallel
      const [usersResponse, rulesResponse, devicesResponse] = await Promise.all(
        [userRequest, ruleRequest, deviceRequest]
      );

      // Handle responses
      if (usersResponse.data.status) {
        // Set user details
        setUserData(usersResponse.data.user);
        setUserUpdateData({
          ...UserUpdateData,
          id: usersResponse.data.user._id,
          fullName: usersResponse.data.user.fullName,
          emailAddress: usersResponse.data.user.emailAddress,
          imageUrl: usersResponse.data.user.imageUrl,
          phoneNumber: usersResponse.data.user.phoneNumber,
          address: usersResponse.data.user.address,
          organization: usersResponse.data.user.organization,
          status: usersResponse.data.user.status,
          companyId: usersResponse.data.user.companyId,
          companyName: usersResponse.data.user.companyName,
          userType: usersResponse.data.user.userType,
        });

        // Only set rules and devices if they exist
        if (rulesResponse.data.status) {
          setRules(rulesResponse.data.rules);
        }
        if (devicesResponse.data.status) {
          setDevices(devicesResponse.data.devices);
        }

        // SuperAdmin can also fetch companies
        if (UserType === "SuperAdmin") {
          const companiesResponse = await axios.get(
            `${baseUrl}/companies/all`,
            {
              headers: { token: `Bearer ${Token}` },
            }
          );

          if (companiesResponse.data.status) {
            setCompanies(companiesResponse.data.companies);
          } else {
            notify(companiesResponse.data.error.message, "error");
          }
        }
      } else {
        notify(usersResponse.data.error.message, "error");
        navigate("/error");
      }
    } catch (error: any) {
      console.error(error);
      notify(
        error.response?.data?.error?.message || "An error occurred",
        "error"
      );
      navigate("/error");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageClick = () => {
    setIsOpen(true);
  };

  const closeImageModal = () => {
    setIsOpen(false);
  };

  const handleAction = (id: string) => {
    alert(`Viewing details for device with ID: ${id}`);
  };

  const HandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      setUserUpdateData((prevUser) => ({
        ...prevUser,
        image: files[0],
      }));
      setNewRule((preData) => ({
        ...preData,
        image: files[0],
      }));
    }
  };

  const DeleteImage = async (url: string) => {
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    try {
      console.log(fileName);
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

  const ImageUpload = async () => {
    if (UserUpdateData.image === null) {
      return null;
    }
    if (UserUpdateData.imageUrl !== null) {
      await DeleteImage(UserUpdateData.imageUrl);
    }
    const formData = new FormData();
    formData.append("file", UserUpdateData.image);
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

  const handleSubmitCreate = () => {
    if (!newRule.deviceName || !newRule.emailStatus) {
      notify(
        "Choose device and email status before click save button!",
        "warning"
      );
      return;
    }
    Swal.fire({
      title: "",
      text: "Are you sure to Create New Rule?",
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
        CreateNewRule();
      }
    });
  };

  const handleCancelButton = () => {
    setIsFormOpen(false);
    setShowEditForm(false);
    FetchData();
  };

  const handleUpdateFunction = () => {
    if (
      UserUpdateData.currentPassword &&
      UserUpdateData.confirmPassword &&
      UserUpdateData.newPassword
    ) {
      if (UserUpdateData.newPassword !== UserUpdateData.confirmPassword) {
        notify("New password and Confirm Password must same!.", "warning");
        return;
      } else {
        UpdateAuthenticationDetails();
      }
    }
    if (
      !UserUpdateData.currentPassword &&
      !UserUpdateData.newPassword &&
      !UserUpdateData.confirmPassword
    ) {
      Swal.fire({
        title: "",
        text: "Are you sure to update user details?",
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
          UpdateUserDetails();
        }
      });
    }
  };

  const UpdateUserDetails = async () => {
    const ImageUrl = await ImageUpload();
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];
    const data = {
      fullName: UserUpdateData.fullName,
      emailAddress: UserUpdateData.emailAddress,
      imageUrl:
        ImageUrl !== null
          ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
          : UserUpdateData.imageUrl,
      phoneNumber: UserUpdateData.phoneNumber,
      organization: UserUpdateData.organization,
      address: UserUpdateData.address,
      userType: UserUpdateData.userType,
      status: UserUpdateData.status,
      companyId:
        UserType === "SuperAdmin" ? UserUpdateData.companyId : CompanyId,
      dateUpdated: date,
      timeUpdated: time,
    };
    try {
      const response = await axios.put(
        `${baseUrl}/users/update/${UserUpdateData.id}`,
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
          text: "User Details Update Successfully!",
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
        setShowEditForm(false);
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const UpdateAuthenticationDetails = async () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];
    const data = {
      currentPassword: UserUpdateData.currentPassword,
      newPassword: UserUpdateData.newPassword,
      dateUpdated: date,
      timeUpdated: time,
    };
    try {
      const response = await axios.put(
        `${baseUrl}/users/update/auth/${UserUpdateData.id}`,
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
          text: "Authentication Details Update Successfully! Please login again to the system.",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        }).then((result) => {
          if (result) {
            setShowEditForm(false);
            const userData = JSON.parse(
              localStorage.getItem("userData") || "{}"
            );
            if (userData) {
              delete userData.accessToken;
              localStorage.setItem("userData", JSON.stringify(userData));
            }
            navigate("/");
          }
        });
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const CreateNewRule = async () => {
    const ImageUrl = await ImageUpload();
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];
    const data = {
      deviceId: newRule.deviceId,
      deviceName: newRule.deviceName,
      imageUrl:
        ImageUrl !== null
          ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
          : null,
      userId: UserData?._id,
      userName: UserData?.fullName,
      emailStatus: newRule.emailStatus,
      companyId: CompanyId,
      dateCreated: date,
      timeCreated: time,
      dateUpdated: date,
      timeUpdated: time,
    };
    try {
      const response = await axios.post(`${baseUrl}/rules/create`, data, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

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
        setIsFormOpen(false);
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  console.log("UserId: ", UserId);
  console.log("userId: ", userId);

  return (
    <div>
      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : (
        <div
          className={`max-w-6xl p-8 mx-auto mt-8 rounded-lg shadow-lg ${
            theme === "light" ? "bg-gray-300" : "bg-white"
          }`}
        >
          {/* Profile Header */}
          <div className="flex flex-col items-center justify-start lg:space-x-8 lg:items-start lg:flex-row">
            {/* Profile Image */}
            <div
              className="w-32 h-32 overflow-hidden border-2 border-gray-200 rounded-full shadow-md cursor-pointer"
              onClick={handleProfileImageClick}
            >
              {UserData?.imageUrl ? (
                <img
                  src={UserData.imageUrl}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <img
                  src={Images.unknownUser}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              )}
            </div>

            {/* Profile Details */}
            <div className="cursor-default">
              <h1 className="mt-2 mb-2 text-2xl font-bold text-center text-gray-900 lg:mt-0 lg:text-start">
                {UserData?.fullName}
              </h1>
              {
                <h3 className="mt-2 mb-2 text-xl font-semibold italic text-center text-gray-900 lg:mt-0 lg:text-start">
                  {UserData?.companyName}
                </h3>
              }
              {UserType !== "Customer" && (
                <p className="mb-1 text-center text-gray-600 lg:mt-0 lg:text-start">
                  {UserData?._id}
                </p>
              )}
              <p className="mb-1 text-center text-gray-600 lg:mt-0 lg:text-start">
                {UserData?.emailAddress}
              </p>
              <p className="mb-1 text-center text-gray-600 lg:mt-0 lg:text-start">
                {UserData?.phoneNumber}
              </p>
              <p className="mb-1 text-center text-gray-600 lg:mt-0 lg:text-start">
                {UserData?.address}
              </p>
              <p className="mb-2 text-center text-gray-600 lg:mt-0 lg:text-start">
                {UserData?.organization}
              </p>

              {/* User Status */}
              <span
                className={`mt-2 inline-block px-4 py-3 lg:w-fit w-full rounded-md text-sm font-medium text-center lg:mt-0 lg:text-start 
              ${
                UserData?.status === "Active"
                  ? "bg-green-300 text-green-700"
                  : "bg-red-300 text-red-700"
              }`}
              >
                {UserData?.status === "Active" ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* User Information Section */}
          <div className="grid grid-cols-1 gap-8 mt-7 md:grid-cols-2">
            <div className="p-5 bg-gray-200 rounded-lg shadow-sm">
              <h3 className="font-semibold text-center text-gray-700 md:text-left">
                User Type
              </h3>
              <p className="mt-2 text-center text-gray-900 md:text-left">
                {UserData?.userType}
              </p>
            </div>
            <div className="p-5 bg-gray-200 rounded-lg shadow-sm">
              <h3 className="font-semibold text-center text-gray-700 md:text-left">
                Created At
              </h3>
              <p className="mt-2 text-center text-gray-900 md:text-left">
                {UserData?.dateCreated} at {UserData?.timeCreated}
              </p>
            </div>
            <div className="p-5 bg-gray-200 rounded-lg shadow-sm">
              <h3 className="font-semibold text-center text-gray-700 md:text-left">
                Updated At
              </h3>
              <p className="mt-2 text-center text-gray-900 md:text-left">
                {UserData?.dateUpdated} at {UserData?.timeUpdated}
              </p>
            </div>

            {/* Edit Button - Only show if userId and storedUserId are different */}
            {(UserType === "Admin" ||
              UserType === "SuperAdmin" ||
              UserId === userId) && (
              <div className="flex items-end justify-end w-full h-full md:mb-8">
                <button
                  className="px-4 py-3 w-full text-[12px] md:w-auto text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
                  onClick={() => setShowEditForm(true)}
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
          {showEditForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-5 mt-5 bg-black bg-opacity-50">
              <div className="w-full p-6 text-black lg:max-[90vh] md:max-h-[85vh] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg lg:w-2/3">
                <h2 className="mb-4 text-lg font-bold text-center text-black">
                  Edit Profile
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="">
                    <label
                      htmlFor="fullName"
                      className="w-full font-semibold text-[13px]"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      value={UserUpdateData.fullName}
                      onChange={(e) =>
                        setUserUpdateData({
                          ...UserUpdateData,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    />
                  </div>
                  <div className="">
                    <label
                      htmlFor="image"
                      className="w-full font-semibold text-[13px]"
                    >
                      Image
                    </label>
                    <input
                      type="file"
                      name="image"
                      placeholder="Choose Image"
                      onChange={HandleFileChange}
                      className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    />
                  </div>
                  <div className="col-span-1 row-span-1">
                    <label
                      htmlFor="emailAddress"
                      className="w-full font-semibold text-[13px]"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="emailAddress"
                      placeholder="Email Address"
                      value={UserUpdateData.emailAddress}
                      onChange={(e) =>
                        setUserUpdateData({
                          ...UserUpdateData,
                          emailAddress: e.target.value,
                        })
                      }
                      className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="w-full font-semibold text-[13px]"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder="Phone Number"
                      value={UserUpdateData.phoneNumber}
                      onChange={(e) =>
                        setUserUpdateData({
                          ...UserUpdateData,
                          phoneNumber: e.target.value,
                        })
                      }
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
                      placeholder="Organization"
                      value={UserUpdateData.organization}
                      onChange={(e) =>
                        setUserUpdateData({
                          ...UserUpdateData,
                          organization: e.target.value,
                        })
                      }
                      className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    />
                  </div>
                  {UserType === "SuperAdmin" && (
                    <div>
                      <label className="w-full font-semibold text-[13px]">
                        Company{" "}
                      </label>
                      <select
                        name="companyId"
                        onChange={(e) =>
                          setUserUpdateData({
                            ...UserUpdateData,
                            companyId: e.target.value,
                          })
                        }
                        value={UserUpdateData.companyId}
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
                    <label
                      htmlFor="address"
                      className="w-full font-semibold text-[13px]"
                    >
                      Address
                    </label>
                    <textarea
                      name="address"
                      placeholder="Address"
                      value={UserUpdateData.address}
                      onChange={(e) =>
                        setUserUpdateData({
                          ...UserUpdateData,
                          address: e.target.value,
                        })
                      }
                      className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    />
                  </div>
                  {/* User Type Dropdown */}
                  {UserType === "Admin" || UserType === "SuperAdmin" ? (
                    <>
                      <div>
                        <label className="w-full font-semibold text-[13px]">
                          User Type
                        </label>
                        <select
                          name="userType"
                          value={UserUpdateData.userType}
                          onChange={(e) =>
                            setUserUpdateData({
                              ...UserUpdateData,
                              userType: e.target.value,
                            })
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

                      {/* Status Dropdown */}
                      <div>
                        <label className="w-full font-semibold text-[13px]">
                          Status
                        </label>
                        <select
                          name="status"
                          value={UserUpdateData.status}
                          onChange={(e) =>
                            setUserUpdateData({
                              ...UserUpdateData,
                              status: e.target.value,
                            })
                          }
                          className="w-full p-2 mt-2 text-[12px] border rounded-md"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div></div>
                    </>
                  ) : (
                    <div></div>
                  )}
                  {UserId === userId ? (
                    <>
                      <div></div>
                      <div>
                        <label className="w-full font-semibold text-[13px]">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="oldPassword"
                          placeholder="Current Password"
                          onChange={(e) =>
                            setUserUpdateData({
                              ...UserUpdateData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full p-2 mt-2 text-[12px] border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="w-full font-semibold text-[13px]">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          placeholder="New Password"
                          onChange={(e) =>
                            setUserUpdateData({
                              ...UserUpdateData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full p-2 mt-2 text-[12px] border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="w-full font-semibold text-[13px]">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          onChange={(e) =>
                            setUserUpdateData({
                              ...UserUpdateData,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Confirm New Password"
                          className="w-full p-2 mt-2 text-[12px] border rounded-md"
                        />
                      </div>
                    </>
                  ) : null}
                  <div></div>
                  {/* Save and Cancel buttons */}
                  <div>
                    <button
                      className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                      onClick={handleCancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                  <div>
                    <button
                      className="px-4 py-3 w-full text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
                      onClick={handleUpdateFunction}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col w-full gap-5 p-2 mt-6 overflow-x-auto md:items-start md:justify-start">
            {UserType !== "Manager" &&
              UserType !== "SuperAdmin" &&
              UserUpdateData.userType !== "Admin" && (
                <>
                  {((UserType === "Admin" && UserId !== userId) ||
                    (SessionType !== "Secondary" &&
                      UserUpdateData.userType !== "Admin")) && (
                    <button
                      className="bg-orange-400 px-4 text-[12px] py-3 rounded-md text-black hover:bg-orange-300 duration-300 transition-colors"
                      onClick={() => setIsFormOpen(true)}
                    >
                      Create New Rule
                    </button>
                  )}

                  {((UserType === "Admin" && UserId !== userId) ||
                    UserType === "Customer" ||
                    UserType === "Moderator") && (
                    <div className="w-full">
                      <DataTable
                        slug="rules"
                        columns={columns}
                        rows={rules}
                        statusChange={handleAction}
                        fetchData={FetchData}
                      />
                    </div>
                  )}
                </>
              )}
          </div>
          {isFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center mt-5 bg-black bg-opacity-50">
              <div className="w-full p-6 bg-white rounded-lg shadow-lg lg:w-2/3 sm:w-[95%]">
                <h2 className="mb-4 text-lg font-bold text-center text-black">
                  Create New Rule
                </h2>
                <div className="grid grid-cols-1 gap-5 text-black md:grid-cols-2">
                  <div>
                    <label className="w-full font-semibold text-[13px]">
                      Device Title
                    </label>
                    <select
                      name="device"
                      className="w-full p-2 mt-2 border text-[12px] rounded-md"
                      value={newRule.deviceId}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          deviceId: e.target.value,
                          deviceName: e.target.selectedOptions[0].text,
                        })
                      }
                    >
                      <option>None</option>
                      {devices.length > 0 &&
                        devices.map((device) => (
                          <option key={device._id} value={device._id}>
                            {device.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="w-full font-semibold text-[13px]">
                      Choose Image
                    </label>
                    <input
                      type="file"
                      onChange={HandleFileChange}
                      name="image"
                      className="w-full p-2 mt-2 border text-[12px] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="w-full font-semibold text-[13px]">
                      Email Status
                    </label>
                    <select
                      name="emailStatus"
                      className="w-full p-2 mt-2 border text-[12px] rounded-md"
                      value={newRule.emailStatus}
                      onChange={(e) =>
                        setNewRule({ ...newRule, emailStatus: e.target.value })
                      }
                    >
                      <option>None</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-6 space-x-4">
                  <button
                    className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                    onClick={handleCancelButton}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-3 w-full text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
                    onClick={handleSubmitCreate}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Modal */}
          <ImageModal
            isOpen={isOpen}
            onClose={closeImageModal}
            imageUrl={UserData?.imageUrl || Images.unknownUser}
            altText={`${UserData?.fullName || "User"} profile`}
          />
        </div>
      )}
    </div>
  );
};

export default UserProfile;
