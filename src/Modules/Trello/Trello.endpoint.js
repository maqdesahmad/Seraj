import { roles } from "../../MiddleWare/Auth.js";

export const endPoint = {
    addTaskToToDo: [roles.User],
    updateCard: [roles.User],
    addCommentToCard: [roles.Manager],
    getBoardById: [roles.User, roles.Manager],
    getCardById: [roles.User, roles.Manager],
    getAllBoardsForSupervisor: [roles.Manager],
    deleteCardById: [roles.User],
}