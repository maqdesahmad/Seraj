import {Router} from 'express'
import * as controllerSuggestedProject from './Suggestedprojects.Controller.js'
import { auth } from '../../MiddleWare/Auth.js';
import { endPoint } from './SuggestedProject.endpoint.js';
import upload from '../../Services/multer.js';

const router = Router()

router.post("/AddSuggestedProjects", upload.single('projectFile'), auth(endPoint.AddSuggestedProjects), controllerSuggestedProject.AddSuggestedProjects);
router.get("/getSuggestedProjects", controllerSuggestedProject.getSuggestedProjects);
router.get("/getUnreservedProjects",auth(endPoint.AddSuggestedProjects), controllerSuggestedProject.getUnreservedProjects);
router.delete("/deleteSuggestedProjects/:id", auth(endPoint.deleteProject), controllerSuggestedProject.deleteSuggestedProjects);
router.post("/ReserveProject/:projectId", auth(endPoint.ReserveProject), controllerSuggestedProject.ReserveProject);
router.get("/getPendingProjects", controllerSuggestedProject.getPendingProjects);
router.get("/getAcceptProjects", controllerSuggestedProject.getAcceptProjects);
router.post("/approveOrRejectReservation/:projectId", auth(endPoint.approveOrRejectReservation), controllerSuggestedProject.approveOrRejectReservation);

export default router; 