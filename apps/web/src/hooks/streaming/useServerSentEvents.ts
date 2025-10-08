"use client";

import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import type { DeFiStreamConfig } from "./types";

interface SSEOptions {
  priority?: DeFiStreamConfig["priority"];
  maxReconnectAttempts?: number;
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
    onInvalidate: () => void,
    options: SSEOptions = {},
  ): () => void {
    const {
      priority = "normal",
      maxReconnectAttempts = 3,
      reconnectDelay = 1000,
    } = options;

    const connectionKey = this.getConnectionKey(endpoint, priority);

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
      connection.eventSource.addEventListener("message", () => {
        connection.lastEventTime = Date.now();
        onInvalidate();
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

export function useServerSentEvents(
  endpoint: string,
  queryKey: QueryKey,
  options: SSEOptions = {},
) {
  const queryClient = useQueryClient();
  const { priority = "normal" } = options;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  if (!endpoint) {
    return {
      invalidate,
      isStreaming: false,
      priority,
    };
  }

  // Establish connection and invalidate on messages
  sseManager.createConnection(endpoint, queryKey, invalidate, options);

  const isConnected = sseManager.isConnected(endpoint, priority);

  return {
    invalidate,
    isStreaming: isConnected,
    priority,
  };
}
