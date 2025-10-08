"use client";

import { type QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFI_STREAM_CONFIGS, type DeFiStreamConfig } from "./types";

interface SSEOptions {
  priority?: DeFiStreamConfig["priority"];

  enableFallback?: boolean;

  maxReconnectAttempts?: number;

  reconnectDelay?: number;

  enabled?: boolean;
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

  createConnection<TData>(
    endpoint: string,
    queryKey: QueryKey,
    onMessage: (data: TData) => void,
    options: SSEOptions = {},
  ): () => void {
    const {
      priority = "normal",
      maxReconnectAttempts = 3,
      reconnectDelay = 1000,
    } = options;

    const connectionKey = this.getConnectionKey(endpoint, priority);
    const _queryKeyString = JSON.stringify(queryKey);

    if (!this.subscribers.has(connectionKey)) {
      this.subscribers.set(connectionKey, new Set());
    }
    this.subscribers.get(connectionKey)!.add(queryKey);

    if (!this.connections.has(connectionKey)) {
      this.connections.set(connectionKey, {
        eventSource: null,
        isConnected: false,
        lastEventTime: 0,
        reconnectAttempts: 0,
      });

      this.establishConnection(
        connectionKey,
        endpoint,
        priority,
        maxReconnectAttempts,
        reconnectDelay,
      );
    }

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

    return () => {
      const subscribers = this.subscribers.get(connectionKey);
      if (subscribers) {
        subscribers.delete(queryKey);

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
    reconnectDelay: number,
  ): void {
    const connection = this.connections.get(connectionKey)!;

    try {
      const eventSource = new EventSource(`${endpoint}?priority=${priority}`);
      connection.eventSource = eventSource;

      eventSource.onopen = () => {
        connection.isConnected = true;
        connection.reconnectAttempts = 0;
      };

      eventSource.onerror = () => {
        connection.isConnected = false;
        console.error(`SSE error: ${connectionKey}`);

        if (connection.reconnectAttempts < maxReconnectAttempts) {
          setTimeout(
            () => {
              connection.reconnectAttempts++;
              this.establishConnection(
                connectionKey,
                endpoint,
                priority,
                maxReconnectAttempts,
                reconnectDelay,
              );
            },
            reconnectDelay * 2 ** connection.reconnectAttempts,
          );
        } else {
          console.error(
            `Max reconnection attempts reached for ${connectionKey}`,
          );
          this.closeConnection(connectionKey);
        }
      };
    } catch (error) {
      console.error(
        `Failed to establish SSE connection: ${connectionKey}`,
        error,
      );
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

  private getConnectionKey(
    endpoint: string,
    priority: DeFiStreamConfig["priority"],
  ): string {
    return `${endpoint}:${priority}`;
  }

  isConnected(
    endpoint: string,
    priority: DeFiStreamConfig["priority"],
  ): boolean {
    const connectionKey = this.getConnectionKey(endpoint, priority);
    return this.connections.get(connectionKey)?.isConnected ?? false;
  }
}

const sseManager = new SSEManager();

export function useServerSentEvents<TData>(
  endpoint: string,
  queryKey: QueryKey,
  options: SSEOptions = {},
) {
  const queryClient = useQueryClient();
  const {
    priority = "normal",
    enableFallback = true,
    enabled = true,
  } = options;
  const config = DEFI_STREAM_CONFIGS[priority];
  const hasEndpoint = enabled && endpoint.length > 0;

  const query = useQuery({
    enabled: hasEndpoint,
    queryFn: async (): Promise<TData | null> => {
      return new Promise((resolve) => {
        const cleanup = sseManager.createConnection<TData>(
          endpoint,
          queryKey,
          (data: TData) => {
            queryClient.setQueryData(queryKey, data);
            resolve(data);
          },
          options,
        );

        queryClient.setQueryData([...queryKey, "sse", "cleanup"], cleanup);
      });
    },
    queryKey: [...queryKey, "sse"],
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const fallbackQuery = useQuery({
    enabled:
      enableFallback &&
      hasEndpoint &&
      !sseManager.isConnected(endpoint, priority),
    queryFn: async (): Promise<TData | null> => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Fallback request failed: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Fallback query failed:", error);
        return null;
      }
    },
    queryKey: [...queryKey, "fallback"],
    refetchInterval:
      enableFallback &&
      hasEndpoint &&
      !sseManager.isConnected(endpoint, priority)
        ? config.refreshInterval
        : false,
    staleTime: config.staleTime,
  });

  const isConnected = hasEndpoint && sseManager.isConnected(endpoint, priority);

  return {
    data: query.data || fallbackQuery.data,
    error: query.error || fallbackQuery.error,
    isFallback: hasEndpoint ? !isConnected && enableFallback : false,
    isLoading: query.isLoading || fallbackQuery.isLoading,
    isStreaming: isConnected,
    refetch: query.refetch,
  };
}
