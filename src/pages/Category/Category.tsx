import React, { useState, useEffect } from "react";
import { DataTable, PageHeader } from "../../components/molecules";
import { useTheme } from "../../context/Theme/ThemeContext";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import { useNavigate, useLocation } from "react-router-dom";
import { GridColDef } from "@mui/x-data-grid";
import axios from "axios";
import { useToast } from "../../context/Alert/AlertContext";
import Swal from "sweetalert2";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

// Company type
type Company = {
  _id: string;
  companyName: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const Category: React.FC = () => {
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
  const { colors, theme } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const { baseUrl } = useBaseUrl();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [categoryData, setCategoryData] = useState<
    {
      _id: string;
      category: string;
      companyId?: string;
      companyName?: string;
      description: string;
    }[]
  >([]);
  const [category, setCategory] = useState<{
    category: string;
    description: string;
    companyId?: string;
  }>({
    category: "",
    description: "",
  });
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

  // Function to fetch all categories
  const FetchData = async () => {
    try {
      let url = "";
      if (UserType === "SuperAdmin") {
        url = `${baseUrl}/categories/all`;
      } else if (UserType === "Admin" || UserType === "Moderator") {
        url = `${baseUrl}/categories/company/${CompanyId}`;
      }
      const response = await axios.get(url, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
      if (response.data.status) {
        const dataResponse = response.data.categories;
        const transformerCategories = dataResponse.map((category: any) => {
          let companyName = "";
          if (UserType === "SuperAdmin" && companies.length > 0) {
            const company = companies.find((c) => c._id === category.companyId);
            companyName = company?.companyName || "Unknown Company";
          }

          return {
            ...category,
            companyName: companyName,
          };
        });

        setCategoryData(transformerCategories);
      } else {
        console.log(response.data.error.message);
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all companies
  const GetAllCompanies = async () => {
    try {
      const response = await axios.get(`${baseUrl}/companies/all`, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
      if (response.data.status) {
        setCompanies(response.data.companies);
      } else {
        console.log(response.data.error.message);
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const CreateCategory = async () => {
    const data = {
      category: category.category,
      description: category.description,
      companyId: UserType === "SuperAdmin" ? category.companyId : CompanyId,
    };

    try {
      const response = await axios.post(`${baseUrl}/categories/create`, data, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      if (response.data.status) {
        Swal.fire({
          title: "",
          text: "New Category Created Successfully!",
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

  const HandleSubmit = () => {
    if (!category.category) {
      notify("Add category before click save button", "info");
      return;
    }
    if (!category.description) {
      notify("Add description before click save button", "info");
      return;
    }
    Swal.fire({
      title: "",
      text: "Are you sure you want to Create New Category?",
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
        CreateCategory();
      }
    });
  };

  // Define columns for Categories page
  const columns: GridColDef[] = [
    {
      field: "category",
      headerName: "Category",
      minWidth: 250,
      renderCell: (params: any) => (
        <span className="font-bold text-gray-800 text-lg">{params.value}</span>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      minWidth: 300,
      renderCell: (params: any) => (
        <span className="truncate max-w-[250px] block text-gray-600 italic">
          {params.value || "No description available"}
        </span>
      ),
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
  ];

  const statusChange = () => {};

  return (
    <div className="z-[100]">
      <div className="flex items-center justify-between gap-10 lg:justify-start">
        <PageHeader title="CATEGORIES MANAGEMENT" subTitle="" />
        {(UserType === "SuperAdmin" || UserType === "Admin") && !isLoading && (
          <button
            onClick={() => setIsFormOpen(true)}
            className={`bg-orange-400 px-4 py-3 text-[12px] rounded-md hover:bg-orange-300 duration-300 transition-colors`}
          >
            Add New Category
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
          {categoryData.length > 0 ? (
            <div className="min-h-[75vh] mt-5 overflow-y-auto">
              <DataTable
                slug="categories"
                columns={columns}
                rows={categoryData}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black bg-opacity-50">
          <div className="w-full p-8 bg-white rounded-lg lg:w-2/3">
            <h2 className="mb-4 text-lg font-bold text-center text-black">
              Add New Category
            </h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Category */}
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  placeholder="Category"
                  onChange={(e) =>
                    setCategory({ ...category, category: e.target.value })
                  }
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
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
                      setCategory({ ...category, companyId: e.target.value })
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
              {/* Description */}
              <div>
                <label className="w-full font-semibold text-[13px]">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  onChange={(e) =>
                    setCategory({ ...category, description: e.target.value })
                  }
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                className="px-4 py-3 bg-gray-300 text-[12px] w-full rounded-md hover:bg-gray-400"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-3 text-white text-[12px] w-full bg-blue-500 rounded-md hover:bg-blue-600"
                onClick={HandleSubmit}
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

export default Category;
