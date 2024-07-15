import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";

const LoadingDialog = ({
  open,
  message,
}: {
  open: boolean;
  message: string;
}) => {
  return (
    <Dialog
      open={open}
      aria-labelledby="creating-quiz-dialog"
      fullWidth
      maxWidth="sm"
    >
      <DialogContent
        sx={{
          minHeight: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box textAlign="center" p={2}>
          <CircularProgress />
          <Typography variant="h6" marginTop={2}>
            {message}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingDialog;
