import boto3
import logging
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_ses_client():
    """Create a boto3 SES client using configured AWS credentials."""
    return boto3.client(
        "ses",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def _build_reset_email_html(reset_url: str) -> str:
    """
    Build a professional HTML email body for password reset.
    Supports Portuguese UTF-8 characters.
    """
    return f"""\
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha</title>
</head>
<body style="margin:0;padding:0;background-color:#0a1929;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a1929;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
               style="background-color:#0d2137;border-radius:16px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 32px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#cca673;letter-spacing:2px;">
                MEDIA PLATFORM
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#ffffff;">
                Redefinição de Senha
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#b8c6d3;">
                Recebemos uma solicitação para redefinir a senha da sua conta.
                Se você não fez essa solicitação, por favor ignore este e-mail.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#b8c6d3;">
                Clique no botão abaixo para criar uma nova senha. Este link é válido por
                <strong style="color:#ffffff;">15 minutos</strong>.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td align="center"
                      style="background-color:#cca673;border-radius:8px;">
                    <a href="{reset_url}"
                       target="_blank"
                       style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:700;color:#0a1929;text-decoration:none;letter-spacing:1px;">
                      REDEFINIR SENHA
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#6b829e;">
                Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:
              </p>
              <p style="margin:8px 0 0;font-size:13px;word-break:break-all;color:#cca673;">
                {reset_url}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);">
              <p style="margin:0;font-size:12px;color:#4a6178;">
                © 2026 AppCreators. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """
    Send a password-reset email via Amazon SES.

    Returns True on success, False on failure (logged but never raised
    to the caller so the API always returns a safe generic message).
    """
    html_body = _build_reset_email_html(reset_url)
    text_body = (
        "Redefinição de Senha\n\n"
        "Recebemos uma solicitação para redefinir a senha da sua conta.\n"
        f"Acesse o link abaixo para criar uma nova senha (válido por 15 minutos):\n\n"
        f"{reset_url}\n\n"
        "Se você não solicitou essa alteração, ignore este e-mail.\n"
        "© 2026 AppCreators."
    )

    try:
        ses = _get_ses_client()
        ses.send_email(
            Source=settings.SES_SENDER_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {
                    "Data": "Redefinição de Senha – Media Platform",
                    "Charset": "UTF-8",
                },
                "Body": {
                    "Html": {"Data": html_body, "Charset": "UTF-8"},
                    "Text": {"Data": text_body, "Charset": "UTF-8"},
                },
            },
        )
        logger.info("Password-reset email sent to %s", to_email)
        return True
    except NoCredentialsError:
        logger.warning(
            "AWS credentials not configured – password-reset email to %s was NOT sent.",
            to_email,
        )
        return False
    except ClientError as exc:
        logger.error(
            "SES ClientError sending reset email to %s: %s",
            to_email,
            exc.response["Error"]["Message"],
        )
        return False
    except Exception:
        logger.exception("Unexpected error sending reset email to %s", to_email)
        return False
