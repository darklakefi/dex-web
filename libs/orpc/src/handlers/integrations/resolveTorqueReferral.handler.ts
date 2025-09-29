"use server";

import type {
  ResolveTorqueReferralInput,
  ResolveTorqueReferralOutput,
} from "../../schemas/integrations/resolveTorqueReferral.schema";

export async function resolveTorqueReferralHandler({
  referralCode,
}: ResolveTorqueReferralInput): Promise<ResolveTorqueReferralOutput> {
  try {
    const torqueApiUrl =
      process.env.NEXT_PUBLIC_TORQUE_API_URL || "https://server.torque.so";

    const response = await fetch(
      `${torqueApiUrl}/resolve-ref-code?code=${referralCode}`,
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
        error: torqueResponse.message || `API Error: ${response.status}`,
      };
    }

    if (torqueResponse.status === "SUCCESS" && torqueResponse.data) {
      return {
        success: true,
        publicKey: torqueResponse.data.publicKey,
        vanity: torqueResponse.data.vanity,
      };
    } else {
      return {
        success: false,
        error: "Torque API returned unexpected response format",
      };
    }
  } catch (error) {
    console.error("Torque API request failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
