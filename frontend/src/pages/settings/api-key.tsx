import { useTranslation } from "next-i18next";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import SettingsPageLayout from "@/components/layouts/SettingsPageLayout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import useSnackbarStore from "@/util/store/snackbar";
import { useState } from "react";
import { customFetch } from "@/util";

const ChangeName = () => {
  const { t } = useTranslation();

  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);

    const currentName = (event.target as HTMLFormElement).currentName.value;
    const newName = (event.target as HTMLFormElement).newName.value;

    if (currentName === newName) {
      showSnackbar(t("common:namesMatch"), "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await customFetch("/user/change-name", {
        method: "PUT",
        body: JSON.stringify({
          new_name: newName,
        }),
      });

      if (response.ok) {
        showSnackbar(t("common:nameChangedSuccessfully"), "success");
        user.setUser({ ...user, name: newName });
        (event.target as HTMLFormElement).reset();
      } else {
        showSnackbar(t("common:serverError"), "error");
      }
    } catch (error) {
      console.error(error);
      showSnackbar(t("common:serverError"), "error");
    }

    setIsSubmitting(false);
  };

  return (
    <DefaultLayout>
      <SettingsPageLayout>
        <h2 className="text-xl font-semibold mb-4">{t("common:changeName")}</h2>
        <form
          className="space-y-4 flex flex-col justify-between h-full"
          onSubmit={onSubmit}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("common:currentName")}
              </label>
              <input
                id="currentName"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                disabled
                value={user.name}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("common:newName")}
              </label>
              <input
                id="newName"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>
          <div style={{ marginBottom: "35px" }}>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-md w-full"
              disabled={isSubmitting}
            >
              {t("common:changeName")}
            </button>
          </div>
        </form>
      </SettingsPageLayout>
    </DefaultLayout>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

export default ChangeName;
