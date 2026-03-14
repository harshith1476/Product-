import * as labModel from '../models/postgresql/labModel.js';
import * as labBookingModel from '../models/postgresql/labBookingModel.js';

// Get all labs
export const listLabs = async (req, res) => {
    try {
        const labs = await labModel.getAllLabs();
        res.json({ success: true, labs });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Get nearby labs
export const getNearbyLabs = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.json({ success: false, message: "Latitude and Longitude are required" });
        }

        const labs = await labModel.getAllLabs();
        
        // Haversine formula to calculate distance
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Radius of the earth in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distance in km
        };

        const labsWithDistance = labs.map(lab => ({
            ...lab,
            distance: calculateDistance(parseFloat(lat), parseFloat(lng), parseFloat(lab.latitude), parseFloat(lab.longitude))
        })).sort((a, b) => a.distance - b.distance);

        res.json({ success: true, labs: labsWithDistance });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Add Lab
export const addLab = async (req, res) => {
    try {
        const lab = await labModel.createLab(req.body);
        res.json({ success: true, message: "Lab added successfully", lab });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Update Lab
export const updateLab = async (req, res) => {
    try {
        const lab = await labModel.updateLab(req.params.id, req.body);
        res.json({ success: true, message: "Lab updated successfully", lab });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Delete Lab
export const deleteLab = async (req, res) => {
    try {
        await labModel.deleteLab(req.params.id);
        res.json({ success: true, message: "Lab deleted successfully" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// User: Book Lab Test
export const bookLabTest = async (req, res) => {
    try {
        const { userId } = req.body;
        const booking = await labBookingModel.createLabBooking({ ...req.body, userId });
        res.json({ success: true, message: "Lab test booked successfully", booking });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// User: Get bookings
export const getUserLabBookings = async (req, res) => {
    try {
        const { userId } = req.body;
        const bookings = await labBookingModel.getLabBookingsByUserId(userId);
        res.json({ success: true, bookings });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// User: Cancel booking
export const cancelLabTest = async (req, res) => {
    try {
        const { id } = req.body;
        await labBookingModel.cancelLabBooking(id);
        res.json({ success: true, message: "Booking cancelled successfully" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
