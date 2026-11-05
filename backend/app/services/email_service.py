import smtplib
import socket
import ssl
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class _IPv4SMTP(smtplib.SMTP):
    """SMTP subclass that prefers IPv4 to avoid Docker IPv6 connection drops/timeouts."""

    def _get_socket(self, host, port, timeout):
        last_err = None
        for family in (socket.AF_INET, socket.AF_UNSPEC):
            try:
                addrs = socket.getaddrinfo(host, port, family, socket.SOCK_STREAM)
            except OSError as e:
                last_err = e
                continue
            for res in addrs:
                af, socktype, proto, canonname, sa = res
                sock = None
                try:
                    sock = socket.socket(af, socktype, proto)
                    if timeout is not None and timeout is not socket._GLOBAL_DEFAULT_TIMEOUT:
                        sock.settimeout(timeout)
                    if self.source_address:
                        sock.bind(self.source_address)
                    sock.connect(sa)
                    return sock
                except OSError as e:
                    last_err = e
                    if sock is not None:
                        sock.close()
        if last_err is not None:
            raise last_err
        raise OSError(f"Could not resolve {host}:{port}")


class _IPv4SMTP_SSL(smtplib.SMTP_SSL):
    """SMTP_SSL subclass that prefers IPv4 to avoid Docker IPv6 connection drops/timeouts."""

    def _get_socket(self, host, port, timeout):
        last_err = None
        for family in (socket.AF_INET, socket.AF_UNSPEC):
            try:
                addrs = socket.getaddrinfo(host, port, family, socket.SOCK_STREAM)
            except OSError as e:
                last_err = e
                continue
            for res in addrs:
                af, socktype, proto, canonname, sa = res
                sock = None
                try:
                    sock = socket.socket(af, socktype, proto)
                    if timeout is not None and timeout is not socket._GLOBAL_DEFAULT_TIMEOUT:
                        sock.settimeout(timeout)
                    if self.source_address:
                        sock.bind(self.source_address)
                    sock.connect(sa)
                    return self.context.wrap_socket(sock, server_hostname=self._host)
                except OSError as e:
                    last_err = e
                    if sock is not None:
                        sock.close()
        if last_err is not None:
            raise last_err
        raise OSError(f"Could not resolve {host}:{port}")


def _get_smtp_server():
    """Initializes and returns an SMTP connection with IPv4 preference, retries, and SSL fallback."""
    context = ssl.create_default_context()
    last_error = None

    for attempt in range(1, 4):
        try:
            if int(settings.SMTP_PORT) == 465:
                server = _IPv4SMTP_SSL(settings.SMTP_HOST, int(settings.SMTP_PORT), timeout=20, context=context)
                server.ehlo()
            else:
                server = _IPv4SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT), timeout=20)
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            return server
        except Exception as e:
            last_error = e
            logger.warning("SMTP connect attempt %d/3 on %s:%s failed: %s", attempt, settings.SMTP_HOST, settings.SMTP_PORT, e)
            time.sleep(0.8 * attempt)

    # Fallback to implicit SSL on port 465 if STARTTLS on port 587 was unexpectedly closed
    if int(settings.SMTP_PORT) != 465:
        try:
            server = _IPv4SMTP_SSL(settings.SMTP_HOST, 465, timeout=20, context=context)
            server.ehlo()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            logger.info("Connected to SMTP server via SSL fallback on port 465")
            return server
        except Exception as e:
            last_error = e
            logger.error("SMTP SSL fallback on port 465 failed: %s", e)

    logger.error("Failed to connect to SMTP server after retries: %s", last_error)
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

def _dispatch_mime_message(msg: MIMEMultipart, to_email: str, label: str) -> bool:
    """Send a prepared MIMEMultipart message with retry on connection drop."""
    for send_attempt in range(1, 3):
        server = _get_smtp_server()
        if not server:
            continue
        try:
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())
            try:
                server.quit()
            except Exception:
                pass
            logger.info("%s email sent to %s", label, to_email)
            return True
        except Exception as e:
            logger.warning("Attempt %d to send %s email to %s failed: %s", send_attempt, label, to_email, e)
            try:
                server.close()
            except Exception:
                pass
            time.sleep(0.5)
    logger.error("Failed to send %s email to %s", label, to_email)
    return False


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Send a password-reset email via generic SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Password Reset – Media Platform"
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email

    html_body = _build_reset_email_html(reset_url)
    msg.attach(MIMEText(html_body, "html"))

    return _dispatch_mime_message(msg, to_email, "Password-reset")


def send_admin_creation_email(to_email: str, name: str, password: str) -> bool:
    """Send a welcome email with credentials to a new Admin via generic SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Admin Account Created – Media Platform"
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email

    html_body = _build_admin_creation_email_html(name, password, to_email)
    msg.attach(MIMEText(html_body, "html"))

    return _dispatch_mime_message(msg, to_email, "Admin creation")

def _build_leader_creation_email_html(name: str, password: str, email: str) -> str:
    """Build a professional HTML email body for new Leader creation."""
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
              <p style="color:#b8c6d3;">Your new leader account has been successfully created.</p>
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

def send_leader_creation_email(to_email: str, name: str, password: str) -> bool:
    """Send a welcome email with credentials to a new Leader via generic SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Leader Account Created – Media Platform"
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email

    html_body = _build_leader_creation_email_html(name, password, to_email)
    msg.attach(MIMEText(html_body, "html"))

    return _dispatch_mime_message(msg, to_email, "Leader creation")

def _build_student_creation_email_html(name: str, enrollment: str, password: str, email: str) -> str:
    """Build a professional HTML email body for new Student creation."""
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
              <h2 style="color:#ffffff;">Welcome to the Platform, {name}!</h2>
              <p style="color:#b8c6d3;">Your student account has been officially registered.</p>
              <p style="color:#ffffff;"><strong>Email:</strong> {email}</p>
              <p style="color:#ffffff;"><strong>Enrollment Number:</strong> {enrollment}</p>
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

def send_student_activation_email(to_email: str, name: str, enrollment: str, password: str) -> bool:
    """Send student activation email via generic SMTP using stylized HTML."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Welcome - Your Student Account is Ready"
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email

    html_body = _build_student_creation_email_html(name, enrollment, password, to_email)
    msg.attach(MIMEText(html_body, "html"))

    return _dispatch_mime_message(msg, to_email, "Student activation")
