import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#1e1e2e",
          color: "#cdd6f4",
          border: "1px solid #313244",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#a6e3a1", secondary: "#1e1e2e" } },
        error: { iconTheme: { primary: "#f38ba8", secondary: "#1e1e2e" } },
      }}
    />
  </BrowserRouter>
);
