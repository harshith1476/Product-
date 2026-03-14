
import requests
from typing import List, Optional
from app.core.config import settings

def send_transactional_email(
    to_email: str,
    subject: str,
    html_content: str,
    sender_name: Optional[str] = None,
    sender_email: Optional[str] = None
):
    """
    Send a transactional email using Brevo (Sendinblue) API v3.
    """
    if not settings.BREVO_API_KEY:
        print("BREVO_API_KEY not configured. Email not sent.")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": settings.BREVO_API_KEY
    }
    
    payload = {
        "sender": {
            "name": sender_name or settings.BREVO_APP_NAME or "MediChain",
            "email": sender_email or settings.BREVO_SENDER_EMAIL or "medichain123@gmail.com"
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [201, 200, 202]:
            return True
        else:
            print(f"Failed to send email via Brevo: {response.text}")
            return False
    except Exception as e:
        print(f"Error sending email via Brevo: {str(e)}")
        return False

def send_otp_email(to_email: str, otp: str):
    """Send OTP for password reset."""
    subject = f"{settings.BREVO_APP_NAME or 'MediChain'} - Password Reset OTP"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested to reset your password. Use the following OTP to proceed:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
            {otp}
        </div>
        <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
            &copy; {settings.BREVO_APP_NAME or 'MediChain'} Healthcare System
        </p>
    </div>
    """
    return send_transactional_email(to_email, subject, html_content)

def send_appointment_confirmation(to_email: str, appointment_details: dict):
    """Send appointment confirmation email."""
    subject = f"Appointment Confirmed - {settings.BREVO_APP_NAME or 'MediChain'}"
    
    # Extract details
    doctor_name = appointment_details.get('doctorName', 'your doctor')
    hospital_name = appointment_details.get('hospitalName', 'our facility')
    date_str = appointment_details.get('date', 'N/A')
    slot_time = appointment_details.get('slotTime', 'N/A')
    token_number = appointment_details.get('tokenNumber', 'N/A')
    session = appointment_details.get('session', 'N/A')
    
    # Clean up date format if it's day-month-year
    if "_" in date_str:
        parts = date_str.split("_")
        if len(parts) == 3:
            # Convert 21_2_2026 to 21 Feb 2026
            import calendar
            try:
                month_name = calendar.month_name[int(parts[1])][:3]
                date_str = f"{parts[0]} {month_name} {parts[2]}"
            except:
                pass

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }}
            .header {{ text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }}
            .logo {{ font-size: 24px; font-weight: bold; color: #3b82f6; }}
            .status-badge {{ display: inline-block; padding: 6px 12px; background-color: #d1fae5; color: #065f46; border-radius: 9999px; font-weight: 600; font-size: 14px; margin-top: 10px; }}
            .content {{ padding: 20px 0; }}
            .appointment-card {{ background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 8px; }}
            .detail-label {{ color: #6b7280; font-weight: 500; }}
            .detail-value {{ color: #111827; font-weight: 600; }}
            .token-box {{ text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 15px; border-radius: 8px; margin-top: 20px; }}
            .token-number {{ font-size: 32px; font-weight: 800; margin: 5px 0; }}
            .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px; }}
            .button {{ display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">{settings.BREVO_APP_NAME or 'MediChain'}</div>
                <div class="status-badge">✓ Appointment Confirmed</div>
            </div>
            
            <div class="content">
                <p>Dear Valued Patient,</p>
                <p>Your appointment with <strong>Dr. {doctor_name}</strong> at <strong>{hospital_name}</strong> has been successfully scheduled. Please find your appointment details below:</p>
                
                <div class="appointment-card">
                    <div class="detail-row">
                        <span class="detail-label">Doctor</span>
                        <span class="detail-value">Dr. {doctor_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location</span>
                        <span class="detail-value">{hospital_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date</span>
                        <span class="detail-value">{date_str}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Time</span>
                        <span class="detail-value">{slot_time}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Session</span>
                        <span class="detail-value">{session}</span>
                    </div>
                    
                    <div class="token-box">
                        <div style="font-size: 14px; opacity: 0.9;">YOUR TOKEN NUMBER</div>
                        <div class="token-number">{token_number}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Please present this at the reception upon arrival</div>
                    </div>
                </div>
                
                <p><strong>Important Instructions:</strong></p>
                <ul style="color: #4b5563; font-size: 14px;">
                    <li>Please arrive at least 15 minutes before your scheduled time.</li>
                    <li>Carry a valid ID proof and any relevant previous medical records.</li>
                    <li>In case you need to cancel or reschedule, please do so at least 2 hours in advance.</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>&copy; {settings.BREVO_APP_NAME or 'MediChain'} Healthcare System. All rights reserved.</p>
                <p>Connect with us if you have any questions.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_transactional_email(to_email, subject, html_content)

def send_doctor_credentials(to_email: str, doctor_name: str, password: str, employee_id: str):
    """Send login credentials to a newly added doctor."""
    subject = f"Welcome to {settings.BREVO_APP_NAME or 'MediChain'} - Your Login Credentials"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome, Dr. {doctor_name}</h2>
        <p>You have been added to the {settings.BREVO_APP_NAME or 'MediChain'} platform. Your login credentials are provided below:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Employee ID:</strong> {employee_id}</p>
            <p><strong>Email:</strong> {to_email}</p>
            <p><strong>Temporary Password:</strong> <span style="font-family: monospace; font-weight: bold;">{password}</span></p>
        </div>
        <p>Please login and change your password as soon as possible.</p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="{settings.FRONTEND_URL}/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login Now</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
            &copy; {settings.BREVO_APP_NAME or 'MediChain'} Healthcare Administration
        </p>
    </div>
    """
    return send_transactional_email(to_email, subject, html_content)
def send_job_interview_email(to_email: str, application_details: dict):
    """Send job interview invitation email."""
    subject = f"Interview Invitation - {settings.BREVO_APP_NAME or 'MediChain'}"
    name = application_details.get('name', 'Applicant')
    role = application_details.get('role', 'the position')
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #4f46e5; text-align: center;">Interview Invitation</h2>
        <p>Dear {name},</p>
        <p>Congratulations! We have reviewed your application for the position of <strong>{role}</strong> and would like to invite you for an interview.</p>
        <p>Our HR team will contact you shortly to schedule a convenient time for the interview.</p>
        <p>Best regards,</p>
        <p>HR Team<br>{settings.BREVO_APP_NAME or 'MediChain'}</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
            &copy; {settings.BREVO_APP_NAME or 'MediChain'} Healthcare Administration
        </p>
    </div>
    """
    return send_transactional_email(to_email, subject, html_content)

def send_job_rejection_email(to_email: str, application_details: dict):
    """Send job rejection email."""
    subject = f"Application Update - {settings.BREVO_APP_NAME or 'MediChain'}"
    name = application_details.get('name', 'Applicant')
    role = application_details.get('role', 'the position')
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1f2937; text-align: center;">Application Update</h2>
        <p>Dear {name},</p>
        <p>Thank you for your interest in the <strong>{role}</strong> position at {settings.BREVO_APP_NAME or 'MediChain'}.</p>
        <p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
        <p>We appreciate the time you took to apply and wish you the best in your job search.</p>
        <p>Best regards,</p>
        <p>HR Team<br>{settings.BREVO_APP_NAME or 'MediChain'}</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
            &copy; {settings.BREVO_APP_NAME or 'MediChain'} Healthcare Administration
        </p>
    </div>
    """
    return send_transactional_email(to_email, subject, html_content)
