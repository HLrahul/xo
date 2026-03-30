import { Client } from "@heroiclabs/nakama-js";


// Connect locally through the Vite Proxy server (bypasses CORS)
const useSSL = window.location.protocol === "https:";
const port = window.location.port || (useSSL ? "443" : "80");

const serverKey = import.meta.env.VITE_NAKAMA_SERVER_KEY || "defaultkey";

export const nakamaClient = new Client(
  serverKey,
  window.location.hostname,
  port,
  useSSL,
);
