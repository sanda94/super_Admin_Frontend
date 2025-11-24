import React, { useEffect, useState, useRef } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PageHeader, SummaryCard } from "../../components/molecules";
import { useNavigate, useLocation } from "react-router-dom";
import { useBaseUrl } from "../../context/BaseUrl/BaseUrlContext";
import axios from "axios";
import { useToast } from "../../context/Alert/AlertContext";
import { useTheme } from "../../context/Theme/ThemeContext";
import DownloadExcel from "../../helper/DownloadXcel";
import DownloadPDF from "../../helper/DownloadPDF";
import { FaFileExcel, FaFilePdf } from "react-icons/fa6";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../helper/HandleLocalStorageData";

type DeviceData = {
  id: string;
  ruleId: string;
  deviceTitle: string;
  assignedProduct: string;
  category: string;
  itemCount: number;
  minItemCount: number;
  minBatteryPercentage: string;
  minBatteryVoltage: string;
  unitWeight: number;
  location: string;
  offSet: string;
  calibrationValue: string;
  status: string;
  batteryPercentage: number;
  batteryVoltage: number;
  itemCountDecreaseBy: number;
  itemCountIncreaseBy: number;
  totalWeight: number;
  poNumber: string;
  description: string;
  message: string;
  dateCreated: string;
  timeCreated: string;
};

// SortableItem component using dnd-kit
interface SortableItemProps {
  id: string;
  datas: DeviceData;
  isCompact: boolean;
  onClick: () => void;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const Summary: React.FC = () => {
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
  const UserType = savedUserData?.userType;
  const Token = savedUserData?.accessToken;
  const UserId = savedUserData?.userId;
  const CompanyId = savedUserData?.companyId;
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { baseUrl } = useBaseUrl();
  const { notify } = useToast();
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(""); // State to capture search input
  const [filteredData, setFilteredData] = useState<DeviceData[]>([]); // State for filtered data
  const [isDragEnabled, setIsDragEnabled] = useState<boolean>(false); // State for enabling/disabling drag-and-drop
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isCompact, setIsCompact] = useState<boolean>(true);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const headerRef = useRef(null);
  const [showFloatingShuffle, setShowFloatingShuffle] =
    useState<boolean>(false);

