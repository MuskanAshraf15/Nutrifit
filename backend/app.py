from flask import Flask, request, jsonify, render_template, session
from flask_jwt_extended import (JWTManager,create_access_token, jwt_required,get_jwt_identity, verify_jwt_in_request)
from werkzeug.security import generate_password_hash, check_password_hash
import random
import smtplib
from email.message import EmailMessage
import mysql.connector
from datetime import datetime, timedelta
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

jwt = JWTManager(app)

CORS(
    app,
    resources={
        r"/*": {"origins": [
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            ]
        }
    },
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


# Database Connection
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

# Home Page
@app.route("/")
def home():
    return render_template("index.html")


# REGISTER

@app.route("/register", methods=["POST"])
def register():

    data = request.get_json() or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    # CHECK REQUIRED FIELDS

    if not name or not email or not password:

        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    # CHECK PASSWORD LENGTH

    if len(password) < 6:

        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters"
        }), 400

    db = None
    cursor = None

    try:

        # DATABASE CONNECTION

        db = get_db_connection()

        cursor = db.cursor(dictionary=True)

        # CHECK EMAIL

        cursor.execute(
            """
            SELECT
                id,
                is_verified
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        existing_user = cursor.fetchone()

        # EMAIL ALREADY EXISTS

        if existing_user:

            # Already verified
            if existing_user["is_verified"]:

                return jsonify({
                    "success": False,
                    "message": "You are already registered with this email."
                }), 409

            # Registered but not verified
            else:

                return jsonify({
                    "success": False,
                    "message": "This email is already registered but not verified. Please use Resend OTP.",
                    "requires_verification": True,
                    "email": email
                }), 409

        # GENERATE 6 DIGIT OTP

        otp = str(
            random.randint(
                100000,
                999999
            )
        )

        otp_created_at = datetime.now()

        # HASH PASSWORD

        hashed_password = generate_password_hash(
            password
        )

        # INSERT USER

        cursor.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                password,
                is_verified,
                otp,
                otp_created_at
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                name,
                email,
                hashed_password,
                False,
                otp,
                otp_created_at
            )
        )

        db.commit()

        # SEND OTP EMAIL

        email_sent = send_otp_email(
            email,
            otp
        )

        # IF EMAIL FAILED
        # REMOVE USER

        if not email_sent:

            cursor.execute(
                """
                DELETE FROM users
                WHERE email = %s
                """,
                (email,)
            )

            db.commit()

            return jsonify({
                "success": False,
                "message": "Account could not be created because OTP email could not be sent."
            }), 500

        # REGISTRATION SUCCESS

        return jsonify({

            "success": True,

            "message":
                "Registration successful. OTP sent to your email.",

            "email": email,

            "otp_email_sent": True,

            "requires_verification": True

        }), 201

    except Exception as e:

        if db:
            db.rollback()

        print(
            "REGISTER ERROR:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Registration failed",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# SEND REGISTRATION OTP EMAIL

def send_otp_email(receiver_email, otp):

    try:

        msg = EmailMessage()

        msg["Subject"] = (
            "NutriFit Email Verification OTP"
        )

        msg["From"] = EMAIL_ADDRESS

        msg["To"] = receiver_email

        msg.set_content(
            f"""
Hello,

Welcome to NutriFit!

Your email verification OTP is:

{otp}

This OTP is valid for 59 seconds.

If you did not create a NutriFit account,
please ignore this email.

Regards,
NutriFit Team
"""
        )

        # GMAIL SMTP

        with smtplib.SMTP_SSL(
            "smtp.gmail.com",
            465
        ) as smtp:

            smtp.login(
                EMAIL_ADDRESS,
                EMAIL_PASSWORD
            )

            smtp.send_message(msg)

        return True

    except Exception as e:

        print(
            "SEND OTP EMAIL ERROR:",
            str(e)
        )

        return False


# RESEND OTP

@app.route("/resend_otp", methods=["POST"])
def resend_otp():

    db = None
    cursor = None

    try:

        data = request.get_json() or {}

        email = data.get("email")

        # CHECK EMAIL

        if not email:

            return jsonify({
                "success": False,
                "message": "Email is required."
            }), 400

        # DATABASE CONNECTION

        db = get_db_connection()

        cursor = db.cursor(dictionary=True)

        # FIND USER

        cursor.execute(
            """
            SELECT
                id,
                email,
                is_verified
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        # USER NOT FOUND

        if not user:

            return jsonify({
                "success": False,
                "message": "Email not found."
            }), 404

        # ALREADY VERIFIED

        if user["is_verified"]:

            return jsonify({
                "success": False,
                "message": "Email is already verified."
            }), 400

        # GENERATE NEW OTP

        new_otp = str(
            random.randint(
                100000,
                999999
            )
        )

        new_otp_created_at = datetime.now()

        # SEND NEW OTP EMAIL

        email_sent = send_otp_email(
            email,
            new_otp
        )

        if not email_sent:

            return jsonify({
                "success": False,
                "message": "OTP could not be sent. Please try again."
            }), 500

        # UPDATE OTP

        cursor.execute(
            """
            UPDATE users
            SET
                otp = %s,
                otp_created_at = %s
            WHERE id = %s
            """,
            (
                new_otp,
                new_otp_created_at,
                user["id"]
            )
        )

        db.commit()

        # SUCCESS

        return jsonify({

            "success": True,

            "message":
                "A new OTP has been sent to your email.",

            "email":
                email

        }), 200

    except Exception as e:

        if db:
            db.rollback()

        print(
            "RESEND OTP ERROR:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Could not resend OTP.",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# VERIFY EMAIL OTP

@app.route("/verify_otp", methods=["POST"])
def verify_otp():

    data = request.get_json() or {}

    email = data.get("email")
    otp = data.get("otp")

    # REQUIRED FIELDS

    if not email or not otp:

        return jsonify({

            "success": False,

            "message":
                "Email and OTP are required"

        }), 400

    db = None
    cursor = None

    try:

        # DATABASE CONNECTION

        db = get_db_connection()

        cursor = db.cursor(dictionary=True)

        # GET USER

        cursor.execute(
            """
            SELECT
                id,
                name,
                email,
                otp,
                otp_created_at,
                is_verified
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        # USER NOT FOUND

        if not user:

            return jsonify({

                "success": False,

                "message":
                    "User not found"

            }), 404

        # ALREADY VERIFIED

        if user["is_verified"]:

            return jsonify({

                "success": False,

                "message":
                    "Email already verified"

            }), 400

        # OTP NOT AVAILABLE

        if (
            not user["otp"]
            or
            not user["otp_created_at"]
        ):

            return jsonify({

                "success": False,

                "message":
                    "OTP is not available. Please resend OTP."

            }), 400

        # CHECK OTP EXPIRY
        # 59 SECONDS

        otp_age = (
            datetime.now()
            -
            user["otp_created_at"]
        ).total_seconds()

        if otp_age > 59:

            return jsonify({

                "success": False,

                "message":
                    "OTP has expired. Please resend OTP."

            }), 400

        # CHECK OTP

        if str(user["otp"]) != str(otp):

            return jsonify({

                "success": False,

                "message":
                    "Invalid OTP"

            }), 400

        # VERIFY USER

        cursor.execute(
            """
            UPDATE users
            SET
                is_verified = TRUE,
                otp = NULL,
                otp_created_at = NULL
            WHERE id = %s
            """,
            (user["id"],)
        )

        db.commit()

        # CREATE JWT TOKEN

        access_token = create_access_token(
            identity=str(user["id"])
        )

        # SAVE USER IN SESSION

        session["user_id"] = user["id"]

        # SUCCESS

        return jsonify({

            "success": True,

            "message":
                "Email verified successfully. Account created successfully.",

            "user": {

                "id":
                    user["id"],

                "name":
                    user["name"],

                "email":
                    user["email"]

            },

            "access_token":
                access_token,

            "token_type":
                "Bearer"

        }), 200

    except Exception as e:

        if db:
            db.rollback()

        print(
            "OTP VERIFICATION ERROR:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "OTP verification failed",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

# LOGIN
# EMAIL + PASSWORD

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    # Check email and password
    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Please enter your email and password."
        }), 400

    db = None
    cursor = None

    try:

        # Connect database
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # Find user by email
        cursor.execute("""
            SELECT id, name, email, password, is_verified
            FROM users
            WHERE email = %s
        """, (email,))

        user = cursor.fetchone()

        # Email not found
        if not user:
            return jsonify({
                "success": False,
                "message": "Email or password is incorrect."
            }), 401

        # Check password
        if not check_password_hash(
            user["password"],
            password
        ):
            return jsonify({
                "success": False,
                "message": "Email or password is incorrect."
            }), 401

        # Create JWT token
        token = create_access_token(
            identity=str(user["id"])
        )

        # Save user session
        session["user_id"] = user["id"]

        # Existing activity function
        user_joined(user["id"])

        # Login successful
        return jsonify({
            "success": True,
            "message": "Login successful!",
            "token": token,
            "token_type": "Bearer",
            "user_id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }), 200

    except Exception as e:

        print("LOGIN ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Something went wrong. Please try again."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

def user_joined(user_id):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO user_activity
        (user_id, status, joined_at, last_seen, left_at)
        VALUES (%s, 'online', NOW(), NOW(), NULL)
        ON DUPLICATE KEY UPDATE
        status = 'online',
        joined_at = NOW(),
        last_seen = NOW(),
        left_at = NULL
    """, (user_id,))

    db.commit()
    cursor.close()
    db.close()

# FORGOT PASSWORD
# SEND OTP + RESEND OTP + VERIFY OTP + RESET PASSWORD

@app.route("/forgot_password", methods=["POST"])
def forgot_password():

    data = request.get_json() or {}

    email = data.get("email")
    action = data.get("action")

    # CHECK EMAIL

    if not email:
        return jsonify({
            "success": False,
            "message": "Please enter your email."
        }), 400

    if not action:
        return jsonify({
            "success": False,
            "message": "Action is required."
        }), 400

    db = None
    cursor = None

    try:

        # DATABASE

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # FIND USER

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                is_verified,
                reset_otp,
                reset_otp_expiry
            FROM users
            WHERE email = %s
        """, (email,))

        user = cursor.fetchone()

        # EMAIL NOT FOUND

        if not user:
            return jsonify({
                "success": False,
                "message": "No account exists with this email."
            }), 404

        # ACTION 1: SEND OTP

        if action == "send_otp":

            otp = str(random.randint(100000, 999999))
        
            # OTP valid for 59 seconds
            expiry = datetime.now() + timedelta(seconds=59)

            # Create email
            msg = EmailMessage()

            msg["Subject"] = "NutriFit Password Reset OTP"
            msg["From"] = EMAIL_ADDRESS
            msg["To"] = email

            msg.set_content(f"""
Hello {user["name"]},

Your NutriFit password reset OTP is:

{otp}

This OTP is valid for 59 seconds.

If you did not request a password reset,
please ignore this email.

Regards,
NutriFit Team
""")

            # Send email
            try:

                with smtplib.SMTP_SSL(
                    "smtp.gmail.com",
                    465
                ) as smtp:

                    smtp.login(
                        EMAIL_ADDRESS,
                        EMAIL_PASSWORD
                    )

                    smtp.send_message(msg)

            except Exception as email_error:

                print(
                    "SEND OTP EMAIL ERROR:",
                    email_error
                )

                return jsonify({
                    "success": False,
                    "message": "Unable to send OTP. Please try again."
                }), 500

            # Save OTP
            cursor.execute("""
                UPDATE users
                SET
                    reset_otp = %s,
                    reset_otp_expiry = %s
                WHERE id = %s
            """, (
                otp,
                expiry,
                user["id"]
            ))

            db.commit()

            return jsonify({
                "success": True,
                "message": "OTP has been sent to your email.",
                "email": email,
                "next_step": "verify_otp"
            }), 200

        # ACTION 2: RESEND OTP
       

        elif action == "resend_otp":

            new_otp = str(
                random.randint(100000, 999999)
            )

            # New OTP valid for 5 minutes
            new_expiry = (
                datetime.now()
                +
                timedelta(seconds=59)
            )

            # Create email
            msg = EmailMessage()

            msg["Subject"] = "NutriFit New Password Reset OTP"
            msg["From"] = EMAIL_ADDRESS
            msg["To"] = email

            msg.set_content(f"""
Hello {user["name"]},

Here is your new NutriFit password reset OTP:

{new_otp}

This OTP is valid for 59 seconds.

Your previous OTP is no longer valid.

If you did not request a password reset,
please ignore this email.

Regards,
NutriFit Team
""")

            # Send new OTP
            try:

                with smtplib.SMTP_SSL(
                    "smtp.gmail.com",
                    465
                ) as smtp:

                    smtp.login(
                        EMAIL_ADDRESS,
                        EMAIL_PASSWORD
                    )

                    smtp.send_message(msg)

            except Exception as email_error:

                print(
                    "RESEND OTP EMAIL ERROR:",
                    email_error
                )

                return jsonify({
                    "success": False,
                    "message": "Unable to resend OTP. Please try again."
                }), 500

            # Replace old OTP with new OTP
            cursor.execute("""
                UPDATE users
                SET
                    reset_otp = %s,
                    reset_otp_expiry = %s
                WHERE id = %s
            """, (
                new_otp,
                new_expiry,
                user["id"]
            ))

            db.commit()

            return jsonify({
                "success": True,
                "message": "A new OTP has been sent to your email.",
                "email": email,
                "next_step": "verify_otp"
            }), 200

        
        # ACTION 3: VERIFY OTP + VERIFY EMAIL
        

        elif action == "verify_otp":

            otp = data.get("otp")

            if not otp:
                return jsonify({
                    "success": False,
                    "message": "Please enter the OTP."
                }), 400

            # Get latest OTP
            cursor.execute("""
                SELECT
                    id,
                    reset_otp,
                    reset_otp_expiry
                FROM users
                WHERE email = %s
            """, (email,))

            reset_user = cursor.fetchone()

            if not reset_user:
                return jsonify({
                    "success": False,
                    "message": "User not found."
                }), 404

            # OTP missing
            if not reset_user["reset_otp"]:
                return jsonify({
                    "success": False,
                    "message": "Please request a new OTP."
                }), 400

            # OTP expiry missing
            if not reset_user["reset_otp_expiry"]:
                return jsonify({
                    "success": False,
                    "message": "OTP has expired. Please request a new OTP."
                }), 400

            # Check expiry
            if datetime.now() > reset_user["reset_otp_expiry"]:
                return jsonify({
                    "success": False,
                    "message": "OTP has expired. Please resend OTP."
                }), 400

            # Check OTP
            if str(reset_user["reset_otp"]) != str(otp):
                return jsonify({
                    "success": False,
                    "message": "Invalid OTP. Please try again."
                }), 400

            # OTP CORRECT → VERIFY EMAIL

            cursor.execute("""
                UPDATE users
                SET
                    is_verified = TRUE
                WHERE id = %s
            """, (
                reset_user["id"],
            ))

            db.commit()

            return jsonify({
                "success": True,
                "message": "Email verified successfully.",
                "email_verified": True,
                "next_step": "reset_password"
            }), 200

        # ACTION 4: RESET PASSWORD

        elif action == "reset_password":

            otp = data.get("otp")
            new_password = data.get("new_password")
            confirm_password = data.get("confirm_password")

            # Check fields
            if not otp or not new_password or not confirm_password:
                return jsonify({
                    "success": False,
                    "message": "Please enter OTP, new password and confirm password."
                }), 400

            # Check passwords
            if new_password != confirm_password:
                return jsonify({
                    "success": False,
                    "message": "Passwords do not match."
                }), 400

            # Password length
            if len(new_password) < 6:
                return jsonify({
                    "success": False,
                    "message": "Password must be at least 6 characters."
                }), 400

            # Get latest OTP
            cursor.execute("""
                SELECT
                    id,
                    reset_otp,
                    reset_otp_expiry
                FROM users
                WHERE email = %s
            """, (email,))

            reset_user = cursor.fetchone()

            if not reset_user:
                return jsonify({
                    "success": False,
                    "message": "User not found."
                }), 404

            # OTP missing
            if not reset_user["reset_otp"]:
                return jsonify({
                    "success": False,
                    "message": "Please request a new OTP."
                }), 400

            # OTP incorrect
            if str(reset_user["reset_otp"]) != str(otp):
                return jsonify({
                    "success": False,
                    "message": "Invalid OTP."
                }), 400

            # OTP expired
            if (
                not reset_user["reset_otp_expiry"]
                or
                datetime.now() > reset_user["reset_otp_expiry"]
            ):
                return jsonify({
                    "success": False,
                    "message": "OTP has expired. Please resend OTP."
                }), 400

            # HASH NEW PASSWORD

            hashed_password = generate_password_hash(
                new_password
            )

            # UPDATE PASSWORD + CLEAR OTP

            cursor.execute("""
                UPDATE users
                SET
                    password = %s,
                    reset_otp = NULL,
                    reset_otp_expiry = NULL,
                    is_verified = TRUE
                WHERE id = %s
            """, (
                hashed_password,
                reset_user["id"]
            ))

            db.commit()

            return jsonify({
                "success": True,
                "message": "Password reset successfully. You can login now.",
                "email_verified": True,
                "next_step": "login"
            }), 200

        # INVALID ACTION

        else:

            return jsonify({
                "success": False,
                "message": "Invalid action."
            }), 400

    # ERROR

    except Exception as e:

        if db:
            db.rollback()

        print(
            "FORGOT PASSWORD ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Something went wrong. Please try again."
        }), 500

    # CLOSE DATABASE

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/forgot_password", methods=["POST"])
def admin_forgot_password():

    data = request.get_json() or {}

    email = data.get("email")
    action = data.get("action")

    # CHECK EMAIL

    if not email:
        return jsonify({
            "success": False,
            "message": "Please enter your email."
        }), 400

    if not action:
        return jsonify({
            "success": False,
            "message": "Action is required."
        }), 400

    db = None
    cursor = None

    try:

        # DATABASE

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # FIND ADMIN

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                reset_otp,
                reset_otp_expiry
            FROM admins
            WHERE email = %s
        """, (email,))

        admin = cursor.fetchone()

        # EMAIL NOT FOUND

        if not admin:
            return jsonify({
                "success": False,
                "message": "No admin account exists with this email."
            }), 404

        # ACTION 1: SEND OTP

        if action == "send_otp":

            otp = str(random.randint(100000, 999999))

            # OTP valid for 59 seconds
            expiry = datetime.now() + timedelta(seconds=59)

            # Create email
            msg = EmailMessage()

            msg["Subject"] = "NutriFit Admin Password Reset OTP"
            msg["From"] = EMAIL_ADDRESS
            msg["To"] = email

            msg.set_content(f"""
Hello {admin["name"]},

Your NutriFit Admin password reset OTP is:

{otp}

This OTP is valid for 59 seconds.

If you did not request a password reset,
please ignore this email.

Regards,
NutriFit Team
""")

            # Send email
            try:

                with smtplib.SMTP_SSL(
                    "smtp.gmail.com",
                    465
                ) as smtp:

                    smtp.login(
                        EMAIL_ADDRESS,
                        EMAIL_PASSWORD
                    )

                    smtp.send_message(msg)

            except Exception as email_error:

                print(
                    "ADMIN SEND OTP EMAIL ERROR:",
                    email_error
                )

                return jsonify({
                    "success": False,
                    "message": "Unable to send OTP. Please try again."
                }), 500

            # Save OTP
            cursor.execute("""
                UPDATE admins
                SET
                    reset_otp = %s,
                    reset_otp_expiry = %s
                WHERE id = %s
            """, (
                otp,
                expiry,
                admin["id"]
            ))

            db.commit()

            return jsonify({
                "success": True,
                "message": "OTP has been sent to your email.",
                "email": email,
                "next_step": "verify_otp"
            }), 200

        # ACTION 2: RESEND OTP

        elif action == "resend_otp":

            new_otp = str(
                random.randint(100000, 999999)
            )

            new_expiry = (
                datetime.now()
                +
                timedelta(seconds=59)
            )

            # Create email
            msg = EmailMessage()

            msg["Subject"] = "NutriFit New Admin Password Reset OTP"
            msg["From"] = EMAIL_ADDRESS
            msg["To"] = email

            msg.set_content(f"""
Hello {admin["name"]},

Here is your new NutriFit Admin password reset OTP:

{new_otp}

This OTP is valid for 59 seconds.

Your previous OTP is no longer valid.

If you did not request a password reset,
please ignore this email.

Regards,
NutriFit Team
""")

            # Send new OTP
            try:

                with smtplib.SMTP_SSL(
                    "smtp.gmail.com",
                    465
                ) as smtp:

                    smtp.login(
                        EMAIL_ADDRESS,
                        EMAIL_PASSWORD
                    )

                    smtp.send_message(msg)

            except Exception as email_error:

                print(
                    "ADMIN RESEND OTP EMAIL ERROR:",
                    email_error
                )

                return jsonify({
                    "success": False,
                    "message": "Unable to resend OTP. Please try again."
                }), 500

            # Replace old OTP
            cursor.execute("""
                UPDATE admins
                SET
                    reset_otp = %s,
                    reset_otp_expiry = %s
                WHERE id = %s
            """, (
                new_otp,
                new_expiry,
                admin["id"]
            ))

            db.commit()

            return jsonify({
                "success": True,
                "message": "A new OTP has been sent to your email.",
                "email": email,
                "next_step": "verify_otp"
            }), 200

        # ACTION 3: VERIFY OTP

        elif action == "verify_otp":

            otp = data.get("otp")

            if not otp:
                return jsonify({
                    "success": False,
                    "message": "Please enter the OTP."
                }), 400

            # Get latest OTP
            cursor.execute("""
                SELECT
                    id,
                    reset_otp,
                    reset_otp_expiry
                FROM admins
                WHERE email = %s
            """, (email,))

            reset_admin = cursor.fetchone()

            if not reset_admin:
                return jsonify({
                    "success": False,
                    "message": "Admin not found."
                }), 404

            # OTP missing
            if not reset_admin["reset_otp"]:
                return jsonify({
                    "success": False,
                    "message": "Please request a new OTP."
                }), 400

            # Expiry missing
            if not reset_admin["reset_otp_expiry"]:
                return jsonify({
                    "success": False,
                    "message": "OTP has expired. Please request a new OTP."
                }), 400

            # Check expiry
            if datetime.now() > reset_admin["reset_otp_expiry"]:
                return jsonify({
                    "success": False,
                    "message": "OTP has expired. Please resend OTP."
                }), 400

            # Check OTP
            if str(reset_admin["reset_otp"]) != str(otp):
                return jsonify({
                    "success": False,
                    "message": "Invalid OTP. Please try again."
                }), 400

            return jsonify({
                "success": True,
                "message": "OTP verified successfully.",
                "email_verified": True,
                "next_step": "reset_password"
            }), 200

        # ACTION 4: RESET PASSWORD

        elif action == "reset_password":

            otp = data.get("otp")
            new_password = data.get("new_password")
            confirm_password = data.get("confirm_password")

            # Check fields
            if not otp or not new_password or not confirm_password:
                return jsonify({
                    "success": False,
                    "message": "Please enter OTP, new password and confirm password."
                }), 400

            # Check passwords
            if new_password != confirm_password:
                return jsonify({
                    "success": False,
                    "message": "Passwords do not match."
                }), 400

            # Password length
            if len(new_password) < 6:
                return jsonify({
                    "success": False,
                    "message": "Password must be at least 6 characters."
                }), 400

            # Get latest OTP
            cursor.execute("""
                SELECT
                    id,
                    reset_otp,
                    reset_otp_expiry
                FROM admins
                WHERE email = %s
            """, (email,))

            reset_admin = cursor.fetchone()

            if not reset_admin:
                return jsonify({
                    "success": False,
                    "message": "Admin not found."
                }), 404

            # OTP missing
            if not reset_admin["reset_otp"]:
                return jsonify({
                    "success": False,
                    "message": "Please request a new OTP."
                }), 400

            # OTP incorrect
            if str(reset_admin["reset_otp"]) != str(otp):
                return jsonify({
                    "success": False,
                    "message": "Invalid OTP."
                }), 400

            # OTP expired
            if (
                not reset_admin["reset_otp_expiry"]
                or
                datetime.now() > reset_admin["reset_otp_expiry"]
            ):
                return jsonify({
                    "success": False,
                    "message": "OTP has expired. Please resend OTP."
                }), 400

            # HASH NEW PASSWORD

            hashed_password = generate_password_hash(
                new_password
            )

            # UPDATE PASSWORD + CLEAR OTP

            cursor.execute("""
                UPDATE admins
                SET
                    password = %s,
                    reset_otp = NULL,
                    reset_otp_expiry = NULL
                WHERE id = %s
            """, (
                hashed_password,
                reset_admin["id"]
            ))

            db.commit()

            return jsonify({
                "success": True,
                "message": "Admin password reset successfully. You can login now.",
                "email_verified": True,
                "next_step": "login"
            }), 200

        # INVALID ACTION

        else:

            return jsonify({
                "success": False,
                "message": "Invalid action."
            }), 400

    # ERROR

    except Exception as e:

        if db:
            db.rollback()

        print(
            "ADMIN FORGOT PASSWORD ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Something went wrong. Please try again."
        }), 500

    # CLOSE DATABASE

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()
# ADMIN LOGIN

