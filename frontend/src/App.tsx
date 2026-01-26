import { useEffect, useCallback } from 'react';
import { useEditorStore } from './store';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SignageCanvas from './components/SignageCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import SettingsPanel from './components/SettingsPanel';
import MobileWarningModal from './components/MobileWarningModal';

function App() {
  const { undo, redo, selectElement, rows, selectedElementId } = useEditorStore();

  // Find selected element's row
  const findElementRow = useCallback(() => {
    for (const row of rows) {
      const element = row.elements.find(el => el.id === selectedElementId);
      if (element) return { row, element };
    }
    return null;
  }, [rows, selectedElementId]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const found = findElementRow();
      if (found && selectedElementId) {
        useEditorStore.getState().deleteElement(found.row.id, selectedElementId);
      }
    }
    
    // Undo: Cmd/Ctrl + Z
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    
    // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
    if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
    
    // Escape: clear selection
    if (e.key === 'Escape') {
      selectElement(null);
    }
    
    // Duplicate: Cmd/Ctrl + D
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault();
      const found = findElementRow();
      if (found && selectedElementId) {
        useEditorStore.getState().duplicateElement(found.row.id, selectedElementId);
      }
    }
  }, [undo, redo, selectElement, selectedElementId, findElementRow]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app">
      <Header />
      <Sidebar />
      <SignageCanvas />
      <PropertiesPanel />
      <SettingsPanel />
      <MobileWarningModal />
    </div>
  );
}

export default App;
