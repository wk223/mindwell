/// <reference types="vite/client" />
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ParticleField from "./components/atmosphere/ParticleField";
import "./index.css";
import "./styles/theme.css";

// ── Sentry 错误监控（需设置 VITE_SENTRY_DSN 环境变量）──
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.PROD ? "production" : "development",
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ParticleField />
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
