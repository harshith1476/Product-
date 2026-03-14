import express from 'express';
import {
    getAllSpecialties,
    getSpecialtyByName,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    getHelplineForAppointment
} from '../controllers/specialtyController.js';
import authAdmin from '../middleware/authAdmin.js';


const specialtyRouter = express.Router();

// Public route - get helpline for appointment
specialtyRouter.get('/helpline/:docId', getHelplineForAppointment);

// Public route - get all active specialties (for patient panel)
specialtyRouter.get('/public/all', getAllSpecialties);

// Admin routes - require authentication
specialtyRouter.get('/all', authAdmin, getAllSpecialties);
specialtyRouter.get('/:specialtyName', authAdmin, getSpecialtyByName);
specialtyRouter.post('/create', authAdmin, createSpecialty);
specialtyRouter.put('/update/:id', authAdmin, updateSpecialty);
specialtyRouter.delete('/delete/:id', authAdmin, deleteSpecialty);

export default specialtyRouter;

