import React, { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { GetServerSidePropsContext } from "next";
import { GetQuizResponse } from "@/util/types";
import { transformQuiz } from "@/util/data_transformation";
import { getQuizServerSide, useDeleteQuiz } from "@/util/api/quizzes";
import useSnackbarStore from "@/util/store/snackbar";
import MUIButton from "@/components/MUIButton";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import QuizQuestionPreview from "@/components/QuizQuestionPreview";
import DeleteConfirmationDialog from "@/components/Dialogs/DeleteConfirmationDialog";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Box, IconButton, Tooltip } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import ShareIcon from "@mui/icons-material/Share";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getLanguageLabel } from "@/util/language";

interface Props {
  data: GetQuizResponse;
}

const QuizOverview = ({ data }: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const {
    id,
    hideQuestions,
    hideCorrectAnswers,
    disableDelete,
    disableShare,
    disableBack,
  } = router.query;

  const shouldDisableDelete = disableDelete === "true";
  const shouldHideCorrectAnswers = hideCorrectAnswers === "true";
  const shouldDisableShare = disableShare === "true";
  const shouldDisableBack = disableBack === "true";

  const permaHideQuestions = hideQuestions === "true";
  const [shouldHideQuestions, setShouldHideQuestions] = useState(true);

  const [deleteQuiz] = useDeleteQuiz();

  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  const quiz = transformQuiz(data);

  const handleStartQuiz = () => {
    router.push(`/quizzes/${id}/start`);
  };

  const handleDeleteQuiz = async () => {
    try {
      await deleteQuiz(quiz.id);
      showSnackbar(t("common:quizDeleted"), "success");
      router.push("/quizzes");
    } catch (error) {
      console.error("Failed to delete quiz", error);
      showSnackbar(t("common:serverError"), "error");
    }
  };

  const handleShareQuiz = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showSnackbar(t("common:urlCopied"), "success");
    });
  };

  const renderQuestions = () => {
    if (permaHideQuestions) return null;

    return shouldHideQuestions
      ? null
      : quiz.questions.map((item, index) => (
          <QuizQuestionPreview
            key={index}
            question={item}
            hideCorrectAnswer={false}
          />
        ));
  };

  return (
    <DefaultLayout>
      {!shouldDisableBack && (
        <Tooltip title={t("common:backToQuizPool")}>
          <IconButton
            color="primary"
            onClick={() => router.push("/quizzes")}
            sx={{ mb: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      )}
      <Box sx={{ flexGrow: 1, padding: 3 }}>
        <div className="mb-6"></div>
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {quiz.subject_title}
            </h2>
            <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
            <div className="mt-4">
              <p className="text-md text-gray-800">
                {t("common:percentage")}: {quiz.success_percentage}%
              </p>
              <p className="text-md text-gray-800">
                {t("common:duration")}: {Math.round(quiz.duration / 60)}{" "}
                {t("common:minutes")}
              </p>
              <p className="text-md text-gray-800">
                {t("common:language")}: {getLanguageLabel(quiz.language)}
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4 md:mt-0">
            <Tooltip title={t("common:startQuiz")}>
              <IconButton
                color="primary"
                onClick={handleStartQuiz}
                size="large"
              >
                <PlayArrowIcon />
              </IconButton>
            </Tooltip>
            {!shouldDisableShare && (
              <Tooltip title={t("common:shareQuiz")}>
                <IconButton
                  color="primary"
                  onClick={handleShareQuiz}
                  size="large"
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            )}
            {!shouldDisableDelete && quiz.canDelete && (
              <Tooltip title={t("common:deleteQuiz")}>
                <IconButton
                  color="error"
                  onClick={() => setShowConfirmationDialog(true)}
                  size="large"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="mb-8 mt-8">
          <p className="text-gray-600">{quiz.description}</p>
        </div>
        <div className="space-y-4 mt-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              {t("common:questions")} ({quiz.questions.length})
            </h1>
            {!permaHideQuestions && (
              <MUIButton
                onClick={() => setShouldHideQuestions(!shouldHideQuestions)}
              >
                {shouldHideQuestions
                  ? t("common:showQuestions")
                  : t("common:hideQuestions")}
              </MUIButton>
            )}
          </div>
          {renderQuestions()}
        </div>
        <DeleteConfirmationDialog
          open={showConfirmationDialog}
          onCancel={() => setShowConfirmationDialog(false)}
          onConfirm={() => {
            setShowConfirmationDialog(false);
            handleDeleteQuiz();
          }}
        />
      </Box>
    </DefaultLayout>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const locale = context.locale as string;
  const quizId = context.params?.id as string;

  const quiz = await getQuizServerSide(quizId);

  if ("notFound" in quiz && quiz.notFound) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      data: quiz,
    },
  };
};

export default QuizOverview;