@app.route("/admin/login", methods=["POST"])
def admin_login():

    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                password
            FROM admins
            WHERE email = %s
        """, (email,))

        admin = cursor.fetchone()

        if not admin:

            return jsonify({
                "success": False,
                "message": "Invalid admin email or password"
            }), 401

        # Check password
        if not check_password_hash(
            admin["password"],
            password
        ):

            return jsonify({
                "success": False,
                "message": "Invalid admin email or password"
            }), 401

        # Save admin session
        session["admin_id"] = admin["id"]
        session["admin_name"] = admin["name"]
        session["admin_email"] = admin["email"]

        # Create JWT token
        access_token = create_access_token(
            identity=str(admin["id"])
        )

        return jsonify({

            "success": True,

            "message": "Admin login successful",

            "access_token": access_token,

            "token_type": "Bearer",

            "admin": {
                "id": admin["id"],
                "name": admin["name"],
                "email": admin["email"]
            }

        }), 200

    except Exception as e:

        print("ADMIN LOGIN ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Admin login failed"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/register", methods=["POST"])
def admin_register():

    data = request.get_json() or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    # CHECK REQUIRED FIELDS
    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    # PASSWORD LENGTH
    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters"
        }), 400

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        # CHECK IF ANY ADMIN ALREADY EXISTS
        cursor.execute("""
            SELECT id
            FROM admins
            LIMIT 1
        """)

        existing_admin = cursor.fetchone()

        if existing_admin:
            return jsonify({
                "success": False,
                "message": "Admin registration is already completed. Please login."
            }), 403

        # CHECK EMAIL
        cursor.execute("""
            SELECT id
            FROM admins
            WHERE email = %s
        """, (email,))

        existing_email = cursor.fetchone()

        if existing_email:
            return jsonify({
                "success": False,
                "message": "This admin email already exists."
            }), 409

        # HASH PASSWORD
        hashed_password = generate_password_hash(password)

        # CREATE FIRST ADMIN
        # ID WILL BE CREATED AUTOMATICALLY
        cursor.execute("""
            INSERT INTO admins
            (name, email, password)
            VALUES (%s, %s, %s)
        """, (
            name,
            email,
            hashed_password
        ))

        db.commit()

        # Get automatically generated admin ID
        admin_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "First admin registered successfully",
            "admin": {
                "id": admin_id,
                "name": name,
                "email": email
            }
        }), 201

    except Exception as e:

        if db:
            db.rollback()

        print("Admin registration error:", e)

        return jsonify({
            "success": False,
            "message": "Could not register admin"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# CREATE ADMIN

@app.route("/create_admin", methods=["POST"])
def create_admin():

    # ADMIN CHECK - ONLY LOGGED-IN ADMIN CAN CREATE ADMIN
    admin_check = admin_required()

    if admin_check:
        return admin_check

    data = request.get_json() or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:

        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    if len(password) < 6:

        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters"
        }), 400

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        # Hash password
        hashed_password = generate_password_hash(password)

        cursor.execute("""
            INSERT INTO admins
            (name, email, password)
            VALUES (%s, %s, %s)
        """, (
            name,
            email,
            hashed_password
        ))

        db.commit()

        return jsonify({
            "success": True,
            "message": "Admin created successfully"
        }), 201

    except Exception as e:

        if db:
            db.rollback()

        return jsonify({
            "success": False,
            "message": "Could not create admin",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():

    user_id = get_jwt_identity()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Invalid or missing token"
        }), 401

    user_left(int(user_id))

    return jsonify({
        "success": True,
        "message": "Logout successful"
    })


def user_left(user_id):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE user_activity
        SET status = 'offline',
            left_at = NOW()
        WHERE user_id = %s
    """, (user_id,))

    db.commit()
    cursor.close()
    db.close()

