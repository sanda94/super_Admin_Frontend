import React, { useState, useEffect } from "react";
import { PageHeader, DataTable } from "../../components/molecules";
import Swal from "sweetalert2";
import { useToast } from "../../context/Alert/AlertContext";
import axios from "axios";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/Theme/ThemeContext";
import { GridColDef } from "@mui/x-data-grid";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

// Activity Log Type Definition
type ActivityLog = {
  _id: string;
  id: string;
  userType: string;
  name: string;
  category: string;
  actionType: string;
  itemId: string;
  companyId: string;
  dateCreated: string;
  timeCreated: string;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const ActivityLog: React.FC = () => {
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
  const Token = savedUserData?.accessToken;
  const CompanyId = savedUserData?.companyId;

  // context API
  const { colors, theme } = useTheme();
  const { notify } = useToast();
  const { baseUrl } = useBaseUrl();

  // useState variables
  const [ActivityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  // others
  const navigate = useNavigate();

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      GetAllActivityLogs();
    }
  }, [Token]);

  // ---------- Function to get all activity logs ----------
  const GetAllActivityLogs = async () => {
    try {
      let activitylogUrl = "";
      if (UserType === "Admin" || UserType === "Manager") {
        activitylogUrl = `${baseUrl}/activity-logs/company/${CompanyId}`;
      } else if (UserType === "SuperAdmin") {
        activitylogUrl = `${baseUrl}/activity-logs/all`;
      } else {
        return;
      }

      const response = await axios.get(activitylogUrl, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      console.log("Response: ", response);

      if (response.data.status) {
        const formattedLogs = response.data.activityLogs.map((log: any) => ({
          _id: log._id,
          id: log.user?.id || "",
          userType: log.user?.userType || "",
          name: log.user?.name || "",
          category: log.category || "",
          actionType: log.actionType || "",
          itemId: log.itemId || "",
          companyId: log.companyId || "",
          dateCreated: log.dateCreated || "",
          timeCreated: log.timeCreated || "",
        }));

        setActivityLogs(formattedLogs);
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Function to clear activity logs ----------
  const ClearActivityLogs = async () => {
    try {
      const response = await axios.delete(
        `${baseUrl}/activity-logs/company/${CompanyId}`,
        {
          headers: { token: `Bearer ${Token}` },
        }
      );
      if (response.data.status) {
        Swal.fire({
          title: "",
          text: "Activity Logs Cleared Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });
        GetAllActivityLogs();
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  // ---------- Function to clear activity logs ----------
  const ClearButton = async () => {
    Swal.fire({
      title: "",
      text: "Are you sure you want to Clear Activity Logs?",
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
        ClearActivityLogs();
      }
    });
  };

  // Define Table columns
  const columns: GridColDef[] = [
    {
      field: "_id",
      headerName: "Log ID",
      minWidth: 230,
      flex: 1,
    },
    ...(UserType === "Manager"
      ? []
      : [
          {
            field: "id",
            headerName: "User ID",
            minWidth: 180,
            flex: 1,
          },
        ]),
    {
      field: "name",
      headerName: "User Name",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "userType",
      headerName: "User Type",
      minWidth: 130,
      flex: 1,
    },
    {
      field: "category",
      headerName: "Category",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "actionType",
      headerName: "Action Type",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "itemId",
      headerName: "Item ID",
      minWidth: 180,
      flex: 1,
    },
    ...(UserType === "SuperAdmin"
      ? [
          {
            field: "companyId",
            headerName: "Company ID",
            minWidth: 180,
            flex: 1,
          },
        ]
      : []),
    {
      field: "dateCreated",
      headerName: "Date",
      minWidth: 130,
      flex: 1,
    },
    {
      field: "timeCreated",
      headerName: "Time",
      minWidth: 130,
      flex: 1,
    },
  ];

  // chage status function
  const changeStatus = () => {};

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 lg:justify-start">
        <PageHeader title={"ACTIVITY-LOGS MANAGEMENTS"} subTitle="" />
        {UserType === "Admin" && !isLoading && (
          <div className="flex flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={ClearButton}
              className={`bg-orange-400 px-4 py-3 rounded-md text-[12px] hover:bg-orange-300 duration-300 transition-colors`}
            >
              Clear Activity Logs
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          style={{ color: colors.grey[100] }}
          className="mt-10 text-lg font-semibold"
        >
          Loading...
        </div>
      ) : (
        <div>
          {ActivityLogs.length > 0 ? (
            <div className="min-h-[100vh] mt-5 overflow-y-auto">
              <DataTable
                slug="activity-logs"
                statusChange={changeStatus}
                columns={columns}
                rows={ActivityLogs}
                fetchData={GetAllActivityLogs}
              />
            </div>
          ) : (
            <p
              style={{ color: colors.grey[100] }}
              className="mt-10 text-lg font-semibold"
            >
              No Data Available...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
