import { create } from "zustand";

type TSeverity = "error" | "warning" | "info" | "success";

type TSnackbarStore = {
  show: boolean;
  message: string;
  severity: TSeverity;
  showSnackbar: (message: string, severity: TSeverity) => void;
  hideSnackbar: () => void;
};

const useSnackbarStore = create<TSnackbarStore>((set) => ({
  show: false,
  message: "",
  severity: "info",
  showSnackbar: (message, severity) =>
    set(() => ({
      show: true,
      message,
      severity,
    })),
  hideSnackbar: () =>
    set(() => ({
      show: false,
      message: "",
      severity: "info",
    })),
}));

export default useSnackbarStore;
