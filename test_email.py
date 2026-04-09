import smtplib

try:
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.set_debuglevel(1)
    server.starttls()
    server.login("reallifeleadershiptraining@gmail.com", "vqxpupraydogedex")
    print("Login successful!")
    server.quit()
except Exception as e:
    print(f"Error: {e}")
