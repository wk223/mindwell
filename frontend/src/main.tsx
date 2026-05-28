import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ParticleField from "./components/atmosphere/ParticleField";
import "./index.css";

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
