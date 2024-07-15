import languages from "@/constants/languages";

export const getLanguageLabel = (language: string) =>
  languages.find((l) => l.value === language)?.label || language;
