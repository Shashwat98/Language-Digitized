export type Stack<T> = {
  past: T[];
  present: T;
  future: T[];
};

export function createStack<T>(initial: T): Stack<T> {
  return { past: [], present: initial, future: [] };
}

export function push<T>(s: Stack<T>, next: T): Stack<T> {
  return { past: [...s.past, s.present], present: next, future: [] };
}

export function canUndo<T>(s: Stack<T>) { return s.past.length > 0; }
export function canRedo<T>(s: Stack<T>) { return s.future.length > 0; }

export function undo<T>(s: Stack<T>): Stack<T> {
  if (!canUndo(s)) return s;
  const prev = s.past[s.past.length - 1];
  return { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future] };
}

export function redo<T>(s: Stack<T>): Stack<T> {
  if (!canRedo(s)) return s;
  const next = s.future[0];
  return { past: [...s.past, s.present], present: next, future: s.future.slice(1) };
}
