import React from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { Grid, Tooltip } from "@mui/material";

import { Skeleton } from "@mui/material";
import useSettingsStore from "@/util/store/settings";
import { useIsClient } from "@uidotdev/usehooks";

const MainSkeleton: NextPage = () => {
  return (
    <DefaultLayout>
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton variant="text" width={200} height={60} />
        <div className="flex mt-10">
          <div className="m-2">
            <Skeleton
              variant="rectangular"
              width={250}
              height={56}
              style={{ borderRadius: "0.25rem" }}
            />
          </div>
          <div className="m-2">
            <Skeleton
              variant="rectangular"
              width={250}
              height={56}
              style={{ borderRadius: "0.25rem" }}
            />
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
};

const Main: NextPage = () => {
  const { t } = useTranslation();

  const isClient = useIsClient();
  const { gptApiKey } = useSettingsStore();
  const { loading, value: apiKey } = gptApiKey;

  if (loading || !isClient) {
    return <MainSkeleton />;
  }

  return (
    <DefaultLayout alignment="center">
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold">{t("header")}</h1>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={6} container justifyContent="center">
            <Tooltip title={t("common:savedExamsInfo")} placement="top">
              <span>
                <Link href={"/quizzes"} legacyBehavior>
                  <a
                    className="text-lg bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-8 rounded focus:outline-none focus:shadow-outline text-center"
                    style={{ display: "inline-block", minWidth: "250px" }}
                  >
                    {t("common:savedExams")}
                  </a>
                </Link>
              </span>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={6} container justifyContent="center">
            <Tooltip
              title={
                !apiKey
                  ? t("common:needApiKeyToGenerateQuiz")
                  : t("common:newExamInfo")
              }
              placement="top"
            >
              <span>
                <Link href={apiKey ? "/quizzes/new" : "#"} legacyBehavior>
                  <a
                    className={`text-lg ${
                      apiKey
                        ? "bg-blue-500 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    } text-white font-bold py-4 px-8 rounded focus:outline-none focus:shadow-outline text-center`}
                    style={{ display: "inline-block", minWidth: "250px" }}
                    onClick={(e) => !apiKey && e.preventDefault()}
                  >
                    {t("common:newExam")}
                  </a>
                </Link>
              </span>
            </Tooltip>
          </Grid>
        </Grid>
        <div className="flex mt-10">
          <div className="m-2"></div>
          <div className="m-2"></div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

export default Main;
