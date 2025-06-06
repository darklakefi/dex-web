import type { Token } from "./token";

export interface Pool {
  id: string;
  address: string;
  tokenX: Token;
  tokenY: Token;
  apr: number;
}
