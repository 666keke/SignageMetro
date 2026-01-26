"""
Export functions for Metro Signage Generator
"""
from pathlib import Path
from typing import Optional
import io

# SVG generation helpers
def generate_svg_content(project: dict) -> str:
    """Generate SVG content from project data"""
    width = project.get("canvas_width", 2400)
    height = project.get("canvas_height", 800)
    bg_color = project.get("background_color", "#FFFFFF")
    elements = project.get("elements", [])
    
    svg_parts = [
        f'<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        f'  <rect width="100%" height="100%" fill="{bg_color}"/>',
    ]
    
    for elem in elements:
        if not elem.get("visible", True):
            continue
        
        svg_elem = render_element_to_svg(elem)
        if svg_elem:
            svg_parts.append(svg_elem)
    
    svg_parts.append('</svg>')
    return '\n'.join(svg_parts)


def render_element_to_svg(elem: dict) -> Optional[str]:
    """Render a single element to SVG"""
    elem_type = elem.get("type")
    x = elem.get("x", 0)
    y = elem.get("y", 0)
    width = elem.get("width", 100)
    height = elem.get("height", 50)
    rotation = elem.get("rotation", 0)
    style = elem.get("style", {})
    
    transform = ""
    if rotation != 0:
        cx = x + width / 2
        cy = y + height / 2
        transform = f' transform="rotate({rotation} {cx} {cy})"'
    
    fill = style.get("fill", "#333333")
    stroke = style.get("stroke", "transparent")
    stroke_width = style.get("stroke_width", 0)
    opacity = style.get("opacity", 1.0)
    border_radius = style.get("border_radius", 0)
    
    style_attr = f'fill="{fill}" stroke="{stroke}" stroke-width="{stroke_width}" opacity="{opacity}"'
    
    if elem_type == "rect":
        if border_radius > 0:
            return f'  <rect x="{x}" y="{y}" width="{width}" height="{height}" rx="{border_radius}" {style_attr}{transform}/>'
        return f'  <rect x="{x}" y="{y}" width="{width}" height="{height}" {style_attr}{transform}/>'
    
    elif elem_type == "text":
        content = elem.get("content", "")
        font_family = style.get("font_family", "Noto Sans SC, sans-serif")
        font_size = style.get("font_size", 24)
        font_weight = style.get("font_weight", "normal")
        text_anchor = "middle" if style.get("text_align") == "center" else "start"
        
        text_x = x + width / 2 if text_anchor == "middle" else x
        text_y = y + height / 2 + font_size / 3
        
        return f'  <text x="{text_x}" y="{text_y}" font-family="{font_family}" font-size="{font_size}" font-weight="{font_weight}" fill="{fill}" text-anchor="{text_anchor}" opacity="{opacity}"{transform}>{content}</text>'
    
    elif elem_type == "exit":
        exit_label = elem.get("exit_label", "A")
        arrow_dir = elem.get("arrow_direction", "up")
        
        # Create exit marker with label and arrow
        svg_group = [f'  <g{transform}>']
        
        # Background circle
        cx = x + width / 2
        cy = y + height / 2
        radius = min(width, height) / 2 - 2
        svg_group.append(f'    <circle cx="{cx}" cy="{cy}" r="{radius}" fill="#FFC107" stroke="#333" stroke-width="2"/>')
        
        # Exit label
        svg_group.append(f'    <text x="{cx}" y="{cy + 8}" font-family="Arial, sans-serif" font-size="{int(radius)}" font-weight="bold" fill="#333" text-anchor="middle">{exit_label}</text>')
        
        # Arrow
        arrow_svg = get_arrow_svg(arrow_dir, x + width + 10, y, 30, 30, "#333")
        svg_group.append(arrow_svg)
        
        svg_group.append('  </g>')
        return '\n'.join(svg_group)
    
    elif elem_type == "line_badge":
        line_number = elem.get("line_number", "1")
        line_color = elem.get("line_color", "#C23A30")
        
        svg_group = [f'  <g{transform}>']
        
        # Rounded rectangle background
        svg_group.append(f'    <rect x="{x}" y="{y}" width="{width}" height="{height}" rx="8" fill="{line_color}"/>')
        
        # Line number
        text_x = x + width / 2
        text_y = y + height / 2 + 8
        svg_group.append(f'    <text x="{text_x}" y="{text_y}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">{line_number}</text>')
        
        svg_group.append('  </g>')
        return '\n'.join(svg_group)
    
    elif elem_type == "arrow":
        direction = elem.get("arrow_direction", "up")
        return get_arrow_svg(direction, x, y, width, height, fill)
    
    elif elem_type == "icon":
        icon_name = elem.get("content", "elevator")
        return get_icon_svg(icon_name, x, y, width, height, fill)
    
    return None


