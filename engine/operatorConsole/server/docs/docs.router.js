// C:\Users\soren\rewritelabs.io\engine\operatorConsole\server\docs\docs.router.js

import { Router } from "express";
import {
  initDocs,
  listDocs,
  getDoc,
  searchKeyword,
  searchSemantic
} from "./docs.controller.js";

const router = Router();

router.get("/init", initDocs);
router.get("/list", listDocs);
router.get("/get/:version/:name", getDoc);
router.get("/search/keyword", searchKeyword);
router.get("/search/semantic", searchSemantic);

export default router;
