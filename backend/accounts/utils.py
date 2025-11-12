# # utils.py
# import random
# from django.core.mail import send_mail
# from django.core.cache import cache  
# from django.conf import settings

# def send_otp_to_email(email, email_subject):
#     otp = str(random.randint(1000, 9999))
#     cache.set(email, otp, timeout=300)  

#     send_mail(
#         subject=f"OTP email from House of Anbu! for {email_subject}",
#         message=f"Your OTP is: {otp}",
#         from_email = settings.EMAIL_HOST_USER,
#         recipient_list=[email],
#         fail_silently=False,
#     )
#     return True




import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from django.conf import settings
import random

def generate_otp(email):
    # Your existing OTP generation logic
    otp = str(random.randint(100000, 999999))
    # Store OTP in cache/session as you currently do
    return otp

def send_otp_to_email(email, email_subject="Login"):
    otp = generate_otp(email)
    
    # Configure Brevo API
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = settings.BREVO_API_KEY
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )
    
    # Prepare email
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": email}],
        sender={
            "email": settings.DEFAULT_FROM_EMAIL,
            "name": "House of Anbu"
        },
        subject=f"OTP email from House of Anbu! for {email_subject}",
        html_content=f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">House of Anbu - {email_subject}</h2>
                <p>Your OTP code is:</p>
                <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 5px;">{otp}</h1>
                <p style="color: #666;">This code will expire in 10 minutes.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </body>
        </html>
        """
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Email sent successfully: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when sending email: {e}")
        raise Exception(f"Failed to send OTP email: {str(e)}")