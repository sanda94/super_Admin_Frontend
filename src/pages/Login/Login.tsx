import React, { useEffect, useState } from "react";
import { useTheme } from "../../context/Theme/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/Alert/AlertContext";
import axios from "axios";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import {
  SaveUserSession,
  GetUserSessionBySessionType,
  GetUserSessions,
} from "../../helper/HandleLocalStorageData";

const Login: React.FC = () => {
  const savedUserData = GetUserSessionBySessionType("Primary");
  const userSessions = GetUserSessions();
  console.log("User Sessions: ", userSessions);
  const [UserDetails, setUserDetails] = useState({
    emailAddress: savedUserData?.emailAddress || "",
    password: "",
    accessToken: savedUserData?.accessToken || "",
    userType: savedUserData?.userType || "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const { notify } = useToast();
  const navigate = useNavigate();
  const { baseUrl } = useBaseUrl();
  const { theme } = useTheme();

  useEffect(() => {
    if (UserDetails.accessToken && UserDetails.userType === "SuperAdmin") {
      navigate("/home");
    } else if (
      UserDetails.accessToken &&
      (UserDetails.userType === "Admin" || UserDetails.userType === "Moderator")
    ) {
      navigate("/home");
    } else if (UserDetails.accessToken && UserDetails.userType === "Customer") {
      navigate("/summary");
    } else if (UserDetails.accessToken && UserDetails.userType === "Manager") {
      navigate("/e-shop");
    } else {
      return;
    }
  }, [UserDetails.accessToken]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handelLoginButton = () => {
    if (!UserDetails.emailAddress && !UserDetails.password) {
      notify(
        "Enter Email Address and Password before clicking Login button.",
        "warning"
      );
    } else if (!UserDetails.emailAddress) {
      notify("Email Address is required.", "warning");
    } else if (!isValidEmail(UserDetails.emailAddress)) {
      notify("Please enter a valid Email Address.", "warning");
    } else if (!UserDetails.password) {
      notify("Password is required.", "warning");
    } else {
      Login();
    }
  };

  const Login = async () => {
    try {
      const response = await axios.post(`${baseUrl}/users/login`, {
        emailAddress: UserDetails.emailAddress,
        password: UserDetails.password,
      });
      if (response.data.status) {
        const userData: any = {
          emailAddress: UserDetails.emailAddress,
          userId: response.data.userId,
          userType: response.data.userType,
          userName: response.data.userName,
          accessToken: response.data.accessToken,
          sessionType: "Primary",
        };

        userData.companyId =
          response.data.userType !== "SuperAdmin"
            ? response.data.companyId
            : null;

        SaveUserSession(userData);

        if (response.data.userType === "Customer") {
          navigate("/summary");
        } else if (response.data.userType === "Manager") {
          navigate("/e-shop");
        } else {
          navigate("/home");
        }
      } else {
        notify(response.data.error.message, "error");
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response?.data?.error?.message || "Login failed", "error");
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* 🔹 Background Video with Fade Animation */}
      <video
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ease-in-out ${
          videoLoaded ? "opacity-100" : "opacity-0"
        }`}
        src="/log.mp4"
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
      ></video>

      {/* 🔹 Gradient Overlay for Better Readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/30 via-transparent to-black/50"></div>

      {/* 🔹 Additional subtle overlay for form area */}
      <div className="absolute inset-0 z-15 bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>

      {/* 🔹 Main content with enhanced glassmorphism */}
      <div className="relative z-20 flex-1 flex items-center justify-center min-w-[350px] p-4">
        <div className="w-full max-w-md px-4 sm:px-0">
          <div
            className={`w-full max-w-sm mx-auto p-6 sm:p-8 rounded-3xl backdrop-blur-xl border-2 transform hover:scale-[1.02] transition-all duration-500 ease-out relative overflow-hidden ${
              theme === "dark"
                ? "bg-white/5 border-white/10 text-white shadow-2xl shadow-black/30"
                : "bg-white/15 border-white/20 text-black shadow-2xl shadow-gray-900/10"
            }`}
          >
            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

            {/* Content with relative positioning */}
            <div className="relative z-10">
              {/* 🔹 XPAC Logo and Welcome Text */}
              <div className="text-center mb-6">
                <div className="flex justify-center items-center mb-3">
                  <img
                    src="/xpac-logo.png"
                    alt="XPAC Logo"
                    className="h-12 w-auto drop-shadow-lg transition-transform duration-700 ease-out hover:scale-110"
                  />
                </div>
              </div>

              {/* 🔹 Email Input with Glass Effect */}
              <div className="mb-4 group">
                <label
                  className={`block mb-2 text-sm font-medium transition-colors duration-300 ${
                    theme === "dark"
                      ? "text-white/80 group-hover:text-white"
                      : "text-gray-800/80 group-hover:text-gray-900"
                  }`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className={`w-full px-4 py-3 pl-12 text-sm border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all duration-300 backdrop-blur-lg group-hover:shadow-lg ${
                      theme === "dark"
                        ? "bg-white/5 border-white/10 text-white placeholder-white/50 focus:bg-white/10 shadow-inner"
                        : "bg-white/10 border-white/20 text-gray-800 placeholder-gray-700/60 focus:bg-white/20 shadow-inner"
                    }`}
                    placeholder="Enter your email"
                    value={UserDetails.emailAddress}
                    onChange={(e) =>
                      setUserDetails({
                        ...UserDetails,
                        emailAddress: e.target.value,
                      })
                    }
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400/80 text-sm drop-shadow-sm">
                    📧
                  </div>
                </div>
              </div>

              {/* 🔹 Password Input with Glass Effect */}
              <div className="mb-6 relative group">
                <label
                  className={`block mb-2 text-sm font-medium transition-colors duration-300 ${
                    theme === "dark"
                      ? "text-white/80 group-hover:text-white"
                      : "text-gray-800/80 group-hover:text-gray-900"
                  }`}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full px-4 py-3 pl-12 pr-12 text-sm border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all duration-300 backdrop-blur-lg group-hover:shadow-lg ${
                      theme === "dark"
                        ? "bg-white/5 border-white/10 text-white placeholder-white/50 focus:bg-white/10 shadow-inner"
                        : "bg-white/10 border-white/20 text-gray-800 placeholder-gray-700/60 focus:bg-white/20 shadow-inner"
                    }`}
                    placeholder="Enter your password"
                    value={UserDetails.password}
                    onChange={(e) =>
                      setUserDetails({
                        ...UserDetails,
                        password: e.target.value,
                      })
                    }
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400/80 text-sm drop-shadow-sm">
                    🔒
                  </div>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-blue-400 focus:outline-none transition-colors duration-200 hover:scale-110 drop-shadow-sm"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              </div>

              {/* 🔹 Glass Login Button */}
              <button
                className="w-full px-4 py-3 text-sm font-bold rounded-2xl text-white relative overflow-hidden backdrop-blur-lg bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-indigo-500/30 border border-white/20 hover:from-blue-500/40 hover:via-purple-500/40 hover:to-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 transform hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-lg hover:shadow-xl group"
                type="button"
                onClick={handelLoginButton}
              >
                {/* Glass highlight effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"></div>
                <span className="relative z-10 drop-shadow-md">Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Loading Fallback for Video */}
      {!videoLoaded && (
        <div className="absolute inset-0 z-5 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
      )}
    </div>
  );
};

export default Login;
