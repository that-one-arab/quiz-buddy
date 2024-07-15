import React from "react";
import { Alert, Snackbar as MuiSnackbar } from "@mui/material";
import useSnackbarStore from "@/util/store/snackbar";

export default function Snackbar() {
  const snackbar = useSnackbarStore();

  return (
    <MuiSnackbar
      open={snackbar.show}
      autoHideDuration={6000}
      onClose={() => snackbar.hideSnackbar()}
    >
      <Alert
        onClose={() => snackbar.hideSnackbar()}
        severity={snackbar.severity}
        variant="filled"
        sx={{
          width: "100%",
          fontSize: 20,
          display: "flex",
          alignItems: "center",
        }}
      >
        {snackbar.message}
      </Alert>
    </MuiSnackbar>
  );
}
