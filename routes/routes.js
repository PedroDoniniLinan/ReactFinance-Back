import express from 'express'
import { getRecords, getNetIncome, getBalance, getCashFlow, getHeader, getIncomeCategory, getExpensesCategory, getIncomeSubcategory, getExpensesSubcategory, getPortfolioHeader } from '../controllers/controller.js'

const router = express.Router();

router.get('/', getRecords);
router.get('/netIncome', getNetIncome);
router.get('/balance', getBalance);
router.get('/cashFlow', getCashFlow);
router.get('/header', getHeader);
router.get('/incomeCategory', getIncomeCategory);
router.get('/expensesCategory', getExpensesCategory);
router.get('/incomeSubcategory', getIncomeSubcategory);
router.get('/expensesSubcategory', getExpensesSubcategory);
router.get('/portfolioHeader', getPortfolioHeader);

export default router;