@app.route("/delete_account", methods=["DELETE"])
@jwt_required()
def delete_account():

    user_id = get_jwt_identity()

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Invalid or missing token"
        }), 401

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        # 1. Delete feedback analysis
        cursor.execute("""
            DELETE FROM feedback_analysis
            WHERE user_id = %s
        """, (user_id,))

        # 2. Delete feedback
        cursor.execute("""
            DELETE FROM feedback
            WHERE user_id = %s
        """, (user_id,))

        # 3. Delete contact messages
        cursor.execute("""
            DELETE FROM contact_messages
            WHERE user_id = %s
        """, (user_id,))

        # 4. Delete user progress
        cursor.execute("""
            DELETE FROM user_progress
            WHERE user_id = %s
        """, (user_id,))

        # 5. Delete old progress table records
        cursor.execute("""
            DELETE FROM progress
            WHERE user_id = %s
        """, (user_id,))

        # 6. Delete calorie results
        cursor.execute("""
            DELETE FROM calorie_result
            WHERE user_id = %s
        """, (user_id,))

        # 7. Delete user activity
        cursor.execute("""
            DELETE FROM user_activity
            WHERE user_id = %s
        """, (user_id,))

        # 8. Delete user profile
        cursor.execute("""
            DELETE FROM user_profile
            WHERE user_id = %s
        """, (user_id,))

        # 9. Finally delete user account
        cursor.execute("""
            DELETE FROM users
            WHERE id = %s
        """, (user_id,))

        # Save all changes
        db.commit()

        return jsonify({
            "success": True,
            "message": "Account and all user data deleted permanently"
        }), 200

    except Exception as e:

        if db:
            db.rollback()

        return jsonify({
            "success": False,
            "message": "Account deletion failed",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

def update_last_seen(user_id):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE user_activity
        SET last_seen = NOW(),
            status = 'online'
        WHERE user_id = %s
    """, (user_id,))

    db.commit()
    cursor.close()
    db.close()     
@app.route("/ping", methods=["POST"])
@jwt_required()
def ping():

    user_id = get_jwt_identity()

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Invalid or missing token"
        }), 401

    try:

        update_last_seen(user_id)

        return jsonify({
            "success": True,
            "message": "User activity updated"
        }), 200

    except Exception as e:

        print("PING ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": "Could not update activity",
            "error": str(e)
        }), 500
# ADMIN LOGIN CHECK

def admin_required():

    try:

        # Check JWT token
        verify_jwt_in_request()

        admin_id = get_jwt_identity()

        if not admin_id:
            return jsonify({
                "success": False,
                "message": "Admin login required"
            }), 401

        # Check that this ID actually belongs to an admin
        db = None
        cursor = None

        try:

            db = get_db_connection()
            cursor = db.cursor(dictionary=True)

            cursor.execute("""
                SELECT id
                FROM admins
                WHERE id = %s
            """, (admin_id,))

            admin = cursor.fetchone()

            if not admin:

                return jsonify({
                    "success": False,
                    "message": "Invalid admin account"
                }), 403

        finally:

            if cursor:
                cursor.close()

            if db:
                db.close()

        # JWT is valid and admin exists
        return None

    except Exception as e:

        print("ADMIN AUTH ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Admin authentication required"
        }), 401
# ADMIN USER STATISTICS

@app.route('/admin/user_stats', methods=['GET'])
def user_stats():

    # ADMIN CHECK

    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # TOTAL USERS

        cursor.execute("""
            SELECT COUNT(*) AS total_users
            FROM users
        """)

        total_users = cursor.fetchone()["total_users"]

        # ACTIVE USERS

        cursor.execute("""
            SELECT COUNT(*) AS active_users
            FROM user_activity
            WHERE status = 'online'
              AND last_seen >= NOW() - INTERVAL 2 MINUTE
        """)

        active_users = cursor.fetchone()["active_users"]

        # ONLINE USER LIST

        cursor.execute("""
            SELECT
                u.id AS user_id,
                u.name,
                u.email,
                a.status,
                a.joined_at,
                a.last_seen,
                a.left_at
            FROM users u
            LEFT JOIN user_activity a
                ON u.id = a.user_id
            WHERE a.status = 'online'
              AND a.last_seen >= NOW() - INTERVAL 2 MINUTE
            ORDER BY a.last_seen DESC
        """)

        users = cursor.fetchall()

        return jsonify({

            "success": True,

            "total_users": total_users,

            "active_users": active_users,

            "users": users

        }), 200

    except Exception as e:

        print("ADMIN USER STATS ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Could not load user statistics.",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

# CHECK GOAL WITH BMI

def check_goal(category, goal):

    # Underweight + Weight Loss
    if category == "Underweight" and goal == "Weight Loss":

        return {
            "mismatch": True,
            "message": "Your BMI is Underweight, but your goal is Weight Loss.",
            "suggestion": "Please review your goal. Weight Gain or Weight Maintain may be more suitable."
        }

    # Overweight/Obese + Weight Gain
    if category in ["Overweight", "Obese"] and goal == "Weight Gain":

        return {
            "mismatch": True,
            "message": "Your BMI is above the Normal range, but your goal is Weight Gain.",
            "suggestion": "Please review your selected goal."
        }

    # Compatible
    return {
        "mismatch": False,
        "message": "Your selected goal is compatible with your BMI.",
        "suggestion": "Continue with your selected goal and monitor your progress."
    }


# SAVE PROFILE

@app.route("/save_profile", methods=["POST"])
@jwt_required()
def save_profile():

    db = None
    cursor = None

    try:
        # GET USER ID FROM JWT
        user_id = get_jwt_identity()

        if not user_id:
            return jsonify({
                "success": False,
                "message": "Invalid or missing token."
            }), 401

        # GET DATA
        data = request.get_json() or {}

        age = data.get("age")
        gender = data.get("gender")
        weight = data.get("weight")
        height = data.get("height")
        activity_level = data.get("activity_level")
        goal = data.get("goal")
        food_preference = data.get("food_preference")
        budget_level = data.get("budget_level")

        # REQUIRED FIELDS CHECK
        if any(value is None or value == "" for value in [
            age,
            gender,
            weight,
            height,
            activity_level,
            goal,
            food_preference,
            budget_level
        ]):
            return jsonify({
                "success": False,
                "message": "All profile fields are required."
            }), 400

        # CONVERT NUMBERS
        try:
            age = int(age)
            weight = float(weight)
            height = float(height)

        except (ValueError, TypeError):

            return jsonify({
                "success": False,
                "message": "Age, weight and height must be valid numbers."
            }), 400

        # VALIDATION
        if age < 10 or age > 100:
            return jsonify({
                "success": False,
                "message": "Age must be between 10 and 100."
            }), 400

        if weight < 20 or weight > 300:
            return jsonify({
                "success": False,
                "message": "Weight must be between 20 and 300 kg."
            }), 400

        if height < 100 or height > 250:
            return jsonify({
                "success": False,
                "message": "Height must be between 100 and 250 cm."
            }), 400

        if gender not in ["Male", "Female"]:
            return jsonify({
                "success": False,
                "message": "Invalid gender."
            }), 400

        if activity_level not in [
            "Sedentary",
            "Moderate",
            "Active",
            "Very Active"
        ]:
            return jsonify({
                "success": False,
                "message": "Invalid activity level."
            }), 400

        if goal not in [
            "Weight Loss",
            "Weight Gain",
            "Weight Maintain"
        ]:
            return jsonify({
                "success": False,
                "message": "Invalid goal."
            }), 400

        if food_preference not in [
            "Vegetarian",
            "Non Vegetarian",
            "Both"
        ]:
            return jsonify({
                "success": False,
                "message": "Invalid food preference."
            }), 400

        if budget_level not in [
            "Low",
            "Medium",
            "High"
        ]:
            return jsonify({
                "success": False,
                "message": "Invalid budget level."
            }), 400

        # CALCULATE BMI
        bmi, category = calculate_bmi(weight, height)

        # CHECK GOAL
        goal_result = check_goal(category, goal)

        # DATABASE CONNECTION
        db = get_db_connection()
        cursor = db.cursor()

        # CHECK IF PROFILE ALREADY EXISTS
        cursor.execute(
            """
            SELECT id
            FROM user_profile
            WHERE user_id = %s
            LIMIT 1
            """,
            (user_id,)
        )

        existing_profile = cursor.fetchone()

        # UPDATE EXISTING PROFILE
        if existing_profile:

            update_query = """
                UPDATE user_profile
                SET
                    age = %s,
                    gender = %s,
                    weight = %s,
                    height = %s,
                    activity_level = %s,
                    goal = %s,
                    food_preference = %s,
                    budget_level = %s,
                    bmi = %s,
                    bmi_category = %s
                WHERE user_id = %s
            """

            cursor.execute(
                update_query,
                (
                    age,
                    gender,
                    weight,
                    height,
                    activity_level,
                    goal,
                    food_preference,
                    budget_level,
                    bmi,
                    category,
                    user_id
                )
            )

            message = "Profile updated successfully."

        # INSERT NEW PROFILE
        else:

            insert_query = """
                INSERT INTO user_profile
                (
                    user_id,
                    age,
                    gender,
                    weight,
                    height,
                    activity_level,
                    goal,
                    food_preference,
                    budget_level,
                    bmi,
                    bmi_category
                )
                VALUES
                (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                )
            """

            cursor.execute(
                insert_query,
                (
                    user_id,
                    age,
                    gender,
                    weight,
                    height,
                    activity_level,
                    goal,
                    food_preference,
                    budget_level,
                    bmi,
                    category
                )
            )

            message = "Profile saved successfully."

        # COMMIT
        db.commit()

        # RESPONSE
        return jsonify({

            "success": True,

            "message": message,

            "user_id": user_id,

            "profile": {
                "age": age,
                "gender": gender,
                "weight": weight,
                "height": height,
                "activity_level": activity_level,
                "goal": goal,
                "food_preference": food_preference,
                "budget_level": budget_level
            },

            "bmi": bmi,

            "bmi_category": category,

            "goal": goal,

            "goal_mismatch": goal_result.get(
                "mismatch",
                False
            ),

            "bmi_message": goal_result.get(
                "message",
                ""
            ),

            "suggestion": goal_result.get(
                "suggestion",
                ""
            )

        }), 200

    # ERROR HANDLING
    except Exception as e:

        if db:
            db.rollback()

        print("Save Profile Error:", str(e))

        return jsonify({

            "success": False,

            "message": "Profile could not be saved.",

            "error": str(e)

        }), 500

    # CLOSE DATABASE
    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/update_profile", methods=["PUT"])
@jwt_required()
def update_profile():

    db = None
    cursor = None

    # GET USER ID FROM JWT TOKEN
    user_id = get_jwt_identity()

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Invalid or missing token"
        }), 401

    # GET DATA
    data = request.get_json() or {}

    age = data.get("age")
    gender = data.get("gender")
    weight = data.get("weight")
    height = data.get("height")
    activity_level = data.get("activity_level")
    goal = data.get("goal")
    food_preference = data.get("food_preference")
    budget_level = data.get("budget_level")

    # REQUIRED FIELDS
    if any(value is None or value == "" for value in [
        age,
        gender,
        weight,
        height,
        activity_level,
        goal,
        food_preference,
        budget_level
    ]):
        return jsonify({
            "success": False,
            "message": "All profile fields are required"
        }), 400

    # CONVERT NUMBERS
    try:
        age = int(age)
        weight = float(weight)
        height = float(height)

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Age, weight and height must be valid numbers"
        }), 400

    # VALIDATION
    if age < 10 or age > 100:
        return jsonify({
            "success": False,
            "message": "Age must be between 10 and 100"
        }), 400

    if weight < 20 or weight > 300:
        return jsonify({
            "success": False,
            "message": "Weight must be between 20 and 300 kg"
        }), 400

    if height < 100 or height > 250:
        return jsonify({
            "success": False,
            "message": "Height must be between 100 and 250 cm"
        }), 400

    if gender not in ["Male", "Female"]:
        return jsonify({
            "success": False,
            "message": "Invalid gender"
        }), 400

    if activity_level not in [
        "Sedentary",
        "Moderate",
        "Active",
        "Very Active"
    ]:
        return jsonify({
            "success": False,
            "message": "Invalid activity level"
        }), 400

    if goal not in [
        "Weight Loss",
        "Weight Gain",
        "Weight Maintain"
    ]:
        return jsonify({
            "success": False,
            "message": "Invalid goal"
        }), 400

    if food_preference not in [
        "Vegetarian",
        "Non Vegetarian",
        "Both"
    ]:
        return jsonify({
            "success": False,
            "message": "Invalid food preference"
        }), 400

    if budget_level not in [
        "Low",
        "Medium",
        "High"
    ]:
        return jsonify({
            "success": False,
            "message": "Invalid budget level"
        }), 400

    # CALCULATE BMI AND CATEGORY
    bmi, bmi_category = calculate_bmi(weight, height)

    # DATABASE CONNECTION
    try:

        db = get_db_connection()
        cursor = db.cursor()

        # CHECK PROFILE EXISTS
        cursor.execute(
            """
            SELECT id
            FROM user_profile
            WHERE user_id = %s
            LIMIT 1
            """,
            (user_id,)
        )

        existing_profile = cursor.fetchone()

        # PROFILE NOT FOUND
        if not existing_profile:

            return jsonify({
                "success": False,
                "message": "Profile not found. Please save your profile first."
            }), 404

        # UPDATE PROFILE
        query = """
            UPDATE user_profile
            SET
                age = %s,
                gender = %s,
                weight = %s,
                height = %s,
                activity_level = %s,
                goal = %s,
                food_preference = %s,
                budget_level = %s,
                bmi = %s,
                bmi_category = %s
            WHERE user_id = %s
        """

        values = (
            age,
            gender,
            weight,
            height,
            activity_level,
            goal,
            food_preference,
            budget_level,
            bmi,
            bmi_category,
            user_id
        )

        cursor.execute(query, values)

        # rowcount check intentionally not used
        # because MySQL can return 0 if values are unchanged.

        db.commit()

        # SUCCESS RESPONSE
        return jsonify({

            "success": True,

            "message": "Profile updated successfully",

            "user_id": user_id,

            "profile": {

                "age": age,

                "gender": gender,

                "weight": weight,

                "height": height,

                "activity_level": activity_level,

                "goal": goal,

                "food_preference": food_preference,

                "budget_level": budget_level,

                "bmi": bmi,

                "bmi_category": bmi_category
            }

        }), 200

    # ERROR
    except Exception as e:

        if db:
            db.rollback()

        print("Update Profile Error:", str(e))

        return jsonify({
            "success": False,
            "message": "Profile update failed",
            "error": str(e)
        }), 500

    # CLOSE DATABASE
    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()
    
# COMMON CALORIE / BMI HELPERS

def calculate_bmr(age, gender, weight, height):
    """
    Calculate BMR using Mifflin-St Jeor formula.
    """

    gender = str(gender).strip().lower()

    if gender == "male":

        bmr = (
            (10 * weight)
            + (6.25 * height)
            - (5 * age)
            + 5
        )

    elif gender == "female":

        bmr = (
            (10 * weight)
            + (6.25 * height)
            - (5 * age)
            - 161
        )

    else:
        raise ValueError("Invalid gender")

    return round(bmr, 2)


def get_activity_factor(activity_level):
    """
    Return activity multiplier.
    """

    activity_map = {
        "sedentary": 1.20,
        "moderate": 1.375,
        "active": 1.55,
        "very active": 1.725
    }

    activity = (
        str(activity_level)
        .strip()
        .lower()
        .replace("_", " ")
    )

    if activity not in activity_map:
        raise ValueError("Invalid activity level")

    return activity_map[activity]


def calculate_maintenance_calories(
    bmr,
    activity_level
):
    """
    Calculate maintenance calories.
    """

    factor = get_activity_factor(
        activity_level
    )

    return round(
        bmr * factor
    )


def calculate_daily_calories(
    maintenance_calories,
    goal
):
    """
    Calculate calories according to goal.
    """

    goal = (
        str(goal)
        .strip()
        .lower()
        .replace("_", " ")
    )

    if goal == "weight loss":

        calories = (
            maintenance_calories - 500
        )

    elif goal == "weight gain":

        calories = (
            maintenance_calories + 500
        )

    elif goal == "weight maintain":

        calories = maintenance_calories

    else:

        raise ValueError(
            "Invalid goal"
        )

    # Safety limits
    calories = max(
        1200,
        min(calories, 5000)
    )

    return round(calories)


def calculate_bmi(
    weight,
    height
):
    """
    Calculate BMI and category.
    """

    bmi = weight / (
        (height / 100) ** 2
    )

    bmi = round(
        bmi,
        2
    )

    if bmi < 18.5:

        category = "Underweight"

    elif bmi < 25:

        category = "Normal"

    elif bmi < 30:

        category = "Overweight"

    else:

        category = "Obese"

    return bmi, category


def normalize_goal(goal):
    """
    Normalize user/dataset goal values.

    Supports:
    Weight Loss
    Weight Gain
    Weight Maintain

    Also supports dataset values such as:
    Loss, Gain, Maintain, Maintenance, etc.
    """

    value = (
        str(goal or "")
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )

    # Remove extra spaces
    value = " ".join(value.split())

    goal_map = {

        # WEIGHT LOSS

        "weight loss":
            "Weight Loss",

        "loss":
            "Weight Loss",

        "lose weight":
            "Weight Loss",

        "weightloss":
            "Weight Loss",

        "lose":
            "Weight Loss",

        # WEIGHT GAIN

        "weight gain":
            "Weight Gain",

        "gain":
            "Weight Gain",

        "gain weight":
            "Weight Gain",

        "weightgain":
            "Weight Gain",

        # WEIGHT MAINTAIN

        "weight maintain":
            "Weight Maintain",

        "weight maintenance":
            "Weight Maintain",

        "maintain":
            "Weight Maintain",

        "maintenance":
            "Weight Maintain",

        "maintain weight":
            "Weight Maintain",

        "weightmaintain":
            "Weight Maintain",

        "weight maintenance":
            "Weight Maintain"
    }

    return goal_map.get(
        value,
        None
    )

def normalize_activity(activity):
    """
    Normalize user/dataset activity values.
    """

    value = (
        str(activity or "")
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )

    value = " ".join(value.split())

    activity_map = {

        "sedentary":
            "Sedentary",

        "moderate":
            "Moderate",

        "active":
            "Active",

        "very active":
            "Very Active",

        "veryactive":
            "Very Active"
    }

    return activity_map.get(
        value,
        None
    )

# CALCULATE CALORIES

@app.route(
    "/calculate_calories",
    methods=["POST"]
)
@jwt_required()
def calculate_calories():

    db = None
    cursor = None

    try:

        # GET USER ID FROM JWT

        user_id = get_jwt_identity()

        if not user_id:

            return jsonify({

                "success": False,

                "message":
                    "Invalid or missing token"

            }), 401

        # DATABASE

        db = get_db_connection()

        cursor = db.cursor()

        # GET PROFILE

        cursor.execute("""
            SELECT
                age,
                gender,
                weight,
                height,
                activity_level,
                goal,
                food_preference,
                budget_level
            FROM user_profile
            WHERE user_id = %s
            ORDER BY id DESC
            LIMIT 1
        """, (user_id,))

        profile = cursor.fetchone()

        if profile is None:

            return jsonify({

                "success": False,

                "message":
                    "Please save your profile first"

            }), 404

        # PROFILE DATA

        age = float(profile[0])

        gender = str(
            profile[1]
        ).strip()

        weight = float(
            profile[2]
        )

        height = float(
            profile[3]
        )

        activity_level = str(
            profile[4]
        ).strip()

        goal = str(
            profile[5]
        ).strip()

        food_preference = str(
            profile[6]
        ).strip()

        budget_level = str(
            profile[7]
        ).strip()

        # VALIDATION

        if age < 10 or age > 100:

            return jsonify({

                "success": False,

                "message":
                    "Age must be between 10 and 100"

            }), 400

        if weight < 20 or weight > 300:

            return jsonify({

                "success": False,

                "message":
                    "Weight must be between 20 and 300 kg"

            }), 400

        if height < 100 or height > 250:

            return jsonify({

                "success": False,

                "message":
                    "Height must be between 100 and 250 cm"

            }), 400

        # BMI CALCULATION

        height_m = height / 100

        bmi = weight / (height_m * height_m)

        bmi = round(bmi, 2)

        # BMI CATEGORY

        if bmi < 18.5:

            category = "Underweight"

        elif bmi < 25:

            category = "Normal"

        elif bmi < 30:

            category = "Overweight"

        else:

            category = "Obese"

        # GOAL COMPATIBILITY CHECK

        goal_check = check_goal(
            category,
            goal
        )

        # COMMON CALCULATIONS

        bmr = calculate_bmr(
            age,
            gender,
            weight,
            height
        )

        maintenance = calculate_maintenance_calories(
            bmr,
            activity_level
        )

        daily_calories = calculate_daily_calories(
            maintenance,
            goal
        )

        # SAVE RESULT

        cursor.execute("""
            INSERT INTO calorie_result
            (
                user_id,
                daily_calories
            )
            VALUES
            (
                %s,
                %s
            )
        """, (
            user_id,
            daily_calories
        ))

        db.commit()

        # RESPONSE

        return jsonify({

            "success": True,

            "message":
                "Calories Calculated Successfully",

            "user_id":
                user_id,

            # BMI
            "bmi":
                bmi,

            # BMI CATEGORY
            "category":
                category,

            # BMR
            "bmr":
                bmr,

            # MAINTENANCE CALORIES
            "maintenance_calories":
                maintenance,

            # RECOMMENDED DAILY CALORIES
            "daily_calories":
                daily_calories,

            "activity_level":
                activity_level,

            "goal":
                goal,

            "food_preference":
                food_preference,

            "budget_level":
                budget_level,

            # GOAL COMPATIBILITY
            "goal_check":
                goal_check

        }), 200

    # VALUE ERROR

    except ValueError as e:

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 400

    # GENERAL ERROR

    except Exception as e:

        if db:
            db.rollback()

        print(
            "Calorie Calculation Error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Calorie calculation failed",

            "error":
                str(e)

        }), 500

    # CLOSE DATABASE

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

# FOOD RECOMMENDATION
# ONE FOOD AT A TIME + CHANGE RECOMMENDATION

@app.route("/recommend_food", methods=["GET"])
@jwt_required()
def recommend_food():

    db = None
    cursor = None

    try:

        # USER ID FROM JWT

        user_id = get_jwt_identity()

        if not user_id:

            return jsonify({
                "success": False,
                "message": "Invalid or missing token"
            }), 401

        # MEAL TYPE

        meal_type = request.args.get(
            "meal",
            "Breakfast"
        ).strip()

        meal_map = {

            "breakfast": "Breakfast",
            "lunch": "Lunch",
            "dinner": "Dinner"

        }

        meal_type = meal_map.get(
            meal_type.lower()
        )

        if not meal_type:

            return jsonify({
                "success": False,
                "message":
                    "Meal must be Breakfast, Lunch or Dinner"
            }), 400

        # DATABASE

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )

        # RECOMMENDATION HISTORY

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS recommendation_history (

                id INT AUTO_INCREMENT PRIMARY KEY,

                user_id INT NOT NULL,

                meal_type VARCHAR(20) NOT NULL,

                food_id INT NOT NULL,

                shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                UNIQUE KEY unique_user_meal_food
                (
                    user_id,
                    meal_type,
                    food_id
                ),

                INDEX idx_user_meal
                (
                    user_id,
                    meal_type
                )

            )
        """)

        db.commit()

        # USER PROFILE

        cursor.execute("""
            SELECT

                age,
                gender,
                weight,
                height,
                activity_level,
                goal,
                food_preference,
                budget_level

            FROM user_profile

            WHERE user_id = %s

            ORDER BY id DESC

            LIMIT 1

        """, (user_id,))

        user = cursor.fetchone()

        if not user:

            return jsonify({
                "success": False,
                "message":
                    "Please complete your profile first."
            }), 404

        # USER VALUES

        try:

            age = float(
                user.get("age") or 0
            )

            weight = float(
                user.get("weight") or 0
            )

            height = float(
                user.get("height") or 0
            )

        except (TypeError, ValueError):

            return jsonify({
                "success": False,
                "message":
                    "Invalid age, weight or height."
            }), 400

        gender = str(
            user.get("gender") or ""
        ).strip()

        activity = str(
            user.get("activity_level") or ""
        ).strip()

        original_goal = str(
            user.get("goal") or ""
        ).strip()

        preference = str(
            user.get("food_preference") or ""
        ).strip()

        budget = str(
            user.get("budget_level") or ""
        ).strip()

        # VALIDATION

        if age < 10 or age > 100:

            return jsonify({
                "success": False,
                "message":
                    "Age must be between 10 and 100."
            }), 400

        if weight < 20 or weight > 300:

            return jsonify({
                "success": False,
                "message":
                    "Weight must be between 20 and 300 kg."
            }), 400

        if height < 100 or height > 250:

            return jsonify({
                "success": False,
                "message":
                    "Height must be between 100 and 250 cm."
            }), 400

        # NORMALIZE USER VALUES

        activity = normalize_activity(
            activity
        )

        goal = normalize_goal(
            original_goal
        )

        if not activity:

            return jsonify({
                "success": False,
                "message":
                    "Invalid activity level."
            }), 400

        if not goal:

            return jsonify({
                "success": False,
                "message":
                    "Invalid goal."
            }), 400

        # NORMALIZE PREFERENCE

        preference_lower = (
            preference
            .lower()
            .replace("-", " ")
            .replace("_", " ")
            .strip()
        )

        preference_lower = " ".join(
            preference_lower.split()
        )

        # NORMALIZE BUDGET

        budget_lower = (
            budget
            .lower()
            .replace("-", " ")
            .replace("_", " ")
            .strip()
        )

        budget_lower = " ".join(
            budget_lower.split()
        )

        budget_map = {

            "low": "Low",

            "medium": "Medium",

            "mid": "Medium",

            "high": "High"

        }

        selected_budget = budget_map.get(
            budget_lower
        )

        if not selected_budget:

            return jsonify({
                "success": False,
                "message":
                    "Invalid budget level."
            }), 400

        # BMI

        bmi, bmi_category = calculate_bmi(
            weight,
            height
        )

        # EFFECTIVE GOAL

        effective_goal = goal

        goal_message = None

        if bmi < 18.5 and goal == "Weight Loss":

            effective_goal = "Weight Maintain"

            goal_message = (
                "Your BMI is underweight, so weight loss "
                "recommendations were adjusted toward maintenance."
            )

        elif bmi >= 25 and goal == "Weight Gain":

            effective_goal = "Weight Maintain"

            goal_message = (
                "Your BMI is above the normal range, so weight gain "
                "recommendations were adjusted toward maintenance."
            )

        # BMR

        bmr = calculate_bmr(
            age,
            gender,
            weight,
            height
        )

        # MAINTENANCE CALORIES

        maintenance = calculate_maintenance_calories(
            bmr,
            activity
        )

        # DAILY CALORIES

        daily_calories = calculate_daily_calories(
            maintenance,
            effective_goal
        )

        # MEAL CALORIE DISTRIBUTION
        #
        # Breakfast = 25%
        # Lunch     = 35%
        # Dinner    = 40%

        meal_percentages = {

            "Breakfast": 0.25,

            "Lunch": 0.35,

            "Dinner": 0.40

        }

        meal_target = round(
            daily_calories *
            meal_percentages[meal_type]
        )

        # BUDGET RANGES

        if selected_budget == "Low":

            budget_min = 200
            budget_max = 250

        elif selected_budget == "Medium":

            budget_min = 500
            budget_max = 600

        else:

            budget_min = 601
            budget_max = 999999

        # GET FOODS
        #
        # IMPORTANT:
        # ONLY MEAL TYPE IS FILTERED IN SQL.
        #
        # Preference will be hard filtered below.
        # Goal / Activity / Budget are NOT hard filters.

        cursor.execute("""
            SELECT

                Food_ID,
                Food_Name,
                Meal_Type,
                Calories,
                Protein_g,
                Carbs_g,
                Fat_g,
                Serving_g,
                Cost,
                Preference,
                Activity,
                Goal,
                Estimated_Cost

            FROM foods

            WHERE LOWER(TRIM(Meal_Type))
                = LOWER(TRIM(%s))

        """, (meal_type,))

        foods = cursor.fetchall()

        if not foods:

            return jsonify({
                "success": False,
                "message":
                    "No food found for this meal."
            }), 404

        # TEMPORARY EXCLUDED IDS

        exclude_ids_string = request.args.get(
            "exclude_ids",
            ""
        ).strip()

        excluded_ids = set()

        if exclude_ids_string:

            for value in exclude_ids_string.split(","):

                try:

                    excluded_ids.add(
                        int(value.strip())
                    )

                except (ValueError, TypeError):

                    pass

        # FEEDBACK

        cursor.execute("""
            SELECT
                comment
            FROM feedback
            WHERE user_id = %s
              AND comment IS NOT NULL
              AND TRIM(comment) <> ''
            ORDER BY id DESC
        """, (user_id,))

        feedback_rows = cursor.fetchall()

        disliked_food_names = set()

        liked_food_names = set()

        negative_words = [

            "dislike",
            "don't like",
            "do not like",
            "not like",
            "hate",
            "bad",
            "worst",
            "boring",
            "oily",
            "too oily",
            "too spicy",
            "spicy",
            "unhealthy",
            "expensive",
            "not good",
            "don't want",
            "do not want",
            "avoid",
            "never",
            "can't eat",
            "cannot eat"

        ]

        positive_words = [

            "like",
            "love",
            "loved",
            "good",
            "great",
            "best",
            "tasty",
            "delicious",
            "nice",
            "favorite",
            "favourite",
            "enjoy",
            "enjoyed"

        ]

        # ANALYZE FEEDBACK

        for feedback_row in feedback_rows:

            comment = str(
                feedback_row.get("comment") or ""
            ).strip().lower()

            if not comment:
                continue

            for food in foods:

                food_name = str(
                    food.get("Food_Name") or ""
                ).strip()

                if not food_name:
                    continue

                food_name_lower = food_name.lower()

                if food_name_lower not in comment:
                    continue

                has_negative = any(
                    word in comment
                    for word in negative_words
                )

                has_positive = any(
                    word in comment
                    for word in positive_words
                )

                if has_negative:

                    disliked_food_names.add(
                        food_name_lower
                    )

                elif has_positive:

                    liked_food_names.add(
                        food_name_lower
                    )

        # NORMALIZATION HELPERS FOR DATASET

        def normalize_preference(value):

            value = (
                str(value or "")
                .strip()
                .lower()
                .replace("-", " ")
                .replace("_", " ")
            )

            value = " ".join(
                value.split()
            )

            if value in [
                "vegetarian",
                "veg"
            ]:

                return "Vegetarian"

            if value in [
                "non vegetarian",
                "non veg",
                "nonvegetarian",
                "nonveg"
            ]:

                return "Non Vegetarian"

            if value == "both":

                return "Both"

            return None

        def normalize_food_goal(value):

            return normalize_goal(
                value
            )

        def normalize_food_activity(value):

            return normalize_activity(
                value
            )

        def get_food_budget(food):

            # FIRST: Cost category

            cost_value = str(
                food.get("Cost") or ""
            ).strip().lower()

            cost_value = (
                cost_value
                .replace("-", " ")
                .replace("_", " ")
            )

            cost_value = " ".join(
                cost_value.split()
            )

            if cost_value in [
                "low"
            ]:

                return "Low"

            if cost_value in [
                "medium",
                "mid"
            ]:

                return "Medium"

            if cost_value in [
                "high"
            ]:

                return "High"

            # SECOND: Estimated_Cost

            try:

                estimated = float(
                    food.get("Estimated_Cost")
                )

                if estimated <= 250:

                    return "Low"

                elif estimated <= 600:

                    return "Medium"

                else:

                    return "High"

            except (
                TypeError,
                ValueError
            ):

                return None

        # HARD FILTER
        #
        # ONLY:
        # 1. Meal type already filtered by SQL
        # 2. Preference
        #
        # Goal / Activity / Budget are NOT hard filters.

        hard_filtered_foods = []

        for food in foods:

            food_id = food.get(
                "Food_ID"
            )

            try:

                food_id_int = int(
                    food_id
                )

            except (
                TypeError,
                ValueError
            ):

                continue

            # Temporary exclusion

            if food_id_int in excluded_ids:

                continue

            # Disliked food

            food_name = str(
                food.get("Food_Name") or ""
            ).strip()

            food_name_lower = (
                food_name.lower()
            )

            if food_name_lower in disliked_food_names:

                continue

            # HARD PREFERENCE MATCH

            food_pref = normalize_preference(
                food.get("Preference")
            )

            # User Vegetarian
            if preference_lower in [
                "vegetarian",
                "veg"
            ]:

                if food_pref != "Vegetarian":

                    continue

            # User Non Vegetarian
            elif preference_lower in [
                "non vegetarian",
                "non veg",
                "nonvegetarian",
                "nonveg"
            ]:

                if food_pref != "Non Vegetarian":

                    continue

            # User Both
            elif preference_lower == "both":

                if food_pref not in [
                    "Vegetarian",
                    "Non Vegetarian",
                    "Both"
                ]:

                    continue

            else:

                return jsonify({
                    "success": False,
                    "message":
                        "Invalid food preference."
                }), 400

            hard_filtered_foods.append(
                food
            )

        # IF TEMPORARY EXCLUSIONS EXHAUST EVERYTHING
        #
        # Remove ONLY temporary exclusions.
        #
        # Disliked foods remain excluded.

        if not hard_filtered_foods:

            hard_filtered_foods = []

            for food in foods:

                food_name = str(
                    food.get("Food_Name") or ""
                ).strip().lower()

                if food_name in disliked_food_names:

                    continue

                food_pref = normalize_preference(
                    food.get("Preference")
                )

                if preference_lower in [
                    "vegetarian",
                    "veg"
                ]:

                    if food_pref != "Vegetarian":

                        continue

                elif preference_lower in [
                    "non vegetarian",
                    "non veg",
                    "nonvegetarian",
                    "nonveg"
                ]:

                    if food_pref != "Non Vegetarian":

                        continue

                elif preference_lower == "both":

                    if food_pref not in [
                        "Vegetarian",
                        "Non Vegetarian",
                        "Both"
                    ]:

                        continue

                hard_filtered_foods.append(
                    food
                )

        # NO HARD MATCH

        if not hard_filtered_foods:

            return jsonify({
                "success": False,
                "message":
                    "No suitable food is available for your "
                    "meal type and food preference."
            }), 404

        # HISTORY

        cursor.execute("""
            SELECT
                food_id
            FROM recommendation_history
            WHERE user_id = %s
              AND meal_type = %s
        """, (
            user_id,
            meal_type
        ))

        history_rows = cursor.fetchall()

        history_ids = set()

        for row in history_rows:

            try:

                history_ids.add(
                    int(row.get("food_id"))
                )

            except (
                TypeError,
                ValueError
            ):

                pass

        # CURRENT ELIGIBLE FOOD POOL
        #
        # IMPORTANT:
        # History is based on HARD FILTER POOL.
        #
        # Goal/activity/budget scoring does not shrink the pool.

        candidate_ids = set()

        for food in hard_filtered_foods:

            try:

                candidate_ids.add(
                    int(food.get("Food_ID"))
                )

            except (
                TypeError,
                ValueError
            ):

                pass

        # REMOVE PREVIOUSLY SHOWN FOODS

        cycle_available_foods = []

        for food in hard_filtered_foods:

            try:

                food_id = int(
                    food.get("Food_ID")
                )

            except (
                TypeError,
                ValueError
            ):

                continue

            if food_id not in history_ids:

                cycle_available_foods.append(
                    food
                )

        # CYCLE RESET

        cycle_restarted = False

        if not cycle_available_foods:

            cursor.execute("""
                DELETE FROM recommendation_history

                WHERE user_id = %s

                  AND meal_type = %s
            """, (
                user_id,
                meal_type
            ))

            db.commit()

            cycle_available_foods = list(
                hard_filtered_foods
            )

            cycle_restarted = True

        # SAFETY

        if not cycle_available_foods:

            return jsonify({
                "success": False,
                "message":
                    "No suitable food found."
            }), 404

        # SCORING SYSTEM
        #
        # HARD:
        # Meal + Preference
        #
        # SOFT:
        # Goal + Activity + Budget + Calories
        #
        # FEEDBACK:
        # Liked food gets bonus

        activity_order = [

            "Sedentary",
            "Moderate",
            "Active",
            "Very Active"

        ]

        goal_order = [

            "Weight Loss",
            "Weight Maintain",
            "Weight Gain"

        ]

        budget_order = [

            "Low",
            "Medium",
            "High"

        ]

        def get_distance(
            current,
            target,
            order_list
        ):

            if current not in order_list:

                return len(order_list)

            if target not in order_list:

                return len(order_list)

            return abs(
                order_list.index(current)
                -
                order_list.index(target)
            )

        # SCORE EACH FOOD

        scored_foods = []

        for food in cycle_available_foods:

            # FOOD GOAL

            food_goal = normalize_food_goal(
                food.get("Goal")
            )

            # Empty / general dataset goal
            if food_goal is None:

                goal_score = 2

            else:

                goal_distance = get_distance(
                    food_goal,
                    effective_goal,
                    goal_order
                )

                if goal_distance == 0:

                    goal_score = 30

                elif goal_distance == 1:

                    goal_score = 15

                else:

                    goal_score = 5

            # FOOD ACTIVITY

            food_activity = normalize_food_activity(
                food.get("Activity")
            )

            if food_activity is None:

                activity_score = 2

            else:

                activity_distance = get_distance(
                    food_activity,
                    activity,
                    activity_order
                )

                if activity_distance == 0:

                    activity_score = 25

                elif activity_distance == 1:

                    activity_score = 15

                elif activity_distance == 2:

                    activity_score = 8

                else:

                    activity_score = 3

            # FOOD BUDGET

            food_budget = get_food_budget(
                food
            )

            if food_budget is None:

                budget_score = 2

            else:

                budget_distance = get_distance(
                    food_budget,
                    selected_budget,
                    budget_order
                )

                if budget_distance == 0:

                    budget_score = 25

                elif budget_distance == 1:

                    budget_score = 12

                else:

                    budget_score = 5

            # CALORIE SCORE

            try:

                food_calories = float(
                    food.get("Calories") or 0
                )

            except (
                TypeError,
                ValueError
            ):

                food_calories = 0

            calorie_difference = abs(
                food_calories -
                meal_target
            )

            # Closer calorie target = better score
            if calorie_difference <= 50:

                calorie_score = 20

            elif calorie_difference <= 100:

                calorie_score = 15

            elif calorie_difference <= 200:

                calorie_score = 10

            elif calorie_difference <= 300:

                calorie_score = 5

            else:

                calorie_score = 0

            # LIKED FOOD BONUS

            food_name = str(
                food.get("Food_Name") or ""
            ).strip().lower()

            if food_name in liked_food_names:

                liked_score = 15

            else:

                liked_score = 0

            # TOTAL SCORE

            total_score = (

                goal_score
                +
                activity_score
                +
                budget_score
                +
                calorie_score
                +
                liked_score

            )

            scored_foods.append({

                "food": food,

                "score": total_score,

                "goal_score": goal_score,

                "activity_score": activity_score,

                "budget_score": budget_score,

                "calorie_score": calorie_score,

                "liked_score": liked_score,

                "calorie_difference":
                    calorie_difference

            })

        # SORT
        #
        # Highest score first.
        #
        # If score is same:
        # closer calorie food first.

        scored_foods.sort(

            key=lambda item: (

                -item["score"],

                item["calorie_difference"]

            )

        )

        # SELECT BEST FOOD

        best_item = (

            scored_foods[0]

            if scored_foods

            else None

        )

        if not best_item:

            return jsonify({
                "success": False,
                "message":
                    "No suitable food found."
            }), 404

        selected_food = best_item["food"]

        # SAVE HISTORY

        try:

            selected_food_id = int(
                selected_food.get("Food_ID")
            )

            cursor.execute("""
                INSERT INTO recommendation_history
                (
                    user_id,
                    meal_type,
                    food_id
                )
                VALUES
                (
                    %s,
                    %s,
                    %s
                )
                ON DUPLICATE KEY UPDATE
                    shown_at = CURRENT_TIMESTAMP
            """, (
                user_id,
                meal_type,
                selected_food_id
            ))

            db.commit()

        except (
            TypeError,
            ValueError
        ):

            pass

        # FOOD NUTRITION

        try:

            base_calories = float(
                selected_food.get(
                    "Calories"
                ) or 0
            )

        except (
            TypeError,
            ValueError
        ):

            base_calories = 0

        try:

            base_serving = float(
                selected_food.get(
                    "Serving_g"
                ) or 100
            )

        except (
            TypeError,
            ValueError
        ):

            base_serving = 100

        if base_calories <= 0:

            return jsonify({
                "success": False,
                "message":
                    "Invalid food calorie data."
            }), 500

        if base_serving <= 0:

            base_serving = 100

        # PORTION

        portion = (

            meal_target /
            base_calories

        ) * base_serving

        portion = max(

            50,

            min(
                portion,
                1000
            )

        )

        portion = round(
            portion / 5
        ) * 5

        multiplier = (

            portion /
            base_serving

        )

        # CALORIES

        calories = round(
            base_calories *
            multiplier
        )

        # PROTEIN

        try:

            protein = round(

                float(
                    selected_food.get(
                        "Protein_g"
                    ) or 0
                )
                *
                multiplier,

                1

            )

        except (
            TypeError,
            ValueError
        ):

            protein = 0

        # CARBS

        try:

            carbs = round(

                float(
                    selected_food.get(
                        "Carbs_g"
                    ) or 0
                )
                *
                multiplier,

                1

            )

        except (
            TypeError,
            ValueError
        ):

            carbs = 0

        # FAT

        try:

            fat = round(

                float(
                    selected_food.get(
                        "Fat_g"
                    ) or 0
                )
                *
                multiplier,

                1

            )

        except (
            TypeError,
            ValueError
        ):

            fat = 0

        # ESTIMATED COST

        value = selected_food.get(
            "Estimated_Cost"
        )

        try:

            if value is not None:

                base_cost = float(
                    value
                )

            else:

                raise ValueError

        except (
            TypeError,
            ValueError
        ):

            food_budget = get_food_budget(
                selected_food
            )

            if food_budget == "Low":

                base_cost = 225

            elif food_budget == "Medium":

                base_cost = 550

            elif food_budget == "High":

                base_cost = 750

            else:

                base_cost = 0

        estimated_cost = round(

            base_cost *
            multiplier,

            2

        )

        # MATCH INFORMATION

        match_information = {

            "match_score":
                best_item["score"],

            "goal_match":
                best_item["goal_score"],

            "activity_match":
                best_item["activity_score"],

            "budget_match":
                best_item["budget_score"],

            "calorie_match":
                best_item["calorie_score"],

            "liked_food_bonus":
                best_item["liked_score"]

        }

        # RECOMMENDATION

        recommendation = {

            "food_id":
                selected_food.get(
                    "Food_ID"
                ),

            "food_name":
                selected_food.get(
                    "Food_Name"
                ) or "Food",

            "meal_type":
                meal_type,

            "preference":
                selected_food.get(
                    "Preference"
                ),

            "dataset_goal":
                selected_food.get(
                    "Goal"
                ),

            "dataset_activity":
                selected_food.get(
                    "Activity"
                ),

            "dataset_budget":
                selected_food.get(
                    "Cost"
                ),

            "portion_grams":
                portion,

            "calories":
                calories,

            "protein_g":
                protein,

            "carbs_g":
                carbs,

            "fat_g":
                fat,

            "estimated_cost":
                estimated_cost,

            "match_information":
                match_information

        }

        # HISTORY STATUS

        cursor.execute("""
            SELECT
                COUNT(*) AS used_count
            FROM recommendation_history
            WHERE user_id = %s
              AND meal_type = %s
        """, (
            user_id,
            meal_type
        ))

        history_count_row = cursor.fetchone()

        history_count = (

            int(
                history_count_row.get(
                    "used_count"
                ) or 0
            )

            if history_count_row

            else 0

        )

        # TOTAL ELIGIBLE FOODS

        total_eligible_foods = len(
            hard_filtered_foods
        )

        remaining_foods = max(

            0,

            total_eligible_foods
            -
            history_count

        )

        # RESPONSE

        response = {

            "success": True,

            "user_id":
                user_id,

            "bmi":
                bmi,

            "bmi_category":
                bmi_category,

            "calorie_information": {

                "bmr":
                    bmr,

                "maintenance_calories":
                    maintenance,

                "recommended_daily_calories":
                    daily_calories,

                "activity_level":
                    activity,

                "goal":
                    goal,

                "effective_goal":
                    effective_goal

            },

            "meal_information": {

                "meal":
                    meal_type,

                "meal_target_calories":
                    meal_target,

                "percentage":
                    int(
                        meal_percentages[
                            meal_type
                        ] * 100
                    )

            },

            "budget_information": {

                "selected_budget":
                    selected_budget,

                "budget_range":

                    (
                        f"Rs. {budget_min} - "
                        f"{budget_max}"
                    )

                    if selected_budget != "High"

                    else "Rs. 601+"

            },

            "filter_information": {

                "hard_filters": [

                    "Meal Type",
                    "Food Preference"

                ],

                "soft_filters": [

                    "Goal",
                    "Activity",
                    "Budget",
                    "Calories"

                ],

                "total_foods_in_dataset":
                    len(foods),

                "eligible_foods":
                    total_eligible_foods,

                "remaining_foods":
                    remaining_foods

            },

            "feedback_learning": {

                "disliked_foods_detected":
                    len(
                        disliked_food_names
                    ),

                "liked_foods_detected":
                    len(
                        liked_food_names
                    )

            },

            "cycle_information": {

                "meal":
                    meal_type,

                "cycle_restarted":
                    cycle_restarted,

                "foods_used_in_current_cycle":
                    history_count,

                "total_eligible_foods":
                    total_eligible_foods,

                "remaining_foods":
                    remaining_foods

            },

            "recommendation":
                recommendation

        }

        # BMI MESSAGE

        if goal_message:

            response["message"] = (
                goal_message
            )

        return jsonify(
            response
        ), 200

    # VALUE ERROR

    except ValueError as e:

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 400

    # GENERAL ERROR

    except Exception as e:

        print(
            "Recommendation Error:",
            str(e)
        )

        if db:

            try:

                db.rollback()

            except Exception:

                pass

        return jsonify({

            "success": False,

            "message":
                "Recommendation system error.",

            "error":
                str(e)

        }), 500

    # CLOSE DATABASE

    finally:

        if cursor:

            cursor.close()

        if db:

            db.close()

@app.route("/my_profile", methods=["GET"])
@jwt_required()
def my_profile():

    # GET USER ID FROM JWT

    user_id = get_jwt_identity()

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Invalid or missing token."
        }), 401

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # USER + PROFILE

        cursor.execute("""
            SELECT
                u.id,
                u.name,
                u.email,
                p.age,
                p.gender,
                p.weight,
                p.height,
                p.activity_level,
                p.goal,
                p.food_preference,
                p.budget_level
            FROM users u
            LEFT JOIN user_profile p
                ON u.id = p.user_id
            WHERE u.id = %s
            ORDER BY p.id DESC
            LIMIT 1
        """, (user_id,))

        user = cursor.fetchone()

        if not user:

            return jsonify({
                "success": False,
                "message": "User not found."
            }), 404

        # PROFILE VALUES

        try:

            age = float(user.get("age") or 0)
            weight = float(user.get("weight") or 0)
            height = float(user.get("height") or 0)

        except (TypeError, ValueError):

            return jsonify({
                "success": False,
                "message": "Invalid profile data."
            }), 400

        gender = str(
            user.get("gender") or ""
        ).strip()

        activity = str(
            user.get("activity_level") or "Moderate"
        ).strip()

        goal = str(
            user.get("goal") or "Weight Maintain"
        ).strip()

        # BMI

        bmi = 0
        bmi_category = "Unknown"

        if height > 0 and weight > 0:

            bmi, bmi_category = calculate_bmi(
                weight,
                height
            )

        # BMR

        if gender.lower() == "male":

            bmr = (
                (10 * weight)
                + (6.25 * height)
                - (5 * age)
                + 5
            )

        else:

            bmr = (
                (10 * weight)
                + (6.25 * height)
                - (5 * age)
                - 161
            )

        bmr = round(bmr)

        # ACTIVITY FACTOR

        activity_factors = {

            "Sedentary": 1.20,
            "Moderate": 1.375,
            "Active": 1.55,
            "Very Active": 1.725
        }

        factor = activity_factors.get(
            activity,
            1.375
        )

        # MAINTENANCE CALORIES

        maintenance = round(
            bmr * factor
        )

        # GOAL CALORIES

        if goal.lower() == "weight loss":

            recommended_calories = maintenance - 500

        elif goal.lower() == "weight gain":

            recommended_calories = maintenance + 500

        else:

            recommended_calories = maintenance

        # Minimum 1200 calories
        recommended_calories = max(
            recommended_calories,
            1200
        )

        # Maximum 5000 calories
        recommended_calories = min(
            recommended_calories,
            5000
        )

        # RESPONSE

        return jsonify({

            "success": True,

            "user": {

                "id":
                    user.get("id"),

                "name":
                    user.get("name"),

                "email":
                    user.get("email"),

                "age":
                    user.get("age"),

                "gender":
                    user.get("gender"),

                "height":
                    user.get("height"),

                "weight":
                    user.get("weight"),

                "activity_level":
                    user.get("activity_level"),

                "goal":
                    user.get("goal"),

                "food_preference":
                    user.get("food_preference"),

                "budget_level":
                    user.get("budget_level")
            },

            "health_information": {

                "bmi":
                    bmi,

                "bmi_category":
                    bmi_category,

                "bmr":
                    bmr,

                "maintenance_calories":
                    maintenance,

                "recommended_daily_calories":
                    recommended_calories
            }

        }), 200

    # ERROR

    except Exception as e:

        print("My Profile Error:", str(e))

        return jsonify({

            "success": False,

            "message":
                "Could not load your profile.",

            "error":
                str(e)

        }), 500

    # CLOSE DATABASE

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/feedback", methods=["POST"])
@jwt_required()
def submit_feedback():

    # GET USER ID FROM JWT

    user_id = get_jwt_identity()

    data = request.get_json() or {}

    followed = str(
        data.get("followed") or ""
    ).strip()

    comment = str(
        data.get("comment") or ""
    ).strip()

    food_id = data.get("food_id")

    meal_type = data.get("meal_type")

    # CHECK YES / NO

    if followed not in ["Yes", "No"]:

        return jsonify({
            "success": False,
            "message": "Please select Yes or No."
        }), 400

    # CHECK COMMENT

    if not comment:

        return jsonify({
            "success": False,
            "message": "Please enter your feedback."
        }), 400

    if len(comment) > 2000:

        return jsonify({
            "success": False,
            "message": "Feedback is too long."
        }), 400

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        # SAVE FEEDBACK

        cursor.execute("""
            INSERT INTO feedback
            (user_id, food_id, meal_type, followed, comment)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_id,
            food_id,
            meal_type,
            followed,
            comment
        ))

        db.commit()

        feedback_id = cursor.lastrowid

        # ANALYZE CURRENT FEEDBACK

        cursor2 = db.cursor(dictionary=True)

        cursor2.execute("""
            SELECT Food_Name
            FROM foods
        """)

        food_rows = cursor2.fetchall()

        cursor2.close()

        food_names = [
            row["Food_Name"]
            for row in food_rows
        ]

        analysis = analyze_feedback(
            comment,
            food_names
        )

        # SAVE ANALYSIS TO feedback_analysis TABLE

        cursor.execute("""
            INSERT INTO feedback_analysis
            (feedback_id, user_id, mentioned_foods, liked_foods, disliked_foods, feedback_points)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            feedback_id,
            user_id,
            ", ".join(analysis["mentioned_foods"]),
            ", ".join(analysis["liked_foods"]),
            ", ".join(analysis["disliked_foods"]),
            " | ".join(analysis["feedback_points"])
        ))

        db.commit()

        return jsonify({

            "success": True,

            "message":
                "Feedback submitted successfully.",

            "analysis": analysis

        }), 201

    except Exception as e:

        if db:
            db.rollback()

        print("SUBMIT FEEDBACK ERROR:", str(e))

        return jsonify({

            "success": False,

            "message":
                "Could not save feedback.",

            "error": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()
# ADMIN - GET ALL FEEDBACK

@app.route("/admin/feedback", methods=["GET"])
def get_all_feedback():

    # Admin check
    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                f.id,
                f.user_id,
                u.name,
                u.email,
                f.food_id,
                f.meal_type,
                f.followed,
                f.comment,
                f.status,
                f.admin_response,
                f.responded_at,
                f.created_at
            FROM feedback f
            LEFT JOIN users u
                ON f.user_id = u.id
            ORDER BY f.created_at DESC
        """)

        feedback_list = cursor.fetchall()

        return jsonify({
            "success": True,
            "feedback": feedback_list
        }), 200

    except Exception as e:

        print("ADMIN GET FEEDBACK ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to load feedback",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# ADMIN - REPLY TO FEEDBACK

@app.route("/admin/feedback/reply", methods=["PUT"])
def admin_feedback_reply():

    # Admin check
    admin_check = admin_required()

    if admin_check:
        return admin_check

    data = request.get_json() or {}

    feedback_id = data.get("feedback_id")
    response = str(data.get("response") or "").strip()

    if not feedback_id or not response:

        return jsonify({
            "success": False,
            "message": "Feedback ID and response are required"
        }), 400

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE feedback
            SET
                admin_response = %s,
                status = 'Replied',
                responded_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (
            response,
            feedback_id
        ))

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Feedback not found"
            }), 404

        db.commit()

        return jsonify({
            "success": True,
            "message": "Response sent successfully"
        }), 200

    except Exception as e:

        if db:
            db.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to send response",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# ADMIN - MARK FEEDBACK AS READ

@app.route("/admin/feedback/<int:feedback_id>/read", methods=["PUT"])
def mark_feedback_read(feedback_id):

    # Admin check
    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE feedback
            SET status = 'Read'
            WHERE id = %s
        """, (feedback_id,))

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Feedback not found"
            }), 404

        db.commit()

        return jsonify({
            "success": True,
            "message": "Feedback marked as read"
        }), 200

    except Exception as e:

        if db:
            db.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to update feedback",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# USER - GET MY FEEDBACK AND ADMIN REPLIES