  useEffect(() => {
    if (!Token) {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    FetchData();

    const intervalId = setInterval(() => {
      FetchData();
    }, 600000);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log("Intersecting:", entry.isIntersecting);
        setShowFloatingShuffle(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    const currentHeader = headerRef.current;

    if (currentHeader) {
      observer.observe(currentHeader);
    }

    return () => {
      if (currentHeader) {
        observer.unobserve(currentHeader);
      }
    };
  }, [headerRef]);

  const FetchData = async () => {
    let Url: string;
    let Header: object;
    if (UserType === "Customer" || UserType === "Moderator") {
      Url = `${baseUrl}/device/all/summary/user`;
      Header = {
        token: `Bearer ${Token}`,
        user: UserId,
      };
    } else {
      Url = `${baseUrl}/device/all/summary/company/${CompanyId}/user/${UserId}`;
      Header = {
        token: `Bearer ${Token}`,
      };
    }
    try {
      const response = await axios.get(Url, {
        headers: Header,
      });
      if (response.data.status) {
        const devices: DeviceData[] = response.data.devices.map(
          (device: any) => ({
            ruleId: device.ruleId,
            id: device._id,
            deviceTitle: device.title,
            category: device.category,
            assignedProduct: device.assignedProduct,
            itemCount: Number(device?.deviceData?.itemCount),
            minItemCount: Number(device.minItems),
            unitWeight: String(device.unitWeight),
            minBatteryPercentage: device.minBatteryPercentage,
            minBatteryVoltage: device.minBatteryVoltage,
            batteryPercentage: Number(device?.deviceData?.batteryPercentage),
            batteryVoltage: Number(device?.deviceData?.batteryVoltage),
            itemCountDecreaseBy: Number(
              device?.deviceData?.itemCountDecreaseBy
            ),
            itemCountIncreaseBy: Number(
              device?.deviceData?.itemCountIncreaseBy
            ),
            totalWeight: Number(device?.deviceData?.totalWeight),
            location: device.location,
            offSet: device.offSet,
            calibrationValue: device.calibrationValue,
            status: device.status,
            poNumber: device.poNumber,
            description: device.description,
            message: device.message,
            dateCreated: device?.deviceData?.dateCreated,
            timeCreated: device?.deviceData?.timeCreated,
          })
        );
        console.log("Devices: ", devices);
        setDeviceData(devices);
      } else {
        notify(response.data.error.message, "error");
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const saveOrder = async (order: any) => {
    try {
      const data = {
        userId: UserId,
        orderList: order,
      };

      const response = await axios.post(
        `${baseUrl}/dnd/create-or-update`,
        data,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (response.data.status) {
        console.log(response.data.success.message);
      }
    } catch (error: any) {
      console.log(error);
      notify(error.response.data.error.message, "error");
    }
  };

  const SortableItem: React.FC<SortableItemProps> = ({
    id,
    datas,
    isCompact,
    onClick,
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="z-0"
      >
        <SummaryCard
          id={datas.id}
          deviceTitle={datas.deviceTitle ?? "Unknown Device"}
          itemCount={datas.itemCount ?? 0}
          minCount={datas.minItemCount ?? 0}
          unitWeight={datas.unitWeight ?? 0}
          location={datas.location ?? "Unknown Location"}
          status={datas.status ?? "Unknown"}
          batteryPercentage={datas.batteryPercentage ?? 0}
          poNumber={datas.poNumber ?? "None"}
          description={datas.description ?? "No description available"}
          message={datas.message ?? "None"}
          isDrag={isDragEnabled}
          isCompact={isCompact}
          onClick={onClick}
        />
      </div>
    );
  };

  // Save the deviceData order to localStorage when it changes
  const saveOrderToLocalStorage = async (data: DeviceData[]) => {
    const validData = data.filter((device) => device !== undefined); // Filter out undefined values
    const order = validData.map((device) => device.ruleId);
    await saveOrder(order);
  };

  // Handler for drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFilteredData((items) => {
        const oldIndex = items.findIndex((item) => item.ruleId === active.id);
        const newIndex = items.findIndex((item) => item.ruleId === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveOrderToLocalStorage(newItems);
        return newItems;
      });
    }
  };

  // Handler for search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Filter the data based on the search term
  useEffect(() => {
    if (deviceData.length !== 0) {
      const filtered = deviceData.filter((device) => {
        const title = device?.deviceTitle?.toLowerCase() || "";
        const location = device?.location?.toLowerCase() || "";
        const term = searchTerm?.toLowerCase() || "";
        return title.includes(term) || location.includes(term);
      });
      setFilteredData(filtered);
    }
  }, [searchTerm, deviceData]);

  // Download Excel file
  const downloadExcelFile = async () => {
    if (deviceData.length === 0) {
      notify("No data available to download.", "warning");
      return;
    }

    const mappedData = deviceData.map((device) => {
      let weightUnit = "";

      // Extract the unit from unitWeight
      if (device.unitWeight) {
        const unitWeightString = String(device.unitWeight); // Coerce to string
        const unitParts = unitWeightString.split(" ");
        if (unitParts.length > 1) {
          weightUnit = unitParts[1]; // Get the unit part (e.g., 'kg', 'lbs')
        }
      }

      return {
        id: device.id,
        title: device.deviceTitle,
        category: device.category,
        assignProduct: device.assignedProduct,
        location: device.location,
        unitWeight: device.unitWeight,
        minItems: device.minItemCount,
        batteryPercentage: device.batteryPercentage,
        batteryVoltage: device.batteryVoltage,
        totalWeight: `${device.totalWeight} ${weightUnit}`,
        itemCount: device.itemCount !== undefined ? device.itemCount : 0,
        itemCountIncreaseBy: device.itemCountIncreaseBy,
        itemCountDecreaseBy: device.itemCountDecreaseBy,
        status: device.status,
        poNumber: device.poNumber,
        dateCreated: device.dateCreated,
        timeCreated: device.timeCreated,
      };
    });

    const type = "all_devices_data";
    const url = `${baseUrl}/excel/${type}`;

    await DownloadExcel({ data: mappedData, type, url });
  };

  // Download PDF file
  const downloadPDFFile = async () => {
    if (deviceData.length === 0) {
      notify("No data available to download.", "warning");
      return;
    }

    const mappedData = deviceData.map((device) => {
      let weightUnit = "";

      // Extract the unit from unitWeight
      if (device.unitWeight) {
        const unitWeightString = String(device.unitWeight); // Coerce to string
        const unitParts = unitWeightString.split(" ");
        if (unitParts.length > 1) {
          weightUnit = unitParts[1]; // Get the unit part (e.g., 'kg', 'lbs')
        }
      }

      return {
        id: device.id,
        title: device.deviceTitle,
        category: device.category,
        assignProduct: device.assignedProduct,
        location: device.location,
        unitWeight: device.unitWeight,
        minItems: device.minItemCount,
        batteryPercentage: device.batteryPercentage,
        batteryVoltage: device.batteryVoltage,
        totalWeight: `${device.totalWeight} ${weightUnit}`,
        itemCount: device.itemCount !== undefined ? device.itemCount : 0,
        itemCountIncreaseBy: device.itemCountIncreaseBy,
        itemCountDecreaseBy: device.itemCountDecreaseBy,
        status: device.status,
        poNumber: device.poNumber,
        dateCreated: device.dateCreated,
        timeCreated: device.timeCreated,
      };
    });

    const type = "all_devices_data";
    const url = `${baseUrl}/pdf/${type}`;

    await DownloadPDF({ data: mappedData, type, url });
  };

  console.log("Filter data: ", filteredData);
  console.log(deviceData.length, "Devoce lenghth");

  return (
    <div>
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-10 lg:justify-start"
        ref={headerRef}
      >
        <PageHeader title="XORDERS" subTitle="" />
        {!isLoading && deviceData.length !== 0 ? (
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={downloadExcelFile}
              className="px-4 py-3 text-[12px] w-full md:w-auto bg-green-600 hover:bg-green-700 flex items-center justify-center gap-3 rounded-md text-white duration-300 transition-colors"
            >
              <FaFileExcel size={20} />
              Download Excel
            </button>
            <button
              onClick={downloadPDFFile}
              className="px-4 py-3 text-[12px] w-full md:w-auto bg-red-600 hover:bg-red-700 flex items-center justify-center gap-3 rounded-md text-white duration-300 transition-colors"
            >
              <FaFilePdf size={20} />
              Download PDF
            </button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col items-center w-full gap-4 md:justify-between md:flex-row">
        {/* Search Bar */}
        {!isLoading && (
          <div className="w-full mt-4 md:w-6/12 lg:w-5/12">
            <input
              type="text"
              placeholder="Search by title or location"
              className="w-full px-4 py-2 text-[12px] border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        )}
        {/* Toggle Button for Drag and Drop */}
        {!isLoading && (
          <div className="w-full md:w-auto">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`bg-orange-400 px-4 py-3 w-full text-[12px] mr-5 md:w-auto rounded-md hover:bg-orange-300 duration-300 transition-colors`}
            >
              {isCompact ? "Compact" : "Expand"}
            </button>
            <button
              className={`px-4 py-3 text-[12px] mt-2 md:mt-4 w-full md:w-auto rounded-md transition-colors duration-300 ${
                isDragEnabled
                  ? "bg-red-400 hover:bg-red-300"
                  : "bg-green-400 hover:bg-green-300"
              }`}
              onClick={() => setIsDragEnabled(!isDragEnabled)}
            >
              {isDragEnabled ? "Disable Shuffling " : " Shuffling"}
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
          {filteredData.length > 0 ? (
            isDragEnabled ? (
              // Update the SortableContext to use ruleId instead of id
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredData.map((item) => item.ruleId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className={`flex flex-wrap w-full min-h-[100vh] gap-5 overflow-y-auto z-0 
              ${
                filteredData.length >= 3
                  ? "lg:justify-start md:justify-center"
                  : filteredData.length < 3
                  ? "lg:justify-start"
                  : ""
              }`}
                  >
                    {filteredData.map((d) => (
                      <div
                        key={d.ruleId}
                        className="z-0 mt-4 sm:w-full md:w-auto"
                      >
                        <SortableItem
                          id={d.ruleId}
                          datas={d}
                          isCompact={isCompact}
                          onClick={() => {
                            setSelectedDevice(d);
                            setIsModalOpen(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div
                className={`flex flex-wrap w-full gap-5 overflow-y-auto z-0 
            ${
              filteredData.length >= 3
                ? "lg:justify-start md:justify-center"
                : filteredData.length < 3
                ? "lg:justify-start"
                : ""
            }`}
              >
                {filteredData.map((d) => (
                  <div
                    key={d.ruleId}
                    className="z-0 flex justify-center w-full mt-4 md:w-auto md:justify-start"
                  >
                    <SummaryCard
                      id={d.id}
                      deviceTitle={d.deviceTitle}
                      itemCount={d.itemCount}
                      minCount={d.minItemCount}
                      unitWeight={d.unitWeight}
                      location={d.location}
                      status={d.status}
                      batteryPercentage={d.batteryPercentage}
                      poNumber={d.poNumber}
                      description={d.description}
                      message={d.message}
                      isDrag={isDragEnabled}
                      isCompact={isCompact}
                      onClick={() => {
                        setSelectedDevice(d);
                        setIsModalOpen(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div
              style={{ color: colors.grey[100] }}
              className="mt-10 text-lg font-semibold"
            >
              No devices found...
            </div>
          )}
        </div>
      )}

      {isModalOpen && selectedDevice != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <SummaryCard
                id={selectedDevice.id}
                deviceTitle={selectedDevice.deviceTitle}
                itemCount={selectedDevice.itemCount}
                minCount={selectedDevice.minItemCount}
                unitWeight={selectedDevice.unitWeight}
                location={selectedDevice.location}
                status={selectedDevice.status}
                batteryPercentage={selectedDevice.batteryPercentage}
                poNumber={selectedDevice.poNumber}
                description={selectedDevice.description}
                message={selectedDevice.message}
                isDrag={false}
                isCompact={true}
                isView={true}
                isClose={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showFloatingShuffle && (
        <button
          onClick={() => setIsDragEnabled(!isDragEnabled)}
          className={`fixed bottom-10 sm:bottom-32 right-6 z-50 px-4 py-3 text-[12px] rounded-full shadow-lg transition-colors duration-300 ${
            isDragEnabled
              ? "bg-red-400 hover:bg-red-300"
              : "bg-green-400 hover:bg-green-300"
          }`}
        >
          {isDragEnabled ? "Disable Shuffling" : "Shuffling"}
        </button>
      )}
    </div>
  );
};

export default Summary;
