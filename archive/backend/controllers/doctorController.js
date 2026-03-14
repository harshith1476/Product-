import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
    getDoctorByEmail as getDoctorByEmailDB,
    getDoctorById as getDoctorByIdDB,
    updateDoctor as updateDoctorDB,
    getAllDoctors as getAllDoctorsDB,
    changeDoctorAvailability as changeDoctorAvailabilityDB,
    getAppointmentsByDoctorId as getAppointmentsByDoctorIdDB,
    updateAppointment as updateAppointmentDB
} from "../models/postgresModels.js";
import { query } from "../config/postgresql.js";
import * as queueService from '../services/queueService.js';
import { sendAppointmentCompletionEmail, sendPasswordResetOTP, sendPasswordResetConfirmation } from "../services/emailService.js";
import validator from "validator";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Helper to format doctor object for frontend
const formatDoctor = (doc) => {
    if (!doc) return null;
    let slots_booked = doc.slots_booked || {};
    if (typeof slots_booked === 'string') {
        try {
            slots_booked = JSON.parse(slots_booked);
        } catch (e) {
            slots_booked = {};
        }
    }
    return {
        _id: doc.id, // Map id to _id for frontend compatibility
        id: doc.id,
        name: doc.name,
        email: doc.email,
        password: doc.password, // Usually exclude this in responses
        image: doc.image,
        speciality: doc.speciality,
        degree: doc.degree,
        experience: doc.experience,
        about: doc.about,
        fees: typeof doc.fees === 'string' ? parseFloat(doc.fees) : doc.fees,
        address: doc.address_line1 ? {
            line1: doc.address_line1 || '',
            line2: doc.address_line2 || ''
        } : (typeof doc.address === 'object' ? doc.address : {}),
        available: doc.available,
        slots_booked: slots_booked,
        date: doc.date,
        status: doc.status,
        currentAppointmentId: doc.current_appointment_id,
        averageConsultationTime: doc.average_consultation_time,
        videoConsult: doc.video_consult,
        location: {
            lat: doc.location_lat,
            lng: doc.location_lng
        },
        isHospitalDoctor: false,
        hospital: doc.hospital,
        hospitalId: doc.hospital_id
    };
};

