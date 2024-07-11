import { Router } from 'express';
// import apartmentRouter from './apartment/apartment.router';
import authRouter from './auth/auth-router';
import vectorGPTRouter from './vector-gpt/vector-gpt.router';


const globalRouter = Router();

// globalRouter.use(authRouter);
globalRouter.use('/gpt', vectorGPTRouter);


// other routers can be added here

export default globalRouter;
