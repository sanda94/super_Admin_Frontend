import React, { useState, useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { IoMdSend } from "react-icons/io";
import { RiDeleteBin5Fill, RiChatNewLine } from "react-icons/ri";
import { Images } from "../../../constants";
import { useNavigate, useLocation } from "react-router-dom";
import { useBaseUrl } from "../../../context/BaseUrl/BaseUrlContext";
import { useToast } from "../../../context/Alert/AlertContext";
import Swal from "sweetalert2";
import { useTheme } from "../../../context/Theme/ThemeContext";
import { v4 as uuidv4 } from "uuid";
import io from "socket.io-client";
import axios from "axios";
import ImageModal from "../ImageModal/ImageModal";
import {
  GetUserSessionBySessionType,
  GetUserSessionByUserIdAndCompanyId,
} from "../../../helper/HandleLocalStorageData";
import CreateChatPopup from "../CreateChatPopUp/CreateChatPopUp";

interface ChatProps {
  onlineUserIds: string[];
  closeChat: () => void;
}

// Types
type ChatList = {
  userId: string;
  fullName: string;
  imageUrl: string;
  chatId: string;
  lastMessageTimestamp?: string;
};

type ChatMessage = {
  chatId: string;
  messageId: string;
  message: string;
  sender: { senderId: string };
  receiver: { receiverId: string };
  sendDate: string;
  sendTime: string;
  status: string;
};

const socket = io("http://localhost:5000", {
  path: "/socket/",
  transports: ["websocket"],
  withCredentials: true,
});

const useQuery = () => new URLSearchParams(useLocation().search);

const Chat: React.FC<ChatProps> = ({ onlineUserIds, closeChat }) => {
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
  const UserId = savedUserData?.userId;
  const UserName = savedUserData?.userName;
  const Token = savedUserData?.accessToken;
  const UserType = savedUserData?.userType;
  const navigate = useNavigate();
  const { notify } = useToast();
  const { baseUrl } = useBaseUrl();
  const { colors, theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);

  const [chatList, setChatList] = useState<ChatList[]>([]);
  const [createChatFormOpen, setCreateChatFormOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedChat, setSelectedChat] = useState<ChatList | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");
  const [newMessages, setNewMessages] = useState<{ [chatId: string]: number }>(
    {}
  );
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const [currentView, setCurrentView] = useState<"list" | "chat">("list");

  useEffect(() => {
    if (!Token) {
      navigate("/");
    } else {
      GetChatList();
    }
  }, []);

  // ---------- Function to get chat list ----------
  const GetChatList = async () => {
    try {
      const response = await axios.get(`${baseUrl}/chat/all/user/${UserId}`, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      // ✅ Use correct key: response.data.chats
      if (response.data.status && response.data.chats?.length > 0) {
        const chatListWithTimestamps = await Promise.all(
          response.data.chats.map(async (chat: any) => {
            try {
              const messagesResponse = await axios.get(
                `${baseUrl}/chat/all/${chat.chatId}`,
                {
                  headers: {
                    token: `Bearer ${Token}`,
                  },
                }
              );

              if (
                messagesResponse.data.status &&
                messagesResponse.data.data?.chat &&
                messagesResponse.data.data.chat.length > 0
              ) {
                const lastMessage =
                  messagesResponse.data.data.chat[
                    messagesResponse.data.data.chat.length - 1
                  ];

                const lastMessageTimestamp = `${lastMessage.sendDate}T${lastMessage.sendTime}:00`;
                return { ...chat, lastMessageTimestamp };
              }
            } catch (error) {
              console.error(
                `Failed to fetch messages for chat ${chat.chatId}:`,
                error
              );
            }
            return chat;
          })
        );

        const sortedChats = chatListWithTimestamps.sort((a: any, b: any) => {
          const dateA = new Date(a.lastMessageTimestamp || 0);
          const dateB = new Date(b.lastMessageTimestamp || 0);
          return dateB.getTime() - dateA.getTime();
        });

        const firstChat = sortedChats[0];
        setChatList(sortedChats);
        setSelectedChat(firstChat);
        GetChatMessages(firstChat.chatId);
      } else {
        setChatList([]);
        setSelectedChat(null);
        setChatMessages([]);
      }
    } catch (error: any) {
      console.log(error);
      notify(
        error.response?.data?.error?.message || "Failed to fetch chats",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------- Function to get chat messages ----------
  const GetChatMessages = async (chatId: string) => {
    try {
      const response = await axios.get(`${baseUrl}/chat/all/${chatId}`, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });

      if (response.data.status && response.data.data?.chat) {
        const messagesWithChatId: ChatMessage[] = response.data.data.chat.map(
          (msg: any) => ({
            ...msg,
            chatId: response.data.data.chatId,
          })
        );

        setChatMessages(messagesWithChatId);
      } else {
        setChatMessages([]);
      }
    } catch (error: any) {
      console.log(error);
      notify(
        error.response?.data?.error?.message || "Failed to load messages",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------- Function to Save message ----------
  const SaveChatMessage = async () => {
    if (!message.trim() || !UserId || !UserName || !selectedChat?.userId)
      return;

    const chatId = selectedChat?.chatId || uuidv4();
    const messageId = uuidv4();

    const now = new Date();
    const sendDate = now.toISOString().split("T")[0];
    const sendTime = now.toTimeString().split(" ")[0].slice(0, 5);

    const newMessage = {
      chatId: chatId,
      messageId: messageId,
      message: message,
      sender: { senderId: UserId },
      receiver: { receiverId: selectedChat.userId || "" },
      sendDate: sendDate,
      sendTime: sendTime,
      status: "sent",
    };

    // Show message instantly and update chat list order
    setChatMessages((prev) => [...prev, newMessage]);
    setMessage("");

    setChatList((prevChatList) => {
      const now = new Date().toISOString();
      const updatedList = prevChatList.map((chat) =>
        chat.chatId === chatId ? { ...chat, lastMessageTimestamp: now } : chat
      );
      // Sort the list to bring the updated chat to the top
      return updatedList.sort((a, b) => {
        const dateA = new Date(a.lastMessageTimestamp || a.chatId);
        const dateB = new Date(b.lastMessageTimestamp || b.chatId);
        return dateB.getTime() - dateA.getTime();
      });
    });

    const payload = {
      chatId: chatId,
      actors: {
        user1: {
          userId: UserId,
          userName: UserName,
        },
        user2: {
          userId: selectedChat?.userId,
          userName: selectedChat?.fullName,
        },
      },
      chat: {
        messageId: messageId,
        message: message,
        sender: { senderId: UserId },
        receiver: { receiverId: selectedChat?.userId },
        sendDate: sendDate,
        sendTime: sendTime,
        status: "sent",
      },
    };

    // Emit socket message
    socket.emit("send_message", {
      ...newMessage,
      chatId,
      senderName: UserName,
    });

    // Join new chat room if not already joined
    if (!selectedChat?.chatId) {
      socket.emit("join_chat", chatId);
    }

    try {
      await axios.post(`${baseUrl}/chat/save-message`, payload, {
        headers: {
          token: `Bearer ${Token}`,
        },
      });
    } catch (error: any) {
      console.error("Message send error:", error);
      notify(
        error.response?.data?.error?.message || "Message send failed",
        "error"
      );
    }
  };

  // ---------- Function to handel delete message button ----------
  const HandleDeleteMessageButton = async (messageId: string) => {
    Swal.fire({
      title: "",
      text: "Are you sure to Delete This Message?",
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
        DeleteMessageByMessageId(messageId);
      }
    });
  };

  // ---------- Function to delete chat message ----------
  const DeleteMessageByMessageId = async (messageId: string) => {
    try {
      const responce = await axios.delete(
        `${baseUrl}/chat/delete/chat/${selectedChat?.chatId}/message/${messageId}`,
        {
          headers: {
            token: `Bearer ${Token}`,
          },
        }
      );

      if (responce.data.status) {
        Swal.fire({
          title: "",
          text: "Message Delete Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === "dark" ? "#86D293" : "#73EC8B",
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false,
        });

        setChatMessages((prev) =>
          prev.filter((msg) => msg.messageId !== messageId)
        );
        socket.emit("delete_message", {
          messageId,
          chatId: selectedChat?.chatId,
        });
      }
    } catch (error: any) {
      console.error("Message send error:", error);
      notify(
        error.response?.data?.error?.message || "Message send failed",
        "error"
      );
    }
  };

  const formatChatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatSendTime = (timeString: string): string => {
    const [hourStr, minute] = timeString.split(":");
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // Convert 0 to 12
    return `${hour}:${minute} ${ampm}`;
  };

  const groupedMessages = chatMessages.reduce((acc, msg) => {
    if (!acc[msg.sendDate]) acc[msg.sendDate] = [];
    acc[msg.sendDate].push(msg);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  const sortedDates = Object.keys(groupedMessages).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const handleChatSelect = (chat: any) => {
    // Only clear messages and reload if switching to a different chat
    if (selectedChat?.chatId !== chat.chatId) {
      setChatMessages([]);
      setSelectedChat(chat);
      // Switch to chat view on mobile
      setCurrentView("chat");
    } else {
      // If clicking the same chat, just switch to chat view on mobile
      setCurrentView("chat");
    }

    setNewMessages((prev) => {
      const updated = { ...prev };
      delete updated[chat.chatId]; // clear count
      return updated;
    });
  };

  const handleCreateChatButton = () => {
    setCreateChatFormOpen(true);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (selectedChat && selectedChat.chatId) {
      GetChatMessages(selectedChat.chatId);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (selectedChat?.chatId) {
      socket.emit("join_chat", selectedChat.chatId);
    }
  }, [selectedChat]);

  useEffect(() => {
    const handleReceiveMessage = (data: ChatMessage) => {
      // Skip if this message is from the current user (to prevent duplicates)
      if (data.sender.senderId === UserId) {
        return;
      }

      if (selectedChat && data.chatId === selectedChat.chatId) {
        // If the message is for the currently selected chat
        setChatMessages((prev) => [...prev, data]);
      } else {
        // If the message is for a different chat
        setNewMessages((prev) => ({
          ...prev,
          [data.chatId]: (prev[data.chatId] || 0) + 1,
        }));
      }

      setChatList((prevChatList) => {
        const now = new Date().toISOString();
        const chatToUpdateIndex = prevChatList.findIndex(
          (chat) => chat.chatId === data.chatId
        );

        if (chatToUpdateIndex > -1) {
          const updatedChat = {
            ...prevChatList[chatToUpdateIndex],
            lastMessageTimestamp: now,
          };
          const updatedList = [...prevChatList];
          updatedList.splice(chatToUpdateIndex, 1);
          updatedList.unshift(updatedChat);
          return updatedList;
        } else {
          // If chat is not found (e.g., first message from a new user),
          // we need to refetch the chat list to get the new chat details.
          GetChatList();
          return prevChatList; // Return current list while refetching
        }
      });
    };

    const handleDeleteMessage = ({ messageId }: { messageId: string }) => {
      setChatMessages((prev) =>
        prev.filter((msg) => msg.messageId !== messageId)
      );
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_deleted", handleDeleteMessage);

    // Cleanup on unmount
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_deleted", handleDeleteMessage);
    };
  }, [selectedChat?.chatId]);

  useEffect(() => {
    if (!selectedChat?.chatId) return;

    socket.emit("seen-messages", {
      chatId: selectedChat.chatId,
      receiverId: UserId,
    });

    const handleMessagesSeen = () => {
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.receiver.receiverId === UserId ? { ...msg, status: "seen" } : msg
        )
      );
    };

    socket.on("seen-messages", handleMessagesSeen);

    return () => {
      socket.off("seen-messages", handleMessagesSeen);
    };
  }, [selectedChat?.chatId, UserId]);

  const handleImageClick = (imageUrl: string, altText: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageAlt(altText);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageUrl("");
    setSelectedImageAlt("");
  };

  const goBackToList = () => {
    setCurrentView("list");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-50 lg:p-5">
      <div className="w-full h-full max-h-[95vh] bg-white rounded-lg shadow-lg lg:w-4/5 lg:max-w-6xl lg:h-auto lg:max-h-[85vh] lg:min-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
          <div className="flex gap-10">
            {UserType === "Admin" || UserType === "SuperAdmin" ? (
              <button
                onClick={handleCreateChatButton}
                className="text-2xl text-gray-600 hover:text-purple-500"
              >
                <RiChatNewLine />
              </button>
            ) : null}
            <button
              onClick={closeChat}
              className="text-2xl text-gray-600 hover:text-red-500"
            >
              <IoClose />
            </button>
          </div>
        </div>

        {/* Mobile: Show either chat list or conversation */}
        <div className="lg:hidden flex-1 flex flex-col min-h-0">
          {currentView === "list" ? (
            /* Chat List View */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-gray-200 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Search Chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                {isLoading ? (
                  <div
                    style={{ color: colors.grey[100] }}
                    className="mt-10 text-lg font-semibold text-center"
                  >
                    Loading...
                  </div>
                ) : (
                  chatList
                    .filter((chat) =>
                      chat.fullName
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((chat) => {
                      const isOnline = onlineUserIds.includes(chat.userId);

                      return (
                        <div
                          key={chat.userId}
                          onClick={() => handleChatSelect(chat)}
                          className="flex items-center w-full justify-start gap-4 mb-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.01] hover:bg-gray-200 shadow-lg"
                        >
                          <div className="relative">
                            <img
                              className="w-[50px] h-[50px] rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                              src={
                                chat.imageUrl == null
                                  ? Images.unknownUser
                                  : chat.imageUrl
                              }
                              alt={`${chat.fullName} profile`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(
                                  chat.imageUrl == null
                                    ? Images.unknownUser
                                    : chat.imageUrl,
                                  `${chat.fullName} profile`
                                );
                              }}
                            />
                            <span
                              className={`absolute bottom-0 right-0 w-[12px] h-[12px] rounded-full border-2 border-white ${
                                isOnline ? "bg-green-500" : "bg-gray-500"
                              }`}
                            ></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[14px] truncate">
                              {chat.fullName}
                            </p>
                            {newMessages[chat.chatId] > 0 && (
                              <span className="px-2 py-0.5 text-[10px] text-center font-bold bg-red-500 text-white rounded-full">
                                {newMessages[chat.chatId]} New
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          ) : (
            /* Conversation View */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-3 border-b border-gray-200 bg-white flex-shrink-0">
                <button
                  onClick={goBackToList}
                  className="text-2xl text-gray-600 hover:text-blue-500"
                >
                  ←
                </button>
                <img
                  src={
                    selectedChat?.imageUrl === null
                      ? Images.unknownUser
                      : selectedChat?.imageUrl
                  }
                  className="w-[40px] h-[40px] rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  alt={`${selectedChat?.fullName || "User"} profile`}
                  onClick={() =>
                    handleImageClick(
                      selectedChat?.imageUrl === null
                        ? Images.unknownUser
                        : selectedChat?.imageUrl || Images.unknownUser,
                      `${selectedChat?.fullName || "User"} profile`
                    )
                  }
                />
                <p className="font-semibold text-[16px] truncate flex-1">
                  {selectedChat?.fullName}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center">
                    No messages yet!
                  </p>
                ) : (
                  sortedDates.map((date) => (
                    <div key={date}>
                      <div className="text-center text-xs font-semibold text-gray-500 mb-2">
                        {formatChatDate(date)}
                      </div>

                      {groupedMessages[date].map((msg) => {
                        const isSender = msg.sender.senderId === UserId;

                        return (
                          <div
                            key={msg.messageId}
                            className={`w-full flex mb-2 ${
                              isSender ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div className="relative group max-w-[80%] transition-all duration-200">
                              <div
                                className={`w-full h-auto px-4 py-2 rounded-lg text-[14px] break-words whitespace-pre-wrap transition-all duration-200 ${
                                  isSender
                                    ? "bg-green-200 group-hover:-translate-x-6"
                                    : "bg-gray-300"
                                }`}
                              >
                                <span>{msg.message}</span>
                                <div className="mt-1 flex justify-end items-center gap-2 text-[10px] text-gray-500">
                                  <span>{formatSendTime(msg.sendTime)}</span>
                                </div>
                              </div>

                              {isSender && (
                                <button
                                  className="absolute top-1 right-0 hidden group-hover:flex items-center justify-center p-1 text-red-400 hover:text-red-600"
                                  onClick={() =>
                                    HandleDeleteMessageButton(msg.messageId)
                                  }
                                  title="Delete Message"
                                >
                                  <RiDeleteBin5Fill size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-200 border-2 border-gray-300 text-[14px]"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        SaveChatMessage();
                      }
                    }}
                  />
                  <button
                    onClick={SaveChatMessage}
                    className="p-2 rounded-lg bg-green-400 hover:bg-green-500 transition-all duration-300"
                  >
                    <IoMdSend />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Show both chat list and conversation side by side */}
        <div className="hidden lg:flex flex-1 min-h-0">
          {/* Chat List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col min-h-0">
            <div className="p-3 border-b border-gray-200 flex-shrink-0">
              <input
                type="text"
                placeholder="Search Chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              {isLoading ? (
                <div
                  style={{ color: colors.grey[100] }}
                  className="mt-10 text-lg font-semibold text-center"
                >
                  Loading...
                </div>
              ) : (
                chatList
                  .filter((chat) =>
                    chat.fullName
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                  .map((chat) => {
                    const isOnline = onlineUserIds.includes(chat.userId);

                    return (
                      <div
                        key={chat.userId}
                        onClick={() => handleChatSelect(chat)}
                        className="flex items-center w-full justify-start gap-4 mb-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.01] hover:bg-gray-200 shadow-lg cursor-pointer"
                      >
                        <div className="relative">
                          <img
                            className="w-[40px] h-[40px] rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                            src={
                              chat.imageUrl == null
                                ? Images.unknownUser
                                : chat.imageUrl
                            }
                            alt={`${chat.fullName} profile`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(
                                chat.imageUrl == null
                                  ? Images.unknownUser
                                  : chat.imageUrl,
                                `${chat.fullName} profile`
                              );
                            }}
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full border border-white ${
                              isOnline ? "bg-green-500" : "bg-gray-500"
                            }`}
                          ></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[13px] font-semibold">
                            {chat.fullName?.split(" ")[0]}
                          </p>
                          {newMessages[chat.chatId] > 0 && (
                            <span className="px-2 py-0.5 text-[10px] text-center font-bold bg-red-500 text-white rounded-full">
                              {newMessages[chat.chatId]} New
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className="w-2/3 flex flex-col min-h-0">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-3 border-b border-gray-200 flex-shrink-0">
                  <img
                    src={
                      selectedChat?.imageUrl === null
                        ? Images.unknownUser
                        : selectedChat?.imageUrl
                    }
                    className="w-[40px] h-[40px] rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    alt={`${selectedChat?.fullName || "User"} profile`}
                    onClick={() =>
                      handleImageClick(
                        selectedChat?.imageUrl === null
                          ? Images.unknownUser
                          : selectedChat?.imageUrl || Images.unknownUser,
                        `${selectedChat?.fullName || "User"} profile`
                      )
                    }
                  />
                  <p className="font-semibold text-[14px] truncate">
                    {selectedChat?.fullName}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 min-h-0">
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center">
                      No messages yet!
                    </p>
                  ) : (
                    sortedDates.map((date) => (
                      <div key={date}>
                        <div className="text-center text-xs font-semibold text-gray-500 mb-2">
                          {formatChatDate(date)}
                        </div>

                        {groupedMessages[date].map((msg) => {
                          const isSender = msg.sender.senderId === UserId;

                          return (
                            <div
                              key={msg.messageId}
                              className={`w-full flex mb-2 ${
                                isSender ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div className="relative group max-w-[70%] transition-all duration-200">
                                <div
                                  className={`w-full h-auto px-4 py-2 rounded-lg text-[13px] break-words whitespace-pre-wrap transition-all duration-200 ${
                                    isSender
                                      ? "bg-green-200 group-hover:-translate-x-6"
                                      : "bg-gray-300"
                                  }`}
                                >
                                  <span>{msg.message}</span>
                                  <div className="mt-1 flex justify-end items-center gap-2 text-[10px] text-gray-500">
                                    <span>{formatSendTime(msg.sendTime)}</span>
                                  </div>
                                </div>

                                {isSender && (
                                  <button
                                    className="absolute top-1 right-0 hidden group-hover:flex items-center justify-center p-1 text-red-400 hover:text-red-600"
                                    onClick={() =>
                                      HandleDeleteMessageButton(msg.messageId)
                                    }
                                    title="Delete Message"
                                  >
                                    <RiDeleteBin5Fill size={15} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-200 border-2 border-gray-300 text-[12px]"
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          SaveChatMessage();
                        }
                      }}
                    />
                    <button
                      onClick={SaveChatMessage}
                      className="p-2 rounded-lg bg-green-400 hover:bg-green-500 transition-all duration-300"
                    >
                      <IoMdSend />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Select a chat to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create chat popup */}
      {createChatFormOpen ? (
        <CreateChatPopup
          onClose={() => setCreateChatFormOpen(false)}
          reFreshChatList={GetChatList}
        />
      ) : null}

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        imageUrl={selectedImageUrl}
        altText={selectedImageAlt}
      />
    </div>
  );
};

export default Chat;
