const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.PUBLIC_API_URL;

export const PUBLIC_API_URL = API_URL
  ? `${API_URL}/api`
  : "http://localhost:5000/api";

export function customFetch(
  route: string,
  options: RequestInit = {},
  ignoreContentType = false
) {
  const headers = {
    ...(!ignoreContentType && {
      "Content-Type": "application/json",
    }),
    ...options?.headers,
  };

  return fetch(`${PUBLIC_API_URL}${route}`, {
    ...options,
    headers,
  });
}
