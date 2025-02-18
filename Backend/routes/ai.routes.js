import { Router } from "express";
import { getResultController } from "../controllers/ai.controller.js";

const router = Router();

router.get('/get-result', getResultController);

export default router;