import { useEditorStore } from '../store';
import { LINE_COLORS, ArrowDirection, TextAlign, SignageElement } from '../types';

export default function PropertiesPanel() {
  const {
    rows,
    selectedElementIds,
    updateElement,
    deleteElement,
    duplicateElement,
    setRowBackgroundColor,
  } = useEditorStore();

  // Find all selected elements and their rows
  const selectedElements: { element: SignageElement; rowId: string }[] = [];
  
  if (selectedElementIds && selectedElementIds.length > 0) {
    for (const row of rows) {
      for (const el of row.elements) {
        if (selectedElementIds.includes(el.id)) {
          selectedElements.push({ element: el, rowId: row.id });
        }
      }
    }
  }

  const selectedElement = selectedElements.length > 0 ? selectedElements[0].element : null;
  const selectedRowId = selectedElements.length > 0 ? selectedElements[0].rowId : null;
  const isMultiSelect = selectedElements.length > 1;

  const handleUpdate = (updates: Record<string, unknown>) => {
    selectedElements.forEach(({ element, rowId }) => {
      updateElement(rowId, element.id, updates);
    });
  };

  const handleDelete = () => {
    if (isMultiSelect) {
      if (confirm(`确定要删除选中的 ${selectedElements.length} 个元素吗？`)) {
        selectedElements.forEach(({ element, rowId }) => {
          deleteElement(rowId, element.id);
        });
      }
    } else {
      selectedElements.forEach(({ element, rowId }) => {
        deleteElement(rowId, element.id);
      });
    }
  };

  const handleDuplicate = () => {
    // Only support duplication for single selection for now, or implement bulk duplicate later
    if (selectedElement && selectedRowId) {
      duplicateElement(selectedRowId, selectedElement.id);
    }
  };

  // No selection state
  if (selectedElements.length === 0) {
    return (
      <aside className="properties-panel">
        <div className="properties-section">
          <div className="properties-section-title">画布设置</div>
          <div className="property-row">
            <span className="property-label">背景色</span>
            <input
              type="color"
              value={rows[0]?.backgroundColor || '#FFFFFF'}
              onChange={(e) => rows[0] && setRowBackgroundColor(rows[0].id, e.target.value)}
            />
          </div>
        </div>
        
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          <p>选择一个元素以编辑其属性</p>
          <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7 }}>
            提示：拖动元素可改变顺序<br/>
            按住 Shift/Cmd 可多选
          </p>
        </div>
      </aside>
    );
  }

  // Multi-selection with different types
  const allSameType = selectedElements.length > 0 && selectedElements.every(item => item.element.type === selectedElements[0].element.type);
  
  if (isMultiSelect && !allSameType) {
    return (
      <aside className="properties-panel">
        <div className="properties-section">
          <div className="properties-section-title">
            已选择 {selectedElements.length} 个元素
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            多种类型混合
          </div>
        </div>

        {/* Common Spacing Properties */}
        <div className="properties-section">
          <div className="properties-section-title">通用设置</div>
          <div className="property-row">
            <span className="property-label">右侧间距</span>
            <select
              value=""
              onChange={(e) => handleUpdate({ gapAfter: e.target.value })}
              style={{ width: '100px' }}
            >
              <option value="" disabled>选择间距...</option>
              <option value="none">无间距</option>
              <option value="small">小间距</option>
              <option value="normal">标准间距</option>
              <option value="large">大间距</option>
            </select>
          </div>
        </div>

        {/* Common Actions */}
        <div className="properties-section">
           <div className="action-buttons">
            <button className="btn btn-secondary" onClick={handleDelete} style={{ color: 'var(--accent-danger)', width: '100%' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              删除 {selectedElements.length} 个元素
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Single selection or Multi-selection with same type
  if (!selectedElement) return null;

  return (
    <aside className="properties-panel">
      {/* Element type header */}
      <div className="properties-section">
        <div className="properties-section-title">
          {isMultiSelect 
            ? `已选择 ${selectedElements.length} 个${getElementTypeName(selectedElement.type)}` 
            : getElementTypeName(selectedElement.type)
          }
        </div>
      </div>

      {/* Exit properties */}
      {selectedElement.type === 'exit' && (
        <div className="properties-section">
          <div className="property-row">
            <span className="property-label">出口字母</span>
            <input
              type="text"
              value={selectedElement.exitLabel || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9a-zA-Z]/g, '');
                handleUpdate({ exitLabel: value });
              }}
              style={{ width: '80px', textAlign: 'center' }}
              maxLength={4}
              placeholder="A"
            />
          </div>
        </div>
      )}

      {/* Line badge properties */}
      {selectedElement.type === 'line_badge' && (
        <div className="properties-section">
          <div className="property-row">
            <span className="property-label">线路号</span>
            <select
              value={(selectedElement.isCustomLine || !LINE_COLORS[selectedElement.lineNumber || '']) ? 'custom' : selectedElement.lineNumber}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  handleUpdate({ isCustomLine: true });
                } else {
                  handleUpdate({ 
                    isCustomLine: false,
                    lineNumber: e.target.value,
                    lineColor: LINE_COLORS[e.target.value] || selectedElement.lineColor,
                  });
                }
              }}
              style={{ width: '100px' }}
            >
              <option value="custom">自定义</option>
              {Object.keys(LINE_COLORS).map((num) => (
                <option key={num} value={num}>{num}号线</option>
              ))}
            </select>
          </div>
          {(selectedElement.isCustomLine || !LINE_COLORS[selectedElement.lineNumber || '']) && (
            <div className="property-row">
              <span className="property-label">输入号码</span>
              <input
                type="text"
                value={selectedElement.lineNumber || ''}
                onChange={(e) => handleUpdate({ lineNumber: e.target.value })}
                placeholder="例如: 12"
                style={{ width: '100px' }}
              />
            </div>
          )}
          <div className="property-row">
            <span className="property-label">压缩文字</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={selectedElement.badgeCompress || false}
                onChange={(e) => handleUpdate({ badgeCompress: e.target.checked })}
              />
              <span style={{ fontSize: '11px' }}>自适应宽度</span>
            </label>
          </div>
          <div className="property-row">
            <span className="property-label">背景色</span>
            <input
              type="color"
              value={selectedElement.lineColor || LINE_COLORS['1']}
              onChange={(e) => handleUpdate({ lineColor: e.target.value })}
            />
          </div>
          <div className="property-row">
            <span className="property-label">描边</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={selectedElement.badgeStroke || false}
                onChange={(e) => handleUpdate({ badgeStroke: e.target.checked })}
              />
              <span style={{ fontSize: '11px' }}>启用</span>
            </label>
          </div>
          {selectedElement.badgeStroke && (
            <>
              <div className="property-row">
                <span className="property-label">描边色</span>
                <input
                  type="color"
                  value={selectedElement.badgeStrokeColor || '#000000'}
                  onChange={(e) => handleUpdate({ badgeStrokeColor: e.target.value })}
                />
              </div>
              <div className="property-row">
                <span className="property-label">描边粗细</span>
                <input
                  type="number"
                  value={selectedElement.badgeStrokeWidth ?? 2}
                  min={0.5}
                  max={10}
                  step={0.5}
                  onChange={(e) => handleUpdate({ badgeStrokeWidth: parseFloat(e.target.value) || 0 })}
                  style={{ width: '60px' }}
                />
              </div>
            </>
          )}
          <div className="property-row">
            <span className="property-label">文字颜色</span>
            <div className="gap-selector">
              <button
                className={`gap-option ${selectedElement.badgeTextWhite !== false ? 'active' : ''}`}
                onClick={() => handleUpdate({ badgeTextWhite: true })}
              >
                白色
              </button>
              <button
                className={`gap-option ${selectedElement.badgeTextWhite === false ? 'active' : ''}`}
                onClick={() => handleUpdate({ badgeTextWhite: false })}
              >
                黑色
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text properties */}
      {selectedElement.type === 'text' && (
        <div className="properties-section">
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <span className="property-label" style={{ marginBottom: '4px' }}>中文</span>
            <input
              type="text"
              value={selectedElement.content || ''}
              onChange={(e) => handleUpdate({ content: e.target.value })}
              placeholder="中文内容"
              style={{ width: '100%' }}
            />
          </div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: '8px' }}>
            <span className="property-label" style={{ marginBottom: '4px' }}>英文（可选）</span>
            <input
              type="text"
              value={selectedElement.contentEn || ''}
              onChange={(e) => handleUpdate({ contentEn: e.target.value })}
              placeholder="留空则只显示中文"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <span className="property-label" style={{ marginBottom: '8px' }}>文字颜色</span>
            <div className="gap-selector">
              {[
                { value: 'auto', label: '默认' },
                { value: 'exit', label: '出口色' },
                { value: 'custom', label: '自定义' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`gap-option ${(selectedElement.colorMode || 'auto') === value ? 'active' : ''}`}
                  onClick={() => handleUpdate({ colorMode: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {selectedElement.colorMode === 'custom' && (
            <div className="property-row">
              <span className="property-label">选择颜色</span>
              <input
                type="color"
                value={selectedElement.customColor || '#000000'}
                onChange={(e) => handleUpdate({ customColor: e.target.value })}
              />
            </div>
          )}

          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: '8px' }}>
            <span className="property-label" style={{ marginBottom: '8px' }}>文字对齐</span>
            <div className="gap-selector">
              <button
                className={`gap-option ${(selectedElement.textAlign || 'left') === 'left' ? 'active' : ''}`}
                onClick={() => handleUpdate({ textAlign: 'left' as TextAlign })}
                title="左对齐"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="15" y2="12"/>
                  <line x1="3" y1="18" x2="18" y2="18"/>
                </svg>
              </button>
              <button
                className={`gap-option ${selectedElement.textAlign === 'center' ? 'active' : ''}`}
                onClick={() => handleUpdate({ textAlign: 'center' as TextAlign })}
                title="居中对齐"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="6" y1="12" x2="18" y2="12"/>
                  <line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
              </button>
              <button
                className={`gap-option ${selectedElement.textAlign === 'right' ? 'active' : ''}`}
                onClick={() => handleUpdate({ textAlign: 'right' as TextAlign })}
                title="右对齐"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="9" y1="12" x2="21" y2="12"/>
                  <line x1="6" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: '8px' }}>
            <span className="property-label" style={{ marginBottom: '8px' }}>字体设置</span>
            
            {/* Chinese Font Size */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px' }}>中文字号</span>
              <select
                value={selectedElement.fontSize ? 'custom' : 'global'}
                onChange={(e) => handleUpdate({ fontSize: e.target.value === 'custom' ? 24 : undefined })}
                style={{ width: '80px' }}
              >
                <option value="global">默认</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            {selectedElement.fontSize !== undefined && (
              <div style={{ marginBottom: '8px' }}>
                 <input
                  type="number"
                  value={selectedElement.fontSize}
                  onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) || 24 })}
                  min={10}
                  max={100}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* English Font Size */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px' }}>英文字号</span>
              <select
                value={selectedElement.fontSizeEn ? 'custom' : 'global'}
                onChange={(e) => handleUpdate({ fontSizeEn: e.target.value === 'custom' ? 14 : undefined })}
                style={{ width: '80px' }}
              >
                <option value="global">默认</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            {selectedElement.fontSizeEn !== undefined && (
              <div style={{ marginBottom: '8px' }}>
                 <input
                  type="number"
                  value={selectedElement.fontSizeEn}
                  onChange={(e) => handleUpdate({ fontSizeEn: parseInt(e.target.value) || 14 })}
                  min={6}
                  max={60}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* Font Weight */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px' }}>字重</span>
              <select
                value={selectedElement.fontWeight ? 'custom' : 'global'}
                onChange={(e) => handleUpdate({ fontWeight: e.target.value === 'custom' ? 400 : undefined })}
                style={{ width: '80px' }}
              >
                <option value="global">默认</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            {selectedElement.fontWeight !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <input
                  type="number"
                  value={selectedElement.fontWeight}
                  onChange={(e) => handleUpdate({ fontWeight: parseInt(e.target.value) || 400 })}
                  step={100}
                  min={100}
                  max={900}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Large Text properties */}
      {selectedElement.type === 'large_text' && (
        <div className="properties-section">
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <span className="property-label" style={{ marginBottom: '4px' }}>文字内容</span>
            <input
              type="text"
              value={selectedElement.content || ''}
              onChange={(e) => handleUpdate({ content: e.target.value })}
              placeholder="文字内容"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <span className="property-label" style={{ marginBottom: '8px' }}>文字颜色</span>
            <div className="gap-selector">
              {[
                { value: 'auto', label: '默认' },
                { value: 'exit', label: '出口色' },
                { value: 'custom', label: '自定义' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`gap-option ${(selectedElement.colorMode || 'auto') === value ? 'active' : ''}`}
                  onClick={() => handleUpdate({ colorMode: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {selectedElement.colorMode === 'custom' && (
            <div className="property-row">
              <span className="property-label">选择颜色</span>
              <input
                type="color"
                value={selectedElement.customColor || '#000000'}
                onChange={(e) => handleUpdate({ customColor: e.target.value })}
              />
            </div>
          )}

          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: '8px' }}>
            <span className="property-label" style={{ marginBottom: '8px' }}>文字对齐</span>
            <div className="gap-selector">
              <button
                className={`gap-option ${(selectedElement.textAlign || 'left') === 'left' ? 'active' : ''}`}
                onClick={() => handleUpdate({ textAlign: 'left' as TextAlign })}
                title="左对齐"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="15" y2="12"/>
                  <line x1="3" y1="18" x2="18" y2="18"/>
                </svg>
              </button>
              <button
                className={`gap-option ${selectedElement.textAlign === 'center' ? 'active' : ''}`}
                onClick={() => handleUpdate({ textAlign: 'center' as TextAlign })}
                title="居中对齐"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="6" y1="12" x2="18" y2="12"/>
                  <line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
              </button>
              <button
                className={`gap-option ${selectedElement.textAlign === 'right' ? 'active' : ''}`}
                onClick={() => handleUpdate({ textAlign: 'right' as TextAlign })}
                title="右对齐"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="9" y1="12" x2="21" y2="12"/>
                  <line x1="6" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: '8px' }}>
            <span className="property-label" style={{ marginBottom: '8px' }}>字体设置</span>
            
            {/* Font Size */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px' }}>字号</span>
              <select
                value={selectedElement.fontSize ? 'custom' : 'global'}
                onChange={(e) => handleUpdate({ fontSize: e.target.value === 'custom' ? 40 : undefined })}
                style={{ width: '80px' }}
              >
                <option value="global">默认</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            {selectedElement.fontSize !== undefined && (
              <div style={{ marginBottom: '8px' }}>
                 <input
                  type="number"
                  value={selectedElement.fontSize}
                  onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) || 40 })}
                  min={10}
                  max={150}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* Font Weight */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px' }}>字重</span>
              <select
                value={selectedElement.fontWeight ? 'custom' : 'global'}
                onChange={(e) => handleUpdate({ fontWeight: e.target.value === 'custom' ? 400 : undefined })}
                style={{ width: '80px' }}
              >
                <option value="global">默认</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            {selectedElement.fontWeight !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <input
                  type="number"
                  value={selectedElement.fontWeight}
                  onChange={(e) => handleUpdate({ fontWeight: parseInt(e.target.value) || 400 })}
                  step={100}
                  min={100}
                  max={900}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Arrow properties */}
      {selectedElement.type === 'arrow' && (
        <div className="properties-section">
          <div className="property-row">
            <span className="property-label">箭头方向</span>
            <select
              value={selectedElement.arrowDirection || 'up'}
              onChange={(e) => handleUpdate({ arrowDirection: e.target.value as ArrowDirection })}
              style={{ width: '100px' }}
            >
              <option value="left">← 向左</option>
              <option value="right">→ 向右</option>
              <option value="up">↑ 向上</option>
              <option value="down">↓ 向下</option>
              <option value="up-left">↖ 左上</option>
              <option value="up-right">↗ 右上</option>
              <option value="down-left">↙ 左下</option>
              <option value="down-right">↘ 右下</option>
            </select>
          </div>

          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <span className="property-label" style={{ marginBottom: '8px' }}>箭头颜色</span>
            <div className="gap-selector">
              {[
                { value: 'auto', label: '默认' },
                { value: 'exit', label: '出口色' },
                { value: 'custom', label: '自定义' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`gap-option ${(selectedElement.colorMode || 'auto') === value ? 'active' : ''}`}
                  onClick={() => handleUpdate({ colorMode: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {selectedElement.colorMode === 'custom' && (
            <div className="property-row">
              <span className="property-label">选择颜色</span>
              <input
                type="color"
                value={selectedElement.customColor || '#000000'}
                onChange={(e) => handleUpdate({ customColor: e.target.value })}
              />
            </div>
          )}
        </div>
      )}

      {/* Icon properties */}
      {selectedElement.type === 'icon' && (
        <div className="properties-section">
          <div className="property-row">
            <span className="property-label">图标类型</span>
            <select
              value={selectedElement.iconName || 'elevator'}
              onChange={(e) => handleUpdate({ iconName: e.target.value })}
              style={{ width: '100px' }}
            >
              <option value="elevator">电梯</option>
              <option value="escalator">扶梯</option>
              <option value="restroom">卫生间</option>
              <option value="accessible">无障碍</option>
              <option value="atm">ATM</option>
              <option value="ticket">售票</option>
            </select>
          </div>
          
          <div className="property-row">
            <span className="property-label">图标底色</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={selectedElement.iconBackgroundColor === 'transparent' ? '#ffffff' : (selectedElement.iconBackgroundColor || '#000000')}
                onChange={(e) => handleUpdate({ iconBackgroundColor: e.target.value })}
                disabled={selectedElement.iconBackgroundColor === 'transparent'}
                style={{ width: '40px', height: '24px', opacity: selectedElement.iconBackgroundColor === 'transparent' ? 0.5 : 1 }}
              />
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={selectedElement.iconBackgroundColor === 'transparent'}
                  onChange={(e) => handleUpdate({ iconBackgroundColor: e.target.checked ? 'transparent' : undefined })}
                  style={{ marginRight: '4px' }}
                />
                透明
              </label>
            </div>
          </div>

          <div className="property-row">
            <span className="property-label">内边距</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={selectedElement.iconPadding !== undefined ? selectedElement.iconPadding : 3}
                onChange={(e) => handleUpdate({ iconPadding: parseInt(e.target.value) })}
                style={{ width: '80px' }}
              />
              <span style={{ fontSize: '12px', minWidth: '20px' }}>{selectedElement.iconPadding !== undefined ? selectedElement.iconPadding : 3}</span>
            </div>
          </div>
        </div>
      )}

      {/* Transfer properties - REMOVED */}
      {/* 
      {selectedElement.type === 'transfer' && (
        <div className="properties-section">
          // ... code ...
        </div>
      )} 
      */}

      {/* Spacer properties */}
      {selectedElement.type === 'spacer' && (
        <div className="properties-section">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            推右元素是一个占位符，它会自动填充左侧和右侧元素之间的所有空白区域，并将右侧的所有元素推至画板最右端。
          </p>
        </div>
      )}

      {/* Gap control - for all elements except spacer */}
      {selectedElement.type !== 'spacer' && (
        <div className="properties-section">
          <div className="properties-section-title">间距设置</div>
        <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <span className="property-label" style={{ marginBottom: '8px' }}>右侧间距</span>
          <div className="gap-selector">
            {[
              { value: 'none', label: '无' },
              { value: 'small', label: '紧凑' },
              { value: 'normal', label: '标准' },
              { value: 'large', label: '宽松' },
            ].map(({ value, label }) => (
              <button
                key={value}
                className={`gap-option ${(selectedElement.gapAfter || 'normal') === value ? 'active' : ''}`}
                onClick={() => handleUpdate({ gapAfter: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Actions */}
      <div className="properties-section">
        <div className="properties-section-title">操作</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedElement.type !== 'spacer' && !isMultiSelect && (
            <button className="btn btn-secondary" onClick={handleDuplicate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2-2v1"/>
              </svg>
              复制元素
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleDelete} style={{ color: 'var(--accent-danger)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            {isMultiSelect ? `删除 ${selectedElements.length} 个元素` : '删除元素'}
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="properties-section" style={{ opacity: 0.7 }}>
        <div className="properties-section-title">快捷键</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <div>Delete - 删除选中</div>
          <div>⌘D - 复制选中</div>
          <div>⌘Z - 撤销</div>
          <div>⌘⇧Z - 重做</div>
          <div>Esc - 取消选择</div>
        </div>
      </div>
    </aside>
  );
}

function getElementTypeName(type: string): string {
  const names: Record<string, string> = {
    spacer: '推右元素',
    exit: '出口标识',
    line_badge: '线路标识',
    text: '文字',
    large_text: '大文字',
    arrow: '方向箭头',
    icon: '设施图标',
    divider: '分隔线',
    // transfer: '换乘信息',
  };
  return names[type] || '元素';
}
