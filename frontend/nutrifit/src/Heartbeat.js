import { useEffect } from "react";

const API_BASE = "http://127.0.0.1:5000";
const PING_INTERVAL_MS = 30000; // 30 seconds

function Heartbeat() {
  useEffect(() => {
    let intervalId = null;

    const sendPing = () => {
      const token = localStorage.getItem("token");

      // Only ping if a normal user is logged in
      if (!token) return;

      fetch(`${API_BASE}/ping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch((err) => {
        console.error("PING ERROR:", err);
      });
    };

    // Send one immediately, then repeat
    sendPing();
    intervalId = setInterval(sendPing, PING_INTERVAL_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
}

export default Heartbeat;
