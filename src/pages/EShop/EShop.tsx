import React, { useEffect, useState } from "react";
import {
  PageHeader,
  ProductCard,
  CustomerPopUp,
} from "../../components/molecules";
import { FaBoxOpen, FaShoppingCart } from "react-icons/fa";
import { FaFileExcel, FaFilePdf } from "react-icons/fa6";
import Swal from "sweetalert2";
import { useToast } from "../../context/Alert/AlertContext";
import { useNotification } from "../../context/Notification/NotificationContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import axios from "axios";
import { useTheme } from "../../context/Theme/ThemeContext";
import DownloadExcel from "../../helper/DownloadXcel";
import DownloadPDF from "../../helper/DownloadPDF";
import ActivityLog from "../../helper/ActivtyLog";
import ImageModal from "../../components/molecules/ImageModal/ImageModal";
//import { FaEye } from "react-icons/fa";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

// Category types
type Category = {
  category: string;
};

// New Product Type
type NewProductType = {
  _id: string;
  productName: string;
  skuNumber: string;
  unitWeight: string;
  unitWeightUnit: string;
  description: string;
  price: string;
  salePrice: string;
  poNumber: string;
  minCount: string;
  inventory: string;
  category: string;
  companyId: string;
  tags: string;
  image1: File | null;
  image2: File | null;
  image3: File | null;
  assignedCustomers: string[];
  approvalThreshold: string;
};

// Product Type
type ProductType = {
  _id: string;
  productName: string;
  skuNumber: string;
  unitWeight: string;
  description: string;
  price: string;
  salePrice: string;
  inventory: string;
  category: string;
  tags: string;
  imageUrl: string[];
  companyId: string;
  dateCreated: string;
  assignedUsers: string[];
  approvalThreshold: string;
};

// Order Type
type OrderType = {
  _id: string;
  productName: string;
  skuNumber: string;
  unitWeight: string;
  description: string;
  device: {
    deviceId: string;
    deviceName: string;
  };
  price: string;
  salePrice: string;
  poNumber: String;
  minCount: string;
  inventory: string;
  category: string;
  tags: string;
  imageUrl: string[];
  companyId: string;
  assignedUsers: string[];
  approvalThreshold: string;
  deliveryDate: string;
  remark: string;
};

// Cart Type
type CartType = {
  _id: string;
  productName: string;
  skuNumber: string;
  orderCount: string;
  unitPrice: string;
  inventory: string;
  price: string;
  device: {
    deviceId: string;
    deviceName: string;
  };
  productImageUrl: string;
  approvalThreshold: string;
  deliveryDate: string;
  remark: string;
};

// Device Type
type DeviceType = {
  _id: string;
  title: string;
};

// Company Type
type CompanyType = {
  _id: string;
  companyName: string;
};

// Customer Type
// type CustomerType = {
//   _id: string;
//   fullName: string;
// };

const useQuery = () => new URLSearchParams(useLocation().search);

