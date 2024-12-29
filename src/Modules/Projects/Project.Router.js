import {Router} from 'express'
import * as controllerProject from './Project.Controller.js'
import { auth } from '../../MiddleWare/Auth.js';
import { endPoint } from './Project.endpoint.js';
import upload from '../../Services/multer.js';

const router = Router()

router.post("/AddProjects", upload.single('projectFile'), auth(endPoint.AddProjects), controllerProject.AddProjects);
router.get("/getProjects", controllerProject.getProjects);
router.get("/getProjectsByDepartment/:departmentId", controllerProject.getProjectsByDepartment);
router.delete("/deleteProjects/:id", auth(endPoint.deleteProjects), controllerProject.deleteProjects);

export default router; 