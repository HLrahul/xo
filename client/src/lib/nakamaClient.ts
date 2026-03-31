import { Client } from "@heroiclabs/nakama-js";

const useSSL =
  import.meta.env.VITE_NAKAMA_USE_SSL === "true" ||
  window.location.protocol === "https:";
const host = import.meta.env.VITE_NAKAMA_HOST || window.location.hostname;
const port =
  import.meta.env.VITE_NAKAMA_PORT ||
  window.location.port ||
  (useSSL ? "443" : "80");

const serverKey = import.meta.env.VITE_NAKAMA_SERVER_KEY || "defaultkey";

export { useSSL };
export const nakamaClient = new Client(serverKey, host, port, useSSL);
