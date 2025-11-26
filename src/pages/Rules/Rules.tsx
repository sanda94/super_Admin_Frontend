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

// Device Type Definition
type Device = {
  _id: string;
  title: string;
};

// User Type Definition
type User = {
  _id: string;
  fullName: string;
};

// Rule Type Definition
type Rule = {
  _id: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  deviceId: string;
  deviceName: string;
  imageUrl: string;
  emailStatus: string;
  companyName?: string;
  companyId?: string;
  dateCreated: string;
  //timeCreated:string,
  dateUpdated: string;
  //timeUpdated:string,
};

// Company Type Definition
type Company = {
  _id: string;
  companyName: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const Devices: React.FC = () => {
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
  const UserId = savedUserData?.userId;
  const CompanyId = savedUserData?.companyId;

  console.log("Company Id: ", CompanyId);

  const { colors, theme } = useTheme();
  const [rules, setRules] = useState<Rule[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const { baseUrl } = useBaseUrl();
  const navigate = useNavigate();
  const [newRule, setNewRule] = useState({
    deviceName: "",
    image: null as File | null,
    userId: "",
    deviceId: "",
    userName: "",
    status: "",
    ruleType: "",
    companyId: "",
    // multi-select support
    deviceIds: [] as string[],
    selectedDevices: [] as Device[],
  });
  const [deviceSearchQuery, setDeviceSearchQuery] = useState<string>("");
  const { notify } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      if (UserType === "SuperAdmin") {
        GetAllCompanies();
      }
    }
  }, [Token]);

  useEffect(() => {
    if (Token) {
      FetchData();
    }
  }, [Token, companies]);

  const FetchData = async () => {
    try {
      const rulesRequest =
        UserType === "Customer"
          ? axios.get(`${baseUrl}/rules/all/user/${UserId}`, {
              headers: { token: `Bearer ${Token}` },
            })
          : UserType === "SuperAdmin"
          ? axios.get(`${baseUrl}/rules/all`, {
              headers: { token: `Bearer ${Token}` },
            })
          : UserType === "Admin"
          ? axios.get(`${baseUrl}/rules/company/${CompanyId}`, {
              headers: { token: `Bearer ${Token}` },
            })
          : Promise.resolve({ data: { status: false, rules: [] } }); // ✅ fallback

      const [usersResponse, devicesResponse, rulesResponse] = await Promise.all(
        [
          axios.get(`${baseUrl}/users/all/company/${CompanyId}/nonadmin`, {
            headers: { token: `Bearer ${Token}` },
          }),
          axios.get(`${baseUrl}/device/company/${CompanyId}`, {
            headers: { token: `Bearer ${Token}` },
          }),
          rulesRequest,
        ]
      );

      if (
        usersResponse.data.status &&
        devicesResponse.data.status &&
        rulesResponse.data.status
      ) {
        const usersData = usersResponse.data.nonAdminUsers;
        const devicesData = devicesResponse.data.devices;
        const rulesData = rulesResponse.data.rules;

        const transformedRules = rulesData.map((rule: any) => {
          const userData = usersData.find(
            (user: any) => user._id === rule.userId
          );
          let companyName = undefined;

          if (UserType === "SuperAdmin" && companies.length > 0) {
            const companyData = companies.find((c) => c._id === rule.companyId);
            companyName = companyData?.companyName || "Unknown Company";
          }

          return {
            ...rule,
            userImageUrl: userData?.imageUrl || null,
            companyName,
          };
        });

        setUsers(usersData);
        setDevices(devicesData);
        setRules(transformedRules);
      } else {
        notify("Failed to fetch data. Please try again later.", "error");
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

  // Function to get all companies
  const GetAllCompanies = async () => {
    try {
      const response = await axios.get(`${baseUrl}/companies/all`, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
      if (response.data.status) {
        setCompanies(response.data.companies);
        return;
      } else {
        notify(response.data.error.message, "error");
      }
    } catch (error: any) {
      console.error(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const HandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      setNewRule((prevUser) => ({
        ...prevUser,
        image: files[0],
      }));
    }
  };

  const ImageUpload = async () => {
    if (!newRule.image) {
      return null;
    }
    const data = {
      file: newRule.image,
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

  const CreateRule = async () => {
    const ImageUrl = await ImageUpload();
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];
    const data = {
      deviceId: newRule.deviceId,
      imageUrl:
        ImageUrl !== null
          ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
          : null,
      userId: newRule.userId,
      emailStatus: newRule.status,
      companyId: UserType === "SuperAdmin" ? newRule.companyId : CompanyId,
      dateCreated: date,
      timeCreated: time,
      dateUpdated: date,
      timeUpdated: time,
    };
    //console.log("Rule Data ", data);
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

  const handleSubmit = () => {
    if (!newRule.userName) {
      notify("Select User Name before click save button.", "info");
      return;
    }
    if (newRule.selectedDevices.length === 0) {
      notify("Select at least one Device before click save button.", "info");
      return;
    }
    if (!newRule.status) {
      notify("Select EmailStatus before click save button.", "info");
      return;
    }

    if (UserType === "SuperAdmin" && !newRule.companyId) {
      notify("Select Company before click save button.", "info");
      return;
    }
    Swal.fire({
      title: "",
      text: `Are you sure, you want to assign ${newRule.selectedDevices.length} device(s) to this user?`,
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
        CreateRulesForSelectedDevices();
      }
    });
  };

  // Toggle device selection for multi-select panel
  const toggleDeviceSelection = (device: Device) => {
    const isSelected = newRule.deviceIds.includes(device._id);
    if (isSelected) {
      setNewRule({
        ...newRule,
        deviceIds: newRule.deviceIds.filter((id) => id !== device._id),
        selectedDevices: newRule.selectedDevices.filter((d) => d._id !== device._id),
      });
    } else {
      setNewRule({
        ...newRule,
        deviceIds: [...newRule.deviceIds, device._id],
        selectedDevices: [...newRule.selectedDevices, device],
      });
    }
  };

  const filteredDevices = devices.filter((device) =>
    device.title.toLowerCase().includes(deviceSearchQuery.toLowerCase())
  );

  // Create rules for selected devices (bulk)
  const CreateRulesForSelectedDevices = async () => {
    try {
      const ImageUrl = await ImageUpload();
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().split(" ")[0];

      const rulesData = newRule.deviceIds.map((deviceId) => {
        const device = devices.find((d) => d._id === deviceId);
        return {
          deviceId: deviceId,
          deviceName: device ? device.title : "",
          imageUrl: ImageUrl
            ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
            : null,
          userId: newRule.userId,
          userName: newRule.userName,
          emailStatus: newRule.status,
          companyId: UserType === "SuperAdmin" ? newRule.companyId : CompanyId,
          dateCreated: date,
          timeCreated: time,
          dateUpdated: date,
          timeUpdated: time,
        };
      });

      const createRulePromises = rulesData.map((ruleData) =>
        axios.post(`${baseUrl}/rules/create`, ruleData, {
          headers: {
            token: `Bearer ${Token}`,
          },
        })
      );

      const results = await Promise.all(createRulePromises);

      if (results.every((response) => response.data.status)) {
        Swal.fire({
          title: "",
          text: "Selected device rules created successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
      }
      // refresh
      FetchData();
      // reset form
      setIsFormOpen(false);
      setNewRule({
        deviceName: "",
        image: null,
        userId: "",
        deviceId: "",
        userName: "",
        status: "",
        ruleType: "",
        companyId: "",
        deviceIds: [],
        selectedDevices: [],
      });
      setDeviceSearchQuery("");
    } catch (error: any) {
      console.log(error);
      FetchData();
      notify(error.response?.data?.error?.message || error.message || "An error occurred", "error");
    }
  };

  const handelAddAllDevicesButton = () => {
    if (!devices) {
      notify("Create New Device Before Create New Rule!", "info");
      return;
    }
    if (!newRule.userName) {
      notify("Select User Name before click Add All Devices button.", "info");
      return;
    }
    if (!newRule.status) {
      notify("Select EmailStatus before click Add All Devices button.", "info");
      return;
    }
    Swal.fire({
      title: "",
      text: "Are you sure, you want to Create New Rules for All Devices?",
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
        CreateRulesForAllDevices();
      }
    });
  };

  const CreateRulesForAllDevices = async () => {
    try {
      const ImageUrl = await ImageUpload();
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().split(" ")[0];

      const rulesData = devices.map((device) => ({
        deviceId: device._id,
        deviceName: device.title,
        imageUrl: ImageUrl
          ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
          : null,
        userId: newRule.userId,
        userName: newRule.userName,
        emailStatus: newRule.status,
        companyId: UserType === "SuperAdmin" ? newRule.companyId : CompanyId,
        dateCreated: date,
        timeCreated: time,
        dateUpdated: date,
        timeUpdated: time,
      }));

      // console.log("New Rule data", rulesData);

      const createRulePromises = rulesData.map((ruleData) =>
        axios.post(`${baseUrl}/rules/create`, ruleData, {
          headers: {
            token: `Bearer ${Token}`,
          },
        })
      );

      const results = await Promise.all(createRulePromises);

      if (results.every((response) => response.data.status)) {
        Swal.fire({
          title: "",
          text: "Rules created successfully for all devices!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
      }
      FetchData();
    } catch (error: any) {
      FetchData();
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const statusChange = () => {};

  // Handle image click to open modal
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

  // Cancel form and reset selections
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setNewRule({
      deviceName: "",
      image: null,
      userId: "",
      deviceId: "",
      userName: "",
      status: "",
      ruleType: "",
      companyId: "",
      deviceIds: [],
      selectedDevices: [],
    });
    setDeviceSearchQuery("");
  };

  // Define columns for Rules page
  const columns: GridColDef[] = [
    {
      field: "userProfile",
      headerName: "User Profile",
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
              alt="User Profile"
              onClick={() =>
                handleImageClick(
                  params.row.userImageUrl || Images.unknownUser,
                  `${params.row.userName}'s Profile`
                )
              }
            />
            <span className="font-bold">{params.row.userName}</span>
          </div>
        );
      },
    },
    {
      field: "deviceId",
      headerName: "Device Id",
      minWidth: 250,
      renderCell: (params: any) => (
        <span className="truncate max-w-[180px] block">{params.value}</span>
      ),
    },
    {
      field: "deviceName",
      headerName: "Device Title",
      minWidth: 200,
      renderCell: (params: any) => (
        <span className="font-bold text-gray-800">{params.value}</span>
      ),
    },
    {
      field: "userId",
      headerName: "User Id",
      minWidth: 250,
      renderCell: (params: any) => (
        <span className="truncate max-w-[180px] block">{params.value}</span>
      ),
    },
    {
      field: "userName",
      headerName: "User",
      minWidth: 200,
      renderCell: (params: any) => (
        <span className="font-bold text-gray-700">{params.value}</span>
      ),
    },
    {
      field: "emailStatus",
      headerName: "Email Status",
      minWidth: 150,
      align: "center" as GridAlignment,
      renderCell: (params: any) => {
        let color = "bg-gray-400";
        if (typeof params.value === "string") {
          const status = params.value.toLowerCase();
          if (status === "sent" || status === "yes") color = "bg-green-500";
          else if (status === "pending" || status === "no")
            color = "bg-yellow-500";
          else if (status === "failed") color = "bg-red-500";
        }
        return (
          <span
            className={`px-2 py-1 rounded text-white text-xs font-bold ${color}`}
          >
            {params.value}
          </span>
        );
      },
    },
    ...(UserType === "SuperAdmin"
      ? [
          {
            field: "companyName",
            headerName: "Company Name",
            minWidth: 250,
          },
        ]
      : []),
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
    <div className="z-[100]">
      <div className="flex items-center justify-between gap-10 lg:justify-start">
        <PageHeader title="DEVICE RULES MANAGEMENT" subTitle="" />
        {(UserType === "SuperAdmin" || UserType === "Admin") && !isLoading && (
          <button
            onClick={() => setIsFormOpen(true)}
            className={`bg-orange-400 px-4 py-3 text-[12px] rounded-md hover:bg-orange-300 duration-300 transition-colors`}
          >
            Add New Device Rule
          </button>
        )}
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
          {rules.length > 0 ? (
            <div className="min-h-[75vh] mt-5 overflow-y-auto">
              <DataTable
                slug="rules"
                columns={columns}
                rows={rules}
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
              Add New Rule
            </h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* User Name */}
              <div>
                <label className="w-full font-semibold text-[13px]">
                  User Name{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="userName"
                  value={newRule.userId}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      userId: e.target.value,
                      userName: e.target.selectedOptions[0].text,
                    })
                  }
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                >
                  <option>None</option>
                  {users.length > 0 &&
                    users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.fullName}
                      </option>
                    ))}
                </select>
              </div>
              {/* Device Name */}
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Device Name{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                {/* Search bar for devices */}
                <input
                  type="text"
                  title="Search devices"
                  placeholder="Search devices..."
                  value={deviceSearchQuery}
                  onChange={(e) => setDeviceSearchQuery(e.target.value)}
                  className="w-full p-2 mt-2 border text-[12px] rounded-md focus:outline-none focus:border-blue-400"
                />

                {/* Devices list panel (scrollable) */}
                <div className="w-full p-3 mt-2 border rounded-md bg-gray-50 max-h-[250px] overflow-y-auto">
                  {filteredDevices.length > 0 ? (
                    <div className="space-y-2">
                      {filteredDevices.map((device) => (
                        <div
                          key={device._id}
                          className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                          onClick={() => toggleDeviceSelection(device)}
                        >
                          <input
                            type="checkbox"
                            title={`Select ${device.title}`}
                            checked={newRule.deviceIds.includes(device._id)}
                            onChange={() => toggleDeviceSelection(device)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label className="ml-3 text-sm font-medium text-gray-800 cursor-pointer flex-1">
                            {device.title}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No devices found</p>
                  )}
                </div>

                {/* Selected Devices */}
                {newRule.selectedDevices.length > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-2">
                      Selected Devices ({newRule.selectedDevices.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {newRule.selectedDevices.map((device) => (
                        <span
                          key={device._id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full"
                        >
                          {device.title}
                          <button
                            type="button"
                            onClick={() => toggleDeviceSelection(device)}
                            className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
              {/* Email Status */}
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Email Status{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="status"
                  value={newRule.status}
                  onChange={(e) =>
                    setNewRule({ ...newRule, status: e.target.value })
                  }
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                >
                  <option>None</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              {/* Companies */}
              {UserType === "SuperAdmin" && (
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Company{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <select
                    name="companyId"
                    onChange={(e) =>
                      setNewRule({ ...newRule, companyId: e.target.value })
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
              {/* Create rules for all device for selected user at once */}
              {UserType === "Admin" ||
                (UserType === "SuperAdmin" && (
                  <div className="py-2">
                    <button
                      onClick={handelAddAllDevicesButton}
                      className="px-4 py-3 text-[12px] w-full bg-orange-400 rounded-lg hover:bg-orange-300 transition-colors duration-300"
                    >
                      Create for All Devices
                    </button>
                  </div>
                ))}
            </div>

            <div className="flex justify-end mt-5 space-x-4">
              <button
                className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                onClick={handleCancelForm}
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

export default Devices;
