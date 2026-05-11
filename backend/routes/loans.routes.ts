import { Router } from 'express';
import { getLoans, saveLoan, deleteLoan, updateLoanStatus, getSpecialLoans, saveSpecialLoan, deleteSpecialLoan, getEquipmentInventory, updateEquipmentInventory } from '../controllers/loans.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/loans', authMiddleware, getLoans);
router.post('/loans', authMiddleware, saveLoan);
router.delete('/loans/:id', authMiddleware, deleteLoan);
router.post('/loans/:id/status', authMiddleware, updateLoanStatus);

router.get('/special-loans', authMiddleware, getSpecialLoans);
router.post('/special-loans', authMiddleware, saveSpecialLoan);
router.delete('/special-loans/:id', authMiddleware, deleteSpecialLoan);

router.get('/equipment-inventory', authMiddleware, getEquipmentInventory);
router.post('/equipment-inventory', authMiddleware, updateEquipmentInventory);

export default router;
