from django.core.mail import send_mail
from django.conf import settings
import threading
import random
from django.core.cache import cache

def send_otp_to_email(email, email_subject):
    otp = str(random.randint(1000, 9999))
    safe_email = email.lower().strip()
    cache.set(safe_email, otp, timeout=300)

    # Use a thread so the user doesn't wait for the SMTP connection
    thread = threading.Thread(
        target=email_worker, 
        args=(email, email_subject, otp)
    )
    thread.start()
    return True

def email_worker(email, email_subject, otp):
    try:
        subject = f"House of Anbu - {email_subject} Verification"
        message = f"Your OTP is: {otp}. It expires in 5 minutes."
        
        # HTML version of your email
        html_message = f"""
            <div style="font-family: sans-serif; text-align: center;">
                <h2>House of Anbu</h2>
                <p>Use the code below to {email_subject}:</p>
                <h1 style="color: #4f46e5; letter-spacing: 5px;">{otp}</h1>
            </div>
        """

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
            html_message=html_message,
        )
        print(f"SMTP Success: OTP sent to {email}")
    except Exception as e:
        print(f"SMTP Error: {str(e)}")