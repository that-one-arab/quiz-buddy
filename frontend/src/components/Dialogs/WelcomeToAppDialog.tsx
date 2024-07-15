import React, { useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Typography,
  Box,
  Link,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "next-i18next";
import MUIButton from "@/components/MUIButton";

interface WelcomeToAppDialogProps {
  open: boolean;
  onShow?: () => void;
  onApiKeySubmit: (apiKey: string) => void;
}

const validationSchema = Yup.object().shape({
  apiKey: Yup.string().required("API Key is required"),
});

const WelcomeToAppDialog: React.FC<WelcomeToAppDialogProps> = ({
  open,
  onShow,
  onApiKeySubmit,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    onShow && onShow();
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => onApiKeySubmit("")}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">
            {t("common:welcomeToQuizBuddy")}!
          </Typography>
          <IconButton aria-label="close" onClick={() => onApiKeySubmit("")}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Formik
        initialValues={{ apiKey: "" }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          onApiKeySubmit(values.apiKey);
        }}
      >
        {({ errors, touched }) => (
          <Form>
            <DialogContent>
              <DialogContentText>
                {t("common:welcomeToQuizBuddySubtitle1")}
              </DialogContentText>
              <Box my={2}>
                <Field
                  as={TextField}
                  autoFocus
                  margin="dense"
                  id="apiKey"
                  name="apiKey"
                  label="Enter API Key"
                  type="password"
                  fullWidth
                  variant="outlined"
                  error={touched.apiKey && Boolean(errors.apiKey)}
                  helperText={touched.apiKey && errors.apiKey}
                />
              </Box>
              <DialogContentText>
                {t("common:welcomeToQuizBuddySubtitle2")}
              </DialogContentText>
              <Box mt={2}>
                <Typography variant="body2">
                  {t("common:welcomeToQuizBuddySubtitle3")}{" "}
                  <Link
                    href="https://github.com/your-repo-link"
                    target="_blank"
                    rel="noopener"
                  >
                    {t("common:welcomeToQuizBuddySubtitle4")}
                  </Link>{" "}
                </Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="body2">
                  {t("common:welcomeToQuizBuddySubtitle5")}{" "}
                  <Link
                    href="https://github.com/that-one-arab/quiz-buddy"
                    target="_blank"
                    rel="noopener"
                  >
                    {t("common:welcomeToQuizBuddySubtitle6")}
                  </Link>{" "}
                  {t("common:welcomeToQuizBuddySubtitle7")}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <MUIButton
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => onApiKeySubmit("")}
              >
                {t("common:addLater")}
              </MUIButton>
              <MUIButton
                type="submit"
                variant="contained"
                color="primary"
                // sx={{
                //   backgroundColor: "#3B82F6",
                // }}
                fullWidth
              >
                {t("common:save")}
              </MUIButton>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default WelcomeToAppDialog;
