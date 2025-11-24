import axios from "axios";
import { createRoot } from "react-dom/client";
import { Scanner } from "@yudiel/react-qr-scanner";

interface GenerateQRCodeParams {
  url: string;
  userId: string;
  itemId: string;
  type: string;
  typeId: string;
  token: string;
}

// ---------- Function for generate QR Code
export const GenerateQRCode = async ({
  url,
  userId,
  itemId,
  type,
  typeId,
  token,
}: GenerateQRCodeParams): Promise<boolean | null> => {
  try {
    const response = await axios.post(
      url,
      { userId, itemId, type, typeId },
      { headers: { token: `Bearer ${token}` } }
    );

    // response.data.qrCode.qrCode is the base64 string
    if (response.data && response.data.qrCode?.qrCode) {
      return true;
    }

    return false;
  } catch (error: any) {
    console.error("Failed to generate QR code", error.response || error);
    return false;
  }
};

// ---------- Function to Scan QR Code ----------
export const ScanQRCode = async ({
  userId,
  itemId,
  typeId,
  timeout = 20000,
}: {
  userId: string;
  itemId: string;
  typeId: string;
  timeout?: number;
}): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    container.id = "qr-reader-container";
    document.body.appendChild(container);
    const root = createRoot(container);

    let scanHandled = false;

    const cleanup = () => {
      root.unmount();
      container.remove();
    };

    const handleResult = (text: string) => {
      if (scanHandled) return;
      scanHandled = true;

      try {
        if (!text) throw new Error("Empty QR content");

        let qrData: any;
        try {
          qrData = JSON.parse(text);
        } catch {
          throw new Error("QR data is not valid JSON");
        }

        const isValid =
          qrData.userId == userId &&
          qrData.itemId == itemId &&
          qrData.typeId == typeId;

        setTimeout(() => {
          cleanup();
          resolve(isValid);
        }, 600);
      } catch (err) {
        console.error("❌ Error:", err);
        setTimeout(() => {
          cleanup();
          reject(err);
        }, 600);
      }
    };

    const handleError = (err: any) => {
      console.warn("QR Scan Error:", err?.message || err);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("QR scan timed out"));
    }, timeout);

    root.render(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
        <div className="relative w-[92vw] max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden p-4">
          <h2 className="text-gray-900 text-lg font-semibold mb-3">
            Scan QR Code
          </h2>

          <div className="relative w-full h-[360px] rounded-lg overflow-hidden bg-black">
            <Scanner
              constraints={{ facingMode: "environment" }}
              scanDelay={400}
              onScan={(detectedCodes) => {
                if (
                  detectedCodes &&
                  Array.isArray(detectedCodes) &&
                  detectedCodes.length > 0
                ) {
                  const rawValue = detectedCodes[0].rawValue;
                  console.log("📦 Detected Codes:", detectedCodes);
                  clearTimeout(timer);
                  handleResult(rawValue);
                }
              }}
              onError={handleError}
              styles={{
                container: { width: "100%", height: "100%" },
                video: { width: "100%", height: "100%", objectFit: "cover" },
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-yellow-400 rounded-xl animate-pulse"></div>
            </div>
          </div>

          <button
            onClick={() => {
              clearTimeout(timer);
              cleanup();
              reject(new Error("QR scan cancelled"));
            }}
            className="mt-4 px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  });
};
