import * as bloodBankModel from '../models/postgresql/bloodBankModel.js';

// Get all blood banks
export const listBloodBanks = async (req, res) => {
    try {
        const bloodBanks = await bloodBankModel.getAllBloodBanks();
        res.json({ success: true, bloodBanks });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Get nearby blood banks
export const getNearbyBloodBanks = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.json({ success: false, message: "Latitude and Longitude are required" });
        }

        const bloodBanks = await bloodBankModel.getAllBloodBanks();
        
        // Haversine formula
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const banksWithDistance = bloodBanks.map(bank => ({
            ...bank,
            distance: calculateDistance(parseFloat(lat), parseFloat(lng), parseFloat(bank.latitude), parseFloat(bank.longitude))
        })).sort((a, b) => a.distance - b.distance);

        res.json({ success: true, bloodBanks: banksWithDistance });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Add Blood Bank
export const addBloodBank = async (req, res) => {
    try {
        const bloodBank = await bloodBankModel.createBloodBank(req.body);
        res.json({ success: true, message: "Blood bank added successfully", bloodBank });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Update Blood Bank
export const updateBloodBank = async (req, res) => {
    try {
        const bloodBank = await bloodBankModel.updateBloodBank(req.params.id, req.body);
        res.json({ success: true, message: "Blood bank updated successfully", bloodBank });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Delete Blood Bank
export const deleteBloodBank = async (req, res) => {
    try {
        await bloodBankModel.deleteBloodBank(req.params.id);
        res.json({ success: true, message: "Blood bank deleted successfully" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
