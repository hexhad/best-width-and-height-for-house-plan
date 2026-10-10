import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/abhaya-libre/400.css";
import "@fontsource/abhaya-libre/500.css";
import "@fontsource/abhaya-libre/600.css";
import "@fontsource/abhaya-libre/700.css";
import "@fontsource-variable/geist-mono";
import "./index.css";
import "./app.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
