import { roles } from "../../MiddleWare/Auth.js";

export const endPoint = {
    ReserveProject: [roles.User],
    approveOrRejectReservation: [roles.Manager],
    AddSuggestedProjects: [roles.Manager],
    deleteProject: [roles.Manager]
}