@app.route("/my-feedback", methods=["GET"])
@jwt_required()
def get_my_feedback():

    user_id = get_jwt_identity()

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                f.id,
                f.food_id,
                f.meal_type,
                f.followed,
                f.comment,
                f.status,
                f.admin_response,
                f.responded_at,
                f.created_at
            FROM feedback f
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
        """, (user_id,))

        feedback_list = cursor.fetchall()

        return jsonify({
            "success": True,
            "feedback": feedback_list
        }), 200

    except Exception as e:

        print("GET MY FEEDBACK ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to load your feedback",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

# FEEDBACK ANALYSIS

def analyze_feedback(comment, food_names):

    text = comment.lower().strip()

    positive = [
        "like",
        "love",
        "good",
        "great",
        "tasty",
        "delicious",
        "favorite",
        "favourite",
        "pasand",
        "acha",
        "achha",
        "mazaydar",
        "laziz",
        "zabardast"
    ]

    negative = [
        "dislike",
        "hate",
        "bad",
        "worst",
        "oily",
        "unhealthy",
        "boring",
        "don't like",
        "do not like",
        "pasand nahi",
        "pasand nahin",
        "acha nahi",
        "achha nahi",
        "bilkul pasand nahi"
    ]

    healthy = [
        "healthy",
        "protein",
        "low calorie",
        "light",
        "fresh",
        "nutritious",
        "sehatmand"
    ]

    mentioned_foods = []
    liked_foods = []
    disliked_foods = []
    feedback_points = []

    # CHECK MENTIONED FOODS

    for food in food_names:

        food_lower = food.lower()

        if food_lower in text:

            mentioned_foods.append(food)

            position = text.find(food_lower)

            context = text[
                max(0, position - 70):
                position + len(food_lower) + 70
            ]

            # Negative first
            if any(
                word in context
                for word in negative
            ):

                disliked_foods.append(food)

            elif any(
                word in context
                for word in positive
            ):

                liked_foods.append(food)

            else:

                feedback_points.append(
                    f"User mentioned {food}"
                )

    # GENERAL HEALTHY PREFERENCE

    if any(
        word in text
        for word in healthy
    ):

        feedback_points.append(
            "User prefers healthy/nutritious options"
        )

    # GENERAL POSITIVE FEEDBACK

    if any(
        word in text
        for word in positive
    ):

        feedback_points.append(
            "User has some positive food preference"
        )

    # GENERAL NEGATIVE FEEDBACK

    if any(
        word in text
        for word in negative
    ):

        feedback_points.append(
            "User has some negative food preference"
        )

    # RETURN ANALYSIS

    return {

        "mentioned_foods":
            mentioned_foods,

        "liked_foods":
            liked_foods,

        "disliked_foods":
            disliked_foods,

        "feedback_points":
            feedback_points
    }

@app.route("/contact", methods=["POST"])
@jwt_required(optional=True)
def contact():

    data = request.json

    name = data.get("name")
    email = data.get("email")
    subject = data.get("subject")
    message = data.get("message")

    if not name or not email or not subject or not message:
        return jsonify({
            "success": False,
            "message": "All fields are required"
        }), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        # Get logged-in user ID if available (JWT is optional here)
        user_id = get_jwt_identity()

        query = """
            INSERT INTO contact_messages
            (user_id, name, email, subject, message)
            VALUES (%s, %s, %s, %s, %s)
        """

        cursor.execute(
            query,
            (user_id, name, email, subject, message)
        )

        db.commit()

        return jsonify({
            "success": True,
            "message": "Your message has been sent successfully"
        }), 201

    except Exception as e:

        if db:
            db.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to send message",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/contact-messages", methods=["GET"])
def get_contact_messages():

    # Admin check
    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                user_id,
                name,
                email,
                subject,
                message,
                status,
                admin_response,
                responded_at,
                created_at
            FROM contact_messages
            ORDER BY created_at DESC
        """)

        messages = cursor.fetchall()

        return jsonify({
            "success": True,
            "messages": messages
        }), 200

    except Exception as e:

        print("ADMIN CONTACT GET ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to load contact messages",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/contact-messages/<int:message_id>/read", methods=["PUT"])
def mark_contact_message_read(message_id):

    # Admin check
    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE contact_messages
            SET status = 'Read'
            WHERE id = %s
        """, (message_id,))

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Message not found"
            }), 404

        db.commit()

        return jsonify({
            "success": True,
            "message": "Message marked as read"
        }), 200

    except Exception as e:

        if db:
            db.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to update message",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/contact-messages/<int:message_id>", methods=["DELETE"])
def delete_contact_message(message_id):

    # Admin check
    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            DELETE FROM contact_messages
            WHERE id = %s
        """, (message_id,))

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Message not found"
            }), 404

        db.commit()

        return jsonify({
            "success": True,
            "message": "Message deleted successfully"
        }), 200

    except Exception as e:

        if db:
            db.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to delete message",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()   

