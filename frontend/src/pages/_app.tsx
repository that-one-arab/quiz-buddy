import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import { ThemeProvider } from "@emotion/react";
import theme from "@/util/theme";
import Snackbar from "@/components/Snackbar";
import WelcomeToAppDialog from "@/components/Dialogs/WelcomeToAppDialog";
import Confetti from "@/components/Confetti";
import { useIsFirstLogin } from "@/util/hooks";
import { useEffect, useState } from "react";
import useSettingsStore from "@/util/store/settings";
import Error from "next/error";

function App({ Component, pageProps }: AppProps) {
  const { isFirstLogin, setIsFirstLogin } = useIsFirstLogin();
  const { gptApiKey, setGptApiKey } = useSettingsStore();

  const isApiKeySet = !gptApiKey.loading && gptApiKey.value;
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);

  useEffect(() => {
    // check if the current page is not a 404 error page
    const isNotFoundPage = Component === Error && pageProps.statusCode === 404;
    if ((isFirstLogin || !isApiKeySet) && !isNotFoundPage) {
      setWelcomeDialogOpen(true);
    }
  }, [isFirstLogin, isApiKeySet, Component, pageProps.statusCode]);

  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />

      <Snackbar />

      {isFirstLogin && <Confetti duration={5000} />}
      <WelcomeToAppDialog
        open={welcomeDialogOpen}
        onShow={() => {
          setIsFirstLogin(false);
        }}
        onApiKeySubmit={(apiKey) => {
          setGptApiKey(apiKey);
          setWelcomeDialogOpen(false);
        }}
      />
    </ThemeProvider>
  );
}

export default appWithTranslation(App);
