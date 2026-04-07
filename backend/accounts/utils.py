import random
from django.core.cache import cache
from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_otp_to_email(email, email_subject):
    otp = str(random.randint(1000, 9999))
    safe_email = email.lower().strip()
    # Cache for 5 minutes
    cache.set(safe_email, otp, timeout=300)
    email_worker(safe_email, email_subject, otp)
    
    return True

def email_worker(email, email_subject, otp):
    try:
        subject = f"House of Anbu - {email_subject} Verification"
        
        html_content = f"""
            <div style="background-color:#f4f6f8; padding:40px 0; font-family: Arial, sans-serif;">
                <div style="max-width:500px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <div style="background:#4f46e5; padding:20px; text-align:center;">
                        <h2 style="color:#ffffff; margin:0;">House of Anbu</h2>
                    </div>
                    
                    <!-- Body -->
                    <div style="padding:30px; text-align:center;">
                        <h3 style="color:#333; margin-bottom:10px;">Verification Required</h3>
                        
                        <p style="color:#555; font-size:15px; line-height:1.6;">
                            Hello,<br><br>
                            We received a request to <strong>{email_subject}</strong>.  
                            Please use the One-Time Password (OTP) below to proceed.
                        </p>

                        <!-- OTP Box -->
                        <div style="margin:25px 0;">
                            <span style="
                                display:inline-block;
                                background:#f1f5f9;
                                color:#4f46e5;
                                padding:15px 25px;
                                font-size:28px;
                                letter-spacing:10px;
                                border-radius:8px;
                                font-weight:bold;
                            ">
                                {otp}
                            </span>
                        </div>

                        <p style="color:#777; font-size:14px;">
                            This OTP is valid for <strong>5 minutes</strong>.
                        </p>

                        <p style="color:#999; font-size:13px; margin-top:20px;">
                            If you did not request this, please ignore this email.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background:#f9fafb; padding:15px; text-align:center;">
                        <p style="color:#aaa; font-size:12px; margin:0;">
                            © {settings.DEFAULT_FROM_EMAIL} | House of Anbu  
                        </p>
                    </div>
                </div>
            </div>
            """

        message = Mail(
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=email,
            subject=subject,
            html_content=html_content
        )

        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        
      
        print(f"SendGrid Success: Status Code {response.status_code}")
        
    except Exception as e:
        print(f"SendGrid Error: {str(e)}")
        raise e