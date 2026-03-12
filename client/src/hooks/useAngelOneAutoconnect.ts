import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AngelOneStatusData {
  success: boolean;
  connected: boolean;
  authenticated: boolean;
  clientCode?: string;
  tokenExpiry?: number;
  tokenExpired?: boolean;
}

export function AngelOneGlobalAutoConnect() {
  useAngelOneAutoconnect();
  return null;
}

export function useAngelOneAutoconnect() {
  const isConnectingRef = useRef(false);
  const wasConnectedRef = useRef(false);

  const { data: angelStatus, isLoading } = useQuery<AngelOneStatusData>({
    queryKey: ["/api/angelone/status"],
    // Poll faster (5s) when disconnected so charts recover quickly after token expiry;
    // slower (30s) when already connected to reduce unnecessary requests.
    refetchInterval: (query) => {
      const data = query.state.data as AngelOneStatusData | undefined;
      const ok = data?.connected && data?.authenticated && !data?.tokenExpired;
      return ok ? 30000 : 5000;
    },
    staleTime: 4000,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/angelone/connect-env");
    },
    onSuccess: () => {
      console.log("✅ [AUTO-CONNECT] Angel One connected successfully via hook");
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/statistics"] });
    },
    onError: (error: any) => {
      console.log("⚠️ [AUTO-CONNECT] Angel One connection failed:", error?.message);
    },
    onSettled: () => {
      isConnectingRef.current = false;
    },
  });

  useEffect(() => {
    if (isLoading || isConnectingRef.current) return;
    if (!angelStatus) return;

    const isOk = angelStatus.connected && angelStatus.authenticated && !angelStatus.tokenExpired;

    if (isOk) {
      wasConnectedRef.current = true;
      console.log("✅ [AUTO-CONNECT] Angel One already connected");
      return;
    }

    // Disconnected — attempt reconnect. Reset wasConnected so we re-trigger
    // even if we were previously connected (covers mid-session token expiry).
    wasConnectedRef.current = false;
    isConnectingRef.current = true;

    console.log("🔶 [AUTO-CONNECT] Angel One status check:", {
      connected: angelStatus.connected,
      authenticated: angelStatus.authenticated,
      tokenExpired: angelStatus.tokenExpired,
    });

    const timer = setTimeout(() => {
      console.log("🔶 [AUTO-CONNECT] Triggering Angel One auto-connect...");
      connectMutation.mutate();
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoading, angelStatus, connectMutation]);

  return {
    isConnected: angelStatus?.connected && angelStatus?.authenticated && !angelStatus?.tokenExpired,
    isConnecting: connectMutation.isPending,
    status: angelStatus,
  };
}
