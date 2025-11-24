import React, { useEffect, useState } from "react";
import { GridColDef, GridAlignment } from "@mui/x-data-grid";
import { useTheme } from "../../context/Theme/ThemeContext";
import { DataTable, PageHeader, ImageModal } from "../../components/molecules";
import { Images } from "../../constants";
import Swal from "sweetalert2";
import { useToast } from "../../context/Alert/AlertContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

// Device Type Definition
type Device = {
  _id: string;
  title: string;
  category: string;
  imageUrl: File | null;
  location: string;
  unitWeight: string;
  assignProduct: string;
  minItems: string;
  minBatteryPercentage: string;
  minBatteryVoltage: string;
  status: string;
  offSet: string;
  calibrationValue: string;
  companyId: string;
  companyName?: string;
  poNumber: string;
  description: string;
  message: string;
};

// Form Data Type Definition
interface FormData {
  title: string;
  category: string;
  image: File | null;
  assignProduct: string;
  location: string;
  unitWeightUnit: string;
  unitWeight: string;
  minItemsCount: string;
  minBatteryPercentage: string;
  minBatteryVoltage: string;
  offSet: string;
  calibrationValue: string;
  poNumber: string;
  companyId: string;
  status: string;
  description: string;
  message: string;
  key: string;
}

// Category Type Definition
type Category = {
  category: string;
};

// Location Type Definition
type Location = {
  location: string;
};

// Product Type Definition
type Product = {
  productName: string;
};

