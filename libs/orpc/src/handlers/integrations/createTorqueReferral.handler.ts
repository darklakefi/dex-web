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
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "GET",
      },
    );

    const torqueResponse = await response.json();

    if (!response.ok) {
      console.error("Torque API error:", {
        response: torqueResponse,
        status: response.status,
        statusText: response.statusText,
      });

      return {
        error: torqueResponse.message || `API Error: ${response.status}`,
        referralCode: "",
        success: false,
      };
    }

    if (torqueResponse.status === "SUCCESS" && torqueResponse.data) {
      return {
        publicKey: torqueResponse.data.publicKey,
        referralCode: torqueResponse.data.code,
        success: true,
        vanity: torqueResponse.data.vanity,
      };
    } else {
      return {
        error: "Torque API returned unexpected response format",
        referralCode: "",
        success: false,
      };
    }
  } catch (error) {
    console.error("Torque API request failed:", error);

    return {
      error: error instanceof Error ? error.message : "Unknown error",
      referralCode: "",
      success: false,
    };
  }
}
