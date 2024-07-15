import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";
import MUIButton from "@/components/MUIButton";
import { useTranslation } from "next-i18next";

const MessageDialog = ({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message?: string;
  onClose: () => void;
}) => {
  const { t } = useTranslation();

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
          position: "relative",
        }}
      >
        <Box>
          <Typography textAlign="center" variant="h4" marginTop={2}>
            {title}
          </Typography>
          <Typography textAlign="center" variant="h6" marginTop={2}>
            {message}
          </Typography>
        </Box>
        <MUIButton
          sx={{ position: "absolute", right: 0, bottom: 0, margin: "25px" }}
          onClick={() => onClose()}
        >
          {t("common:close")}
        </MUIButton>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
