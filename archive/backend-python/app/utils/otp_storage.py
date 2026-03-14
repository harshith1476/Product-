import time
import random
from typing import Dict, Optional, Tuple

class OTPStore:
    def __init__(self):
        # Structure: { email: { "otp": str, "expires_at": float, "attempts": int, "cooldown_until": float } }
        self._store: Dict[str, dict] = {}
        self.OTP_EXPIRY_SEC = 300  # 5 minutes
        self.MAX_ATTEMPTS = 5
        self.COOLDOWN_SEC = 900    # 15 minutes

    def generate_otp(self) -> str:
        return str(random.randint(100000, 999999))

    def store_otp(self, email: str, otp: str):
        email_key = email.lower()
        now = time.time()
        
        # Check cooldown
        existing = self._store.get(email_key)
        if existing and existing.get("cooldown_until") and existing["cooldown_until"] > now:
            remaining_mins = int((existing["cooldown_until"] - now) // 60) + 1
            raise ValueError(f"Too many attempts. Please wait {remaining_mins} minute(s).")

        self._store[email_key] = {
            "otp": otp,
            "expires_at": now + self.OTP_EXPIRY_SEC,
            "attempts": 0,
            "cooldown_until": 0
        }

    def verify_otp(self, email: str, otp: str) -> Tuple[bool, str]:
        email_key = email.lower()
        stored = self._store.get(email_key)
        
        if not stored:
            return False, "OTP not found. Please request a new one."
            
        now = time.time()
        
        # Check cooldown
        if stored.get("cooldown_until") and stored["cooldown_until"] > now:
            remaining_mins = int((stored["cooldown_until"] - now) // 60) + 1
            return False, f"Too many attempts. Please wait {remaining_mins} minute(s)."
            
        # Check expiry
        if stored["expires_at"] < now:
            del self._store[email_key]
            return False, "OTP has expired. Please request a new one."
            
        # Check attempts
        if stored["attempts"] >= self.MAX_ATTEMPTS:
            stored["cooldown_until"] = now + self.COOLDOWN_SEC
            return False, f"Too many attempts. Please wait {self.COOLDOWN_SEC // 60} minutes."
            
        # Verify
        if stored["otp"] != otp:
            stored["attempts"] += 1
            remaining = self.MAX_ATTEMPTS - stored["attempts"]
            return False, f"Invalid OTP. {remaining} attempt(s) remaining." if remaining > 0 else "No attempts remaining. Cooldown active."
            
        # Success
        del self._store[email_key]
        return True, "OTP verified successfully."

    def has_active_otp(self, email: str) -> bool:
        email_key = email.lower()
        stored = self._store.get(email_key)
        if not stored: return False
        return stored["expires_at"] > time.time()

    def get_remaining_time(self, email: str) -> int:
        email_key = email.lower()
        stored = self._store.get(email_key)
        if not stored: return 0
        remaining = int(stored["expires_at"] - time.time())
        return max(0, remaining)

    def remove_otp(self, email: str):
        self._store.pop(email.lower(), None)

# Singleton instance
otp_manager = OTPStore()
