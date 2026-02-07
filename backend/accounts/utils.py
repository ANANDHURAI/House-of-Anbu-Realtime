import random
import os
from django.core.cache import cache
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from django.conf import settings



def send_otp_to_email(email, email_subject):
    otp = str(random.randint(1000, 9999))
    cache.set(email, otp, timeout=300)

    try:
        message = Mail(
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=email,
            subject=f"OTP email from House of Anbu! for {email_subject}",
            html_content=f"""
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                    <h2 style="color: #6366f1;">House of Anbu</h2>
                    <p style="font-size: 16px;">Your OTP for {email_subject} is:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #6366f1; font-size: 36px; letter-spacing: 8px; margin: 0;">{otp}</h1>
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
            """
        )

        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)

        return True

    except Exception as e:
        raise Exception(f"Failed to send OTP email: {str(e)}")
