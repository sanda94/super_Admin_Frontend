// ---------- Imports ----------
import axios from "axios";
import { GetUserSessionBySessionType } from "./HandleLocalStorageData";

// ---------- Interface ----------
interface ActivityLogProps {
  url: string;
  category: string;
  actionType: string;
  itemId: string;
}

const ActivityLog = async ({
  url,
  category,
  actionType,
  itemId,
}: ActivityLogProps) => {
  // LocalStorage variables
  const savedUserData = GetUserSessionBySessionType("Primary");
  const UserType = savedUserData?.userType;
  const Token = savedUserData?.accessToken;
  const UserId = savedUserData?.userId;
  const UserName = savedUserData?.userName;
  const CompanyId = savedUserData?.companyId;

  const data = {
    user: {
      id: UserId,
      userType: UserType,
      name: UserName,
    },
    category,
    actionType,
    itemId,
    companyId: UserType !== "SuperAdmin" ? CompanyId : null,
  };
  try {
    await axios.post(url, data, {
      headers: {
        token: `Bearer ${Token}`,
      },
    });
  } catch (error) {
    console.error(error);
  }
};

export default ActivityLog;
