import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useTheme } from "../../../context/Theme/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import { useToast } from "../../../context/Alert/AlertContext";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

// ---------- Rule Data Interface ----------
interface RuleData {
  _id?: string;
  managerId?: string;
  managerName?: string;
  customerId?: string;
  customerName?: string;
  imageUrl?: string;
}

// ---------- User Data Interface ----------
type User = {
  _id: string;
  fullName: string;
};

// ---------- Rule Interface ----------
interface ManagerRuleProps {
  onClose: () => void;
  managerRuleData: RuleData | null;
  fetchData: () => void;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const ManagerRulePopUp: React.FC<ManagerRuleProps> = ({
  onClose,
  managerRuleData,
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
  const CompanyId = savedUserData?.companyId;

  const [managerRule, setManagerRule] = useState<RuleData | null>(
    managerRuleData
  );
  const [managers, setManagers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [image, setImage] = useState<File | null>();

  const { colors, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { baseUrl } = useBaseUrl();
  const { notify } = useToast();

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      FetchManagersAndCustomers();
    }
  }, [Token]);

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

  const handleSaveButton = () => {
    if (!managerRule?.managerId || !managerRule?.customerId) {
      notify("Please select both Manager and Customer", "warning");
      return;
    }
    Swal.fire({
      title: "",
      text: "Are you sure to Update Rule?",
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
        UpdateManagerRule();
      }
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "file") {
      const file = e.target.files?.[0] || null;
      setImage(file);
    } else {
      switch (name) {
        case "userName":
          setManagerRule({ ...managerRule, managerName: value });
          break;
        case "deviceName":
          setManagerRule({ ...managerRule, customerName: value });
          break;
        default:
          break;
      }
    }
  };

  const DeleteImage = async (url: any) => {
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
      //notify(error.response.data.error.message, "error");
    }
  };

  const ImageUpload = async () => {
    if (!image) {
      return null;
    }
    if (managerRule?.imageUrl !== null) {
      DeleteImage(managerRule?.imageUrl);
    }
    const data = {
      file: image,
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

  const UpdateManagerRule = async () => {
    const ImageUrl = await ImageUpload();

    const data = {
      managerId: managerRule?.managerId,
      customerId: managerRule?.customerId,
      imageUrl:
        ImageUrl !== null
          ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
          : managerRule?.imageUrl,

      companyId: CompanyId,
    };

    try {
      const response = await axios.put(
        `${baseUrl}/manager-rules/update/${managerRule?._id}`,
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
          text: "Update Manager Rule Successfully!",
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
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex p-5 items-center justify-center bg-black bg-opacity-50">
      <div className="w-full p-6 text-black lg:max-[90vh] md:max-h-[85vh] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg lg:w-2/3">
        <h2 className="mb-4 text-lg font-bold text-center text-black">
          Edit Manager Rule
        </h2>
        {/* User */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Conditionally hide based on the URL path */}
          {!location.pathname.includes("/user") && UserType !== "Customer" && (
            <div>
              <label className="w-full font-semibold text-[13px]">
                Manager Name
              </label>
              <select
                name="status"
                className="w-full p-2 mt-2 text-[12px] border rounded-md"
                value={managerRule?.managerId}
                onChange={(e) =>
                  setManagerRule({
                    ...managerRule,
                    managerId: e.target.value,
                    managerName: e.target.selectedOptions[0].text,
                  })
                }
              >
                {managers.length > 0 &&
                  managers.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {manager.fullName}
                    </option>
                  ))}
              </select>
            </div>
          )}
          {/* Device */}

          <div>
            <label className="w-full font-semibold text-[13px]">
              Customer Name
            </label>
            <select
              name="status"
              className="w-full p-2 mt-2 text-[12px] border rounded-md"
              value={managerRule?.customerId}
              onChange={(e) =>
                setManagerRule({
                  ...managerRule,
                  customerId: e.target.value,
                  customerName: e.target.selectedOptions[0].text,
                })
              }
            >
              {customers.length > 0 &&
                customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.fullName}
                  </option>
                ))}
            </select>
          </div>
          {/* Image */}
          <div>
            <label className="w-full font-semibold text-[13px]">
              Choose Image
            </label>
            <input
              type="file"
              name="image"
              onChange={handleInputChange}
              className="w-full p-2 mt-2 text-[12px] border rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-4">
          <button
            className="px-4 py-3 bg-gray-300 rounded-md hover:bg-gray-400 text-[12px] w-full"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-3 text-white bg-blue-500 rounded-md hover:bg-blue-600 text-[12px] w-full"
            onClick={handleSaveButton}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerRulePopUp;
