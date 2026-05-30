import { useState, useCallback, useRef } from 'react';
import type { DragItem } from '../types';

interface DragState {
  item: DragItem;
  ghostX: number;
  ghostY: number;
  activeDropZone: string | null;
}

function zoneAcceptsItem(item: DragItem, zoneId: string): boolean {
  if (item.kind === 'operator') return zoneId.startsWith('slot-');
  if (item.value === 'open') return zoneId.startsWith('open-');
  if (item.value === 'close') return zoneId.startsWith('close-');
  return false;
}

function findDropZone(x: number, y: number, item: DragItem): string | null {
  const elements = document.elementsFromPoint(x, y);
  for (const el of elements) {
    if (!(el instanceof Element)) continue;
    if ((el as HTMLElement).classList?.contains('drag-ghost')) continue;
    const zoneEl = el.closest('[data-drop]');
    if (!zoneEl) continue;
    const zoneId = zoneEl.getAttribute('data-drop');
    if (zoneId && zoneAcceptsItem(item, zoneId)) return zoneId;
  }
  return null;
}

export function useDragDrop(onDrop: (item: DragItem, zoneId: string) => void) {
  const [state, setState] = useState<DragState | null>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const activeZoneRef = useRef<string | null>(null);
  const itemRef = useRef<DragItem | null>(null);

  const startDrag = useCallback((item: DragItem, e: React.PointerEvent) => {
    e.preventDefault();
    // Release implicit pointer capture so events fire normally on document
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }

    itemRef.current = item;
    activeZoneRef.current = null;
    setState({ item, ghostX: e.clientX, ghostY: e.clientY, activeDropZone: null });

    const handleMove = (me: PointerEvent) => {
      const currentItem = itemRef.current;
      if (!currentItem) return;
      const zone = findDropZone(me.clientX, me.clientY, currentItem);
      activeZoneRef.current = zone;
      setState(prev =>
        prev ? { ...prev, ghostX: me.clientX, ghostY: me.clientY, activeDropZone: zone } : null
      );
    };

    const cleanup = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', cleanup);
      document.removeEventListener('pointercancel', cleanup);
      const zone = activeZoneRef.current;
      const droppedItem = itemRef.current;
      activeZoneRef.current = null;
      itemRef.current = null;
      setState(null);
      if (zone && droppedItem) {
        onDropRef.current(droppedItem, zone);
      }
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', cleanup, { once: true });
    document.addEventListener('pointercancel', cleanup, { once: true });
  }, []);

  return {
    dragging: state?.item ?? null,
    activeDropZone: state?.activeDropZone ?? null,
    ghostPos: state ? { x: state.ghostX, y: state.ghostY } : null,
    startDrag,
  };
}
