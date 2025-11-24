import React from "react";
import CircularProgressBar from "../CircularProgressBar/CircularProgressBar";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TbBattery,
  TbBattery1,
  TbBattery2,
  TbBattery3,
  TbBattery4,
} from "react-icons/tb";
import { IoClose } from "react-icons/io5";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

interface SummaryCardProps {
  id: string;
  deviceTitle: string;
  itemCount: number;
  minCount: number;
  unitWeight: number;
  location: string;
  status: string;
  batteryPercentage: number;
  poNumber: string;
  description: string;
  message: string;
  isDrag: boolean;
  isCompact?: boolean;
  isView?: boolean;
  onClick?: () => void;
  isClose?: () => void;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const SummaryCard: React.FC<SummaryCardProps> = ({
  id,
  deviceTitle,
  itemCount,
  minCount,
  unitWeight,
  location,
  status,
  batteryPercentage,
  poNumber,
  description,
  message,
  isDrag,
  isCompact = true,
  isView = false,
  onClick,
  isClose,
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
  const SessionType = savedUserData?.sessionType;

  const navigate = useNavigate();

  const handelNavigate = (id: string) => {
    if (SessionType === "Secondary") {
      navigate(`/device/${id}?userId=${userId}&companyId=${companyId}`);
      return;
    }
    navigate(`/device/${id}`);
  };

  const getBatteryIcon = () => {
    if (batteryPercentage === 0) return <TbBattery />;
    if (batteryPercentage <= 40) return <TbBattery1 />;
    if (batteryPercentage <= 60) return <TbBattery2 />;
    if (batteryPercentage <= 80) return <TbBattery3 />;
    return <TbBattery4 />;
  };

  const getBatteryColor = () => {
    if (batteryPercentage <= 20) return "text-red-600";
    if (batteryPercentage <= 50) return "text-orange-600";
    if (batteryPercentage < 75) return "text-yellow-500";
    return "text-green-600";
  };

  return (
    <div
      style={{
        zIndex: 999,
        pointerEvents: isDrag ? "none" : "auto",
        opacity: isDrag ? 0.6 : 1,
      }}
      onClick={() => {
        if (!isCompact && onClick) {
          onClick();
        }
      }}
      className={`p-4 sm:p-6 rounded-lg z-30  ${
        isCompact
          ? "w-full max-w-full min-w-0 sm:min-w-[320px] md:min-w-[450px] md:max-w-[450px] cursor-pointer"
          : "max-w-[200px] w-[200px] min-w-[200px] h-[180px] min-h-[150px] max-h-[180px] cursor-pointer"
      }  relative overflow-hidden 
      ${status === "Inactive" ? "bg-red-100" : "bg-green-100"}`}
    >
      {/* Title */}
      <h2
        className="text-xl font-bold text-gray-800 truncate max-w-full cursor-default"
        title={deviceTitle}
      >
        {deviceTitle}
      </h2>

      {/* Close button */}
      {isView && (
        <div
          className="absolute top-2 right-2 text-gray-700 hover:text-red-600 cursor-pointer z-50 p-1"
          onClick={(e) => {
            e.stopPropagation();
            if (isClose) isClose();
          }}
        >
          <IoClose size={28} />
        </div>
      )}

      {/* Grid Content */}
      <div
        className={`grid gap-4 mt-4 cursor-default  ${
          !isCompact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        <div className="col-span-1">
          {isCompact ? (
            <>
              <p>
                <span
                  className="font-semibold"
                  data-tooltip-id="unitWeightTooltip"
                  data-tooltip-content={`Weight of each unit in ${unitWeight} kg`}
                >
                  Critical Level:{" "}
                  <span className="font-normal">{minCount}</span>
                </span>
              </p>
              <p>
                <span
                  className="font-semibold"
                  data-tooltip-id="locationTooltip"
                  data-tooltip-content={`Location: ${location}`}
                >
                  Location: <span className="font-normal">{location}</span>
                </span>
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 mt-5">
                <span
                  className={`px-3 py-2 sm:px-4 sm:py-3 text-[12px] text-black transition-colors duration-300 text-center rounded-lg ${
                    status === "Active" ? "bg-green-300" : "bg-red-300"
                  }`}
                  data-tooltip-id="statusTooltip"
                  data-tooltip-content={`Status: ${status}`}
                >
                  {status}
                </span>
                <button
                  onClick={() => handelNavigate(id)}
                  style={{ zIndex: 10000 }}
                  onMouseDown={(e) => e.stopPropagation()}
                  draggable={false}
                  className={`z-50 px-3 py-2 sm:px-4 sm:py-3 text-[12px] text-black bg-orange-300 transition-colors duration-300 rounded-lg ${
                    !isDrag ? "cursor-pointer hover:bg-orange-200" : ""
                  }`}
                >
                  More
                </button>
              </div>
            </>
          ) : (
            <div className=" h-full">
              <div className="flex items-center justify-center w-full h-full p-4  cursor-pointer">
                <p className="text-4xl font-bold text-center text-gray-800">
                  {isNaN(itemCount)
                    ? "?"
                    : itemCount < 10
                    ? "0" + itemCount
                    : itemCount}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        {isCompact && (
          <div
            className="flex items-center justify-center col-span-1"
            data-tooltip-id="itemCountTooltip"
            data-tooltip-content={`Item Count: ${itemCount}`}
          >
            <CircularProgressBar
              CurrentValue={String(itemCount) === "NaN" ? 0 : itemCount}
              StartValue={0}
              EndValue={itemCount > 100 ? itemCount : 100}
              LowValue={Number(minCount)}
              Units=""
              InnerColor="#F78F5E"
              TextColor="#1f2937"
              Icon=""
              Title="Quantity"
            />
          </div>
        )}
      </div>

      {/* PO Number */}
      {isCompact && (
        <div className="mb-4 sm:mb-5 cursor-default">
          <p>
            <span className="font-semibold">
              PO Number:{" "}
              <span className="font-normal">
                {poNumber !== "" ? poNumber : "None"}
              </span>
            </span>
          </p>
        </div>
      )}

      {/* Description */}
      {UserType !== "Customer" && isCompact && (
        <div className="mb-4 sm:mb-5 cursor-default">
          <p className="font-semibold">Description:</p>
          <p
            className="overflow-hidden line-clamp-2 text-ellipsis w-full"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {description}
          </p>
        </div>
      )}

      {/* Message */}
      {isCompact && (
        <div className="mb-4 sm:mb-5 cursor-default">
          <p
            className="line-clamp-2 text-ellipsis overflow-hidden w-full"
            style={{ maxHeight: "60px" }}
          >
            <strong className="font-semibold">Message:</strong> {message}
          </p>
        </div>
      )}

      {/* Battery */}
      <div className="absolute flex items-center gap-1 sm:gap-2 cursor-default bottom-2 right-2 sm:right-6">
        <span className="text-2xl sm:text-4xl">{getBatteryIcon()}</span>
        <span
          className={`text-sm sm:text-lg font-semibold ${getBatteryColor()}`}
          data-tooltip-id="batteryTooltip"
          data-tooltip-content={`${batteryPercentage}% Battery Remaining`}
        >
          {batteryPercentage}%
        </span>
      </div>
    </div>
  );
};

export default SummaryCard;
