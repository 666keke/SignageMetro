import { useEditorStore } from '../store';
import { WIDTH_PRESETS, THEMES, ArrowDirection } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function Header() {
  const { 
    projectName,
    setProjectName,
    width,
    setWidthPreset,
    theme,
    setTheme,
    undo, 
    redo,
    clearAll,
    exportToJSON,
    importFromJSON,
    rows,
    sizeSettings,
    setShowSettings,
    customIcons,
  } = useEditorStore();

  const svgToPngBlob = (svgString: string, w: number, h: number, scale: number): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = w * scale;
      canvas.height = h * scale;
      
      img.onload = () => {
        if (ctx) {
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        } else {
            resolve(null);
        }
      };
      
      img.onerror = () => resolve(null);
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(blob);
    });
  };

  const handleExportSVG = async () => {
    let fontBase64SimHei = '';
    let fontBase64Arial = '';
    
    // Load SimHei if needed
    if (S.fontFamilyCn === 'simhei' || S.fontFamilyEn === 'simhei') {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}fonts/simhei.ttf`);
        const blob = await response.blob();
        const reader = new FileReader();
        fontBase64SimHei = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Failed to load SimHei font', e);
      }
    }
    
    // Load Arial if needed
    if (S.fontFamilyCn === 'arial' || S.fontFamilyEn === 'arial') {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}fonts/arial.ttf`);
        const blob = await response.blob();
        const reader = new FileReader();
        fontBase64Arial = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Failed to load Arial font', e);
      }
    }

    if (rows.length > 1) {
      const zip = new JSZip();
      
      // Combined
      const combinedSVG = generateSVG(rows, fontBase64SimHei, fontBase64Arial);
      zip.file(`${projectName}_combined.svg`, combinedSVG);
      
      // Individual
      rows.forEach((row, index) => {
        const singleRowSVG = generateSVG([row], fontBase64SimHei, fontBase64Arial);
        zip.file(`${projectName}_${index + 1}.svg`, singleRowSVG);
      });
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${projectName}.zip`);
    } else {
      const svg = generateSVG(rows, fontBase64SimHei, fontBase64Arial);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExportPNG = async () => {
    let fontBase64SimHei = '';
    let fontBase64Arial = '';
    
    // Load SimHei if needed
    if (S.fontFamilyCn === 'simhei' || S.fontFamilyEn === 'simhei') {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}fonts/simhei.ttf`);
        const blob = await response.blob();
        const reader = new FileReader();
        fontBase64SimHei = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Failed to load SimHei font', e);
      }
    }
    
    // Load Arial if needed
    if (S.fontFamilyCn === 'arial' || S.fontFamilyEn === 'arial') {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}fonts/arial.ttf`);
        const blob = await response.blob();
        const reader = new FileReader();
        fontBase64Arial = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Failed to load Arial font', e);
      }
    }

    if (rows.length > 1) {
      const zip = new JSZip();
      
      // Combined
      const combinedSVG = generateSVG(rows, fontBase64SimHei, fontBase64Arial);
      const ROW_GAP = 20;
      const totalHeight = rows.length * sizeSettings.signageHeight + (rows.length > 1 ? (rows.length - 1) * ROW_GAP : 0);
      const combinedBlob = await svgToPngBlob(combinedSVG, width, totalHeight, 3);
      if (combinedBlob) zip.file(`${projectName}_combined.png`, combinedBlob);
      
      // Individual
      for (let i = 0; i < rows.length; i++) {
        const rowSVG = generateSVG([rows[i]], fontBase64SimHei, fontBase64Arial);
        const rowBlob = await svgToPngBlob(rowSVG, width, sizeSettings.signageHeight, 3);
        if (rowBlob) zip.file(`${projectName}_${i + 1}.png`, rowBlob);
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${projectName}.zip`);
    } else {
      const svg = generateSVG(rows, fontBase64SimHei, fontBase64Arial);
      const ROW_GAP = 20;
      const totalHeight = rows.length * sizeSettings.signageHeight + (rows.length > 1 ? (rows.length - 1) * ROW_GAP : 0);
      const blob = await svgToPngBlob(svg, width, totalHeight, 3);
      if (blob) {
        saveAs(blob, `${projectName}.png`);
      }
    }
  };

  const S = sizeSettings; // Alias for convenience
  
  const measureTextWidth = (text: string, fontSize: number, fontFamily: string, fontWeight: string | number = 'normal') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      return ctx.measureText(text).width;
    }
    return text.length * fontSize;
  };

  const getGapWidth = (gap?: string) => {
    switch (gap) {
      case 'none': return 0;
      case 'small': return S.gapSmall;
      case 'large': return S.gapLarge;
      default: return S.gapNormal;
    }
  };

  const generateSVG = (targetRows: typeof rows, fontBase64SimHei?: string, fontBase64Arial?: string) => {
    const ROW_GAP = 20; // Gap between signage boards in export
    const totalHeight = targetRows.length * S.signageHeight + (targetRows.length > 1 ? (targetRows.length - 1) * ROW_GAP : 0);

    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">\n`;
    
    const getFontFamily = (type: 'cn' | 'en') => {
      const setting = type === 'cn' ? S.fontFamilyCn : S.fontFamilyEn;
      if (setting === 'simhei') return 'SimHei';
      if (setting === 'arial') return 'Arial';
      return type === 'cn' ? (theme.fontFamily || '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif') : (theme.fontFamilyEn || '"Helvetica Neue", Arial, sans-serif');
    };

    const currentFontFamily = getFontFamily('cn');
    const currentFontFamilyEn = getFontFamily('en');
    const absoluteAssetBaseUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;

    svg += `  <style>\n`;
    
    // Embed SimHei
    if (fontBase64SimHei) {
       svg += `    @font-face { font-family: 'SimHei'; src: url('${fontBase64SimHei}') format('truetype'); }\n`;
    } else if (S.fontFamilyCn === 'simhei' || S.fontFamilyEn === 'simhei') {
       svg += `    @font-face { font-family: 'SimHei'; src: url('${absoluteAssetBaseUrl}fonts/simhei.ttf') format('truetype'); }\n`;
    }
    
    // Embed Arial
    if (fontBase64Arial) {
       svg += `    @font-face { font-family: 'Arial'; src: url('${fontBase64Arial}') format('truetype'); }\n`;
    } else if (S.fontFamilyCn === 'arial' || S.fontFamilyEn === 'arial') {
       svg += `    @font-face { font-family: 'Arial'; src: url('${absoluteAssetBaseUrl}fonts/arial.ttf') format('truetype'); }\n`;
    }

    svg += `    .cn { font-family: ${currentFontFamily}; }\n`;
    svg += `    .en { font-family: ${currentFontFamilyEn}; }\n`;
    svg += `  </style>\n`;
    
    let yOffset = 0;
    let rowIdx = 0;
    
    for (const row of targetRows) {
      const clipId = `clip-row-${rowIdx}`;
      svg += `  <defs><clipPath id="${clipId}"><rect x="0" y="${yOffset}" width="${width}" height="${S.signageHeight}"/></clipPath></defs>\n`;
      svg += `  <g clip-path="url(#${clipId})">\n`;
      svg += `    <rect x="0" y="${yOffset}" width="${width}" height="${S.signageHeight}" fill="${row.backgroundColor}"/>\n`;
      
      let xOffset = S.signagePaddingH;
      const cy = yOffset + S.signageHeight / 2;
      
      // Calculate spacer width for this row
      let totalFixedContentWidth = S.signagePaddingH * 2;
      let spacerCount = 0;
      
      for (const el of row.elements) {
        if (el.type === 'spacer') {
          spacerCount++;
          totalFixedContentWidth += getGapWidth(el.gapAfter);
        } else {
          totalFixedContentWidth += getElementWidth(el, currentFontFamily, currentFontFamilyEn) + getGapWidth(el.gapAfter);
        }
      }
      
      const availableSpace = width - totalFixedContentWidth;
      const spacerWidth = spacerCount > 0 ? Math.max(0, availableSpace / spacerCount) : 0;
      
      // Find last spacer index
      let lastSpacerIndex = -1;
      for (let i = row.elements.length - 1; i >= 0; i--) {
        if (row.elements[i].type === 'spacer') {
          lastSpacerIndex = i;
          break;
        }
      }

      row.elements.forEach((el, index) => {
        const isAfterSpacer = lastSpacerIndex !== -1 && index > lastSpacerIndex;
        const elWidth = el.type === 'spacer' ? spacerWidth : getElementWidth(el, currentFontFamily, currentFontFamilyEn);

        if (el.type !== 'spacer') {
          svg += renderElementToSVG(el, xOffset, cy, elWidth, isAfterSpacer);
        }
        
        xOffset += elWidth + getGapWidth(el.gapAfter);
      });
      svg += `  </g>\n`;
      
      yOffset += S.signageHeight + ROW_GAP;
      rowIdx++;
    }
    
    svg += '</svg>';
    return svg;
  };

  const getElementWidth = (el: typeof rows[0]['elements'][0], currentFontFamily: string, currentFontFamilyEn: string) => {
    switch (el.type) {
      case 'exit': return S.exitSize;
      case 'line_badge': return S.lineBadgeWidth;
      case 'icon': return S.iconSize;
      case 'arrow': return S.arrowSize;
      case 'divider': return S.dividerWidth;
      case 'text': {
        const cnWidth = measureTextWidth(el.content || '文字', el.fontSize ?? S.textCnFontSize, currentFontFamily, el.fontWeight ?? (S.textCnFontWeight || 600));
        const enWidth = el.contentEn ? measureTextWidth(el.contentEn, el.fontSizeEn ?? S.textEnFontSize, currentFontFamilyEn, S.textEnFontWeight || 500) : 0;
        return Math.max(cnWidth, enWidth);
      }
      case 'large_text': {
        return measureTextWidth(el.content || '大文字', el.fontSize ?? S.largeTextFontSize, currentFontFamily, el.fontWeight ?? (S.largeTextFontWeight || 600));
      }
      // case 'transfer': return S.transferBadgeSize + 4 + 24; // badge + gap + text
      default: return 40;
    }
  };

  const renderElementToSVG = (el: typeof rows[0]['elements'][0], x: number, cy: number, elWidth: number, isAfterSpacer: boolean = false) => {
    switch (el.type) {
      case 'exit':
        const r = S.exitSize / 2 - S.exitBorderWidth;
        return `  <g>
    <circle cx="${x + S.exitSize/2}" cy="${cy}" r="${r}" fill="${S.exitFillColor}" stroke="${S.exitTextColor}" stroke-width="${S.exitBorderWidth}"/>
    <text x="${x + S.exitSize/2}" y="${cy}" class="en" font-size="${S.exitFontSize}" font-weight="${S.exitFontWeight || 700}" fill="${S.exitTextColor}" text-anchor="middle" dominant-baseline="central">${el.exitLabel || 'A'}</text>
  </g>\n`;
      
      case 'line_badge':
        const badgeR = S.lineBadgeRadius;
        const hasStroke = el.badgeStroke ?? false;
        const strokeColor = el.badgeStrokeColor || '#000000';
        const textColor = (el.badgeTextWhite ?? true) ? '#FFFFFF' : '#000000';
        const strokeAttr = hasStroke ? ` stroke="${strokeColor}" stroke-width="2"` : '';
        
        let textLengthAttr = '';
        if (el.badgeCompress && (el.lineNumber || '1').length > 1) {
          // Compress to 80% of width
          const targetWidth = S.lineBadgeWidth * 0.8;
          textLengthAttr = ` textLength="${targetWidth}" lengthAdjust="spacingAndGlyphs"`;
        }
        
        return `  <g>
    <rect x="${x}" y="${cy - S.lineBadgeHeight/2}" width="${S.lineBadgeWidth}" height="${S.lineBadgeHeight}" rx="${badgeR}" fill="${el.lineColor}"${strokeAttr}/>
    <text x="${x + S.lineBadgeWidth/2}" y="${cy}" class="en" font-size="${S.lineBadgeFontSize}" font-weight="${S.lineBadgeFontWeight || 700}" fill="${textColor}" text-anchor="middle" dominant-baseline="central"${textLengthAttr}>${el.lineNumber || '1'}</text>
  </g>\n`;
      
      case 'large_text':
        let ltAlign = el.textAlign;
        if (isAfterSpacer) ltAlign = 'right';
        const ltAnchor = ltAlign === 'center' ? 'middle' : ltAlign === 'right' ? 'end' : 'start';
        const ltFs = el.fontSize ?? S.largeTextFontSize;
        
        let ltX = x;
        if (ltAlign === 'center') ltX = x + elWidth / 2;
        if (ltAlign === 'right') ltX = x + elWidth;

        return `  <g>
    <text x="${ltX}" y="${cy + ltFs * 0.35}" class="cn" font-size="${ltFs}" font-weight="${el.fontWeight || S.largeTextFontWeight || 600}" fill="${theme.primaryColor}" text-anchor="${ltAnchor}">${el.content || '大文字'}</text>
  </g>\n`;
      
      case 'text':
        let align = el.textAlign;
        if (isAfterSpacer) align = 'right';
        const textAnchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
        const cnFs = el.fontSize ?? S.textCnFontSize;
        const enFs = el.fontSizeEn ?? S.textEnFontSize;
        
        // Calculate vertical centering
        const hasEn = !!el.contentEn;
        const gap = hasEn ? S.textLineGap : 0;
        const totalTextHeight = cnFs + (hasEn ? gap + enFs : 0);
        
        // Start Y position (top of the text block) relative to center
        // Heuristic: 0.85 is roughly the baseline offset from top for CJK/Latin sans-serif fonts
        const baselineRatio = 0.85; 
        const startY = cy - totalTextHeight / 2;
        
        const cnY = startY + cnFs * baselineRatio;
        const enY = startY + cnFs + gap + enFs * baselineRatio;

        let textX = x;
        if (align === 'center') textX = x + elWidth / 2;
        if (align === 'right') textX = x + elWidth;

        const enText = hasEn ? `\n    <text x="${textX}" y="${enY}" class="en" font-size="${enFs}" font-weight="${S.textEnFontWeight || 500}" fill="${theme.secondaryColor}" text-anchor="${textAnchor}">${el.contentEn}</text>` : '';
        return `  <g>
    <text x="${textX}" y="${cnY}" class="cn" font-size="${cnFs}" font-weight="${el.fontWeight || S.textCnFontWeight || 600}" fill="${theme.primaryColor}" text-anchor="${textAnchor}">${el.content || '文字'}</text>${enText}
  </g>\n`;
      
      case 'arrow':
        return renderArrowSVG(el.arrowDirection || 'up', x, cy - S.arrowSize/2, theme.primaryColor);
      
      case 'icon':
        return renderIconSVG(el, x, cy - S.iconSize/2, theme.primaryColor);
      
      case 'divider':
        return `  <line x1="${x}" y1="${cy - S.dividerHeight/2}" x2="${x}" y2="${cy + S.dividerHeight/2}" stroke="${theme.primaryColor}" stroke-width="${S.dividerWidth}" opacity="0.25"/>\n`;
      
      // case 'transfer':
      //   const tBadgeR = el.badgeRadius ?? 4;
      //   const tHasStroke = el.badgeStroke ?? false;
      //   const tStrokeColor = el.badgeStrokeColor || '#000000';
      //   const tTextColor = (el.badgeTextWhite ?? true) ? '#FFFFFF' : '#000000';
      //   const tStrokeAttr = tHasStroke ? ` stroke="${tStrokeColor}" stroke-width="2"` : '';
        
      //   return `  <g>
      //     <rect x="${x}" y="${cy - 0/2}" width="${0}" height="${0}" rx="${tBadgeR}" fill="${el.lineColor || '#C23A30'}"${tStrokeAttr}/>
      //     <text x="${x + 0/2}" y="${cy + 0 * 0.35}" class="en" font-size="${0}" font-weight="bold" fill="${tTextColor}" text-anchor="middle">${el.lineNumber || '1'}</text>
      //     <text x="${x + 0 + 4}" y="${cy + 0 * 0.35}" class="cn" font-size="${0}" fill="${theme.primaryColor}">换乘</text>
      //   </g>\n`;
      
      default:
        return '';
    }
  };

  const renderArrowSVG = (direction: ArrowDirection, x: number, y: number, color: string) => {
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

    return `  <g transform="translate(${x},${y})">
    <path d="${getArrowPath()}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>\n`;
  };

  const renderIconSVG = (el: typeof rows[0]['elements'][0], x: number, y: number, color: string) => {
    const s = S.iconSize;
    const r = S.iconRadius;
    const iconName = el.iconName || 'elevator';
    const bgColor = el.iconBackgroundColor;
    const padding = el.iconPadding !== undefined ? el.iconPadding : 3;

    // Logic from SignageCanvas
    const scale = Math.max(0, (36 - 2 * padding) / 36);
    const center = 18;
    const contentTransform = `translate(${center}, ${center}) scale(${scale}) translate(-${center}, -${center})`;

    let finalBgColor = bgColor === 'transparent' ? 'none' : (bgColor || color);
    if (!bgColor && iconName === 'accessible') finalBgColor = '#2196F3';
    if (!bgColor && iconName === 'atm') finalBgColor = '#4CAF50';

    const iconFill = bgColor === 'transparent' ? color : (bgColor ? '#FFFFFF' : theme.backgroundColor);

    let content = '';

    const customIcon = customIcons.find(i => i.id === iconName);
    if (customIcon) {
        // Try to inline SVG content for better color control (currentColor)
        if (customIcon.content.trim().startsWith('<svg') || customIcon.content.trim().startsWith('<?xml')) {
             let svgContent = customIcon.content;
             // Extract viewBox
             const viewBoxMatch = svgContent.match(/viewBox=["']([\d\s.-]+)["']/);
             let viewBox = '0 0 36 36';
             if (viewBoxMatch) {
               viewBox = viewBoxMatch[1];
             }
             
             // Extract inner content (everything between <svg...> and </svg>)
             const contentMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
             
             if (contentMatch) {
               // We have inner content. We need to handle scaling if viewBox is different.

               // Calculate scale to fit 36x36
               // If we use a nested svg, it handles viewBox automatically!
               // <svg viewBox="..." width="36" height="36"> ... </svg>
               // This is the best way.
               
               // We just need to strip the outer <svg> tag's attributes and replace them, OR wrap the inner content in a new <svg> tag.
               // Actually, we can just take the inner content and wrap it in a <svg> with the original viewBox, but set width/height to 36.
               
               content = `<svg x="0" y="0" width="36" height="36" viewBox="${viewBox}">${contentMatch[1]}</svg>`;
             } else {
               // Fallback to image tag
               const base64 = btoa(unescape(encodeURIComponent(customIcon.content)));
               const dataUrl = `data:image/svg+xml;base64,${base64}`;
               content = `<image href="${dataUrl}" x="0" y="0" width="36" height="36" />`;
             }
        } else {
             content = `<image href="${customIcon.content}" x="0" y="0" width="36" height="36" />`;
        }
    } else {
        switch (iconName) {
          case 'elevator':
            content = `<g transform="translate(18, 18) scale(1) translate(-18, -18)">
              <text x="18" y="26" font-size="26" font-weight="600" fill="${iconFill}" text-anchor="middle" font-family="Arial">E</text>
            </g>`;
            break;
          case 'escalator':
            content = `<g transform="translate(18, 18) scale(1.5) translate(-18, -18)">
              <path d="M6,28 L18,8 L30,8 L30,14 L22,14 L12,28 Z" fill="${iconFill}"/>
            </g>`;
            break;
          case 'restroom':
            content = `<g transform="translate(18, 18) scale(1.3) translate(-18, -18)">
              <circle cx="12" cy="9" r="3.5" fill="${iconFill}"/>
              <rect x="8" y="14" width="8" height="14" rx="1" fill="${iconFill}"/>
              <circle cx="24" cy="9" r="3.5" fill="${iconFill}"/>
              <path d="M18,14 L24,30 L30,14" fill="${iconFill}"/>
            </g>`;
            break;
          case 'accessible':
            if (bgColor === 'transparent') {
                content = `<g>
                   <circle cx="18" cy="18" r="17" fill="none" stroke="${color}" stroke-width="2"/>
                   <circle cx="15" cy="9" r="3" fill="${color}"/>
                   <path d="M13,14 L13,21 L20,21 L23,29 L28,26" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                 </g>`;
            } else {
                content = `<g>
                   ${!bgColor ? `<circle cx="18" cy="18" r="17" fill="#2196F3"/>` : ''}
                   <circle cx="15" cy="9" r="3" fill="white"/>
                   <path d="M13,14 L13,21 L20,21 L23,29 L28,26" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                 </g>`;
            }
            break;
          case 'atm':
            content = `<text x="18" y="23" font-size="14" font-weight="bold" fill="${bgColor ? iconFill : 'white'}" text-anchor="middle" font-family="Arial">ATM</text>`;
            break;
          case 'ticket':
            const ticketDotFill = finalBgColor === 'none' ? color : finalBgColor;
            content = `<g transform="translate(18, 18) scale(1.3) translate(-18, -18)">
                  <rect x="6" y="12" width="24" height="12" rx="2" fill="${iconFill}"/>
                  <circle cx="6" cy="18" r="3" fill="${ticketDotFill}"/>
                  <circle cx="30" cy="18" r="3" fill="${ticketDotFill}"/>
                </g>`;
            break;
          case 'info':
            content = `<g transform="translate(18, 18) scale(1.5) translate(-18, -18)">
                  <circle cx="18" cy="12" r="3" fill="${iconFill}"/>
                  <rect x="15" y="17" width="6" height="11" rx="1" fill="${iconFill}"/>
                </g>`;
            break;
          default:
             content = '';
        }
    }

    return `  <svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 36 36">
    <rect width="36" height="36" rx="${r}" fill="${finalBgColor}"/>
    <g transform="${contentTransform}">
      ${content}
    </g>
  </svg>\n`;
  };

  const handleSaveProject = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            importFromJSON(e.target?.result as string);
          } catch {
            alert('无法加载项目文件');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有内容吗？此操作不可恢复。')) {
      clearAll();
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="12" fill="#1a1a2e"/>
            <circle cx="32" cy="32" r="18" fill="none" stroke="#4ecdc4" strokeWidth="4"/>
            <circle cx="32" cy="32" r="6" fill="#ff6b6b"/>
            <line x1="32" y1="14" x2="32" y2="22" stroke="#4ecdc4" strokeWidth="3" strokeLinecap="round"/>
            <line x1="32" y1="42" x2="32" y2="50" stroke="#4ecdc4" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <span>导视牌</span>
        </div>
        
        <input
          type="text"
          className="project-name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>
      
      <div className="header-center">
        <div className="select-menu">
          <select 
            value={Object.keys(WIDTH_PRESETS).find(k => WIDTH_PRESETS[k as keyof typeof WIDTH_PRESETS].width === width) || 'medium'}
            onChange={(e) => setWidthPreset(e.target.value)}
          >
            {Object.entries(WIDTH_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>{preset.name}</option>
            ))}
          </select>
        </div>
        
        <div className="select-menu">
          <select 
            value={Object.keys(THEMES).find(k => THEMES[k].name === theme.name) || 'beijing'}
            onChange={(e) => setTheme(e.target.value)}
          >
            {Object.entries(THEMES).map(([key, t]) => (
              <option key={key} value={key}>{t.name}</option>
            ))}
          </select>
        </div>
        
        <div className="toolbar">
          <button className="btn-icon" onClick={undo} title="撤销 (⌘Z)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10h10a5 5 0 0 1 5 5v2"/>
              <polyline points="3 10 8 5"/>
              <polyline points="3 10 8 15"/>
            </svg>
          </button>
          <button className="btn-icon" onClick={redo} title="重做 (⌘⇧Z)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10H11a5 5 0 0 0-5 5v2"/>
              <polyline points="21 10 16 5"/>
              <polyline points="21 10 16 15"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="header-right">
        <button className="btn btn-secondary" onClick={handleLoadProject}>
          打开
        </button>
        <button className="btn btn-secondary" onClick={handleSaveProject}>
          保存
        </button>
        <div className="toolbar-divider" />
        <button className="btn btn-secondary" onClick={handleExportSVG}>
          SVG
        </button>
        <button className="btn btn-primary" onClick={handleExportPNG}>
          PNG
        </button>
        <div className="toolbar-divider" />
        <button className="btn-icon" onClick={() => setShowSettings(true)} title="全局设置">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button className="btn-icon" onClick={handleClearAll} title="清空">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
