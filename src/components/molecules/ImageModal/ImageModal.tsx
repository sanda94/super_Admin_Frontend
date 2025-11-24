import React, { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | string[];
  altText?: string;
  startIndex?: number;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText = "Image",
  startIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(startIndex);
  const images = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
  const hasMultipleImages = images.length > 1;

  // Reset current index when modal opens with new images
  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex, isOpen]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black bg-opacity-50"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="relative w-full h-auto max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-lg">
        {/* Close Button */}
        <button
          className="absolute text-gray-500 transition-colors duration-300 top-2 right-2 hover:text-red-500 z-10"
          onClick={onClose}
        >
          <IoMdClose size={24} />
        </button>

        {/* Image Container */}
        <div className="relative">
          <img
            src={images[currentIndex]}
            alt={`${altText} ${currentIndex + 1}`}
            className="object-contain w-full max-h-[70vh]"
          />

          {/* Navigation Arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-3 rounded-full hover:bg-opacity-80 transition-all duration-200"
                aria-label="Previous image"
              >
                <FaChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-3 rounded-full hover:bg-opacity-80 transition-all duration-200"
                aria-label="Next image"
              >
                <FaChevronRight size={20} />
              </button>
            </>
          )}

          {/* Image Counter */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal; 