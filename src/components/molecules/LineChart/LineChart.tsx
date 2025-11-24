import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLocation } from "react-router-dom";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

// Define the type for the data prop
interface LineChartProps {
  data: Array<{
    dateCreated: string;
    itemCount: number;
    batteryPercentage: number;
  }>;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const LineChart: React.FC<LineChartProps> = ({ data }) => {
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
  return (
    <div style={{ width: "100%", height: 530 }}>
      <ResponsiveContainer>
        <RechartsLineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dateCreated" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="itemCount"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            dot={{ r: 4 }}
          />
          {UserType !== "Customer" && (
            <Line
              type="monotone"
              dataKey="batteryPercentage"
              stroke="#82ca9d"
              dot={{ r: 4 }}
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
