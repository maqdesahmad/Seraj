import {Router} from 'express'
import * as controllerSupervisor from './Supervisor.Controller.js'
import { auth } from '../../MiddleWare/Auth.js';
import { endPoint } from './Supervisor.endpoint.js'

const router = Router()

router.post("/AddSupervisor", auth(endPoint.AddSupervisor), controllerSupervisor.AddSupervisor);
router.get('/GetSupervisors/:departmentId', controllerSupervisor.GetSupervisors);
router.get('/GetSupervisors', controllerSupervisor.GetAllSupervisors);
router.get('/GetActiveSupervisors', controllerSupervisor.GetActiveSupervisors);
router.get('/GetPendingSupervisors', controllerSupervisor.GetPendingSupervisors);
router.get('/GetSupervisorGroups/:supervisorId', controllerSupervisor.GetSupervisorGroups);
router.delete('/DeleteSupervisor/:supervisorId', auth(endPoint.DeleteSupervisor), controllerSupervisor.DeleteSupervisor);
router.post('/ReserveSupervisor/:supervisorId', auth(endPoint.ReserveSupervisor), controllerSupervisor.ReserveSupervisor);
router.post('/approveOrRejectReservation/:supervisorId', auth(endPoint.approveOrRejectReservation), controllerSupervisor.approveOrRejectReservation);

export default router; 