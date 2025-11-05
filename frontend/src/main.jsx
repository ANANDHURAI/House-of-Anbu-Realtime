import { Buffer } from "buffer";
import process from "process";
import { EventEmitter } from "events";

window.Buffer = Buffer;
window.process = process;
window.global = window;
window.EventEmitter = EventEmitter;


import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <App />
);
