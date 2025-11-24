// ---------- User Type ----------
type User = {
  emailAddress: string;
  userId: string;
  userType: string;
  userName: string;
  accessToken: string;
  companyId: string | null;
  sessionType: string;
};

// ---------- Save Other user session (Admin , Moderator , Manager , Customer) ----------
export const SaveUserSession = (data: User) => {
  const existingSessions: User[] = JSON.parse(
    localStorage.getItem("userSessions") || "[]"
  );

  const existingIndex = existingSessions.findIndex(
    (session: User) =>
      session.userId === data.userId && session.companyId === data.companyId
  );

  if (existingIndex !== -1) {
    existingSessions[existingIndex] = {
      ...existingSessions[existingIndex],
      ...data,
    };
  } else {
    existingSessions.push(data);
  }
  localStorage.setItem("userSessions", JSON.stringify(existingSessions));
};

// ---------- Get all user sessions ----------
export const GetUserSessions = (): User[] => {
  return JSON.parse(localStorage.getItem("userSessions") || "[]");
};

// ---------- Get user session by sessionType ----------
export const GetUserSessionBySessionType = (
  sessionType: string
): User | null => {
  const sessions: User[] = JSON.parse(
    localStorage.getItem("userSessions") || "[]"
  );

  const found = sessions.find(
    (session: User) => session.sessionType === sessionType
  );
  return found || null;
};

// ---------- Get user session by userId ----------
export const GetUserSessionByUserId = (userId: string): User | null => {
  const sessions: User[] = JSON.parse(
    localStorage.getItem("userSessions") || "[]"
  );
  return sessions.find((session: User) => session.userId === userId) || null;
};

// ---------- Get user session by userId and companyId ----------
export const GetUserSessionByUserIdAndCompanyId = (
  userId: string,
  companyId: string
): User | null => {
  const sessions: User[] = JSON.parse(
    localStorage.getItem("userSessions") || "[]"
  );
  return (
    sessions.find(
      (session: User) =>
        session.userId === userId && session.companyId === companyId
    ) || null
  );
};

// ---------- Remove session by userId ----------
export const ClearUserSession = (userId: string) => {
  const sessions: User[] = JSON.parse(
    localStorage.getItem("userSessions") || "[]"
  );
  const updatedSessions = sessions.filter(
    (session: User) => session.userId !== userId
  );
  localStorage.setItem("userSessions", JSON.stringify(updatedSessions));
};