@app.route("/admin/contact/reply", methods=["PUT"])
def admin_contact_reply():

    # Admin check
    admin_check = admin_required()

    if admin_check:
        return admin_check

    data = request.get_json() or {}

    message_id = data.get("message_id")
    response = str(data.get("response") or "").strip()

    if not message_id or not response:

        return jsonify({
            "success": False,
            "message": "Message ID and response are required"
        }), 400

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE contact_messages
            SET
                admin_response = %s,
                status = 'Replied',
                responded_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (
            response,
            message_id
        ))

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Message not found"
            }), 404

        db.commit()

        return jsonify({
            "success": True,
            "message": "Response sent successfully"
        }), 200

    except Exception as e:

        if db:
            db.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to send response",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()               

# USER - GET MY CONTACT MESSAGES AND ADMIN RESPONSES


@app.route("/my-contact-messages", methods=["GET"])
@jwt_required()
def get_my_contact_messages():

    user_id = get_jwt_identity()

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                subject,
                message,
                status,
                admin_response,
                responded_at,
                created_at
            FROM contact_messages
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))

        messages = cursor.fetchall()

        return jsonify({
            "success": True,
            "messages": messages
        }), 200

    except Exception as e:

        print("GET MY CONTACT MESSAGES ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to load your contact messages",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/progress", methods=["POST"])
@jwt_required()
def add_progress():

    data = request.json

    # Get user ID from JWT
    user_id = get_jwt_identity()

    weight = data.get("weight")

    if weight is None:
        return jsonify({
            "success": False,
            "message": "Weight is required"
        }), 400

    try:
        weight = float(weight)

        if weight <= 0:
            return jsonify({
                "success": False,
                "message": "Weight must be greater than zero"
            }), 400

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid weight"
        }), 400

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        query = """
            INSERT INTO user_progress
            (user_id, weight, progress_date)
            VALUES (%s, %s, CURDATE())
        """

        cursor.execute(
            query,
            (user_id, weight)
        )

        db.commit()

        return jsonify({
            "success": True,
            "message": "Weight progress saved successfully"
        }), 201

    except Exception as e:

        if db:
            db.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to save progress",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/progress", methods=["GET"])
