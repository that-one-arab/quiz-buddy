import Cookies from "universal-cookie";
import { create } from "zustand";

interface SettingsState {
  gptApiKey: {
    loading: boolean;
    value: string;
  };
  setGptApiKey: (key: string) => void;
}

const initialGptApiKey = () => {
  if (typeof window !== "undefined") {
    const value = new Cookies().get("gptApiKey");
    if (value) {
      return {
        loading: false,
        value,
      };
    }
    return {
      loading: false,
      value: "",
    };
  }

  return {
    loading: true,
    value: "",
  };
};

export const useSettingsStore = create<SettingsState>((set) => ({
  gptApiKey: initialGptApiKey(),
  gptApiKeyLoading: true,
  setGptApiKey: (key: string) => {
    set({
      gptApiKey: {
        loading: false,
        value: key,
      },
    });
    new Cookies().set("gptApiKey", key);
  },
}));

export default useSettingsStore;
