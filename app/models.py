"""
Data models for Metro Signage Generator
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
import uuid


class CanvasSize(BaseModel):
    """Canvas size preset"""
    width: int
    height: int
    name: str


class ElementStyle(BaseModel):
    """Style properties for an element"""
    fill: str = "#333333"
    stroke: str = "transparent"
    stroke_width: float = 0
    font_family: str = "Noto Sans SC, sans-serif"
    font_size: int = 24
    font_weight: str = "normal"
    text_align: str = "center"
    opacity: float = 1.0
    border_radius: float = 0


class SignageElement(BaseModel):
    """A single element on the canvas"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: Literal["text", "rect", "icon", "exit", "line_badge", "arrow", "group"]
    x: float = 0
    y: float = 0
    width: float = 100
    height: float = 50
    rotation: float = 0
    content: Optional[str] = None  # Text content or icon name
    style: ElementStyle = Field(default_factory=ElementStyle)
    locked: bool = False
    visible: bool = True
    # For exit markers
    exit_label: Optional[str] = None  # A, B, C, D
    arrow_direction: Optional[str] = None  # up, down, left, right, up-left, up-right, down-left, down-right
    # For line badges
    line_number: Optional[str] = None
    line_color: Optional[str] = None
    # For groups
    children: Optional[List[str]] = None  # List of child element IDs


class Project(BaseModel):
    """A signage design project"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    canvas_width: int = 2400
    canvas_height: int = 800
    background_color: str = "#FFFFFF"
    elements: List[SignageElement] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    version: str = "1.0"


class Theme(BaseModel):
    """Design theme configuration"""
    name: str
    primary_color: str = "#003DA5"  # Metro blue
    secondary_color: str = "#E31937"  # Warning red
    background_color: str = "#FFFFFF"
    text_color: str = "#333333"
    font_family: str = "Noto Sans SC, sans-serif"
    icon_style: str = "filled"  # filled, outlined
    border_radius: float = 4
    
    # Line colors for different metro lines
    line_colors: dict = Field(default_factory=lambda: {
        "1": "#C23A30",  # Line 1 - Red
        "2": "#006098",  # Line 2 - Blue
        "3": "#EF8200",  # Line 3 - Orange
        "4": "#008C95",  # Line 4 - Teal
        "5": "#A6217C",  # Line 5 - Purple
        "6": "#D29700",  # Line 6 - Yellow
        "7": "#E76021",  # Line 7 - Orange-red
        "8": "#009B77",  # Line 8 - Green
        "9": "#8FC31F",  # Line 9 - Lime
        "10": "#009AD6", # Line 10 - Light blue
    })
