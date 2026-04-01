const ACTIVITY_STORAGE_KEY = "agrotrust_user_activity";
const MAX_ACTIVITY_ITEMS = 200;

export const getUserActivity = () => {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveUserActivity = (items) => {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(items));
};

export const addUserActivity = (entry) => {
  const items = getUserActivity();
  const activity = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    type: entry?.type || "general",
    title: entry?.title || "Thao tác người dùng",
    detail: entry?.detail || "",
    account: entry?.account || "",
    role: entry?.role || "",
  };
  const next = [activity, ...items].slice(0, MAX_ACTIVITY_ITEMS);
  saveUserActivity(next);
  return activity;
};

export const clearUserActivity = () => {
  localStorage.removeItem(ACTIVITY_STORAGE_KEY);
};
