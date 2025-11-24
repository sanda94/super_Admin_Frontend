// ---------- Imports ----------
import axios from "axios";
import { GetUserSessionBySessionType } from "./HandleLocalStorageData";

// ---------- Interface ----------
interface DownloadExcelFunctionPropps {
  data: any;
  type: string;
  url: string;
}

// ---------- Function to Download Excel ----------
const DownloadExcel = async ({
  data,
  type,
  url,
}: DownloadExcelFunctionPropps) => {
  const savedUserData = GetUserSessionBySessionType("Primary");
  const Token = savedUserData?.accessToken;
  const UserType = savedUserData?.userType;
  console.log(url);
  try {
    const response = await axios.post(url, data, {
      headers: {
        token: `Bearer ${Token}`,
        usertype: UserType,
      },
    });
    console.log(response);
    if (response.data.status) {
      // Extract base URL (remove /api and everything after it)
      const baseUrl = url.split("/api")[0];
      const downloadUrl = `${baseUrl}/downloads/${type}.xlsx`;
      console.log("Attempting to download Excel from:", downloadUrl);
      window.open(downloadUrl, "_blank");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export default DownloadExcel;
