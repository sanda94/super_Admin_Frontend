import { useEffect, useState, useRef } from "react";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  matchPath,
} from "react-router-dom";
import "./App.css";
import {
  Device,
  Devices,
  EditProfile,
  Home,
  Login,
  Product,
  Products,
  Profile,
  Rules,
  Summary,
  Users,
  Category,
  Location,
  EShop,
  Orders,
  Error,
  Company,
  ActivityLog,
  ManagerRule,
  ProductRule,
} from "./pages";
import { useTheme } from "./context/Theme/ThemeContext";
import {
  NotificationProvider,
  useNotification,
} from "./context/Notification/NotificationContext";
import { Footer, Sidebar, Chat } from "./components/molecules";
import { GrSun } from "react-icons/gr";
import { FiMoon } from "react-icons/fi";
//import { FaUserCog } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { BiSolidUser } from "react-icons/bi";
import Swal from "sweetalert2";
import { FaPowerOff } from "react-icons/fa6";
import { MdOutlineChat } from "react-icons/md";
import { MdOutlineMarkUnreadChatAlt } from "react-icons/md";
import { RiShoppingBag3Fill } from "react-icons/ri";
import { useToast } from "./context/Alert/AlertContext";
import io from "socket.io-client";
import {
  GetUserSessionBySessionType,
  ClearUserSession,
  GetUserSessionByUserIdAndCompanyId,
} from "./helper/HandleLocalStorageData";

// Use environment-based Socket.IO URL (same logic as BaseUrlContext)
const getSocketUrl = () => {
  // COMMENTED OUT FOR DEVELOPMENT - Check if we're in production (deployed environment)
  if (
    window.location.hostname === "www.xpac.online" ||
    window.location.hostname === "xpac.online" ||
    window.location.protocol === "https:"
  ) {
    return "https://www.xpac.online";
  } else {
    // Development environment (localhost) - Currently using for development
    return "http://localhost:5000";
  }
};

const socket = io(getSocketUrl(), {
  path: "/socket/",
  transports: ["websocket"],
  withCredentials: true,
});

const useQuery = () => new URLSearchParams(useLocation().search);

