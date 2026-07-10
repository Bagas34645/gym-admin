import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

export function initEcho(token: string) {
  if (typeof window === "undefined") return null;

  window.Pusher = Pusher;

  return new Echo({
    broadcaster: "reverb" as any,
    key: "gym_reverb_key_654", // From backend .env
    wsHost: "localhost",
    wsPort: 8081,
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "http://localhost:8000/v1/broadcasting/auth",
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });
}
