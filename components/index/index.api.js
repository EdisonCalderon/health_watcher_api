import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
	res.json({ data: "Welcome to index" });
});

export default router;
