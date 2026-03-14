import { searchMedicalKnowledgeDB } from '../models/postgresql/medicalModel.js';

/**
 * Service to retrieve medical knowledge from the database.
 * Replaces the static JSON object with dynamic DB queries.
 */

export const getComprehensiveMedicalInfo = async (symptoms = [], query = '') => {
    try {
        let allResults = [];

        // Ensure symptoms is an array
        const symptomsList = Array.isArray(symptoms) ? symptoms : [symptoms];

        // Search for each symptom
        for (const symptom of symptomsList) {
            if (!symptom) continue;
            const results = await searchMedicalKnowledgeDB(symptom);
            allResults = [...allResults, ...results];
        }

        // Also search for query keywords if few results or no symptoms detected
        if ((allResults.length === 0 || symptomsList.length === 0) && query) {
            const results = await searchMedicalKnowledgeDB(query);
            allResults = [...allResults, ...results];
        }

        // Deduplicate results by ID
        const uniqueIds = new Set();
        const uniqueResults = allResults.filter(item => {
            if (uniqueIds.has(item.id)) return false;
            uniqueIds.add(item.id);
            return true;
        });

        // Map to expected structure for Handlers
        // The DB 'keyword' column contains the condition/symptom name
        // The DB 'summary' column contains the full description

        // Extract high severity conditions
        const highSeverity = uniqueResults.some(r => r.severity && r.severity.toLowerCase() === 'high');

        return {
            conditions: uniqueResults.map(r => r.keyword).filter(Boolean),
            precautions: [], // The new dataset doesn't have structured precautions
            otc_medicines: [], // The new dataset doesn't have structured medicines
            when_to_see_doctor: highSeverity ? 'Seek medical attention immediately' : 'If symptoms persist or worsen',
            summaries: uniqueResults.map(r => r.summary).filter(Boolean) // Extra context if needed
        };
    } catch (error) {
        console.error("Error fetching medical info from DB:", error);
        return {
            conditions: [],
            precautions: [],
            otc_medicines: [],
            when_to_see_doctor: ''
        };
    }
};

export const searchMedicalKnowledge = async (term) => {
    return await searchMedicalKnowledgeDB(term);
};

export default {
    getComprehensiveMedicalInfo,
    searchMedicalKnowledge
};
