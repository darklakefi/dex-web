"use client";

import { Connection } from "@solana/web3.js";

class ConnectionPool {
  private static instance: ConnectionPool;
  private connections: Map<string, Connection> = new Map();
  private activeSubscriptions: Map<string, Set<number>> = new Map();

  static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  getConnection(endpoint: string): Connection {
    if (!this.connections.has(endpoint)) {
      this.connections.set(endpoint, new Connection(endpoint, "confirmed"));
      this.activeSubscriptions.set(endpoint, new Set());
    }
    return this.connections.get(endpoint)!;
  }

  addSubscription(endpoint: string, subscriptionId: number): void {
    const subs = this.activeSubscriptions.get(endpoint);
    if (subs) {
      subs.add(subscriptionId);
    }
  }

  removeSubscription(endpoint: string, subscriptionId: number): void {
    const subs = this.activeSubscriptions.get(endpoint);
    if (subs) {
      subs.delete(subscriptionId);
    }
  }

  getSubscriptionCount(endpoint: string): number {
    return this.activeSubscriptions.get(endpoint)?.size || 0;
  }
}

export const connectionPool = ConnectionPool.getInstance();