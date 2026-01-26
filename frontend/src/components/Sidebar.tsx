import { useRef, useState } from 'react';
import { useEditorStore } from '../store';
import { LINE_COLORS, SignageElement, ArrowDirection } from '../types';

// Element templates for adding
const ELEMENT_TEMPLATES: Record<string, Partial<SignageElement>> = {
  // Exits
  exitA: { type: 'exit', exitLabel: 'A' },
  exitB: { type: 'exit', exitLabel: 'B' },
  exitC: { type: 'exit', exitLabel: 'C' },
  exitD: { type: 'exit', exitLabel: 'D' },
  
  // Text
  text: { type: 'text', content: '文字', contentEn: 'Text' },
  large_text: { type: 'large_text', content: '大文字' },
  
  // Arrows
  arrowUp: { type: 'arrow', arrowDirection: 'up' },
  arrowDown: { type: 'arrow', arrowDirection: 'down' },
  arrowLeft: { type: 'arrow', arrowDirection: 'left' },
  arrowRight: { type: 'arrow', arrowDirection: 'right' },
  arrowUpLeft: { type: 'arrow', arrowDirection: 'up-left' },
  arrowUpRight: { type: 'arrow', arrowDirection: 'up-right' },
  
  // Icons
  iconElevator: { type: 'icon', iconName: 'elevator', iconPadding: 3 },
  iconEscalator: { type: 'icon', iconName: 'escalator', iconPadding: 3 },
  iconAccessible: { type: 'icon', iconName: 'accessible', iconPadding: 3 },
  iconRestroom: { type: 'icon', iconName: 'restroom', iconPadding: 3 },
  iconAtm: { type: 'icon', iconName: 'atm', iconPadding: 3 },
  iconTicket: { type: 'icon', iconName: 'ticket', iconPadding: 3 },
  iconInfo: { type: 'icon', iconName: 'info', iconPadding: 3 },
  
  // Divider
  divider: { type: 'divider' },

  // Spacer
  spacer: { type: 'spacer' },
};

