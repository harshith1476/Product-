import express from 'express';
import { 
    bookLabTest, 
    getUserLabBookings, 
    cancelLabTest, 
    listLabs, 
    getNearbyLabs, 
    addLab, 
    updateLab, 
    deleteLab 
} from '../controllers/labController.js';
import authUser from '../middleware/authUser.js';
import authAdmin from '../middleware/authAdmin.js';

const labRouter = express.Router();

// Public / User routes
labRouter.post('/book', authUser, bookLabTest);
labRouter.get('/my-bookings', authUser, getUserLabBookings);
labRouter.post('/cancel', authUser, cancelLabTest);
labRouter.get('/list', listLabs);
labRouter.get('/nearby', getNearbyLabs);

// Admin routes
labRouter.post('/add-lab', authAdmin, addLab);
labRouter.put('/update-lab/:id', authAdmin, updateLab);
labRouter.delete('/delete-lab/:id', authAdmin, deleteLab);

export default labRouter;