@jwt_required()
def get_progress():

    # Get user ID from JWT
    user_id = get_jwt_identity()

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT
                id,
                weight,
                progress_date,
                created_at
            FROM user_progress
            WHERE user_id = %s
            ORDER BY progress_date ASC, id ASC
        """

        cursor.execute(query, (user_id,))

        progress = cursor.fetchall()

        if not progress:

            return jsonify({
                "success": True,
                "summary": None,
                "progress": []
            }), 200

        current_record = progress[-1]

        current_weight = float(
            current_record["weight"]
        )

        current_date = current_record["progress_date"]

        if len(progress) >= 2:

            previous_record = progress[-2]

            previous_weight = float(
                previous_record["weight"]
            )

            previous_date = previous_record["progress_date"]

            weight_change = (
                current_weight - previous_weight
            )

            if previous_weight != 0:

                weight_percentage = (
                    abs(weight_change)
                    / previous_weight
                ) * 100

            else:

                weight_percentage = 0

        else:

            previous_weight = None
            previous_date = None
            weight_change = 0
            weight_percentage = 0

        summary = {
            "current_weight": current_weight,
            "current_date": current_date,
            "previous_weight": previous_weight,
            "previous_date": previous_date,
            "weight_change": round(
                weight_change,
                2
            ),
            "weight_percentage": round(
                weight_percentage,
                2
            )
        }

        return jsonify({
            "success": True,
            "summary": summary,
            "progress": progress
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Failed to load progress",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()            

@app.route("/admin/foods", methods=["GET"])
def admin_get_foods():

    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                Food_ID,
                Food_Name,
                Meal_Type,
                Calories,
                Protein_g,
                Carbs_g,
                Fat_g,
                Serving_g,
                Cost,
                Preference,
                Activity,
                Goal,
                Estimated_Cost
            FROM foods
            ORDER BY Food_ID ASC
        """)

        foods = cursor.fetchall()

        return jsonify({
            "success": True,
            "foods": foods
        }), 200

    except Exception as e:

        print("ADMIN GET FOODS ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to load foods"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/foods", methods=["POST"])
def admin_add_food():

    admin_check = admin_required()

    if admin_check:
        return admin_check

    data = request.get_json() or {}

    food_name = data.get("Food_Name")
    meal_type = data.get("Meal_Type")
    calories = data.get("Calories")

    if not food_name or not meal_type or calories is None:

        return jsonify({
            "success": False,
            "message": "Food name, meal type and calories are required"
        }), 400

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO foods
            (
                Food_Name,
                Meal_Type,
                Calories,
                Protein_g,
                Carbs_g,
                Fat_g,
                Serving_g,
                Cost,
                Preference,
                Activity,
                Goal,
                Estimated_Cost
            )
            VALUES
            (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            )
        """, (
            food_name,
            meal_type,
            calories,
            data.get("Protein_g"),
            data.get("Carbs_g"),
            data.get("Fat_g"),
            data.get("Serving_g"),
            data.get("Cost"),
            data.get("Preference"),
            data.get("Activity"),
            data.get("Goal"),
            data.get("Estimated_Cost")
        ))

        db.commit()

        new_food_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Food added successfully",
            "Food_ID": new_food_id
        }), 201

    except Exception as e:

        if db:
            db.rollback()

        print("ADMIN ADD FOOD ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to add food"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/foods/<int:food_id>", methods=["PUT"])
def admin_update_food(food_id):

    admin_check = admin_required()

    if admin_check:
        return admin_check

    data = request.get_json() or {}

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE foods
            SET
                Food_Name = %s,
                Meal_Type = %s,
                Calories = %s,
                Protein_g = %s,
                Carbs_g = %s,
                Fat_g = %s,
                Serving_g = %s,
                Cost = %s,
                Preference = %s,
                Activity = %s,
                Goal = %s,
                Estimated_Cost = %s
            WHERE Food_ID = %s
        """, (
            data.get("Food_Name"),
            data.get("Meal_Type"),
            data.get("Calories"),
            data.get("Protein_g"),
            data.get("Carbs_g"),
            data.get("Fat_g"),
            data.get("Serving_g"),
            data.get("Cost"),
            data.get("Preference"),
            data.get("Activity"),
            data.get("Goal"),
            data.get("Estimated_Cost"),
            food_id
        ))

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Food not found"
            }), 404

        db.commit()

        return jsonify({
            "success": True,
            "message": "Food updated successfully"
        }), 200

    except Exception as e:

        if db:
            db.rollback()

        print("ADMIN UPDATE FOOD ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to update food"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/foods/<int:food_id>", methods=["DELETE"])
def admin_delete_food(food_id):

    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            DELETE FROM foods
            WHERE Food_ID = %s
        """, (food_id,))

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Food not found"
            }), 404

        db.commit()

        return jsonify({
            "success": True,
            "message": "Food deleted successfully"
        }), 200

    except Exception as e:

        if db:
            db.rollback()

        print("ADMIN DELETE FOOD ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to delete food"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/progress", methods=["GET"])
def admin_get_progress():

    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                p.id,
                p.user_id,
                u.name,
                u.email,
                p.weight,
                p.progress_date,
                p.created_at
            FROM user_progress p
            LEFT JOIN users u
                ON p.user_id = u.id
            ORDER BY p.progress_date DESC, p.id DESC
        """)

        progress = cursor.fetchall()

        return jsonify({
            "success": True,
            "progress": progress
        }), 200

    except Exception as e:

        print("ADMIN GET PROGRESS ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to load user progress"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

@app.route("/admin/admins", methods=["GET"])
def admin_get_admins():

    admin_check = admin_required()

    if admin_check:
        return admin_check

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                created_at
            FROM admins
            ORDER BY id ASC
        """)

        admins = cursor.fetchall()

        return jsonify({
            "success": True,
            "admins": admins
        }), 200

    except Exception as e:

        print("ADMIN GET ADMINS ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to load admins"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

# ADMIN LOGOUT

@app.route("/admin/logout", methods=["POST"])
@jwt_required()
def admin_logout():

    try:

        admin_id = get_jwt_identity()

        print(f"Admin {admin_id} logged out successfully")

        return jsonify({
            "success": True,
            "message": "Admin logged out successfully"
        }), 200

    except Exception as e:

        print("ADMIN LOGOUT ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Admin logout failed"
        }), 500                            

if __name__ == "__main__":
    app.run(debug=True)