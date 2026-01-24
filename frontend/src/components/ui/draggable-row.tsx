import React, { forwardRef, memo, useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

interface DraggableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const DraggableRow = memo(
  forwardRef<HTMLTableRowElement, DraggableRowProps>(({ id, children, className = "", ...props }, ref) => {
    const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
      id,
      data: { type: "project", id },
    });

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
      id,
      data: { type: "project", id },
    });

    const setRef = useCallback(
      (element: HTMLTableRowElement) => {
        setDraggableRef(element);
        setDroppableRef(element);

        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTableRowElement>).current = element;
        }
      },
      [setDraggableRef, setDroppableRef, ref]
    );

    return (
      <tr
        ref={setRef}
        className={`${className} ${isDragging ? "opacity-50 bg-blue-50 dark:bg-blue-950/30" : ""} ${
          isOver ? "bg-blue-100 dark:bg-blue-900/30" : ""
        }`}
        {...attributes}
        {...listeners}
        data-project-id={id}
        style={{ cursor: isDragging ? "grabbing" : undefined }}
        {...props}
      >
        {children}
      </tr>
    );
  })
);

DraggableRow.displayName = "DraggableRow";

interface DropZoneProps {
  id: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  "data-dropzone-id"?: string;
}

export const DropZone = memo(({ id, className = "", children, style, ...rest }: DropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "root", id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${
        isOver ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 dark:ring-blue-400 transition-all duration-200" : ""
      }`}
      style={{ minHeight: "20px", ...style }}
      data-dropzone-id={id}
      {...rest}
    >
      {children}
    </div>
  );
});

DropZone.displayName = "DropZone";
