import express from "express"
import cors from 'cors'
import { testConnection } from "../config/postgresql.js"
import connectCloudinary from "../config/cloudinary.js"
import userRouter from "../routes/userRoute.js"
import doctorRouter from "../routes/doctorRoute.js"
import adminRouter from "../routes/adminRoute.js"
import jobApplicationRouter from "../routes/jobApplicationRoute.js"
import hospitalRouter from "../routes/hospitalRoute.js"
import hospitalTieUpRouter from "../routes/hospitalTieUpRoute.js"
import aiRouter from "../routes/aiRoute.js"
import specialtyRouter from "../routes/specialtyRoute.js"
import otpRouter from "../routes/otpRoute.js"
import emergencyRouter from "../routes/emergencyRoute.js"
import locationRouter from "../routes/locationRoute.js"
import paymentRouter from "../routes/paymentRoute.js"

const app = express()

// Connect to PostgreSQL and Cloudinary
testConnection()
connectCloudinary()

// Middlewares
app.use(express.json())
app.use(cors())

// API endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/jobs", jobApplicationRouter)
app.use("/api/hospital", hospitalRouter)
app.use("/api/hospital-tieup", hospitalTieUpRouter)
app.use("/api/ai", aiRouter)
app.use("/api/specialty", specialtyRouter)
app.use("/api", otpRouter)
app.use("/api/emergency", emergencyRouter)
app.use("/api/location", locationRouter)
app.use("/api/payment", paymentRouter)

app.get("/", (req, res) => {
  res.json({ message: "API Working and using PostgreSQL" })
})

// Export as serverless function for Vercel
export default app
