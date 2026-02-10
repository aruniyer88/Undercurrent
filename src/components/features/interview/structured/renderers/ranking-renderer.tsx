'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuestionRendererProps } from '@/lib/types/interview';
import type { RankingConfig } from '@/lib/types/database';

function SortableItem({ id, label, index }: { id: string; label: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-xl border-2 bg-white transition-shadow ${
        isDragging ? 'shadow-lg border-primary-300 z-10' : 'border-neutral-200'
      }`}
    >
      <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-500 shrink-0">
        {index + 1}
      </span>
      <span className="flex-1 text-neutral-800">{label}</span>
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </button>
    </div>
  );
}

export function RankingRenderer({ item, onSubmit }: QuestionRendererProps) {
  const config = item.item_config as RankingConfig;
  const [items, setItems] = useState<string[]>(config?.items || []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSubmit = () => {
    onSubmit({
      flowItemId: item.id,
      rankedItems: items,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-medium text-neutral-900 leading-relaxed">
        {item.question_text}
      </h2>
      <p className="text-sm text-neutral-500">Drag to rank in order of preference</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((itemLabel, index) => (
              <SortableItem key={itemLabel} id={itemLabel} label={itemLabel} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        onClick={handleSubmit}
        className="w-full h-12 bg-primary-600 hover:bg-primary-700"
      >
        Continue
      </Button>
    </div>
  );
}
