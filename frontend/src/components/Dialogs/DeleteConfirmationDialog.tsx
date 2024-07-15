import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ReportProblemOutlined as DangerIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationDialog = ({ open, onConfirm, onCancel }: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="alert-dialog-title">
        {t("common:areYouSureYouWantToDelete")}
      </DialogTitle>
      <DialogContent>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "200px",
          }}
        >
          <DangerIcon color="error" style={{ fontSize: 60 }} />
          <Typography variant="body1" style={{ marginTop: 16 }}>
            {t("common:thisActionCannotBeUndone")}
          </Typography>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary" autoFocus>
          {t("common:cancel")}
        </Button>
        <Button onClick={onConfirm} color="error">
          {t("common:delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
