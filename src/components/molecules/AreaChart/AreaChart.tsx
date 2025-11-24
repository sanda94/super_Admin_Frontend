import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../../context/Theme/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import axios from "axios";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";

type Data = {
  userName: string;
  deviceCount: number;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const AreaChartCom: React.FC = () => {
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
  const CompanyId = savedUserData?.companyId;
  const { colors } = useTheme();
  const [chartData, setChartData] = useState<Data[]>([]);
  const navigate = useNavigate();
  const { baseUrl } = useBaseUrl();

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      FetchData();
    }
  }, [Token]);

  const FetchData = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/chart/area-chart/company/${CompanyId}`,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (response.data.status) {
        setChartData(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart width={150} height={40} data={chartData}>
        <XAxis
          dataKey="userName"
          tick={{ fill: colors.grey[100] }}
          axisLine={{ stroke: colors.grey[100] }}
        />
        <YAxis
          tick={{ fill: colors.grey[100] }}
          axisLine={{ stroke: colors.grey[100] }}
          tickFormatter={(value) => Math.round(value).toString()}
          tickCount={2}
          domain={[0, 1]}
        />
        <Tooltip
          contentStyle={{ backgroundColor: colors.primary[400] }}
          cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
        />
        <Area
          type="monotone"
          dataKey="deviceCount"
          stroke="#8884d8"
          fill={colors.blueAccent[400]}
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChartCom;
