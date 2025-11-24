import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/molecules";
import { useTheme } from "../../context/Theme/ThemeContext";
import {
  CircularProgressBar,
  Circle,
  LineChart,
  DataTable,
} from "../../components/molecules";
import { Images } from "../../constants";
import { GridColDef } from "@mui/x-data-grid";
import { IoMdClose } from "react-icons/io";
import Swal from "sweetalert2";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import axios from "axios";
import { useToast } from "../../context/Alert/AlertContext";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DownloadExcel from "../../helper/DownloadXcel";
import DownloadPDF from "../../helper/DownloadPDF";
import { FaFileExcel, FaFilePdf } from "./DeviceIcons";
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
  assignProduct: string;
  location: string;
  unitWeight: string;
  minItems: string;
  minBatteryPercentage: string;
  offSet: string;
  calibrationValue: string;
  status: string;
  minBatteryVoltage: string;
  imageUrl: string;
  companyId: string;
  companyName: string;
  poNumber: string;
  description: string;
  message: string;
  key: string;
  dateCreated: string;
  timeCreated: string;
  dateUpdated: string;
  timeUpdated: string;
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
  deviceId: string;
  deviceName: string;
  imageUrl: string;
  emailStatus: string;
  dateCreated: string;
  //timeCreated:string,
  dateUpdated: string;
  //timeUpdated:string,
};

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

// Line Chart Data Type Definition
type LineChartData = {
  dateCreated: string;
  timeCreated: string;
  totalWeight: number;
  batteryPercentage: number;
  batteryVoltage: number;
  itemCount: number;
  itemCountIncreaseBy: number;
  itemCountDecreaseBy: number;
};

const useQuery = () => new URLSearchParams(useLocation().search);

