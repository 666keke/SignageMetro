import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  SignageElement, 
  SignageRow, 
  ThemeConfig, 
  THEMES, 
  WIDTH_PRESETS,
  STANDARD_SIZES,
  GlobalSizeSettings,
  DEFAULT_SIZE_SETTINGS,
  CustomIcon,
} from './types';

interface EditorStore {
  // Project state
  projectName: string;
  width: number;
  rows: SignageRow[];
  theme: ThemeConfig;
  sizeSettings: GlobalSizeSettings;
  customIcons: CustomIcon[];

  // Selection
  selectedElementIds: string[];
  selectedElementId: string | null; // Deprecated, use selectedElementIds
  selectedRowId: string;
  
  // Drag state for reordering
  draggedElementId: string | null;
  dragOverIndex: number | null;
  
  // History
  history: { rows: SignageRow[] }[];
  historyIndex: number;
  
  // View
  zoom: number;
  showSettings: boolean;
  
  // Actions - Project
  setProjectName: (name: string) => void;
  setWidth: (width: number) => void;
  setWidthPreset: (preset: string) => void;
  setTheme: (themeName: string) => void;
  
  // Actions - Settings
  setSizeSettings: (settings: Partial<GlobalSizeSettings>) => void;
  resetSizeSettings: () => void;
  setShowSettings: (show: boolean) => void;
  
  // Actions - Rows
  addRow: () => void;
  deleteRow: (rowId: string) => void;
  setRowBackgroundColor: (rowId: string, color: string) => void;
  
  // Actions - Elements
  addElement: (rowId: string, element: Partial<SignageElement>, index?: number) => void;
  updateElement: (rowId: string, elementId: string, updates: Partial<SignageElement>) => void;
  deleteElement: (rowId: string, elementId: string) => void;
  moveElement: (rowId: string, fromIndex: number, toIndex: number) => void;
  duplicateElement: (rowId: string, elementId: string) => void;
  
  // Actions - Selection
  selectElement: (elementId: string | null, multi?: boolean) => void;
  selectRow: (rowId: string) => void;
  
  // Actions - Drag
  setDraggedElement: (elementId: string | null) => void;
  setDragOverIndex: (index: number | null) => void;
  
  // Actions - History
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Actions - View
  setZoom: (zoom: number) => void;
  
  // Actions - Import/Export
  exportToJSON: () => string;
  importFromJSON: (json: string) => void;
  clearAll: () => void;

  // Actions - Custom Icons
  addCustomIcon: (icon: CustomIcon) => void;
  removeCustomIcon: (id: string) => void;
}

const DEFAULT_THEME = THEMES.beijing;

