import { createTorqueReferral } from "../procedures/integrations/createTorqueReferral.procedure";
import { resolveTorqueReferral } from "../procedures/integrations/resolveTorqueReferral.procedure";

export const integrationsRouter = {
	createTorqueReferral,
	resolveTorqueReferral,
};
