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

function App({ Component, pageProps }: AppProps) {
  const { isFirstLogin, setIsFirstLogin } = useIsFirstLogin();
  const { gptApiKey, setGptApiKey } = useSettingsStore();

  const isApiKeySet = !gptApiKey.loading && gptApiKey.value;

  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  useEffect(() => {
    if (isFirstLogin || !isApiKeySet) setWelcomeDialogOpen(true);
  }, [isFirstLogin, isApiKeySet]);

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
