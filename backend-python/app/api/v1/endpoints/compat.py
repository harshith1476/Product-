"""
Compatibility API routes that match the Node.js Express backend format.
The frontend expects routes like /api/user/login, /api/doctor/list, etc.
with responses in {success: true, data...} format.
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import io
import json
import pandas as pd
import random
import string
import logging
import math
import httpx

logger = logging.getLogger(__name__)

from app.core.security import create_access_token, verify_password, get_password_hash
from app.crud import crud_user
from app.crud.crud_hospital import hospital_tieup as crud_hospital
from app.db.session import get_db
from app.models.user import User
from app.models.hospital import HospitalTieUp, HospitalTieUpDoctor
from app.models.appointment import Appointment
from app.models.specialty import Specialty
from app.models.job import JobApplication
from app.crud.crud_appointment import appointment as crud_appointment
from app.utils.otp_storage import otp_manager
from app.utils.email import (
    send_otp_email, 
    send_transactional_email, 
    send_job_interview_email, 
    send_job_rejection_email
)
from app.services.ai_service import ai_service
from app.crud.crud_health_record import health_record as crud_health_record
from app.models.health_record import HealthRecord
from app.utils.cloudinary_utils import upload_file_auto, delete_file as delete_cloudinary_file

from datetime import date, datetime, timedelta
from jose import jwt, JWTError
from app.core.config import settings
from app.core.security import ALGORITHM

router = APIRouter()

async def get_request_data(request: Request) -> dict:
    """Helper to get data from either JSON body or Form data."""
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            return await request.json()
        except Exception:
            return {}
    elif "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        data = {}
        for key in form_data.keys():
            val = form_data.get(key)
            # Try to parse JSON strings (common in our frontend's FormData)
            if isinstance(val, str) and (val.startswith("{") or val.startswith("[")):
                try:
                    data[key] = json.loads(val)
                except:
                    data[key] = val
            else:
                data[key] = val
        return data
    return {}


# ============================================
# ============================================
# Auth helper - extract user from token header
# ============================================
async def get_current_user_compat(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Header(None),
    atoken: Optional[str] = Header(None),
    dtoken: Optional[str] = Header(None)
) -> Optional[User]:
    """Dependency to extract user from any of the token headers."""
    auth_token = token or atoken or dtoken
    if not auth_token:
        return None
        
    try:
        if auth_token.startswith("Bearer "):
            auth_token = auth_token[7:]
        payload = jwt.decode(auth_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return await crud_user.get(db, id=int(user_id))
    except (JWTError, Exception):
        pass
    return None


# ============================================
# User Routes (matching Node.js /api/user/*)
# ============================================

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None


@router.post("/user/login")
async def user_login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login endpoint matching Node.js format."""
    user = await crud_user.authenticate(db, email=req.email, password=req.password)
    if not user:
        return {"success": False, "message": "Invalid email or password"}

    token = create_access_token(user.id)
    return {"success": True, "token": token}


@router.post("/user/register")
async def user_register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register endpoint matching Node.js format."""
    existing = await crud_user.get_by_email(db, email=req.email)
    if existing:
        return {"success": False, "message": "User already exists with this email"}

    from app.schemas.user import UserCreate
    user_in = UserCreate(
        name=req.name,
        email=req.email,
        password=req.password,
        phone=req.phone,
        dob=req.dob or "Not Selected",
        gender=req.gender or "Not Selected",
        blood_group=req.bloodGroup,
    )
    user = await crud_user.create(db, obj_in=user_in)
    token = create_access_token(user.id)
    return {"success": True, "token": token}


@router.get("/user/get-profile")
async def get_profile(
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Get user profile matching Node.js format."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}

    return {
        "success": True,
        "userData": {
            "_id": str(user.id),
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone or "",
            "address": {"line1": user.address_line1 or "", "line2": user.address_line2 or ""} if user.address_line1 else {},
            "gender": user.gender or "Not Selected",
            "dob": user.dob or "Not Selected",
            "age": user.age,
            "bloodGroup": user.blood_group or "",
            "image": user.image or "",
            "role": user.role or "patient",
            "savedProfiles": [
                {
                    "_id": str(p.id),
                    "id": p.id,
                    "name": p.name,
                    "age": p.age,
                    "gender": p.gender,
                    "relationship": p.relationship,
                    "phone": p.phone or "",
                    "medicalHistory": p.medical_history or []
                } for p in user.saved_profiles
            ] if user.saved_profiles else [],
            "emergencyContacts": {
                "friends": [
                    {"id": c.id, "name": c.name, "phone": c.phone, "relation": c.relation}
                    for c in user.emergency_contacts if c.contact_type == "friend"
                ],
                "family": [
                    {"id": c.id, "name": c.name, "phone": c.phone, "relation": c.relation}
                    for c in user.emergency_contacts if c.contact_type == "family"
                ]
            } if user.emergency_contacts else {"friends": [], "family": []}
        },
    }


@router.post("/user/update-profile")
async def update_profile(
    request: Request,
    image: Optional[UploadFile] = File(None),
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db),
):
    """Update user profile."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}

    body = await get_request_data(request)

    update_fields = {}
    if "name" in body:
        update_fields["name"] = body["name"]
    if "phone" in body:
        update_fields["phone"] = body["phone"]
    if "gender" in body:
        update_fields["gender"] = body["gender"]
    if "dob" in body:
        update_fields["dob"] = body["dob"]
    if "age" in body:
        try:
            update_fields["age"] = int(body["age"])
        except (ValueError, TypeError):
            pass
    if "bloodGroup" in body:
        update_fields["blood_group"] = body["bloodGroup"]
    
    if "address" in body:
        addr = body["address"]
        if isinstance(addr, dict):
            update_fields["address_line1"] = addr.get("line1", "")
            update_fields["address_line2"] = addr.get("line2", "")

    # Handle image upload
    if image:
        from app.utils.cloudinary_utils import upload_image
        content = await image.read()
        image_url = await upload_image(content)
        if image_url:
            update_fields["image"] = image_url

    if update_fields:
        await crud_user.update(db, db_obj=user, obj_in=update_fields)

    return {"success": True, "message": "Profile Updated"}


