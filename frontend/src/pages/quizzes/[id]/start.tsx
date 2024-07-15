import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box,
  Stack,
  IconButton,
} from "@mui/material";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosNewIcon from "@mui/icons-material/ArrowForwardIos";
import MUIButton from "@/components/MUIButton";
import { Question } from "@/components/QuizQuestionPreview";
import { useTranslation } from "next-i18next";
import MessageDialog from "@/components/Dialogs/MessageDialog";
import LoadingDialog from "@/components/Dialogs/LoadingDialog";
import { GetServerSidePropsContext } from "next";
import { getQuizServerSide, useCreateQuizAttempt } from "@/util/api/quizzes";
import { transformQuiz } from "@/util/data_transformation";
import { GetQuizResponse } from "@/util/types";
import { useRouter } from "next/router";
import { useIsMobile } from "@/util/hooks";

export interface QuizQuestion extends Question {
  index: number;
  selectedChoice?: {
    id: string;
    title?: string;
    isCorrect?: boolean;
  };
}

const CARD_MAX_WIDTH = 1000;

interface Quiz {
  id: string;
  title: string;
  subject_id: string;
  subject_title: string;
  description: string;
  duration: number;
  success_percentage: number;
  questions: Question[];
}

interface Props {
  data: {
    quiz: Quiz;
  };
}

const StartExam = ({ data }: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const quizId = router.query.id as string;

  const isMobile = useIsMobile();

  const maxButtonsPerPage = isMobile ? 4 : 30;

  const { quiz } = data;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quiz.duration);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer effect
  useEffect(() => {
    if (isSubmitting) {
      return;
    }

    if (timeLeft <= 0) {
      // Time's up, automatically submit the quiz or show a message
      submitExam("time-ended");
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const [questions, setQuestions] = useState<QuizQuestion[]>(
    quiz.questions.map((question, i) => ({
      ...question,
      index: i,
      selectedChoice: {
        id: "",
        title: "",
      },
    }))
  );

  const [page, setPage] = useState(0);
  const [messageDialog, setMessageDialog] = useState({
    open: false,
    message: "",
  });
  const [loadingDialog, setLoadingDialog] = useState({
    open: false,
    message: "",
  });

  const [submitQuiz] = useCreateQuizAttempt();

  const totalPages = Math.ceil(questions.length / maxButtonsPerPage);

  const nextPage = () => {
    setPage((current) => Math.min(current + 1, totalPages - 1));
  };

  const prevPage = () => {
    setPage((current) => Math.max(current - 1, 0));
  };

  const displayedQuestions = questions.slice(
    page * maxButtonsPerPage,
    (page + 1) * maxButtonsPerPage
  );

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].selectedChoice = {
      id: event.target.value,
    };
    setQuestions(updatedQuestions);
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    // Next page if we're at the last question on the current page
    if (
      currentQuestionIndex ===
      page * maxButtonsPerPage + maxButtonsPerPage - 1
    ) {
      nextPage();
    }
  };

  const prevQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => prevIndex - 1);

    // Previous page if we're at the first question on the current page
    if (currentQuestionIndex === page * maxButtonsPerPage) {
      prevPage();
    }
  };

  const submitExam = async (reason: "user-submit" | "time-ended") => {
    setIsSubmitting(true);

    if (!didAnswerAllQuestions && reason === "user-submit") {
      setMessageDialog({
        open: true,
        message: t(
          "common:cannotSubmitPleaseAnswerAllQuestionsBeforeSubmitting"
        ),
      });

      return;
    }

    try {
      const data = await submitQuiz(quizId, questions);

      setLoadingDialog({
        open: false,
        message: "",
      });

      router.push(`/quizzes/${quizId}/result/${data.id}`);
    } catch (error) {
      console.error("Failed to submit exam:", error);

      setLoadingDialog({
        open: false,
        message: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const didAnswerAllQuestions = questions.every(
    (question) => question?.selectedChoice?.id
  );

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 4,
          }}
        >
          <IconButton onClick={prevPage} disabled={page === 0}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Stack
            direction="row"
            flexWrap="wrap"
            justifyContent="flex-start"
            sx={{
              maxWidth: CARD_MAX_WIDTH - 50,
            }}
          >
            {displayedQuestions.map((q, index) => {
              return (
                <MUIButton
                  key={index + page * maxButtonsPerPage}
                  variant={
                    q.index === currentQuestionIndex ? "contained" : "outlined"
                  }
                  color={
                    questions[index].selectedChoice?.id ? "success" : "primary"
                  }
                  onClick={() => goToQuestion(index + page * maxButtonsPerPage)}
                  sx={{
                    minWidth: "36px",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    padding: "0",
                    fontSize: "0.75rem",
                    margin: "0.25rem 0.5rem",
                  }}
                >
                  {index + 1 + page * maxButtonsPerPage}
                </MUIButton>
              );
            })}
          </Stack>
          <IconButton onClick={nextPage} disabled={page >= totalPages - 1}>
            <ArrowForwardIosNewIcon />
          </IconButton>
        </Box>
        <Box sx={{ mb: 2 }} display="flex" alignItems="center">
          <img
            width="100"
            height="100"
            src="https://img.icons8.com/ios/100/time--v1.png"
            alt="time--v1"
            style={{ width: "40px" }}
          />{" "}
          <Typography variant="h6" marginX={2}>
            {formatTime(timeLeft)}
          </Typography>
        </Box>
        <Card sx={{ mb: 5, width: "100%", maxWidth: `${CARD_MAX_WIDTH}px` }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {questions[currentQuestionIndex].title}
            </Typography>
            <FormControl>
              <FormLabel>{t("common:choices")}</FormLabel>
              <RadioGroup
                name="quiz-choices"
                value={questions[currentQuestionIndex].selectedChoice?.id || ""}
                onChange={handleAnswerChange}
              >
                {questions[currentQuestionIndex].choices.map((choice) => (
                  <FormControlLabel
                    key={choice.id}
                    value={choice.id}
                    control={<Radio />}
                    label={choice.title}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Box
              sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}
            >
              <MUIButton
                variant="outlined"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                {t("common:previous")}
              </MUIButton>
              {currentQuestionIndex === questions.length - 1 ? (
                <MUIButton
                  variant="contained"
                  color="primary"
                  onClick={() => submitExam("user-submit")}
                >
                  {t("common:submit")}
                </MUIButton>
              ) : (
                <MUIButton variant="contained" onClick={nextQuestion}>
                  {t("common:next")}
                </MUIButton>
              )}
            </Box>
          </CardContent>
        </Card>
      </div>
      <MessageDialog
        title={messageDialog.message}
        open={messageDialog.open}
        message={messageDialog.message}
        onClose={() => setMessageDialog({ open: false, message: "" })}
      />
      <LoadingDialog
        open={loadingDialog.open}
        message={loadingDialog.message}
      />
    </DefaultLayout>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const locale = context.locale as string;
  const quizId = context.params?.id as string;

  const fetchedQuiz = await getQuizServerSide(quizId);

  if ("notFound" in fetchedQuiz && fetchedQuiz.notFound) {
    return {
      notFound: true,
    };
  }

  const quiz = transformQuiz(fetchedQuiz as GetQuizResponse, {
    shuffleQuestions: true,
    shuffleAnswers: true,
  });

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      data: { quiz },
    },
  };
};

export default StartExam;
