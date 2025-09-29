"use server";

import type {
  CreateTorqueReferralInput,
  CreateTorqueReferralOutput,
} from "../../schemas/integrations/createTorqueReferral.schema";

export async function createTorqueReferralHandler({
  userId,
}: CreateTorqueReferralInput): Promise<CreateTorqueReferralOutput> {
  try {
    const torqueApiUrl =
      process.env.NEXT_PUBLIC_TORQUE_API_URL || "https://server.torque.so";

    const response = await fetch(
      `${torqueApiUrl}/user-ref-code?wallet=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const torqueResponse = await response.json();

    if (!response.ok) {
      console.error("Torque API error:", {
        status: response.status,
        statusText: response.statusText,
        response: torqueResponse,
      });

      return {
        success: false,
        referralCode: "",
        error: torqueResponse.message || `API Error: ${response.status}`,
      };
    }

    if (torqueResponse.status === "SUCCESS" && torqueResponse.data) {
      return {
        success: true,
        referralCode: torqueResponse.data.code,
        publicKey: torqueResponse.data.publicKey,
        vanity: torqueResponse.data.vanity,
      };
    } else {
      return {
        success: false,
        referralCode: "",
        error: "Torque API returned unexpected response format",
      };
    }
  } catch (error) {
    console.error("Torque API request failed:", error);

    return {
      success: false,
      referralCode: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
