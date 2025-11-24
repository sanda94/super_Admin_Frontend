import React, { useState } from "react";
import { useTheme } from "../../../context/Theme/ThemeContext";
import { useNotification } from "../../../context/Notification/NotificationContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaBars,
  FaUserTie,
  FaProductHunt,
} from "react-icons/fa";
import { ImAlarm } from "react-icons/im";
import { PiPresentationChartFill } from "react-icons/pi";
import { MdOutlineAddLocationAlt, MdFactory } from "react-icons/md";
import { TbCategoryPlus } from "react-icons/tb";
import { BsCpuFill } from "react-icons/bs";
import { CgArrowRightO, CgArrowLeftO } from "react-icons/cg";
import { RiShoppingBag3Fill } from "react-icons/ri";
import { BiWrench } from "react-icons/bi";
import { Tooltip } from "react-tooltip";
import { Images } from "../../../constants";
import { AiTwotoneShop } from "react-icons/ai";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
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
  const UserId = savedUserData?.userId;
  const CompanyId = savedUserData?.companyId;
  const UserType = savedUserData?.userType;
  const SessionType = savedUserData?.sessionType;
  const { colors } = useTheme();
  const { newOrdersCount } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (url: string) => {
    if (url === "/") {
      if (window.confirm("Are you sure to log out?")) {
        navigate(url);
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      } else {
        return;
      }
    } else {
      navigate(url);
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeSidebar = () => {
    setIsMobileMenuOpen(false);
  };

  const mainMenuItems = [
    ...(UserType !== "Customer" && UserType !== "Manager"
      ? [
          {
            name: "Home",
            icon: <FaHome />,
            path:
              SessionType == "Secondary"
                ? `/home?userId=${UserId}&companyId=${CompanyId}`
                : "/home",
          },
        ]
      : []),
    ...(UserType === "SuperAdmin"
      ? [{ name: "Companies", icon: <MdFactory />, path: "/company" }]
      : []),
    ...(UserType !== "Manager" && UserType !== "SuperAdmin"
      ? [
          {
            name: "XORDERS",
            icon: <PiPresentationChartFill />,
            path:
              SessionType == "Secondary"
                ? `/summary?userId=${UserId}&companyId=${CompanyId}`
                : "/summary",
          },
        ]
      : []),
    {
      name: "XPAC eShop",
      icon: <AiTwotoneShop />,
      path:
        SessionType == "Secondary"
          ? `/e-shop?userId=${UserId}&companyId=${CompanyId}`
          : "/e-shop",
    },
  ];

  const generalMenuItems = [
    ...(UserType !== "Customer" && UserType !== "Manager"
      ? [
          {
            name: "Users",
            icon: <FaUser />,
            path:
              SessionType == "Secondary"
                ? `/users?userId=${UserId}&companyId=${CompanyId}`
                : "/users",
          },
        ]
      : []),
    ...(UserType !== "Manager"
      ? [
          {
            name: "XORDERS Devices",
            icon: <BsCpuFill />,
            path:
              SessionType == "Secondary"
                ? `/devices?userId=${UserId}&companyId=${CompanyId}`
                : "/devices",
          },
        ]
      : []),
    ...(UserType !== "SuperAdmin"
      ? [
          {
            name: UserType == "Customer" ? "eShop Orders" : "Orders",
            icon: <RiShoppingBag3Fill />,
            path:
              SessionType == "Secondary"
                ? `/orders?userId=${UserId}&companyId=${CompanyId}`
                : "/orders",
          },
        ]
      : []),
    ...(UserType === "Admin"
      ? [
          {
            name: "Device Rules",
            icon: <BiWrench />,
            path:
              SessionType == "Secondary"
                ? `/rules?userId=${UserId}&companyId=${CompanyId}`
                : "/rules",
          },
        ]
      : []),
    ...(UserType === "Admin"
      ? [
          {
            name: "Manager Rules",
            icon: <FaUserTie />,
            path:
              SessionType == "Secondary"
                ? `/manager-rules?userId=${UserId}&companyId=${CompanyId}`
                : "/manager-rules",
          },
        ]
      : []),
    ...(UserType === "Admin"
      ? [
          {
            name: "Product Rules",
            icon: <FaProductHunt />,
            path:
              SessionType == "Secondary"
                ? `/product-rules?userId=${UserId}&companyId=${CompanyId}`
                : "/product-rules",
          },
        ]
      : []),
    ...(UserType === "Admin"
      ? [
          {
            name: "Category",
            icon: <TbCategoryPlus />,
            path:
              SessionType == "Secondary"
                ? `/categories?userId=${UserId}&companyId=${CompanyId}`
                : "/categories",
          },
        ]
      : []),
    ...(UserType === "Admin"
      ? [
          {
            name: "Location",
            icon: <MdOutlineAddLocationAlt />,
            path:
              SessionType == "Secondary"
                ? `/locations?userId=${UserId}&companyId=${CompanyId}`
                : "/locations",
          },
        ]
      : []),
    ...(UserType === "Admin" ||
    UserType === "SuperAdmin" ||
    UserType === "Manager"
      ? [
          {
            name: "Activity-Logs",
            icon: <ImAlarm />,
            path:
              SessionType == "Secondary"
                ? `/activity-logs?userId=${UserId}&companyId=${CompanyId}`
                : "/activity-logs",
          },
        ]
      : []),
  ];

  return (
    <div className="lg:h-full min-h-[100vh]">
      {!isMobileMenuOpen && (
        <div
          className="fixed z-50 mt-[10px] lg:hidden top-4 left-9"
          style={{ color: colors.grey[100] }}
        >
          <button
            onClick={toggleMobileMenu}
            className="text-xl transition-colors duration-300 hover:text-purple-500"
          >
            <FaBars />
          </button>
        </div>
      )}

      {/* Sidebar container */}
      <div
        className={`fixed top-0 left-0 z-40 h-full text-${
          colors.grey[100]
        } transition-all duration-300
                    ${isCollapsed ? "w-16" : "w-64"}
                    ${isMobileMenuOpen ? "w-64" : ""}
                    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0 lg:relative lg:flex flex-col lg:min-h-screen `}
        style={{
          backgroundColor: colors.primary[400],
          color: colors.grey[100],
        }}
      >
        {/* Sidebar Title */}
        <div className="flex items-center justify-between p-4 mt-3 text-xl font-bold">
          {!isCollapsed && (
            <img
              src="/traxx.png"
              alt="Logo"
              className="w-30 h-8 object-contain"
            />
          )}
          <button
            onClick={isMobileMenuOpen ? closeSidebar : toggleSidebar}
            className="text-2xl text-center transition-colors duration-300 focus:outline-none hover:text-purple-500"
          >
            {isMobileMenuOpen ? (
              <CgArrowLeftO />
            ) : isCollapsed ? (
              <CgArrowRightO />
            ) : (
              <CgArrowLeftO />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div className="flex items-center justify-center w-full mt-5 mb-5">
            <img className="w-[130px] h-auto" alt="Logo" src={Images.logo} />
          </div>
        )}
        <div className="overflow-y-auto">
          <ul
            className={`px-2 mt-3 space-y-2 ${!isCollapsed ? "mb-5" : "mb-0"}`}
          >
            <span
              style={{ color: colors.grey[100] }}
              className={`font-bold px-2 ${isCollapsed ? "hidden" : ""}`}
            >
              MAIN
            </span>
            {mainMenuItems.map((item, index) => {
              const isActive =
                location.pathname ===
                new URL(item.path, window.location.origin).pathname;
              return (
                <li
                  key={index}
                  className={`flex items-center cursor-pointer px-3 py-[5px] rounded-lg hover:text-purple-500 duration-300 transition-colors ${
                    isActive ? `text-purple-500` : ""
                  } ${!isCollapsed ? "ml-5" : "ml-0"}`}
                  onClick={() => handleNavigate(item.path)}
                >
                  <span
                    className="text-xl"
                    data-tooltip-id={`${item.name}TooltipId`}
                    data-tooltip-content={`${item.name} Page`}
                  >
                    {item.icon}
                  </span>
                  {(!isCollapsed || isMobileMenuOpen) && (
                    <span className="ml-4 font-medium">{item.name}</span>
                  )}
                  {isCollapsed && !isMobileMenuOpen && (
                    <Tooltip id={`${item.name}TooltipId`} place="right" />
                  )}
                </li>
              );
            })}
          </ul>

          <ul className={`flex-grow px-2 space-y-2`}>
            <span
              style={{ color: colors.grey[100] }}
              className={`font-bold px-2 ${isCollapsed ? "hidden" : ""}`}
            >
              GENERAL
            </span>
            {generalMenuItems.map((item, index) => {
              const isActive =
                location.pathname ===
                new URL(item.path, window.location.origin).pathname;
              return (
                <li
                  key={index}
                  className={`flex items-center cursor-pointer px-3 py-2 rounded-lg hover:text-purple-500 duration-300 transition-colors ${
                    isActive ? `text-purple-500` : ""
                  } ${!isCollapsed ? "ml-5" : "ml-0"}`}
                  onClick={() => handleNavigate(item.path)}
                >
                  <div className="relative">
                    <span
                      className="text-xl"
                      data-tooltip-id={`${item.name}TooltipId`}
                      data-tooltip-content={`${item.name} Page`}
                    >
                      {item.icon}
                    </span>
                    {/* Notification badge for Orders menu item */}
                    {(item.name === "Orders" || item.name === "My Orders") &&
                      newOrdersCount > 0 &&
                      UserType !== "Customer" && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                          {newOrdersCount > 9 ? "9+" : newOrdersCount}
                        </span>
                      )}
                  </div>
                  {(!isCollapsed || isMobileMenuOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="ml-4 font-medium">{item.name}</span>
                      {/* Notification badge for expanded sidebar */}
                      {(item.name === "Orders" || item.name === "My Orders") &&
                        newOrdersCount > 0 &&
                        UserType !== "Customer" && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold animate-pulse">
                            {newOrdersCount}
                          </span>
                        )}
                    </div>
                  )}
                  {isCollapsed && !isMobileMenuOpen && (
                    <Tooltip id={`${item.name}TooltipId`} place="right" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Logout */}
        {/* <div className="px-4 py-2">
                    <button
                        className="flex items-center justify-center w-full py-2 text-center text-white bg-red-600 rounded-lg"
                        onClick={logOut}
                        data-tooltip-id={`LogOutTooltipId`}
                        data-tooltip-content={`Log Out`}
                    >
                        {isCollapsed ? <FaSignOutAlt /> : isMobileMenuOpen ? "Log Out" : "Log Out"}
                        {isCollapsed && !isMobileMenuOpen && (
                                <Tooltip id={`LogOutTooltipId`} place='right' />
                            )}
                    </button>
                </div> */}
      </div>

      {/* Background overlay for mobile when sidebar is open */}
      {isMobileMenuOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
        ></div>
      )}
    </div>
  );
};

export default Sidebar;