const EShop: React.FC = () => {
  // Local Storage variables
  const query = useQuery();
  const userId = query.get("userId");
  const companyId = query.get("companyId");
  const editProductId = query.get("editProductId");

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

  const today = new Date().toISOString().split("T")[0];

  const { baseUrl } = useBaseUrl();
  const { updateNewOrdersCount } = useNotification();

  const [products, setProducts] = useState<ProductType[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [showProductForm, setShowProductForm] = useState<boolean>(false);
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [NewProduct, setNewProduct] = useState<NewProductType>({
    _id: "",
    productName: "",
    skuNumber: "",
    unitWeight: "",
    unitWeightUnit: "mg",
    description: "",
    price: "",
    salePrice: "",
    poNumber: "",
    minCount: "",
    inventory: "",
    category: "",
    companyId: "",
    tags: "",
    image1: null,
    image2: null,
    image3: null,
    assignedCustomers: [],
    approvalThreshold: "",
  });
  const { notify } = useToast();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showOrderForm, setShowOrderForm] = useState<boolean>(false);
  const [showViewForm, setShowViewForm] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const [orderData, setOrderData] = useState<OrderType>({
    _id: "",
    productName: "",
    skuNumber: "",
    unitWeight: "",
    description: "",
    device: {
      deviceId: "",
      deviceName: "",
    },
    price: "",
    salePrice: "",
    poNumber: "",
    minCount: "",
    inventory: "",
    category: "",
    tags: "",
    imageUrl: [],
    companyId: "",
    assignedUsers: [],
    approvalThreshold: "",
    deliveryDate: "",
    remark: "",
  });
  const [orderCount, setOrderCount] = useState<string>("");
  const [cartData, setCartData] = useState<CartType[]>();
  const [totalPrice, setTotalPrice] = useState<string>(
    localStorage.getItem("totalPrice") || "0"
  );
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [editCount, setEditCount] = useState<string>("");
  const [editItemName, setEditItemName] = useState<string>("");
  const [cartCount, setCartCount] = useState<number>(0);

  const [devices, setDevices] = useState<DeviceType[]>([]);
  const headerRef = React.useRef(null);
  const [showFloatingCart, setShowFloatingCart] = useState<boolean>(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [isCustomerPopupOpen, setIsCustomerPopupOpen] =
    useState<boolean>(false);
  const hidePreviewTimer = React.useRef<number | null>(null);
  const [compnayFilter, setCompanyFilter] = useState<CompanyType | undefined>();

  const handleCartPreviewEnter = () => {
    if (hidePreviewTimer.current) {
      clearTimeout(hidePreviewTimer.current);
    }
    setShowCartPreview(true);
  };

  const handleCartPreviewLeave = () => {
    hidePreviewTimer.current = setTimeout(() => {
      setShowCartPreview(false);
    }, 300);
  };

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      if (UserType !== "Manager") {
        const storedCart = localStorage.getItem("cartData");
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartData(parsedCart);
        }

        GetCategories();
      }
      GetProducts();

      if (UserType === "SuperAdmin") {
        GetCompanies();
      }
    }
  }, [Token]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingCart(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    const currentHeader = headerRef.current;

    if (currentHeader) {
      observer.observe(currentHeader);
    }

    return () => {
      if (currentHeader) {
        observer.unobserve(currentHeader);
      }
    };
  }, [headerRef]);

  useEffect(() => {
    setCartCount(cartData?.length || 0);
  }, [cartData]);

  // Auto-open edit form when editProductId is provided in URL
  useEffect(() => {
    if (editProductId && products.length > 0) {
      const productToEdit = products.find(product => product._id === editProductId);
      if (productToEdit) {
        HandleProductCardEditButton(productToEdit);
      }
    }
  }, [editProductId, products]);

  useEffect(() => {
    let filtered = products;

    // Filter by company only if SuperAdmin and company selected
    if (UserType === "SuperAdmin" && compnayFilter?._id) {
      filtered = filtered.filter(
        (item) => item.companyId === compnayFilter._id
      );
    }

    // Apply search query filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(lowerQuery) ||
          item.skuNumber.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, products, compnayFilter]);

  // Get products
  const GetProducts = async () => {
    try {
      let url;
      if (UserType == "SuperAdmin") {
        url = `${baseUrl}/products/all`;
      } else if (UserType === "Customer") {
        url = `${baseUrl}/products/customer/${UserId}/company/${CompanyId}`;
      } else if (UserType === "Manager") {
        url = `${baseUrl}/products/manager/${UserId}/company/${CompanyId}`;
      } else {
        url = `${baseUrl}/products/company/${CompanyId}`;
      }

      const response = await axios.get(url, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      if (response.data.status) {
        setProducts(response.data.products);
      } else {
        notify(response.data.error.message, "error");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Get devices
  const GetDevices = async (productName: string) => {
    try {
      setLoading(true);

      const data = {
        userId: UserId,
        productName: productName,
      };

      const response = await axios.post(
        `${baseUrl}/device/all/user/product`,
        data,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (response.data.status) {
        const responceDevices: DeviceType[] = response.data.devices.map(
          (device: any) => ({
            _id: device._id,
            title: device.deviceDetails.title,
          })
        );

        setDevices(responceDevices);
        console.log("Devices", responceDevices);
      } else {
        notify(response.data.error.message, "error");
      }
    } catch (error: any) {
      console.log(error);
      //notify(error.response.data.error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Get Categories
  const GetCategories = async () => {
    try {
      let categoryUrl = "";
      if (UserType === "SuperAdmin") {
        categoryUrl = `${baseUrl}/categories/all`;
      } else if (UserType === "Admin" || UserType === "Moderator") {
        categoryUrl = `${baseUrl}/categories/company/${CompanyId}`;
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
    } finally {
      setLoading(false);
    }
  };

  // Get Companies
  const GetCompanies = async () => {
    try {
      const respons = await axios.get(`${baseUrl}/companies/all`, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      if (respons.data.status) {
        setCompanies(respons.data.companies);
      } else {
        notify(respons.data.error.message, "error");
      }
    } catch (error: any) {
      console.log(error);
      // notify(
      //   error.response?.data?.error?.message || "Failed to fetch data",
      //   "error"
      // );
    } finally {
      setLoading(false);
    }
  };

  // Image Upload function
  const ImageUpload = async (imageFile: File | null) => {
    if (imageFile == null) {
      return null;
    }

    const newImage = new FormData();
    newImage.append("file", imageFile);

    try {
      const response = await axios.post(`${baseUrl}/files/save`, newImage, {
        headers: {
          "Content-Type": "multipart/form-data",
          token: `Bearer ${Token}`,
        },
      });
      return response.data.fileName;
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };

  // Delete Image function
  const DeleteImage = async (url: string) => {
    if (url === null || url === undefined) {
      return;
    }
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    try {
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

  // Create New Product
  const CreateNewProduct = async () => {
    let image1Name = null;
    let image2Name = null;
    let image3Name = null;
    if (NewProduct.image1 != null) {
      image1Name = await ImageUpload(NewProduct.image1);
    }
    if (NewProduct.image2 != null) {
      image2Name = await ImageUpload(NewProduct.image2);
    }
    if (NewProduct.image3 != null) {
      image3Name = await ImageUpload(NewProduct.image3);
    }

    const imageUrl: string[] = [];

    if (image1Name)
      imageUrl.push(`${baseUrl.replace("/api", "")}/uploads/${image1Name}`);
    if (image2Name)
      imageUrl.push(`${baseUrl.replace("/api", "")}/uploads/${image2Name}`);
    if (image3Name)
      imageUrl.push(`${baseUrl.replace("/api", "")}/uploads/${image3Name}`);

    const data = {
      productName: NewProduct.productName,
      skuNumber: NewProduct.skuNumber,
      unitWeight: `${NewProduct.unitWeight} ${NewProduct.unitWeightUnit}`,
      description: NewProduct.description,
      price: NewProduct.price,
      salePrice: NewProduct.salePrice,
      poNumber: NewProduct.poNumber,
      minCount: NewProduct.minCount,
      inventory: NewProduct.inventory,
      category: NewProduct.category,
      tags: NewProduct.tags,
      companyId: UserType === "SuperAdmin" ? NewProduct.companyId : CompanyId,
      imageUrl: imageUrl,
      assignedUsers: NewProduct.assignedCustomers,
      approvalThreshold: NewProduct.approvalThreshold,
    };

    // console.log("New Product Data: ", data);

    try {
      const response = await axios.post(`${baseUrl}/products/create`, data, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      if (response.data.status) {
        Swal.fire({
          title: "",
          text: "New Product Created Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        HandleCloseButton();
        GetProducts();
      }
    } catch (error: any) {
      console.error("Failed to create new product:", error);
      notify(error.response.data.error.message, "error");
    }
  };

  // Update product
  const UpdateProduct = async () => {
    const existingProduct = filteredProducts.find(
      (p) => p._id == NewProduct._id
    );

    const imageUrl: string[] = [];

    // Image 1
    if (NewProduct.image1 != null) {
      if (existingProduct?.imageUrl[0]) {
        await DeleteImage(existingProduct.imageUrl[0]);
      }

      const image1Name = await ImageUpload(NewProduct.image1);
      if (image1Name) {
        imageUrl.push(`${baseUrl.replace("/api", "")}/uploads/${image1Name}`);
      }
    } else if (existingProduct?.imageUrl[0]) {
      imageUrl.push(existingProduct.imageUrl[0]);
    }

    // Image 2
    if (NewProduct.image2 != null) {
      if (existingProduct?.imageUrl[1]) {
        await DeleteImage(existingProduct.imageUrl[1]);
      }

      const image2Name = await ImageUpload(NewProduct.image2);
      if (image2Name) {
        imageUrl.push(`${baseUrl.replace("/api", "")}/uploads/${image2Name}`);
      }
    } else if (existingProduct?.imageUrl[1]) {
      imageUrl.push(existingProduct.imageUrl[1]);
    }

    // Image 3
    if (NewProduct.image3 != null) {
      if (existingProduct?.imageUrl[2]) {
        await DeleteImage(existingProduct.imageUrl[2]);
      }

      const image3Name = await ImageUpload(NewProduct.image3);
      if (image3Name) {
        imageUrl.push(`${baseUrl.replace("/api", "")}/uploads/${image3Name}`);
      }
    } else if (existingProduct?.imageUrl[2]) {
      imageUrl.push(existingProduct.imageUrl[2]);
    }

    const data = {
      productName: NewProduct.productName,
      skuNumber: NewProduct.skuNumber,
      unitWeight: `${NewProduct.unitWeight} ${NewProduct.unitWeightUnit}`,
      description: NewProduct.description,
      price: NewProduct.price,
      salePrice: NewProduct.salePrice,
      poNumber: NewProduct.poNumber,
      minCount: NewProduct.minCount,
      inventory: NewProduct.inventory,
      category: NewProduct.category,
      companyId: UserType === "SuperAdmin" ? NewProduct.companyId : CompanyId,
      tags: NewProduct.tags,
      imageUrl: imageUrl,
      assignedUsers: NewProduct.assignedCustomers,
      approvalThreshold: NewProduct.approvalThreshold,
    };

    try {
      const response = await axios.put(
        `${baseUrl}/products/update/${NewProduct._id}`,
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
          text: "New Product Created Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        HandleCloseButton();
        GetProducts();
      }
    } catch (error: any) {
      console.error("Failed to update product:", error);
      notify(error.response.data.error.message, "error");
    }
  };

  // Create Order
  const CreateOrder = async () => {
    try {
      if (!cartData || cartData.length == 0) {
        notify("Cart is empty. Please add items to proceed.", "warning");
        return;
      }
      for (const order of cartData) {
        if (!order.deliveryDate || order.deliveryDate < today) {
          notify(
            `Invalid delivery date for "${order.productName}". Please select a future date.`,
            "error"
          );
          setLoading(false);
          return;
        }
      }
      setLoading(true);

      let successCount = 0;
      const failedOrders: string[] = [];

      for (const order of cartData) {
        const payload = {
          order: {
            productId: order._id,
            salePrice: order.unitPrice,
            orderCount: order.orderCount,
          },
          userId: UserId,
          deviceId: order.device.deviceId || null,
          totalPrice: order.price,
          orderStatus: "new_request",
          inventory: order.inventory,
          message: "",
          companyId: CompanyId,
          managerApproval:
            Number(order.approvalThreshold) < Number(order.orderCount)
              ? "Pending"
              : "Default",
          customerDeliveryVerification: false,
          qrCodeGenerateStatus: false,
          deliveryDate: order.deliveryDate,
          remark: order.remark,
        };

        try {
          const response = await axios.post(
            `${baseUrl}/orders/create`,
            payload,
            {
              headers: {
                token: `Bearer ${Token}`,
              },
            }
          );
          if (response.data.status) {
            successCount++;
            await ActivityLog({
              url: `${baseUrl}/activity-logs/create`,
              category: "Order",
              actionType: "Order Create",
              itemId: response.data.order._id || "",
            });
          } else {
            failedOrders.push(order.productName);
          }
        } catch (error: any) {
          failedOrders.push(order.productName);
          notify(error.response.data.error.message, "error");
          console.log(`Order for "${order.productName}" failed:`, error);
        }
      }
      let summaryMessage = `${successCount}/${cartData.length} orders placed successfully.`;
      if (failedOrders.length > 0) {
        summaryMessage += `\nFailed orders: ${failedOrders.join(", ")}`;
      }

      Swal.fire({
        title: "Order Summary",
        text: summaryMessage,
        icon: successCount === cartData.length ? "success" : "warning",
        showCancelButton: false,
        confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
        background: colors.primary[400],
        iconColor: "#06D001",
        confirmButtonText: "Ok",
        color: colors.grey[100],
        allowOutsideClick: false,
      });

      // Clear cart only if at least one order was successful
      if (successCount > 0) {
        setShowCart(false);
        setCartData([]);
        localStorage.removeItem("cartData");
        localStorage.removeItem("totalPrice");
        HandleCloseButton();
        // Update notification count for new orders
        updateNewOrdersCount();
        // Refetch products to update PO Balance
        await GetProducts();
      }
    } catch (error: any) {
      console.error("Failed to update product:", error);
      notify(error.response.data.error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete Product
  const DeleteProduct = async (id: string) => {
    try {
      const existingProduct = filteredProducts.find((p) => p._id == id);

      if (!existingProduct) {
        notify("Product not found", "error");
        return;
      }

      if (existingProduct.imageUrl && existingProduct.imageUrl.length != 0) {
        for (const url of existingProduct.imageUrl) {
          await DeleteImage(url);
        }
      }

      const response = await axios.delete(`${baseUrl}/products/delete/${id}`, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      if (response.data.status) {
        Swal.fire({
          text: "Product deleted successfully!",
          icon: "success",
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        GetProducts();
      }
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      notify(error.response.data.error.message, "error");
    }
  };

  // Handle save button of Create new Product form
  const HandleSaveButton = () => {
    if (
      !NewProduct.productName ||
      !NewProduct.skuNumber ||
      !NewProduct.unitWeight ||
      !NewProduct.price ||
      !NewProduct.salePrice ||
      !NewProduct.inventory ||
      !NewProduct.category ||
      !NewProduct.poNumber ||
      !NewProduct.minCount
    ) {
      notify("Fill all required field before click Save button.", "error");
      return;
    }

    if (Number(NewProduct.approvalThreshold) === 0) {
      notify("Approval Threshold must be greater than 0.", "error");
      return;
    }

    Swal.fire({
      title: "",
      text: "Are you sure, you want to Create New Product?",
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
        CreateNewProduct();
      }
    });
  };

  // Handle Update button of Edit Product form
  const HandleUpdateButton = () => {
    Swal.fire({
      title: "",
      text: "Are you sure, you want to save changes?",
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
        UpdateProduct();
      }
    });
  };

  // Handel Edit button of Product card
  const HandleProductCardEditButton = (product: any) => {
    const [weightValue, weightUnit] = product.unitWeight.split(" ");
    const updatedProduct = {
      _id: product._id,
      productName: product.productName,
      skuNumber: product.skuNumber,
      unitWeight: weightValue || "",
      unitWeightUnit: weightUnit || "",
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      poNumber: product.poNumber,
      minCount: product.minCount,
      inventory: product.inventory,
      category: product.category,
      tags: product.tags,
      companyId: product.companyId,
      image1: null,
      image2: null,
      image3: null,
      assignedCustomers: product.assignedCustomers,
      approvalThreshold: product.approvalThreshold,
    };
    setNewProduct(updatedProduct);
    setIsEditing(true);
    setShowProductForm(true);
  };

  // Handel Delete button of Product card
  const HandleProductCardDeleteButton = (product: any) => {
    // Moderators cannot delete products
    if (UserType === "Moderator") {
      notify("You don't have permission to delete products.", "error");
      return;
    }

    Swal.fire({
      title: "",
      text: "Are you sure, you want to delete product?",
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
        DeleteProduct(product._id);
      }
    });
  };

  // Handel Order button of product card
  const HandleProductCardOrderButton = async (product: any) => {
    setOrderData({
      _id: product._id,
      productName: product.productName,
      skuNumber: product.skuNumber,
      unitWeight: product.unitWeight,
      description: product.description,
      device: {
        deviceId: "",
        deviceName: "",
      },
      price: product.price,
      salePrice: product.salePrice,
      poNumber: product.poNumber,
      minCount: product.minCount,
      inventory: product.inventory,
      category: product.category,
      tags: product.tags,
      imageUrl: product.imageUrl,
      companyId: product.companyId,
      assignedUsers: product.assignedCustomers,
      approvalThreshold: product.approvalThreshold,
      deliveryDate: "",
      remark: "",
    });
    await GetDevices(product.productName);
    setShowProductForm(false);
    setIsEditing(false);
    setShowOrderForm(true);
    setShowViewForm(false);
  };

  // Handle View burron of product card
  const HandleProductCardViewButton = (product: any) => {
    setOrderData(product);
    setShowProductForm(false);
    setIsEditing(false);
    setShowOrderForm(true);
    setShowViewForm(true);
  };

  // Handle Add to cart button
  const HandleAddToCartButton = () => {
    if (orderCount == "") {
      notify(
        "Add valid order count before click  Add to Cart button",
        "warning"
      );
      return;
    }

    if (Number(orderCount) > Number(orderData.inventory)) {
      notify(
        "Order quantity exceeds available stock. Please reduce the quantity.",
        "warning"
      );
      return;
    }

    if (!orderData.deliveryDate) {
      notify("Please choose the delivery date!", "warning");
      return;
    }

    const newCartItem: CartType = {
      _id: orderData._id,
      productName: orderData.productName,
      skuNumber: orderData.skuNumber,
      orderCount: orderCount,
      inventory: orderData.inventory,
      device: {
        deviceId: orderData.device.deviceId,
        deviceName: orderData.device.deviceName,
      },
      unitPrice: orderData.salePrice,
      price: String(Number(orderCount) * Number(orderData.salePrice)),
      productImageUrl: orderData.imageUrl[0] || "",
      approvalThreshold: orderData.approvalThreshold || "0",
      deliveryDate: orderData.deliveryDate,
      remark: orderData.remark,
    };

    let updatedCart: CartType[] = [];

    const existingItemIndex = (cartData || []).findIndex(
      (item) => item._id === newCartItem._id
    );

    if (existingItemIndex !== -1) {
      updatedCart = [...(cartData || [])];
      const prevCount = Number(updatedCart[existingItemIndex].orderCount);
      const newCount = prevCount + Number(orderCount);
      updatedCart[existingItemIndex].orderCount = newCount.toString();
      updatedCart[existingItemIndex].price = String(
        newCount * Number(orderData.salePrice)
      );
      updatedCart[existingItemIndex].deliveryDate = orderData.deliveryDate;
    } else {
      updatedCart = [...(cartData || []), newCartItem];
    }

    const total = updatedCart.reduce(
      (acc, item) => acc + Number(item.price),
      0
    );
    const totalStr = total.toFixed(2);

    setTotalPrice(totalStr);
    setCartData(updatedCart);
    console.log("Updated cart: ", updatedCart);
    localStorage.setItem("cartData", JSON.stringify(updatedCart));
    localStorage.setItem("totalPrice", totalStr);
    setOrderCount("");
    HandleCloseButton();

    notify("Product added to cart successfully!", "success");
  };

  // Handle Request Order button
  const RequestOrderButton = () => {
    Swal.fire({
      title: "",
      text: "Thank You for your valued order!",
      icon: "success",
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
        CreateOrder();
      }
    });
  };

  // Handle Edit button of the Cart popup
  const HadleEditButton = (index: number) => {
    if (cartData) {
      GetDevices(cartData[index].productName);
      setEditItemIndex(index);
      setEditCount(cartData[index].orderCount);
      setEditItemName(cartData[index].productName);
    }
  };

  // Handle Remove button of the cart popup
  const HandleRemoveButton = (index: number) => {
    const updatedCart = [...(cartData ?? [])];
    updatedCart.splice(index, 1);

    const newTotal = updatedCart.reduce(
      (acc, item) => acc + Number(item.unitPrice) * Number(item.orderCount),
      0
    );

    setCartData(updatedCart);
    setCartCount(updatedCart.length);
    setTotalPrice(newTotal.toFixed(2));
    localStorage.setItem("cartData", JSON.stringify(updatedCart));
    localStorage.setItem("totalPrice", newTotal.toFixed(2));
  };

  // Handle save button of edit popup
  const HandleSaveEdit = () => {
    if (editItemIndex === null) return;

    const updatedCart = [...(cartData || [])];

    if (Number(editCount) > Number(updatedCart[editItemIndex].inventory)) {
      notify(
        "Order quantity exceeds available stock. Please reduce the quantity.",
        "warning"
      );
      return;
    }

    updatedCart[editItemIndex].orderCount = editCount;
    const item = updatedCart[editItemIndex];

    const oldTotal = Number(item.price);
    const newTotal = Number(item.unitPrice) * Number(editCount);

    updatedCart[editItemIndex].price = String(newTotal);

    const updatedTotalPrice = Number(totalPrice) - oldTotal + newTotal;

    setCartData(updatedCart);
    setCartCount(updatedCart.length);
    setTotalPrice(updatedTotalPrice.toFixed(2));
    localStorage.setItem("cartData", JSON.stringify(updatedCart));
    localStorage.setItem("totalPrice", updatedTotalPrice.toFixed(2));
    setEditItemIndex(null); // close popup
  };

  // Handle Close button of form
  const HandleCloseButton = () => {
    setShowProductForm(false);
    setIsEditing(false);
    setShowOrderForm(false);
    setShowCart(false);
    setShowViewForm(false);
    setEditItemIndex(null);
    setEditCount("");
    setOrderCount("");
    setCurrentIndex(0);
    setDevices([]);
    setNewProduct({
      _id: "",
      productName: "",
      skuNumber: "",
      unitWeight: "",
      unitWeightUnit: "mg",
      description: "",
      price: "",
      salePrice: "",
      poNumber: "",
      minCount: "",
      inventory: "",
      category: "",
      companyId: "",
      tags: "",
      image1: null,
      image2: null,
      image3: null,
      assignedCustomers: [],
      approvalThreshold: "",
    });
    setOrderData({
      _id: "",
      productName: "",
      skuNumber: "",
      unitWeight: "",
      description: "",
      device: {
        deviceId: "",
        deviceName: "",
      },
      price: "",
      salePrice: "",
      poNumber: "",
      minCount: "",
      inventory: "",
      category: "",
      tags: "",
      imageUrl: [],
      companyId: "",
      assignedUsers: [],
      approvalThreshold: "",
      deliveryDate: "",
      remark: "",
    });
  };

  // Handle edit form close button
  const HandleEditCloseButton = () => {
    setEditItemIndex(null);
    setEditCount("");
  };

  // Slider Functions
  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? (orderData?.imageUrl.length || 1) - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === (orderData?.imageUrl.length || 1) - 1 ? 0 : prevIndex + 1
    );
  };

  const handleImageClick = (_imageUrl: string, altText: string) => {
    setSelectedImageAlt(altText);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageAlt("");
  };

  // Handle Add New Products button
  const HandleAddNewProductButton = () => {
    setShowProductForm(true);
    setShowCart(false);
  };

  // Handle Cart button
  const HandleCartButton = () => {
    setShowProductForm(false);
    setShowCart(true);
  };

  // Handel refresh function
  const HandleRefresh = (updatedAssignedCustomers: string[]) => {
    GetProducts();
    setOrderData((prev) => ({
      ...prev,
      assignedUsers: updatedAssignedCustomers,
    }));
  };

  // Function to download Excel file
  const downloadExcelFile = async () => {
    if (products.length === 0) {
      notify("No products available to download.", "error");
      return;
    }

    try {
      await DownloadExcel({
        data: { products },
        type: "products",
        url: `${baseUrl}/excel/product/products`,
      });
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      notify("Failed to download Excel file", "error");
    }
  };

  // Function to download PDF file
  const downloadPDFFile = async () => {
    if (products.length === 0) {
      notify("No products available to download.", "error");
      return;
    }

    try {
      await DownloadPDF({
        data: products,
        type: "products",
        url: `${baseUrl}/pdf/product/products`,
      });
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      notify("Failed to download Excel file", "error");
    }
  };

  return (
    <div className="">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div ref={headerRef}>
          <PageHeader title="eShop" subTitle="" />
        </div>
        <div className="flex flex-row items-center gap-5">
          {UserType === "SuperAdmin" && (
            <div
              className="flex items-center gap-4 mb-5"
              style={{ color: colors.grey[100] }}
            >
              <label className="font-semibold whitespace-nowrap">
                Choose Company:
              </label>
              <select
                className="p-2 rounded border"
                value={compnayFilter?._id || "all"}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId === "all") {
                    setCompanyFilter(undefined);
                  } else {
                    const selectedCompany = companies.find(
                      (c) => c._id === selectedId
                    );
                    setCompanyFilter(selectedCompany);
                  }
                }}
                style={{
                  backgroundColor:
                    theme === "dark" ? colors.grey[800] : colors.grey[200],
                  color: theme === "dark" ? colors.grey[100] : colors.grey[900],
                  borderColor:
                    theme === "dark" ? colors.grey[700] : colors.grey[400],
                }}
              >
                <option value="all">All</option>
                {companies?.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {UserType === "Admin" || UserType === "Moderator" ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-5">
              <button
                onClick={HandleAddNewProductButton}
                className={`px-4 py-3 text-[12px] w-full md:w-auto bg-orange-400 flex items-center  justify-center gap-3 rounded-md hover:bg-orange-300 duration-300 transition-colors`}
              >
                <FaBoxOpen size={20} />
                Add New Products
              </button>
              {UserType === "Admin" && products.length !== 0 && (
                <>
                  <button
                    onClick={downloadExcelFile}
                    className="px-4 py-3 text-[12px] w-full md:w-auto bg-green-600 hover:bg-green-700 flex items-center justify-center gap-3 rounded-md text-white duration-300 transition-colors"
                  >
                    <FaFileExcel size={20} />
                    Download Excel
                  </button>
                  <button
                    onClick={downloadPDFFile}
                    className="px-4 py-3 text-[12px] w-full md:w-auto bg-red-600 hover:bg-red-700 flex items-center justify-center gap-3 rounded-md text-white duration-300 transition-colors"
                  >
                    <FaFilePdf size={20} />
                    Download PDF
                  </button>
                </>
              )}
            </div>
          ) : null}
          {UserType === "Customer" ? (
            <button
              className={`relative px-4 py-3 text-[12px] w-full md:w-auto bg-orange-400 flex items-center justify-center gap-3 rounded-md hover:bg-orange-300 duration-300 transition-colors`}
              onClick={HandleCartButton}
            >
              <FaShoppingCart size={20} />
              Cart
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 translate-x-2 -translate-y-2 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-[5px]">
                  {cartCount}
                </span>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {showFloatingCart && UserType === "Customer" && (
        <div
          className="fixed bottom-28 sm:bottom-20 right-5 sm:right-10 z-50"
          onMouseEnter={handleCartPreviewEnter}
          onMouseLeave={handleCartPreviewLeave}
        >
          <button
            onClick={HandleCartButton}
            className="relative bg-orange-400 text-black px-2 py-1 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-xl shadow-lg flex items-center space-x-2 sm:space-x-3 hover:bg-orange-500 transition-colors duration-300"
            aria-label="Cart"
          >
            <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className="font-semibold text-lg"></span>

            {cartCount > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5">
                {cartCount}
              </span>
            )}
          </button>
          {showCartPreview && cartData && cartData.length > 0 && (
            <div
              className="absolute bottom-20 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 flex flex-col gap-2"
              style={{ zIndex: 100 }}
            >
              <div className="font-bold text-gray-700 mb-2">Cart Preview</div>
              {cartData.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 border-b last:border-b-0 pb-2 last:pb-0"
                >
                  <img
                    src={item.productImageUrl || "/unknown-product.png"}
                    alt={item.productName}
                    className="w-10 h-10 object-cover rounded border border-gray-200"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm line-clamp-1">
                      {item.productName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Qty: {item.orderCount}
                    </div>
                  </div>
                </div>
              ))}
              {cartData.length > 3 && (
                <div className="text-xs text-gray-400 text-center mt-1">
                  +{cartData.length - 3} more item(s)
                </div>
              )}
              <button
                onClick={() => {
                  setShowCart(true);
                  setShowCartPreview(false);
                }}
                className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors duration-200 font-semibold"
              >
                View Cart
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : null}

      {/* Product Section */}
      {!showCart && !isLoading && products.length != 0 ? (
        <div>
          {/* Search box */}
          <div className="w-full mt-4 md:w-6/12 lg:w-5/12">
            <input
              type="text"
              placeholder="Search by product name or Lead Time"
              className="w-full px-4 py-2 text-[12px] border border-gray-300 rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Product card section */}
          <div className="flex  items-center justify-center lg:justify-start gap-5 flex-wrap w-full">
            {filteredProducts.length != 0
              ? filteredProducts.map((item, index) => (
                  <ProductCard
                    key={index}
                    skuNumber={item.skuNumber}
                    productName={item.productName}
                    imageUrl={item.imageUrl}
                    description={item.description}
                    price={item.price}
                    salePrice={item.salePrice}
                    inventory={item.inventory}
                    assignedCustomers={item.assignedUsers}
                    onEdit={() => HandleProductCardEditButton(item)}
                    onDelete={() => HandleProductCardDeleteButton(item)}
                    onOrder={() => HandleProductCardOrderButton(item)}
                    onView={() => HandleProductCardViewButton(item)}
                  />
                ))
              : null}
          </div>
        </div>
      ) : null}

      {/* If Products not found */}
      {!isLoading && filteredProducts.length == 0 && !showCart ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Products not found.
        </div>
      ) : null}

      {/* Create/Update Product Form */}
      {showProductForm && !isLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black bg-opacity-50">
          <div className="w-full p-6 bg-white rounded-lg h-auto max-h-[90vh] overflow-y-auto shadow-lg lg:w-2/3">
            <h2 className="mb-4 text-lg font-bold text-center text-black">
              {isEditing ? "Edit Product" : "Add New Product"}
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Customer Part Number{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <input
                  type="text"
                  name="productName"
                  value={NewProduct.productName}
                  onChange={(e) =>
                    setNewProduct({
                      ...NewProduct,
                      productName: e.target.value,
                    })
                  }
                  placeholder="Customer Part Number"
                  className="w-full p-2 mt-2 text-[12px] border rounded-md"
                />
              </div>
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Lead Time{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <input
                  type="text"
                  name="skuNumber"
                  value={NewProduct.skuNumber}
                  onChange={(e) =>
                    setNewProduct({
                      ...NewProduct,
                      skuNumber: e.target.value,
                    })
                  }
                  placeholder="Lead Time"
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
                      setNewProduct({
                        ...NewProduct,
                        companyId: e.target.value,
                      })
                    }
                    value={NewProduct.companyId}
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
                    value={NewProduct.unitWeight}
                    placeholder="Unit Weight"
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
                        unitWeight: e.target.value,
                      })
                    }
                    className="w-[60%] p-2 mt-2 text-[12px] border rounded-md"
                  />
                  <select
                    name="unitWeightUnit"
                    value={NewProduct.unitWeightUnit}
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
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

              {(UserType === "SuperAdmin" ||
                UserType === "Admin" ||
                UserType === "Moderator") && (
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Approval Threshold{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <input
                    type="number"
                    name="approvalThreshold"
                    value={NewProduct.approvalThreshold}
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
                        approvalThreshold: e.target.value,
                      })
                    }
                    placeholder="Approval Threshold"
                    min={"0"}
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}
              {(UserType === "SuperAdmin" ||
                UserType === "Admin" ||
                UserType === "Moderator") && (
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    PO Number{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <input
                    type="text"
                    name="poNumber"
                    value={NewProduct.poNumber}
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
                        poNumber: e.target.value,
                      })
                    }
                    placeholder="PO Number"
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}
              {(UserType === "SuperAdmin" ||
                UserType === "Admin" ||
                UserType === "Moderator") && (
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Minimum Products Count{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <input
                    type="number"
                    name="minCount"
                    value={NewProduct.minCount}
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
                        minCount: e.target.value,
                      })
                    }
                    min={0}
                    placeholder="Minimum Products Count"
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="w-full font-semibold text-[13px]">
                  Description{" "}
                </label>
                <textarea
                  name="description"
                  value={NewProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...NewProduct,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description"
                  className="w-full p-2 mt-2 min-h-[100px] text-[12px] border rounded-md"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-5 md:col-span-2 ">
                <div className="flex-1">
                  <label className="w-full font-semibold text-[13px]">
                    Price ($){" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <input
                    type="number"
                    value={NewProduct.price}
                    min={0}
                    name="price"
                    onChange={(e) =>
                      setNewProduct({ ...NewProduct, price: e.target.value })
                    }
                    placeholder="Price"
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>

                <div className="flex-1">
                  <label className="w-full font-semibold text-[13px]">
                    Sale Price ($){" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <input
                    type="number"
                    value={NewProduct.salePrice}
                    min={0}
                    name="salePrice"
                    placeholder="Sale Price"
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
                        salePrice: e.target.value,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>

                <div className="flex-1">
                  <label className="w-full font-semibold text-[13px]">
                    PO Balance{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <input
                    type="number"
                    value={NewProduct.inventory}
                    min={0}
                    name="inventory"
                    placeholder="PO Balance"
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
                        inventory: e.target.value,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Category{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                <select
                  name="category"
                  value={NewProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...NewProduct, category: e.target.value })
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

              {(UserType === "Admin" ||
                UserType === "SuperAdmin" ||
                UserType === "Moderator") && (
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Tags
                  </label>
                  <input
                    name="tags"
                    value={NewProduct.tags}
                    onChange={(e) =>
                      setNewProduct({ ...NewProduct, tags: e.target.value })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              )}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Image 1
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
                        image1: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Image 2
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
                        image2: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Image 3
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNewProduct({
                        ...NewProduct,
                        image3: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-4">
              <button
                className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                onClick={HandleCloseButton}
              >
                Cancel
              </button>
              <button
                className="px-4 py-3 w-full text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
                onClick={isEditing ? HandleUpdateButton : HandleSaveButton}
              >
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showOrderForm || (showViewForm && !isLoading) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black bg-opacity-50">
          <div className="w-full relative p-6 bg-white rounded-lg h-auto max-h-[90vh] overflow-y-auto shadow-lg lg:w-[750px]">
            <h2 className="mb-4 text-lg font-bold text-center text-black">
              {showOrderForm && !showViewForm
                ? "New Order"
                : "View Product"}
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Images */}
              <div className="md:col-span-2 flex justify-center">
                <div className="relative flex items-center justify-center w-[400pX] h-64 bg-gray-100 rounded-lg">
                  {orderData?.imageUrl && orderData.imageUrl.length > 0 ? (
                    <>
                      <img
                        src={orderData.imageUrl[currentIndex]}
                        alt={`${orderData.productName} - Image ${
                          currentIndex + 1
                        }`}
                        className="max-h-full max-w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() =>
                          handleImageClick(
                            orderData.imageUrl[currentIndex],
                            `${orderData.productName} - Image ${
                              currentIndex + 1
                            }`
                          )
                        }
                      />

                      {/* Navigation arrows */}
                      {orderData.imageUrl.length > 1 && (
                        <>
                          <button
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                            aria-label="Previous image"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                            aria-label="Next image"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>

                          {/* Image counter */}
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            {currentIndex + 1} / {orderData.imageUrl.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500">No image</div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="col-span-1 md:col-span-1">
                <div className="flex flex-col items-center justify-center flex-1">
                  <span className="text-[15px] font-semibold max-w-full sm:max-w-[220px] line-clamp-1">
                    {orderData.productName}
                  </span>
                  <span className="text-gray-500 text-[13px]">
                    x {orderCount} To be delivered
                  </span>
                </div>
                <p className="text-[14px] font-bold italic text-black">
                  <span className="font-bold text-black">Lead Time:</span>{" "}
                  <span className="font-bold text-black ">
                    {orderData.skuNumber}
                  </span>
                </p>
                <p className="text-[14px] font-bold italic text-gray-800">
                  PO Number: {orderData.poNumber}
                </p>
                {Number(orderData.minCount) > Number(orderData.inventory) &&
                  UserType !== "Customer" && (
                    <p className="mt-1 mb-1 px-3 py-1 bg-red-200 text-red-700 font-semibold rounded-full text-sm border border-red-300 shadow-sm w-fit">
                      Low Stock
                    </p>
                  )}

                {/*<p className="text-[14px]  text-gray-900">
                  Approval Threshold : {orderData.approvalThreshold}
                </p>*/}

                {UserType === "SuperAdmin" && (
                  <div className="flex items-center gap-1 text-gray-600 text-[13px] sm:text-[14px] font-medium max-w-[200px] sm:max-w-[250px] md:max-w-[300px] truncate">
                    <span className="hidden sm:inline italic">Company:</span>
                    <span
                      className="text-gray-800 font-semibold truncate"
                      title={
                        companies.find((c) => c._id === orderData.companyId)
                          ?.companyName || "N/A"
                      }
                    >
                      {companies.find((c) => c._id === orderData.companyId)
                        ?.companyName || "N/A"}
                    </span>
                  </div>
                )}

                {UserType === "Admin" ||
                  (UserType === "SuperAdmin" && (
                    <p className="text-[15px]">{orderData.unitWeight}</p>
                  ))}
                <p className="text-[14px] font-bold italic text-green-500">
                  PO Balance : {orderData.inventory}
                </p>
                <p className="text-[15px] font-semibold">
                  {orderData.category}
                </p>
                {UserType === "Admin" ||
                  (UserType === "SuperAdmin" && (
                    <p className="text-[15px] line-clamp-1">{orderData.tags}</p>
                  ))}
                <p className="text-[12px] line-clamp-3">
                  {orderData.description}
                </p>
              </div>

              {/* Order Count */}
              {showOrderForm && !showViewForm ? (
                <div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="w-full font-semibold text-[13px]">
                      Order quantity{" "}
                      <strong className="text-red-500 text-[12px]">*</strong>
                    </label>
                    <input
                      type="number"
                      max={orderData.inventory}
                      min={1}
                      onChange={(e) => setOrderCount(e.target.value)}
                      name="orderCount"
                      placeholder="Order quantity"
                      className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="w-full font-semibold text-[13px]">
                      Delivery Date{" "}
                      <strong className="text-red-500 text-[12px]">*</strong>
                    </label>
                    <input
                      type="date"
                      min={today}
                      name="deliveryDate"
                      value={orderData.deliveryDate}
                      onChange={(e) =>
                        setOrderData({
                          ...orderData,
                          deliveryDate: e.target.value,
                        })
                      }
                      className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    />
                  </div>
                  {/* COMMENTED OUT: Choose Device section - no longer needed for customers
                  <div className="col-span-1 md:col-span-1">
                    <label className="w-full font-semibold text-[13px]">
                      Choose Device{" "}
                    </label>
                    <select
                      name="device"
                      value={orderData.device.deviceId}
                      onChange={(e) => {
                        const selectDevice = devices.find(
                          (d) => d._id == e.target.value
                        );
                        if (selectDevice) {
                          setOrderData((prev) => ({
                            ...prev,
                            device: {
                              deviceId: selectDevice._id,
                              deviceName: selectDevice.title,
                            },
                          }));
                        } else {
                          setOrderData((prev) => ({
                            ...prev,
                            device: {
                              deviceId: "",
                              deviceName: "",
                            },
                          }));
                        }
                      }}
                      className="w-full p-2 mt-2 text-[12px] border rounded-md"
                    >
                      <option value="None">None</option>
                      {devices.length != 0 &&
                        devices.map((d, index) => (
                          <option key={index} value={d._id}>
                            {d.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  */}
                </div>
              ) : null}
              {UserType === "Customer" ? (
                <div className="col-span-1 md:col-span-2">
                  <label className="w-full font-semibold text-[13px]">
                    Remark{" "}
                  </label>
                  <textarea
                    name="remark"
                    value={orderData.remark}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        remark: e.target.value,
                      })
                    }
                    className="w-full p-2 mt-2 text-[12px] border rounded-md"
                  />
                </div>
              ) : null}
            </div>
            <div className="flex justify-end mt-6  space-x-4">
              {/* Customers Button */}
              {/* {UserType === "SuperAdmin" || UserType === "Admin" ? (
                <button
                  className="px-4 py-2 text-white w-full md:w-auto text-[12px] bg-purple-500 hover:bg-purple-400 rounded-md"
                  onClick={() => setIsCustomerPopupOpen(true)}
                >
                  <div className="flex items-center gap-1 justify-center">
                    <FaEye size={15} />
                    <span>Customers</span>
                  </div>
                </button>
              ) : null} */}

              {/* Cancel Button */}
              <button
                className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                onClick={HandleCloseButton}
              >
                Cancel
              </button>
              {/* Add to Cart Button */}
              {showOrderForm && !showViewForm ? (
                <button
                  className="px-4 py-3 w-full text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
                  onClick={HandleAddToCartButton}
                >
                  Add to Cart
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Cart Section */}
      {showCart ? (
        cartData && cartData.length > 0 ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black bg-opacity-50">
            <div className="w-full relative p-6 bg-white rounded-lg h-auto max-h-[90vh] overflow-y-auto shadow-lg lg:w-[750px]">
              <h2 className="mb-4 text-lg font-bold text-center text-black">
                {editItemIndex == null ? "Your Order List" : "Edit Order"}
              </h2>
              <div className="grid grid-cols-1">
                {/* Cart data */}
                {editItemIndex == null ? (
                  cartData?.map((data, index) => {
                    const productForNav = products.find(
                      (p) => p._id === data._id
                    );
                    return (
                      <div
                        key={index}
                        className="w-full mb-4 shadow-lg border rounded-md border-gray-300"
                      >
                        {/* Main Row */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5 px-2 sm:px-4 py-2">
                          <div className="flex flex-col sm:flex-row items-center justify-between w-full sm:w-2/3 gap-2 sm:gap-0">
                            {/* Product Image */}
                            <img
                              src={
                                data.productImageUrl || "/unknown-product.png"
                              }
                              alt={data.productName}
                              className="w-16 h-16 object-cover rounded mb-2 sm:mb-0 mr-0 sm:mr-3 border border-gray-200 cursor-pointer"
                              onClick={() => {
                                if (productForNav) {
                                  navigate("/product", {
                                    state: { product: productForNav },
                                  });
                                  HandleCloseButton();
                                }
                              }}
                            />

                            {/* Product Name + Quantity + Delivery Date */}
                            <div className="flex flex-col flex-1 text-center gap-1">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-[15px] font-semibold max-w-full sm:max-w-[220px] line-clamp-1">
                                  {data.productName}
                                </span>
                                <span className="text-[14px] font-bold italic text-gray-800">
                                  x {data.orderCount} Order quantity
                                </span>
                              </div>
                              <div className="text-[14px] font-bold italic text-gray-800">
                                Delivery Date:
                                {data.deliveryDate || "Not selected"}
                              </div>
                            </div>
                          </div>

                          {/* Edit & Remove Buttons */}
                          <div className="flex gap-2 sm:gap-5 w-full sm:w-auto mt-2 sm:mt-0 justify-center sm:justify-end">
                            <button
                              className="px-4 py-2 text-[12px] text-white rounded-lg transition-colors duration-300 bg-green-500 hover:bg-green-400 w-full sm:w-auto"
                              onClick={() => HadleEditButton(index)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-4 py-2 text-[12px] text-white rounded-lg transition-colors duration-300 bg-red-500 hover:bg-red-400 w-full sm:w-auto"
                              onClick={() => HandleRemoveButton(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Remark Section */}
                        <div className="w-full bg-gray-50 border-t border-gray-200 px-4 py-2">
                          <p className="text-[12px] text-gray-600 italic">
                            <span className="font-bold">Remark:</span>{" "}
                            {data.remark || "No remark"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div>
                    <p className="font-semibold mb-2">{editItemName}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Order Quantity */}
                      <div>
                        <label className="w-full font-semibold text-[13px]">
                          Order quantity{" "}
                          <strong className="text-red-500 text-[12px]">
                            *
                          </strong>
                        </label>
                        <input
                          type="number"
                          value={editCount}
                          min="1"
                          onChange={(e) => setEditCount(e.target.value)}
                          className="w-full p-2 mt-2 text-[12px] border rounded-md"
                          placeholder="Order quantity"
                        />
                      </div>

                      {/* Device Selection */}
                      <div>
                        <label className="w-full font-semibold text-[13px]">
                          Choose Device
                        </label>
                        <select
                          name="device"
                          value={cartData?.[editItemIndex].device.deviceId}
                          onChange={(e) => {
                            const selectedDevice = devices.find(
                              (d) => d._id === e.target.value
                            );
                            if (selectedDevice && cartData) {
                              const updatedCart = [...cartData];
                              updatedCart[editItemIndex] = {
                                ...updatedCart[editItemIndex],
                                device: {
                                  deviceId: selectedDevice._id,
                                  deviceName: selectedDevice.title,
                                },
                              };
                              setCartData(updatedCart);
                            }
                          }}
                          className="w-full p-2 mt-2 text-[12px] border rounded-md"
                        >
                          <option value="None">None</option>
                          {devices.length !== 0 &&
                            devices.map((d, index) => (
                              <option key={index} value={d._id}>
                                {d.title}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Delivery Date */}
                      <div>
                        <label className="w-full font-semibold text-[13px]">
                          Delivery Date{" "}
                          <strong className="text-red-500 text-[12px]">
                            *
                          </strong>
                        </label>
                        <input
                          type="date"
                          value={cartData?.[editItemIndex]?.deliveryDate || ""}
                          min={today}
                          onChange={(e) => {
                            const updatedCart = [...cartData];
                            updatedCart[editItemIndex] = {
                              ...updatedCart[editItemIndex],
                              deliveryDate: e.target.value,
                            };
                            setCartData(updatedCart);
                          }}
                          className="w-full p-2 mt-2 text-[12px] border rounded-md"
                        />
                      </div>

                      {/* Remark Textarea */}
                      <div className="md:col-span-2">
                        <label className="w-full font-semibold text-[13px]">
                          Remark
                        </label>
                        <textarea
                          value={cartData?.[editItemIndex]?.remark || ""}
                          onChange={(e) => {
                            const updatedCart = [...cartData];
                            updatedCart[editItemIndex] = {
                              ...updatedCart[editItemIndex],
                              remark: e.target.value,
                            };
                            setCartData(updatedCart);
                          }}
                          className="w-full p-2 mt-2 text-[12px] border rounded-md h-20 resize-none"
                          placeholder="Add remark..."
                        />
                      </div>
                    </div>
                  </div>
                )}
                {editItemIndex == null
                  ? UserType !== "Customer" && (
                      <div className="text-right font-semibold">
                        Total Price: ${totalPrice}
                      </div>
                    )
                  : null}

                <div className="flex justify-end mt-6  space-x-4">
                  <button
                    className="px-4 py-3 text-[12px] w-full bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                    onClick={
                      editItemIndex == null
                        ? HandleCloseButton
                        : HandleEditCloseButton
                    }
                  >
                    Cancel
                  </button>
                  {editItemIndex == null ? (
                    <button
                      className="px-4 py-3 w-full text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
                      onClick={RequestOrderButton}
                    >
                      Confirm Order
                    </button>
                  ) : (
                    <button
                      className="px-4 py-3 w-full text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
                      onClick={HandleSaveEdit}
                    >
                      Save Changes
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-row items-center md:justify-start justify-between gap-5">
            <p
              style={{ color: colors.grey[100] }}
              className="mt-10 text-lg font-semibold"
            >
              Cart is Empty
            </p>
            <button
              onClick={HandleCloseButton}
              className="px-4 mt-10 py-2 text-[12px] text-white rounded-lg transition-colors duration-300 bg-green-500 hover:bg-green-400"
            >
              View Products
            </button>
          </div>
        )
      ) : null}

      {isImageModalOpen && (
        <ImageModal
          isOpen={isImageModalOpen}
          imageUrl={orderData?.imageUrl || []}
          altText={selectedImageAlt}
          onClose={closeImageModal}
          startIndex={currentIndex}
        />
      )}

      {/* Customer PopUp */}
      {isCustomerPopupOpen && (
        <CustomerPopUp
          productId={orderData._id}
          assignedCustomers={orderData.assignedUsers || []}
          reFresh={(updatedList: string[]) => HandleRefresh(updatedList)}
          onClose={() => setIsCustomerPopupOpen(false)}
        />
      )}
    </div>
  );
};

export default EShop;
