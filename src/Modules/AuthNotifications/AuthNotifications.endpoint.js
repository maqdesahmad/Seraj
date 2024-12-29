import { roles } from "../../MiddleWare/Auth.js";

export const endPoint = {
    getpendingSupervisors: [roles.Admin],
    updateSupervisorStatus: [roles.Admin],
}