@router.get("/user/health-records")
async def get_health_records(
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Get all health records for the logged-in user."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    records = await crud_health_record.get_by_user(db, user_id=user.id)
    
    return {
        "success": True,
        "records": [
            {
                "_id": str(r.id),
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "recordType": r.record_type,
                "doctorName": r.doctor_name,
                "date": r.record_date.isoformat() if r.record_date else None,
                "attachments": r.attachments or [],
                "tags": r.tags or [],
                "isImportant": r.is_important,
                "createdAt": r.created_at.isoformat() if r.created_at else None
            } for r in records
        ]
    }


@router.post("/user/health-records/upload")
async def upload_health_record(
    request: Request,
    files: List[UploadFile] = File(...),
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Upload new health records with files."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    # We use Form fields for the other data since it's multipart
    form_data = await request.form()
    title = form_data.get("title", "Medical Report")
    record_type = form_data.get("recordType", "General")
    description = form_data.get("description", "")
    doctor_name = form_data.get("doctorName", "")
    record_date_str = form_data.get("date")
    tags_str = form_data.get("tags", "[]")
    is_important = form_data.get("isImportant") == "true"

    try:
        tags = json.loads(tags_str)
    except:
        tags = []

    # Upload files to Cloudinary
    uploaded_attachments = []
    for file in files:
        file_content = await file.read()
        url, public_id = await upload_file_auto(file_content, folder=f"health-records/{user.id}")
        if url:
            uploaded_attachments.append({
                "url": url,
                "fileName": file.filename,
                "fileType": file.content_type.split("/")[-1],
                "fileSize": len(file_content),
                "cloudinaryPublicId": public_id
            })

    from app.models.health_record import HealthRecord
    from sqlalchemy.sql import func
    
    # Parse date
    record_date = date.today()
    if record_date_str:
        try:
            record_date = datetime.strptime(record_date_str, "%Y-%m-%d").date()
        except:
            pass

    new_record = HealthRecord(
        user_id=user.id,
        title=title,
        description=description,
        record_type=record_type,
        doctor_name=doctor_name,
        record_date=record_date,
        attachments=uploaded_attachments,
        tags=tags,
        is_important=is_important
    )
    
    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    
    return {
        "success": True, 
        "message": "Health record uploaded successfully",
        "record": {
            "id": new_record.id,
            "title": new_record.title
        }
    }


@router.delete("/user/health-records/delete/{record_id}")
async def delete_health_record_compat(
    record_id: int,
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Delete a health record and its Cloudinary attachments."""
    if not user:
        return {"success": False, "message": "Unauthorized"}
    
    record = await crud_health_record.get(db, id=record_id)
    if not record:
        return {"success": False, "message": "Record not found"}
    
    if record.user_id != user.id:
        return {"success": False, "message": "Unauthorized"}
    
    # Delete from Cloudinary
    attachments = record.attachments or []
    for att in attachments:
        public_id = att.get("cloudinaryPublicId")
        if public_id:
            await delete_cloudinary_file(public_id)
            
    await crud_health_record.remove(db, id=record_id)
    return {"success": True, "message": "Record deleted successfully"}


# ============================================
# Doctor Routes (matching Node.js /api/doctor/*)
# ============================================

# Handled by get_doctor_list below


# Handled by get_doctor_detail below


# ============================================
# Hospital Routes (matching Node.js /api/hospital-tieup/*)
# ============================================

@router.get("/hospital-tieup/public")
async def hospital_public(db: AsyncSession = Depends(get_db)):
    """Get public hospitals matching Node.js format."""
    hospitals = await crud_hospital.get_public_hospitals(db)

    hospital_list = []
    for h in hospitals:
        hospital_list.append({
            "_id": str(h.id),
            "name": h.name,
            "address": h.address or "",
            "contact": h.contact or "",
            "specialization": h.specialization or "",
            "type": h.type or "General",
            "showOnHome": h.show_on_home,
            "doctors": [
                {
                    "_id": str(d.id),
                    "name": d.name,
                    "qualification": d.qualification or "",
                    "specialization": d.specialization or "",
                    "experience": d.experience or "",
                    "image": d.image or "",
                    "available": d.available if d.available is not None else True,
                }
                for d in (h.doctors or [])
            ],
        })

    return {"success": True, "hospitals": hospital_list}


@router.get("/hospital-tieup/public/all")
async def hospital_public_all(db: AsyncSession = Depends(get_db)):
    """Get all hospitals matching Node.js format."""
    hospitals = await crud_hospital.get_multi(db)

    hospital_list = []
    for h in hospitals:
        hospital_list.append({
            "_id": str(h.id),
            "name": h.name,
            "address": h.address or "",
            "contact": h.contact or "",
            "specialization": h.specialization or "",
            "type": h.type or "General",
            "showOnHome": h.show_on_home,
            "doctors": [
                {
                    "_id": str(d.id),
                    "name": d.name,
                    "qualification": d.qualification or "",
                    "specialization": d.specialization or "",
                    "experience": d.experience or "",
                    "image": d.image or "",
                    "available": d.available if d.available is not None else True,
                }
                for d in (h.doctors or [])
            ],
        })

    return {"success": True, "hospitals": hospital_list}


@router.get("/hospital-tieup/public/doctors")
async def hospital_public_doctors(db: AsyncSession = Depends(get_db)):
    """Get all doctors from public hospitals (aggregated)."""
    hospitals = await crud_hospital.get_public_hospitals(db)

    doctors = []
    for h in hospitals:
        for d in (h.doctors or []):
            if d.available or d.available is None:
                doctors.append({
                    "_id": str(d.id),
                    "name": d.name,
                    "specialization": d.specialization or "General Medicine",
                    "speciality": d.specialization or "General Medicine",
                    "qualification": d.qualification or "",
                    "degree": d.qualification or "",
                    "experience": d.experience or "",
                    "image": d.image or "",
                    "available": True,
                    "fees": 50,
                    "hospitalName": h.name,
                    "hospital_tieup_id": h.id,
                    "about": f"Dr. {d.name} is a specialist in {d.specialization or 'General Medicine'} at {h.name}.",
                })

    return {"success": True, "doctors": doctors}


@router.get("/doctor/list")
async def get_doctor_list(db: AsyncSession = Depends(get_db)):
    """Get all standalone doctors with slot info."""
    try:
        from datetime import date
        today_obj = date.today()
        # frontend uses D_M_Y format (e.g., 21_2_2026)
        today = f"{today_obj.day}_{today_obj.month}_{today_obj.year}"
        
        query = (
            select(HospitalTieUpDoctor)
            .options(selectinload(HospitalTieUpDoctor.hospital_tieup))
        )
        result = await db.execute(query)
        doctors = result.scalars().all()
        
        doc_list = []
        for d in doctors:
            hospital = d.hospital_tieup
            
            # Count booked slots for today
            morning_booked = await crud_appointment.get_slot_count(
                db, doctor_id=d.id, slot_date=today, session="Morning"
            )
            evening_booked = await crud_appointment.get_slot_count(
                db, doctor_id=d.id, slot_date=today, session="Evening"
            )
            
            doc_list.append({
                "_id": str(d.id),
                "name": d.name,
                "email": d.email or "",
                "specialization": d.specialization or "General Medicine",
                "speciality": d.specialization or "General Medicine",
                "qualification": d.qualification or "",
                "degree": d.qualification or "",
                "experience": d.experience or "",
                "image": d.image or "",
                "available": d.available if d.available is not None else True,
                "fees": d.fees or 50,
                "hospitalName": hospital.name if hospital else "MediChain Hospital",
                "about": d.about or f"Dr. {d.name} is a specialist in {d.specialization or 'General Medicine'}.",
                "morningSlotsLeft": max(0, 25 - morning_booked),
                "eveningSlotsLeft": max(0, 25 - evening_booked),
                "totalSlots": 25
            })
            
        return {"success": True, "doctors": doc_list}
    except Exception as e:
        logger.error(f"Error in get_doctor_list: {str(e)}")
        return {"success": False, "message": str(e)}


@router.get("/hospital-tieup/all")
async def get_all_hospitals_admin(db: AsyncSession = Depends(get_db)):
    """Get all hospitals including hidden ones."""
    return await hospital_public_all(db)


@router.get("/hospital-tieup/details/{hospital_id}")
async def hospital_detail(hospital_id: str, db: AsyncSession = Depends(get_db)):
    """Get single hospital by ID."""
    try:
        h_id = int(hospital_id)
    except ValueError:
        return {"success": False, "message": "Invalid hospital ID"}

    hospital = await crud_hospital.get_with_doctors(db, id=h_id)
    if not hospital:
        return {"success": False, "message": "Hospital not found"}

    return {
        "success": True,
        "hospital": {
            "_id": str(hospital.id),
            "name": hospital.name,
            "address": hospital.address or "",
            "contact": hospital.contact or "",
            "specialization": hospital.specialization or "",
            "type": hospital.type or "General",
            "showOnHome": hospital.show_on_home,
            "doctors": [
                {
                    "_id": str(d.id),
                    "name": d.name,
                    "qualification": d.qualification or "",
                    "degree": d.qualification or "",
                    "specialization": d.specialization or "",
                    "speciality": d.specialization or "",
                    "experience": d.experience or "",
                    "image": d.image or "",
                    "available": d.available if d.available is not None else True,
                    "showOnHospitalPage": d.show_on_hospital_page if d.show_on_hospital_page is not None else True,
                }
                for d in (hospital.doctors or [])
                if (d.show_on_hospital_page if d.show_on_hospital_page is not None else True)
            ],
        },
    }


@router.get("/doctor/dashboard")
async def doctor_dashboard(
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Doctor dashboard stats matching Node.js format."""
    if not user or user.role != "doctor":
        return {"success": False, "message": "Not Authorized Login Again"}
    
    # Get doctor profile
    doc_q = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.email == user.email)
    doc_res = await db.execute(doc_q)
    doctor = doc_res.scalar_one_or_none()
    
    if not doctor:
        return {"success": False, "message": "Doctor profile not found"}
    
    # Get stats
    # Earnings
    res_earnings = await db.execute(select(func.sum(Appointment.amount)).where(Appointment.doctor_id == doctor.id, Appointment.payment_status == "paid"))
    earnings = float(res_earnings.scalar_one() or 0)
    
    # Appointments
    res_appt = await db.execute(select(func.count(Appointment.id)).where(Appointment.doctor_id == doctor.id))
    appt_count = res_appt.scalar_one()
    
    # Patients
    res_patients = await db.execute(select(func.count(func.distinct(Appointment.user_id))).where(Appointment.doctor_id == doctor.id))
    patients_count = res_patients.scalar_one()
    
    # Latest Appointments
    query_latest = select(Appointment).where(Appointment.doctor_id == doctor.id).order_by(Appointment.created_at.desc()).limit(10)
    res_latest = await db.execute(query_latest)
    latest_models = res_latest.scalars().all()
    
    latest_appointments = []
    for a in latest_models:
        u_q = select(User).where(User.id == a.user_id)
        u_res = await db.execute(u_q)
        patient_user = u_res.scalar_one_or_none()
        
        latest_appointments.append({
            "_id": str(a.id),
            "slotDate": a.slot_date,
            "slotTime": a.slot_time,
            "amount": float(a.amount),
            "cancelled": a.cancelled,
            "isCompleted": a.is_completed,
            "userData": {
                "name": patient_user.name if patient_user else "Unknown",
                "image": patient_user.image if patient_user else ""
            }
        })
        
    return {
        "success": True,
        "dashData": {
            "earnings": earnings,
            "appointments": appt_count,
            "patients": patients_count,
            "latestAppointments": latest_appointments
        }
    }


@router.get("/doctor/appointments")
async def doctor_appointments(
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Get all appointments for the logged-in doctor."""
    if not user or user.role != "doctor":
        return {"success": False, "message": "Not Authorized Login Again"}
        
    doc_q = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.email == user.email)
    doc_res = await db.execute(doc_q)
    doctor = doc_res.scalar_one_or_none()
    
    if not doctor:
        return {"success": False, "message": "Doctor profile not found"}
        
    query = select(Appointment).where(Appointment.doctor_id == doctor.id).order_by(Appointment.created_at.desc())
    result = await db.execute(query)
    appts = result.scalars().all()
    
    appt_list = []
    for a in appts:
        u_q = select(User).where(User.id == a.user_id)
        u_res = await db.execute(u_q)
        patient_user = u_res.scalar_one_or_none()
        
        appt_list.append({
            "_id": str(a.id),
            "slotDate": a.slot_date,
            "slotTime": a.slot_time,
            "amount": float(a.amount),
            "cancelled": a.cancelled,
            "isCompleted": a.is_completed,
            "payment": a.payment,
            "userData": {
                "name": patient_user.name if patient_user else "Unknown",
                "image": patient_user.image if patient_user else "",
                "dob": patient_user.dob if patient_user else "2000-01-01"
            }
        })
    
    return {"success": True, "appointments": appt_list}


@router.get("/doctor/profile")
async def doctor_profile(
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Get profile for the logged-in doctor."""
    if not user or user.role != "doctor":
        return {"success": False, "message": "Not Authorized Login Again"}
        
    query = (
        select(HospitalTieUpDoctor)
        .where(HospitalTieUpDoctor.email == user.email)
        .options(selectinload(HospitalTieUpDoctor.hospital_tieup))
    )
    result = await db.execute(query)
    doctor = result.scalar_one_or_none()
    
    if not doctor:
        return {"success": False, "message": "Doctor profile not found"}
        
    return {
        "success": True,
        "profileData": {
            "_id": str(doctor.id),
            "name": doctor.name,
            "email": doctor.email,
            "qualification": doctor.qualification,
            "specialization": doctor.specialization,
            "experience": doctor.experience,
            "about": doctor.about,
            "fees": doctor.fees,
            "available": doctor.available,
            "image": doctor.image or user.image or ""
        }
    }


@router.post("/doctor/change-availability")
async def doctor_change_availability(
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Toggle availability for the logged-in doctor."""
    if not user or user.role != "doctor":
        return {"success": False, "message": "Not Authorized Login Again"}
    
    doc_q = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.email == user.email)
    doc_res = await db.execute(doc_q)
    doctor = doc_res.scalar_one_or_none()
    
    if not doctor:
        return {"success": False, "message": "Doctor profile not found"}
        
    doctor.available = not doctor.available
    db.add(doctor)
    await db.commit()
    
    return {"success": True, "message": "Availability changed"}


@router.post("/doctor/complete-appointment")
async def doctor_complete_appointment(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Mark appointment as completed."""
    if not user or user.role != "doctor":
        return {"success": False, "message": "Not Authorized Login Again"}
        
    try:
        body = await request.json()
        appt_id = body.get("appointmentId")
        if not appt_id:
            return {"success": False, "message": "Appointment ID required"}
            
        appt = await crud_appointment.get(db, id=int(appt_id))
        if not appt:
            return {"success": False, "message": "Appointment not found"}
            
        # Check if this appointment belongs to the doctor
        doc_q = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.email == user.email)
        doc_res = await db.execute(doc_q)
        doctor = doc_res.scalar_one_or_none()
        
        if not doctor or appt.doctor_id != doctor.id:
             return {"success": False, "message": "Unauthorized action"}
             
        appt.is_completed = True
        appt.status = "completed"
        db.add(appt)
        await db.commit()
        
        return {"success": True, "message": "Appointment marked as completed"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/doctor/cancel-appointment")
async def doctor_cancel_appointment(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Cancel appointment."""
    if not user or user.role != "doctor":
        return {"success": False, "message": "Not Authorized Login Again"}
        
    try:
        body = await request.json()
        appt_id = body.get("appointmentId")
        if not appt_id:
            return {"success": False, "message": "Appointment ID required"}
            
        appt = await crud_appointment.get(db, id=int(appt_id))
        if not appt:
            return {"success": False, "message": "Appointment not found"}
            
        doc_q = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.email == user.email)
        doc_res = await db.execute(doc_q)
        doctor = doc_res.scalar_one_or_none()
        
        if not doctor or appt.doctor_id != doctor.id:
             return {"success": False, "message": "Unauthorized action"}
             
        appt.cancelled = True
        appt.status = "cancelled"
        db.add(appt)
        await db.commit()
        
        return {"success": True, "message": "Appointment cancelled"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/doctor/{doctor_id}")
async def get_doctor_detail(doctor_id: str, db: AsyncSession = Depends(get_db)):
    """Get single doctor by ID matching Node.js format."""
    try:
        d_id = int(doctor_id)
    except ValueError:
        return {"success": False, "message": "Invalid doctor ID"}

    query = (
        select(HospitalTieUpDoctor)
        .where(HospitalTieUpDoctor.id == d_id)
        .options(selectinload(HospitalTieUpDoctor.hospital_tieup))
    )
    result = await db.execute(query)
    doctor = result.scalar_one_or_none()
    
    if not doctor:
        return {"success": False, "message": "Doctor not found"}

    return {
        "success": True,
        "doctor": {
            "_id": str(doctor.id),
            "id": str(doctor.id),
            "name": doctor.name,
            "specialization": doctor.specialization or "General Medicine",
            "speciality": doctor.specialization or "General Medicine",
            "qualification": doctor.qualification or "",
            "degree": doctor.qualification or "",
            "experience": doctor.experience or "0",
            "image": doctor.image or "",
            "available": doctor.available if doctor.available is not None else True,
            "fees": doctor.fees or 500,
            "hospitalName": doctor.hospital_tieup.name if doctor.hospital_tieup else "MediChain Hospital",
            "about": doctor.about or f"Dr. {doctor.name} is a specialist in {doctor.specialization or 'General Medicine'}.",
            "slots_booked": await crud_appointment.get_booked_slots(db, doctor_id=doctor.id)
        }
    }


# ============================================
# Stub routes for features not yet migrated
# ============================================

# ============================================
# Admin Routes (matching Node.js /api/admin/*)
# ============================================

@router.post("/admin/login")
async def admin_login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Admin login endpoint matching Node.js format."""
    user = await crud_user.authenticate(db, email=req.email, password=req.password)
    if not user or user.role != "admin":
        return {"success": False, "message": "Invalid admin credentials"}

    token = create_access_token(user.id)
    return {"success": True, "token": token}


@router.post("/doctor/login")
async def doctor_login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Doctor login endpoint matching Node.js format."""
    email = req.email.strip()
    password = req.password.strip()
    
    with open("login_debug.log", "a") as f:
        f.write(f"\n[{datetime.now()}] Login attempt for: {email}\n")
        
        user = await crud_user.authenticate(db, email=email, password=password)
        
        if not user or user.role != "doctor":
            f.write(f"Auth failed. User exists: {user is not None}, role: {user.role if user else 'N/A'}\n")
            
            # Check for doctor profile
            query = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.email == email)
            res = await db.execute(query)
            doc_profile = res.scalar_one_or_none()
            
            if not doc_profile:
                f.write("No doctor profile found for this email\n")
                return {"success": False, "message": "Invalid doctor credentials"}
            
            f.write(f"Doctor profile found with ID: {doc_profile.id}, but user auth failed or role is wrong\n")
            if not user:
                 return {"success": False, "message": "Doctor account not found"}
            return {"success": False, "message": "Access restricted to doctors only"}

        f.write(f"Auth success for {email}. User ID: {user.id}\n")
        token = create_access_token(user.id)
        return {"success": True, "token": token}


@router.get("/admin/dashboard")
async def admin_dashboard(db: AsyncSession = Depends(get_db)):
    """Dashboard stats matching Node.js format."""
    # Count doctors
    query_docs = select(HospitalTieUpDoctor)
    result_docs = await db.execute(query_docs)
    all_docs = result_docs.scalars().all()
    docs_count = len(all_docs)
    active_docs = len([d for d in all_docs if d.available])

    # Count patients
    query_users = select(User).where(User.role == "patient")
    result_users = await db.execute(query_users)
    patients_count = len(result_users.scalars().all())

    # Count hospitals
    hospitals = await crud_hospital.get_multi(db)
    hospitals_count = len(hospitals)

    # Appointment Stats
    from app.models.appointment import Appointment
    from datetime import datetime, date, timedelta
    
    today_str = date.today().strftime("%Y-%m-%d")
    
    # Total appointments
    res_appt_total = await db.execute(select(func.count(Appointment.id)))
    appt_count = res_appt_total.scalar_one()
    
    # Appointments today
    res_appt_today = await db.execute(select(func.count(Appointment.id)).where(Appointment.slot_date == today_str))
    appt_today_count = res_appt_today.scalar_one()
    
    # Revenue today (only paid)
    res_rev_today = await db.execute(select(func.sum(Appointment.amount)).where(Appointment.slot_date == today_str, Appointment.payment_status == "paid"))
    rev_today = float(res_rev_today.scalar_one() or 0)
    
    # Revenue monthly (this month)
    this_month = date.today().replace(day=1).strftime("%Y-%m")
    res_rev_month = await db.execute(select(func.sum(Appointment.amount)).where(Appointment.slot_date.like(f"{this_month}%"), Appointment.payment_status == "paid"))
    rev_month = float(res_rev_month.scalar_one() or 0)
    
    # Patients today (registered today)
    from sqlalchemy import cast, Date
    res_patients_today = await db.execute(select(func.count(User.id)).where(User.role == "patient", cast(User.created_at, Date) == date.today()))
    patients_today = res_patients_today.scalar_one()
    
    # Latest appointments (last 5)
    query_latest = select(Appointment).order_by(Appointment.created_at.desc()).limit(5)
    res_latest = await db.execute(query_latest)
    latest_appts_models = res_latest.scalars().all()
    
    latest_appointments = []
    for a in latest_appts_models:
        # Fetch doctor details
        doc_q = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.id == a.doctor_id)
        doc_res = await db.execute(doc_q)
        doctor = doc_res.scalar_one_or_none()
        
        # Fetch user details
        user_q = select(User).where(User.id == a.user_id)
        user_res = await db.execute(user_q)
        patient = user_res.scalar_one_or_none()
        
        latest_appointments.append({
            "_id": str(a.id),
            "docId": str(a.doctor_id),
            "docData": {
                "name": doctor.name if doctor else "Doctor",
                "image": doctor.image if doctor else ""
            },
            "userData": {
                "name": patient.name if patient else "User"
            },
            "slotDate": a.slot_date,
            "slotTime": a.slot_time,
            "cancelled": a.cancelled,
            "isCompleted": a.is_completed,
            "amount": float(a.amount)
        })

    # Basic chart data (last 7 days)
    chart_labels = []
    patient_values = []
    revenue_values = []
    appt_values = []
    
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        chart_labels.append(d.strftime("%b %d"))
        
        # New patients
        res_p = await db.execute(select(func.count(User.id)).where(User.role == "patient", cast(User.created_at, Date) == d))
        patient_values.append(res_p.scalar_one())
        
        # Appointments
        res_a = await db.execute(select(func.count(Appointment.id)).where(Appointment.slot_date == d_str))
        appt_values.append(res_a.scalar_one())
        
        # Revenue
        res_r = await db.execute(select(func.sum(Appointment.amount)).where(Appointment.slot_date == d_str, Appointment.payment_status == "paid"))
        revenue_values.append(float(res_r.scalar_one() or 0))

    return {
        "success": True,
        "dashData": {
            "doctors": docs_count,
            "activeDoctors": active_docs,
            "appointments": appt_count,
            "patients": patients_count,
            "hospitals": hospitals_count,
            "patientsToday": patients_today,
            "appointmentsToday": appt_today_count,
            "revenueToday": rev_today,
            "revenueMonthly": rev_month,
            "latestAppointments": latest_appointments,
            "chartData": {
                "patientGrowth": {"labels": chart_labels, "values": patient_values},
                "revenue": {"labels": chart_labels, "values": revenue_values},
                "appointments": {"labels": chart_labels, "values": appt_values}
            }
        }
    }


@router.get("/admin/all-doctors")
async def admin_all_doctors(db: AsyncSession = Depends(get_db)):
    """Return all doctors for admin panel."""
    return await get_doctor_list(db)


@router.post("/admin/update-doctor")
async def update_doctor_admin(request: Request, db: AsyncSession = Depends(get_db)):
    """Update doctor details from admin panel."""
    try:
        data = await get_request_data(request)
        doc_id = data.get("docId") or data.get("_id") or data.get("id")
        if not doc_id:
            return {"success": False, "message": "Doctor ID is required"}

        from app.crud.crud_hospital import hospital_doctor as crud_doc
        doctor = await crud_doc.get(db, id=int(doc_id))
        if not doctor:
            return {"success": False, "message": "Doctor not found"}

        update_dict = {}
        if "name" in data: update_dict["name"] = data["name"]
        if "email" in data: update_dict["email"] = data["email"]
        if "speciality" in data: update_dict["specialization"] = data["speciality"]
        if "degree" in data: update_dict["qualification"] = data["degree"]
        if "experience" in data: update_dict["experience"] = data["experience"]
        if "fees" in data: 
            try:
                update_dict["fees"] = int(float(data["fees"]))
            except:
                pass
        if "about" in data: update_dict["about"] = data["about"]
        if "available" in data:
            val = data["available"]
            if isinstance(val, str):
                update_dict["available"] = val.lower() == "true"
            else:
                update_dict["available"] = bool(val)

        # Handle image upload
        image = data.get("image")
        if image and hasattr(image, "read"): # It's a file object/UploadFile
            from app.utils.cloudinary_utils import upload_image
            content = await image.read()
            image_url = await upload_image(content)
            if image_url:
                update_dict["image"] = image_url

        if not update_dict:
            return {"success": True, "message": "No changes to update"}
            
        await crud_doc.update(db, db_obj=doctor, obj_in=update_dict)
        return {"success": True, "message": "Doctor updated successfully"}
    except Exception as e:
        logger.error(f"Update doctor error: {str(e)}")
        return {"success": False, "message": str(e)}


@router.post("/admin/change-availability")
async def change_availability_admin(request: Request, db: AsyncSession = Depends(get_db)):
    """Toggle doctor availability."""
    try:
        body = await request.json()
        doc_id = body.get("docId")
        if not doc_id:
            return {"success": False, "message": "Doctor ID is required"}
            
        from app.crud.crud_hospital import hospital_doctor as crud_doc
        doctor = await crud_doc.get(db, id=int(doc_id))
        if not doctor:
            return {"success": False, "message": "Doctor not found"}
            
        await crud_doc.update(db, db_obj=doctor, obj_in={"available": not doctor.available})
        return {"success": True, "message": "Availability changed"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# ============================================
# Hospital Management (Admin)
# ============================================

# Admin panel already covered above



@router.post("/hospital-tieup/add")
async def add_hospital_admin(request: Request, db: AsyncSession = Depends(get_db)):
    """Add a new hospital."""
    try:
        body = await request.json()
    except Exception:
        return {"success": False, "message": "Invalid request body"}
    
    from app.schemas.hospital import HospitalTieUpCreate
    h_in = HospitalTieUpCreate(
        name=body.get("name"),
        address=body.get("address"),
        contact=body.get("contact"),
        specialization=body.get("specialization"),
        type=body.get("type", "General"),
        show_on_home=body.get("showOnHome", False)
    )
    
    try:
        await crud_hospital.create(db, obj_in=h_in)
        return {"success": True, "message": "Hospital added successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.put("/hospital-tieup/update")
async def update_hospital_admin(request: Request, db: AsyncSession = Depends(get_db)):
    """Update an existing hospital."""
    try:
        body = await request.json()
        h_id = body.get("id") or body.get("_id")
        if not h_id:
            return {"success": False, "message": "Hospital ID is required"}
        
        hospital = await crud_hospital.get(db, id=int(h_id))
        if not hospital:
            return {"success": False, "message": "Hospital not found"}
        
        from app.schemas.hospital import HospitalTieUpUpdate
        h_update = HospitalTieUpUpdate(
            name=body.get("name"),
            address=body.get("address"),
            contact=body.get("contact"),
            specialization=body.get("specialization"),
            type=body.get("type"),
            show_on_home=body.get("showOnHome")
        )
        await crud_hospital.update(db, db_obj=hospital, obj_in=h_update)
        return {"success": True, "message": "Hospital updated successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/hospital-tieup/delete")
async def delete_hospital_admin(request: Request, db: AsyncSession = Depends(get_db)):
    """Delete a hospital."""
    try:
        body = await request.json()
        h_id = body.get("id") or body.get("_id")
        if not h_id:
            return {"success": False, "message": "Hospital ID is required"}
        
        await crud_hospital.remove(db, id=int(h_id))
        return {"success": True, "message": "Hospital deleted successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# ============================================
# Hospital Doctor Management (Admin)
# ============================================

@router.post("/hospital-tieup/doctor/bulk-preview")
async def bulk_preview_hospital_doctors(
    file: UploadFile = File(...),
    hospitalId: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Preview doctors from uploaded CSV/Excel for a specific hospital."""
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        else:
            return {"success": False, "message": "Unsupported file format. Use CSV or Excel."}

        # Validate hospital name if column exists
        hospital = await crud_hospital.get(db, id=int(hospitalId))
        if not hospital:
            return {"success": False, "message": "Hospital not found"}

        preview = []
        errors = []
        valid_count = 0
        invalid_count = 0

        # Required columns for hospital tie-up doctor
        # hospitalName, name, email (qualification, specialization, experience are optional)
        
        for index, row in df.iterrows():
            row_dict = row.to_dict()
            name = row_dict.get('name')
            email = row_dict.get('email')
            h_name_csv = row_dict.get('hospitalName')

            if not name or not email:
                errors.append({"row": index+2, "name": name, "email": email, "reason": "Missing Name or Email"})
                invalid_count += 1
                continue
            
            if h_name_csv and str(h_name_csv).strip().lower() != hospital.name.lower():
                 errors.append({"row": index+2, "name": name, "email": email, "reason": f"Hospital name mismatch. Expected '{hospital.name}'"})
                 invalid_count += 1
                 continue

            # Mock some defaults if missing
            password = "".join(random.choices(string.ascii_letters + string.digits, k=10))
            employeeId = f"DOC-{random.randint(1000, 9999)}"

            preview.append({
                "name": str(name),
                "email": str(email),
                "qualification": str(row_dict.get('qualification', '')),
                "specialization": str(row_dict.get('specialization', 'General Medicine')),
                "experience": str(row_dict.get('experience', '0')),
                "password": password,
                "employeeId": employeeId,
                "available": True
            })
            valid_count += 1

        return {
            "success": True, 
            "preview": preview, 
            "errors": errors,
            "summary": {
                "total": len(df),
                "valid": valid_count,
                "invalid": invalid_count
            }
        }
    except Exception as e:
        return {"success": False, "message": f"Error processing file: {str(e)}"}


@router.post("/hospital-tieup/doctor/add")
async def add_hospital_doctor_admin(request: Request, db: AsyncSession = Depends(get_db)):
    """Add a doctor to a hospital and create their user account."""
    try:
        body = await request.json()
        hospital_id = body.get("hospitalId")
        doctor_data = body.get("doctorData")
        
        if not hospital_id or not doctor_data:
            return {"success": False, "message": "Hospital ID and doctor data are required"}
        
        email = doctor_data.get("email")
        if not email:
            return {"success": False, "message": "Doctor email is required for account creation"}

        # 1. Create/Find User Account
        from app.crud.crud_user import user as crud_user
        from app.schemas.user import UserCreate
        
        user = await crud_user.get_by_email(db, email=email)
        temp_password = "".join(random.choices(string.ascii_letters + string.digits, k=10))
        
        if not user:
            user_in = UserCreate(
                name=doctor_data.get("name"),
                email=email,
                password=temp_password
            )
            user = await crud_user.create(db, obj_in=user_in)
            user.role = "doctor"
            db.add(user)
        else:
            # Update role if already exists
            user.role = "doctor"
            db.add(user)

        # 2. Create Doctor Profile
        from app.schemas.hospital import HospitalTieUpDoctorCreate
        d_in = HospitalTieUpDoctorCreate(
            hospital_tieup_id=int(hospital_id),
            name=doctor_data.get("name"),
            qualification=doctor_data.get("qualification") or doctor_data.get("degree"),
            specialization=doctor_data.get("specialization") or doctor_data.get("speciality"),
            experience=str(doctor_data.get("experience", "0")),
            image=doctor_data.get("image"),
            available=doctor_data.get("available", True),
            fees=int(doctor_data.get("fees", 500)),
            about=doctor_data.get("about", ""),
            show_on_hospital_page=True
        )
        from app.crud.crud_hospital import hospital_doctor as crud_doc
        await crud_doc.create(db, obj_in=d_in)
        
        # 3. Send Credentials Email
        from app.utils.email import send_doctor_credentials
        employee_id = f"DOC-{random.randint(1000, 9999)}"
        try:
            send_doctor_credentials(email, doctor_data.get("name"), temp_password, employee_id)
        except Exception as e:
            logger.error(f"Failed to send doctor credentials email: {e}")

        return {"success": True, "message": "Doctor added and account created successfully"}
    except Exception as e:
        logger.error(f"Add hospital doctor error: {e}")
        return {"success": False, "message": str(e)}


@router.put("/hospital-tieup/doctor/update")
async def update_hospital_doctor_admin(request: Request, db: AsyncSession = Depends(get_db)):
    """Update a hospital doctor."""
    try:
        body = await request.json()
        doctor_id = body.get("doctorId") or body.get("_id")
        doctor_data = body.get("doctorData")
        
        if not doctor_id or not doctor_data:
            return {"success": False, "message": "Doctor ID and data are required"}
        
        from app.crud.crud_hospital import hospital_doctor as crud_doc
        
        doctor = await crud_doc.get(db, id=int(doctor_id))
        if not doctor:
            return {"success": False, "message": "Doctor not found"}
        
        # Construct update dict carefully to allow partial updates
        update_dict = {}
        # Map frontend keys to backend model keys
        key_map = {
            "name": "name",
            "qualification": "qualification",
            "degree": "qualification",
            "specialization": "specialization",
            "speciality": "specialization",
            "experience": "experience",
            "image": "image",
            "available": "available",
            "fees": "fees",
            "about": "about",
            "showOnHospitalPage": "show_on_hospital_page",
            "show_on_hospital_page": "show_on_hospital_page"
        }
        
        for f_key, b_key in key_map.items():
            if f_key in doctor_data:
                val = doctor_data[f_key]
                if b_key == "fees":
                    try:
                        val = int(float(val))
                    except:
                        continue
                update_dict[b_key] = val
        
        if not update_dict:
            return {"success": True, "message": "No changes to update"}
            
        await crud_doc.update(db, db_obj=doctor, obj_in=update_dict)
        return {"success": True, "message": "Doctor updated successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}



@router.post("/hospital-tieup/doctor/bulk-add")
async def bulk_add_hospital_doctors_confirm(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Save doctors from preview data for a specific hospital."""
    try:
        body = await request.json()
        hospital_id = body.get("hospitalId")
        preview_data = body.get("previewData")

        if not hospital_id or not preview_data:
            return {"success": False, "message": "Missing hospitalId or previewData"}

        from app.crud.crud_hospital import hospital_doctor as crud_doc
        from app.schemas.hospital import HospitalTieUpDoctorCreate
        
        successful = 0
        failed = 0
        details = {"success": [], "errors": []}

        from app.utils.email import send_doctor_credentials
        
        from app.crud.crud_user import user as crud_user
        from app.schemas.user import UserCreate
        
        for doc_data in preview_data:
            try:
                name = doc_data.get("name")
                email = doc_data.get("email")
                password = doc_data.get("password")
                employee_id = doc_data.get("employeeId")

                # 1. Create User account first
                user = await crud_user.get_by_email(db, email=email)
                if not user:
                    user_in = UserCreate(
                        name=name,
                        email=email,
                        password=password
                    )
                    user = await crud_user.create(db, obj_in=user_in)
                    user.role = "doctor"
                    db.add(user)
                else:
                    user.role = "doctor"
                    db.add(user)

                # 2. Create Doctor Profile
                d_in = HospitalTieUpDoctorCreate(
                    hospital_tieup_id=int(hospital_id),
                    name=name,
                    qualification=doc_data.get("qualification"),
                    specialization=doc_data.get("specialization"),
                    experience=str(doc_data.get("experience")),
                    available=True,
                    show_on_hospital_page=True
                )
                await crud_doc.create(db, obj_in=d_in)
                
                # 3. Send email if we have all info
                if email and password and employee_id:
                     send_doctor_credentials(email, name, password, employee_id)
                
                successful += 1
                details["success"].append(doc_data)
            except Exception as e:
                failed += 1
                details["errors"].append({"doc": doc_data, "error": str(e)})

        return {
            "success": True, 
            "message": f"Successfully uploaded {successful} doctors.",
            "results": {
                "total": len(preview_data),
                "successful": successful,
                "failed": failed,
                "details": details
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/hospital-tieup/doctor/delete")
async def delete_hospital_doctor_admin(request: Request, db: AsyncSession = Depends(get_db)):
    """Delete a hospital doctor."""
    try:
        body = await request.json()
        doctor_id = body.get("doctorId") or body.get("_id")
        if not doctor_id:
            return {"success": False, "message": "Doctor ID is required"}
        
        from app.crud.crud_hospital import hospital_doctor as crud_doc
        await crud_doc.remove(db, id=int(doctor_id))
        return {"success": True, "message": "Doctor deleted successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/admin/bulk-add-doctors-preview")
async def admin_bulk_doctors_preview(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Preview doctors for general system upload."""
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        else:
            return {"success": False, "message": "Unsupported file format."}

        preview = []
        errors = []
        valid_count = 0
        
        for index, row in df.iterrows():
            row_dict = row.to_dict()
            name = row_dict.get('name')
            email = row_dict.get('email')

            if not name or not email:
                errors.append({"row": index+2, "name": name, "email": email, "reason": "Missing Name or Email"})
                continue

            preview.append({
                "name": str(name),
                "email": str(email),
                "speciality": str(row_dict.get('speciality', 'General physician')),
                "degree": str(row_dict.get('degree', 'MBBS')),
                "experience": str(row_dict.get('experience', '1 Year')),
                "fees": int(row_dict.get('fees', 500)),
                "about": str(row_dict.get('about', '')),
                "password": "".join(random.choices(string.ascii_letters + string.digits, k=10)),
                "employeeId": f"SYS-{random.randint(1000, 9999)}"
            })
            valid_count += 1

        return {
            "success": True, 
            "preview": preview,
            "errors": errors,
            "summary": {"total": len(df), "valid": valid_count, "invalid": len(errors)}
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


# Removed duplicate change-availability endpoint


@router.get("/admin/appointments")
async def get_all_appointments_admin(db: AsyncSession = Depends(get_db)):
    """Get all appointments for admin panel."""
    try:
        query = select(Appointment).order_by(Appointment.created_at.desc())
        result = await db.execute(query)
        appointments = result.scalars().all()
        
        appt_list = []
        for a in appointments:
            # Fetch doctor
            doc_q = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.id == a.doctor_id)
            doc_res = await db.execute(doc_q)
            doctor = doc_res.scalar_one_or_none()
            
            # Fetch user
            user_q = select(User).where(User.id == a.user_id)
            user_res = await db.execute(user_q)
            patient = user_res.scalar_one_or_none()
            
            appt_list.append({
                "_id": str(a.id),
                "docId": str(a.doctor_id),
                "docData": {
                    "_id": str(doctor.id) if doctor else "",
                    "name": doctor.name if doctor else "Doctor",
                    "image": doctor.image if doctor else "",
                    "speciality": doctor.specialization if doctor else ""
                },
                "userData": {
                    "_id": str(patient.id) if patient else "",
                    "name": patient.name if patient else "User",
                    "image": patient.image if patient else "",
                    "dob": patient.dob if patient else "2000-01-01",
                    "phone": patient.phone if patient else "",
                    "email": patient.email if patient else ""
                },
                "slotDate": a.slot_date,
                "slotTime": a.slot_time,
                "cancelled": a.cancelled,
                "isCompleted": a.is_completed,
                "amount": float(a.amount),
                "payment": a.payment,
                "paymentStatus": a.payment_status
            })
            
        return {"success": True, "appointments": appt_list}
    except Exception as e:
        logger.error(f"Get all appointments error: {e}")
        return {"success": False, "message": str(e)}


@router.post("/admin/cancel-appointment")
async def admin_cancel_appointment(request: Request, db: AsyncSession = Depends(get_db)):
    """Cancel appointment from admin panel."""
    try:
        body = await request.json()
        appointment_id = body.get("appointmentId")
        if not appointment_id:
            return {"success": False, "message": "Appointment ID is required"}
            
        appointment = await crud_appointment.get(db, id=int(appointment_id))
        if not appointment:
            return {"success": False, "message": "Appointment not found"}
            
        appointment.cancelled = True
        appointment.status = "cancelled"
        db.add(appointment)
        await db.commit()
        
        return {"success": True, "message": "Appointment cancelled successfully"}
    except Exception as e:
        logger.error(f"Admin cancel appointment error: {e}")
        return {"success": False, "message": str(e)}


@router.delete("/admin/delete-all-appointments")
async def delete_all_appointments(db: AsyncSession = Depends(get_db)):
    """Utility to clear all appointments (for testing/cleanup)."""
    try:
        from sqlalchemy import delete
        await db.execute(delete(Appointment))
        await db.commit()
        return {"success": True, "message": "All appointments deleted successfully"}
    except Exception as e:
        logger.error(f"Delete all appointments error: {e}")
        return {"success": False, "message": str(e)}

@router.post("/admin/bulk-add-doctors")
async def admin_bulk_doctors_add(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Save doctors for general system from preview."""
    try:
        body = await request.json()
        preview_data = body.get("previewData")
        if not preview_data:
            return {"success": False, "message": "No data provided"}

        from app.crud.crud_user import user as crud_user
        from app.schemas.user import UserCreate
        from app.models.hospital import HospitalTieUp, HospitalTieUpDoctor

        # Find or create a default hospital
        hospital_res = await db.execute(select(HospitalTieUp).limit(1))
        hospital = hospital_res.scalar_one_or_none()
        if not hospital:
            hospital = HospitalTieUp(name="MediChain General Hospital", type="General")
            db.add(hospital)
            await db.commit()
            await db.refresh(hospital)

        successful = 0
        failed = 0
        results_list = []

        for doc in preview_data:
            try:
                email = doc.get("email")
                if await crud_user.get_by_email(db, email=email):
                    failed += 1
                    continue
                
                # Create User
                user_in = UserCreate(
                    name=doc.get("name"),
                    email=email,
                    password=doc.get("password") or "pms12345"
                )
                user = await crud_user.create(db, obj_in=user_in)
                user.role = "doctor"
                db.add(user)

                # Create Doctor Profile
                new_doc = HospitalTieUpDoctor(
                    hospital_tieup_id=hospital.id,
                    name=doc.get("name"),
                    email=email,
                    qualification=doc.get("degree"),
                    specialization=doc.get("speciality"),
                    experience=doc.get("experience"),
                    fees=int(doc.get("fees", 500)),
                    about=doc.get("about"),
                    image=""
                )
                db.add(new_doc)
                
                # Send Credentials Email
                from app.utils.email import send_doctor_credentials
                try:
                    send_doctor_credentials(email, doc.get("name"), doc.get("password") or "pms12345", doc.get("employeeId") or f"SYS-{random.randint(1000, 9999)}")
                except:
                    pass
                    
                successful += 1
                results_list.append({"name": doc.get("name"), "email": email, "password": user_in.password})
            except Exception as e:
                logger.error(f"Bulk add doctor failed for {doc.get('email')}: {e}")
                failed += 1

        await db.commit()
        
        return {
            "success": True, 
            "message": f"Successfully processed bulk upload. {successful} added, {failed} failed.",
            "results": {"total": len(preview_data), "successful": successful, "failed": failed, "details": {"success": results_list}}
        }
    except Exception as e:
        logger.error(f"Bulk add error: {str(e)}")
        return {"success": False, "message": str(e)}


@router.post("/admin/add-doctor")
async def add_doctor_system(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Add a doctor to the general system with real User and Profile creation."""
    try:
        data = await get_request_data(request)
        
        from app.crud.crud_user import user as crud_user
        from app.schemas.user import UserCreate
        from app.models.hospital import HospitalTieUp, HospitalTieUpDoctor
        
        email = data.get("email")
        if not email:
            return {"success": False, "message": "Email is required"}
            
        if await crud_user.get_by_email(db, email=email):
            return {"success": False, "message": "Doctor with this email already exists"}
            
        # Create User
        user_in = UserCreate(
            name=data.get("name"),
            email=email,
            password=data.get("password") or "pms12345"
        )
        user = await crud_user.create(db, obj_in=user_in)
        user.role = "doctor"
        
        # Handle Image
        image = data.get("image")
        image_url = ""
        if image and hasattr(image, "read"):
            from app.utils.cloudinary_utils import upload_image
            try:
                content = await image.read()
                image_url = await upload_image(content)
                user.image = image_url
            except Exception as img_err:
                logger.error(f"Image upload error: {img_err}")
                
        db.add(user)
        
        # Find Hospital
        hospital_res = await db.execute(select(HospitalTieUp).limit(1))
        hospital = hospital_res.scalar_one_or_none()
        if not hospital:
            hospital = HospitalTieUp(name="MediChain General Hospital", type="General")
            db.add(hospital)
            await db.commit()
            await db.refresh(hospital)
            
        # Create Doctor Profile
        new_doc = HospitalTieUpDoctor(
            hospital_tieup_id=hospital.id,
            name=data.get("name"),
            email=email,
            qualification=data.get("degree"),
            specialization=data.get("speciality"),
            experience=data.get("experience"),
            fees=int(data.get("fees", 500)) if data.get("fees") else 500,
            about=data.get("about"),
            image=image_url
        )
        db.add(new_doc)
        await db.commit()
        
        # Send Credentials Email
        from app.utils.email import send_doctor_credentials
        try:
            password = data.get("password") or "pms12345"
            employee_id = f"DOC-{random.randint(1000, 9999)}"
            send_doctor_credentials(email, data.get("name"), password, employee_id)
        except Exception as e:
            logger.error(f"Failed to send doctor email: {e}")
            
        return {"success": True, "message": "Doctor added successfully"}
    except Exception as e:
        logger.error(f"Add doctor error: {e}")
        return {"success": False, "message": str(e)}


@router.post("/hospital-tieup/doctor/migrate")
@router.post("/admin/migrate-embedded-doctors")
async def migrate_embedded_doctors(db: AsyncSession = Depends(get_db)):
    """Migration utility to move doctors from hospital collection to their own (already structural in this DB)."""
    return {"success": True, "message": "Migration completed (already in structured format)"}



# ============================================
# Other Stubs
# ============================================

@router.post("/user/social-login")
async def social_login(request: Request, db: AsyncSession = Depends(get_db)):
    """Social login stub."""
    body = await get_request_data(request)
    email = body.get("email")
    name = body.get("name", "User")

    if not email:
        return {"success": False, "message": "Email is required"}

    user = await crud_user.get_by_email(db, email=email)
    if not user:
        from app.schemas.user import UserCreate
        user_in = UserCreate(name=name, email=email, password="social_login_placeholder_123!")
        user = await crud_user.create(db, obj_in=user_in)

    token = create_access_token(user.id)
    return {"success": True, "token": token}


@router.get("/user/appointments")
async def user_appointments(
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Get real appointments for the logged-in user."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    appointments = await crud_appointment.get_by_user(db, user_id=user.id)
    
    appt_list = []
    for a in appointments:
        # Fetch doctor details manually if relationship not loaded
        query = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.id == a.doctor_id)
        res = await db.execute(query)
        doctor = res.scalar_one_or_none()
        
        appt_list.append({
            "_id": str(a.id),
            "docId": str(a.doctor_id),
            "docData": {
                "name": doctor.name if doctor else "Doctor",
                "image": doctor.image if doctor else "",
                "speciality": doctor.specialization if doctor else "General Medicine"
            },
            "userData": {
                "name": user.name,
                "email": user.email
            },
            "slotDate": a.slot_date,
            "slotTime": a.slot_time,
            "session": a.session,
            "tokenNumber": a.token_number,
            "amount": float(a.amount),
            "payment": a.payment,
            "paymentStatus": a.payment_status,
            "cancelled": a.cancelled,
            "isCompleted": a.is_completed,
            "status": a.status
        })
        
    return {"success": True, "appointments": appt_list}


@router.post("/user/book-appointment")
async def book_appointment(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Book appointment with session tracking and token generation."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    try:
        body = await get_request_data(request)
        doc_id = body.get("docId") or body.get("doctorId")
        slot_date = body.get("slotDate") or body.get("appointmentDate")
        slot_time = body.get("slotTime") or body.get("appointmentTime")
        
        if not all([doc_id, slot_date, slot_time]):
            return {"success": False, "message": f"Missing required fields: docId={doc_id}, slotDate={slot_date}, slotTime={slot_time}"}

        # Determine session (Morning: before 2 PM, Evening: 2 PM onwards)
        try:
            time_str = slot_time.upper()
            hour = int(time_str.split(':')[0])
            if "PM" in time_str and hour < 12:
                hour += 12
            elif "AM" in time_str and hour == 12:
                hour = 0
            session = "Morning" if hour < 14 else "Evening"
        except (ValueError, IndexError):
            session = "Morning"
        
        # Check slot availability (Max 25)
        booked_count = await crud_appointment.get_slot_count(
            db, doctor_id=int(doc_id), slot_date=slot_date, session=session
        )
        
        if booked_count >= 25:
            return {"success": False, "message": f"{session} session is full. Please try another session or date."}

        # Generate token
        token_number = await crud_appointment.get_next_token(
            db, doctor_id=int(doc_id), slot_date=slot_date, session=session
        )

        # Get doctor info for metadata
        query = (
            select(HospitalTieUpDoctor)
            .where(HospitalTieUpDoctor.id == int(doc_id))
            .options(selectinload(HospitalTieUpDoctor.hospital_tieup))
        )
        res = await db.execute(query)
        doctor = res.scalar_one_or_none()
        
        if not doctor:
            return {"success": False, "message": "Doctor not found"}

        # Create appointment record
        from app.schemas.appointment import AppointmentCreate
        appt_in = AppointmentCreate(
            user_id=user.id,
            doctor_id=doctor.id,
            slot_date=slot_date,
            slot_time=slot_time,
            session=session,
            token_number=token_number,
            amount=50.00,
            payment_method=body.get("paymentMethod", "payOnVisit")
        )
        
        # Mark as paid if requested/simulated (done in model defaults or during creation if possible)
        # Note: self.create in CRUDBase commits immediately.
        db_appt = await crud_appointment.create(db, obj_in=appt_in)
        
        # Mark as paid if needed (we can do this in a separate update or by modifying create)
        db_appt.payment_status = "paid"
        db_appt.payment = True
        await db.commit()
        await db.refresh(db_appt)

        from app.utils.email import send_appointment_confirmation
        appointment_details = {
            "doctorName": doctor.name,
            "hospitalName": doctor.hospital_tieup.name if doctor.hospital_tieup else "MediChain Hospital",
            "date": slot_date,
            "slotTime": slot_time,
            "tokenNumber": token_number,
            "session": session
        }
        
        try:
            send_appointment_confirmation(user.email, appointment_details)
        except Exception as email_err:
            logger.error(f"Email confirmation failed: {str(email_err)}")
        
        return {
            "success": True, 
            "message": "Appointment booked successfully!",
            "appointment": {
                "id": str(db_appt.id),
                "tokenNumber": token_number,
                "session": session,
                "slotsLeft": 25 - (booked_count + 1)
            }
        }
    except Exception as e:
        logger.error(f"Booking error: {str(e)}")
        return {"success": False, "message": str(e)}

@router.post("/user/cancel-appointment")
async def cancel_appointment(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_compat)
):
    """Cancel appointment."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
        
    try:
        body = await request.json()
        appointment_id = body.get("appointmentId")
        if not appointment_id:
            return {"success": False, "message": "Appointment ID is required"}
            
        appointment = await crud_appointment.get(db, id=int(appointment_id))
        if not appointment:
            return {"success": False, "message": "Appointment not found"}
            
        # Verify ownership or admin role
        if appointment.user_id != user.id and user.role != "admin":
            return {"success": False, "message": "Unauthorized action"}
            
        appointment.cancelled = True
        appointment.status = "cancelled"
        db.add(appointment)
        await db.commit()
        
        return {"success": True, "message": "Appointment cancelled successfully"}
    except Exception as e:
        logger.error(f"Cancel appointment error: {e}")
        return {"success": False, "message": str(e)}


@router.post("/user/forgot-password")
async def forgot_password(request: Request, db: AsyncSession = Depends(get_db)):
    """Generate OTP and send via email."""
    try:
        body = await request.json()
        email = body.get("email")
        if not email:
            return {"success": False, "message": "Email is required"}
            
        from app.crud.crud_user import user as crud_user
        user = await crud_user.get_by_email(db, email=email)
        if not user:
            return {"success": False, "message": "User not found"}
            
        # Generate 6-digit OTP
        import random
        otp = str(random.randint(100000, 999999))
        
        # Update user with OTP
        user.reset_password_otp = otp
        db.add(user)
        await db.commit()
        
        from app.utils.email import send_otp_email
        success = send_otp_email(email, otp)
        
        if success:
            return {"success": True, "message": "OTP sent to your email"}
        else:
            return {"success": False, "message": "Failed to send email. Check configuration."}
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return {"success": False, "message": str(e)}


@router.post("/user/reset-password")
async def reset_password(request: Request, db: AsyncSession = Depends(get_db)):
    """Reset password using OTP."""
    try:
        body = await request.json()
        email = body.get("email")
        otp = body.get("otp")
        new_password = body.get("newPassword")
        
        if not all([email, otp, new_password]):
            return {"success": False, "message": "Missing required fields: email, otp, and newPassword are required"}
            
        from app.crud.crud_user import user as crud_user
        user = await crud_user.get_by_email(db, email=email)
        if not user:
            return {"success": False, "message": "User not found"}
            
        # Verify OTP
        if user.reset_password_otp != otp:
             return {"success": False, "message": "Invalid OTP. Please check your email again."}
             
        # Update password
        from app.core.security import get_password_hash
        user.password = get_password_hash(new_password)
        user.reset_password_otp = None # Clear OTP
        db.add(user)
        await db.commit()
        
        return {"success": True, "message": "Password reset successfully. You can now login with your new password."}
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        return {"success": False, "message": str(e)}


@router.get("/user/saved-profiles")
async def get_saved_profiles(
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Get all saved patient profiles for the logged in user."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    from app.models.user import SavedProfile
    query = select(SavedProfile).where(SavedProfile.user_id == user.id)
    result = await db.execute(query)
    profiles = result.scalars().all()
    
    return {
        "success": True,
        "profiles": [
            {
                "_id": str(p.id),
                "id": str(p.id), # Some frontend parts use id
                "name": p.name,
                "age": p.age,
                "gender": p.gender,
                "relationship": p.relationship,
                "phone": p.phone or "",
                "medicalHistory": p.medical_history or []
            }
            for p in profiles
        ]
    }


@router.post("/user/saved-profiles/add")
async def add_saved_profile(
    request: Request,
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Add a new saved profile."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    try:
        body = await request.json()
        from app.models.user import SavedProfile
        
        new_profile = SavedProfile(
            user_id=user.id,
            name=body.get("name"),
            age=int(body.get("age")) if body.get("age") else None,
            gender=body.get("gender"),
            relationship=body.get("relationship"),
            phone=body.get("phone"),
            medical_history=body.get("medicalHistory")
        )
        db.add(new_profile)
        await db.commit()
        await db.refresh(new_profile)
        
        return {"success": True, "message": "Profile added successfully", "profileId": str(new_profile.id)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/user/saved-profiles/update")
async def update_saved_profile(
    request: Request,
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing saved profile."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    try:
        body = await request.json()
        profile_id = body.get("profileId") or body.get("_id") or body.get("id")
        
        from app.models.user import SavedProfile
        query = select(SavedProfile).where(SavedProfile.id == int(profile_id), SavedProfile.user_id == user.id)
        result = await db.execute(query)
        profile = result.scalar_one_or_none()
        
        if not profile:
            return {"success": False, "message": "Profile not found"}
            
        if "name" in body: profile.name = body["name"]
        if "age" in body: profile.age = int(body["age"]) if body["age"] else None
        if "gender" in body: profile.gender = body["gender"]
        if "relationship" in body: profile.relationship = body["relationship"]
        if "phone" in body: profile.phone = body["phone"]
        if "medicalHistory" in body: profile.medical_history = body["medicalHistory"]
        
        db.add(profile)
        await db.commit()
        
        return {"success": True, "message": "Profile updated successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/user/saved-profiles/delete")
async def delete_saved_profile(
    request: Request,
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Delete a saved profile."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    try:
        body = await request.json()
        profile_id = body.get("profileId") or body.get("_id") or body.get("id")
        
        from app.models.user import SavedProfile
        query = select(SavedProfile).where(SavedProfile.id == int(profile_id), SavedProfile.user_id == user.id)
        result = await db.execute(query)
        profile = result.scalar_one_or_none()
        
        if not profile:
            return {"success": False, "message": "Profile not found"}
            
        await db.delete(profile)
        await db.commit()
        
        return {"success": True, "message": "Profile deleted successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/user/emergency-contacts")
async def get_emergency_contacts(
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Get user's emergency contacts."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    from app.models.user import EmergencyContact
    query = select(EmergencyContact).where(EmergencyContact.user_id == user.id)
    result = await db.execute(query)
    contacts = result.scalars().all()
    
    return {
        "success": True,
        "contacts": [
            {
                "_id": str(c.id),
                "name": c.name,
                "phone": c.phone,
                "relation": c.relation,
                "contactType": c.contact_type or "Primary"
            }
            for c in contacts
        ]
    }


@router.post("/user/emergency-contacts/add")
async def add_emergency_contact(
    request: Request,
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Add a new emergency contact."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    try:
        body = await request.json()
        from app.models.user import EmergencyContact
        
        new_contact = EmergencyContact(
            user_id=user.id,
            name=body.get("name"),
            phone=body.get("phone"),
            relation=body.get("relation"),
            contact_type=body.get("contactType") or "Primary"
        )
        db.add(new_contact)
        await db.commit()
        await db.refresh(new_contact)
        
        return {"success": True, "message": "Contact added successfully", "contactId": str(new_contact.id)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/user/emergency-contacts/update")
async def update_emergency_contact(
    request: Request,
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing emergency contact."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    try:
        body = await request.json()
        contact_id = body.get("contactId") or body.get("_id") or body.get("id")
        
        from app.models.user import EmergencyContact
        query = select(EmergencyContact).where(EmergencyContact.id == int(contact_id), EmergencyContact.user_id == user.id)
        result = await db.execute(query)
        contact = result.scalar_one_or_none()
        
        if not contact:
            return {"success": False, "message": "Contact not found"}
            
        if "name" in body: contact.name = body["name"]
        if "phone" in body: contact.phone = body["phone"]
        if "relation" in body: contact.relation = body["relation"]
        if "contactType" in body: contact.contact_type = body["contactType"]
        
        db.add(contact)
        await db.commit()
        
        return {"success": True, "message": "Contact updated successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/user/emergency-contacts/delete")
async def delete_emergency_contact(
    request: Request,
    user: Optional[User] = Depends(get_current_user_compat),
    db: AsyncSession = Depends(get_db)
):
    """Delete an emergency contact."""
    if not user:
        return {"success": False, "message": "Invalid Session. Please login again."}
    
    try:
        body = await request.json()
        contact_id = body.get("contactId") or body.get("_id") or body.get("id")
        
        from app.models.user import EmergencyContact
        query = select(EmergencyContact).where(EmergencyContact.id == int(contact_id), EmergencyContact.user_id == user.id)
        result = await db.execute(query)
        contact = result.scalar_one_or_none()
        
        if not contact:
            return {"success": False, "message": "Contact not found"}
            
        await db.delete(contact)
        await db.commit()
        
        return {"success": True, "message": "Contact deleted successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/emergency/send-alert")
async def emergency_alert_compat(request: Request):
    """Emergency alert endpoint - logs in development mode."""
    try:
        body = await request.json()
        phone = body.get("phone")
        patient_name = body.get("patientName")
        location = body.get("location")
        
        if not phone or not patient_name:
            return {"success": False, "message": "Phone number and patient name are required"}
            
        # Development mode logging
        logger.info("\n📱 Emergency Alert Service (Development Mode):")
        logger.info(f"To: {phone}")
        logger.info(f"Patient: {patient_name}")
        logger.info(f"Location: {location}")
        
        return {
            "success": True, 
            "message": "Emergency SMS sent successfully",
            "sid": f"DEV_{int(time.time())}"
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


# ============================================
# Job Application Routes (matching Node.js /api/job/*)
# ============================================

import os
import shutil
from fastapi import Response
from fastapi.responses import FileResponse

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "resumes")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/job/apply")
async def apply_for_job_compat(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    city: str = Form(...),
    qualification: str = Form(...),
    experience: str = Form(...),
    role_applied: str = Form(...),
    skills: str = Form(...),
    coverLetter: Optional[str] = Form(None),
    resume: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Public endpoint to submit job application."""
    try:
        # Validate file type
        allowed_types = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        if resume.content_type not in allowed_types:
            return {"success": False, "message": "Only PDF and Word documents are allowed."}
            
        # Save file
        timestamp = int(time.time() * 1000)
        safe_name = resume.filename.replace(" ", "_")
        file_name = f"{timestamp}_{safe_name}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(resume.file, buffer)
            
        # Create DB record
        new_app = JobApplication(
            name=name,
            email=email.lower(),
            phone=phone,
            position=role_applied,
            resume_url=file_path, # We store the full path as per Node implementation
            cover_letter=coverLetter or "",
            city=city,
            qualification=qualification,
            experience=experience,
            skills=skills,
            status="pending"
        )
        db.add(new_app)
        await db.commit()
        await db.refresh(new_app)
        
        return {"success": True, "message": "Application submitted successfully."}
    except Exception as e:
        logger.error(f"Error in apply_for_job: {e}")
        return {"success": False, "message": f"Failed to submit application: {str(e)}"}

@router.get("/job/admin/list")
async def list_job_applications_compat(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_compat)
):
    """Admin-only endpoint to list job applications."""
    if not user or user.role != "admin":
        return {"success": False, "message": "Unauthorized. Admin access required."}
        
    try:
        query = select(JobApplication)
        if search:
            query = query.where(
                (JobApplication.name.ilike(f"%{search}%")) |
                (JobApplication.email.ilike(f"%{search}%")) |
                (JobApplication.position.ilike(f"%{search}%"))
            )
        query = query.order_by(JobApplication.created_at.desc())
        
        result = await db.execute(query)
        applications = result.scalars().all()
        
        data = []
        for app in applications:
            data.append({
                "id": app.id,
                "name": app.name,
                "email": app.email,
                "phone": app.phone,
                "position": app.position,
                "resume_url": app.resume_url,
                "cover_letter": app.cover_letter,
                "city": app.city,
                "qualification": app.qualification,
                "experience": app.experience,
                "skills": app.skills,
                "status": app.status,
                "created_at": app.created_at
            })
            
        return {"success": True, "applications": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/job/admin/{id}/resume")
async def download_resume_compat(
    id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_compat)
):
    """Admin-only: download resume."""
    if not user or user.role != "admin":
        return {"success": False, "message": "Unauthorized"}
        
    query = select(JobApplication).where(JobApplication.id == id)
    result = await db.execute(query)
    application = result.scalar_one_or_none()
    
    if not application:
        return {"success": False, "message": "Application not found"}
        
    file_path = application.resume_url
    if not file_path or not os.path.exists(file_path):
        return {"success": False, "message": "Resume file not found on server"}
        
    return FileResponse(file_path)

@router.delete("/job/admin/{id}")
async def delete_job_application_compat(
    id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_compat)
):
    """Admin-only: delete application."""
    if not user or user.role != "admin":
        return {"success": False, "message": "Unauthorized"}
        
    try:
        query = select(JobApplication).where(JobApplication.id == id)
        result = await db.execute(query)
        application = result.scalar_one_or_none()
        
        if not application:
            return {"success": False, "message": "Application not found"}
            
        file_path = application.resume_url
        
        await db.delete(application)
        await db.commit()
        
        # Delete file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
                
        return {"success": True, "message": "Application deleted successfully."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/job/admin/{id}/approve")
async def approve_job_application_compat(
    id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_compat)
):
    """Admin-only: approve application."""
    if not user or user.role != "admin":
        return {"success": False, "message": "Unauthorized"}
        
    try:
        query = select(JobApplication).where(JobApplication.id == id)
        result = await db.execute(query)
        application = result.scalar_one_or_none()
        
        if not application:
            return {"success": False, "message": "Application not found"}
            
        application.status = "approved"
        await db.commit()
        
        # Send interview email
        send_job_interview_email(application.email, {
            "name": application.name,
            "role": application.position
        })
        
        return {"success": True, "message": "Application approved and interview email sent."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/job/admin/{id}/reject")
async def reject_job_application_compat(
    id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_compat)
):
    """Admin-only: reject application."""
    if not user or user.role != "admin":
        return {"success": False, "message": "Unauthorized"}
        
    try:
        query = select(JobApplication).where(JobApplication.id == id)
        result = await db.execute(query)
        application = result.scalar_one_or_none()
        
        if not application:
            return {"success": False, "message": "Application not found"}
            
        application.status = "rejected"
        await db.commit()
        
        # Send rejection email
        send_job_rejection_email(application.email, {
            "name": application.name,
            "role": application.position
        })
        
        return {"success": True, "message": "Application rejected and email sent."}
    except Exception as e:
        return {"success": False, "message": str(e)}


# ============================================
# Payment Integration Routes & WebSockets (matching Node.js /api/payment/*)
# ============================================

from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        # appointment_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, appointment_id: str):
        await websocket.accept()
        if appointment_id not in self.active_connections:
            self.active_connections[appointment_id] = []
        self.active_connections[appointment_id].append(websocket)
        logger.info(f"WebSocket connected for appointment: {appointment_id}")

    def disconnect(self, websocket: WebSocket, appointment_id: str):
        if appointment_id in self.active_connections:
            if websocket in self.active_connections[appointment_id]:
                self.active_connections[appointment_id].remove(websocket)
            if not self.active_connections[appointment_id]:
                del self.active_connections[appointment_id]
        logger.info(f"WebSocket disconnected for appointment: {appointment_id}")

    async def notify_payment_success(self, appointment_id: str):
        if appointment_id in self.active_connections:
            message = json.dumps({
                "type": "PAYMENT_SUCCESS",
                "appointmentId": appointment_id,
                "timestamp": datetime.now().isoformat()
            })
            for connection in self.active_connections[appointment_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending websocket message: {e}")

manager = ConnectionManager()

@router.websocket("/payment-updates")
async def websocket_endpoint(websocket: WebSocket, appointmentId: str):
    await manager.connect(websocket, appointmentId)
    try:
        # Send confirmation
        await websocket.send_text(json.dumps({
            "type": "CONNECTED",
            "appointmentId": appointmentId,
            "message": "WebSocket connection established"
        }))
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, appointmentId)
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        manager.disconnect(websocket, appointmentId)

class UPIWebhookRequest(BaseModel):
    appointmentId: int
    transactionId: Optional[str] = None
    amount: float
    status: str
    upiTxnId: Optional[str] = None
    payerVPA: Optional[str] = None
    timestamp: Optional[str] = None

@router.post("/payment/webhook/upi-payment")
async def upi_payment_webhook_compat(
    request: UPIWebhookRequest,
    db: AsyncSession = Depends(get_db)
):
    """UPI Payment Webhook."""
    try:
        if request.status.upper() == "SUCCESS":
            query = select(Appointment).where(Appointment.id == request.appointmentId)
            result = await db.execute(query)
            appointment = result.scalar_one_or_none()
            
            if not appointment:
                return {"success": False, "message": "Appointment not found"}
                
            if appointment.payment:
                return {"success": True, "message": "Already processed"}
                
            # Verify amount (float comparison can be tricky, use round)
            if round(float(request.amount), 2) != round(float(appointment.amount), 2):
                return {"success": False, "message": "Amount mismatch"}
                
            # Update appointment
            appointment.payment = True
            appointment.payment_status = "paid"
            appointment.transaction_id = request.transactionId
            # appointment.upi_transaction_id = request.upiTxnId (Need to add column if not exists)
            
            await db.commit()
            
            # Notify WebSocket
            await manager.notify_payment_success(str(request.appointmentId))
            
            return {"success": True, "message": "Payment processed"}
        else:
            return {"success": False, "message": "Payment failed", "status": request.status}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/payment/verify-manual")
async def verify_manual_payment_compat(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_compat)
):
    """Manual payment verification."""
    data = await request.json()
    appointment_id = data.get("appointmentId")
    
    if not user:
        return {"success": False, "message": "Unauthorized"}
        
    query = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(query)
    appointment = result.scalar_one_or_none()
    
    if not appointment:
        return {"success": False, "message": "Appointment not found"}
        
    if appointment.user_id != user.id:
        return {"success": False, "message": "Unauthorized"}
        
    is_paid = appointment.payment or appointment.payment_status == "paid"
    return {
        "success": True,
        "isPaid": is_paid,
        "appointment": {
            "payment": appointment.payment,
            "paymentStatus": appointment.payment_status,
            "transactionId": appointment.transaction_id
        }
    }

@router.get("/payment/merchant-upi")
async def get_merchant_upi_compat(user: User = Depends(get_current_user_compat)):
    """Get merchant UPI ID."""
    if not user:
        return {"success": False, "message": "Unauthorized"}
    merchant_upi = os.getenv("MERCHANT_UPI_ID", "824771300@ybl")
    return {"success": True, "merchantUPI": merchant_upi}

@router.post("/payment/simulate-upi-payment")
async def simulate_upi_payment_compat(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_compat)
):
    """Simulate UPI payment for testing."""
    data = await request.json()
    appointment_id = data.get("appointmentId")
    
    if not user:
        return {"success": False, "message": "Unauthorized"}
        
    # We can't easily do background task with delay in this simple setup without BackgroundTasks
    # But for simulation we can just update immediately or use a simple task
    try:
        query = select(Appointment).where(Appointment.id == appointment_id)
        result = await db.execute(query)
        appointment = result.scalar_one_or_none()
        
        if appointment:
            appointment.payment = True
            appointment.payment_status = "paid"
            appointment.transaction_id = f"SIM{int(time.time())}"
            await db.commit()
            
            # Notify via WebSocket (In production use BackgroundTasks)
            await manager.notify_payment_success(str(appointment_id))
            
        return {"success": True, "message": "Payment simulation successful"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# ============================================
# Doctor Routes (matching Node.js /api/doctor/*)
# ============================================

@router.get("/doctor/list")
async def doctor_list_compat(db: AsyncSession = Depends(get_db)):
    """Public list of all doctors."""
    try:
        from app.models.hospital import HospitalTieUpDoctor
        # Combine both main doctors and hospital tie-up doctors if needed, 
        # or just return hospital doctors as per recent PMS focus.
        # Main Node app seems to split them but "doctor/list" usually refers to main doctors.
        from app.models.doctor import Doctor as MainDoctor
        
        result = await db.execute(select(MainDoctor).order_by(MainDoctor.name.asc()))
        doctors = result.scalars().all()
        
        data = []
        for d in doctors:
            data.append({
                "_id": d.id,
                "name": d.name,
                "image": d.image,
                "speciality": d.speciality,
                "degree": d.degree,
                "experience": d.experience,
                "about": d.about,
                "fees": float(d.fees),
                "address": {"line1": d.address_line1, "line2": d.address_line2},
                "available": d.available,
                "slots_booked": d.slots_booked or {}
            })
            
        return {"success": True, "doctors": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/doctor/profile")
async def doctor_profile_compat(
    db: AsyncSession = Depends(get_db),
    doctor: User = Depends(get_current_user_compat) # Re-using token check
):
    if not doctor:
        return {"success": False, "message": "Unauthorized"}
    return {"success": True, "doctorData": doctor}


# ============================================
# Hospital Tie-up Routes (matching Node.js /api/hospital-tieup/*)
# ============================================

@router.get("/hospital-tieup/public")
async def get_public_hospitals_compat(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(HospitalTieUp).where(HospitalTieUp.is_active == True))
        hospitals = result.scalars().all()
        return {"success": True, "hospitals": hospitals}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/hospital-tieup/public/all")
async def get_all_public_hospitals_with_doctors_compat(db: AsyncSession = Depends(get_db)):
    """Get all hospitals with their doctors."""
    try:
        # Using selectinload for efficient loading of relationships if defined
        query = select(HospitalTieUp).where(HospitalTieUp.is_active == True)
        result = await db.execute(query)
        hospitals = result.scalars().all()
        
        data = []
        for h in hospitals:
            # Fetch doctors for this hospital
            d_query = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.hospital_tieup_id == h.id)
            d_result = await db.execute(d_query)
            doctors = d_result.scalars().all()
            
            data.append({
                "id": h.id,
                "name": h.name,
                "location": h.location,
                "address": h.address,
                "contact": h.contact,
                "image": h.image,
                "doctors": doctors
            })
            
        return {"success": True, "hospitals": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/hospital-tieup/public/doctors")
async def get_all_hospital_doctors_compat(db: AsyncSession = Depends(get_db)):
    try:
        query = select(HospitalTieUpDoctor)
        result = await db.execute(query)
        doctors = result.scalars().all()
        return {"success": True, "doctors": doctors}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/hospital-tieup/details/{id}")
async def get_hospital_details_compat(id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(HospitalTieUp).where(HospitalTieUp.id == id))
        hospital = result.scalar_one_or_none()
        if not hospital:
            return {"success": False, "message": "Hospital not found"}
            
        d_query = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.hospital_tieup_id == id)
        d_result = await db.execute(d_query)
        doctors = d_result.scalars().all()
        
        return {
            "success": True, 
            "hospital": {
                "id": hospital.id,
                "name": hospital.name,
                "location": hospital.location,
                "address": hospital.address,
                "contact": hospital.contact,
                "doctors": doctors
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


# ============================================
# AI Integration Routes (matching Node.js /api/ai/*)
# ============================================

class AIChatRequest(BaseModel):
    message: str
    conversationHistory: Optional[List[Dict[str, Any]]] = []
    userId: Optional[int] = None

@router.post("/ai/chat")
async def ai_chat_compat(
    request: AIChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """AI Chat endpoint using Gemini/AIService."""
    try:
        response = await ai_service.ai_chat(
            message=request.message,
            history=request.conversationHistory,
            db=db,
            user_id=request.userId
        )
        return response
    except Exception as e:
        logger.error(f"AI Chat Error: {e}")
        return {"success": False, "message": str(e)}

@router.get("/ai/doctor-slots")
async def get_doctor_slots_compat(
    docId: int,
    db: AsyncSession = Depends(get_db)
):
    """Get available slots for a doctor."""
    try:
        slots = await ai_service.get_available_slots(db, docId)
        # Fetch doctor details for response parity
        from app.models.hospital import HospitalTieUpDoctor
        result = await db.execute(select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.id == docId))
        doctor = result.scalar_one_or_none()
        
        return {
            "success": True,
            "doctor": {
                "id": doctor.id if doctor else docId,
                "name": doctor.name if doctor else "Unknown",
                "speciality": doctor.speciality if doctor else "Unknown",
                "fees": doctor.fees if doctor else 0
            },
            "availableSlots": slots
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/ai/user-context")
async def get_user_context_compat(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_compat)
):
    """Get user's appointments context (logged in)."""
    if not user:
        return {"success": True, "appointments": []}
        
    try:
        # Fetch recent appointments for contextual AI
        from app.models.appointment import Appointment
        query = select(Appointment).where(
            Appointment.user_id == user.id,
            Appointment.cancelled == False,
            Appointment.is_completed == False
        ).order_by(Appointment.slot_date.asc())
        
        result = await db.execute(query)
        appointments = result.scalars().all()
        
        data = []
        for apt in appointments[:5]:
            # Try to get doctor name from hospital_doctor table if doc_id exists
            doc_name = "Unknown"
            if apt.doc_id:
                from app.models.hospital import HospitalTieUpDoctor
                d_res = await db.execute(select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.id == apt.doc_id))
                doc = d_res.scalar_one_or_none()
                if doc: doc_name = doc.name
                
            data.append({
                "id": apt.id,
                "doctorName": doc_name,
                "date": apt.slot_date,
                "time": apt.slot_time,
                "status": apt.status
            })
            
        return {"success": True, "appointments": data}
    except Exception as e:
        return {"success": False, "message": str(e)}


# ============================================
# OTP Verification Routes (matching Node.js /api/*.otp)
# ============================================

@router.post("/send-otp")
async def send_otp_compat(request: Request):
    """Send OTP to user's email."""
    try:
        body = await get_request_data(request)
        email = body.get("email")
        
        if not email:
            return {"success": False, "message": "Please provide a valid email address"}
            
        # Check if email already has active OTP
        if otp_manager.has_active_otp(email):
            remaining = otp_manager.get_remaining_time(email)
            mins = remaining // 60
            secs = remaining % 60
            return {"success": False, "message": f"OTP already sent. Please wait {mins}:{secs:02d} before requesting a new one"}
            
        # Generate and store OTP
        otp = otp_manager.generate_otp()
        try:
            otp_manager.store_otp(email, otp)
        except ValueError as e:
            return {"success": False, "message": str(e)}
            
        # Send email
        sent = send_otp_email(email, otp)
        if sent:
            return {"success": True, "message": "OTP sent successfully to your email. Please check your inbox."}
        else:
            otp_manager.remove_otp(email)
            return {"success": False, "message": "Failed to send OTP email. Please try again later."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/verify-otp")
async def verify_otp_compat(request: Request):
    """Verify OTP entered by user."""
    try:
        body = await get_request_data(request)
        email = body.get("email")
        otp = body.get("otp")
        
        if not email or not otp:
            return {"success": False, "message": "Email and OTP are required"}
            
        success, message = otp_manager.verify_otp(email, otp)
        return {"success": success, "message": message}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/verify-brevo")
async def verify_brevo_compat():
    """Verify Brevo API connection."""
    # Simple check if API key is present
    if settings.BREVO_API_KEY:
        return {"success": True, "message": "Brevo API key is configured"}
    return {"success": False, "message": "Brevo API key is not configured"}


# ============================================
# Geography/Location Routes (matching Node.js /api/location/*)
# ============================================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km using Haversine formula."""
    R = 6371  # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.get("/location/geocode")
async def geocode_address(address: str):
    """Geocode an address using Nominatim (OpenStreetMap)."""
    if not address:
        return {"success": False, "message": "Address is required"}
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1
                },
                headers={
                    "User-Agent": "MedChain Hospital Finder"
                }
            )
            data = response.json()
            if data and len(data) > 0:
                return {
                    "success": True,
                    "coordinates": {
                        "lat": float(data[0]["lat"]),
                        "lon": float(data[0]["lon"])
                    }
                }
            return {"success": False, "message": "Address not found"}
        except Exception as e:
            logger.error(f"Geocoding error: {e}")
            return {"success": False, "message": f"Error geocoding address: {str(e)}"}

@router.get("/location/nearby-hospitals")
async def find_nearby_hospitals(lat: float, lon: float, radius: float = 3.0):
    """Find nearby hospitals using Overpass API (OpenStreetMap)."""
    radius_meters = radius * 1000
    overpass_query = f"""
    [out:json][timeout:25];
    (
      node["amenity"~"^(hospital|clinic|doctors|pharmacy)"](around:{radius_meters},{lat},{lon});
      way["amenity"~"^(hospital|clinic|doctors|pharmacy)"](around:{radius_meters},{lat},{lon});
      relation["amenity"~"^(hospital|clinic|doctors|pharmacy)"](around:{radius_meters},{lat},{lon});
    );
    out center tags;
    """
    
    endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter"
    ]
    
    async with httpx.AsyncClient() as client:
        last_error = None
        for endpoint in endpoints:
            try:
                response = await client.post(
                    endpoint,
                    data={"data": overpass_query},
                    timeout=30.0
                )
                if response.status_code == 200:
                    data = response.json()
                    hospitals = []
                    elements = data.get("elements", [])
                    
                    for el in elements:
                        tags = el.get("tags", {})
                        amenity = tags.get("amenity")
                        
                        # Coordinates
                        el_lat, el_lon = None, None
                        if el.get("type") == "node":
                            el_lat, el_lon = el.get("lat"), el.get("lon")
                        elif el.get("center"):
                            el_lat, el_lon = el.get("center", {}).get("lat"), el.get("center", {}).get("lon")
                        
                        if el_lat is None or el_lon is None:
                            continue
                            
                        distance = calculate_distance(lat, lon, el_lat, el_lon)
                        
                        # Format Address
                        addr_parts = []
                        for key in ['addr:housenumber', 'addr:street', 'addr:road', 'addr:city']:
                            if key in tags: addr_parts.append(tags[key])
                        address = ", ".join(addr_parts) if addr_parts else "Address not available"
                        
                        # Format Phone
                        phone = tags.get("phone") or tags.get("contact:phone") or "Not available"
                        
                        # Infer Specialization
                        name = tags.get("name", "").lower()
                        spec = "General"
                        if "cardiac" in name or "heart" in name: spec = "Cardiology"
                        elif "eye" in name or "ophthal" in name: spec = "Ophthalmology"
                        elif "dental" in name: spec = "Dentistry"
                        elif "pediatric" in name: spec = "Pediatrics"
                        
                        hospitals.append({
                            "name": tags.get("name") or tags.get("name:en") or "Unnamed Hospital",
                            "address": address,
                            "phone": phone,
                            "latitude": el_lat,
                            "longitude": el_lon,
                            "distance": round(distance, 2),
                            "type": amenity.capitalize() if amenity else "Medical Facility",
                            "specialization": tags.get("healthcare:speciality") or spec,
                            "website": tags.get("website") or tags.get("contact:website"),
                            "openingHours": tags.get("opening_hours")
                        })
                    
                    hospitals.sort(key=lambda x: x["distance"])
                    return {
                        "success": True,
                        "hospitals": hospitals,
                        "count": len(hospitals),
                        "userLocation": {"lat": lat, "lon": lon},
                        "radius": radius
                    }
            except Exception as e:
                last_error = str(e)
                continue
                
        return {"success": False, "message": "Unable to fetch nearby hospitals", "error": last_error}


# ============================================
# Specialty Routes (matching Node.js /api/specialty/*)
# ============================================

@router.get("/specialty/helpline/{docId}")
async def get_helpline_for_appointment(docId: str, db: AsyncSession = Depends(get_db)):
    """Get helpline for appointment based on doctor's specialty."""
    try:
        # Get doctor
        doc_id_int = int(docId)
        doctor_q = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.id == doc_id_int)
        doctor_res = await db.execute(doctor_q)
        doctor = doctor_res.scalar_one_or_none()
        
        if not doctor:
            return {"success": False, "message": "Doctor not found"}
            
        # Get specialty helpline
        spec_q = select(Specialty).where(Specialty.specialty_name == doctor.specialization)
        spec_res = await db.execute(spec_q)
        specialty = spec_res.scalar_one_or_none()
        
        if not specialty:
            return {"success": False, "message": "Helpline not available for this specialty"}
            
        return {
            "success": True, 
            "data": {
                "id": specialty.id,
                "specialtyName": specialty.specialty_name,
                "helplineNumber": specialty.helpline_number,
                "availability": specialty.availability,
                "status": specialty.status
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/specialty/public/all")
async def get_all_specialties_public(db: AsyncSession = Depends(get_db)):
    """Get all specialties for patient panel."""
    try:
        query = select(Specialty).where(Specialty.status == "Active")
        result = await db.execute(query)
        specialties = result.scalars().all()
        
        data = [
            {
                "id": s.id,
                "specialtyName": s.specialty_name,
                "helplineNumber": s.helpline_number,
                "availability": s.availability,
                "status": s.status
            } for s in specialties
        ]
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/specialty/all")
async def get_all_specialties_admin(db: AsyncSession = Depends(get_db)):
    """Get all specialties for admin panel (including inactive)."""
    try:
        query = select(Specialty)
        result = await db.execute(query)
        specialties = result.scalars().all()
        
        data = [
            {
                "id": s.id,
                "specialtyName": s.specialty_name,
                "helplineNumber": s.helpline_number,
                "availability": s.availability,
                "status": s.status
            } for s in specialties
        ]
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/specialty/{specialtyName}")
async def get_specialty_by_name(specialtyName: str, db: AsyncSession = Depends(get_db)):
    """Get specialty details by name."""
    try:
        query = select(Specialty).where(Specialty.specialty_name == specialtyName)
        result = await db.execute(query)
        specialty = result.scalar_one_or_none()
        
        if not specialty:
            return {"success": False, "message": "Specialty not found"}
            
        return {
            "success": True, 
            "data": {
                "id": specialty.id,
                "specialtyName": specialty.specialty_name,
                "helplineNumber": specialty.helpline_number,
                "availability": specialty.availability,
                "status": specialty.status
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/specialty/create")
async def create_specialty_compat(request: Request, db: AsyncSession = Depends(get_db)):
    """Create a new specialty."""
    try:
        body = await get_request_data(request)
        specialty_name = body.get("specialtyName")
        helpline_number = body.get("helplineNumber")
        availability = body.get("availability", "24x7")
        status = body.get("status", "Active")
        
        if not specialty_name or not helpline_number:
            return {"success": False, "message": "Specialty Name and Helpline Number are required"}
            
        # Check existing
        existing_q = select(Specialty).where(Specialty.specialty_name == specialty_name)
        existing_res = await db.execute(existing_q)
        if existing_res.scalar_one_or_none():
            return {"success": False, "message": "Specialty already exists"}
            
        new_spec = Specialty(
            specialty_name=specialty_name,
            helpline_number=helpline_number,
            availability=availability,
            status=status
        )
        db.add(new_spec)
        await db.commit()
        await db.refresh(new_spec)
        
        return {
            "success": True, 
            "message": "Specialty helpline created successfully",
            "data": {
                "id": new_spec.id,
                "specialtyName": new_spec.specialty_name,
                "helplineNumber": new_spec.helpline_number,
                "availability": new_spec.availability,
                "status": new_spec.status
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.put("/specialty/update/{id}")
async def update_specialty_compat(id: int, request: Request, db: AsyncSession = Depends(get_db)):
    """Update an existing specialty."""
    try:
        body = await get_request_data(request)
        
        query = select(Specialty).where(Specialty.id == id)
        result = await db.execute(query)
        specialty = result.scalar_one_or_none()
        
        if not specialty:
            return {"success": False, "message": "Specialty not found"}
            
        if "helplineNumber" in body:
            specialty.helpline_number = body["helplineNumber"]
        if "availability" in body:
            specialty.availability = body["availability"]
        if "status" in body:
            specialty.status = body["status"]
        if "specialtyName" in body:
            specialty.specialty_name = body["specialtyName"]
            
        await db.commit()
        await db.refresh(specialty)
        
        return {
            "success": True, 
            "message": "Specialty helpline updated successfully",
            "data": {
                "id": specialty.id,
                "specialtyName": specialty.specialty_name,
                "helplineNumber": specialty.helpline_number,
                "availability": specialty.availability,
                "status": specialty.status
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.delete("/specialty/delete/{id}")
async def delete_specialty_compat(id: int, db: AsyncSession = Depends(get_db)):
    """Delete a specialty."""
    try:
        query = select(Specialty).where(Specialty.id == id)
        result = await db.execute(query)
        specialty = result.scalar_one_or_none()
        
        if not specialty:
            return {"success": False, "message": "Specialty not found"}
            
        await db.delete(specialty)
        await db.commit()
        
        return {"success": True, "message": "Specialty helpline deleted successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/user/payment-payu/init")
async def payu_init_stub(request: Request):
    """PayU payment initialization stub."""

