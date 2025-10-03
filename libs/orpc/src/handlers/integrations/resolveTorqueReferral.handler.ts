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
        success: false,
      };
    }

    if (torqueResponse.status === "SUCCESS" && torqueResponse.data) {
      return {
        publicKey: torqueResponse.data.publicKey,
        success: true,
        vanity: torqueResponse.data.vanity,
      };
    } else {
      return {
        error: "Torque API returned unexpected response format",
        success: false,
      };
    }
  } catch (error) {
    console.error("Torque API request failed:", error);

    return {
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    };
  }
}
