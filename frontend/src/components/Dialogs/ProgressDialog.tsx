import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Box,
  Typography,
  LinearProgress,
  linearProgressClasses,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { customFetch } from "@/util";
import { styled } from "@mui/system";

interface CreateQuizTaskResult {
  details: {
    response_code: string;
    response_message: string;
  };
  message: string;
  quiz_id: string;
}

interface ProgressResponse {
  ready: boolean;
  successful: boolean;
  state: string;
  progress?: {
    current: number;
    total: number;
  };
  value?: CreateQuizTaskResult;
}

interface ProgressDialogProps {
  taskId: string | null;
  totalQuestions: number;
  onClose: () => void;
  open: boolean;
  onSuccess: (value: CreateQuizTaskResult) => void;
  onError: (error: string) => void;
}

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[300],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: theme.palette.primary.main,
  },
}));

const StyledDialog = styled(Dialog)({
  "& .MuiDialog-paper": {
    height: "400px", // Set the height of the dialog
  },
});

const ProgressDialog: React.FC<ProgressDialogProps> = ({
  taskId,
  totalQuestions,
  onClose,
  open,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation();

  const [currentQuestions, setCurrentQuestions] = useState(0);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        let timeoutId: NodeJS.Timeout | null = null;

        const response = await customFetch(`/tasks/result/${taskId}`);
        const data: ProgressResponse = await response.json();

        if (data.progress) {
          setCurrentQuestions(data.progress.current);
        }

        if (data.successful && data.value) {
          onSuccess(data.value);
          setCurrentQuestions(0);
        } else if (data.ready && !data.successful && data.value) {
          onError(data.value.details.response_message);
          setCurrentQuestions(0);

          if (timeoutId) clearTimeout(timeoutId);
        }

        if (!data.ready) {
          timeoutId = setTimeout(fetchProgress, 1000);
        } else {
          onClose();
          setCurrentQuestions(0);
        }
      } catch (error: any) {
        console.error(error);
        onError(error.message);
        setCurrentQuestions(0);
      }
    };

    if (taskId) fetchProgress();
  }, [taskId, onClose]);

  return (
    <StyledDialog
      open={open}
      onClose={() => {}} // Do not close the dialog on backdrop click
      maxWidth="sm"
      fullWidth
      sx={{ minHeight: "400px" }}
    >
      <DialogTitle>{t("common:creatingQuiz")} </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
        <Box>
          <StyledLinearProgress
            variant="determinate"
            value={(currentQuestions / totalQuestions) * 100}
          />
          <Box mt={2} textAlign="center">
            <Typography variant="body1">
              {t("common:xOutOfTotalQuestionsCreated", {
                count: currentQuestions,
                total: totalQuestions,
              })}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </StyledDialog>
  );
};

export default ProgressDialog;