// ---------- Table Columns ----------
const columns: GridColDef[] = [
  {
    field: "image",
    headerName: "Image",
    width: 100,
    renderCell: (params: any) => {
      return (
        <div className="flex items-center justify-center w-full h-full space-x-3">
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
    field: "userId",
    type: "string",
    headerName: "User Id",
    width: 200,
  },
  {
    field: "userName",
    headerName: "User Name",
    width: 200,
  },
  {
    field: "emailStatus",
    type: "string",
    headerName: "Email Status",
    width: 100,
  },
];

type TimeRange =
  | "day"
  | "week"
  | "month"
  | "threeMonths"
  | "sixMonths"
  | "year";

const Device: React.FC = () => {
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
  const Token = savedUserData?.accessToken;
  const UserType = savedUserData?.userType;
  const UserId = savedUserData?.userId;
  const CompanyId = savedUserData?.companyId;
  const { theme, colors } = useTheme();
  const [selectedRange, setSelectedRange] = useState<TimeRange>("day");
  const [showEditDetails, setShowEditDetails] = useState<boolean>(false);
  const [isOpenForm, setIsOpenForm] = useState<boolean>(false);
  const [deviceData, setDeviceData] = useState<Device>({
    _id: "",
    title: "",
    category: "",
    assignProduct: "",
    location: "",
    unitWeight: "",
    minItems: "",
    minBatteryPercentage: "",
    offSet: "",
    calibrationValue: "",
    status: "",
    minBatteryVoltage: "",
    imageUrl: "",
    companyId: "",
    companyName: "",
    poNumber: "",
    description: "",
    message: "",
    key: "",
    dateCreated: "",
    timeCreated: "",
    dateUpdated: "",
    timeUpdated: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { baseUrl } = useBaseUrl();

  const [isOpen, setIsOpen] = useState(false);
  const { notify } = useToast();
  const navigate = useNavigate();
  const { deviceId } = useParams();
  const [newDevice, setNewDevice] = useState<{
    _id: string;
    title: string;
    category: string;
    assignProduct: string;
    location: string;
    unitWeight: string;
    unitWeightUnit: string;
    minItems: string;
    minBatteryPercentage: string;
    offSet: string;
    calibrationValue: string;
    status: string;
    minBatteryVoltage: string;
    imageUrl: string;
    poNumber: string;
    companyId: string;
    companyName?: string;
    description: string;
    message: string;
    key: string;
  }>({
    _id: "",
    title: "",
    category: "",
    assignProduct: "",
    unitWeight: "",
    unitWeightUnit: "",
    location: "",
    minItems: "",
    minBatteryPercentage: "",
    offSet: "",
    calibrationValue: "",
    status: "",
    minBatteryVoltage: "",
    imageUrl: "",
    companyId: "",
    companyName: "",
    poNumber: "",
    description: "",
    message: "",
    key: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<{
    userId: string;
    userName: string;
    image: File | null;
    emailStatus: string;
  }>({
    userId: "",
    userName: "",
    image: null,
    emailStatus: "",
  });
  const [deviceDetails, setDeviceDetails] = useState<{
    dateCreated: string;
    timeCreated: string;
    batteryVoltage: number;
    batteryPercentage: number;
    totalWeight: number;
    itemCount: number;
    itemCountIncreaseBy: number;
    itemCountDecreaseBy: number;
  }>({
    dateCreated: "",
    timeCreated: "",
    batteryPercentage: 0,
    batteryVoltage: 0,
    totalWeight: 0,
    itemCount: 0,
    itemCountIncreaseBy: 0,
    itemCountDecreaseBy: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [todayData, setTodayData] = useState<LineChartData[]>([]);
  const [weekData, setWeekData] = useState<LineChartData[]>([]);
  const [monthData, setMonthData] = useState<LineChartData[]>([]);
  const [threeMonthsData, setThreeMonthsData] = useState<LineChartData[]>([]);
  const [sixMonthsData, setSixMonthsData] = useState<LineChartData[]>([]);
  const [yearData, setYearData] = useState<LineChartData[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      if (UserType === "Admin" || UserType === "Moderator") {
        GetUsers();
      }
      GetRules();
      GetDevice();
      GetLineChartData();
      GetProducts();
      FetchDeviceDetails();
      GetLocations();
      GetCategories();
      if (UserType === "SuperAdmin") {
        GetCompanies();
      }
    }
  }, [Token]);

  // ---------------------- Users ----------------------
  const GetUsers = async () => {
    try {
      let userUrl = "";
      if (UserType === "Moderator") {
        userUrl = `${baseUrl}/users/all/company/${CompanyId}/nonadmin/moderator/${UserId}`;
      } else {
        userUrl = `${baseUrl}/users/all/company/${CompanyId}/nonadmin`;
      }
      const response = await axios.get(userUrl, {
        headers: { token: `Bearer ${Token}` },
      });

      if (response.data?.status) {
        setUsers(response.data.nonAdminUsers);
      } else {
        console.warn("Users API failed:", response.data);
        notify(
          response.data?.error?.message || "Failed to fetch users",
          "error"
        );
      }
    } catch (error: any) {
      console.error("GetUsers error:", error);
      notify(error?.response?.data?.error?.message || error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- Rules ----------------------
  const GetRules = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/rules/all/device/${deviceId}`,
        {
          headers: { token: `Bearer ${Token}`, usertype: UserType },
        }
      );

      if (response.data?.status) {
        setRules(response.data.rules);
      } else {
        console.warn("Rules API failed:", response.data);
        notify(
          response.data?.error?.message || "Failed to fetch rules",
          "error"
        );
      }
    } catch (error: any) {
      console.error("GetRules error:", error);
      notify(error?.response?.data?.error?.message || error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- Device ----------------------
  const GetDevice = async () => {
    try {
      const response = await axios.get(`${baseUrl}/device/one/${deviceId}`, {
        headers: { token: `Bearer ${Token}` },
      });

      if (response.data?.status) {
        const deviceData = response.data.device;
        const { numericUnitWeight, unitWeightUnit } = extractUnitWeight(
          deviceData.unitWeight
        );

        setDeviceData(deviceData);
        console.log("Device Data: ", deviceData);
        setNewDevice({
          _id: deviceData._id || "",
          title: deviceData.title || "",
          category: deviceData.category || "",
          assignProduct: deviceData.assignProduct || "",
          unitWeight: String(numericUnitWeight || ""),
          unitWeightUnit: unitWeightUnit || "",
          location: deviceData.location || "",
          minItems: deviceData.minItems || "",
          minBatteryPercentage: deviceData.minBatteryPercentage || "",
          offSet: deviceData.offSet || "",
          calibrationValue: deviceData.calibrationValue || "",
          status: deviceData.status || "",
          minBatteryVoltage: deviceData.minBatteryVoltage || "",
          imageUrl: deviceData.imageUrl || "",
          companyId: deviceData.companyId,
          companyName: deviceData.companyName || "",
          poNumber: deviceData.poNumber || "",
          description: deviceData.description || "",
          message: deviceData.message || "",
          key: deviceData.key || "",
        });
      } else {
        console.warn("Device API failed:", response.data);
        notify(
          response.data?.error?.message || "Failed to fetch device",
          "error"
        );
      }
    } catch (error: any) {
      console.error("GetDevice error:", error);
      notify(error?.response?.data?.error?.message || error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- Line Chart ----------------------
  const GetLineChartData = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/chart/line-chart/${deviceId}`,
        {
          headers: { token: `Bearer ${Token}` },
        }
      );

      if (response.data?.status) {
        setTodayData(response.data.data.today);
        setWeekData(response.data.data.thisWeek);
        setMonthData(response.data.data.thisMonth);
        setThreeMonthsData(response.data.data.lastThreeMonths);
        setSixMonthsData(response.data.data.lastSixMonths);
        setYearData(response.data.data.lastYear);
      } else {
        console.warn("Line Chart API failed:", response.data);
        notify(
          response.data?.error?.message || "Failed to fetch line chart",
          "error"
        );
      }
    } catch (error: any) {
      console.error("GetLineChartData error:", error);
      notify(error?.response?.data?.error?.message || error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- Products ----------------------
  const GetProducts = async () => {
    try {
      let productUrl = "";
      if (UserType === "SuperAdmin") {
        productUrl = `${baseUrl}/products/all`;
      } else if (UserType === "Admin") {
        productUrl = `${baseUrl}/products/company/${CompanyId}`;
      } else {
        return;
      }
      const response = await axios.get(productUrl, {
        headers: { token: `Bearer ${Token}` },
      });

      if (Array.isArray(response.data?.products)) {
        setProducts(response.data.products);
      } else {
        console.warn("Products API failed:", response.data);
        notify(
          response.data?.error?.message || "Failed to fetch products",
          "error"
        );
      }
    } catch (error: any) {
      console.error("GetProducts error:", error);
      notify(error?.response?.data?.error?.message || error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Function to extract numeric value and unit from unitWeight string
  const extractUnitWeight = (unitWeightString: string) => {
    let numericUnitWeight = "";
    let unitWeightUnit = "";

    if (unitWeightString) {
      const parts = unitWeightString.split(/\s+/);

      if (parts.length >= 2) {
        numericUnitWeight = parts[0].trim();
        unitWeightUnit = parts[1].trim();
      }
    }

    return { numericUnitWeight, unitWeightUnit };
  };

  // Function to fetch device details
  const FetchDeviceDetails = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/weighingdata/get-data/${deviceId}`,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );
      if (response.data.status) {
        if (response.data.data && response.data.data.length > 0) {
          const deviceDetail = response.data.data[0];
          console.log("Device data", deviceDetail);
          setDeviceDetails({
            dateCreated: deviceDetail.dateCreated,
            timeCreated: deviceDetail.timeCreated,
            batteryVoltage: Number(deviceDetail.batteryVoltage),
            batteryPercentage: Number(deviceDetail.batteryPercentage),
            itemCount: Number(deviceDetail.itemCount),
            totalWeight: Number(deviceDetail.totalWeight),
            itemCountIncreaseBy: Number(deviceDetail.itemCountIncreaseBy),
            itemCountDecreaseBy: Number(deviceDetail.itemCountDecreaseBy),
          });
        }
      } else {
        notify(response.data.error.message, "error");
      }
    } catch (error: any) {
      console.log(error);
      //notify(error.response.data.error.message, "error");
    }
  };

  // Function to get all categories
  const GetCategories = async () => {
    try {
      let categoryUrl = "";
      if (UserType === "SuperAdmin") {
        categoryUrl = `${baseUrl}/categories/all`;
      } else if (UserType === "Admin") {
        categoryUrl = `${baseUrl}/categories/company/${CompanyId}`;
      } else {
        return;
      }
      const response = await axios.get(categoryUrl, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
      if (response.data.status) {
        setCategories(response.data.categories);
      } else {
        notify(response.data.error.message, "error");
      }
    } catch (error: any) {
      console.log(error);
      //notify(error.response.data.error.message, "error");
    }
  };

  // Function to get all locations
  const GetLocations = async () => {
    let locationUrl = "";
    if (UserType === "SuperAdmin") {
      locationUrl = `${baseUrl}/locations/all`;
    } else if (UserType === "Admin") {
      locationUrl = `${baseUrl}/locations/company/${CompanyId}`;
    } else {
      return;
    }
    try {
      const response = await axios.get(locationUrl, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
      if (response.data.status) {
        setLocations(response.data.locations);
      } else {
        notify(response.data.error.message, "error");
      }
    } catch (error: any) {
      console.log(error);
      //notify(error.response.data.error.message, "error");
    }
  };

  // Function to get all companies
  const GetCompanies = async () => {
    try {
      const response = await axios.get(`${baseUrl}/companies/all`, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
      if (response.data.status) {
        setCompanies(response.data.companies);
      } else {
        notify(response.data.error.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchData = async () => {
    await Promise.allSettled([
      GetUsers(),
      GetRules(),
      GetDevice(),
      GetLineChartData(),
      GetProducts(),
    ]);
  };

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  // Handle time range change
  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRange(e.target.value as TimeRange);
  };

  // Handle file input change for image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const isNumberValid = (number: string) => {
    const numberRegex = /^\d+$/;
    return numberRegex.test(number);
  };

  const isFloatNumberValid = (number: string) => {
    const floatRegex = /^\d+(\.\d+)?$/; // Matches integers and floats
    return floatRegex.test(number);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (
      !newDevice.title ||
      !newDevice.assignProduct ||
      !newDevice.location ||
      !newDevice.unitWeight ||
      !newDevice.minItems ||
      !newDevice.minBatteryPercentage ||
      !newDevice.minBatteryVoltage ||
      !newDevice.category ||
      !newDevice.status
    ) {
      notify("Fill all required field before click Save button.", "error");
      return;
    }
    if (newDevice.unitWeight && !isFloatNumberValid(newDevice.unitWeight)) {
      notify("Please enter valid unit weight!", "error");
      return;
    }
    if (newDevice.minItems && !isNumberValid(newDevice.minItems)) {
      notify("Please enter valid minimum items count!", "error");
      return;
    }
    if (
      newDevice.minBatteryPercentage &&
      !isNumberValid(newDevice.minBatteryPercentage)
    ) {
      notify("Please enter valid minimum battery percentage!", "error");
      return;
    }
    if (
      newDevice.minBatteryVoltage &&
      !isFloatNumberValid(newDevice.minBatteryVoltage)
    ) {
      notify("Please enter valid minimum battery voltage!", "error");
      return;
    }
    Swal.fire({
      title: "",
      text: "Are you sure to update device?",
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
        UpdateDevice();
      }
    });
  };

  const Icons = {
    voltageMeter:
      "https://img.icons8.com/?size=100&id=1737&format=png&color=000000",
    battery:
      "https://img.icons8.com/?size=100&id=78183&format=png&color=000000",
    itemCount:
      "https://img.icons8.com/?size=100&id=89779&format=png&color=000000",
    totalWeight:
      "https://img.icons8.com/?size=100&id=18699&format=png&color=000000",
  };

  const statusChange = () => {};

  const handleSubmitCreate = () => {
    if (!newRule.userName) {
      notify("Choose User before click save button", "warning");
      return;
    }
    if (!newRule.emailStatus) {
      notify("Choose Email Status before click save button", "warning");
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
      //notify(error.response.data.error.message, "error");
    }
  };

  const ImageUpload = async () => {
    if (imageFile === null) {
      return null;
    }
    if (newDevice.imageUrl !== null) {
      await DeleteImage(newDevice.imageUrl);
    }
    const data = {
      file: imageFile,
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

  const UpdateDevice = async () => {
    const ImageUrl = await ImageUpload();
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    const data = {
      title: newDevice.title,
      category: newDevice.category,
      assignProduct: newDevice.assignProduct,
      location: newDevice.location,
      unitWeight: `${newDevice.unitWeight} ${newDevice.unitWeightUnit}`,
      minItems: newDevice.minItems,
      minBatteryPercentage: newDevice.minBatteryPercentage,
      offSet: newDevice.offSet,
      calibrationValue: newDevice.calibrationValue,
      status: newDevice.status,
      minBatteryVoltage: newDevice.minBatteryVoltage,
      imageUrl:
        ImageUrl !== null
          ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
          : newDevice.imageUrl,
      companyId: newDevice.companyId ? newDevice.companyId : CompanyId,
      poNumber: newDevice.poNumber,
      description: newDevice.description,
      message: newDevice.message,
      key: newDevice.key,
      dateUpdated: date,
      timeUpdated: time,
    };

    console.log("Update Device Data", data);

    try {
      const response = await axios.put(
        `${baseUrl}/device/update/${newDevice._id}`,
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
          text: "Device Update Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        GetUsers();
        GetRules();
        GetDevice();
        GetLineChartData();
        GetProducts();
        FetchDeviceDetails();
        setShowEditDetails(false);
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
      deviceId: deviceId,
      deviceName: deviceData.title,
      imageUrl:
        ImageUrl !== null
          ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
          : null,
      userId: newRule.userId,
      userName: newRule.userName,
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
        GetUsers();
        GetRules();
        GetDevice();
        GetLineChartData();
        GetProducts();
        setIsOpenForm(false);
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  // ---------- Function to handel delete all button ----------
  const handelDeleteAllButton = () => {
    Swal.fire({
      title: "",
      text: "Are you sure to delete all device data?",
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
        deleteDeviceData();
      }
    });
  };

  // ---------- Function to delete all device data ----------
  const deleteDeviceData = async () => {
    try {
      const response = await axios.delete(
        `${baseUrl}/weighingdata/delete-device/${deviceData._id}`,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (response.data.status) {
        Swal.fire({
          title: "",
          text: "Data delete successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        GetUsers();
        GetRules();
        GetDevice();
        GetLineChartData();
        GetProducts();
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  // ---------- Function to current details as excel ----------
  const downloadCurrentDetailsAsExcel = async () => {
    // Extract the unit from unitWeight
    const unit = deviceData.unitWeight.split(" ")[1];

    const data = {
      id: deviceData._id,
      title: deviceData.title,
      category: deviceData.category,
      assignProduct: deviceData.assignProduct,
      location: deviceData.location,
      unitWeight: deviceData.unitWeight,
      minItems: deviceData.minItems,
      batteryPercentage: deviceDetails.batteryPercentage,
      batteryVoltage: deviceDetails.batteryVoltage,
      totalWeight: `${deviceDetails.totalWeight} ${unit}`,
      itemCount: deviceDetails.itemCount,
      itemCountIncreaseBy: deviceDetails.itemCountIncreaseBy,
      itemCountDecreaseBy: deviceDetails.itemCountDecreaseBy,
      status: deviceData.status,
      poNumber: deviceData.poNumber,
      dateCreated: deviceDetails.dateCreated,
      timeCreated: deviceDetails.timeCreated,
    };

    const type = "device_data";
    const url = `${baseUrl}/excel/${type}`;

    await DownloadExcel({ data, type, url });
  };

  // ---------- Function to current details as excel ----------
  const downloadCurrentDetailsAsPDF = async () => {
    // Extract the unit from unitWeight
    const unit = deviceData.unitWeight.split(" ")[1];

    const data = [
      {
        id: deviceData._id,
        title: deviceData.title,
        category: deviceData.category,
        assignProduct: deviceData.assignProduct,
        location: deviceData.location,
        unitWeight: deviceData.unitWeight,
        minItems: deviceData.minItems,
        batteryPercentage: deviceDetails.batteryPercentage,
        batteryVoltage: deviceDetails.batteryVoltage,
        totalWeight: `${deviceDetails.totalWeight} ${unit}`,
        itemCount: deviceDetails.itemCount,
        itemCountIncreaseBy: deviceDetails.itemCountIncreaseBy,
        itemCountDecreaseBy: deviceDetails.itemCountDecreaseBy,
        status: deviceData.status,
        poNumber: deviceData.poNumber,
        dateCreated: deviceDetails.dateCreated,
        timeCreated: deviceDetails.timeCreated,
      },
    ];

    const type = "device_data";
    const url = `${baseUrl}/pdf/${type}`;

    await DownloadPDF({ data, type, url });
  };

  // ---------- Download Excel File ----------
  const downloadExcelFile = async () => {
    const dataSet =
      selectedRange === "day"
        ? todayData
        : selectedRange === "week"
        ? weekData
        : selectedRange === "month"
        ? monthData
        : selectedRange === "threeMonths"
        ? threeMonthsData
        : selectedRange === "sixMonths"
        ? sixMonthsData
        : yearData;

    // Extract the unit from unitWeight
    const unit = deviceData.unitWeight.split(" ")[1];

    // Map over the selected data set to add title and deviceId
    const data = dataSet.map((entry) => ({
      ...entry,
      id: deviceData._id,
      title: deviceData.title,
      category: deviceData.category,
      assignProduct: deviceData.assignProduct,
      location: deviceData.location,
      unitWeight: deviceData.unitWeight,
      minItems: deviceData.minItems,
      status: deviceData.status,
      poNumber: deviceData.poNumber,
      totalWeight: `${entry.totalWeight} ${unit} `,
    }));

    const type =
      selectedRange == "day"
        ? "today_device_data"
        : selectedRange == "week"
        ? "last_week_device_data"
        : selectedRange == "month"
        ? "last_month_device_data"
        : selectedRange == "threeMonths"
        ? "last_three_months_device_data"
        : selectedRange == "sixMonths"
        ? "last_six_months_device_data"
        : "last_year_device_data";

    const url = `${baseUrl}/excel/${type}`;

    await DownloadExcel({ data, type, url });
  };

  // ---------- Function to download PDF file ----------
  const downloadPDFFile = async () => {
    const dataSet =
      selectedRange === "day"
        ? todayData
        : selectedRange === "week"
        ? weekData
        : selectedRange === "month"
        ? monthData
        : selectedRange === "threeMonths"
        ? threeMonthsData
        : selectedRange === "sixMonths"
        ? sixMonthsData
        : yearData;

    // Extract the unit from unitWeight
    const unit = deviceData.unitWeight.split(" ")[1];

    // Map over the selected data set to add title and deviceId
    const data = dataSet.map((entry) => ({
      ...entry,
      id: deviceData._id,
      title: deviceData.title,
      category: deviceData.category,
      assignProduct: deviceData.assignProduct,
      location: deviceData.location,
      unitWeight: deviceData.unitWeight,
      minItems: deviceData.minItems,
      status: deviceData.status,
      poNumber: deviceData.poNumber,
      totalWeight: `${entry.totalWeight} ${unit} `,
    }));

    const type =
      selectedRange == "day"
        ? "today_device_data"
        : selectedRange == "week"
        ? "last_week_device_data"
        : selectedRange == "month"
        ? "last_month_device_data"
        : selectedRange == "threeMonths"
        ? "last_three_months_device_data"
        : selectedRange == "sixMonths"
        ? "last_six_months_device_data"
        : "last_year_device_data";

    const url = `${baseUrl}/pdf/${type}`;

    await DownloadPDF({ data, type, url });
  };

  console.log("Device Data", deviceData);
  console.log("Products", products);

  return (
    <div className="">
      {/* Page Header */}
      <PageHeader title="Device" subTitle="This is the Device Details Page." />
      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : (
        <div
          className={`overflow-y-auto w-full mt-5 p-6 rounded-lg ${
            theme === "dark" ? "bg-white" : "bg-gray-200"
          }`}
        >
          <div className={`grid gap-6 lg:grid-cols-3 min-h-[100vh] w-full`}>
            {/* Device Details Section */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="flex flex-col items-center justify-start w-full gap-5 lg:items-start lg:flex-row lg:col-span-3">
                  <img
                    src={
                      deviceData.imageUrl === "" || deviceData.imageUrl === null
                        ? Images.unknownDevice
                        : deviceData.imageUrl
                    }
                    alt={deviceData.title}
                    onClick={togglePopup}
                    className="object-cover w-[25%] cursor-pointer h-auto p-8 mb-4 rounded-lg bg-slate-300"
                  />
                  <div>
                    <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                      {deviceData.title}
                    </h2>
                    <p className="mb-2 text-lg italic font-semibold text-gray-800 max-w-full break-words">
                      {deviceData.description}
                    </p>
                    {(UserType === "Admin" ||
                      UserType === "Moderator" ||
                      UserType === "SuperAdmin") && (
                      <p className="text-gray-600">
                        <strong>Id:</strong>{" "}
                        {deviceData._id ? deviceData._id : "None"}
                      </p>
                    )}
                    {UserType === "SuperAdmin" && (
                      <p className="text-gray-600">
                        <strong>Company:</strong>{" "}
                        {deviceData.companyName
                          ? deviceData.companyName
                          : "None"}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <strong>Assigned Product:</strong>{" "}
                      {deviceData.assignProduct
                        ? deviceData.assignProduct
                        : "None"}
                    </p>
                    <p className="text-gray-600">
                      <strong>Location:</strong>{" "}
                      {deviceData.location ? deviceData.location : "None"}
                    </p>
                    <p className="text-gray-600">
                      <strong>Unit Weight:</strong> {deviceData.unitWeight}
                    </p>
                    <p className="text-gray-600">
                      <strong>Critical Level:</strong>{" "}
                      {deviceData.minItems ? deviceData.minItems : "0"}
                    </p>
                    {UserType !== "Customer" && (
                      <p className="text-gray-600">
                        <strong>Minimum Battery Percentage:</strong>{" "}
                        {deviceData.minBatteryPercentage
                          ? deviceData.minBatteryPercentage.includes("%")
                            ? deviceData.minBatteryPercentage
                            : `${deviceData.minBatteryPercentage}%`
                          : "0%"}
                      </p>
                    )}
                    {UserType !== "Customer" && (
                      <p className="text-gray-600">
                        <strong>Minimum Battery Voltage:</strong>{" "}
                        {deviceData.minBatteryVoltage
                          ? `${deviceData.minBatteryVoltage.replace(
                              /v/g,
                              "V"
                            )}V`
                          : "0V"}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <strong>Category:</strong>{" "}
                      {deviceData.category ? deviceData.category : "None"}
                    </p>
                    {UserType !== "Customer" && (
                      <p className="text-gray-600">
                        <strong>Offset:</strong>{" "}
                        {deviceData.offSet ? deviceData.offSet : "None"}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <strong>Calibration Value:</strong>{" "}
                      {deviceData.calibrationValue
                        ? deviceData.calibrationValue
                        : "None"}
                    </p>
                    <p className="text-gray-600">
                      <strong>Active Status:</strong>{" "}
                      {deviceData.status ? deviceData.status : "None"}
                    </p>
                    <p className="text-gray-600">
                      <strong>PO Number:</strong>{" "}
                      {deviceData.poNumber ? deviceData.poNumber : "None"}
                    </p>
                    <p className="text-gray-600 max-w-full break-words">
                      <strong>Message:</strong>{" "}
                      {deviceData.message ? deviceData.message : "None"}
                    </p>
                    {UserType !== "Customer" && (
                      <>
                        <p className="text-gray-600">
                          <strong>Created On:</strong> {deviceData.dateCreated}{" "}
                          at {deviceData.timeCreated}
                        </p>
                        <p className="text-gray-600">
                          <strong>Last Updated:</strong>{" "}
                          {deviceData.dateUpdated} at {deviceData.timeUpdated}
                        </p>
                      </>
                    )}
                    {UserType === "Admin" && (
                      <p className="text-gray-600">
                        <strong>PCB Key:</strong> {deviceData.key}
                      </p>
                    )}
                    <div className="flex items-center justify-start gap-8">
                      {UserType !== "Customer" && (
                        <button
                          className="w-full px-4 py-3 mt-5 transition-colors duration-300 text-[12px] bg-green-300 rounded-md lg:w-auto hover:bg-green-200"
                          onClick={() => setShowEditDetails(true)}
                        >
                          Edit Details
                        </button>
                      )}
                      <button
                        onClick={downloadCurrentDetailsAsExcel}
                        className="w-full px-4 py-3 mt-5 transition-colors text-[12px] duration-300 bg-green-600 rounded-md lg:w-auto hover:bg-green-700 flex items-center justify-center gap-3 text-white"
                      >
                        <FaFileExcel size={20} />
                        Download Current Excel
                      </button>
                      <button
                        onClick={downloadCurrentDetailsAsPDF}
                        className="w-full px-4 py-3 mt-5 transition-colors text-[12px] duration-300 bg-red-600 rounded-md lg:w-auto hover:bg-red-700 flex items-center justify-center gap-3 text-white"
                      >
                        <FaFilePdf size={20} />
                        Download Current PDF
                      </button>
                      {UserType === "Admin" && (
                        <button
                          onClick={handelDeleteAllButton}
                          className="w-full px-4 py-3 mt-5 transition-colors text-[12px] duration-300 bg-red-300 rounded-md lg:w-auto hover:bg-red-200"
                        >
                          Reset Data
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy key */}
              {/* {UserType === "Admin" && deviceData.key &&  (
            <div className="flex flex-col items-start gap-5 mt-5 text-gray-600 lg:flex-row lg:items-center"> */}
              {/* Display Key */}
              {/* <p className="text-center lg:flex lg:items-center lg:justify-center lg:text-left">
                <strong>Key:&nbsp;&nbsp;</strong>  {deviceData.key ? deviceData.key : "None"}
              </p> */}

              {/* Copy Button */}
              {/* {deviceData.key && (
                <button
                  className="px-4 py-3 w-full lg:w-auto text-white text-[12px] bg-blue-500 rounded-md hover:bg-blue-700"
                  onClick={() => {
                    navigator.clipboard.writeText(deviceData.key);
                    notify("Key copied to clipboard!", "success");
                  }}
                >
                  Copy Key
                </button>
              )}
            </div>
          )} */}
              {/* Circular Progress Bars */}
              {deviceDetails && (
                <div className="flex flex-col items-center justify-center w-full gap-5 mt-6 mb-6 md:grid md:grid-cols-2 xl:grid-cols-4">
                  {deviceDetails && (
                    <div className="flex items-center justify-center w-full h-full">
                      {/* Item Count */}
                      <CircularProgressBar
                        CurrentValue={
                          deviceDetails.itemCount !== 0
                            ? deviceDetails.itemCount
                            : 0
                        }
                        StartValue={0}
                        EndValue={
                          deviceDetails.itemCount > 100
                            ? deviceDetails.itemCount
                            : 100
                        }
                        LowValue={Number(deviceData.minItems)}
                        Units=""
                        InnerColor="#f78f5e"
                        TextColor="#000000"
                        Icon={Icons.itemCount}
                        Title="Quantity"
                      />
                    </div>
                  )}
                  {/* Battery Percentage */}
                  {deviceDetails && (
                    <div className="flex items-center justify-center w-full h-full">
                      <CircularProgressBar
                        CurrentValue={
                          deviceDetails.batteryPercentage !== 0
                            ? deviceDetails.batteryPercentage
                            : 0
                        }
                        StartValue={0}
                        EndValue={100}
                        LowValue={Number(deviceData.minBatteryPercentage)}
                        Units="%"
                        InnerColor="#5e99f7"
                        TextColor="#000000"
                        Icon={Icons.battery}
                        Title="Battery Percentage"
                      />
                    </div>
                  )}
                  {deviceDetails && UserType !== "Customer" && (
                    <div className="flex items-center justify-center w-full h-full">
                      {/* Battery Voltage */}
                      <CircularProgressBar
                        CurrentValue={
                          deviceDetails.batteryVoltage !== 0
                            ? deviceDetails.batteryVoltage
                            : 0
                        }
                        StartValue={0}
                        EndValue={
                          deviceDetails.batteryVoltage > 100
                            ? deviceDetails.batteryVoltage
                            : 100
                        }
                        LowValue={Number(deviceData.minBatteryVoltage)}
                        Units="V"
                        InnerColor="#b583f2"
                        TextColor="#000000"
                        Icon={Icons.voltageMeter}
                        Title="Battery Voltage"
                      />
                    </div>
                  )}
                  {deviceDetails && UserType !== "Customer" && (
                    <div className="flex items-center justify-center w-full h-full">
                      {/* Total Weight */}
                      <Circle
                        title="Total Weight"
                        value={`${
                          deviceDetails.totalWeight !== 0
                            ? deviceDetails.totalWeight
                            : 0
                        } ${newDevice.unitWeightUnit}`}
                        unVal={String(
                          deviceDetails.totalWeight !== 0
                            ? deviceDetails.totalWeight
                            : 0
                        )}
                        bgColor="#f0f75e"
                        icon={Icons.totalWeight}
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Line Chart */}
              <div className="mt-6">
                <div className="flex items-center justify-start gap-8 lg:pl-10">
                  <div className="mb-4">
                    <select
                      value={selectedRange}
                      onChange={handleRangeChange}
                      className="px-4 py-3 bg-gray-200 rounded-md text-[12px] lg:min-w-[100px] w-full"
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="threeMonths">3 Months</option>
                      <option value="sixMonths">6 Months</option>
                      <option value="year">1 Year</option>
                    </select>
                  </div>
                  {/* Download Excel Button */}
                  <div className="mb-4">
                    <button
                      onClick={downloadExcelFile}
                      className="px-4 py-3 text-[12px] w-full md:w-auto bg-green-600 hover:bg-green-700 flex items-center justify-center gap-3 rounded-md text-white duration-300 transition-colors"
                    >
                      <FaFileExcel size={20} />
                      Download Excel
                    </button>
                  </div>

                  {/* Download PDF Button */}
                  <div className="mb-4">
                    <button
                      onClick={downloadPDFFile}
                      className="px-4 py-3 text-[12px] w-full md:w-auto bg-red-600 hover:bg-red-700 flex items-center justify-center gap-3 rounded-md text-white duration-300 transition-colors"
                    >
                      <FaFilePdf size={20} />
                      Download PDF
                    </button>
                  </div>
                </div>
                <LineChart
                  data={
                    selectedRange === "day"
                      ? todayData
                      : selectedRange == "week"
                      ? weekData
                      : selectedRange == "month"
                      ? monthData
                      : selectedRange == "threeMonths"
                      ? threeMonthsData
                      : selectedRange == "sixMonths"
                      ? sixMonthsData
                      : yearData
                  }
                />
              </div>
            </div>
          </div>
          {/* Table Data */}
          {UserType !== "Customer" && (
            <div className="col-span-1 lg:col-span-3">
              <div className="flex flex-col items-center justify-center gap-4 p-2 md:items-start lg:justify-start">
                {UserType === "Admin" || UserType === "Moderator" ? (
                  <button
                    className="bg-orange-400 px-4 py-3 w-full md:w-auto rounded-lg text-[12px] hover:bg-orange-300 duration-300 transition-colors"
                    onClick={() => setIsOpenForm(true)}
                  >
                    Create New Rule
                  </button>
                ) : null}

                <div className="min-h-[50vh] mt-3 w-full overflow-y-auto overflow-x-auto">
                  <DataTable
                    slug="rules"
                    columns={columns}
                    rows={rules}
                    statusChange={statusChange}
                    fetchData={fetchData}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Modal for Editing Details */}
      {showEditDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center h-full p-4 bg-black bg-opacity-50">
          <div className="w-full p-6 text-black lg:max-[90vh] md:max-h-[85vh] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg lg:w-2/3">
            <h2 className="mb-4 text-lg font-bold text-center text-black">
              Edit Device Details
            </h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Title */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
                <div>
                  <label
                    htmlFor="title"
                    className="w-full font-semibold text-[13px]"
                  >
                    Title{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    placeholder="Title"
                    value={newDevice.title}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, title: e.target.value })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}
              {/* Assigned Product */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
                <div>
                  <label
                    htmlFor="assignProduct"
                    className="w-full font-semibold text-[13px]"
                  >
                    Assigned Product{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <select
                    id="assignProduct"
                    name="assignProduct"
                    value={newDevice.assignProduct}
                    onChange={(e) =>
                      setNewDevice({
                        ...newDevice,
                        assignProduct: e.target.value,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  >
                    <option value="None">None</option>
                    {products.length > 0 &&
                      products.map((p, index) => (
                        <option key={index} value={p.productName}>
                          {p.productName}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Location */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
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
                      setNewDevice({ ...newDevice, location: e.target.value })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    value={newDevice.location}
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
              )}

              {/* Unit weight */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
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
                      value={newDevice.unitWeight}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          unitWeight: e.target.value,
                        })
                      }
                      className="w-[60%] p-2 mt-2 text-[12px] border rounded-md"
                    />
                    <select
                      name="unitWeightUnit"
                      value={newDevice.unitWeightUnit}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          unitWeightUnit: e.target.value,
                        })
                      }
                      className="p-2 w-[40%] mt-2 text-[12px] border rounded-md"
                    >
                      <option value="mg">Milligram (mg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="t">Metric ton (t)</option>
                      <option value="lg">Pound (lb)</option>
                      <option value="mL">Milliliter (mL)</option>
                      <option value="cL">Centiliter (cL)</option>
                      <option value="dL">Deciliter (dL)</option>
                      <option value="L">Liter (L)</option>
                      <option value="m³">Cubic meter (m³)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Minimum count */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
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
                    value={newDevice.minItems}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, minItems: e.target.value })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}
              {/* Minimum Battery Percentage */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
                <div>
                  <label
                    htmlFor="minBatteryPercentage"
                    className="w-full font-semibold text-[13px]"
                  >
                    Minimum Battery Percentage &#40;%&#41;{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <input
                    id="minBatteryPercentage"
                    name="minBatteryPercentage"
                    placeholder="Minimum Battrey Percentage (%)"
                    value={newDevice.minBatteryPercentage}
                    onChange={(e) =>
                      setNewDevice({
                        ...newDevice,
                        minBatteryPercentage: e.target.value,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}
              {/* Minimum Battery Voltage */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
                <div>
                  <label
                    htmlFor="minBatteryVoltage"
                    className="w-full font-semibold text-[13px]"
                  >
                    Minimum Battery Voltage &#40;V&#41;{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <input
                    id="minBatteryVoltage"
                    name="minBatteryVoltage"
                    placeholder="Minimum Battery Voltage (V)"
                    value={newDevice.minBatteryVoltage}
                    onChange={(e) =>
                      setNewDevice({
                        ...newDevice,
                        minBatteryVoltage: e.target.value,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}
              {/* Status */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
                <div className="">
                  <label
                    htmlFor="status"
                    className="w-full font-semibold text-[13px]"
                  >
                    Select Device Status{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <select
                    name="status"
                    value={newDevice.status}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, status: e.target.value })
                    }
                    className="w-full p-2 mt-2  text-[12px] border rounded-md"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              {/* PO Number */}
              <div
                className={`${UserType === "Moderator" ? "col-span-2" : ""}`}
              >
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
                  value={newDevice.poNumber}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, poNumber: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {/* Category */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
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
                    value={newDevice.category}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, category: e.target.value })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  >
                    <option value="None">None</option>
                    {categories?.length > 0 &&
                      categories.map((c, index) => (
                        <option key={index} value={c.category}>
                          {c.category}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {(UserType === "SuperAdmin" || UserType === "Admin") && (
                <div>
                  <label
                    htmlFor="offset"
                    className="w-full font-semibold text-[13px]"
                  >
                    Offset
                  </label>
                  <input
                    id="offset"
                    name="offset"
                    placeholder="Offset"
                    value={newDevice.offSet}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, offSet: e.target.value })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}

              {(UserType === "SuperAdmin" || UserType === "Admin") && (
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
                    value={newDevice.calibrationValue}
                    onChange={(e) =>
                      setNewDevice({
                        ...newDevice,
                        calibrationValue: e.target.value,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}

              {/* Company */}
              {UserType === "SuperAdmin" && (
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Company{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <select
                    name="companyId"
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, companyId: e.target.value })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    value={newDevice.companyId}
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
              {/* PCB Key */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
                <div className="lg:col-span-2">
                  <label
                    htmlFor="deviceKey"
                    className="w-full font-semibold text-[13px]"
                  >
                    PCB Key
                  </label>
                  <div className="flex flex-col justify-center w-full gap-3 lg:flex-row lg:items-center">
                    <input
                      type="text"
                      id="deviceKey"
                      name="key"
                      placeholder="PCB Key"
                      value={newDevice.key || ""}
                      readOnly
                      className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    />
                    <button
                      type="button"
                      className="px-4 py-2 mt-2 text-[12px] lg:w-[150px] text-black bg-orange-400 hover:bg-orange-300 transition-colors duration-300 rounded-lg"
                      onClick={() => {
                        const generatedKey = uuidv4();
                        setNewDevice((prev) => ({
                          ...prev,
                          key: generatedKey,
                        }));
                        notify("Key generated successfully!", "success");
                      }}
                    >
                      Generate Key
                    </button>
                  </div>
                </div>
              )}

              {/* Image Upload */}
              {(UserType === "SuperAdmin" || UserType === "Admin") && (
                <div className="lg:col-span-2">
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
                    onChange={handleImageChange}
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}

              {/* Description */}
              <div className="lg:col-span-2">
                <label
                  htmlFor="description"
                  className="w-full font-semibold text-[13px]"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Description"
                  value={newDevice.description}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, description: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {/* Message */}
              <div className="lg:col-span-2">
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
                  value={newDevice.message}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, message: e.target.value })
                  }
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              {/* Submit Button */}
              <button
                type="button"
                className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                onClick={() => setShowEditDetails(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-3 w-full text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {isOpenForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 mt-5 bg-black bg-opacity-50">
          <div className="w-full p-6 bg-white rounded-lg shadow-lg lg:w-2/3">
            <h2 className="mb-4 text-lg font-bold text-center text-black">
              Add New Rule
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="w-full font-semibold text-[13px]">
                  User Name
                </label>
                <select
                  name="status"
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                  value={newRule.userId}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      userId: e.target.value,
                      userName: e.target.selectedOptions[0].text,
                    })
                  }
                >
                  <option>None</option>
                  {users.length > 0 &&
                    users?.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.fullName}
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
                  name="image"
                  onChange={handleImageChange}
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                />
              </div>
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Email Status
                </label>
                <select
                  name="status"
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
                onClick={() => setIsOpenForm(false)}
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black bg-opacity-50">
          <div className="relative w-full h-auto max-w-3xl p-6 mx-auto bg-white rounded-lg shadow-lg">
            {/* Close Button */}
            <button
              className="absolute text-gray-500 transition-colors duration-300 top-2 right-2 hover:text-red-500"
              onClick={togglePopup}
            >
              <IoMdClose size={24} />
            </button>

            {/* Image */}
            <img
              src={deviceData.imageUrl || Images.unknownDevice}
              alt="Profile"
              className="object-contain w-full max-h-[70vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Device;
