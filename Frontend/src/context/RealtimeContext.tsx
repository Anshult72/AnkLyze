"use client";

/**
 * ANKLYZE Phase 15 - Frontend Realtime WebSocket Context
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - WebSocket is strictly a notification/sync layer.
 * - REST APIs remain authoritative source of truth.
 * - Graceful degradation if socket connection drops.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

export interface RealtimeEvent {
  event: string;
  room: string;
  timestamp: string;
  data: any;
}

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  subscribedRooms: string[];
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastEvent: null,
  joinRoom: () => {},
  leaveRoom: () => {},
  subscribedRooms: [],
});

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [subscribedRooms, setSubscribedRooms] = useState<string[]>([]);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      setIsConnected(false);
      return;
    }

    let ws: WebSocket | null = null;
    try {
      const tokenParam = accessToken ? `&token=${encodeURIComponent(accessToken)}` : "";
      const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
      const defaultSocketUrl = rawApiUrl.replace(/\/api\/v1\/?$/, "");
      const wsUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || defaultSocketUrl).replace(/^http/, "ws");
      ws = new WebSocket(`${wsUrl}/socket.io/?EIO=4&transport=websocket${tokenParam}`);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const raw = event.data;
          if (typeof raw === "string" && raw.startsWith("42")) {
            const parsed = JSON.parse(raw.slice(2));
            const [eventName, eventPayload] = parsed;
            setLastEvent({
              event: eventName,
              room: eventPayload?.room || "default",
              timestamp: new Date().toISOString(),
              data: eventPayload?.data || eventPayload,
            });
          }
        } catch {
          // Non-JSON frame safely ignored
        }
      };
    } catch {
      // Ignored: REST source-of-truth fallback
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user, accessToken]);

  const joinRoom = useCallback((room: string) => {
    setSubscribedRooms((prev) => (prev.includes(room) ? prev : [...prev, room]));
  }, []);

  const leaveRoom = useCallback((room: string) => {
    setSubscribedRooms((prev) => prev.filter((r) => r !== room));
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        lastEvent,
        joinRoom,
        leaveRoom,
        subscribedRooms,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
