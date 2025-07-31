// Import and re-export the Darklake IDL
import type { Idl } from "@coral-xyz/anchor";
// @ts-ignore - We know this file exists
import idlData from "../darklake.json";

const IDL: Idl = idlData as Idl;

export default IDL;
