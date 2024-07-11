import { Router } from "express";
import VectorGPTController from "./vector-gpt.controller";
import VectorGPTService from "./vector-gpt.service";

const vectorGPTRouter = Router();
const vectorGPTService = new VectorGPTService();
const vectorGPTController = new VectorGPTController(vectorGPTService);

vectorGPTRouter.post(
  "/create-total-marks",
  vectorGPTController.createTotalMarks
);

export default vectorGPTRouter;
