import React from "react";
import {
  FiShield,
  FiUsers,
  FiUserCheck,
  FiUser,
  FiCpu,
  FiBox,
} from "react-icons/fi";
import { useTheme } from "../../../context/Theme/ThemeContext";

interface CounterData {
  _id: string;
  companyName: string;
  adminCount: string;
  moderatorCount: string;
  managerCount: string;
  customerCount: string;
  deviceCount: string;
  productCount: string;
}

const CounterCard: React.FC<{ data: CounterData }> = ({ data }) => {
  const { colors, theme } = useTheme();

  const items = [
    {
      label: "Admins",
      count: data.adminCount,
      icon: (
        <FiShield
          className={`w-6 h-6 ${
            theme === "dark" ? "text-blue-400" : "text-blue-600"
          }`}
        />
      ),
    },
    {
      label: "Moderators",
      count: data.moderatorCount,
      icon: (
        <FiUsers
          className={`w-6 h-6 ${
            theme === "dark" ? "text-purple-400" : "text-purple-600"
          }`}
        />
      ),
    },
    {
      label: "Managers",
      count: data.managerCount,
      icon: (
        <FiUserCheck
          className={`w-6 h-6 ${
            theme === "dark" ? "text-green-400" : "text-green-600"
          }`}
        />
      ),
    },
    {
      label: "Customers",
      count: data.customerCount,
      icon: (
        <FiUser
          className={`w-6 h-6 ${
            theme === "dark" ? "text-yellow-400" : "text-yellow-600"
          }`}
        />
      ),
    },
    {
      label: "Devices",
      count: data.deviceCount,
      icon: (
        <FiCpu
          className={`w-6 h-6 ${
            theme === "dark" ? "text-orange-400" : "text-orange-600"
          }`}
        />
      ),
    },
    {
      label: "Products",
      count: data.productCount,
      icon: (
        <FiBox
          className={`w-6 h-6 ${
            theme === "dark" ? "text-pink-400" : "text-pink-600"
          }`}
        />
      ),
    },
  ];

  return (
    <div
      className="p-5 rounded-xl shadow-lg"
      style={{
        color: colors.grey[100],
        backgroundColor: colors.primary[400],
      }}
    >
      <h2 className="text-xl font-bold mb-5 text-center">
        {data.companyName} - Summary
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 p-4 rounded-xl shadow hover:shadow-xl transition-all duration-300 hover:scale-[1.03] cursor-pointer"
            style={{ backgroundColor: colors.grey[700] }}
          >
            <div
              className="p-3 rounded-full border"
              style={{
                borderColor: colors.grey[300],
              }}
            >
              {item.icon}
            </div>

            <div>
              <p className="text-sm">{item.label}</p>
              <p className="text-2xl font-bold">{item.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CounterCard;
