import React, { ReactNode, useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Box,
  IconButton,
} from "@mui/material";
import Warning from "@mui/icons-material/Warning";
import Language from "@mui/icons-material/Language";
import Key from "@mui/icons-material/Key";
import Github from "@mui/icons-material/GitHub";
import BugReport from "@mui/icons-material/BugReport";
import { useTheme } from "@mui/material/styles";
import Logo from "@/components/Logo";
import useSettingsStore from "@/util/store/settings";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import SetGptApiKeyDialog from "@/components/Dialogs/SetGptApiKeyDialog";
import Head from "next/head";
import Link from "next/link";
import { GITHUB_URL } from "@/constants";

function ReportBugIconButton() {
  return (
    <IconButton
      color="primary"
      aria-label="Report Bug"
      href={`${GITHUB_URL}/issues`}
      target="_blank"
      rel="noopener noreferrer"
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.primary.main,
        border: `1px solid ${theme.palette.divider}`,
      })}
    >
      <BugReport />
    </IconButton>
  );
}

function ReportBugButton() {
  const { t } = useTranslation();
  return (
    <Button
      startIcon={<BugReport />}
      href={`${GITHUB_URL}/issues`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Report Bug"
    >
      {t("common:reportBug")}
    </Button>
  );
}

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  alignment?: "center" | "unset";
}

const Layout: React.FC<LayoutProps> = ({
  children,
  pageTitle,
  pageDescription,
  alignment = "unset",
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [openDialog, setOpenDialog] = useState(false);

  const { gptApiKey, setGptApiKey } = useSettingsStore();

  const isApiKeySet = !gptApiKey.loading && gptApiKey.value;

  const [apiKeyWarning, setApiKeyWarning] = useState(false); // Set to true for demonstration
  useEffect(() => {
    setApiKeyWarning(!isApiKeySet);
  }, [isApiKeySet]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSetApiKey = (apiKey: string) => {
    setGptApiKey(apiKey);
    setApiKeyWarning(false);
    handleCloseDialog();
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedLanguage = event.target.value;
    router.push(router.asPath, undefined, { locale: selectedLanguage });

    if (selectedLanguage === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  };

  return (
    <Box
      className="bg-gray-100"
      sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Head>
        <title>{pageTitle || "Quiz Buddy"}</title>
        {pageDescription && (
          <meta name="description" content={pageDescription} />
        )}
      </Head>
      <AppBar
        position="static"
        color="transparent"
        sx={(theme) => ({
          boxShadow: "none",
          border: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Link href="/">
              <Logo
                style={{
                  maxWidth: "60px",
                  cursor: "pointer",
                }}
              />
            </Link>
          </Box>
          <div>
            <div className="flex items-center p-4">
              <select
                value={i18n.language}
                onChange={handleLanguageChange}
                className="outline-none border-none"
              >
                <option value="en">{t("languages.english")}</option>
                <option value="ar">{t("languages.arabic")}</option>
                <option value="tr">{t("languages.turkish")}</option>
              </select>
            </div>
          </div>
          <Button
            variant={apiKeyWarning ? "contained" : "text"}
            onClick={handleOpenDialog}
            startIcon={apiKeyWarning ? <Warning /> : <Key />}
            color={apiKeyWarning ? "warning" : "inherit"}
            sx={(theme) => ({
              backgroundColor: `${
                apiKeyWarning ? theme.palette.warning.main : "inherit"
              } !important`,
            })}
          >
            {t("common:apiKey")}
          </Button>
          <IconButton
            color="inherit"
            aria-label="GitHub"
            href="https://github.com/that-one-arab/quiz-buddy"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        maxWidth="xl"
        sx={{
          flexGrow: 1,
          mt: 4,
          mb: 4,
          ...(alignment === "center" && {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }),
        }}
      >
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          position: "fixed",
          bottom: theme.spacing(2),
          right: theme.spacing(2),
        }}
      >
        <Box
          sx={{
            display: {
              xs: "block",
              sm: "none",
            },
          }}
        >
          <ReportBugIconButton />
        </Box>
        <Box
          sx={{
            display: {
              xs: "none",
              sm: "block",
            },
          }}
        >
          <ReportBugButton />
        </Box>

        {/* <IconButton
          color="primary"
          aria-label="Report Bug"
          href="https://github.com/that-one-arab/quiz-buddy/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          <BugReport />
        </IconButton> */}
      </Box>
      <SetGptApiKeyDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onApiKeySubmit={handleSetApiKey}
      />
    </Box>
  );
};

export default Layout;
