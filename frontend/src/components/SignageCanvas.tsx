import { useRef, useState, useCallback } from 'react';
import { useEditorStore } from '../store';
import { SignageElement, ArrowDirection } from '../types';

export default function SignageCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    width,
    rows,
    theme,
    zoom,
    setZoom,
    selectedElementIds,
    selectElement,
    draggedElementId,
    setDraggedElement,
    dragOverIndex,
    setDragOverIndex,
    moveElement,
    sizeSettings: S,
    addRow,
    selectRow,
    selectedRowId,
    deleteRow,
    customIcons,
  } = useEditorStore();

  const [localDragIndex, setLocalDragIndex] = useState<number | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const handleZoomIn = () => setZoom(Math.min(2, zoom + 0.1));
  const handleZoomOut = () => setZoom(Math.max(0.5, zoom - 0.1));
  const handleZoomReset = () => setZoom(1);

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const isMultiSelect = e.metaKey || e.shiftKey || e.ctrlKey;
    selectElement(elementId, isMultiSelect);
  };

  const handleCanvasClick = () => {
    // Do not clear selection here, as we want to keep row selection
    // selectElement(null);
  };

  const handleRowClick = (e: React.MouseEvent, rowId: string) => {
    e.stopPropagation();
    selectRow(rowId);
    selectElement(null); // Deselect element when clicking on row background
  };

  const handleDragStart = (e: React.DragEvent, elementId: string, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedElement(elementId);
    setLocalDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedElementId && localDragIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, rowId: string, dropIndex: number) => {
    e.preventDefault();
    if (draggedElementId && localDragIndex !== null && localDragIndex !== dropIndex) {
      moveElement(rowId, localDragIndex, dropIndex);
    }
    setDraggedElement(null);
    setDragOverIndex(null);
    setLocalDragIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedElement(null);
    setDragOverIndex(null);
    setLocalDragIndex(null);
  };

  const getGapWidth = (gap?: string) => {
    switch (gap) {
      case 'none': return 0;
      case 'small': return S.gapSmall;
      case 'large': return S.gapLarge;
      default: return S.gapNormal;
    }
  };

  const getFontFamily = (type: 'cn' | 'en') => {
    const setting = type === 'cn' ? S.fontFamilyCn : S.fontFamilyEn;
    if (setting === 'simhei') return 'SimHei';
    if (setting === 'arial') return 'Arial';
    return type === 'cn' ? theme.fontFamily : theme.fontFamilyEn;
  };

  const currentFontFamily = getFontFamily('cn');
  const currentFontFamilyEn = getFontFamily('en');

  const renderElement = useCallback((element: SignageElement, index: number, rowId: string) => {
    const isSelected = selectedElementIds.includes(element.id);
    const isDragging = draggedElementId === element.id;
    const isDragOver = dragOverIndex === index;
    
    // Find spacer index in the current row
    const row = rows.find(r => r.id === rowId);
    // Find the last spacer index to ensure only elements after the LAST spacer are right-aligned
    let spacerIndex = -1;
    if (row) {
      for (let i = row.elements.length - 1; i >= 0; i--) {
        if (row.elements[i].type === 'spacer') {
          spacerIndex = i;
          break;
        }
      }
    }
    const isAfterSpacer = spacerIndex !== -1 && index > spacerIndex;

    let className = 'signage-element';
    if (isSelected) className += ' selected';
    if (isDragging) className += ' dragging';
    if (isDragOver && localDragIndex !== null) {
      className += localDragIndex < index ? ' drag-over-right' : ' drag-over-left';
    }

    const style: React.CSSProperties = {
      marginRight: getGapWidth(element.gapAfter)
    };

    if (element.type === 'spacer') {
      style.flex = 1;
      style.minWidth = '20px';
      style.cursor = 'default';
    }

    return (
      <div
        key={element.id}
        className={className}
        style={style}
        draggable
        onClick={(e) => handleElementClick(e, element.id)}
        onDragStart={(e) => handleDragStart(e, element.id, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, rowId, index)}
        onDragEnd={handleDragEnd}
      >
        {renderElementContent(element, isAfterSpacer)}
      </div>
    );
  }, [selectedElementIds, draggedElementId, dragOverIndex, localDragIndex, theme, rows]);

  const renderElementContent = (element: SignageElement, isAfterSpacer: boolean) => {
    switch (element.type) {
      case 'exit':
        return (
          <div 
            className="el-exit"
            style={{ 
              width: S.exitSize,
              height: S.exitSize,
              backgroundColor: S.exitFillColor, 
              color: S.exitTextColor,
              borderColor: S.exitTextColor,
              borderWidth: S.exitBorderWidth,
              fontSize: S.exitFontSize,
              fontWeight: S.exitFontWeight || 700,
              fontFamily: currentFontFamilyEn,
            }}
          >
            {element.exitLabel || 'A'}
          </div>
        );

      case 'line_badge':
        const radius = S.lineBadgeRadius;
        const hasStroke = element.badgeStroke ?? false;
        const strokeColor = element.badgeStrokeColor || '#000000';
        const strokeWidth = element.badgeStrokeWidth ?? 2;
        const textWhite = element.badgeTextWhite ?? true;
        
        // Calculate scale if compression is enabled
        let contentScale = 1;
        const contentText = element.lineNumber || '1';
        if (element.badgeCompress && contentText.length > 1) {
          // Simple heuristic: scale down based on character count
          // 2 chars -> ~0.75, 3 chars -> ~0.55, etc.
          // Or calculate based on estimated width vs container width
          // Container width: S.lineBadgeWidth
          // Estimated char width: S.lineBadgeFontSize * 0.6
          const estimatedWidth = contentText.length * S.lineBadgeFontSize * 0.6;
          const maxWidth = S.lineBadgeWidth * 0.8; // Leave some padding
          if (estimatedWidth > maxWidth) {
            contentScale = maxWidth / estimatedWidth;
          }
        }

        return (
          <div 
            className="el-line-badge"
            style={{ 
              width: S.lineBadgeWidth,
              height: S.lineBadgeHeight,
              backgroundColor: element.lineColor,
              borderRadius: radius,
              fontSize: S.lineBadgeFontSize,
              fontWeight: S.lineBadgeFontWeight || 700,
              color: textWhite ? '#FFFFFF' : '#000000',
              border: hasStroke ? `${strokeWidth}px solid ${strokeColor}` : 'none',
              fontFamily: currentFontFamilyEn,
            }}
          >
            <span style={{ 
              display: 'inline-block',
              transform: contentScale < 1 ? `scaleX(${contentScale})` : 'none',
              transformOrigin: 'center',
              whiteSpace: 'nowrap'
            }}>
              {contentText}
            </span>
          </div>
        );

      case 'text':
        let alignItems = element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start';
        
        // Auto-adjust alignment if after spacer
        if (isAfterSpacer) {
          alignItems = 'flex-end';
        }
        
        // Determine text colors based on mode
        let primaryColor = theme.primaryColor;
        let secondaryColor = theme.secondaryColor;
        
        if (element.colorMode === 'exit') {
          primaryColor = S.exitFillColor;
          secondaryColor = S.exitFillColor;
        } else if (element.colorMode === 'custom' && element.customColor) {
          primaryColor = element.customColor;
          secondaryColor = element.customColor;
        }

        return (
          <div className="el-text" style={{ alignItems }}>
            <span 
              className="cn" 
              style={{ 
                fontFamily: currentFontFamily,
                fontSize: element.fontSize ?? S.textCnFontSize,
                fontWeight: element.fontWeight ?? (S.textCnFontWeight || 600),
                color: primaryColor,
              }}
            >
              {element.content || '文字'}
            </span>
            {element.contentEn && (
              <span 
                className="en" 
                style={{ 
                  fontFamily: currentFontFamilyEn, 
                  fontSize: S.textEnFontSize,
                  fontWeight: S.textEnFontWeight || 500,
                  color: secondaryColor,
                  marginTop: S.textLineGap,
                }}
              >
                {element.contentEn}
              </span>
            )}
          </div>
        );

      case 'large_text':
        let ltAlignItems = element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start';
        
        // Auto-adjust alignment if after spacer
        if (isAfterSpacer) {
          ltAlignItems = 'flex-end';
        }
        
        // Determine text colors based on mode
        let ltColor = theme.primaryColor;
        
        if (element.colorMode === 'exit') {
          ltColor = S.exitFillColor;
        } else if (element.colorMode === 'custom' && element.customColor) {
          ltColor = element.customColor;
        }

        return (
          <div className="el-text" style={{ alignItems: ltAlignItems }}>
            <span 
              className="cn" 
              style={{ 
                fontFamily: currentFontFamily,
                fontSize: element.fontSize ?? S.largeTextFontSize,
                fontWeight: element.fontWeight ?? (S.largeTextFontWeight || 600),
                color: ltColor,
                lineHeight: 1,
              }}
            >
              {element.content || '大文字'}
            </span>
          </div>
        );


      case 'arrow':
        let arrowColor = theme.primaryColor;
        if (element.colorMode === 'exit') {
          arrowColor = S.exitFillColor;
        } else if (element.colorMode === 'custom' && element.customColor) {
          arrowColor = element.customColor;
        }

        return (
          <div 
            className="el-arrow"
            style={{ 
              width: S.arrowSize,
              height: S.arrowSize,
            }}
          >
            {renderArrow(element.arrowDirection || 'up', arrowColor)}
          </div>
        );

      case 'icon':
        return (
          <div
            className="el-icon"
            style={{
              width: S.iconSize,
              height: S.iconSize,
            }}
          >
            {renderIcon(element.iconName || 'elevator', theme.primaryColor, element.iconBackgroundColor, element.iconPadding)}
          </div>
        );

      case 'divider':
        return (
          <div 
            className="el-divider"
            style={{ 
              width: S.dividerWidth,
              height: S.dividerHeight,
              backgroundColor: theme.primaryColor,
            }}
          />
        );

      case 'spacer':
        return (
          <div 
            className="el-spacer"
            style={{ 
              width: '100%',
              height: '100%',
              minHeight: '20px',
            }}
          />
        );

      default:
        return <div>未知元素</div>;
    }
  };

  const renderArrow = (direction: ArrowDirection, color: string) => {
    const size = S.arrowSize;
    const sw = S.arrowStrokeWidth;
    const m = 4;
    
    const getArrowPath = () => {
      switch (direction) {
        case 'up':
          return `M${size/2},${m} L${size/2},${size-m} M${m+2},${size/2-2} L${size/2},${m} L${size-m-2},${size/2-2}`;
        case 'down':
          return `M${size/2},${size-m} L${size/2},${m} M${m+2},${size/2+2} L${size/2},${size-m} L${size-m-2},${size/2+2}`;
        case 'left':
          return `M${m},${size/2} L${size-m},${size/2} M${size/2-2},${m+2} L${m},${size/2} L${size/2-2},${size-m-2}`;
        case 'right':
          return `M${size-m},${size/2} L${m},${size/2} M${size/2+2},${m+2} L${size-m},${size/2} L${size/2+2},${size-m-2}`;
        case 'up-left':
          return `M${m+2},${m+2} L${size-m-2},${size-m-2} M${m+2},${size/2-2} L${m+2},${m+2} L${size/2-2},${m+2}`;
        case 'up-right':
          return `M${size-m-2},${m+2} L${m+2},${size-m-2} M${size/2+2},${m+2} L${size-m-2},${m+2} L${size-m-2},${size/2-2}`;
        case 'down-left':
          return `M${m+2},${size-m-2} L${size-m-2},${m+2} M${m+2},${size/2+2} L${m+2},${size-m-2} L${size/2-2},${size-m-2}`;
        case 'down-right':
          return `M${size-m-2},${size-m-2} L${m+2},${m+2} M${size/2+2},${size-m-2} L${size-m-2},${size-m-2} L${size-m-2},${size/2+2}`;
        default:
          return `M${size/2},${m} L${size/2},${size-m} M${m+2},${size/2-2} L${size/2},${m} L${size-m-2},${size/2-2}`;
      }
    };

    return (
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <path 
          d={getArrowPath()} 
          stroke={color} 
          strokeWidth={sw} 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  };

  const renderIcon = (iconName: string, color: string, bgColor?: string, padding: number = 3) => {
    const size = S.iconSize;
    const r = S.iconRadius;
    const actualBgColor = bgColor === 'transparent' ? 'none' : (bgColor || color);

    // Scale for padding
    // padding=0 -> scale=1
    // padding=X -> scale down. Let's say padding is px from edge.
    // Box is 36x36. Padding P means content fits in (36-2P)x(36-2P).
    // Scale = (36-2P)/36
    const scale = Math.max(0, (36 - 2 * padding) / 36);
    const center = 18;
    
    const contentTransform = `translate(${center}, ${center}) scale(${scale}) translate(-${center}, -${center})`;
    
    // Default icons usually use theme.backgroundColor (white/black) on top of primary color rect.
    // If bgColor is transparent, we probably want the icon to be the primary color?
    // Let's standardize:
    // renderIcon called with: element.iconName, theme.primaryColor (as color arg)
    // We need to decide what fill to use for the paths.
    
    // Wait, if user sets a custom bg color, what should the icon color be?
    // Usually white if bg is dark.
    // If user sets transparent bg, icon should be visible (primary color).
    
    // Let's refine logic:
    // 1. Bg Rect: fill = actualBgColor
    // 2. Icon Path: fill = ?
    //    - If bg is 'transparent', use 'color' (primary color passed in).
    //    - If bg is set (but not transparent), use 'white' (assuming colored bg) OR maybe we need an icon color prop?
    //      For now, let's stick to: if custom bg -> white icon. If default (primary) bg -> theme background color (white/black).
    
    const iconFill = bgColor === 'transparent' ? color : (bgColor ? '#FFFFFF' : theme.backgroundColor);
    
    switch (iconName) {
      case 'elevator':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size}>
            <rect width="36" height="36" rx={r} fill={actualBgColor}/>
            <g transform={contentTransform}>
              {/* Scaled up for 0-padding full bleed */}
              <text x="18" y="26" fontSize="26" fontWeight="600" fill={iconFill} textAnchor="middle" fontFamily="Arial">E</text>
            </g>
          </svg>
        );
      case 'escalator':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size}>
            <rect width="36" height="36" rx={r} fill={actualBgColor}/>
            <g transform={`${contentTransform} scale(1.4) translate(-7.2, -7.2)`}>
               {/* Original path centered roughly at 18,18. Scaling around center. */}
               {/* Instead of complex transform, let's just use a larger path or transform group */}
            </g>
             {/* Re-do transform manually for cleaner code */}
            <g transform={contentTransform}>
                <g transform="translate(18, 18) scale(1.5) translate(-18, -18)">
                  <path d="M6,28 L18,8 L30,8 L30,14 L22,14 L12,28 Z" fill={iconFill}/>
                </g>
            </g>
          </svg>
        );
      case 'restroom':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size}>
            <rect width="36" height="36" rx={r} fill={actualBgColor}/>
            <g transform={contentTransform}>
                <g transform="translate(18, 18) scale(1.3) translate(-18, -18)">
                  <circle cx="12" cy="9" r="3.5" fill={iconFill}/>
                  <rect x="8" y="14" width="8" height="14" rx="1" fill={iconFill}/>
                  <circle cx="24" cy="9" r="3.5" fill={iconFill}/>
                  <path d="M18,14 L24,30 L30,14" fill={iconFill}/>
                </g>
            </g>
          </svg>
        );
      case 'accessible':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size}>
            {/* Accessible icon has specific colors usually, but let's try to adapt */}
            <rect width="36" height="36" rx={r} fill={actualBgColor === 'none' ? 'none' : (bgColor || '#2196F3')}/>
            <g transform={contentTransform}>
               {/* Accessible icon is already quite large (r=17) */}
               {bgColor === 'transparent' ? (
                 <g>
                   <circle cx="18" cy="18" r="17" fill="none" stroke={color} strokeWidth="2"/>
                   <circle cx="15" cy="9" r="3" fill={color}/>
                   <path d="M13,14 L13,21 L20,21 L23,29 L28,26" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                 </g>
               ) : (
                 <g>
                   {!bgColor && <circle cx="18" cy="18" r="17" fill="#2196F3"/>}
                   <circle cx="15" cy="9" r="3" fill="white"/>
                   <path d="M13,14 L13,21 L20,21 L23,29 L28,26" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                 </g>
               )}
            </g>
          </svg>
        );
      case 'atm':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size}>
            <rect width="36" height="36" rx={r} fill={actualBgColor === 'none' ? 'none' : (bgColor || '#4CAF50')}/>
            <g transform={contentTransform}>
              <text x="18" y="23" fontSize="14" fontWeight="bold" fill={bgColor ? iconFill : 'white'} textAnchor="middle" fontFamily="Arial">ATM</text>
            </g>
          </svg>
        );
      case 'ticket':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size}>
            <rect width="36" height="36" rx={r} fill={actualBgColor}/>
            <g transform={contentTransform}>
              <g transform="translate(18, 18) scale(1.3) translate(-18, -18)">
                <rect x="6" y="12" width="24" height="12" rx="2" fill={iconFill}/>
                <circle cx="6" cy="18" r="3" fill={actualBgColor === 'none' ? 'currentColor' : actualBgColor}/>
                <circle cx="30" cy="18" r="3" fill={actualBgColor === 'none' ? 'currentColor' : actualBgColor}/>
              </g>
            </g>
          </svg>
        );
      case 'info':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size}>
            <rect width="36" height="36" rx={r} fill={actualBgColor}/>
            <g transform={contentTransform}>
              <g transform="translate(18, 18) scale(1.5) translate(-18, -18)">
                <circle cx="18" cy="12" r="3" fill={iconFill}/>
                <rect x="15" y="17" width="6" height="11" rx="1" fill={iconFill}/>
              </g>
            </g>
          </svg>
        );
      default:
        // Check for custom icon
        const customIcon = customIcons.find(c => c.id === iconName);
        if (customIcon) {
          const isSvgString = customIcon.content.trim().startsWith('<svg') || customIcon.content.trim().startsWith('<?xml');
          
          // Apply padding to custom icon container
          const paddingPx = (padding / 36) * size;
          
          return (
             <div style={{ position: 'relative', width: size, height: size }}>
                 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0 }}>
                    <rect width={size} height={size} rx={r} fill={actualBgColor} />
                 </svg>
                 <div style={{ 
                     position: 'absolute', 
                     top: paddingPx, 
                     left: paddingPx, 
                     width: size - 2 * paddingPx, 
                     height: size - 2 * paddingPx, 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                 }}>
                     {isSvgString ? (
                        <div 
                            dangerouslySetInnerHTML={{ __html: customIcon.content }}
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}
                        />
                     ) : (
                        <img 
                            src={customIcon.content} 
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain' 
                            }} 
                        />
                     )}
                 </div>
             </div>
          );
        }

        return (
          <svg viewBox="0 0 36 36" width={size} height={size}>
            <rect width="36" height="36" rx={r} fill={actualBgColor}/>
          </svg>
        );
    }
  };

  return (
    <div className="canvas-area" onClick={handleCanvasClick}>
      <div className="canvas-controls">
        <div className="zoom-controls">
          <button className="btn-icon" onClick={handleZoomOut} title="缩小">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span 
            className="zoom-value" 
            onClick={handleZoomReset}
            style={{ cursor: 'pointer' }}
            title="重置缩放"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button className="btn-icon" onClick={handleZoomIn} title="放大">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </div>
        
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          {width}px · {rows.reduce((sum, r) => sum + r.elements.length, 0)} 个元素
        </span>
      </div>

      <div 
        ref={containerRef}
        className="signage-container"
        style={{ transform: `scale(${zoom})`, display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}
      >
        {rows.map((row) => {
          // Highlight row if it is selected or contains a selected element
          const isRowActive = selectedRowId === row.id || row.elements.some(e => selectedElementIds.includes(e.id));
          
          return (
            <div
              key={row.id}
              className="signage-wrapper"
              style={{ position: 'relative', paddingLeft: 40, paddingRight: 40 }}
              onClick={(e) => handleRowClick(e, row.id)}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
            >
              {/* Active Indicator */}
              {isRowActive && (
                <div 
                  className="active-indicator"
                  style={{
                    position: 'absolute',
                    top: -4,
                    left: 36, // Adjust for padding (40 - 4)
                    right: 36,
                    bottom: -4,
                    border: '2px solid var(--accent-primary)',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    zIndex: 20,
                  }}
                />
              )}
              
              {/* Delete button for rows (only if more than 1) */}
              {rows.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这个导视牌吗？')) {
                      deleteRow(row.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#ff4d4f',
                    color: 'white',
                    cursor: 'pointer',
                    opacity: hoveredRowId === row.id ? 1 : 0,
                    pointerEvents: hoveredRowId === row.id ? 'auto' : 'none',
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    zIndex: 100,
                  }}
                  title="删除导视牌"
                >
                  ×
                </button>
              )}

              <div
                className="signage-board"
                style={{ 
                  width, 
                  backgroundColor: row.backgroundColor,
                  height: S.signageHeight,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  className="padding-guide"
                  style={{
                    position: 'absolute',
                    top: S.signagePaddingV,
                    bottom: S.signagePaddingV,
                    left: S.signagePaddingH,
                    right: S.signagePaddingH,
                    border: '1px dashed rgba(255, 0, 0, 0.3)',
                    pointerEvents: 'none',
                    zIndex: 10,
                    opacity: hoveredRowId === row.id ? 1 : 0,
                  }}
                />
                <div 
                  className="signage-row"
                  style={{
                    padding: `${S.signagePaddingV}px ${S.signagePaddingH}px`,
                    height: S.signageHeight,
                    overflow: 'visible',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {row.elements.length === 0 ? (
                    <div className="empty-hint">
                      点击左侧元素添加，拖动可调整顺序
                    </div>
                  ) : (
                    row.elements.map((element, index) => 
                      renderElement(element, index, row.id)
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Add Row Button */}
        <button
          onClick={addRow}
          className="add-row-btn"
          style={{
            width: width,
            height: 40,
            border: '2px dashed var(--border-color)',
            borderRadius: '4px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.color = 'var(--accent-primary)';
            e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span> 添加导视牌
        </button>
      </div>
    </div>
  );
}
