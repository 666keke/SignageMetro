// Type definitions for Metro Signage Generator
// 轨道交通导视牌 - 一行水平排列的标准化设计

export type ElementType = 
  | 'exit'           // 出口标识
  | 'line_badge'     // 线路徽章
  | 'text'           // 文字（中英双行）
  | 'large_text'     // 大文字（单行，高度等于双行文字总高）
  | 'arrow'          // 方向箭头
  | 'icon'           // 设施图标
  | 'divider'        // 分隔线
  | 'spacer';        // 推右占位符

export type ArrowDirection = 'left' | 'right' | 'up' | 'down' | 'up-left' | 'up-right' | 'down-left' | 'down-right';

export type IconName = 'elevator' | 'escalator' | 'accessible' | 'restroom' | 'restroom_male' | 'restroom_female' | 'convenience_store' | 'atm' | 'ticket' | 'info' | 'exit_icon' | string;

export interface CustomIcon {
  id: string;
  name: string;
  content: string; // SVG string or Data URL
}

export type TextAlign = 'left' | 'center' | 'right';

// 标准化尺寸系统 - 基于 72px 高度的导视牌
export const STANDARD_SIZES = {
  // 导视牌高度
  SIGNAGE_HEIGHT: 72,
  SIGNAGE_PADDING_H: 20,
  SIGNAGE_PADDING_V: 12,
  
  // 出口标识（圆形）
  EXIT_SIZE: 44,
  EXIT_FONT_SIZE: 26,
  EXIT_BORDER_WIDTH: 2.5,
  
  // 线路标识（正方形，比出口小一点以视觉平衡）
  LINE_BADGE_SIZE: 42,
  LINE_BADGE_FONT_SIZE: 26,
  LINE_BADGE_RADIUS: 6,
  
  // 文字
  STATION_CN_FONT_SIZE: 22,
  STATION_EN_FONT_SIZE: 10,
  STATION_LINE_GAP: 2,
  LARGE_TEXT_FONT_SIZE: 34, // 22 + 10 + 2 = 34
  
  // 方向箭头
  ARROW_SIZE: 42,
  ARROW_STROKE_WIDTH: 3,
  
  // 设施图标（与线路标识相同高度）
  ICON_SIZE: 42,
  ICON_RADIUS: 4,
  
  // 分隔线
  DIVIDER_WIDTH: 1.5,
  DIVIDER_HEIGHT: 36,
  
  // 间距系统
  GAP_SMALL: 8,
  GAP_NORMAL: 14,
  GAP_LARGE: 24,
};

export interface SignageElement {
  id: string;
  type: ElementType;
  
  // 内容相关
  content?: string;          // 主要文字内容（站名等）
  contentEn?: string;        // 英文内容
  exitLabel?: string;        // 出口字母 A/B/C/D
  arrowDirection?: ArrowDirection;
  lineNumber?: string;       // 线路号
  lineColor?: string;        // 线路颜色
  isCustomLine?: boolean;    // 是否为自定义线路（允许手动输入）
  badgeCompress?: boolean;   // 是否压缩文字以适应宽度
  iconName?: IconName;       // 图标名称
  
  // 线路标识样式选项
  // badgeRadius?: number;      // Deprecated: 圆角半径统一在全局设置中调整
  badgeStroke?: boolean;     // 是否有描边
  badgeStrokeColor?: string; // 描边颜色
  badgeStrokeWidth?: number; // 描边粗细
  badgeTextWhite?: boolean;  // 文字是否为白色 (false = 黑色)
  
  // 站名对齐
  textAlign?: TextAlign;     // 文字对齐方式
  
  // 文字/大文字特定覆盖设置
  fontWeight?: number | string; // 覆盖全局字体粗细
  fontSize?: number;            // 覆盖全局字号 (中文/大文字)
  fontSizeEn?: number;          // 覆盖全局字号 (英文)

  // 通用颜色设置 (适用于文字、箭头等)
  colorMode?: 'auto' | 'exit' | 'custom'; // 颜色模式
  customColor?: string;  // 自定义颜色

  // 图标特定设置
  iconBackgroundColor?: string; // 图标底色 (支持 'transparent')
  iconPadding?: number; // 图标边框内边距 (0 表示无边距)
  
  // 间距设置
  gapAfter?: 'none' | 'small' | 'normal' | 'large';  // 该元素后的间距
  
  // 状态
  visible: boolean;
}

export interface SignageRow {
  id: string;
  elements: SignageElement[];
  backgroundColor: string;
  height: number;
}

