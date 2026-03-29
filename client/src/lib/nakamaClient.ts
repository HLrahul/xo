import { Client } from "@heroiclabs/nakama-js";


// Connect locally through the Vite Proxy server (bypasses CORS)
const useSSL = window.location.protocol === "https:";
const port = window.location.port || (useSSL ? "443" : "80");

export const nakamaClient = new Client(
  "defaultkey",
  window.location.hostname,
  port,
  useSSL,
);
