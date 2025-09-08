"use server";
import { database, wallets } from "@dex-web/db";
import { eq } from "drizzle-orm";

export interface CreateWalletInput {
  id: string;
  chain: string;
  label: string;
  wallet_address: string;
}

export interface UpdateWalletInput {
  id: string;
  chain?: string;
  label?: string;
  wallet_address?: string;
}

export async function createWalletHandler(input: CreateWalletInput) {
  try {
    const newWallet = await database
      .insert(wallets)
      .values({
        chain: input.chain,
        id: input.id,
        label: input.label,
        wallet_address: input.wallet_address,
      })
      .returning();

    console.log("Wallet created:", newWallet[0]);
    return newWallet[0];
  } catch (error) {
    console.error("Error creating wallet:", error);
    throw new Error(
      `Failed to create wallet: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function listWalletsHandler() {
  try {
    const allWallets = await database
      .select()
      .from(wallets)
      .orderBy(wallets.created_at);
    console.log("Wallets fetched:", allWallets.length);
    return allWallets;
  } catch (error) {
    console.error("Error fetching wallets:", error);
    throw new Error(
      `Failed to fetch wallets: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function getWalletByIdHandler(id: string) {
  try {
    const wallet = await database
      .select()
      .from(wallets)
      .where(eq(wallets.id, id));

    if (wallet.length === 0) {
      throw new Error(`Wallet with ID ${id} not found`);
    }

    return wallet[0];
  } catch (error) {
    console.error("Error fetching wallet by ID:", error);
    throw new Error(
      `Failed to fetch wallet: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function updateWalletHandler(input: UpdateWalletInput) {
  try {
    const updateData: Partial<UpdateWalletInput> = {};

    if (input.chain) updateData.chain = input.chain;
    if (input.label) updateData.label = input.label;
    if (input.wallet_address) updateData.wallet_address = input.wallet_address;

    const updatedWallet = await database
      .update(wallets)
      .set(updateData)
      .where(eq(wallets.id, input.id))
      .returning();

    if (updatedWallet.length === 0) {
      throw new Error(`Wallet with ID ${input.id} not found`);
    }

    console.log("Wallet updated:", updatedWallet[0]);
    return updatedWallet[0];
  } catch (error) {
    console.error("Error updating wallet:", error);
    throw new Error(
      `Failed to update wallet: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function deleteWalletHandler(id: string) {
  try {
    const deletedWallet = await database
      .delete(wallets)
      .where(eq(wallets.id, id))
      .returning();

    if (deletedWallet.length === 0) {
      throw new Error(`Wallet with ID ${id} not found`);
    }

    console.log("Wallet deleted:", deletedWallet[0]);
    return { deletedWallet: deletedWallet[0], success: true };
  } catch (error) {
    console.error("Error deleting wallet:", error);
    throw new Error(
      `Failed to delete wallet: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
