import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import {
    createDoctor as createDoctorDB,
    getAllDoctors as getAllDoctorsDB,
    getDoctorByEmail as getDoctorByEmailDB,
    getDoctorById as getDoctorByIdDB,
    updateDoctor as updateDoctorDB,
    getAllAppointments as getAllAppointmentsDB,
    cancelAppointment as cancelAppointmentDB,
    getAllUsers as getAllUsersDB,
    getAppointmentById as getAppointmentByIdDB
} from "../models/postgresModels.js";
import { sendAppointmentCancellationEmail, sendDoctorWelcomeEmail } from "../services/emailService.js";
import XLSX from "xlsx";
import fs from "fs";
import csv from "csv-parser";
import { createReadStream } from "fs";
import { query } from "../config/postgresql.js";
import { exportTableToExcel } from "../utils/dataExporter.js";
import path from "path";

// Helper to format doctor object for frontend (reused from doctorController logic)
const formatDoctor = (doc) => {
    if (!doc) return null;
    return {
        _id: doc.id,
        id: doc.id,
        name: doc.name,
        email: doc.email,
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
        slots_booked: doc.slots_booked || {},
        date: doc.date,
        status: doc.status,
        currentAppointmentId: doc.current_appointment_id,
        isHospitalDoctor: false // Assuming main doctors for now
    };
};