def get_arrow_svg(direction: str, x: float, y: float, width: float, height: float, fill: str) -> str:
    """Generate arrow SVG based on direction"""
    cx = x + width / 2
    cy = y + height / 2
    size = min(width, height) * 0.8
    
    # Arrow pointing up as base
    if direction == "up":
        points = f"{cx},{cy - size/2} {cx - size/2},{cy + size/2} {cx + size/2},{cy + size/2}"
    elif direction == "down":
        points = f"{cx},{cy + size/2} {cx - size/2},{cy - size/2} {cx + size/2},{cy - size/2}"
    elif direction == "left":
        points = f"{cx - size/2},{cy} {cx + size/2},{cy - size/2} {cx + size/2},{cy + size/2}"
    elif direction == "right":
        points = f"{cx + size/2},{cy} {cx - size/2},{cy - size/2} {cx - size/2},{cy + size/2}"
    elif direction == "up-left":
        points = f"{cx - size/2},{cy - size/2} {cx + size/2},{cy - size/2} {cx - size/2},{cy + size/2}"
    elif direction == "up-right":
        points = f"{cx + size/2},{cy - size/2} {cx - size/2},{cy - size/2} {cx + size/2},{cy + size/2}"
    elif direction == "down-left":
        points = f"{cx - size/2},{cy + size/2} {cx + size/2},{cy + size/2} {cx - size/2},{cy - size/2}"
    elif direction == "down-right":
        points = f"{cx + size/2},{cy + size/2} {cx - size/2},{cy + size/2} {cx + size/2},{cy - size/2}"
    else:
        points = f"{cx},{cy - size/2} {cx - size/2},{cy + size/2} {cx + size/2},{cy + size/2}"
    
    return f'    <polygon points="{points}" fill="{fill}"/>'


def get_icon_svg(icon_name: str, x: float, y: float, width: float, height: float, fill: str) -> str:
    """Generate icon SVG based on icon name"""
    # Simplified icons - in production, these would be more detailed SVG paths
    icons = {
        "elevator": f'''  <g transform="translate({x},{y})">
    <rect width="{width}" height="{height}" fill="none"/>
    <rect x="{width*0.2}" y="{height*0.1}" width="{width*0.6}" height="{height*0.8}" rx="4" fill="{fill}"/>
    <text x="{width/2}" y="{height*0.65}" font-family="Arial" font-size="{height*0.35}" fill="white" text-anchor="middle">E</text>
  </g>''',
        "escalator": f'''  <g transform="translate({x},{y})">
    <rect width="{width}" height="{height}" fill="none"/>
    <path d="M{width*0.1},{height*0.8} L{width*0.5},{height*0.2} L{width*0.9},{height*0.2} L{width*0.9},{height*0.4} L{width*0.6},{height*0.4} L{width*0.3},{height*0.8} Z" fill="{fill}"/>
  </g>''',
        "accessible": f'''  <g transform="translate({x},{y})">
    <circle cx="{width/2}" cy="{height/2}" r="{min(width,height)*0.45}" fill="#2196F3"/>
    <circle cx="{width*0.45}" cy="{height*0.25}" r="{height*0.08}" fill="white"/>
    <path d="M{width*0.4},{height*0.35} L{width*0.4},{height*0.55} L{width*0.55},{height*0.55} L{width*0.6},{height*0.75} L{width*0.75},{height*0.7}" stroke="white" stroke-width="3" fill="none"/>
  </g>''',
        "restroom": f'''  <g transform="translate({x},{y})">
    <rect width="{width}" height="{height}" fill="none"/>
    <circle cx="{width*0.3}" cy="{height*0.2}" r="{height*0.1}" fill="{fill}"/>
    <rect x="{width*0.2}" y="{height*0.35}" width="{width*0.2}" height="{height*0.4}" fill="{fill}"/>
    <circle cx="{width*0.7}" cy="{height*0.2}" r="{height*0.1}" fill="{fill}"/>
    <path d="M{width*0.55},{height*0.35} L{width*0.7},{height*0.75} L{width*0.85},{height*0.35}" fill="{fill}"/>
  </g>''',
        "convenience_store": f'''  <g transform="translate({x},{y})">
    <rect x="{width*0.1}" y="{height*0.2}" width="{width*0.8}" height="{height*0.7}" rx="4" fill="{fill}"/>
    <text x="{width/2}" y="{height*0.65}" font-family="Arial" font-size="{height*0.25}" fill="white" text-anchor="middle">24h</text>
  </g>''',
        "atm": f'''  <g transform="translate({x},{y})">
    <rect x="{width*0.1}" y="{height*0.15}" width="{width*0.8}" height="{height*0.7}" rx="4" fill="{fill}"/>
    <text x="{width/2}" y="{height*0.6}" font-family="Arial" font-size="{height*0.25}" font-weight="bold" fill="white" text-anchor="middle">ATM</text>
  </g>''',
        "transfer": f'''  <g transform="translate({x},{y})">
    <path d="M{width*0.2},{height*0.3} L{width*0.8},{height*0.3} L{width*0.65},{height*0.15}" stroke="{fill}" stroke-width="3" fill="none"/>
    <path d="M{width*0.8},{height*0.7} L{width*0.2},{height*0.7} L{width*0.35},{height*0.85}" stroke="{fill}" stroke-width="3" fill="none"/>
  </g>''',
    }
    
    return icons.get(icon_name, icons["elevator"])


def export_to_svg(project: dict, output_path: Path) -> None:
    """Export project to SVG file"""
    svg_content = generate_svg_content(project)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)


def export_to_png(project: dict, output_path: Path, scale: float = 1.0) -> None:
    """Export project to PNG file using CairoSVG"""
    try:
        import cairosvg
        
        svg_content = generate_svg_content(project)
        width = int(project.get("canvas_width", 2400) * scale)
        height = int(project.get("canvas_height", 800) * scale)
        
        cairosvg.svg2png(
            bytestring=svg_content.encode('utf-8'),
            write_to=str(output_path),
            output_width=width,
            output_height=height,
        )
    except ImportError:
        # Fallback: save SVG first, then try PIL if available
        svg_path = output_path.with_suffix('.svg')
        export_to_svg(project, svg_path)
        
        try:
            from PIL import Image
            # Note: PIL doesn't directly support SVG, would need additional handling
            raise NotImplementedError("PNG export requires CairoSVG")
        except ImportError:
            raise NotImplementedError("PNG export requires CairoSVG or Pillow")
