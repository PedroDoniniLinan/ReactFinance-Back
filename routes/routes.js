import express from 'express'
import { getRecords, getNetIncome, getBalance, getCashFlow } from '../controllers/controller.js'

const router = express.Router();

router.get('/', getRecords);
router.get('/netIncome', getNetIncome);
router.get('/balance', getBalance);
router.get('/cashFlow', getCashFlow);

export default router;