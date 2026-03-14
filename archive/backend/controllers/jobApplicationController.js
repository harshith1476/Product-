import fs from "fs";
import path from "path";
import validator from "validator";
import {
  createJobApplication as createJobApplicationDB,
  getAllJobApplications,
  searchJobApplications,
  getJobApplicationById,
  updateJobApplicationStatus,
  deleteJobApplication as deleteJobApplicationDB
} from "../models/postgresModels.js";
import { sendJobInterviewEmail, sendJobRejectionEmail } from "../services/emailService.js";

// Public: create new job application
export const applyForJob = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      qualification,
      experience,
      role_applied,
      skills,
      coverLetter
    } = req.body;

    if (!name || !email || !phone || !city || !qualification || !experience || !role_applied || !skills) {
      return res.status(400).json({ success: false, message: "All required fields must be provided." });
    }

    if (!validator.isEmail(email + "")) {
      return res.status(400).json({ success: false, message: "Invalid email address." });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: "Resume file is required." });
    }

    const sanitizedData = {
      name: validator.escape(name.trim()),
      email: email.trim().toLowerCase(),
      phone: validator.escape(phone.trim()),
      city: validator.escape(city.trim()),
      qualification: validator.escape(qualification.trim()),
      experience: validator.escape(experience.toString().trim()),
      role_applied: validator.escape(role_applied.trim()),
      skills: validator.escape(skills.trim()),
      coverLetter: coverLetter ? validator.escape(coverLetter.trim()) : "",
      resume_file_path: req.file.path // Will be mapped to resume_url in DB
    };

    await createJobApplicationDB(sanitizedData);

    res.json({ success: true, message: "Application submitted successfully." });
  } catch (error) {
    console.error("Error in applyForJob:", error);
    if (error.message && error.message.includes("Only PDF and Word")) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "Resume file size must be 2MB or less." });
    }
    res.status(500).json({ success: false, message: "Failed to submit application." });
  }
};

// Admin: list / search job applications
export const listJobApplications = async (req, res) => {
  try {
    const { search } = req.query;
    let applications;

    if (search && search.trim()) {
      applications = await searchJobApplications(search);
    } else {
      applications = await getAllJobApplications();
    }

    res.json({ success: true, applications });
  } catch (error) {
    console.error("Error in listJobApplications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch applications." });
  }
};

// Admin: download resume
export const downloadResume = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await getJobApplicationById(id);

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    // Map DB column resume_url to file path
    const filePath = application.resume_url;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Resume file not found on server." });
    }

    res.download(path.resolve(filePath));
  } catch (error) {
    console.error("Error in downloadResume:", error);
    res.status(500).json({ success: false, message: "Failed to download resume." });
  }
};

// Admin: delete application (and resume file)
export const deleteJobApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await getJobApplicationById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    const filePath = application.resume_url;

    await deleteJobApplicationDB(id);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting resume file:", err);
        }
      });
    }

    res.json({ success: true, message: "Application deleted successfully." });
  } catch (error) {
    console.error("Error in deleteJobApplication:", error);
    res.status(500).json({ success: false, message: "Failed to delete application." });
  }
};

// Admin: approve application and send interview email
export const approveJobApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await getJobApplicationById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    await updateJobApplicationStatus(id, 'approved');

    // Need to use application role/position from DB. 
    // Mongoose had role_applied. Postgres has position (mapped from role_applied)
    // We should check what column holds the role. 
    // In createJobApplication we mapped role_applied to position.

    await sendJobInterviewEmail(application.email, {
      name: application.name,
      role: application.position || application.role_applied // fallback
    });

    res.json({ success: true, message: "Application approved and interview email sent." });
  } catch (error) {
    console.error("Error in approveJobApplication:", error);
    res.status(500).json({ success: false, message: "Failed to approve application." });
  }
};

// Admin: reject application
export const rejectJobApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await getJobApplicationById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    await updateJobApplicationStatus(id, 'rejected');

    await sendJobRejectionEmail(application.email, {
      name: application.name,
      role: application.position || application.role_applied
    });

    res.json({ success: true, message: "Application rejected and email sent." });
  } catch (error) {
    console.error("Error in rejectJobApplication:", error);
    res.status(500).json({ success: false, message: "Failed to reject application." });
  }
};