// API for doctor Login 
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await getDoctorByEmailDB(email)

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user.id }, process.env.DOCTOR_JWT_SECRET || process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body
        // getAppointmentsByDoctorId returns snake_case fields from DB
        const rawAppointments = await getAppointmentsByDoctorIdDB(docId)

        // Map to frontend expected format
        const appointments = rawAppointments.map(apt => ({
            _id: apt.id,
            id: apt.id,
            docId: apt.doctor_id,
            userId: apt.user_id,
            slotDate: apt.slot_date,
            slotTime: apt.slot_time,
            userData: apt.user_data,
            docData: apt.doctor_data,
            amount: apt.amount,
            date: apt.date,
            cancelled: apt.cancelled,
            payment: apt.payment,
            isCompleted: apt.is_completed,
            status: apt.status,
            paymentMethod: apt.payment_method
        }))

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body
        const { getAppointmentById: getAppointmentByIdDB, cancelAppointment: cancelAppointmentDB } = await import("../models/postgresModels.js");

        const appointmentDataActual = await getAppointmentByIdDB(appointmentId);

        if (appointmentDataActual && appointmentDataActual.doctor_id == docId) { // == for loose comparison if string vs number
            await cancelAppointmentDB(appointmentId);
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark appointment completed for doctor panel (legacy support - uses queue system)
const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body
        const { getAppointmentById: getAppointmentByIdDBLocal } = await import("../models/postgresModels.js");

        const appointmentData = await getAppointmentByIdDBLocal(appointmentId)

        if (appointmentData && appointmentData.doctor_id == docId) {
            // Use queue service to properly update status
            await queueService.updateAppointmentStatus(appointmentId, 'completed')

            // Update doctor status if this was the current appointment
            const doctor = await getDoctorByIdDB(docId)
            if (doctor?.current_appointment_id == appointmentId) {
                // Manually update current_appointment_id to null using raw query since updateDoctor might not cover it
                await query('UPDATE doctors SET status = $1, current_appointment_id = NULL WHERE id = $2', ['in-clinic', docId]);
            }

            // Send thank you email to patient
            try {
                const emailDetails = {
                    patientName: appointmentData.user_data.name,
                    doctorName: appointmentData.doctor_data.name,
                    speciality: appointmentData.doctor_data.speciality,
                    date: appointmentData.slot_date,
                    time: appointmentData.slot_time
                };

                await sendAppointmentCompletionEmail(appointmentData.user_data.email, emailDetails);
                console.log('✅ Thank you email sent to patient');
            } catch (emailError) {
                console.error('⚠️ Failed to send thank you email:', emailError.message);
            }

            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment not found' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {
        const { hospitalId } = req.query;
        let doctors = await getAllDoctorsDB();

        if (hospitalId) {
            doctors = doctors.filter(doc => doc.hospital_id == hospitalId);
        }

        // Log for debugging
        console.log(`📋 Doctor List API: Found ${doctors.length} doctors in database`)

        // Map to frontend format
        const doctorsWithDefaults = doctors.map(doc => formatDoctor(doc));

        res.json({ success: true, doctors: doctorsWithDefaults })

    } catch (error) {
        console.error('❌ Error in doctorList:', error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {
        const { docId } = req.body
        const docData = await getDoctorByIdDB(docId)
        await changeDoctorAvailabilityDB(docId, !docData.available)
        res.json({ success: true, message: 'Availablity Changed' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.body
        const rawDoctor = await getDoctorByIdDB(docId)

        // Remove password
        const { password, ...rest } = rawDoctor || {};

        const profileData = formatDoctor(rawDoctor);
        if (profileData) delete profileData.password;

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {
        const docId = req.doctorId || req.body.docId
        const { fees, address, available, about } = req.body
        const imageFile = req.file

        if (!docId) {
            return res.json({ success: false, message: 'Doctor ID is required' })
        }

        const updateData = {}

        if (fees !== undefined && fees !== null && fees !== '') {
            updateData.fees = parseFloat(fees) || 0
        }

        if (address !== undefined && address !== null && address !== '') {
            try {
                const addrObj = typeof address === 'string' ? JSON.parse(address) : address;
                updateData.address = addrObj; // helper maps this to line1/line2
            } catch (e) {
                updateData.address = { line1: address };
            }
        }

        if (available !== undefined && available !== null) {
            updateData.available = available === 'true' || available === true || available === '1' || available === 1
        }

        if (about !== undefined && about !== null) {
            updateData.about = about
        }

        // Handle image upload
        if (imageFile) {
            try {
                const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
                    resource_type: "image",
                    folder: "doctor-profiles"
                })
                updateData.image = imageUpload.secure_url
                try { fs.unlinkSync(imageFile.path) } catch (e) { }
            } catch (uploadError) {
                console.log("Image upload error:", uploadError)
                try { fs.unlinkSync(imageFile.path) } catch (e) { }
            }
        }

        await updateDoctorDB(docId, updateData)

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log('Update profile error:', error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body
        const appointments = await getAppointmentsByDoctorId(docId)

        let earnings = 0
        const patientsSet = new Set()

        appointments.forEach((item) => {
            if (item.is_completed || item.payment) {
                earnings += parseFloat(item.amount) || 0
            }
            if (item.user_id && !patientsSet.has(item.user_id)) {
                patientsSet.add(item.user_id)
            }
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patientsSet.size,
            latestAppointments: appointments.slice().reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get queue status for doctor
const getQueueStatus = async (req, res) => {
    try {
        const { docId } = req.body
        let { slotDate } = req.query

        if (!docId) {
            return res.json({ success: false, message: 'Doctor ID is required' })
        }

        if (!slotDate) {
            const today = new Date()
            const day = today.getDate()
            const month = today.getMonth() + 1
            const year = today.getFullYear()
            slotDate = `${day}_${month}_${year}`
        }

        const queueStatus = await queueService.getDoctorQueueStatus(docId, slotDate)

        if (!queueStatus) {
            return res.json({
                success: true,
                queueStatus: {
                    status: 'in-clinic',
                    currentAppointmentId: null,
                    queueLength: 0,
                    appointments: [],
                    docId: docId
                },
                suggestions: [],
                delayedAppointments: []
            })
        }

        const suggestions = await queueService.getSmartSchedulingSuggestions(docId, slotDate, queueStatus?.currentAppointmentId || null).catch(err => [])
        const delayedAppointments = await queueService.checkDelayedAppointments(docId, slotDate).catch(err => [])

        res.json({
            success: true,
            queueStatus: {
                ...queueStatus,
                docId: docId
            },
            suggestions: suggestions || [],
            delayedAppointments: delayedAppointments || []
        })
    } catch (error) {
        console.error('Error in getQueueStatus:', error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor status
const updateDoctorStatus = async (req, res) => {
    try {
        const { docId } = req.body
        const { status, breakDuration } = req.body

        if (!docId) return res.json({ success: false, message: 'Doctor ID is required' })
        if (!status) return res.json({ success: false, message: 'Status is required' })

        const validStatuses = ['in-clinic', 'in-consult', 'on-break', 'unavailable']
        if (!validStatuses.includes(status)) {
            return res.json({ success: false, message: 'Invalid status' })
        }

        // Custom update for break logic, as updateDoctor is simple
        if (status === 'on-break') {
            await query('UPDATE doctors SET status = $1, break_start_time = $2, break_duration = $3 WHERE id = $4', [status, Date.now(), breakDuration || 15, docId]);
        } else if (status === 'in-clinic') {
            await query('UPDATE doctors SET status = $1, break_start_time = NULL WHERE id = $2', [status, docId]);
        } else if (status === 'unavailable') {
            await query('UPDATE doctors SET status = $1, current_appointment_id = NULL WHERE id = $2', [status, docId]);
        } else {
            await updateDoctor(docId, { status })
        }

        res.json({ success: true, message: 'Status updated successfully' })
    } catch (error) {
        console.error('Error in updateDoctorStatus:', error)
        res.json({ success: false, message: error.message || 'Failed to update status' })
    }
}

// API to start consultation
const startConsultation = async (req, res) => {
    try {
        const { docId } = req.body
        const { appointmentId } = req.body
        const { getAppointmentById } = await import("../models/postgresModels.js");

        if (!docId || !appointmentId) {
            return res.json({ success: false, message: 'Doctor ID and Appointment ID are required' })
        }

        const appointment = await getAppointmentById(appointmentId)
        if (!appointment || appointment.doctor_id != docId) {
            return res.json({ success: false, message: 'Invalid appointment' })
        }

        await queueService.updateAppointmentStatus(appointmentId, 'in-consult')

        // Update doctor and alert appointment in parallel
        await Promise.all([
            query('UPDATE doctors SET status = $1, current_appointment_id = $2 WHERE id = $3', ['in-consult', appointmentId, docId]),
            query('UPDATE appointments SET alerted = true WHERE id = $1', [appointmentId])
        ]);

        res.json({ success: true, message: 'Consultation started successfully' })
    } catch (error) {
        console.error('Error in startConsultation:', error)
        res.json({ success: false, message: error.message })
    }
}

// API to complete consultation
const completeConsultation = async (req, res) => {
    try {
        const { docId } = req.body
        const { appointmentId, markNoShow } = req.body
        const { getAppointmentById } = await import("../models/postgresModels.js");

        const appointment = await getAppointmentById(appointmentId)
        if (!appointment || appointment.doctor_id != docId) {
            return res.json({ success: false, message: 'Invalid appointment' })
        }

        if (markNoShow) {
            await queueService.updateAppointmentStatus(appointmentId, 'no-show')
        } else {
            await queueService.updateAppointmentStatus(appointmentId, 'completed')

            // Send thank you email
            try {
                const emailDetails = {
                    patientName: appointment.user_data.name,
                    doctorName: appointment.doctor_data.name,
                    speciality: appointment.doctor_data.speciality,
                    date: appointment.slot_date,
                    time: appointment.slot_time
                };
                await sendAppointmentCompletionEmail(appointment.user_data.email, emailDetails);
            } catch (e) { }
        }

        // Reset doctor status
        await query('UPDATE doctors SET status = $1, current_appointment_id = NULL WHERE id = $2', ['in-clinic', docId]);

        const suggestions = await queueService.getSmartSchedulingSuggestions(docId, appointment.slot_date, appointmentId)

        res.json({
            success: true,
            message: markNoShow ? 'Marked as no-show' : 'Consultation completed',
            suggestions
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to move appointment in queue
const moveAppointmentInQueue = async (req, res) => {
    // Requires sorting column in DB which we don't have yet (using token_number as implicit sort).
    // Swapping token numbers?
    res.json({ success: false, message: 'Reordering not yet supported in Postgres mode' })
}

// API to get smart scheduling suggestions
const getSmartSuggestions = async (req, res) => {
    try {
        const { docId } = req.body
        const { slotDate, currentAppointmentId } = req.query

        const suggestions = await queueService.getSmartSchedulingSuggestions(
            docId,
            slotDate || new Date().toISOString().split('T')[0],
            currentAppointmentId || null
        )

        res.json({ success: true, suggestions })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.json({ success: false, message: "Email is required" });

        const doctor = await getDoctorByEmail(email);
        if (!doctor) return res.json({ success: true, message: "If email exists, OTP sent." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOTP = await bcrypt.hash(otp, 10);

        await query("UPDATE doctors SET reset_password_otp = $1, reset_password_otp_expiry = $2 WHERE id = $3",
            [hashedOTP, new Date(Date.now() + 10 * 60000), doctor.id]);

        await sendPasswordResetOTP(doctor.email, otp, doctor.name);
        res.json({ success: true, message: "OTP sent." });

    } catch (error) {
        console.error('Error in doctor forgotPassword:', error);
        res.json({ success: false, message: error.message });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const doctor = await getDoctorByEmail(email);
        if (!doctor) return res.json({ success: false, message: "Doctor not found" });

        if (!doctor.reset_password_otp) return res.json({ success: false, message: "No OTP request found" });

        const isOTPValid = await bcrypt.compare(otp, doctor.reset_password_otp);
        if (!isOTPValid) return res.json({ success: false, message: "Invalid OTP" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await query("UPDATE doctors SET password = $1, reset_password_otp = NULL, reset_password_otp_expiry = NULL WHERE id = $2",
            [hashedPassword, doctor.id]);

        await sendPasswordResetConfirmation(doctor.email, doctor.name);
        res.json({ success: true, message: "Password reset successful" });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
    getQueueStatus,
    updateDoctorStatus,
    startConsultation,
    completeConsultation,
    moveAppointmentInQueue,
    getSmartSuggestions,
    forgotPassword,
    resetPassword
}