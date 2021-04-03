import express from 'express'
import { getRecords, getNetIncome, getBalance, getCashFlow, getHeader } from '../controllers/controller.js'

const router = express.Router();

router.get('/', getRecords);
router.get('/netIncome', getNetIncome);
router.get('/balance', getBalance);
router.get('/cashFlow', getCashFlow);
router.get('/header', getHeader);

export default router;