import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Skeleton,
  Autocomplete,
  Tooltip,
  IconButton,
} from "@mui/material";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useGetQuizzes, useGetSubjects } from "@/util/api/quizzes";
import { useDebounce } from "@uidotdev/usehooks";
import MUIButton from "@/components/MUIButton";
import languages from "@/constants/languages";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const SavedQuizzes = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const [searchText, setSearchText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState({
    value: "",
    label: "",
  });
  const [selectedSubject, setSelectedSubject] = useState<{
    id: string;
    title: string;
  }>({
    id: "",
    title: "",
  });
  const debouncedSearchText = useDebounce(searchText, 300);
  const debouncedSubjectId = useDebounce(selectedSubject.id, 300);
  const debouncedLanguage = useDebounce(selectedLanguage.value, 300);

  const { data: subjects } = useGetSubjects();

  // Set selected subject based on query param
  useEffect(() => {
    if (
      router.query.subjectId &&
      Number(router.query.subjectId) &&
      subjects.length
    ) {
      const selectedSubject = subjects.find(
        (s) => `${s.id}` === router.query.subjectId
      );

      setSelectedSubject(
        selectedSubject || {
          id: "all",
          title: t("common:all"),
        }
      );
    }
  }, [t, router.query.subjectId, subjects]);

  // Set the selected language based on query param
  useEffect(() => {
    if (router.query.language && languages.length) {
      const selectedLanguage = languages.find(
        (l) => l.value === router.query.language
      );

      setSelectedLanguage(
        selectedLanguage || {
          value: "all",
          label: t("common:all"),
        }
      );
    }
  }, [t, router.query.language]);

  const { data, refetch, fetchMore, loading, loadingReason } = useGetQuizzes({
    title: searchText,
    subjectId: selectedSubject.id,
    language: selectedLanguage.value,
  });
  const { quizzes, hasMore } = data;

  useEffect(() => {
    refetch({
      title: debouncedSearchText,
      subjectId: debouncedSubjectId,
      language: debouncedLanguage,
    });
  }, [debouncedSearchText, debouncedSubjectId, debouncedLanguage]);

  const renderQuizCards = () => {
    if (
      loading &&
      (loadingReason === "initial-fetch" || loadingReason === "refetch")
    ) {
      return Array.from({ length: 12 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Skeleton variant="rectangular" height={150} />
        </Grid>
      ));
    }

    if (quizzes && quizzes.length === 0) {
      return (
        <Grid item xs={12}>
          <Typography padding={1} variant="h6">
            {t("common:noQuizzesFound")}
          </Typography>
        </Grid>
      );
    }

    return quizzes.map((quiz) => (
      <Grid item xs={12} sm={6} md={3} key={quiz.id}>
        <Card
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "transform 0.2s",
            "&:hover": {
              transform: "scale(1.03)",
            },
          }}
          onClick={() => router.push(`/quizzes/${quiz.id}`)}
        >
          <CardContent>
            <Typography
              variant="h5"
              sx={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {quiz.title}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                mb: 1.5,
              }}
            >
              {t("common:subject")}: {quiz.subject_title}
            </Typography>
            <Typography variant="body2">
              {t("common:quizNumberOfQuestions")}: {quiz.number_of_questions}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    ));
  };

  return (
    <DefaultLayout>
      <Tooltip title={t("common:backToHome")}>
        <IconButton
          color="primary"
          onClick={() => router.push("/")}
          sx={{ mb: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>
      <Box sx={{ flexGrow: 1, padding: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t("common:savedQuizzes")}
        </Typography>
        <Grid container sx={{ marginBottom: 3 }} spacing={1}>
          <Grid item xs={12} md={6}>
            <TextField
              label={t("common:searchQuiz")}
              variant="outlined"
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={[{ id: "all", title: t("common:all") }, ...subjects]}
              getOptionLabel={(option) => option.title}
              value={selectedSubject}
              onChange={(_, newValue) => {
                setSelectedSubject(
                  newValue || { id: "all", title: t("common:all") }
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label={t("common:subject")} />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={[{ value: "all", label: t("common:all") }, ...languages]}
              getOptionLabel={(option) => option.label}
              value={selectedLanguage}
              onChange={(_, newValue) => {
                setSelectedLanguage(
                  newValue || { value: "all", label: t("common:all") }
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label={t("common:language")} />
              )}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
            />
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          {renderQuizCards()}
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 4 }}>
          {hasMore && (
            <Button
              variant="contained"
              onClick={() => fetchMore()}
              disabled={loading && loadingReason === "fetch-more"}
              sx={{
                backgroundColor: `#3B82F6 !important`,
              }}
              startIcon={
                loading && loadingReason === "fetch-more" ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {loading && loadingReason === "fetch-more"
                ? t("common:loading")
                : t("common:loadMore")}
            </Button>
          )}
        </Box>
      </Box>
    </DefaultLayout>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

export default SavedQuizzes;
