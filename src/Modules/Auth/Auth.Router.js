import {Router} from 'express'
import * as controllerAuth from './Auth.Controller.js'

const router = Router()

router.post("/signup", controllerAuth.SignUp);
router.post("/signin", controllerAuth.SignIn);
router.get("/confirmEmail/:token", controllerAuth.ConfirmEmail);
router.patch("/SendCode", controllerAuth.SendCode)
router.patch("/forgetPassword", controllerAuth.forgetPassword)
router.post("/Logout", controllerAuth.Logout)
router.get("/getRoles", controllerAuth.getRoles)
router.get("/getStatus", controllerAuth.getStatus)

export default router; 