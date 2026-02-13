import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/* === WOWDASH THEME CSS (MATCHING YOUR FILES) === */
import "./assets/css/lib/bootstrap.min.css";
import "./assets/css/remixicon.css";
import "./assets/css/style.css";
import "./assets/css/extra.css";

/* optional overrides */
import "./custom.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
