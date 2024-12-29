import express from "express";
import { getStatistics } from './Statistics.Controller.js'

const router = express.Router();

router.get("/getStatistics", getStatistics);

export default router;
