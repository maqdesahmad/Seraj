import {Router} from 'express'
import * as controllercollege from './College.Controller.js'
import { auth } from '../../MiddleWare/Auth.js';
import { endPoint } from './College.endpoint.js'

const router = Router()

router.post("/AddCollege", auth(endPoint.AddCollege), controllercollege.AddCollege);
router.post("/AddDepartment", auth(endPoint.AddDepartment), controllercollege.AddDepartment);
router.get('/getColleges', controllercollege.getColleges);
router.get('/getDepartmentsByCollege/:collegeId', controllercollege.getDepartmentsByCollege);

export default router; 