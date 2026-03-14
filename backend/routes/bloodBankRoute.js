import express from 'express';
import { listBloodBanks, getNearbyBloodBanks, addBloodBank, updateBloodBank, deleteBloodBank } from '../controllers/bloodBankController.js';
import authAdmin from '../middleware/authAdmin.js';

const bloodBankRouter = express.Router();

// Public routes
bloodBankRouter.get('/list', listBloodBanks);
bloodBankRouter.get('/nearby', getNearbyBloodBanks);

// Admin routes
bloodBankRouter.post('/add-blood-bank', authAdmin, addBloodBank);
bloodBankRouter.put('/update-blood-bank/:id', authAdmin, updateBloodBank);
bloodBankRouter.delete('/delete-blood-bank/:id', authAdmin, deleteBloodBank);

export default bloodBankRouter;
