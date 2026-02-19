import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook to manage canvas state history (Undo/Redo)
 */
export function useCanvasHistory<T>(initialState: T) {
  const [present, _setPresent] = useState<T>(initialState);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const setPresent = useCallback((newState: T | ((prev: T) => T), saveToHistory = true) => {
    _setPresent(prev => {
      const nextState = typeof newState === 'function' ? (newState as any)(prev) : newState;
      
      // If the state hasn't changed, don't save to history
      if (JSON.stringify(nextState) === JSON.stringify(prev)) {
        return prev;
      }

      if (saveToHistory) {
        past.current.push(prev);
        if (past.current.length > 50) past.current.shift();
        future.current = [];
      }
      
      return nextState;
    });
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;

    const previous = past.current.pop()!;
    future.current.push(present);
    _setPresent(previous);
  }, [present]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;

    const next = future.current.pop()!;
    past.current.push(present);
    _setPresent(next);
  }, [present]);

  return {
    state: present,
    setState: setPresent,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    resetHistory: useCallback((newState: T) => {
      _setPresent(newState);
      past.current = [];
      future.current = [];
    }, [])
  };
}