// API for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {
        const rawAppointments = await getAllAppointmentsDB()

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

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointmentData = await getAppointmentByIdDB(appointmentId)

        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }

        await cancelAppointmentDB(appointmentId)

        // Send cancellation email to patient
        try {
            const emailDetails = {
                patientName: appointmentData.user_data.name,
                doctorName: appointmentData.doctor_data.name,
                speciality: appointmentData.doctor_data.speciality,
                date: appointmentData.slot_date,
                time: appointmentData.slot_time,
                cancelledBy: 'Hospital Administration'
            };

            await sendAppointmentCancellationEmail(appointmentData.user_data.email, emailDetails);
        } catch (emailError) {
            console.error('⚠️ Failed to send cancellation email:', emailError.message);
        }

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for adding Doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" })
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        const existingDoctor = await getDoctorByEmailDB(email);
        if (existingDoctor) {
            return res.json({ success: false, message: "Doctor with this email already exists" })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        let imageUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=667eea&color=fff";
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            imageUrl = imageUpload.secure_url
        }

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees: parseFloat(fees),
            address: typeof address === 'string' ? JSON.parse(address) : address,
            date: Date.now()
        }

        await createDoctorDB(doctorData)
        res.json({ success: true, message: 'Doctor Added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {
        // Get all doctors from PostgreSQL
        const doctors = await getAllDoctorsDB()

        // Map to frontend format
        const allDoctorsList = doctors.map(doc => formatDoctor(doc))

        res.json({ success: true, doctors: allDoctorsList })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor details
const updateDoctor = async (req, res) => {
    try {
        const { docId, name, email, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        if (!docId) {
            return res.json({ success: false, message: "Doctor ID is required" })
        }

        const updateData = {}

        if (name) updateData.name = name
        if (email) {
            if (!validator.isEmail(email)) return res.json({ success: false, message: "Invalid email" })
            updateData.email = email
        }
        if (speciality) updateData.speciality = speciality
        if (degree) updateData.degree = degree
        if (experience) updateData.experience = experience
        if (about) updateData.about = about
        if (fees) updateData.fees = Number(fees)
        if (address) updateData.address = typeof address === 'string' ? JSON.parse(address) : address

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            updateData.image = imageUpload.secure_url
        }

        await updateDoctorDB(docId, updateData) // Postgres updateDoctor handles this
        res.json({ success: true, message: 'Doctor Updated Successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {
        const doctors = await getAllDoctorsDB()
        const users = await getAllUsersDB()
        const allAppointments = await getAllAppointmentsDB()

        const today = new Date()
        const day = String(today.getDate()).padStart(2, '0')
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const year = today.getFullYear()
        const todayStr = `${day}_${month}_${year}`

        // Filter appointments
        const todayAppointments = allAppointments.filter(apt => {
            if (apt.cancelled) return false
            if (apt.slot_date === todayStr) return true

            const appointmentCreatedDate = new Date(parseInt(apt.date))
            const createdDay = String(appointmentCreatedDate.getDate()).padStart(2, '0')
            const createdMonth = String(appointmentCreatedDate.getMonth() + 1).padStart(2, '0')
            const createdYear = appointmentCreatedDate.getFullYear()
            const createdDateStr = `${createdDay}_${createdMonth}_${createdYear}`

            return createdDateStr === todayStr
        })

        const uniquePatientIds = new Set(todayAppointments.map(apt => apt.user_id))
        const totalPatientsToday = uniquePatientIds.size

        const todayRevenue = todayAppointments.reduce((sum, apt) => sum + (parseFloat(apt.amount) || 0), 0)

        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        const monthlyAppointments = allAppointments.filter(apt => {
            if (apt.cancelled) return false
            const aptDate = new Date(parseInt(apt.date))
            return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear
        })
        const monthlyRevenue = monthlyAppointments.reduce((sum, apt) => sum + (parseFloat(apt.amount) || 0), 0)

        const totalRevenue = allAppointments
            .filter(apt => !apt.cancelled)
            .reduce((sum, apt) => sum + (parseFloat(apt.amount) || 0), 0)

        const activeDoctors = doctors.filter(doc => doc.available).length

        // Chart data
        const now = new Date()
        const hourlyPatients = new Array(24).fill(0)
        const hourlyRevenue = new Array(24).fill(0)
        const hourlyAppointments = new Array(24).fill(0)
        const hourLabels = []

        for (let i = 0; i < 24; i++) {
            const hour = new Date(now)
            hour.setHours(now.getHours() - (23 - i))
            hour.setMinutes(0)
            hour.setSeconds(0)
            hour.setMilliseconds(0)
            const label = hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
            hourLabels.push(label)
        }

        allAppointments
            .filter(apt => !apt.cancelled)
            .forEach(apt => {
                const aptDate = new Date(parseInt(apt.date))
                const hoursDiff = (now - aptDate) / (1000 * 60 * 60)
                if (hoursDiff >= 0 && hoursDiff < 24) {
                    const hourIndex = Math.floor(hoursDiff)
                    const arrayIndex = 23 - hourIndex
                    if (arrayIndex >= 0 && arrayIndex < 24) {
                        hourlyAppointments[arrayIndex]++
                        hourlyRevenue[arrayIndex] += (parseFloat(apt.amount) || 0)
                        hourlyPatients[arrayIndex]++
                    }
                }
            })

        const dashData = {
            doctors: doctors.length,
            activeDoctors: activeDoctors,
            appointments: allAppointments.length,
            appointmentsToday: todayAppointments.length,
            patients: users.length,
            patientsToday: totalPatientsToday,
            revenueToday: todayRevenue,
            revenueMonthly: monthlyRevenue,
            revenueTotal: totalRevenue,
            latestAppointments: allAppointments.slice().reverse().slice(0, 10).map(apt => ({
                _id: apt.id,
                docData: apt.doctor_data,
                userData: apt.user_data,
                amount: apt.amount,
                date: apt.date,
                cancelled: apt.cancelled,
                status: apt.status,
                slotDate: apt.slot_date,
                slotTime: apt.slot_time
            })),
            chartData: {
                patientGrowth: { labels: hourLabels, values: hourlyPatients },
                revenue: { labels: hourLabels, values: hourlyRevenue },
                appointments: { labels: hourLabels, values: hourlyAppointments }
            }
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to delete all appointments
const deleteAllAppointments = async (req, res) => {
    try {
        await query('DELETE FROM appointments');
        await query('UPDATE doctors SET slots_booked = $1', [JSON.stringify({})]);

        res.json({
            success: true,
            message: `Successfully deleted appointments`,
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const generatePassword = () => {
    const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const randomPart = Array.from({ length: 5 }, () =>
        randomChars.charAt(Math.floor(Math.random() * randomChars.length))
    ).join('');
    return `pms${randomPart}`;
}

const generateEmployeeId = () => {
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `PMS${randomNum}`;
}

// API for bulk doctors preview
const bulkAddDoctorsPreview = async (req, res) => {
    // Keep mostly the same logic, just don't need mongoose checks
    try {
        const file = req.file;
        if (!file) return res.json({ success: false, message: "No file uploaded" });

        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        let doctorsData = [];

        if (fileExtension === 'csv') {
            const results = [];
            const readStream = createReadStream(file.path);
            await new Promise((resolve, reject) => {
                readStream.pipe(csv()).on('data', d => results.push(d)).on('end', resolve).on('error', reject)
            })
            doctorsData = results;
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const workbook = XLSX.readFile(file.path);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            doctorsData = XLSX.utils.sheet_to_json(sheet);
        } else {
            fs.unlinkSync(file.path);
            return res.json({ success: false, message: "Unsupported format" });
        }

        if (!doctorsData.length) {
            fs.unlinkSync(file.path);
            return res.json({ success: false, message: "No data" });
        }

        const preview = [];
        const errors = [];

        for (let i = 0; i < doctorsData.length; i++) {
            const row = doctorsData[i];
            const name = row.name || row.Name || '';
            const email = row.email || row.Email || '';

            if (!name || !email) {
                errors.push({ row: i + 2, reason: "Missing name or email" });
                continue;
            }
            if (!validator.isEmail(email)) {
                errors.push({ row: i + 2, reason: "Invalid email" });
                continue;
            }

            // Check DB
            const exists = await getDoctorByEmail(email);
            if (exists) {
                errors.push({ row: i + 2, reason: "Email exists" });
                continue;
            }

            preview.push({
                row: i + 2,
                name,
                email,
                speciality: row.speciality || row.Specialty || 'General physician',
                degree: row.degree || 'MBBS',
                experience: row.experience || '1 Year',
                about: row.about || '',
                fees: parseFloat(row.fees) || 500,
                address: { line1: row.addressLine1 || '', line2: row.addressLine2 || '' },
                password: generatePassword(),
                employeeId: generateEmployeeId()
            })
        }

        // Clean up file
        try { fs.unlinkSync(file.path) } catch (e) { }

        res.json({
            success: true,
            preview,
            errors,
            summary: { total: doctorsData.length, valid: preview.length, invalid: errors.length }
        })

    } catch (error) {
        console.error(error);
        if (req.file) try { fs.unlinkSync(req.file.path) } catch (e) { }
        res.json({ success: false, message: error.message })
    }
}

// Bulk add doctors confirm
const bulkAddDoctors = async (req, res) => {
    try {
        const { previewData } = req.body;
        if (!previewData || !previewData.length) return res.json({ success: false, message: "No data" });

        const results = { success: [], failed: [] };

        for (const doc of previewData) {
            try {
                // Double check exists
                const exists = await getDoctorByEmailDB(doc.email);
                if (exists) {
                    results.failed.push({ email: doc.email, reason: "Already exists" });
                    continue;
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(doc.password || generatePassword(), salt);

                const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=667eea&color=fff&size=200`;

                await createDoctorDB({
                    name: doc.name,
                    email: doc.email.toLowerCase(),
                    password: hashedPassword,
                    image: imageUrl,
                    speciality: doc.speciality,
                    degree: doc.degree,
                    experience: doc.experience,
                    about: doc.about,
                    fees: doc.fees,
                    available: true,
                    address: doc.address || { line1: '', line2: '' },
                    date: Date.now()
                })

                // Send email
                try {
                    await sendDoctorWelcomeEmail(doc.email, { name: doc.name, password: doc.password, employeeId: doc.employeeId });
                } catch (e) { }

                results.success.push({ email: doc.email });

            } catch (e) {
                results.failed.push({ email: doc.email, reason: e.message });
            }
        }

        res.json({
            success: true,
            message: `Processed ${previewData.length}`,
            results: {
                successful: results.success.length,
                failed: results.failed.length,
                details: results
            }
        })

    } catch (error) {
        res.status(404).json({ success: false, message: "No data found to export" });
    }
}

// API to export any table as Excel
const exportData = async (req, res) => {
    try {
        const { table } = req.params;
        const validTables = ['users', 'doctors', 'appointments', 'hospitals', 'hospital_tieups', 'medical_knowledge', 'job_applications'];

        if (!validTables.includes(table)) {
            return res.status(400).json({ success: false, message: "Invalid table name" });
        }

        const fileName = `${table}_export_${Date.now()}.xlsx`;
        const filePath = path.join(process.cwd(), 'temp', fileName);

        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        const success = await exportTableToExcel(table, filePath);

        if (success) {
            res.download(filePath, fileName, (err) => {
                if (!err) {
                    // Cleanup file after download
                    setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 60000);
                }
            });
        } else {
            res.status(404).json({ success: false, message: "No data found to export" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    deleteAllAppointments,
    updateDoctor,
    bulkAddDoctorsPreview,
    bulkAddDoctors,
    exportData
}