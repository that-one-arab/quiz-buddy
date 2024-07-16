import DefaultLayout from "@/components/layouts/DefaultLayout";
import SearchableDropdown from "@/components/SearchableDropdown";
import { NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useGetSubjects, useHandleCreateQuiz } from "@/util/api/quizzes";
import { useState } from "react";
import useSnackbarStore from "@/util/store/snackbar";
import MessageDialog from "@/components/Dialogs/MessageDialog";
import { useRouter } from "next/router";
import ProgressDialog from "@/components/Dialogs/ProgressDialog";
import useSettingsStore from "@/util/store/settings";
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";

const CreateExam: NextPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const { gptApiKey } = useSettingsStore();

  const { data: subjects, error: subjectsError } = useGetSubjects("");

  const [subject, setSubject] = useState({ id: "", title: "" });
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDuration, setQuizDuration] = useState("");
  const [quizNumberOfQuestions, setQuizNumberOfQuestions] = useState("");
  const [quizPercentage, setQuizPercentage] = useState("");
  const [quizDescription, setQuizDescription] = useState("");

  const [inputType, setInputType] = useState<"file" | "text">("file");

  const [files, setFiles] = useState<FileList | null>(null);
  const [text, setText] = useState("");

  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({
    subject: "",
    quizTitle: "",
    quizDuration: "",
    quizNumberOfQuestions: "",
    quizPercentage: "",
    quizDescription: "",
    files: "",
  });

  const validateInputs = () => {
    let newErrors = {
      subject: "",
      quizTitle: "",
      quizDuration: "",
      quizNumberOfQuestions: "",
      quizPercentage: "",
      quizDescription: "",
      files: "",
    };
    let isValid = true;

    if (!subject.id && !subject.title) {
      newErrors.subject = t("common:subjectRequired");
      isValid = false;
    }

    // Quiz Title validation
    if (quizTitle.trim().length === 0) {
      newErrors.quizTitle = t("common:quizTitleRequired");
      isValid = false;
    } else if (quizTitle.length > 250) {
      newErrors.quizTitle = t("common:quizTitleTooLong");
      isValid = false;
    }

    // Quiz Duration validation
    const durationNum = parseInt(quizDuration);
    if (isNaN(durationNum) || durationNum < 1) {
      newErrors.quizDuration = t("common:invalidQuizDuration");
      isValid = false;
    }

    // Quiz Number of Questions validation
    const questionsNum = parseInt(quizNumberOfQuestions);
    if (isNaN(questionsNum) || questionsNum < 1) {
      newErrors.quizNumberOfQuestions = t("common:invalidQuizQuestions");
      isValid = false;
    }

    // Quiz Percentage validation
    const percentageNum = parseInt(quizPercentage);
    if (isNaN(percentageNum) || percentageNum < 1 || percentageNum > 100) {
      newErrors.quizPercentage = t("common:invalidQuizPercentage");
      isValid = false;
    }

    // Quiz Description validation
    if (quizDescription.length > 1000) {
      newErrors.quizDescription = t("common:quizDescriptionTooLong");
      isValid = false;
    }

    // Quiz Material Validation
    if (!text && (!files || files.length === 0)) {
      newErrors.files = t("common:filesRequired");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const [createQuizTaskId, setCreateQuizTaskId] = useState<string | null>(null);

  const [messageDialog, setMessageDialog] = useState({
    title: "",
    open: false,
    message: "",
    onClose: () => {},
  });
  const [openCreateQuizProgressDialog, setOpenCreateQuizProgressDialog] =
    useState(false);

  const [handleCreateQuiz] = useHandleCreateQuiz();

  const handleSubmit = async () => {
    if (!gptApiKey.value) {
      setMessageDialog({
        open: true,
        title: t("common:missingGptApiKey"),
        message: t("common:missingGptApiKeySubtitle"),
        onClose: () => {},
      });

      return;
    }

    // if (
    //   !quizTitle ||
    //   !quizDuration ||
    //   !quizNumberOfQuestions ||
    //   !quizPercentage ||
    //   (!subject.id && !subject.title) ||
    //   !files ||
    //   !files.length
    // ) {
    //   setMessageDialog({
    //     open: true,
    //     title: t("common:missingFields"),
    //     message: t("common:missingFieldsSubtitle"),
    //     onClose: () => {},
    //   });

    //   return;
    // }

    if (!validateInputs()) {
      return;
    }

    try {
      const response = await handleCreateQuiz({
        gptApiKey: gptApiKey.value,
        subject,
        title: quizTitle,
        duration: parseInt(quizDuration),
        numberOfQuestions: parseInt(quizNumberOfQuestions),
        percentage: parseInt(quizPercentage),
        description: quizDescription,
        // Ternary checks to prevent user from providing both text and files at the same time
        files: inputType === "file" ? files : null,
        text: inputType === "text" ? text : "",
      });
      if (!response.taskId) {
        showSnackbar(t("common:serverError"), "error");
        return;
      }

      setCreateQuizTaskId(response.taskId);
      setOpenCreateQuizProgressDialog(true);
    } catch (error) {
      // 1- Handle case where API key is malformed
      // 2- Handle case where API key may be expired
      console.error("caught error", error);
      showSnackbar(t("common:serverError"), "error");
    }
  };

  if (subjectsError) {
    return (
      <DefaultLayout>
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-5xl font-bold">{t("header")}</h1>
          <p className="text-2xl text-gray-600 mt-4">{t("subtitle")}</p>
          <div className="mt-8 w-full max-w-md">
            <p className="text-red-500 text-lg">{subjectsError}</p>
          </div>
        </main>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-5xl font-bold">{t("header")}</h1>
        <p className="text-2xl text-gray-600 mt-4">{t("subtitle")}</p>
        <div className="mt-8 w-full max-w-lg">
          {/* Subject Title Field */}
          <div className="mb-6">
            <label
              htmlFor="subjectTitle"
              className="block text-lg font-medium text-gray-700"
            >
              {t("common:subjectTitle")}
            </label>
            <SearchableDropdown
              // id="subjectTitle" // Hide id to prevent browser autofill. Results in bad UX
              placeholder={t("common:subjectTitlePlaceholder")}
              options={subjects.map((subject) => ({
                id: subject.id,
                label: subject.title,
                value: subject.id,
              }))}
              onChange={(option) => {
                clearError("subject");
                setSubject({
                  id: option.value,
                  title: option.label,
                });
              }}
              onTextFieldChange={(value: string) => {
                clearError("subject");
                setSubject({ id: "", title: value });
              }}
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
            )}
          </div>

          {/* Quiz Title Field */}
          <div className="mb-6">
            <label
              htmlFor="quizTitle"
              className="block text-lg font-medium text-gray-700"
            >
              {t("common:quizTitle")}
            </label>
            <input
              type="text"
              id="quizTitle"
              name="quizTitle"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg focus:outline-none ${
                errors.quizTitle ? "border-red-500" : ""
              }`}
              placeholder={t("common:quizTitlePlaceholder")}
              onChange={(e) => {
                clearError("quizTitle");
                setQuizTitle(e.target.value);
              }}
            />
            {errors.quizTitle && (
              <p className="mt-1 text-sm text-red-500">{errors.quizTitle}</p>
            )}
          </div>

          {/* Quiz Duration Field */}
          <div className="mb-6">
            <label
              htmlFor="quizDuration"
              className="block text-lg font-medium text-gray-700"
            >
              {t("common:quizDuration")}
            </label>
            <input
              type="number"
              id="quizDuration"
              name="quizDuration"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg focus:outline-none ${
                errors.quizDuration ? "border-red-500" : ""
              }`}
              placeholder={t("common:quizDurationPlaceholder")}
              onChange={(e) => {
                clearError("quizDuration");
                setQuizDuration(e.target.value);
              }}
            />
            {errors.quizDuration && (
              <p className="mt-1 text-sm text-red-500">{errors.quizDuration}</p>
            )}
          </div>

          {/* Quiz Number Of Questions Field 7*/}
          <div className="mb-6">
            <label
              htmlFor="quizNumberOfQuestions"
              className="block text-lg font-medium text-gray-700"
            >
              {t("common:quizNumberOfQuestions")}
            </label>
            <input
              type="number"
              id="quizNumberOfQuestions"
              name="quizNumberOfQuestions"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg focus:outline-none ${
                errors.quizNumberOfQuestions ? "border-red-500" : ""
              }`}
              placeholder={t("common:quizNumberOfQuestionsPlaceholder")}
              onChange={(e) => {
                clearError("quizNumberOfQuestions");
                setQuizNumberOfQuestions(e.target.value);
              }}
            />
            {errors.quizNumberOfQuestions && (
              <p className="mt-1 text-sm text-red-500">
                {errors.quizNumberOfQuestions}
              </p>
            )}
          </div>

          {/* Quiz Percentage Field */}
          <div className="mb-6">
            <label
              htmlFor="quizPercentage"
              className="block text-lg font-medium text-gray-700"
            >
              {t("common:quizPercentage")}
            </label>
            <input
              type="number"
              id="quizPercentage"
              name="quizPercentage"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg focus:outline-none ${
                errors.quizPercentage ? "border-red-500" : ""
              }`}
              placeholder={t("common:quizPercentagePlaceholder")}
              max={100}
              min={1}
              onChange={(e) => {
                clearError("quizPercentage");
                setQuizPercentage(e.target.value);
              }}
            />
            {errors.quizPercentage && (
              <p className="mt-1 text-sm text-red-500">
                {errors.quizPercentage}
              </p>
            )}
          </div>

          {/* Quiz Description Field */}
          <div className="mb-6">
            <label
              htmlFor="quizDescription"
              className="block text-lg font-medium text-gray-700"
            >
              {t("common:quizDescription")}
            </label>
            <textarea
              id="quizDescription"
              name="quizDescription"
              rows={4}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg focus:outline-none ${
                errors.quizDescription ? "border-red-500" : ""
              }`}
              placeholder={t("common:quizDescriptionPlaceholder")}
              onChange={(e) => setQuizDescription(e.target.value)}
            ></textarea>
            {errors.quizDescription && (
              <p className="mt-1 text-sm text-red-500">
                {errors.quizDescription}
              </p>
            )}
          </div>

          <FormControl component="fieldset">
            <label className="block text-lg font-medium text-gray-700">
              {t("common:howWouldYouLikeToProvideQuizMaterial")}
            </label>
            <RadioGroup
              row
              value={inputType}
              onChange={(e) => {
                setInputType(e.target.value as "file" | "text");
              }}
            >
              <FormControlLabel
                value="file"
                control={<Radio />}
                label={t("common:uploadFiles")}
              />
              <FormControlLabel
                value="text"
                control={<Radio />}
                label={t("common:enterText")}
              />
            </RadioGroup>
          </FormControl>

          {/* File Input Field */}
          {inputType === "file" ? (
            <>
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.md,.txt,.doc,.docx"
                  className="block w-full text-lg text-gray-500
                mt-2
              file:mr-4 file:py-3 file:px-6
              file:rounded-full file:border-0
              file:text-lg file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary-dark
            "
                  onChange={(e) => {
                    clearError("files");
                    setFiles(e.target.files);
                  }}
                />
              </label>
              <p className="text-gray-500 mt-1">
                {t("common:supportedFiles")} .pdf, .txt, .md, .doc, .docx
              </p>
              {errors.files && (
                <p className="mt-1 text-sm text-red-500">{errors.files}</p>
              )}
            </>
          ) : (
            <>
              <textarea
                id="text"
                name="text"
                rows={6}
                value={text}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg focus:outline-none ${
                  errors.files ? "border-red-500" : ""
                }`}
                placeholder="Enter your text here..."
                onChange={(e) => {
                  clearError("files");
                  setText(e.target.value);
                }}
              ></textarea>
              {errors.files && (
                <p className="mt-1 text-sm text-red-500">{errors.files}</p>
              )}
            </>
          )}
          <div className="flex justify-end w-full mt-6">
            <button
              type="button"
              className="mt-4 block text-lg font-semibold py-3 px-6
             rounded-full border-0
             text-white bg-accent
             hover:bg-primary-dark
             focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-opacity-50"
              onClick={handleSubmit}
            >
              {t("common:submit")}
            </button>
          </div>
        </div>
      </main>
      <ProgressDialog
        open={openCreateQuizProgressDialog}
        taskId={createQuizTaskId}
        onClose={() => setOpenCreateQuizProgressDialog(false)}
        totalQuestions={parseInt(quizNumberOfQuestions)}
        onSuccess={(value) => {
          // Reset task id
          setCreateQuizTaskId(null);
          setOpenCreateQuizProgressDialog(false);

          // User material is too short for the number of questions requested
          if (value.details.response_code === "too-short") {
            setMessageDialog({
              open: true,
              title: t("common:materialTooShort"),
              message: t("common:materialTooShortSubtitle"),
              onClose: () => {},
            });

            return;
          }

          // Some questions were not generated
          if (
            value.details.response_message.includes(
              "questions could not be generated"
            )
          ) {
            const ungeneratedQuestionsCount = parseInt(
              value.details.response_message.split(" ")[0]
            );

            setMessageDialog({
              open: true,
              title: t("common:quizCreatedSuccessfully"),
              message: t("common:couldNotGenerateXQuestions", {
                count: ungeneratedQuestionsCount,
              }),
              onClose: () => {
                router.push(
                  `/quizzes/${value.quiz_id}?hideQuestions=true&disableDelete=true&disableShare=true&disableBack=true`
                );
              },
            });
            return;
          }

          if (value.quiz_id) {
            router.push(
              `/quizzes/${value.quiz_id}?hideQuestions=true&disableDelete=true&disableShare=true&disableBack=true`
            );
          }
        }}
        onError={(message) => {
          setCreateQuizTaskId(null);
          setOpenCreateQuizProgressDialog(false);
          const messageDialogProps = {
            open: true,
            title: t("common:serverError"),
            message: t("common:serverErrorSubtitle"),
            onClose: () => {},
          };

          if (message === "Incorrect API key provided") {
            messageDialogProps.title = t("common:incorrectApiKey");
            messageDialogProps.message = t("common:incorrectApiKeySubtitle");
          }

          setMessageDialog(messageDialogProps);
        }}
      />
      <MessageDialog
        open={messageDialog.open}
        title={messageDialog.title}
        message={messageDialog.message}
        onClose={() => {
          if (messageDialog.onClose) {
            messageDialog.onClose();
          }

          setMessageDialog({
            open: false,
            title: "",
            message: "",
            onClose: () => {},
          });
        }}
      />
    </DefaultLayout>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

export default CreateExam;
