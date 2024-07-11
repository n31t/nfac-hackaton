import { Router } from "express";
import ApartmentController from "./apartment.controller";
import ApartmentService from "./apartment.service";

const apartmentRouter = Router();
const apartmentService = new ApartmentService();
const apartmentController = new ApartmentController(apartmentService);

apartmentRouter.get('/', apartmentController.getAllApartments);
apartmentRouter.get('/:id', apartmentController.getApartmentById);
apartmentRouter.get('/type/buy', apartmentController.getBuyApartments);
apartmentRouter.get('/type/rent', apartmentController.getRentApartments);
apartmentRouter.get('/type/daily', apartmentController.getDailyApartments);
apartmentRouter.post('/find/link', apartmentController.getApartmentByLink);

// apartmentRouter.get('/recommendations/:type', apartmentController.getRecommendations);
// apartmentRouter.get('/lc/emdedded', apartmentController.generateEmbedding)
// apartmentRouter.get('/lc/cool', apartmentController.getFineTextEmbedding)

apartmentRouter.post('/lc/reccomendation', apartmentController.getRecommendation)
apartmentRouter.post('/lc/mightlike', apartmentController.getMightLike)

export default apartmentRouter;