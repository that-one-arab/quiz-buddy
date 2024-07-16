import React, { useState } from "react";
import { Box, Typography, Container } from "@mui/material";
import FinishedQuizQuestionPreview from "@/components/FinishedQuizQuestionPreview";
import MUIButton from "@/components/MUIButton";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSidePropsContext } from "next";
import {
  QuizResult,
  getQuizAttemptServerSide,
  shareQuiz,
} from "@/util/api/quizzes";
import ShareQuizDialog from "@/components/Dialogs/ShareQuizDialog";
import MessageDialog from "@/components/Dialogs/MessageDialog";

interface Props {
  data: {
    quizResult: QuizResult;
  };
}

const ResultsPage = ({ data }: Props) => {
  const router = useRouter();
  const { t } = useTranslation();

  const { quizResult } = data;

  const [shareQuizDialogOpen, setShareQuizDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const calculateScore = () => {
    let score = 0;
    quizResult.questions.forEach((question, index) => {
      if (
        question?.selectedChoice &&
        question.correctChoice.id === question.selectedChoice.id
      ) {
        score += 1;
      }
    });
    return score;
  };
  const score = calculateScore();

  const passThreshold = quizResult.successPercentage * 0.01;
  const passed = score / quizResult.questions.length >= passThreshold;

  const percentage = ((score / quizResult.questions.length) * 100).toFixed(2);

  const handleBackToQuizzesClick = () => {
    if (quizResult.isShared) {
      router.push("/quizzes");
      return;
    }

    setShareQuizDialogOpen(true);
  };

  const handleShareQuiz = async () => {
    // Perform share action
    setShareQuizDialogOpen(false);
    try {
      await shareQuiz(quizResult.quizId);
      router.push("/quizzes");
    } catch (error) {
      console.error("Error sharing quiz:", error);
      setMessageDialogOpen(true);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box mt={5} mb={5} textAlign="center">
        <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
          {passed
            ? `${t("common:congratulationsYou")} `
            : `${t("common:sorryYou")} `}
          <b style={{ color: passed ? "green" : "red" }}>
            {passed ? `${t("common:passed")}!` : `${t("common:failed")}`}
          </b>
        </Typography>
        <Box display="flex" justifyContent="space-around">
          <Typography variant="h6">
            {t("common:score")} :{" "}
            <b style={{ color: passed ? "green" : "red" }}>
              {score} / {quizResult.questions.length}
            </b>
          </Typography>
          <Typography variant="h6">
            {t("common:percentage")}:{" "}
            <b style={{ color: passed ? "green" : "red" }}>{percentage} %</b>{" "}
          </Typography>
          <Typography variant="h6">
            {t("common:minimum")}:{" "}
            <b style={{ color: passed ? "black" : "red" }}>
              {quizResult.successPercentage} %
            </b>{" "}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          height: "60vh",
          overflowY: "scroll",
          "&::-webkit-scrollbar": {
            width: "10px",
          },
          "&::-webkit-scrollbar-track": {
            boxShadow: "inset 0 0 5px grey",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "linear-gradient(45deg, #bebebe 30%, #878585 90%);",
            borderRadius: "10px",
          },
          padding: "30px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          mb: 2,
        }}
      >
        {quizResult.questions.map((question, index) => (
          <FinishedQuizQuestionPreview
            question={{
              id: question.id,
              title: question.title,
              selectedChoice: question?.selectedChoice
                ? {
                    id: question.selectedChoice.id,
                    title: question.selectedChoice.title as string,
                  }
                : undefined,
              correctChoice: question.correctChoice,
              choices: question.choices.map((choice) => ({
                id: choice.id,
                title: choice.title,
              })),
            }}
            key={question.id}
          />
        ))}
      </Box>

      <Box display="flex" justifyContent="flex-end">
        <MUIButton
          variant="contained"
          color="primary"
          sx={{
            mt: 3,
            bgcolor: "secondary.main",
            "&:hover": {
              bgcolor: "secondary.dark",
            },
            padding: "10px 30px",
            borderRadius: "20px",
            boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
            textTransform: "none",
            fontSize: "1rem",
          }}
          onClick={() => handleBackToQuizzesClick()}
        >
          {t("common:backToQuizPool")}
        </MUIButton>
      </Box>
      <ShareQuizDialog
        open={shareQuizDialogOpen}
        onClose={() => {
          setShareQuizDialogOpen(false);
          router.push("/");
        }}
        onShare={handleShareQuiz}
      />
      <MessageDialog
        open={messageDialogOpen}
        onClose={() => router.push("/")}
        title={t("common:serverError")}
      />
    </Container>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const locale = context.locale as string;
  const quizId = context.params?.id as string;
  const quizAttemptId = context.params?.attemptId as string;

  const quizResult = await getQuizAttemptServerSide(quizId, quizAttemptId);

  if ("notFound" in quizResult && quizResult.notFound) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      data: { quizResult },
    },
  };
};
export default ResultsPage;
