const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

export const appConfig = {
  apiUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL ?? "https://kaimana-back-end.vercel.app"),
  socketUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SOCKET_URL ?? "https://kaimana-back-end.vercel.app"),
  appUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL ?? "https://kaimana-front-end.vercel.app"),
};
