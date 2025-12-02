import React, { useEffect, useState } from "react";
import {
  AreaChartCom,
  PageHeader,
  Barchart,
  CounterCard,
} from "../../components/molecules";
import { useTheme } from "../../context/Theme/ThemeContext";
import "./home.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import axios from "axios";
//import { useToast } from "../../context/Alert/AlertContext";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

type Counts = {
  _id?: string;
  companyName?: string;
  adminCount: string;
  moderatorCount: string;
  customerCount: string;
  deviceCount: string;
  managerCount: string;
  productCount: string;
};

type Product = {
  _id: string;
  productName: string;
  skuNumber: string;
  inventory: string;
  minCount: string;
  category: string;
  imageUrl: string[];
  dateCreated: string;
};

// Add OrderType for recent orders
type OrderSummary = {
  _id: string;
  userName: string;
  totalPrice: string;
  dateCreated?: string;
  orderCount: string;
  productName: string;
  productImageUrl?: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const Home: React.FC = () => {
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

  const Token = savedUserData?.accessToken;
  const UserType = savedUserData?.userType;
  const CompanyId = savedUserData?.companyId;
  const UserId = savedUserData?.userId;
  const SessionType = savedUserData?.sessionType;
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { baseUrl } = useBaseUrl();
  const [counts, setCounts] = useState<Counts[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  if (colors) {
    document.documentElement.style.setProperty(
      "--border-color",
      colors.grey[100]
    );
    document.documentElement.style.setProperty(
      "--bg-color",
      colors.primary[400]
    );
  }

  useEffect(() => {
    if (!Token) {
      console.log("run this");
      navigate("/");
    } else {
      FetchData();
    }
  }, []);

  const FetchData = async () => {
    let url = "";
    try {
      if (UserType === "SuperAdmin") {
        url = `${baseUrl}/summary/counts/companies/all`;
      } else if (UserType === "Admin" || UserType === "Moderator") {
        url = `${baseUrl}/summary/count/company/${CompanyId}`;
      }

      const countsResponse = await axios.get(url, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
      if (countsResponse.data.status) {
        let data = countsResponse.data.data;

        // Ensure Admin/Moderator response is wrapped in array
        if (!Array.isArray(data)) data = [data];

        setCounts(data);
      }

      // Fetch products for Admin and Moderator only
      if (UserType === "Admin" || UserType === "Moderator") {
        const productsResponse = await axios.get(
          `${baseUrl}/products/company/${CompanyId}`,
          {
            headers: {
              token: `Bearer ${Token}`,
            },
          }
        );

        if (productsResponse.data.status) {
          const products: Product[] = productsResponse.data.products;

          // Filter low stock products (below 150 units)
          const lowStock = products.filter(
            (product) => Number(product.inventory) < Number(product.minCount)
          );
          setLowStockProducts(lowStock);

          // Get recent products (last 5 added)
          const recent = products
            .sort(
              (a, b) =>
                new Date(b.dateCreated).getTime() -
                new Date(a.dateCreated).getTime()
            )
            .slice(0, 5);
          setRecentProducts(recent);

          let url = "";

          if (UserType === "Admin" || UserType === "Moderator") {
            url = `${baseUrl}/orders/company/${CompanyId}`;
          }

          // Fetch recent pending orders (last 5)
          const ordersResponse = await axios.get(url, {
            headers: {
              token: `Bearer ${Token}`,
            },
          });
          if (ordersResponse.data.status) {
            const orders = ordersResponse.data.orders || [];
            // Include all recent orders (new requests, pending, etc.)
            const recentOrdersList = orders.filter(
              (order: any) =>
                order.orderStatus === "new_request" ||
                order.orderStatus === "pending" ||
                order.orderStatus === "Pending"
            );
            const orderSummaries: OrderSummary[] = recentOrdersList
              .sort(
                (a: any, b: any) =>
                  new Date(b.dateCreated).getTime() -
                  new Date(a.dateCreated).getTime()
              )
              .slice(0, 5)
              .map((order: any) => {
                // Find latest user name by userId

                // Get product info

                return {
                  _id: order._id,
                  userName: order.userName,
                  totalPrice: order.totalPrice,
                  dateCreated: order.dateCreated,
                  orderCount: order.orderCount,
                  productName: order.productName,
                  productImageUrl:
                    order?.productImags?.[0] || "/unknown-product.png",
                };
              });
            setRecentOrders(orderSummaries);
          }
        }
      }
    } catch (error: any) {
      console.log(error);
      //notify(error.response.data.error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: colors.grey[100] }}>
      <PageHeader title="HOME" subTitle="" />
      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : UserType !== "SuperAdmin" ? (
        <div className="grid gap-5 grid-cols-12 mt-5 auto-rows-min ">
          <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12">
            {counts.length > 0 ? (
              counts.map((count) => (
                <CounterCard
                  key={count._id || count.companyName}
                  data={{
                    _id: count._id || "?",
                    companyName: count.companyName || "Non",
                    adminCount: count.adminCount,
                    moderatorCount: count.moderatorCount,
                    managerCount: count.managerCount,
                    customerCount: count.customerCount,
                    deviceCount: count.deviceCount,
                    productCount: count.productCount,
                  }}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-400">
                No Data Found!
              </p>
            )}
          </div>

          {/* Enhanced Recent Orders - Only for Admin and Moderator */}
          {(UserType === "Admin" || UserType === "Moderator") && (
            <div className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 p-5 rounded-lg box">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="py-2 font-semibold lg:text-xl"
                  style={{ color: colors.grey[100] }}
                >
                  Recent Orders
                </span>
                <span className="text-sm text-purple-400 font-semibold">
                  {recentOrders.length} items
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer"
                        style={{ background: "#fff", color: "#111" }}
                        onClick={() =>
                          SessionType === "Secondary"
                            ? navigate(
                                `/orders?userId=${UserId}&companyId=${CompanyId}`
                              )
                            : navigate("/orders")
                        }
                      >
                        <img
                          src={order.productImageUrl}
                          alt={order.productName}
                          className="w-12 h-12 object-cover rounded border border-gray-300"
                          onError={(e) => {
                            e.currentTarget.src = "/unknown-product.png";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {order.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Customer: {order.userName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Order quantity: {order.orderCount}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.dateCreated
                              ? `Ordered: ${new Date(
                                  order.dateCreated
                                ).toLocaleDateString()}`
                              : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-blue-600 font-bold text-lg">
                            ${order.totalPrice}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-center">
                      No recent orders
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Low Stock Products - Only for Admin and Moderator */}
          {(UserType === "Admin" || UserType === "Moderator") && (
            <div className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 p-5 rounded-lg box">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="py-2 font-semibold lg:text-xl"
                  style={{ color: colors.grey[100] }}
                >
                  Low Stock Products
                </span>
                <span className="text-sm text-red-400 font-semibold">
                  {lowStockProducts.length} items
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product._id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer`}
                        style={{ background: "#fff", color: colors.grey[900] }}
                        onClick={() =>
                          SessionType === "Secondary"
                            ? navigate(
                                `/e-shop?userId=${UserId}&companyId=${CompanyId}`
                              )
                            : navigate("/e-shop")
                        }
                      >
                        <div
                          className="w-12 h-12 flex items-center justify-center rounded border-2 border-gray-700 bg-gray-900 overflow-hidden"
                          style={{ background: colors.primary[700] }}
                        >
                          <img
                            src={
                              product.imageUrl?.[0] || "/unknown-product.png"
                            }
                            alt={product.productName}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/unknown-product.png";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-sm truncate"
                            style={{ color: "#111" }}
                          >
                            {product.productName}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: "#222" }}
                          >
                            Lead Time: {product.skuNumber}
                          </p>
                          <p className="text-xs" style={{ color: "#333" }}>
                            {product.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-red-400 font-bold text-lg">
                            {product.inventory}
                          </span>
                          <p className="text-xs text-gray-400">PO Balance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-center">
                      No low stock products
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Products - Only for Admin and Moderator */}
          {(UserType === "Admin" || UserType === "Moderator") && (
            <div className="col-span-12 md:col-span-12 lg:col-span-4 row-span-2 p-5 rounded-lg box">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="py-2 font-semibold lg:text-xl"
                  style={{ color: colors.grey[100] }}
                >
                  Recently Added Products
                </span>
                <span className="text-sm text-blue-400 font-semibold">
                  {recentProducts.length} items
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recentProducts.length > 0 ? (
                  <div className="space-y-3">
                    {recentProducts.map((product) => (
                      <div
                        key={product._id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer`}
                        style={{ background: "#fff", color: colors.grey[900] }}
                        onClick={() =>
                          SessionType === "Secondary"
                            ? navigate(
                                `/e-shop?userId=${UserId}&companyId=${CompanyId}`
                              )
                            : navigate("/e-shop")
                        }
                      >
                        <div
                          className="w-12 h-12 flex items-center justify-center rounded border-2 border-gray-700 bg-gray-900 overflow-hidden"
                          style={{ background: colors.primary[700] }}
                        >
                          <img
                            src={
                              product.imageUrl?.[0] || "/unknown-product.png"
                            }
                            alt={product.productName}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/unknown-product.png";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-sm truncate"
                            style={{ color: "#111" }}
                          >
                            {product.productName}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: "#222" }}
                          >
                            Lead Time: {product.skuNumber}
                          </p>
                          <p className="text-xs" style={{ color: "#333" }}>
                            {product.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            Added:{" "}
                            {new Date(product.dateCreated).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400 font-bold text-lg">
                            {product.inventory}
                          </span>
                          <p className="text-xs text-gray-400">PO Balance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-center">
                      No recent products
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="col-span-12 lg:col-span-6 p-5 rounded-lg box ">
            <span
              className="py-2 font-semibold lg:text-xl"
              style={{ color: colors.grey[100] }}
            >
              Devices Count of Recent Customers (30 Days)
            </span>
            <AreaChartCom />
          </div>
          <div className="col-span-12 lg:col-span-6 p-5 rounded-lg box">
            <span
              className="py-2 font-semibold text-center lg:text-xl"
              style={{ color: colors.grey[100] }}
            >
              Statistics of Recent Devices
            </span>
            <Barchart />
          </div>
        </div>
      ) : (
        <div className="p-10 flex-col md:flex-row justify-center gap-5 items-start">
          {counts.length > 0 ? (
            counts.map((count) => (
              <div className="mt-5">
                <CounterCard
                  data={{
                    _id: count._id || "?",
                    companyName: count.companyName || "Non",
                    adminCount: count.adminCount,
                    moderatorCount: count.moderatorCount,
                    managerCount: count.managerCount,
                    customerCount: count.customerCount,
                    deviceCount: count.deviceCount,
                    productCount: count.productCount,
                  }}
                />
              </div>
            ))
          ) : (
            <p>No Compnay Found!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
