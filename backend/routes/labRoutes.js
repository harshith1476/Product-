import express from 'express';
import { listLabs, getNearbyLabs, addLab, updateLab, deleteLab } from '../controllers/labController.js';
import authAdmin from '../middleware/authAdmin.js';

const labRouter = express.Router();

// Public routes
labRouter.get('/list', listLabs);
labRouter.get('/nearby', getNearbyLabs);

// Admin routes
labRouter.post('/add-lab', authAdmin, addLab);
labRouter.put('/update-lab/:id', authAdmin, updateLab);
labRouter.delete('/delete-lab/:id', authAdmin, deleteLab);

export default labRouter;