const createDefaultRow = (): SignageRow => ({
  id: uuidv4(),
  elements: [],
  backgroundColor: DEFAULT_THEME.backgroundColor,
  height: STANDARD_SIZES.SIGNAGE_HEIGHT,
});

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  projectName: '未命名导视牌',
  width: WIDTH_PRESETS.medium.width,
  rows: [createDefaultRow()],
  theme: DEFAULT_THEME,
  sizeSettings: { ...DEFAULT_SIZE_SETTINGS },
  customIcons: [],
  selectedElementIds: [],
  selectedElementId: null,
  selectedRowId: '',
  draggedElementId: null,
  dragOverIndex: null,
  history: [],
  historyIndex: -1,
  zoom: 1,
  showSettings: false,
  
  // Project actions
  setProjectName: (name) => set({ projectName: name }),
  
  setWidth: (width) => set({ width }),
  
  setWidthPreset: (preset) => {
    const presetConfig = WIDTH_PRESETS[preset as keyof typeof WIDTH_PRESETS];
    if (presetConfig) {
      set({ width: presetConfig.width });
    }
  },
  
  setTheme: (themeName) => {
    const theme = THEMES[themeName];
    if (theme) {
      set((state) => ({
        theme,
        rows: state.rows.map(row => ({
          ...row,
          backgroundColor: theme.backgroundColor,
        })),
      }));
    }
  },
  
  // Settings actions
  setSizeSettings: (settings) => {
    set((state) => ({
      sizeSettings: { ...state.sizeSettings, ...settings },
    }));
  },
  
  resetSizeSettings: () => {
    set({ sizeSettings: { ...DEFAULT_SIZE_SETTINGS } });
  },
  
  setShowSettings: (show) => set({ showSettings: show }),
  
  // Row actions
  addRow: () => {
    const state = get();
    state.saveHistory();
    const newRow = createDefaultRow();
    // 确保新行中不包含 transfer 类型的元素
    // newRow.elements = newRow.elements.filter(el => el.type !== 'transfer');
    newRow.backgroundColor = state.theme.backgroundColor;
    set({ rows: [...state.rows, newRow] });
  },
  
  deleteRow: (rowId) => {
    const state = get();
    if (state.rows.length <= 1) return;
    state.saveHistory();
    set({
      rows: state.rows.filter(r => r.id !== rowId),
      selectedRowId: state.selectedRowId === rowId ? state.rows[0].id : state.selectedRowId,
    });
  },
  
  setRowBackgroundColor: (rowId, color) => {
    set((state) => ({
      rows: state.rows.map(row =>
        row.id === rowId ? { ...row, backgroundColor: color } : row
      ),
    }));
  },
  
  // Element actions
  addElement: (rowId, element, index) => {
    const state = get();
    state.saveHistory();

    // Check if adding a spacer and if one already exists in the target row
    // if (element.type === 'spacer') {
    //   const targetRow = state.rows.find(r => r.id === rowId);
    //   if (targetRow && targetRow.elements.some(el => el.type === 'spacer')) {
    //     // Already exists, do not add another
    //     return;
    //   }
    // }
    
    const newElement: SignageElement = {
      id: uuidv4(),
      type: element.type || 'icon',
      content: element.content,
      contentEn: element.contentEn,
      exitLabel: element.exitLabel,
      arrowDirection: element.arrowDirection,
      lineNumber: element.lineNumber,
      lineColor: element.lineColor,
      iconName: element.iconName,
      badgeStroke: element.badgeStroke,
      badgeStrokeColor: element.badgeStrokeColor,
      badgeTextWhite: element.badgeTextWhite,
      textAlign: element.textAlign,
      colorMode: element.colorMode,
      customColor: element.customColor,
      gapAfter: element.gapAfter || 'normal',
      visible: true,
    };
    
    set({
      rows: state.rows.map(row => {
        if (row.id !== rowId) return row;
        const newElements = [...row.elements];
        if (index !== undefined && index >= 0) {
          newElements.splice(index, 0, newElement);
        } else {
          newElements.push(newElement);
        }
        return { ...row, elements: newElements };
      }),
      selectedElementId: newElement.id,
    });
  },
  
  updateElement: (rowId, elementId, updates) => {
    set((state) => ({
      rows: state.rows.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          elements: row.elements.map(el =>
            el.id === elementId ? { ...el, ...updates } : el
          ),
        };
      }),
    }));
  },
  
  deleteElement: (rowId, elementId) => {
    const state = get();
    state.saveHistory();
    set({
      rows: state.rows.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          elements: row.elements.filter(el => el.id !== elementId),
        };
      }),
      selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
    });
  },
  
  moveElement: (rowId, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const state = get();
    state.saveHistory();
    
    set({
      rows: state.rows.map(row => {
        if (row.id !== rowId) return row;
        const newElements = [...row.elements];
        const [removed] = newElements.splice(fromIndex, 1);
        newElements.splice(toIndex, 0, removed);
        return { ...row, elements: newElements };
      }),
    });
  },
  
  duplicateElement: (rowId, elementId) => {
    const state = get();
    state.saveHistory();
    
    set({
      rows: state.rows.map(row => {
        if (row.id !== rowId) return row;
        const index = row.elements.findIndex(el => el.id === elementId);
        if (index === -1) return row;
        
        const original = row.elements[index];

        // Do not duplicate spacer
        if (original.type === 'spacer') {
          return row;
        }

        const duplicate: SignageElement = {
          ...original,
          id: uuidv4(),
        };
        
        const newElements = [...row.elements];
        newElements.splice(index + 1, 0, duplicate);
        return { ...row, elements: newElements };
      }),
    });
  },
  
  // Selection actions
  selectElement: (elementId, multi = false) => {
    set((state) => {
      // Clear selection
      if (elementId === null) {
        return { 
          selectedElementIds: [],
          selectedElementId: null 
        };
      }

      // Multi-selection
      if (multi) {
        const isSelected = state.selectedElementIds.includes(elementId);
        let newIds;
        
        if (isSelected) {
          // Deselect if already selected
          newIds = state.selectedElementIds.filter(id => id !== elementId);
        } else {
          // Add to selection
          newIds = [...state.selectedElementIds, elementId];
        }
        
        // Update selectedElementId to the last selected one or null if empty
        return {
          selectedElementIds: newIds,
          selectedElementId: newIds.length > 0 ? newIds[newIds.length - 1] : null
        };
      }
      
      // Single selection
      return { 
        selectedElementIds: [elementId],
        selectedElementId: elementId
      };
    });
  },
  selectRow: (rowId) => set({ selectedRowId: rowId }),
  
  // Drag actions
  setDraggedElement: (elementId) => set({ draggedElementId: elementId }),
  setDragOverIndex: (index) => set({ dragOverIndex: index }),
  
  // History actions
  saveHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ rows: JSON.parse(JSON.stringify(state.rows)) });
    
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
  
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({
        rows: JSON.parse(JSON.stringify(state.history[newIndex].rows)),
        historyIndex: newIndex,
        selectedElementId: null,
      });
    }
  },
  
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({
        rows: JSON.parse(JSON.stringify(state.history[newIndex].rows)),
        historyIndex: newIndex,
        selectedElementId: null,
      });
    }
  },
  
  // View actions
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),
  
  // Import/Export
  exportToJSON: () => {
    const state = get();
    return JSON.stringify({
      projectName: state.projectName,
      width: state.width,
      rows: state.rows,
      theme: state.theme,
      sizeSettings: state.sizeSettings,
      customIcons: state.customIcons,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },
  
  importFromJSON: (json) => {
    try {
      const data = JSON.parse(json);
      const state = get();
      state.saveHistory();
      
      set({
        projectName: data.projectName || '导入的项目',
        width: data.width || WIDTH_PRESETS.medium.width,
        rows: data.rows || [createDefaultRow()],
        theme: data.theme || DEFAULT_THEME,
        sizeSettings: data.sizeSettings || { ...DEFAULT_SIZE_SETTINGS },
        customIcons: data.customIcons || [],
        selectedElementId: null,
      });
    } catch (e) {
      console.error('Failed to import JSON:', e);
      throw new Error('无法解析项目文件');
    }
  },
  
  clearAll: () => {
    const state = get();
    state.saveHistory();
    set({
      rows: [createDefaultRow()],
      selectedElementId: null,
    });
  },

  addCustomIcon: (icon) => {
    set((state) => ({
      customIcons: [...state.customIcons, icon],
    }));
  },

  removeCustomIcon: (id) => {
    set((state) => ({
      customIcons: state.customIcons.filter(icon => icon.id !== id),
    }));
  },
}));
