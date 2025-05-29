import { decodeToken } from "@/lib/auth/decode";
import { create } from "zustand";

export const userStore = create((set) => ({
  user: {
    uid: "",
    email: "",
    name: "",
    role: "",
    location: "",
    expired: "",
  },
  updateUser: (newUser: any) =>
    set((state: any) => ({
      user: {
        ...state.user,
        ...newUser,
      },
    })),
  fetchUser: async () => {
    try {
      const result = await decodeToken();
      if (result?.success && result.data) {
        set({
          user: {
            uid: result.data.uid || "",
            email: result.data.email || "",
            name: result.data.name || "",
            role: result.data.role || "",
            location: result.data.location || "",
            expired: result.data.exp || "",
          },
        });
      }
    } catch (error) {
      console.log("Unexpected error in fetchUser:", error);
    }
  },
}));
