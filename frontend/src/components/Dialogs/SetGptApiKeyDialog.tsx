import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import useSettingsStore from "@/util/store/settings";

export default function SetGptApiKeyDialog({
  open,
  onClose,
  onApiKeySubmit,
}: {
  open: boolean;
  onClose: () => void;
  onApiKeySubmit: (apiKey: string) => void;
}) {
  const { t } = useTranslation();
  const { gptApiKey } = useSettingsStore();

  const [apiKey, setApiKey] = useState("");
  useEffect(() => {
    setApiKey(gptApiKey.value);
  }, [gptApiKey.value]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("common:setGptApiKey")}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="api-key"
          label="API Key"
          type="password"
          fullWidth
          variant="standard"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common:cancel")} </Button>
        <Button onClick={() => onApiKeySubmit(apiKey)}>
          {t("common:set")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
