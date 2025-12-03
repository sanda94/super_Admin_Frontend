import React, { useState } from "react";
import {
  FaRegEdit,
  FaChevronLeft,
  FaChevronRight,
  FaCartPlus,
  FaEye,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import ImageModal from "../ImageModal/ImageModal";
import { useLocation } from "react-router-dom";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

// Product card props
interface ProductCardProps {
  skuNumber: string;
  productName: string;
  imageUrl: string[];
  description: string;
  price: string;
  salePrice: string;
  inventory: string;
  assignedCustomers: string[];
  onEdit: () => void;
  onDelete: () => void;
  onOrder: () => void;
  onView: () => void;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const ProductCard: React.FC<ProductCardProps> = ({
  skuNumber,
  productName,
  imageUrl,
  description,
  price,
  salePrice,
  inventory,
  onEdit,
  onDelete,
  onOrder,
  onView,
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
  const UserType = savedUserData?.userType;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? imageUrl.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === imageUrl.length - 1 ? 0 : prevIndex + 1
    );
  };

  const showSlider = imageUrl && imageUrl.length > 1;
  const showSingleImage = imageUrl && imageUrl.length === 1;

  const handleImageClick = (altText: string) => {
    setSelectedImageAlt(altText);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageAlt("");
  };

  return (
    <div className="max-w-[300px] min-w-[300px] relative mt-5 bg-white rounded-lg max-h-[450px] min-h-[380px] shadow-lg border border-gray-300">
      <div
        className="relative w-full h-[150px] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {(imageUrl && imageUrl.length > 0) || "" || null ? (
          <>
            <img
              src={imageUrl[currentIndex]}
              alt="Product"
              className="w-full h-full rounded-t-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleImageClick(`${productName} product images`)}
            />
            {(showSlider || showSingleImage) && isHovered && (
              <>
                {showSlider && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full"
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full"
                    >
                      <FaChevronRight />
                    </button>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 rounded-t-lg flex items-center justify-center text-gray-500">
            No image
          </div>
        )}
      </div>
      <div className="px-4 py-2 mt-4">
        <p className="text-[13px] overflow-hidden line-clamp-1 font-bold">
          <span className="font-bold text-black">SKU Number:</span> <span className="font-bold text-black">{skuNumber}</span>
        </p>
        <p className="text-[18px] mt-2 font-bold overflow-hidden line-clamp-1">
          {productName}
        </p>
        <p className="overflow-hidden line-clamp-2 text-[13px]">
          {description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            {UserType !== "Customer" && (
              <>
                <p className="text-[15px] font-semibold ">${salePrice}</p>
                <p className="text-[13px] italic line-through text-gray-500 ">
                  ${price}
                </p>
              </>
            )}
          </div>
          <p className="text-green-500 text-[15px]">PO Balance {inventory} </p>
        </div>
      </div>
      <div className="absolute bottom-0 w-full flex items-center justify-end gap-3 px-4 py-4">
        {UserType === "Customer" ? (
          <button
            className="px-4 py-2 text-white w-full text-[12px] bg-green-500 hover:bg-green-400 rounded-md"
            onClick={onOrder}
          >
            <div className="flex items-center gap-1 justify-center">
              <FaCartPlus size={15} />
              <span>Order</span>
            </div>
          </button>
        ) : null}

        {UserType === "Admin" ? (
          <div className="flex items-center w-full gap-3">
            <button
              className="px-4 py-2 text-white w-full text-[12px] bg-yellow-500 hover:bg-yellow-400 rounded-md"
              onClick={onView}
            >
              <div className="flex items-center gap-1 justify-center">
                <FaEye size={15} />
                <span>View</span>
              </div>
            </button>
            <button
              className="px-4 py-2 text-white w-full text-[12px] bg-blue-500 hover:bg-blue-400 rounded-md"
              onClick={onEdit}
            >
              <div className="flex items-center gap-1 justify-center">
                <FaRegEdit size={15} />
                <span>Edit</span>
              </div>
            </button>
            <button
              className="px-4 py-2 text-white w-full text-[12px] bg-red-500 hover:bg-red-400 rounded-md"
              onClick={onDelete}
            >
              <div className="flex items-center gap-1 justify-center">
                <MdDelete size={15} />
                <span>Delete</span>
              </div>
            </button>
          </div>
        ) : null}

        {UserType === "Moderator" ? (
          <div className="flex items-center w-full gap-3">
            <button
              className="px-4 py-2 text-white w-full text-[12px] bg-yellow-500 hover:bg-yellow-400 rounded-md"
              onClick={onView}
            >
              <div className="flex items-center gap-1 justify-center">
                <FaEye size={15} />
                <span>View</span>
              </div>
            </button>
            <button
              className="px-4 py-2 text-white w-full text-[12px] bg-blue-500 hover:bg-blue-400 rounded-md"
              onClick={onEdit}
            >
              <div className="flex items-center gap-1 justify-center">
                <FaRegEdit size={15} />
                <span>Edit</span>
              </div>
            </button>
          </div>
        ) : null}

        {UserType === "Manager" || UserType === "SuperAdmin" ? (
          <div className="flex items-center w-full gap-3">
            <button
              className="px-4 py-2 text-white w-full text-[12px] bg-yellow-500 hover:bg-yellow-400 rounded-md"
              onClick={onView}
            >
              <div className="flex items-center gap-1 justify-center">
                <FaEye size={15} />
                <span>View</span>
              </div>
            </button>
            {/* <button
              className="px-4 py-2 text-white w-full text-[12px] bg-blue-500 hover:bg-blue-400 rounded-md"
              onClick={onEdit}
            >
              <div className="flex items-center gap-1 justify-center">
                <FaRegEdit size={15} />
                <span>Edit</span>
              </div>
            </button> */}
          </div>
        ) : null}
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        imageUrl={imageUrl}
        altText={selectedImageAlt}
        startIndex={currentIndex}
      />
    </div>
  );
};

export default ProductCard;
