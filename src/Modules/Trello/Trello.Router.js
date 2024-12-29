import {Router} from 'express'
import * as TrelloController from './Trello.Controller.js'
import { auth } from '../../MiddleWare/Auth.js';
import { endPoint } from './Trello.endpoint.js'

const router = Router()

router.post("/addTaskToToDo/:listId", auth(endPoint.addTaskToToDo), TrelloController.addCardToList);
router.patch("/updateCard/:cardId", auth(endPoint.updateCard), TrelloController.updateCard);
router.post("/addCommentToCard/:cardId", auth(endPoint.addCommentToCard), TrelloController.addCommentToCard);

router.get("/getCardById/:cardId", auth(endPoint.getCardById), TrelloController.getCardById);
router.get("/getBoardById/:boardId", auth(endPoint.getBoardById), TrelloController.getBoardById);
router.get("/getAllBoardsForSupervisor", auth(endPoint.getAllBoardsForSupervisor), TrelloController.getAllBoardsForSupervisor);
router.delete("/deleteCardById/:cardId", auth(endPoint.deleteCardById), TrelloController.deleteCardById);


export default router; 