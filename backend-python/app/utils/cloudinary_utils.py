import cloudinary
import cloudinary.uploader
from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_SECRET_KEY,
    secure=True
)

async def upload_image(file_content: bytes, folder: str = "user-profiles") -> str:
    """
    Upload an image to Cloudinary and return the secure URL.
    """
    try:
        if not settings.CLOUDINARY_API_KEY:
            return ""
            
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="image"
        )
        return result.get("secure_url", "")
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return ""

async def upload_file_auto(file_content: bytes, folder: str = "health-records") -> tuple[str, str]:
    """
    Upload any file type to Cloudinary and return (secure_url, public_id).
    """
    try:
        if not settings.CLOUDINARY_API_KEY:
            return "", ""
            
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="auto"
        )
        return result.get("secure_url", ""), result.get("public_id", "")
    except Exception as e:
        print(f"Cloudinary upload auto error: {e}")
        return "", ""

async def delete_file(public_id: str):
    """
    Delete a file from Cloudinary.
    """
    try:
        if not settings.CLOUDINARY_API_KEY:
            return
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        print(f"Cloudinary delete error: {e}")
