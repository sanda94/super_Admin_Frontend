import React, { useState } from "react";
import Swal from "sweetalert2";
import { useTheme } from "../../../context/Theme/ThemeContext";
import axios from "axios";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import { useToast } from "../../../context/Alert/AlertContext";
import { useLocation } from "react-router-dom";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

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

// ---------- Company Interface ----------
interface CompanyProps {
  onClose: () => void;
  companyData: CompanyData | null;
  fetchData: () => void;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const CompanyPopup: React.FC<CompanyProps> = ({
  onClose,
  companyData,
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
  const { colors, theme } = useTheme();

  const { baseUrl } = useBaseUrl();
  const [image, setImage] = useState<File | null>();
  const { notify } = useToast();

  const [company, setCompany] = useState<CompanyData>({
    _id: companyData ? companyData._id : "",
    companyName: companyData ? companyData.companyName : "",
    companyEmail: companyData ? companyData.companyEmail : "",
    companyPhoneNumber: companyData ? companyData.companyPhoneNumber : "",
    companyAddress: companyData ? companyData.companyAddress : "",
    imageUrl: companyData ? companyData.imageUrl : "",
    description: companyData ? companyData.description : "",
  });

  const handleSave = () => {
    if (
      !company.companyName ||
      !company.companyEmail ||
      !company.companyPhoneNumber ||
      !company.companyAddress
    ) {
      notify("Please fill all required fields", "error");
      return;
    }
    if (!isValidEmail(company.companyEmail)) {
      notify("Please enter a valid email address", "error");
      return;
    }
    if (!isTeleValid(company.companyPhoneNumber)) {
      notify("Please enter a valid phone number", "error");
      return;
    }
    Swal.fire({
      title: "",
      text: "Are you sure to Update Company?",
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
        UpdateCompany();
      }
    });
  };

  // Function to delete image
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

  // Function to upload image
  const ImageUpload = async () => {
    if (!image) {
      return null;
    }
    if (company.imageUrl !== null) {
      DeleteImage(company.imageUrl);
    }

    const formData = new FormData();
    formData.append("file", image);

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
      //notify(error.response.data.error.message, "error");
    }
  };

  // Function to update company
  const UpdateCompany = async () => {
    const ImageUrl = await ImageUpload();

    const data = {
      companyName: company.companyName,
      companyEmail: company.companyEmail,
      companyPhoneNumber: company.companyPhoneNumber,
      companyAddress: company.companyAddress,
      description: company.description,
      imageUrl:
        ImageUrl !== null
          ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
          : company.imageUrl,
    };

    try {
      const response = await axios.put(
        `${baseUrl}/companies/update/${company._id}`,
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
          text: "Update Company Successfully!",
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

  return (
    <div className="fixed inset-0 z-50 flex p-5 items-center justify-center bg-black bg-opacity-50">
      <div className="w-full p-6 text-black lg:max-[90vh] md:max-h-[85vh] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg lg:w-2/3">
        <h2 className="mb-4 text-lg font-bold text-center text-black">
          Edit Company
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
              value={company.companyName}
              onChange={(e) =>
                setCompany({ ...company, companyName: e.target.value })
              }
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
                setImage(e.target.files ? e.target.files[0] : null)
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
              type="text"
              name="companyEmail"
              value={company.companyEmail}
              onChange={(e) =>
                setCompany({ ...company, companyEmail: e.target.value })
              }
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
              name="companyPhonenumber"
              value={company.companyPhoneNumber}
              onChange={(e) =>
                setCompany({ ...company, companyPhoneNumber: e.target.value })
              }
              className="w-full p-2 mt-2 text-[12px] border rounded-md"
            />
          </div>
          <div>
            <label className="w-full font-semibold text-[13px]">
              Address <strong className="text-red-500 text-[12px]">*</strong>
            </label>
            <textarea
              name="companyAddress"
              value={company.companyAddress}
              onChange={(e) =>
                setCompany({ ...company, companyAddress: e.target.value })
              }
              className="w-full p-2 mt-2 text-[12px] border rounded-md"
            />
          </div>
          <div>
            <label className="w-full font-semibold text-[13px]">
              Description
            </label>
            <textarea
              name="description"
              value={company.description}
              onChange={(e) =>
                setCompany({ ...company, description: e.target.value })
              }
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
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyPopup;