export interface Project {
  id: string;
  name: string;
  width: number;              // 导视牌总宽度
  rows: SignageRow[];         // 可以有多行（但通常是一行）
  theme: ThemeConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeConfig {
  name: string;
  backgroundColor: string;
  primaryColor: string;       // 主要文字颜色
  secondaryColor: string;     // 次要文字颜色
  fontFamily: string;
  fontFamilyEn: string;
}

// 预设主题
export const THEMES: Record<string, ThemeConfig> = {
  beijing: {
    name: '浅色',
    backgroundColor: '#FFFFFF',
    primaryColor: '#000000',
    secondaryColor: '#666666',
    fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
    fontFamilyEn: '"Helvetica Neue", "Arial", sans-serif',
  },
  dark: {
    name: '深色',
    backgroundColor: '#1C1C1E',
    primaryColor: '#FFFFFF',
    secondaryColor: '#8E8E93',
    fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif',
    fontFamilyEn: '"SF Pro Display", "Helvetica Neue", sans-serif',
  },
};

// Metro line colors
export const LINE_COLORS: Record<string, string> = {
  '1': '#C23A30',
  '2': '#006098',
  '3': '#EF8200',
  '4': '#008C95',
  '5': '#A6217C',
  '6': '#D29700',
  '7': '#E76021',
  '8': '#009B77',
  '9': '#8FC31F',
  '10': '#009AD6',
  '11': '#6B3A2A',
  '12': '#007A60',
  '13': '#F0A3B5',
  '14': '#82C8E6',
  '15': '#6D4C94',
  '16': '#96D7D2',
  'S1': '#D4A76A',
  'S2': '#B5A79E',
};

// 预设宽度
export const WIDTH_PRESETS = {
  small: { width: 600, name: '小型 (600px)' },
  medium: { width: 900, name: '中型 (900px)' },
  large: { width: 1200, name: '大型 (1200px)' },
  xlarge: { width: 1600, name: '特大 (1600px)' },
};

// 全局尺寸设置（可由用户在全局设置中调整）
export interface GlobalSizeSettings {
  // 画板设置
  signageHeight: number;
  signagePaddingH: number;
  signagePaddingV: number;
  globalFont: 'default' | 'simhei'; // Deprecated, kept for backward compatibility if needed, but we will use specific ones
  fontFamilyCn: 'default' | 'simhei' | 'arial'; // 中文字体
  fontFamilyEn: 'default' | 'simhei' | 'arial'; // 英文字体
  
  // 出口标识
  exitSize: number;
  exitFontSize: number;
  exitBorderWidth: number;
  exitFillColor: string; // 全局设置：填充颜色
  exitTextColor: string; // 全局设置：文字颜色
  
  // 线路标识
  lineBadgeWidth: number;
  lineBadgeHeight: number;
  lineBadgeFontSize: number;
  lineBadgeRadius: number;
  
  // 字体粗细
  textCnFontWeight: number | string;
  textEnFontWeight: number | string;
  largeTextFontWeight: number | string;
  exitFontWeight: number | string;
  lineBadgeFontWeight: number | string;

  // 文字
  textCnFontSize: number;
  textEnFontSize: number;
  textLineGap: number;
  largeTextFontSize: number;
  
  // 方向箭头
  arrowSize: number;
  arrowStrokeWidth: number;
  
  // 设施图标
  iconSize: number;
  iconRadius: number;
  
  // 分隔线
  dividerWidth: number;
  dividerHeight: number;
  
  // 换乘
  // transferBadgeSize: number;
  // transferFontSize: number;
  // transferTextSize: number;
  
  // 元素间距
  gapSmall: number;
  gapNormal: number;
  gapLarge: number;
}

// 默认全局设置（基于 STANDARD_SIZES）
export const DEFAULT_SIZE_SETTINGS: GlobalSizeSettings = {
  signageHeight: 72,
  signagePaddingH: 20,
  signagePaddingV: 12,
  globalFont: 'default',
  fontFamilyCn: 'default',
  fontFamilyEn: 'default',
  
  exitSize: 44,
  exitFontSize: 26,
  exitBorderWidth: 2.5,
  exitFillColor: '#FFCD00',
  exitTextColor: '#000000',
  
  lineBadgeWidth: 42,
  lineBadgeHeight: 42,
  lineBadgeFontSize: 26,
  lineBadgeRadius: 6,

  textCnFontWeight: 600,
  textEnFontWeight: 500,
  largeTextFontWeight: 600,
  exitFontWeight: 700,
  lineBadgeFontWeight: 700,
  
  textCnFontSize: 22,
  textEnFontSize: 10,
  textLineGap: 2,
  largeTextFontSize: 34,
  
  arrowSize: 42,
  arrowStrokeWidth: 3,
  
  iconSize: 42,
  iconRadius: 4,
  
  dividerWidth: 1.5,
  dividerHeight: 36,
  
  // transferBadgeSize: 26,
  // transferFontSize: 13,
  // transferTextSize: 12,
  
  gapSmall: 8,
  gapNormal: 14,
  gapLarge: 24,
};
