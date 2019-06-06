import { Router } from 'express';
const router = Router();
import ContextController from './context.controller';

router.get('/', async(req, res, next) => {
    try {
        const response = ContextController.getContextsList();
        return res.json(response);
    } catch (error) {
        return next(error);
    }
})

router.get('/:id', async(req, res, next) => {
    try {
        const { id } = req.params;
        const response = ContextController.getContextDetail(id);
        return res.json(response);
    } catch (error) {
        return next(error);
    }
})

router.patch('/:id', async(req, res, next) => {
    try {
        const { id } = req.params;
        const response = await ContextController.updateContext(id, req.body);
        return res.json(response);
    } catch (error) {
        return next(error);
    }
})

export default router;
