import { roles } from "../../MiddleWare/Auth.js";

export const endPoint = {
    AddCollege: [roles.Admin],
    AddDepartment: [roles.Admin]
}