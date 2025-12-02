import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/molecules";
import { FaArrowLeft } from "react-icons/fa";
import { useTheme } from "../../context/Theme/ThemeContext";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

const useQuery = () => new URLSearchParams(useLocation().search);

const Product: React.FC = () => {
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
  const UserType = savedUserData?.userType;
  const location = useLocation();
  const navigate = useNavigate();
  const { product } = location.state || {};

  const { colors } = useTheme();

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-xl text-gray-600">Product not found.</p>
        <button
          onClick={() => navigate("/e-shop")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8" style={{ color: colors.grey[100] }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 lg:justify-start mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-3 text-[12px] bg-orange-400 rounded-md hover:bg-orange-300 duration-300 transition-colors text-black font-semibold shadow-md w-fit"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back
        </button>
        <PageHeader
          title={product.productName}
          subTitle={`Lead Time: ${product.skuNumber}`}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-8 mt-6">
        <div className="md:w-1/2">
          <img
            src={product.imageUrl?.[0] || "/unknown-product.png"}
            alt={product.productName}
            className="w-full h-auto object-cover rounded-lg shadow-lg"
          />
        </div>
        <div className="md:w-1/2 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">{product.productName}</h2>
          <p className="text-lg" style={{ color: colors.grey[300] }}>
            {product.category}
          </p>
          {UserType !== "Customer" && (
            <p className="text-3xl font-bold text-green-600 mt-2">
              ${product.salePrice}
            </p>
          )}
          <p style={{ color: colors.grey[200] }}>{product.description}</p>
          <div>
            <span className="font-semibold">PO Balance:</span>{" "}
            {product.inventory}
          </div>
          {UserType === "Admin" && (
            <>
              <div>
                <span className="font-semibold">Unit Weight:</span>{" "}
                {product.unitWeight}
              </div>
              <div>
                <span className="font-semibold">Tags:</span> {product.tags}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;
