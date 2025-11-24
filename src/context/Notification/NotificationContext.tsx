import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { useBaseUrl } from "../BaseUrl/BaseUrlContext";
import { useLocation } from "react-router-dom";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

interface NotificationContextType {
  newOrdersCount: number;
  updateNewOrdersCount: () => void;
  markOrdersAsViewed: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const { baseUrl } = useBaseUrl();

  const location = useLocation();
  const useQuery = () => new URLSearchParams(location.search);

  const updateNewOrdersCount = async () => {
    try {
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
      const Token = savedUserData?.accessToken;
      const UserType = savedUserData?.userType;
      const CompanyId = savedUserData?.companyId;

      // Only fetch for Admin/Moderator users
      if (UserType === "Customer" || !Token) {
        setNewOrdersCount(0);
        return;
      }

      let url = "";

      if (UserType === "SuperAdmin") {
        url = `${baseUrl}/orders/all`;
      } else if (UserType === "Admin" || UserType === "Moderator") {
        url = `${baseUrl}/orders/company/${CompanyId}`;
      } else {
        setNewOrdersCount(0);
        return;
      }

      const response = await axios.get(url, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      if (response.data.status && response.data.orders) {
        // Count orders with 'new_request' status
        const newRequestsCount = response.data.orders.filter(
          (order: any) => order.orderStatus === "new_request"
        ).length;

        setNewOrdersCount(newRequestsCount);
      }
    } catch (error) {
      console.error("Error fetching new orders count:", error);
      setNewOrdersCount(0);
    }
  };

  const markOrdersAsViewed = () => {
    // This can be called when user visits the orders page
    // For now, we'll keep the count as it represents actual new requests
    // In a real system, you might want to track "viewed" status separately
  };

  // Update count on component mount and set up periodic updates
  useEffect(() => {
    updateNewOrdersCount();

    // Update every 30 seconds to check for new orders
    const interval = setInterval(updateNewOrdersCount, 30000);

    return () => clearInterval(interval);
  }, [baseUrl]);

  const value = {
    newOrdersCount,
    updateNewOrdersCount,
    markOrdersAsViewed,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
