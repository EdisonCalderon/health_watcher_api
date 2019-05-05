import { Router } from 'express';
import AuthController from './auth.controller';

const router = Router();

router.post('/login', async (req, res, next) => {
    AuthController.login(req, res, next);
});

router.post('/is-logged-in', async (req, res, next) => {
    AuthController.isLoggedIn(req, res, next);
});

router.post('/logout', async (req, res, next) => {
    AuthController.logout(req, res, next);
});

export default router;
