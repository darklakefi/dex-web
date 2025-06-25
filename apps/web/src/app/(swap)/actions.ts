"use server";

import { revalidatePath } from "next/cache";

export async function refreshSwapDetails() {
	revalidatePath("/(swap)");
}
