// import { useMediaQuery } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";
import Cookies from "universal-cookie";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

export function useIsFirstLogin() {
  const cookies = new Cookies(null, { path: "/" });

  if (!cookies.get("first-login")) {
    cookies.set("first-login", "yes");
  }

  const isFirstLogin = cookies.get("first-login") === "yes";

  const setIsFirstLogin = (value: boolean) => {
    cookies.set("first-login", value === true ? "yes" : "no");
  };

  return { isFirstLogin, setIsFirstLogin };
}

export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

function useMediaQuery(
  query: string,
  { defaultValue = false, initializeWithValue = true } = {}
): boolean {
  const IS_SERVER = typeof window === "undefined";

  const getMatches = (query: string): boolean => {
    if (IS_SERVER) {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query);
    }
    return defaultValue;
  });

  function handleChange() {
    setMatches(getMatches(query));
  }

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query);

    handleChange();

    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener("change", handleChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener("change", handleChange);
      }
    };
  }, [query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 768px)");
}
