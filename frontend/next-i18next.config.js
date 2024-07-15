const config = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ar", "tr"],
  },
  reloadOnPrerender: process.env.NODE_ENV === "development",
};

module.exports = config;