// Company Type Definition
type Company = {
  _id: string;
  companyName: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const Devices: React.FC = () => {
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
  const { baseUrl } = useBaseUrl();
  const { colors, theme } = useTheme();
  const [deviceData, setDeviceData] = useState<Device[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const { notify } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    image: null,
    assignProduct: "",
    location: "",
    unitWeight: "",
    unitWeightUnit: "mg",
    minItemsCount: "",
    minBatteryPercentage: "",
    minBatteryVoltage: "",
    offSet: "",
    calibrationValue: "",
    companyId: "",
    poNumber: "",
    status: "Active",
    description: "",
    message: "",
    key: "",
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      FetchAllData();
      FetchProducts();
    }
  }, [Token]);

  // Fetch All Data in Parallel
  const FetchAllData = async () => {
    try {
      // ------------------ Build URLs ------------------
      const deviceUrl =
        UserType === "SuperAdmin"
          ? `${baseUrl}/device/all`
          : UserType === "Admin"
          ? `${baseUrl}/device/company/${CompanyId}`
          : `${baseUrl}/device/all/${UserId}`;

      const categoryUrl =
        UserType === "SuperAdmin"
          ? `${baseUrl}/categories/all`
          : `${baseUrl}/categories/company/${CompanyId}`;

      const locationsUrl =
        UserType === "SuperAdmin"
          ? `${baseUrl}/locations/all`
          : `${baseUrl}/locations/company/${CompanyId}`;

      // ------------------ API CALLS ------------------
      const devicesResponse = await axios.get(deviceUrl, {
        headers: { token: `Bearer ${Token}` },
      });

      const categoriesResponse = await axios.get(categoryUrl, {
        headers: { token: `Bearer ${Token}` },
      });

      const locationsResponse = await axios.get(locationsUrl, {
        headers: { token: `Bearer ${Token}` },
      });

      let companiesResponse = null;

      // SuperAdmin → Fetch companies also
      if (UserType === "SuperAdmin") {
        companiesResponse = await axios.get(`${baseUrl}/companies/all`, {
          headers: { token: `Bearer ${Token}` },
        });

        if (companiesResponse.data.status) {
          setCompanies(companiesResponse.data.companies);
        }
      }

      // ------------------ PROCESS DEVICES ------------------
      if (devicesResponse.data.status) {
        let devices = devicesResponse.data.devices;

        const companies = companiesResponse?.data?.companies || [];

        const updatedDevices = devices.map((device: any) => {
          // map products to device
          const deviceProducts = products.filter(
            (p: any) => p.deviceId === device._id
          );

          // attach company name for super admin
          const companyName =
            UserType === "SuperAdmin"
              ? companies.find((c: any) => c._id === device.companyId)
                  ?.companyName || "Unknown"
              : device.companyName;

          return {
            ...device,
            companyName,
            products: deviceProducts ?? [], // ALWAYS ARRAY
          };
        });

        setDeviceData(updatedDevices);
      }

      // ------------------ PROCESS CATEGORIES ------------------
      if (categoriesResponse.data.status) {
        setCategories(categoriesResponse.data.categories);
      }

      // ------------------ PROCESS LOCATIONS ------------------
      if (locationsResponse.data.status) {
        setLocations(locationsResponse.data.locations);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const FetchProducts = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/product/company/${CompanyId}`,
        {
          headers: { token: `Bearer ${Token}` },
        }
      );

      if (
        response?.data?.status !== false &&
        response?.data?.products?.length > 0
      ) {
        setProducts(response.data.products);
      } else {
        setProducts([]); // still update UI
      }
    } catch (err) {
      console.error("Product Fetch Error:", err);
      setProducts([]); // avoid blank UI
    }
  };

  // Function to handle status change
  const HandleStatus = async (id: string, newStatus: string) => {
    Swal.fire({
      title: "",
      text: "Are you sure you want to update device status?",
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

        try {
          const response = await axios.put(
            `${baseUrl}/device/update/${id}`,
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
              text: "Device Status Updated Successfully!",
              icon: "success",
              showCancelButton: false,
              confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
              background: colors.primary[400],
              iconColor: "#06D001",
              confirmButtonText: "Ok",
              color: colors.grey[100],
              allowOutsideClick: false,
            });
            FetchAllData();
          }
        } catch (error: any) {
          console.log(error);
          notify(error.response.data.error.message, "error");
        }
      }
    });
  };

  // Function to handle file input change
  const HandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      setFormData((prevUser) => ({
        ...prevUser,
        image: files[0],
      }));
    }
  };

  // Validation Functions
  const isNumberValid = (number: string) => {
    const numberRegex = /^\d+$/;
    return numberRegex.test(number);
  };

  const isFloatNumberValid = (number: string) => {
    const floatRegex = /^\d+(\.\d+)?$/; // Matches integers and floats
    return floatRegex.test(number);
  };

  const isOffsetValid = (offset: string) => {
    const offsetRegex = /^[+-]?\d+$/;
    return offsetRegex.test(offset);
  };

  // Handle form submission
  const handleFormSubmit = () => {
    if (
      !formData.title ||
      !formData.assignProduct ||
      !formData.location ||
      !formData.unitWeight ||
      !formData.minItemsCount ||
      !formData.minBatteryPercentage ||
      !formData.minBatteryVoltage ||
      !formData.category ||
      !formData.status ||
      (UserType === "SuperAdmin" && !formData.companyId)
    ) {
      notify("Fill all required field before click Save button.", "error");
      return;
    }

    if (!isFloatNumberValid(formData.unitWeight)) {
      notify("Please enter valid unit weight!", "error");
      return;
    }

    if (!isNumberValid(formData.minItemsCount)) {
      notify("Please enter a valid Minimum Items Count!", "error");
      return;
    }
    if (
      formData.minBatteryPercentage &&
      !isNumberValid(formData.minBatteryPercentage)
    ) {
      notify("Please enter a valid Minimum Battery Percentage!", "error");
      return;
    }
    if (
      formData.minBatteryVoltage &&
      !isFloatNumberValid(formData.minBatteryVoltage)
    ) {
      notify("Please enter a valid Minimum Battery Voltage!", "error");
      return;
    }
    if (formData.offSet && !isOffsetValid(formData.offSet)) {
      notify("Please enter a valid Off Set!", "error");
      return;
    }
    if (
      formData.calibrationValue &&
      !isFloatNumberValid(formData.calibrationValue)
    ) {
      notify("Please enter a valid Calibration Value!", "error");
      return;
    }
    Swal.fire({
      title: "",
      text: "Are you sure you want to Create New Device?",
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
        CreateDevice();
      }
    });
  };

  const ImageUpload = async () => {
    if (formData.image === null) {
      return null;
    }
    const data = {
      file: formData.image,
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

  const CreateDevice = async () => {
    try {
      const ImageUrl = await ImageUpload();
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().split(" ")[0];
      const key = uuidv4();

      const data = {
        title: formData.title,
        category: formData.category,
        assignProduct: formData.assignProduct,
        location: formData.location,
        unitWeight: `${formData.unitWeight} ${formData.unitWeightUnit}`,
        minItems: formData.minItemsCount,
        minBatteryPercentage: formData.minBatteryPercentage,
        minBatteryVoltage: formData.minBatteryVoltage,
        offSet: formData.offSet,
        calibrationValue: formData.calibrationValue,
        companyId: UserType === "SuperAdmin" ? formData.companyId : CompanyId,
        status: formData.status,
        imageUrl:
          ImageUrl !== null
            ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
            : null,
        poNumber: formData.poNumber,
        description: formData.description,
        message: formData.message,
        key: key,
        dateCreated: date,
        timeCreated: time,
        dateUpdated: date,
        timeUpdated: time,
      };
      console.log("Data: ", data);
      const response = await axios.post(`${baseUrl}/device/create`, data, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      if (response.data.status) {
        Swal.fire({
          title: "",
          text: "New Device Created Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        FetchAllData();
        setIsFormOpen(false);
        ClearData();
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const ClearData = () => {
    setFormData({
      title: "",
      category: "",
      image: null,
      assignProduct: "",
      location: "",
      unitWeight: "",
      unitWeightUnit: "mg",
      minItemsCount: "",
      minBatteryPercentage: "",
      minBatteryVoltage: "",
      offSet: "",
      calibrationValue: "",
      companyId: "",
      poNumber: "",
      status: "Active",
      description: "",
      message: "",
      key: "",
    });
  };

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

  // Define columns for DataTable
  const columns: GridColDef[] = [
    ...(UserType !== "Customer"
      ? [
          {
            field: "_id",
            headerName: "Device Id",
            minWidth: 250,
            renderCell: (params: any) => (
              <span className="truncate max-w-[180px] block">
                {params.value}
              </span>
            ),
          },
        ]
      : []),
    {
      field: "imageTitle",
      headerName: "Device",
      minWidth: 250,
      renderCell: (params: any) => {
        return (
          <div className="flex items-center w-full h-full space-x-3">
            <img
              className="w-[40px] h-[40px] object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              src={
                params.row.imageUrl ? params.row.imageUrl : Images.unknownDevice
              }
              alt="Device Image"
              onClick={() =>
                handleImageClick(
                  params.row.imageUrl || Images.unknownDevice,
                  `${params.row.title} Device`
                )
              }
            />
            <span className="font-bold">{params.row.title}</span>
          </div>
        );
      },
    },
    {
      field: "assignProduct",
      headerName: "Product",
      minWidth: 200,
      renderCell: (params: any) => (
        <span className="truncate max-w-[180px] block text-gray-700">
          {params.value || "N/A"}
        </span>
      ),
    },
    {
      field: "location",
      headerName: "Location",
      minWidth: 200,
      renderCell: (params: any) => (
        <span className="truncate max-w-[180px] block text-gray-700">
          {params.value}
        </span>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      minWidth: 150,
      align: "center" as GridAlignment,
      renderCell: (params: any) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-center min-w-[32px]">
          {params.value}
        </span>
      ),
    },
    ...(UserType !== "Customer"
      ? [
          {
            field: "unitWeight",
            headerName: "Unit Weight",
            minWidth: 150,
            align: "center" as GridAlignment,
            renderCell: (params: any) => (
              <span className="font-mono text-gray-800 font-semibold">
                {params.value}
              </span>
            ),
          },
        ]
      : []),
    {
      field: "minItems",
      headerName: "Critical Level",
      minWidth: 150,
      align: "center" as GridAlignment,
      renderCell: (params: any) => (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-bold text-center min-w-[32px]">
          {params.value}
        </span>
      ),
    },
    ...(UserType !== "Customer"
      ? [
          {
            field: "offSet",
            headerName: "Offset",
            minWidth: 165,
            align: "center" as GridAlignment,
            renderCell: (params: any) => (
              <span className="font-mono text-gray-800">{params.value}</span>
            ),
          },
          {
            field: "calibrationValue",
            headerName: "Calibration Value",
            minWidth: 165,
            align: "center" as GridAlignment,
            renderCell: (params: any) => (
              <span className="font-mono text-gray-800 font-semibold">
                {params.value}
              </span>
            ),
          },
        ]
      : []),
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
      field: "poNumber",
      headerName: "PO Number",
      minWidth: 150,
      renderCell: (params: any) => (
        <span className="truncate max-w-[120px] block text-gray-600">
          {params.value || "N/A"}
        </span>
      ),
    },
    ...(UserType !== "Customer"
      ? [
          {
            field: "status",
            headerName: "Active Status",
            minWidth: 150,
            align: "center" as GridAlignment,
            renderCell: (params: any) => {
              const isActive = params.row.status === "Active";
              return (
                <div className="flex items-center justify-center w-full h-full">
                  <button
                    onClick={() =>
                      HandleStatus(
                        params.row._id,
                        isActive ? "Inactive" : "Active"
                      )
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
        ]
      : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-10 lg:justify-start">
        <PageHeader title="XORDERS Devices" subTitle="" />
        {(UserType === "SuperAdmin" || UserType === "Admin") && !isLoading && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-orange-400 px-4 text-[12px] py-3 rounded-md hover:bg-orange-300 duration-300 transition-colors"
          >
            Add New Device
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
          {deviceData.length > 0 ? (
            <div className="min-h-[100vh] mt-5 overflow-y-auto">
              <DataTable
                slug="device"
                columns={columns}
                rows={deviceData}
                statusChange={HandleStatus}
                fetchData={FetchAllData}
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-gray-900 bg-opacity-75">
          <div className="w-full p-6 text-black lg:max-[90vh] md:max-h-[85vh] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg lg:w-2/3">
            <h2 className="mb-6 text-2xl font-semibold text-center">
              Add New Device
            </h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="title"
                  className="w-full font-semibold text-[13px]  "
                >
                  Title <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Title"
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {/* Assigned Product */}
              <div>
                <label
                  htmlFor="asignProduct"
                  className="w-full font-semibold text-[13px]"
                >
                  Assigned Product{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="assignProduct"
                  onChange={(e) =>
                    setFormData({ ...formData, assignProduct: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                >
                  <option value="None">None</option>
                  {products.length > 0 &&
                    products?.map((p, index) => (
                      <option key={index} value={p.productName}>
                        {p.productName}
                      </option>
                    ))}
                </select>
              </div>
              {/* Location */}
              <div>
                <label
                  htmlFor="location"
                  className="w-full font-semibold text-[13px]"
                >
                  Location{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="location"
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                >
                  <option value="None">None</option>
                  {locations?.length > 0 &&
                    locations.map((l, index) => (
                      <option key={index} value={l.location}>
                        {l.location}
                      </option>
                    ))}
                </select>
              </div>
              {/* Unit weight */}
              <div>
                <label
                  htmlFor="unitWeight"
                  className="w-full font-semibold text-[13px]"
                >
                  Unit Weight{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <div className="flex gap-2">
                  <input
                    id="unitweight"
                    name="unitWeight"
                    placeholder="Unit Weight"
                    onChange={(e) =>
                      setFormData({ ...formData, unitWeight: e.target.value })
                    }
                    className="w-[60%] p-2 mt-2 text-[12px] border rounded-md"
                  />
                  <select
                    name="unitWeightUnit"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitWeightUnit: e.target.value,
                      })
                    }
                    className="p-2 w-[40%] mt-2 text-[12px] border rounded-md"
                  >
                    <option value="mg">Milligram (mg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="t">Metric ton (t)</option>
                    <option value="lb">Pound (lb)</option>
                    <option value="mL">Milliliter (mL)</option>
                    <option value="cL">Centiliter (cL)</option>
                    <option value="dL">Deciliter (dL)</option>
                    <option value="L">Liter (L)</option>
                    <option value="m³">Cubic meter (m³)</option>
                  </select>
                </div>
              </div>
              {/* Minimum Item count */}
              <div>
                <label
                  htmlFor="minItems"
                  className="w-full font-semibold text-[13px]"
                >
                  Critical Level{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <input
                  id="minItems"
                  name="minItems"
                  placeholder="Critical Level"
                  onChange={(e) =>
                    setFormData({ ...formData, minItemsCount: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {/* Maximum Battery Percentage */}
              <div>
                <label
                  htmlFor="minBattery"
                  className="w-full font-semibold text-[13px]"
                >
                  Minimum Battery Percentage &#40;%&#41;{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>{" "}
                </label>
                <input
                  id="minBattery"
                  name="minBattery"
                  placeholder="Minimum Battery Percentage (%)"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minBatteryPercentage: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {/* Maximum Battery Volatage */}
              <div>
                <label
                  htmlFor="minVoltage"
                  className="w-full font-semibold text-[13px]"
                >
                  Minimum Battery Voltage &#40;V&#41;{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <input
                  id="minVoltage"
                  name="minVoltage"
                  placeholder="Minimum Battery Voltage (V)"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minBatteryVoltage: e.target.value,
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
                  Select Device Status{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="status"
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="">
                <label
                  htmlFor="image"
                  className="w-full font-semibold text-[13px]"
                >
                  Category{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="category"
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                >
                  <option value="None">None</option>
                  {categories.length > 0 &&
                    categories?.map((c, index) => (
                      <option key={index} value={c.category}>
                        {c.category}
                      </option>
                    ))}
                </select>
              </div>
              {/* Image Upload */}
              <div>
                <label
                  htmlFor="image"
                  className="w-full font-semibold text-[13px]"
                >
                  Upload Image
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  onChange={HandleFileChange}
                />
              </div>
              {/* Off Set */}
              <div>
                <label
                  htmlFor="offSet"
                  className="w-full font-semibold text-[13px]"
                >
                  Offset
                </label>
                <input
                  id="offSet"
                  name="OffSet"
                  placeholder="Offset"
                  onChange={(e) =>
                    setFormData({ ...formData, offSet: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {/* Calibration Value */}
              <div>
                <label
                  htmlFor="calibrationValue"
                  className="w-full font-semibold text-[13px]"
                >
                  Calibration Value
                </label>
                <input
                  id="calibrationValue"
                  name="calibrationValue"
                  placeholder="Calibration Value"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      calibrationValue: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {/* PO Number */}
              <div>
                <label
                  htmlFor="poNumber"
                  className="w-full font-semibold text-[13px]"
                >
                  PO Number
                </label>
                <input
                  id="poNumber"
                  name="poNumber"
                  placeholder="PO Number"
                  onChange={(e) =>
                    setFormData({ ...formData, poNumber: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
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
                      setFormData({ ...formData, companyId: e.target.value })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  >
                    <option value="">Select Company</option>
                    {companies?.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Description */}
              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="w-full font-semibold text-[13px]"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description"
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {/* Description */}
              <div className="md:col-span-2">
                <label
                  htmlFor="message"
                  className="w-full font-semibold text-[13px]"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Message"
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              <div className="flex justify-center gap-3 lg:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFormSubmit}
                  className="px-4 py-3 w-full text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal for Device Images */}
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
