import { Router } from "express";
import { dumpAnalytics } from "./analytics.controller.js";

const router = Router();

router.get("/dump", dumpAnalytics);

export default router;
