const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export { apiBaseUrl };
