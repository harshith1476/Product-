/**
 * PostgreSQL Model Barrel File
 * This file centralizes all database queries by exporting them from individual sub-models.
 * This organization improves maintainability and follows domain-driven design principles.
 */

// Export core database connection tools
export { query, getClient } from '../config/postgresql.js';

// Export domain-specific models
export * from './postgresql/userModel.js';
export * from './postgresql/doctorModel.js';
export * from './postgresql/appointmentModel.js';
export * from './postgresql/hospitalModel.js';
export * from './postgresql/specialtyModel.js';
export * from './postgresql/healthRecordModel.js';
export * from './postgresql/consultationModel.js';
export * from './postgresql/adminModel.js';
export * from './postgresql/labBookingModel.js';
export * from './postgresql/labModel.js';
export * from './postgresql/bloodBankModel.js';
export * from './postgresql/otherModel.js';
