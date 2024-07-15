import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const SettingsPageLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen justify-center items-center">
      <div className="container mx-auto py-8">
        <div
          className="bg-white shadow-md rounded-lg flex"
          style={{ minHeight: "500px" }}
        >
          <nav
            className="bg-gray-200 p-6 flex-4"
            style={{
              width: "220px",
            }}
          >
            <h2 className="text-xl font-bold mb-4"> </h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/settings/change-password"
                  className={`text-lg ${
                    router.pathname === "/settings/change-password"
                      ? "font-bold text-blue-600"
                      : "text-gray-700 hover:underline"
                  }`}
                >
                  {t("common:changePassword")}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings/change-name"
                  className={`text-lg ${
                    router.pathname === "/settings/change-name"
                      ? "font-bold text-blue-600"
                      : "text-gray-700 hover:underline"
                  }`}
                >
                  {t("common:changeName")}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings/change-username"
                  className={`text-lg ${
                    router.pathname === "/settings/change-username"
                      ? "font-bold text-blue-600"
                      : "text-gray-700 hover:underline"
                  }`}
                >
                  {t("common:changeUsername")}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings/change-email"
                  className={`text-lg ${
                    router.pathname === "/settings/change-email"
                      ? "font-bold text-blue-600"
                      : "text-gray-700 hover:underline"
                  }`}
                >
                  {t("common:changeEmail")}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings/delete-account"
                  className={`text-lg ${
                    router.pathname === "/settings/delete-account"
                      ? "font-bold text-blue-600"
                      : "text-gray-700 hover:underline"
                  }`}
                >
                  {t("common:deleteAccount")}
                </Link>
              </li>
            </ul>
          </nav>
          <div className="p-6 flex-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPageLayout;
