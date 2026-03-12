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
  const hasAttemptedRef = useRef(false);
  const isConnectingRef = useRef(false);

  const { data: angelStatus, isLoading } = useQuery<AngelOneStatusData>({
    queryKey: ["/api/angelone/status"],
    refetchInterval: 30000,
    staleTime: 10000,
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
    if (isLoading || hasAttemptedRef.current || isConnectingRef.current) {
      return;
    }

    if (!angelStatus) {
      return;
    }

    const needsConnect = !angelStatus.connected || !angelStatus.authenticated || angelStatus.tokenExpired;

    if (needsConnect) {
      console.log("🔶 [AUTO-CONNECT] Angel One status check:", {
        connected: angelStatus.connected,
        authenticated: angelStatus.authenticated,
        tokenExpired: angelStatus.tokenExpired,
      });
      
      // Removed: hasAttemptedRef.current = true;
      // We want it to retry on page reload if it's still not connected
      isConnectingRef.current = true;
      
      const timer = setTimeout(() => {
        console.log("🔶 [AUTO-CONNECT] Triggering Angel One auto-connect...");
        connectMutation.mutate();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      console.log("✅ [AUTO-CONNECT] Angel One already connected");
      hasAttemptedRef.current = true;
    }
  }, [isLoading, angelStatus, connectMutation]);

  // Periodic check to ensure connection stays alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (angelStatus && (!angelStatus.connected || !angelStatus.authenticated || angelStatus.tokenExpired)) {
        if (!isConnectingRef.current) {
          console.log("🔄 [AUTO-CONNECT] Periodic health check: Reconnecting...");
          isConnectingRef.current = true;
          connectMutation.mutate();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [angelStatus, connectMutation]);

  useEffect(() => {
    if (!angelStatus?.connected || !angelStatus?.authenticated) return;
    
    if (angelStatus.tokenExpired && !isConnectingRef.current) {
      console.log("⏰ [AUTO-CONNECT] Token expired, triggering reconnection...");
      isConnectingRef.current = true;
      connectMutation.mutate();
    }
  }, [angelStatus?.tokenExpired, angelStatus?.connected, angelStatus?.authenticated, connectMutation]);

  return {
    isConnected: angelStatus?.connected && angelStatus?.authenticated && !angelStatus?.tokenExpired,
    isConnecting: connectMutation.isPending,
    status: angelStatus,
  };
}
