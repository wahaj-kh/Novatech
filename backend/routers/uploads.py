from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import auth
import os
import shutil
import uuid

router = APIRouter(
    tags=["Uploads"]
)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@router.post("/upload")
async def upload_image(file: UploadFile = File(...), current_user = Depends(auth.admin_required)):
    # Check file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .png, .jpg, .jpeg, and .webp files are allowed.")
    
    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")
    
    # Reset file pointer after reading
    await file.seek(0)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join("uploads", unique_filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(content)
        
    return {"url": f"http://localhost:8000/static/{unique_filename}"}
