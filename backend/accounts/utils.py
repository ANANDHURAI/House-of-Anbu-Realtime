# utils.py
import random
from django.core.mail import send_mail
from django.core.cache import cache  
from django.conf import settings

def send_otp_to_email(email, email_subject):
    otp = str(random.randint(1000, 9999))
    cache.set(email, otp, timeout=300)  

    send_mail(
        subject=f"OTP email from House of Anbu! for {email_subject}",
        message=f"Your OTP is: {otp}",
        from_email = settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )
    return True
