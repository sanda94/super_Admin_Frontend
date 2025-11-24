import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import { FaUserCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { useToast } from "../../../context/Alert/AlertContext";
import { useTheme } from "../../../context/Theme/ThemeContext";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

interface CustomerPopUpProps {
  assignedCustomers: string[];
  onClose: () => void;
  reFresh: (updatedAssignedCustomers: string[]) => void;
  productId: string;
}

type CustomerType = {
  _id: string;
  fullName: string;
  imageUrl: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const CustomerPopUp: React.FC<CustomerPopUpProps> = ({
  assignedCustomers,
  onClose,
  reFresh,
  productId,
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
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [selectedCustomers, setSelectedCustomers] =
    useState<string[]>(assignedCustomers);
  const navigate = useNavigate();
  const { baseUrl } = useBaseUrl();
  const [isUpdating, setIsUpdating] = useState(false);
  const { notify } = useToast();
  const { colors, theme } = useTheme();

  useEffect(() => {
    if (!Token) {
      navigate("/login");
    } else {
      GetCustomers();
    }
  }, [Token]);

  const GetCustomers = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/users/all/customers/${productId}`,
        { headers: { token: `Bearer ${Token}` } }
      );
      if (response.data.status) {
        setCustomers(response.data.customers);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  };

  const toggleCustomer = (customerId: string) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  const HandelUpdateButton = () => {
    if (selectedCustomers.length === 0) {
      notify("Select at least one user.", "error");
      return;
    } else {
      Swal.fire({
        title: "",
        text: "Are you sure, you want to update assigned customers list?",
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
          UpdateAssignedCustomers();
        }
      });
    }
  };
  const UpdateAssignedCustomers = async () => {
    setIsUpdating(true);
    try {
      const response = await axios.put(
        `${baseUrl}/products/update/${productId}`,
        { assignedUsers: selectedCustomers },
        { headers: { token: `Bearer ${Token}` } }
      );
      if (response.data.status) {
        Swal.fire({
          title: "",
          text: "Customer Assigned List Updated Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        reFresh(selectedCustomers);
        onClose();
      }
    } catch (error: any) {
      console.error("Failed to update assigned customers:", error);
      notify(error.response.data.error.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const canEdit = UserType === "Admin" || UserType === "SuperAdmin";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] sm:w-[450px] rounded-lg shadow-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 bg-gray-100 border-b">
          <h2 className="font-semibold text-[16px] text-gray-800">
            Assigned Customers
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-500 transition-colors"
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Customer List */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {customers.length > 0 ? (
            customers.map((customer) => {
              const isAssigned = selectedCustomers.includes(customer._id);
              return (
                <div
                  key={customer._id}
                  className={`flex items-center justify-between border-b py-2 px-2 rounded-md transition-colors ${
                    isAssigned ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {customer.imageUrl ? (
                      <img
                        src={customer.imageUrl}
                        alt={customer.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <FaUserCircle
                        size={40}
                        className="text-gray-400 rounded-full border border-gray-200"
                      />
                    )}
                    <span className="text-[14px] text-gray-800 font-medium">
                      {customer.fullName}
                    </span>
                  </div>

                  {canEdit ? (
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => toggleCustomer(customer._id)}
                      className="w-4 h-4"
                    />
                  ) : (
                    isAssigned && (
                      <span className="text-green-600 text-[12px] font-medium">
                        Assigned
                      </span>
                    )
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center text-[13px]">
              No customers found.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 bg-gray-100 border-t gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white text-sm rounded-md hover:bg-gray-500 transition"
          >
            Close
          </button>
          {canEdit && (
            <button
              onClick={HandelUpdateButton}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPopUp;
