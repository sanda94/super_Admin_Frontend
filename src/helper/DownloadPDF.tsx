// ---------- Imports ----------
import axios from "axios";
import { GetUserSessionBySessionType } from "./HandleLocalStorageData";

// ---------- Interface ----------
interface DownloadPDFFunctionPropps {
  data: Array<any>;
  type: string;
  url: string;
}

// ---------- Function to Download PDF ----------
const DownloadPDF = async ({ data, type, url }: DownloadPDFFunctionPropps) => {
  const savedUserData = GetUserSessionBySessionType("Primary");
  const Token = savedUserData?.accessToken;
  const UserType = savedUserData?.userType;

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
      const downloadUrl = `${baseUrl}/downloads/${type}.pdf`;
      console.log("Attempting to download PDF from:", downloadUrl);
      window.open(downloadUrl, "_blank");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export default DownloadPDF;
