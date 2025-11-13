# accounts/utils.py

import random
import resend
import os
from django.core.cache import cache  
from django.conf import settings

def send_otp_to_email(email, email_subject):
    # Generate OTP
    otp = str(random.randint(1000, 9999))
    
    # Store OTP in cache for 5 minutes
    cache.set(email, otp, timeout=300)
    
    # Configure Resend API key
    resend.api_key = os.getenv("RESEND_API_KEY")
    
    try:
        # Send email using Resend
        params = {
            "from": "House of Anbu <onboarding@resend.dev>",  # Use Resend's verified domain
            "to": [email],
            "subject": f"OTP email from House of Anbu! for {email_subject}",
            "html": f"""
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                    <h2 style="color: #6366f1;">House of Anbu</h2>
                    <p style="font-size: 16px;">Your OTP for {email_subject} is:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #6366f1; font-size: 36px; letter-spacing: 8px; margin: 0;">{otp}</h1>
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
                </div>
            """,
            "text": f"Your OTP is: {otp}\n\nThis code will expire in 5 minutes."  # Plain text fallback
        }
        
        result = resend.Emails.send(params)
        print(f"✅ Email sent successfully to {email}: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending email to {email}: {e}")
        # Don't fail silently - raise the exception so the view can handle it
        raise Exception(f"Failed to send OTP email: {str(e)}")