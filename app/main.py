"""
Metro Signage Generator - FastAPI Backend
"""
import json
import os
from pathlib import Path
from typing import Optional
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from datetime import datetime

from app.models import Project, CanvasSize, SignageElement
from app.export import export_to_png, export_to_svg

# Create app
app = FastAPI(
    title="Metro Signage Generator",
    description="A modern web-based metro signage design tool",
    version="0.1.0"
)

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
PROJECTS_DIR = Path("./projects")
EXPORTS_DIR = Path("./exports")
PROJECTS_DIR.mkdir(exist_ok=True)
EXPORTS_DIR.mkdir(exist_ok=True)

# Predefined canvas sizes (in pixels, representing mm at 300dpi would be different)
CANVAS_PRESETS = {
    "small": CanvasSize(width=1200, height=400, name="Small (1200×400)"),
    "medium": CanvasSize(width=2400, height=800, name="Medium (2400×800)"),
    "large": CanvasSize(width=3600, height=1200, name="Large (3600×1200)"),
}


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/canvas-presets")
async def get_canvas_presets():
    """Get available canvas size presets"""
    return CANVAS_PRESETS


# Project Management
class ProjectCreate(BaseModel):
    name: str
    canvas_size: str = "medium"  # small, medium, large


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    elements: Optional[list] = None


@app.post("/api/projects")
async def create_project(project_data: ProjectCreate):
    """Create a new project"""
    canvas = CANVAS_PRESETS.get(project_data.canvas_size, CANVAS_PRESETS["medium"])
    project = Project(
        name=project_data.name,
        canvas_width=canvas.width,
        canvas_height=canvas.height,
        elements=[],
    )
    
    # Save to file
    project_path = PROJECTS_DIR / f"{project.id}.json"
    with open(project_path, "w", encoding="utf-8") as f:
        f.write(project.model_dump_json(indent=2))
    
    return project


@app.get("/api/projects")
async def list_projects():
    """List all saved projects"""
    projects = []
    for file in PROJECTS_DIR.glob("*.json"):
        try:
            with open(file, "r", encoding="utf-8") as f:
                data = json.load(f)
                projects.append({
                    "id": data.get("id"),
                    "name": data.get("name"),
                    "created_at": data.get("created_at"),
                    "updated_at": data.get("updated_at"),
                })
        except Exception:
            continue
    return sorted(projects, key=lambda x: x.get("updated_at", ""), reverse=True)


@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get a specific project"""
    project_path = PROJECTS_DIR / f"{project_id}.json"
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    with open(project_path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, update_data: dict):
    """Update a project"""
    project_path = PROJECTS_DIR / f"{project_id}.json"
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    with open(project_path, "r", encoding="utf-8") as f:
        project = json.load(f)
    
    # Update fields
    if "name" in update_data:
        project["name"] = update_data["name"]
    if "elements" in update_data:
        project["elements"] = update_data["elements"]
    if "canvas_width" in update_data:
        project["canvas_width"] = update_data["canvas_width"]
    if "canvas_height" in update_data:
        project["canvas_height"] = update_data["canvas_height"]
    
    project["updated_at"] = datetime.now().isoformat()
    
    with open(project_path, "w", encoding="utf-8") as f:
        json.dump(project, f, indent=2, ensure_ascii=False)
    
    return project


@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    project_path = PROJECTS_DIR / f"{project_id}.json"
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_path.unlink()
    return {"status": "deleted", "id": project_id}


# Export endpoints
class ExportRequest(BaseModel):
    project_id: str
    format: str = "png"  # png or svg
    scale: float = 1.0


@app.post("/api/export")
async def export_project(request: ExportRequest):
    """Export project to PNG or SVG"""
    project_path = PROJECTS_DIR / f"{request.project_id}.json"
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    with open(project_path, "r", encoding="utf-8") as f:
        project = json.load(f)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if request.format == "svg":
        output_path = EXPORTS_DIR / f"{project['name']}_{timestamp}.svg"
        export_to_svg(project, output_path)
    else:
        output_path = EXPORTS_DIR / f"{project['name']}_{timestamp}.png"
        export_to_png(project, output_path, scale=request.scale)
    
    return FileResponse(
        output_path,
        filename=output_path.name,
        media_type="image/svg+xml" if request.format == "svg" else "image/png"
    )


# Serve frontend static files
if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # Check if file exists in frontend/dist
        file_path = Path("frontend/dist") / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
            
        # Fallback to index.html for SPA
        return FileResponse("frontend/dist/index.html")


def run():
    """Run the server"""
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    run()
