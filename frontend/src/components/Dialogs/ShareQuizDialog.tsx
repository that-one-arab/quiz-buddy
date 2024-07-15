import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";
import MUIButton from "@/components/MUIButton";
import { useTranslation } from "next-i18next";

const ShareQuizDialog = ({
  open,
  onClose,
  onShare,
}: {
  open: boolean;
  onClose: () => void;
  onShare: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      aria-labelledby="share-quiz-dialog"
      fullWidth
      maxWidth="sm"
    >
      <DialogContent
        sx={{
          minHeight: "300px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Box>
          <Typography textAlign="center" variant="h4" marginBottom={2}>
            {t("common:shareYourQuiz")}
          </Typography>
          <Typography textAlign="center" variant="h6" marginBottom={4}>
            {t("common:shareYourQuizSubtitle")}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-evenly",
            gap: 2,
            width: "100%",
          }}
        >
          <MUIButton
            sx={{
              p: 1.5,
            }}
            onClick={onClose}
          >
            {t("common:noThanks")}
          </MUIButton>
          <MUIButton
            sx={{
              backgroundColor: `#3B82F6 !important`,
              color: "white",
              p: 1.5,
            }}
            onClick={onShare}
          >
            {t("common:yesShare")}
          </MUIButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ShareQuizDialog;
