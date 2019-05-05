import { Router } from 'express';
const router = Router();
import MeasurementController from './measurement.controller';

router.post('/v1', async (req, res, next) => {
    try {
        const response = await MeasurementController.reportMeasurements(req.body, 1);
        return res.json(response);
    } catch (error) {
        return next(error);
    }
});

router.post('/v2', async (req, res, next) => {
    try {
        const response = await MeasurementController.reportMeasurements(req.body, 2);
        return res.json(response);
    } catch (error) {
        return next(error);
    }
});

export default router;
