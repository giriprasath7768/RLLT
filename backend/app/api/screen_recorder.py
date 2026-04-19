from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import tempfile
import subprocess
import os
import uuid

router = APIRouter()

@router.post("/convert")
async def convert_webm_to_mp4(file: UploadFile = File(...)):
    if not file.filename.endswith(('.webm', '.mkv', '.mp4')):
        pass # Allow anyway since blobs sometimes don't have perfect names
        
    # Create temporary files
    input_fd, input_path = tempfile.mkstemp(suffix=".webm")
    output_fd, output_path = tempfile.mkstemp(suffix=".mp4")
    
    os.close(input_fd)
    os.close(output_fd)

    try:
        # Write the uploaded blob to disk
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # Run ffmpeg to copy video and encode audio to AAC
        # -y: overwrite output
        # -c:v copy: copy video stream without re-encoding
        # -c:a aac: re-encode audio to universally compatible AAC
        command = [
            "ffmpeg", "-y", "-i", input_path, 
            "-c:v", "copy", "-c:a", "aac", "-strict", "experimental",
            output_path
        ]
        
        process = subprocess.run(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        
        if process.returncode != 0:
            print(f"FFmpeg failed: {process.stderr}")
            raise HTTPException(status_code=500, detail="Video conversion failed")

        if not os.path.getsize(output_path) > 0:
            raise HTTPException(status_code=500, detail="Video conversion resulted in empty file")
            
        # Instead of just sending paths, we can use FileResponse 
        # But we must ensure it isn't deleted before sent, FileResponse cleans up if background task is used, or we just leave it in tmp
        return FileResponse(
            path=output_path,
            media_type="video/mp4",
            filename=f"Screen_Recording_{uuid.uuid4().hex[:8]}.mp4"
        )
        
    except Exception as e:
        # Cleanup on failure
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)
        raise e
