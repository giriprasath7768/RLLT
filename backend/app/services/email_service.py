import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def _get_smtp_server():
    """Initializes and returns an SMTP connection."""
    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        return server
    except Exception as e:
        logger.error(f"Failed to connect to SMTP server: {e}")
        return None

def _build_reset_email_html(reset_url: str) -> str:
    """Build a professional HTML email body for password reset."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;background-color:#0a1929;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a1929;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#0d2137;border-radius:16px;">
          <tr>
            <td style="padding:40px;text-align:center;">
              <h1 style="color:#cca673;">MEDIA PLATFORM</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#ffffff;">Password Reset</h2>
              <p style="color:#b8c6d3;">Click the button below to create a new password. Valid for 15 minutes.</p>
              <a href="{reset_url}" style="display:inline-block;padding:14px 40px;background-color:#cca673;font-weight:700;color:#0a1929;text-decoration:none;">RESET PASSWORD</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

def _build_admin_creation_email_html(name: str, password: str, email: str) -> str:
    """Build a professional HTML email body for new Admin creation."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;background-color:#0a1929;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a1929;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#0d2137;border-radius:16px;">
          <tr>
            <td style="padding:40px;text-align:center;">
              <h1 style="color:#cca673;">MEDIA PLATFORM</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#ffffff;">Welcome, {name}!</h2>
              <p style="color:#b8c6d3;">Your new administrator account has been successfully created.</p>
              <p style="color:#ffffff;"><strong>Email/Username:</strong> {email}</p>
              <p style="color:#ffffff;"><strong>Temporary Password:</strong> <span style="color:#cca673;font-size:16px;">{password}</span></p>
              <br>
              <a href="{settings.FRONTEND_URL}" style="display:inline-block;padding:14px 40px;background-color:#cca673;font-weight:700;color:#0a1929;text-decoration:none;">LOGIN TO PORTAL</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Send a password-reset email via generic SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Password Reset – Media Platform"
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email

    html_body = _build_reset_email_html(reset_url)
    msg.attach(MIMEText(html_body, "html"))

    try:
        server = _get_smtp_server()
        if server:
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())
            server.quit()
            logger.info("Password-reset email sent to %s", to_email)
            return True
        return False
    except Exception as e:
        logger.error("Failed to send reset email to %s: %s", to_email, str(e))
        return False


def send_admin_creation_email(to_email: str, name: str, password: str) -> bool:
    """Send a welcome email with credentials to a new Admin via generic SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Admin Account Created – Media Platform"
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email

    html_body = _build_admin_creation_email_html(name, password, to_email)
    msg.attach(MIMEText(html_body, "html"))

    try:
        server = _get_smtp_server()
        if server:
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())
            server.quit()
            logger.info("Admin creation email sent to %s", to_email)
            return True
        return False
    except Exception as e:
        logger.error("Failed to send admin creation email to %s: %s", to_email, str(e))
        return False

def send_leader_creation_email(to_email: str, name: str, password: str) -> bool:
    """Send a welcome email with credentials to a new Leader via generic SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Leader Account Created – Media Platform"
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email

    html_body = _build_admin_creation_email_html(name, password, to_email) # Reusing the clean HTML template
    msg.attach(MIMEText(html_body, "html"))

    try:
        server = _get_smtp_server()
        if server:
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())
            server.quit()
            logger.info("Leader creation email sent to %s", to_email)
            return True
        return False
    except Exception as e:
        logger.error("Failed to send leader creation email to %s: %s", to_email, str(e))
        return False

def send_student_activation_email(to_email: str, name: str, enrollment: str, password: str) -> bool:
    """Send student activation email via generic SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Conta Ativada - Bem-vindo à Plataforma"
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email

    text_body = f"Olá {name},\nSua conta foi ativada!\nMatrícula: {enrollment}\nSenha: {password}\nAcesse: {settings.FRONTEND_URL}"
    msg.attach(MIMEText(text_body, "plain"))

    try:
        server = _get_smtp_server()
        if server:
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())
            server.quit()
            return True
        return False
    except Exception as e:
        logger.error("Failed to send student email config: %s", str(e))
        return False
