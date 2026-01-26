import { useEditorStore } from '../store';
import { GlobalSizeSettings } from '../types';

interface SettingItemProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

function SettingItem({ label, value, onChange, min = 0, max = 200, step = 1, unit = 'px' }: SettingItemProps) {
  return (
    <div className="setting-item">
      <span className="setting-label">{label}</span>
      <div className="setting-control">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
        />
        <span className="setting-unit">{unit}</span>
      </div>
    </div>
  );
}

interface ColorSettingItemProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorSettingItem({ label, value, onChange }: ColorSettingItemProps) {
  return (
    <div className="setting-item">
      <span className="setting-label">{label}</span>
      <div className="setting-control" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '4px', 
            backgroundColor: value,
            border: '1px solid #ddd',
            flexShrink: 0
          }} 
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, height: '32px', padding: '0 2px' }}
        />
      </div>
    </div>
  );
}

export default function SettingsPanel() {
  const { sizeSettings, setSizeSettings, resetSizeSettings, showSettings, setShowSettings } = useEditorStore();

  if (!showSettings) return null;

  const updateSetting = <K extends keyof GlobalSizeSettings>(key: K, value: GlobalSizeSettings[K]) => {
    setSizeSettings({ [key]: value });
  };

  return (
    <div className="settings-overlay" onClick={() => setShowSettings(false)}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>全局设置</h2>
          <div className="settings-header-actions">
            <button className="btn btn-secondary" onClick={resetSizeSettings}>
              恢复默认
            </button>
            <button className="btn-icon" onClick={() => setShowSettings(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="settings-content">
          {/* 导视牌整体 */}
          <div className="settings-section">
            <div className="settings-section-title">导视牌</div>
            <SettingItem
              label="高度"
              value={sizeSettings.signageHeight}
              onChange={(v) => updateSetting('signageHeight', v)}
              min={40}
              max={200}
            />
            <SettingItem
              label="水平内边距"
              value={sizeSettings.signagePaddingH}
              onChange={(v) => updateSetting('signagePaddingH', v)}
              min={0}
              max={100}
            />
            <SettingItem
              label="垂直内边距"
              value={sizeSettings.signagePaddingV}
              onChange={(v) => updateSetting('signagePaddingV', v)}
              min={0}
              max={50}
            />
            <div className="setting-item">
              <span className="setting-label">中文字体</span>
              <div className="setting-control">
                <select
                  value={sizeSettings.fontFamilyCn || 'default'}
                  onChange={(e) => updateSetting('fontFamilyCn', e.target.value as 'default' | 'simhei' | 'arial')}
                  style={{ width: '100%' }}
                >
                  <option value="default">默认字体</option>
                  <option value="simhei">黑体 (SimHei)</option>
                  <option value="arial">Arial</option>
                </select>
              </div>
            </div>
            <div className="setting-item">
              <span className="setting-label">英文字体</span>
              <div className="setting-control">
                <select
                  value={sizeSettings.fontFamilyEn || 'default'}
                  onChange={(e) => updateSetting('fontFamilyEn', e.target.value as 'default' | 'simhei' | 'arial')}
                  style={{ width: '100%' }}
                >
                  <option value="default">默认字体</option>
                  <option value="simhei">黑体 (SimHei)</option>
                  <option value="arial">Arial</option>
                </select>
              </div>
            </div>
          </div>

          {/* 出口标识 */}
          <div className="settings-section">
            <div className="settings-section-title">出口标识</div>
            <ColorSettingItem
              label="填充颜色"
              value={sizeSettings.exitFillColor}
              onChange={(v) => updateSetting('exitFillColor', v)}
            />
            <ColorSettingItem
              label="文字颜色"
              value={sizeSettings.exitTextColor}
              onChange={(v) => updateSetting('exitTextColor', v)}
            />
            <SettingItem
              label="尺寸"
              value={sizeSettings.exitSize}
              onChange={(v) => updateSetting('exitSize', v)}
              min={20}
              max={80}
            />
            <SettingItem
              label="字号"
              value={sizeSettings.exitFontSize}
              onChange={(v) => updateSetting('exitFontSize', v)}
              min={10}
              max={50}
            />
            <SettingItem
              label="字重"
              value={Number(sizeSettings.exitFontWeight)}
              onChange={(v) => updateSetting('exitFontWeight', v)}
              min={100}
              max={900}
              step={100}
              unit=""
            />
            <SettingItem
              label="边框宽度"
              value={sizeSettings.exitBorderWidth}
              onChange={(v) => updateSetting('exitBorderWidth', v)}
              min={0}
              max={10}
              step={0.5}
            />
          </div>

          {/* 线路标识 */}
          <div className="settings-section">
            <div className="settings-section-title">线路标识</div>
            <SettingItem
              label="宽度"
              value={sizeSettings.lineBadgeWidth}
              onChange={(v) => updateSetting('lineBadgeWidth', v)}
              min={16}
              max={80}
            />
            <SettingItem
              label="高度"
              value={sizeSettings.lineBadgeHeight}
              onChange={(v) => updateSetting('lineBadgeHeight', v)}
              min={16}
              max={80}
            />
            <SettingItem
              label="字号"
              value={sizeSettings.lineBadgeFontSize}
              onChange={(v) => updateSetting('lineBadgeFontSize', v)}
              min={8}
              max={40}
            />
            <SettingItem
              label="字重"
              value={Number(sizeSettings.lineBadgeFontWeight)}
              onChange={(v) => updateSetting('lineBadgeFontWeight', v)}
              min={100}
              max={900}
              step={100}
              unit=""
            />
            <SettingItem
              label="默认圆角"
              value={sizeSettings.lineBadgeRadius}
              onChange={(v) => updateSetting('lineBadgeRadius', v)}
              min={0}
              max={40}
            />
          </div>

          {/* 文字 */}
          <div className="settings-section">
            <div className="settings-section-title">文字元素</div>
            <SettingItem
              label="中文字号"
              value={sizeSettings.textCnFontSize}
              onChange={(v) => updateSetting('textCnFontSize', v)}
              min={10}
              max={60}
            />
            <SettingItem
              label="中文字重"
              value={Number(sizeSettings.textCnFontWeight)}
              onChange={(v) => updateSetting('textCnFontWeight', v)}
              min={100}
              max={900}
              step={100}
              unit=""
            />
            <SettingItem
              label="英文字号"
              value={sizeSettings.textEnFontSize}
              onChange={(v) => updateSetting('textEnFontSize', v)}
              min={6}
              max={40}
            />
            <SettingItem
              label="英文字重"
              value={Number(sizeSettings.textEnFontWeight)}
              onChange={(v) => updateSetting('textEnFontWeight', v)}
              min={100}
              max={900}
              step={100}
              unit=""
            />
            <SettingItem
              label="大文字字号"
              value={sizeSettings.largeTextFontSize}
              onChange={(v) => updateSetting('largeTextFontSize', v)}
              min={10}
              max={80}
            />
            <SettingItem
              label="大文字字重"
              value={Number(sizeSettings.largeTextFontWeight)}
              onChange={(v) => updateSetting('largeTextFontWeight', v)}
              min={100}
              max={900}
              step={100}
              unit=""
            />
            <SettingItem
              label="行间距"
              value={sizeSettings.textLineGap}
              onChange={(v) => updateSetting('textLineGap', v)}
              min={0}
              max={20}
            />
          </div>

          {/* 方向箭头 */}
          <div className="settings-section">
            <div className="settings-section-title">方向箭头</div>
            <SettingItem
              label="尺寸"
              value={sizeSettings.arrowSize}
              onChange={(v) => updateSetting('arrowSize', v)}
              min={16}
              max={80}
            />
            <SettingItem
              label="线宽"
              value={sizeSettings.arrowStrokeWidth}
              onChange={(v) => updateSetting('arrowStrokeWidth', v)}
              min={1}
              max={10}
              step={0.5}
            />
          </div>

          {/* 设施图标 */}
          <div className="settings-section">
            <div className="settings-section-title">设施图标</div>
            <SettingItem
              label="尺寸"
              value={sizeSettings.iconSize}
              onChange={(v) => updateSetting('iconSize', v)}
              min={16}
              max={80}
            />
            <SettingItem
              label="圆角"
              value={sizeSettings.iconRadius}
              onChange={(v) => updateSetting('iconRadius', v)}
              min={0}
              max={40}
            />
          </div>

          {/* 分隔线 */}
          <div className="settings-section">
            <div className="settings-section-title">分隔线</div>
            <SettingItem
              label="宽度"
              value={sizeSettings.dividerWidth}
              onChange={(v) => updateSetting('dividerWidth', v)}
              min={0.5}
              max={10}
              step={0.5}
            />
            <SettingItem
              label="高度"
              value={sizeSettings.dividerHeight}
              onChange={(v) => updateSetting('dividerHeight', v)}
              min={10}
              max={80}
            />
          </div>

          {/* 换乘信息 - REMOVED */}
          {/* 
          <div className="settings-section">
            <div className="settings-section-title">换乘信息</div>
            <SettingItem
              label="徽章尺寸"
              value={sizeSettings.transferBadgeSize}
              onChange={(v) => updateSetting('transferBadgeSize', v)}
              min={12}
              max={60}
            />
            <SettingItem
              label="徽章字号"
              value={sizeSettings.transferFontSize}
              onChange={(v) => updateSetting('transferFontSize', v)}
              min={6}
              max={30}
            />
            <SettingItem
              label="文字字号"
              value={sizeSettings.transferTextSize}
              onChange={(v) => updateSetting('transferTextSize', v)}
              min={6}
              max={30}
            />
          </div> 
          */}

          {/* 间距系统 */}
          <div className="settings-section">
            <div className="settings-section-title">间距系统</div>
            <SettingItem
              label="紧凑间距"
              value={sizeSettings.gapSmall}
              onChange={(v) => updateSetting('gapSmall', v)}
              min={0}
              max={50}
            />
            <SettingItem
              label="标准间距"
              value={sizeSettings.gapNormal}
              onChange={(v) => updateSetting('gapNormal', v)}
              min={0}
              max={50}
            />
            <SettingItem
              label="宽松间距"
              value={sizeSettings.gapLarge}
              onChange={(v) => updateSetting('gapLarge', v)}
              min={0}
              max={80}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
