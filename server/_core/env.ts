export const ENV = {
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "learn-at---manus",
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "learn-at---manus.firebasestorage.app",
  isProduction: process.env.NODE_ENV === "production",
  aiApiKey: process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
