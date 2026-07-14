import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo?: Echo<any>;
  }
}

let echoInstance: Echo<any> | null = null;

export function initEcho(): Echo<any> | null {
  if (typeof window === "undefined") return null;
  if (echoInstance) return echoInstance;

  window.Pusher = Pusher;

  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8081);

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "gym_reverb_key_654",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: "/api/broadcasting/auth",
    auth: {
      headers: {
        Accept: "application/json",
      },
    },
  });

  window.Echo = echoInstance;

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    window.Echo = undefined;
  }
}
