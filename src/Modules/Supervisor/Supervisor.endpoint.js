import { roles } from "../../MiddleWare/Auth.js";

export const endPoint = {
    AddSupervisor: [roles.Admin],
    DeleteSupervisor: [roles.Admin],
    ReserveSupervisor: [roles.User],
    approveOrRejectReservation: [roles.Manager]
}