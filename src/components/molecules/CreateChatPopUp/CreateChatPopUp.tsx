import React, { useEffect, useState } from "react";
import { IoClose, IoTrash } from "react-icons/io5";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import { useToast } from "../../../context/Alert/AlertContext";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";
import axios from "axios";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../../context/Theme/ThemeContext";

interface User {
  _id: string;
  fullName: string;
  userName: string;
  userType: string;
  companyName?: string;
}

interface SuperAdminChat {
  chatId: string;
  fullName: string;
  userId: string;
  imageUrl: string;
}

interface Chat {
  _id: string;
  chatId: string;
  actors: {
    user1: {
      userId: string;
      fullName: string;
    };
    user2: {
      userId: string;
      fullName: string;
    };
  };
}

interface CreateChatPopupProps {
  onClose: () => void;
  reFreshChatList: () => void;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const CreateChatPopup: React.FC<CreateChatPopupProps> = ({
  onClose,
  reFreshChatList,
}) => {
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
  const CompanyId = savedUserData?.companyId;
  const UserId = savedUserData?.userId;
  const Token = savedUserData?.accessToken;
  const UserType = savedUserData?.userType;
  const [users, setUsers] = useState<User[]>([]);
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [superAdminChatList, setSuperAdminChatList] = useState<
    SuperAdminChat[]
  >([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { baseUrl } = useBaseUrl();
  const { notify } = useToast();
  const { theme, colors } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (Token) {
      FetchUsers();
      FetchAllChats();
    } else {
      navigate("/");
    }
  }, []);

  // ---------- Fetch all users ----------
  const FetchUsers = async () => {
    try {
      let url = "";
      if (UserType === "SuperAdmin") {
        url = `${baseUrl}/users/all/admins-superadmins/user/${UserId}`;
      } else if (UserType === "Admin") {
        url = `${baseUrl}/users/company/${CompanyId}`;
      } else {
        return;
      }
      const response = await axios.get(url, {
        headers: { token: `Bearer ${Token}` },
      });
      setUsers(response.data.users || []);
    } catch (error: any) {
      notify(
        error.response?.data?.error?.message || "Failed to load users",
        "error"
      );
    }
  };

  // ---------- Fetch all chats ----------
  const FetchAllChats = async () => {
    try {
      let url = "";
      if (UserType === "SuperAdmin") {
        url = `${baseUrl}/chat/all/user/${UserId}`;
      } else if (UserType === "Admin") {
        url = `${baseUrl}/chat/company/${CompanyId}`;
      }
      const response = await axios.get(url, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
      if (response.data.status) {
        if (UserType === "SuperAdmin") {
          setSuperAdminChatList(response.data.chats || []);
        } else if (UserType === "Admin") {
          setChatList(response.data.chatList || []);
        }
      }
    } catch (error: any) {
      notify(
        error.response?.data?.error?.message || "Failed to load chats",
        "error"
      );
    }
  };

  // ---------- Create a new chat ----------
  const CreateChat = async () => {
    if (UserType !== "SuperAdmin") {
      if (!selectedAdmin || !selectedCustomer) {
        notify("Please select both Admin/Moderator and Customer!", "error");
        return;
      }
    } else {
      if (!selectedAdmin) {
        notify("Please select a user to chat with!", "error");
        return;
      }
    }

    // ---------- Check if chat already exists ----------
    let alreadyExists = false;

    if (UserType === "SuperAdmin") {
      alreadyExists = superAdminChatList.some(
        (c) => c.userId === selectedAdmin
      );
    } else {
      alreadyExists = chatList.some(
        (chat) =>
          (chat.actors?.user1?.userId === selectedAdmin &&
            chat.actors?.user2?.userId === selectedCustomer) ||
          (chat.actors?.user1?.userId === selectedCustomer &&
            chat.actors?.user2?.userId === selectedAdmin)
      );
    }

    if (alreadyExists) {
      notify(
        UserType === "SuperAdmin"
          ? "Chat already exists with this user!"
          : "Chat already exists between these users!",
        "warning"
      );
      return;
    }

    const adminUser = users.find((u) => u._id === selectedAdmin);
    const customerUser =
      UserType === "SuperAdmin"
        ? UserId // string
        : users.find((u) => u._id === selectedCustomer);

    Swal.fire({
      title: "Create New Chat!",
      text: "Are you sure you want to create this chat?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      confirmButtonText: "Yes, Create",
      color: colors.grey[100],
    }).then(async (result) => {
      if (result.isConfirmed && adminUser && customerUser) {
        setLoading(true);
        try {
          const chatId = uuidv4();

          const data = {
            chatId,
            actors: {
              user1: {
                userId: UserType === "SuperAdmin" ? UserId : adminUser._id,
              },
              user2: {
                userId: UserType === "SuperAdmin" ? adminUser._id : UserId,
              },
            },
            companyId: UserType === "SuperAdmin" ? null : CompanyId,
          };

          const response = await axios.post(`${baseUrl}/chat/create`, data, {
            headers: { token: `Bearer ${Token}` },
          });

          if (response.data.status) {
            notify("Chat created successfully!", "success");
            FetchAllChats();
            setSelectedCustomer("");
            setSelectedAdmin("");
            reFreshChatList();
          }
        } catch (error: any) {
          notify(
            error.response?.data?.error?.message || "Failed to create chat",
            "error"
          );
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ---------- Delete chat ----------
  const DeleteChat = async (chatId: string) => {
    Swal.fire({
      title: "Delete Chat?",
      text: "Are you sure you want to delete this chat?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
      cancelButtonColor: theme === "dark" ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      confirmButtonText: "Yes, Delete",
      color: colors.grey[100],
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${baseUrl}/chat/delete/chat/${chatId}`,
            {
              headers: { token: `Bearer ${Token}` },
            }
          );
          if (response.data.status) {
            notify("Chat deleted successfully!", "success");
            FetchAllChats();
            reFreshChatList();
          }
        } catch (error: any) {
          notify(
            error.response?.data?.error?.message || "Failed to delete chat",
            "error"
          );
        }
      }
    });
  };

  console.log("Chat List: ", superAdminChatList);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3">
      <div className="bg-white rounded-lg w-full max-w-5xl shadow-lg p-6 relative flex flex-col md:flex-row gap-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-gray-600 hover:text-red-500"
        >
          <IoClose />
        </button>

        {/* Left: Create Chat */}
        <div className="w-full md:w-1/2 border-r pr-4">
          <h2 className="text-lg font-semibold mb-4 text-center">
            Create New Chat
          </h2>

          <div className="flex flex-col gap-4">
            {/* Admins and SuperAdmins List */}
            {UserType === "SuperAdmin" ? (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Select Admin / SuperAdmin
                </label>

                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm mt-1"
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                >
                  <option value="">-- Choose Admin / SuperAdmin --</option>

                  {users
                    .filter(
                      (u) =>
                        u.userType === "Admin" || u.userType === "SuperAdmin"
                    )
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.userType}) — {u.companyName || ""}
                      </option>
                    ))}
                </select>
              </div>
            ) : null}

            {/* Admin / Moderator Select */}
            {UserType === "Admin" ? (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Select Admin / Moderator / Manager
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm mt-1"
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                >
                  <option value="">
                    -- Choose Admin / Moderator / Manager --
                  </option>
                  {users
                    .filter(
                      (u) =>
                        u.userType === "Admin" ||
                        u.userType === "Moderator" ||
                        u.userType === "Manager"
                    )
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.userType})
                      </option>
                    ))}
                </select>
              </div>
            ) : null}

            {/* Customer Select */}
            {UserType === "Admin" ? (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Select Customer
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm mt-1"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">-- Choose Customer --</option>
                  {users
                    .filter((u) => u.userType === "Customer")
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.userType})
                      </option>
                    ))}
                </select>
              </div>
            ) : null}

            <button
              disabled={loading}
              onClick={CreateChat}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all duration-300"
            >
              {loading ? "Creating..." : "Create Chat"}
            </button>
          </div>
        </div>

        {/* Right: Chat List */}
        <div className="w-full md:w-1/2 pl-4">
          <h3 className="text-md font-semibold mb-2 text-center">
            Existing Chats
          </h3>
          <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-2 space-y-2">
            {/* ADMIN CHAT LIST */}
            {UserType === "Admin" && (
              <>
                {chatList.length > 0 ? (
                  chatList.map((chat) => (
                    <div
                      key={chat._id}
                      className="flex justify-between items-center border p-2 rounded-md text-sm bg-gray-50 hover:bg-gray-100 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {chat.actors?.user1?.fullName} ↔{" "}
                          {chat.actors?.user2?.fullName}
                        </span>
                        <span className="text-xs text-gray-500">
                          Chat ID: {chat.chatId}
                        </span>
                      </div>

                      <IoTrash
                        className="text-red-500 cursor-pointer text-lg hover:text-red-700"
                        onClick={() => DeleteChat(chat.chatId)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center">
                    No chats available
                  </p>
                )}
              </>
            )}

            {/* SUPER ADMIN CHAT LIST */}
            {UserType === "SuperAdmin" && (
              <>
                {superAdminChatList.length > 0 ? (
                  superAdminChatList.map((chat) => (
                    <div
                      key={chat.chatId}
                      className="flex justify-between items-center border p-2 rounded-md text-sm bg-gray-50 hover:bg-gray-100 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{chat.fullName}</span>
                        <span className="text-xs text-gray-500">
                          Chat ID: {chat.chatId}
                        </span>
                      </div>

                      <IoTrash
                        className="text-red-500 cursor-pointer text-lg hover:text-red-700"
                        onClick={() => DeleteChat(chat.chatId)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center">
                    No chats available
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChatPopup;