// Arrow preview component
function ArrowPreview({ direction, size = 24 }: { direction: ArrowDirection; size?: number }) {
  const sw = 2.5;
  const m = 3;
  
  const getArrowPath = () => {
    switch (direction) {
      case 'up':
        return `M${size/2},${m} L${size/2},${size-m} M${m+1},${size/2-1} L${size/2},${m} L${size-m-1},${size/2-1}`;
      case 'down':
        return `M${size/2},${size-m} L${size/2},${m} M${m+1},${size/2+1} L${size/2},${size-m} L${size-m-1},${size/2+1}`;
      case 'left':
        return `M${m},${size/2} L${size-m},${size/2} M${size/2-1},${m+1} L${m},${size/2} L${size/2-1},${size-m-1}`;
      case 'right':
        return `M${size-m},${size/2} L${m},${size/2} M${size/2+1},${m+1} L${size-m},${size/2} L${size/2+1},${size-m-1}`;
      case 'up-left':
        return `M${m+1},${m+1} L${size-m-1},${size-m-1} M${m+1},${size/2-1} L${m+1},${m+1} L${size/2-1},${m+1}`;
      case 'up-right':
        return `M${size-m-1},${m+1} L${m+1},${size-m-1} M${size/2+1},${m+1} L${size-m-1},${m+1} L${size-m-1},${size/2-1}`;
      default:
        return `M${size/2},${m} L${size/2},${size-m} M${m+1},${size/2-1} L${size/2},${m} L${size-m-1},${size/2-1}`;
    }
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <path 
        d={getArrowPath()} 
        stroke="currentColor" 
        strokeWidth={sw} 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Sidebar() {
  const { rows, addElement, selectedRowId, customIcons, addCustomIcon, removeCustomIcon } = useEditorStore();
  
  const [customIconName, setCustomIconName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetRowId = selectedRowId || rows[0]?.id || '';

  const handleAddElement = (templateKey: string) => {
    const template = ELEMENT_TEMPLATES[templateKey];
    if (template && targetRowId) {
      addElement(targetRowId, template);
    }
  };

  const handleAddCustomIcon = (iconId: string) => {
    if (targetRowId) {
      addElement(targetRowId, {
        type: 'icon',
        iconName: iconId,
        iconPadding: 3,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const name = customIconName.trim() || file.name.replace(/\.[^/.]+$/, "");
      
      addCustomIcon({
        id: `custom-${Date.now()}`,
        name: name,
        content: content,
      });
      setCustomIconName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleAddLineBadge = (lineNumber: string) => {
    if (targetRowId) {
      addElement(targetRowId, {
        type: 'line_badge',
        lineNumber,
        lineColor: LINE_COLORS[lineNumber],
        badgeTextWhite: true,
      });
    }
  };

  return (
    <aside className="sidebar">
      {/* Spacer & Layout */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">布局调整</div>
        <div className="element-grid">
          <div className="element-item" onClick={() => handleAddElement('spacer')}>
            <div className="preview" style={{ width: '24px', height: '24px', border: '1px dashed currentColor', opacity: 0.5 }}></div>
            <span>推右占位符</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('divider')}>
            <div className="preview" style={{ width: '2px', height: '24px', background: 'currentColor', opacity: 0.3 }}></div>
            <span>分隔线</span>
          </div>
        </div>
      </div>

      {/* Exit Markers */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">出口标识</div>
        <div className="element-grid">
          {['A', 'B', 'C', 'D'].map((label) => (
            <div
              key={label}
              className="element-item"
              onClick={() => handleAddElement(`exit${label}`)}
            >
              <div className="preview">
                <div className="exit-preview">{label}</div>
              </div>
              <span>出口 {label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">文字</div>
        <div className="element-grid">
          <div
            className="element-item"
            onClick={() => handleAddElement('text')}
          >
            <div className="preview" style={{ fontSize: '14px', fontWeight: '600' }}>
              文字 <span style={{ fontSize: '9px', color: '#888', marginLeft: '2px' }}>Text</span>
            </div>
            <span>中英文双行</span>
          </div>
          <div
            className="element-item"
            onClick={() => handleAddElement('large_text')}
          >
            <div className="preview" style={{ fontSize: '18px', fontWeight: '600' }}>
              文字
            </div>
            <span>大文字单行</span>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">方向箭头</div>
        <div className="element-grid">
          <div className="element-item" onClick={() => handleAddElement('arrowLeft')}>
            <div className="preview"><ArrowPreview direction="left" /></div>
            <span>向左</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('arrowRight')}>
            <div className="preview"><ArrowPreview direction="right" /></div>
            <span>向右</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('arrowUp')}>
            <div className="preview"><ArrowPreview direction="up" /></div>
            <span>向上</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('arrowDown')}>
            <div className="preview"><ArrowPreview direction="down" /></div>
            <span>向下</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('arrowUpLeft')}>
            <div className="preview"><ArrowPreview direction="up-left" /></div>
            <span>左上</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('arrowUpRight')}>
            <div className="preview"><ArrowPreview direction="up-right" /></div>
            <span>右上</span>
          </div>
        </div>
      </div>

      {/* Line Badges */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">线路标识</div>
        <div className="element-grid">
          {Object.entries(LINE_COLORS).slice(0, 10).map(([num, color]) => (
            <div
              key={num}
              className="element-item"
              onClick={() => handleAddLineBadge(num)}
            >
              <div className="preview">
                <div 
                  className="line-badge-preview-square" 
                  style={{ backgroundColor: color }}
                >
                  {num}
                </div>
              </div>
              <span>{num}号线</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer - REMOVED */}
      {/* 
      <div className="sidebar-section">
        <div className="sidebar-section-title">换乘信息</div>
        <div className="element-grid">
          {Object.entries(LINE_COLORS).slice(0, 6).map(([num, color]) => (
            <div
              key={num}
              className="element-item"
              onClick={() => handleAddTransfer(num)}
            >
              <div className="preview" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <div 
                  className="line-badge-preview-square" 
                  style={{ backgroundColor: color, width: '18px', height: '18px', fontSize: '10px' }}
                >
                  {num}
                </div>
                <span style={{ fontSize: '9px' }}>换乘</span>
              </div>
              <span>换乘{num}号线</span>
            </div>
          ))}
        </div>
      </div> 
      */}

      {/* Icons */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">设施图标</div>
        <div className="element-grid">
          <div className="element-item" onClick={() => handleAddElement('iconElevator')}>
            <div className="preview">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="currentColor">
                <rect width="36" height="36" rx="4"/>
                <g transform="translate(18, 18) scale(0.833) translate(-18, -18)">
                  <text x="18" y="24" fontSize="18" fontWeight="600" fill="white" textAnchor="middle">E</text>
                </g>
              </svg>
            </div>
            <span>电梯</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('iconEscalator')}>
            <div className="preview">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="currentColor">
                <rect width="36" height="36" rx="4"/>
                <g transform="translate(18, 18) scale(0.833) translate(-18, -18)">
                  <path d="M6,28 L18,8 L30,8 L30,14 L22,14 L12,28 Z" fill="white"/>
                </g>
              </svg>
            </div>
            <span>扶梯</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('iconRestroom')}>
            <div className="preview">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="currentColor">
                <rect width="36" height="36" rx="4"/>
                <g transform="translate(18, 18) scale(0.833) translate(-18, -18)">
                  <circle cx="12" cy="9" r="3.5" fill="white"/>
                  <rect x="8" y="14" width="8" height="14" rx="1" fill="white"/>
                  <circle cx="24" cy="9" r="3.5" fill="white"/>
                  <path d="M18,14 L24,30 L30,14" fill="white"/>
                </g>
              </svg>
            </div>
            <span>卫生间</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('iconAccessible')}>
            <div className="preview">
              <svg width="24" height="24" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="17" fill="#2196F3"/>
                <g transform="translate(18, 18) scale(0.833) translate(-18, -18)">
                  <circle cx="15" cy="9" r="3" fill="white"/>
                  <path d="M13,14 L13,21 L20,21 L23,29 L28,26" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                </g>
              </svg>
            </div>
            <span>无障碍</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('iconAtm')}>
            <div className="preview">
              <svg width="24" height="24" viewBox="0 0 36 36">
                <rect width="36" height="36" rx="4" fill="#4CAF50"/>
                <g transform="translate(18, 18) scale(0.833) translate(-18, -18)">
                  <text x="18" y="22" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">ATM</text>
                </g>
              </svg>
            </div>
            <span>ATM</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('iconTicket')}>
            <div className="preview">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="currentColor">
                <rect width="36" height="36" rx="4"/>
                <g transform="translate(18, 18) scale(0.833) translate(-18, -18)">
                  <rect x="6" y="12" width="24" height="12" rx="2" fill="white"/>
                  <circle cx="6" cy="18" r="3" fill="currentColor"/>
                  <circle cx="30" cy="18" r="3" fill="currentColor"/>
                </g>
              </svg>
            </div>
            <span>售票</span>
          </div>
          <div className="element-item" onClick={() => handleAddElement('iconInfo')}>
            <div className="preview">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="currentColor">
                <rect width="36" height="36" rx="4"/>
                <g transform="translate(18, 18) scale(0.833) translate(-18, -18)">
                  <circle cx="18" cy="12" r="3" fill="white"/>
                  <rect x="15" y="17" width="6" height="11" rx="1" fill="white"/>
                </g>
              </svg>
            </div>
            <span>问询</span>
          </div>
        </div>
      </div>

      {/* Custom Icons */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">自定义图标</div>
        <div className="custom-icon-controls">
          <input
            type="text"
            className="custom-icon-input"
            placeholder="图标名称"
            value={customIconName}
            onChange={(e) => setCustomIconName(e.target.value)}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".svg,image/svg+xml,image/png,image/jpeg"
          />
          <button
            className="custom-icon-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            上传图标 (SVG/Img)
          </button>
        </div>
        
        {customIcons.length > 0 && (
          <div className="element-grid">
            {customIcons.map((icon) => (
              <div 
                key={icon.id} 
                className="element-item" 
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => handleAddCustomIcon(icon.id)}
              >
                <div 
                  className="preview" 
                  title={icon.name}
                >
                  {icon.content.startsWith('<svg') || icon.content.startsWith('<?xml') ? (
                     <div 
                       dangerouslySetInnerHTML={{ __html: icon.content }} 
                       style={{ width: '24px', height: '24px', overflow: 'hidden' }} 
                     />
                  ) : (
                    <img 
                      src={icon.content} 
                      alt={icon.name} 
                      style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
                    />
                  )}
                </div>
                <span>{icon.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`删除图标 "${icon.name}"?`)) {
                      removeCustomIcon(icon.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    cursor: 'pointer',
                    opacity: 0.8
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
