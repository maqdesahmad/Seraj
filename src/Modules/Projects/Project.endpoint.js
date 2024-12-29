import { roles } from "../../MiddleWare/Auth.js";

export const endPoint = {
    AddProjects: [roles.Admin],
    deleteProjects: [roles.Admin]
}