"use client";

import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { type DeFiStreamConfig, DEFI_STREAM_CONFIGS } from "./types";

/**
 * Server-Sent Events streaming without useEffect anti-patterns
 * Uses React Query for lifecycle management
 */

interface SSEOptions {
  /** Priority level for connection management */
  priority?: DeFiStreamConfig["priority"];
  /** Fallback to polling if SSE fails */
  enableFallback?: boolean;
  /** Reconnection attempts */
  maxReconnectAttempts?: number;
  /** Reconnection delay in ms */
  reconnectDelay?: number;
}

interface SSEConnection {
  eventSource: EventSource | null;
  reconnectAttempts: number;
  isConnected: boolean;
  lastEventTime: number;
}

class SSEManager {
  private connections = new Map<string, SSEConnection>();
  private subscribers = new Map<string, Set<QueryKey>>();

  createConnection(
    endpoint: string,
    queryKey: QueryKey,
    onMessage: (data: any) => void,
    options: SSEOptions = {}
  ): () => void {
    const {
      priority = "normal",
      maxReconnectAttempts = 3,
      reconnectDelay = 1000,
    } = options;

    const connectionKey = this.getConnectionKey(endpoint, priority);
    const queryKeyString = JSON.stringify(queryKey);

    // Add subscriber
    if (!this.subscribers.has(connectionKey)) {
      this.subscribers.set(connectionKey, new Set());
    }
    this.subscribers.get(connectionKey)!.add(queryKey);

    // Create connection if it doesn't exist
    if (!this.connections.has(connectionKey)) {
      this.connections.set(connectionKey, {
        eventSource: null,
        reconnectAttempts: 0,
        isConnected: false,
        lastEventTime: 0,
      });

      this.establishConnection(
        connectionKey,
        endpoint,
        priority,
        maxReconnectAttempts,
        reconnectDelay
      );
    }

    // Setup message handler
    const connection = this.connections.get(connectionKey)!;
    if (connection.eventSource) {
      connection.eventSource.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          connection.lastEventTime = Date.now();
          onMessage(data);
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      });
    }

    // Return cleanup function
    return () => {
      const subscribers = this.subscribers.get(connectionKey);
      if (subscribers) {
        subscribers.delete(queryKey);

        // If no more subscribers, close connection
        if (subscribers.size === 0) {
          this.closeConnection(connectionKey);
        }
      }
    };
  }

  private establishConnection(
    connectionKey: string,
    endpoint: string,
    priority: DeFiStreamConfig["priority"],
    maxReconnectAttempts: number,
    reconnectDelay: number
  ): void {
    const connection = this.connections.get(connectionKey)!;

    try {
      const eventSource = new EventSource(`${endpoint}?priority=${priority}`);
      connection.eventSource = eventSource;

      eventSource.onopen = () => {
        connection.isConnected = true;
        connection.reconnectAttempts = 0;
        console.log(`SSE connected: ${connectionKey}`);
      };

      eventSource.onerror = () => {
        connection.isConnected = false;
        console.error(`SSE error: ${connectionKey}`);

        if (connection.reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            connection.reconnectAttempts++;
            this.establishConnection(
              connectionKey,
              endpoint,
              priority,
              maxReconnectAttempts,
              reconnectDelay
            );
          }, reconnectDelay * Math.pow(2, connection.reconnectAttempts)); // Exponential backoff
        } else {
          console.error(`Max reconnection attempts reached for ${connectionKey}`);
          this.closeConnection(connectionKey);
        }
      };
    } catch (error) {
      console.error(`Failed to establish SSE connection: ${connectionKey}`, error);
    }
  }

  private closeConnection(connectionKey: string): void {
    const connection = this.connections.get(connectionKey);
    if (connection?.eventSource) {
      connection.eventSource.close();
      connection.eventSource = null;
      connection.isConnected = false;
    }
    this.connections.delete(connectionKey);
    this.subscribers.delete(connectionKey);
  }

  private getConnectionKey(endpoint: string, priority: DeFiStreamConfig["priority"]): string {
    return `${endpoint}:${priority}`;
  }

  isConnected(endpoint: string, priority: DeFiStreamConfig["priority"]): boolean {
    const connectionKey = this.getConnectionKey(endpoint, priority);
    return this.connections.get(connectionKey)?.isConnected ?? false;
  }
}

const sseManager = new SSEManager();

/**
 * Hook for Server-Sent Events streaming without useEffect
 * Integrates with React Query for state management
 */
export function useServerSentEvents<TData>(
  endpoint: string,
  queryKey: QueryKey,
  options: SSEOptions = {}
) {
  const queryClient = useQueryClient();
  const { priority = "normal", enableFallback = true } = options;
  const config = DEFI_STREAM_CONFIGS[priority];

  const query = useQuery({
    queryKey: [...queryKey, "sse"],
    queryFn: async (): Promise<TData | null> => {
      // This query doesn't fetch data directly - it sets up SSE
      return new Promise((resolve) => {
        const cleanup = sseManager.createConnection(
          endpoint,
          queryKey,
          (data: TData) => {
            // Update React Query cache when SSE message arrives
            queryClient.setQueryData(queryKey, data);
            resolve(data);
          },
          options
        );

        // Store cleanup in query meta for later use
        queryClient.setQueryData([...queryKey, "sse", "cleanup"], cleanup);
      });
    },
    staleTime: Infinity, // SSE data is always fresh
    refetchInterval: false, // No polling - rely on SSE
    refetchOnWindowFocus: false, // SSE handles reconnection
    enabled: true,
  });

  // Fallback to polling if SSE fails
  const fallbackQuery = useQuery({
    queryKey: [...queryKey, "fallback"],
    queryFn: async (): Promise<TData | null> => {
      // This would be the original polling queryFn
      throw new Error("Fallback query function not implemented");
    },
    refetchInterval: enableFallback && !sseManager.isConnected(endpoint, priority)
      ? config.refreshInterval
      : false,
    enabled: enableFallback && !sseManager.isConnected(endpoint, priority),
    staleTime: config.staleTime,
  });

  const isConnected = sseManager.isConnected(endpoint, priority);

  return {
    data: query.data || fallbackQuery.data,
    isLoading: query.isLoading || fallbackQuery.isLoading,
    error: query.error || fallbackQuery.error,
    isStreaming: isConnected,
    isFallback: !isConnected && enableFallback,
    refetch: query.refetch,
  };
}