function AppContent() {
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
  const UserId = savedUserData?.userId || "";
  const UserType = savedUserData?.userType;
  const SessionType = savedUserData?.sessionType;
  const CompanyId = savedUserData?.companyId;
  const { theme, colors, toggleTheme } = useTheme();
  const { newOrdersCount } = useNotification();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const location = useLocation();
  const { notify } = useToast();
  const navigate = useNavigate();

  const isChatOpenRef = useRef(isChatOpen);

  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);

  const definedRoutes = [
    "/",
    "/home",
    "/devices",
    "/device/:deviceId",
    "/product",
    "/products",
    "/users/:userId",
    "/rules",
    "/summary",
    "/users",
    "/edit-profile",
    "/categories",
    "/locations",
    "/e-shop",
    "/orders",
    "/company",
    "/activity-logs",
    "/manager-rules",
    "/product-rules",
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigate = (url: string) => {
    navigate(url);
  };

  const logOut = () => {
    Swal.fire({
      title: "",
      text: "Are you sure to log out?",
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
        ClearUserSession(UserId);
        navigate("/");
      }
    });
  };

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    if (!UserId) return; // Prevent running if no user
    socket.on("connect", () => {
      console.log("✅ Connected to socket server:", socket.id);
      socket.emit("user-online", UserId);
    });

    socket.on("notify_user", (data) => {
      console.log("📢 Notification received:", data);
      if (!isChatOpenRef.current) {
        setHasUnreadMessages(true);
        localStorage.setItem(`chatNotification_${UserId}`, "true");
        setUnreadMessageCount((prevCount) => {
          const newCount = prevCount + 1;
          localStorage.setItem(
            `unreadMessageCount_${UserId}`,
            newCount.toString()
          );
          return newCount;
        });
        notify(`${data.senderName} sent a new message`, "info");
        // Play notification sound
        const audio = new Audio("/whatsapp_notification.mp3");
        audio.play().catch((e) => console.error("Error playing sound:", e));
      }
    });

    return () => {
      socket.off("connect");
      socket.off("notify_user");
    };
  }, [UserId]);

  useEffect(() => {
    if (!UserId) return;

    if (isChatOpen) {
      socket.emit("user-online", UserId);
      console.log("📡 user-online emitted", UserId);
    } else {
      socket.emit("user-offline", UserId);
      console.log("📴 user-offline emitted", UserId);
    }
  }, [isChatOpen, UserId]);

  useEffect(() => {
    socket.on("update-user-status", (onlineUserIds: string[]) => {
      setOnlineUsers(onlineUserIds);
    });

    return () => {
      socket.off("update-user-status");
    };
  }, []);

  useEffect(() => {
    if (!UserId) return;

    if (isChatOpen) {
      socket.emit("user-online", UserId);
      console.log("📡 user-online emitted", UserId);
    } else {
      socket.emit("user-offline", UserId);
      console.log("📴 user-offline emitted", UserId);
    }
  }, [isChatOpen, UserId]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setHasUnreadMessages(false);
    localStorage.setItem(`chatNotification_${UserId}`, "false");
    setUnreadMessageCount(0);
    localStorage.setItem(`unreadMessageCount_${UserId}`, "0");
  };

  const isDefinedRoute = definedRoutes.some((path) =>
    matchPath({ path, end: true }, location.pathname)
  );

  useEffect(() => {
    if (UserId) {
      const savedNotification = localStorage.getItem(
        `chatNotification_${UserId}`
      );
      setHasUnreadMessages(savedNotification === "true");

      const savedCount = localStorage.getItem(`unreadMessageCount_${UserId}`);
      setUnreadMessageCount(savedCount ? parseInt(savedCount, 10) : 0);
    }
  }, [UserId]);

  return isDefinedRoute ? (
    <div
      className="flex w-full min-h-screen"
      style={{
        backgroundColor: theme === "dark" ? colors.primary[500] : "#fcfcfc",
      }}
    >
      <div className="fixed h-[100vh] top-0 left-0 z-50">
        {location.pathname !== "/" && (
          <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        )}
      </div>
      {isChatOpen ? (
        <div>
          <Chat
            onlineUserIds={onlineUsers}
            closeChat={() => setIsChatOpen(false)}
          />
        </div>
      ) : null}

      <main
        className={`flex flex-col min-h-[100vh] ml-0 flex-1 pt-6 relative transition-all duration-500 overflow-y-auto ${
          location.pathname !== "/" && isCollapsed
            ? "lg:ml-[60px]"
            : location.pathname !== "/"
            ? "lg:ml-[250px]"
            : "ml-0 items-center justify-center"
        }`}
      >
        <div
          className="fixed top-0 right-0 z-40 flex items-center justify-between w-full gap-6 px-8 py-4"
          style={{
            color: colors.grey[100],
            backgroundColor:
              location.pathname != "/" ? colors.primary[400] : "",
          }}
        >
          {location.pathname === "/" ? (
            <div className="w-[70px] h-[70px] mr-auto">
              <img src="/lsanda.svg" alt="icon" className="w-full h-full" />
            </div>
          ) : null}
          <div
            className={`${location.pathname === "/" ? "" : "ml-auto"}`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <div
                className={`flex items-center cursor-pointer px-3 py-2 rounded-lg text-xl hover:text-purple-500 duration-300 transition-colors`}
                data-tooltip-id="theme"
                data-tooltip-content={`Change Theme`}
              >
                <FiMoon />
              </div>
            ) : (
              <div
                className={`flex items-center cursor-pointer px-3 py-2 rounded-lg text-xl hover:text-purple-500 duration-300 transition-colors`}
                data-tooltip-id="theme"
                data-tooltip-content={`Change Theme`}
              >
                <GrSun />
              </div>
            )}
          </div>
          <div
            className={`${
              location.pathname === "/" ? "hidden" : null
            } flex items-center justify-end`}
          >
            {/* <div
            className={`
                ${location.pathname === "/edit-profile" ? "text-purple-500" : ""}
                flex items-center cursor-pointer px-3 py-2 rounded-lg text-xl hover:text-purple-500 duration-300 transition-colors
            `}
            onClick={() => handleNavigate(`/edit-profile`)}
            data-tooltip-id="edit"
            data-tooltip-content={`Edit Profile`}
          >
            <FaUserCog />
          </div> */}
            {/* Order Notifications Button */}
            {UserType !== "Customer" && UserType !== "SuperAdmin" && (
              <button
                className={`w-[50px] h-[50px] rounded-full shadow-lg flex items-center justify-center transition-colors duration-300 mr-2
                  ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-white hover:bg-gray-100"
                  }
                  ${newOrdersCount > 0 ? "text-orange-500" : ""}
              `}
                onClick={() => {
                  if (SessionType === "Secondary") {
                    handleNavigate(
                      `/orders?userId=${UserId}&companyId=${CompanyId}`
                    );
                  } else {
                    handleNavigate("/orders");
                  }
                }}
                data-tooltip-id="ordersTooltipId"
                data-tooltip-content="New Orders"
              >
                <div className="relative">
                  <RiShoppingBag3Fill size={25} />
                  {newOrdersCount > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-[5px] animate-pulse">
                      {newOrdersCount > 9 ? "9+" : newOrdersCount}
                    </span>
                  )}
                </div>
              </button>
            )}

            {/* Chat Button */}
            {UserType === "Admin" && SessionType === "Secondary" ? null : (
              <button
                className={`w-[50px] h-[50px] rounded-full shadow-lg flex items-center justify-center transition-colors duration-300 
                ${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-white hover:bg-gray-100"
                }
                ${hasUnreadMessages ? "text-green-500" : ""}
            `}
                onClick={handleOpenChat}
                data-tooltip-id="chatTooltipId"
                data-tooltip-content="Chat"
              >
                {hasUnreadMessages ? (
                  <div className="relative">
                    <MdOutlineMarkUnreadChatAlt size={25} />
                    {unreadMessageCount > 0 && (
                      <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-[5px]">
                        {unreadMessageCount}
                      </span>
                    )}
                  </div>
                ) : (
                  <MdOutlineChat size={25} />
                )}
              </button>
            )}
            {SessionType !== "Secondary" ? (
              <div
                className={`
              ${
                location.pathname === `/users/${UserId}`
                  ? "text-purple-500"
                  : ""
              }
              flex items-center cursor-pointer px-3 py-2 rounded-lg text-xl hover:text-purple-500 duration-300 transition-colors
            `}
                onClick={() => handleNavigate(`/users/${UserId}`)}
                data-tooltip-id="view"
                data-tooltip-content={`View Profile`}
              >
                <BiSolidUser />
              </div>
            ) : null}
            <div
              className={` 
              flex items-center cursor-pointer px-3 py-2 rounded-lg text-xl hover:text-purple-500 duration-300 transition-colors
            `}
              onClick={logOut}
              data-tooltip-id="logout"
              data-tooltip-content={`Log Out`}
            >
              <FaPowerOff />
            </div>
          </div>
        </div>
        <div className="px-8 pt-20 pb-36">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/device/:deviceId" element={<Device />} />
            <Route path="/product" element={<Product />} />
            <Route path="/products" element={<Products />} />
            <Route path="/users/:userId" element={<Profile />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/users" element={<Users />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/categories" element={<Category />} />
            <Route path="/locations" element={<Location />} />
            <Route path="/e-shop" element={<EShop />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/company" element={<Company />} />
            <Route path="/activity-logs" element={<ActivityLog />} />
            <Route path="/manager-rules" element={<ManagerRule />} />
            <Route path="/product-rules" element={<ProductRule />} />
            <Route path="/error" element={<Error />} />
          </Routes>
        </div>
        <div className="absolute bottom-0 w-full">
          <Footer />
        </div>
      </main>

      {/* Tooltip Components */}
      <Tooltip id="theme" place="bottom" className="z-40" />
      <Tooltip id="edit" place="bottom" className="z-40" />
      <Tooltip id="view" place="bottom" className="z-40" />
      <Tooltip id="ordersTooltipId" place="bottom" className="z-40" />
      <Tooltip id="chatTooltipId" place="bottom" className="z-40" />
      <Tooltip id="logout" place="bottom-end" className="z-40" />
    </div>
  ) : (
    <Error />
  );
}

// Main App component that provides notification context
function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
