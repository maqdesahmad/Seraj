import {Router} from 'express'
import * as controllerAuthNotifications from './AuthNotifications.Controller.js'
import { auth } from '../../MiddleWare/Auth.js'
import { endPoint } from './AuthNotifications.endpoint.js';

const router = Router()

router.get("/getpendingSupervisors", auth(endPoint.getpendingSupervisors), controllerAuthNotifications.getpendingSupervisors);
router.put("/updateSupervisorStatus/:id", auth(endPoint.updateSupervisorStatus), controllerAuthNotifications.updateSupervisorStatus);
export default router; 