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

// User Type Definition
type User = {
  _id: string;
  fullName: string;
};

// Product Type Definition
type Product = {
  _id: string;
  productName: string;
};

// Manager Rule Type Definition
type ProductRule = {
  _id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  userImageUrl?: string;
  userId: string;
  userName: string;
  imageUrl: string;
  companyId?: string;
  assignedById: string;
  assignedByName: string;
  dateCreated: string;
  dateUpdated: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const ProductRule: React.FC = () => {
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

  const [productRules, setProductRules] = useState<ProductRule[]>([]);
  const [newProductRule, setNewProductRule] = useState({
    productIds: [] as string[],
    image: null as File | null,
    selectedProducts: [] as Product[],
    userId: "",
    userName: "",
  });
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");

  const { notify } = useToast();
  const { baseUrl } = useBaseUrl();
  const { colors, theme } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      FetchData();
      FetchProductsAndCustomers();
    }
  }, [Token]);

  // ---------- Function to Fetch Manager Rules Data ----------
  const FetchData = async () => {
    try {
      setLoading(true);
      const productRulesResponce = await axios.get(
        `${baseUrl}/product-rules/company/${CompanyId}`,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );
      if (productRulesResponce.data.status) {
        setProductRules(productRulesResponce.data.productRules);
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

  // ---------- Function to get Managers and Customers ----------
  const FetchProductsAndCustomers = async () => {
    try {
      const productsResponse = await axios.get(
        `${baseUrl}/products/company/${CompanyId}`,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );
      if (productsResponse.data.status) {
        setProducts(productsResponse.data.products);
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
    }
  };

  const HandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      setNewProductRule((prevUser) => ({
        ...prevUser,
        image: files[0],
      }));
    }
  };

  // ---------- Function to Upload Image ----------
  const ImageUpload = async () => {
    if (!newProductRule.image) {
      return null;
    }
    const data = {
      file: newProductRule.image,
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

  // ---------- Function to Create New Product Rules for Multiple Products ----------
  const CreateProductRules = async () => {
    const ImageUrl = await ImageUpload();
    
    // Create a rule for each selected product
    try {
      for (const productId of newProductRule.productIds) {
        const data = {
          productId: productId,
          imageUrl:
            ImageUrl !== null
              ? `${baseUrl.replace("/api", "")}/uploads/${ImageUrl}`
              : null,
          userId: newProductRule.userId,
          assignedBy: UserId,
          companyId: CompanyId,
        };
        
        const response = await axios.post(
          `${baseUrl}/product-rules/create`,
          data,
          {
            headers: {
              token: `Bearer ${Token}`,
            },
          }
        );

        if (!response.data.status) {
          throw new Error(response.data.error?.message || "Failed to create rule");
        }
      }
      
      Swal.fire({
        title: "",
        text: `${newProductRule.selectedProducts.length} Product Rule(s) Created Successfully!`,
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
      FetchProductsAndCustomers();
      setIsFormOpen(false);
      setNewProductRule({
        productIds: [],
        selectedProducts: [],
        image: null,
        userId: "",
        userName: "",
      });
      setProductSearchQuery("");
    } catch (error: any) {
      console.log(error);
      notify(error.response?.data?.error?.message || error.message || "An error occurred", "error");
    }
  };

  const handleSubmit = () => {
    if (newProductRule.selectedProducts.length === 0) {
      notify("Select at least one Product before saving.", "info");
      return;
    }
    if (!newProductRule.userName) {
      notify("Select Customer Name before click save button.", "info");
      return;
    }
    Swal.fire({
      title: "",
      text: `Are you sure, you want to assign ${newProductRule.selectedProducts.length} product(s) to this customer?`,
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
        CreateProductRules();
      }
    });
  };

  // Handle Add New Rule Button Click
  const handleAddNewRuleButtonClick = () => {
    if (products.length === 0) {
      notify("No Products available. Please add products first.", "info");
      return;
    }
    if (customers.length === 0) {
      notify("No Customers available. Please add customers first.", "info");
      return;
    }
    setIsFormOpen(true);
  };

  // Handle Image Click to open modal
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

  // Handel cancel button click
  const handleCancelButtonClick = () => {
    setIsFormOpen(false);
    setNewProductRule({
      productIds: [],
      selectedProducts: [],
      image: null,
      userId: "",
      userName: "",
    });
    setProductSearchQuery("");
  };

  // Toggle product selection
  const toggleProductSelection = (product: Product) => {
    const isSelected = newProductRule.productIds.includes(product._id);
    
    if (isSelected) {
      setNewProductRule({
        ...newProductRule,
        productIds: newProductRule.productIds.filter(id => id !== product._id),
        selectedProducts: newProductRule.selectedProducts.filter(p => p._id !== product._id),
      });
    } else {
      setNewProductRule({
        ...newProductRule,
        productIds: [...newProductRule.productIds, product._id],
        selectedProducts: [...newProductRule.selectedProducts, product],
      });
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const statusChange = () => {};

  // Define columns for Manager Rules page
  const columns: GridColDef[] = [
    {
      field: "productProfile",
      headerName: "Product",
      minWidth: 300,
      renderCell: (params: any) => {
        return (
          <div className="flex items-center w-full h-full space-x-3">
            <img
              className="w-[40px] h-[40px] object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              src={
                params.row.productImageUrl
                  ? params.row.productImageUrl
                  : Images.unknownProduct
              }
              alt="Manager Profile"
              onClick={() =>
                handleImageClick(
                  params.row.productImageUrl || Images.unknownProduct,
                  `${params.row.productName}'s Image`
                )
              }
            />
            <span className="font-bold text-gray-800">
              {params.row.productName}
            </span>
          </div>
        );
      },
    },
    {
      field: "customerProfile",
      headerName: "Customer",
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
              alt="Customer Profile"
              onClick={() =>
                handleImageClick(
                  params.row.userImageUrl || Images.unknownUser,
                  `${params.row.userName}'s Profile`
                )
              }
            />
            <span className="font-bold text-gray-700">
              {params.row.userName}
            </span>
          </div>
        );
      },
    },
    // ...(UserType === "SuperAdmin"
    //   ? [
    //       {
    //         field: "companyName",
    //         headerName: "Company",
    //         minWidth: 250,
    //         renderCell: (params: any) => (
    //           <span className="font-semibold text-gray-800">
    //             {params.value || "N/A"}
    //           </span>
    //         ),
    //       },
    //     ]
    //   : []),
    // {
    //   field: "imageUrl",
    //   headerName: "Rule Image",
    //   minWidth: 150,
    //   renderCell: (params: any) => (
    //     <img
    //       className="w-[40px] h-[40px] object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
    //       src={params.value ? params.value : Images.unknownRule}
    //       alt="Rule"
    //       onClick={() =>
    //         handleImageClick(params.value || Images.unknownRule, "Rule Image")
    //       }
    //     />
    //   ),
    // },
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
    <div>
      {" "}
      {/* Page Header */}
      <div className="flex items-center justify-between gap-10 lg:justify-start">
        <PageHeader title="PRODUCT RULES MANAGEMENT" subTitle="" />
        {(UserType === "SuperAdmin" || UserType === "Admin") && !isLoading && (
          <button
            onClick={handleAddNewRuleButtonClick}
            className={`bg-orange-400 px-4 py-3 text-[12px] rounded-md hover:bg-orange-300 duration-300 transition-colors`}
          >
            Add New Product Rule
          </button>
        )}
      </div>
      {/* Data Table */}
      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : (
        <div>
          {productRules.length > 0 ? (
            <div className="min-h-[75vh] mt-5 overflow-y-auto">
              <DataTable
                slug="product-rules"
                columns={columns}
                rows={productRules}
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
          <div className="w-full p-8 bg-white rounded-lg max-h-[90vh] overflow-y-auto lg:w-3/4">
            <h2 className="mb-4 text-lg font-bold text-center text-black">
              Add New Product Rule
            </h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Product Selection Panel */}
              <div className="lg:col-span-2">
                <label className="w-full font-semibold text-[13px]">
                  Select Products{" "}
                  <strong className="text-red-500 text-[12px]">*</strong>
                </label>
                
                {/* Search Bar */}
                <input
                  type="text"
                  title="Search products"
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full p-2 mt-2 border text-[12px] rounded-md focus:outline-none focus:border-blue-400"
                />
                
                {/* Products List Panel */}
                <div className="w-full p-3 mt-2 border rounded-md bg-gray-50 max-h-[250px] overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    <div className="space-y-2">
                      {filteredProducts.map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                          onClick={() => toggleProductSelection(product)}
                        >
                          <input
                            type="checkbox"
                            title={`Select ${product.productName}`}
                            checked={newProductRule.productIds.includes(product._id)}
                            onChange={() => toggleProductSelection(product)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label className="ml-3 text-sm font-medium text-gray-800 cursor-pointer flex-1">
                            {product.productName}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No products found
                    </p>
                  )}
                </div>
                
                {/* Selected Products Display */}
                {newProductRule.selectedProducts.length > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-2">
                      Selected Products ({newProductRule.selectedProducts.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {newProductRule.selectedProducts.map((product) => (
                        <span
                          key={product._id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full"
                        >
                          {product.productName}
                          <button
                            type="button"
                            onClick={() => toggleProductSelection(product)}
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

              {/* Right Column: Customer & Image */}
              <div className="flex flex-col gap-5">
                {/* Customer Name */}
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Customer Name{" "}
                    <strong className="text-red-500 text-[12px]">*</strong>
                  </label>
                  <select
                    title="Select customer"
                    value={newProductRule.userId}
                    onChange={(e) =>
                      setNewProductRule({
                        ...newProductRule,
                        userId: e.target.value,
                        userName: e.target.selectedOptions[0].text,
                      })
                    }
                    className="w-full p-2 mt-2 border text-[12px] rounded-md focus:outline-none focus:border-blue-400"
                  >
                    <option value="">None</option>
                    {customers.length > 0 &&
                      customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.fullName}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="w-full font-semibold text-[13px]">
                    Choose Image
                  </label>
                  <input
                    type="file"
                    title="Upload image"
                    onChange={HandleFileChange}
                    className="w-full p-2 mt-2 border text-[12px] rounded-md focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-5">
              <button
                className="px-4 py-3 text-[12px] w-full lg:w-auto bg-gray-400 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                onClick={handleCancelButtonClick}
              >
                Cancel
              </button>
              <button
                className="px-4 py-3 w-full lg:w-auto text-[12px] text-white bg-blue-400 hover:bg-blue-300 transition-colors duration-300 rounded-lg"
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

export default ProductRule;
