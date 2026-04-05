import resend
import os
import random
import threading
from django.core.cache import cache
from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def send_otp_to_email(email, email_subject):
    otp = str(random.randint(1000, 9999))
    safe_email = email.lower().strip()
    cache.set(safe_email, otp, timeout=300)

    # We still use a thread to ensure the frontend response is instant
    thread = threading.Thread(
        target=email_worker, 
        args=(email, email_subject, otp)
    )
    thread.start()
    return True

def email_worker(email, email_subject, otp):
    try:
        subject = f"House of Anbu - {email_subject} Verification"
        
        html_content = f"""
            <div style="font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">House of Anbu</h2>
                <p style="color: #666;">Use the code below to {email_subject}:</p>
                <h1 style="color: #4f46e5; letter-spacing: 8px; font-size: 32px;">{otp}</h1>
                <p style="color: #999; font-size: 12px;">This code expires in 5 minutes.</p>
            </div>
        """

        # Create the SendGrid Mail object
        message = Mail(
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=email,
            subject=subject,
            html_content=html_content
        )

        # Initialize the client and send
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        
        print(f"SendGrid Success: Status Code {response.status_code}")
        
    except Exception as e:
        print(f"SendGrid Error: {str(e)}")