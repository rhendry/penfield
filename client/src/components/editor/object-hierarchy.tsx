import React from "react";
import { ChevronRight, ChevronDown, Eye, EyeOff, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PixelObject } from "@shared/types/pixel-asset";
import { createDefaultObject } from "@shared/utils/pixel-asset";

export interface ObjectHierarchyProps {
  objects: PixelObject[];
  selectedObjectId: string | null;
  onObjectClick?: (objectId: string) => void;
  onObjectVisibilityToggle?: (objectId: string) => void;
  onObjectAdd?: (parentId?: string) => void;
  onObjectDelete?: (objectId: string) => void;
  onObjectRename?: (objectId: string, name: string) => void;
  onObjectReorder?: (objectId: string, newOrder: number, targetParentId?: string) => void;
  onObjectReparent?: (objectId: string, newParentId: string | null) => void;
  className?: string;
}

export function ObjectHierarchy({
  objects,
  selectedObjectId,
  onObjectClick,
  onObjectVisibilityToggle,
  onObjectAdd,
  onObjectDelete,
  onObjectRename,
  onObjectReorder,
  onObjectReparent,
  className,
}: ObjectHierarchyProps) {
  // Sort objects by order (higher order = drawn on top, so show at top of list)
  const sortedObjects = [...objects].sort((a, b) => b.order - a.order);
  const [draggedObjectId, setDraggedObjectId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<{
    objectId: string;
    position: "before" | "after" | "inside";
    parentId: string | null;
  } | null>(null);

  return (
    <div className={cn("flex flex-col border rounded-lg bg-card", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Objects</h3>
        {onObjectAdd && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onObjectAdd()}
            title="Add object"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-col">
        {sortedObjects.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No objects. Click + to add one.
          </div>
        ) : (
          sortedObjects.map((obj, index) => (
            <ObjectTreeNode
              key={obj.id}
              object={obj}
              selectedObjectId={selectedObjectId}
              draggedObjectId={draggedObjectId}
              dropTarget={dropTarget}
              onObjectClick={onObjectClick}
              onObjectVisibilityToggle={onObjectVisibilityToggle}
              onObjectAdd={onObjectAdd}
              onObjectDelete={onObjectDelete}
              onObjectRename={onObjectRename}
              onObjectReorder={onObjectReorder}
              onObjectReparent={onObjectReparent}
              onDragStart={(objectId) => setDraggedObjectId(objectId)}
              onDragEnd={() => {
                setDraggedObjectId(null);
                setDropTarget(null);
              }}
              onDropTargetChange={setDropTarget}
              level={0}
              siblingIndex={index}
              siblingCount={sortedObjects.length}
              parentId={null}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DropIndicator() {
  return (
    <div className="h-0.5 bg-primary mx-2 my-0.5 relative pointer-events-none">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
    </div>
  );
}

interface ObjectTreeNodeProps {
  object: PixelObject;
  selectedObjectId: string | null;
  draggedObjectId: string | null;
  dropTarget: { objectId: string; position: "before" | "after" | "inside"; parentId: string | null } | null;
  onObjectClick?: (objectId: string) => void;
  onObjectVisibilityToggle?: (objectId: string) => void;
  onObjectAdd?: (parentId?: string) => void;
  onObjectDelete?: (objectId: string) => void;
  onObjectRename?: (objectId: string, name: string) => void;
  onObjectReorder?: (objectId: string, newOrder: number, targetParentId?: string) => void;
  onObjectReparent?: (objectId: string, newParentId: string | null) => void;
  onDragStart: (objectId: string) => void;
  onDragEnd: () => void;
  onDropTargetChange: (target: { objectId: string; position: "before" | "after" | "inside"; parentId: string | null } | null) => void;
  level: number;
  siblingIndex?: number;
  siblingCount?: number;
  parentId: string | null;
}

function ObjectTreeNode({
  object,
  selectedObjectId,
  draggedObjectId,
  dropTarget,
  onObjectClick,
  onObjectVisibilityToggle,
  onObjectAdd,
  onObjectDelete,
  onObjectRename,
  onObjectReorder,
  onObjectReparent,
  onDragStart,
  onDragEnd,
  onDropTargetChange,
  level,
  siblingIndex = 0,
  siblingCount = 1,
  parentId,
}: ObjectTreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(object.name);
  const [dragOverPosition, setDragOverPosition] = React.useState<"before" | "after" | "inside" | null>(null);
  const dragLeaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragRef = React.useRef<HTMLDivElement>(null);
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const hasChildren = object.children.length > 0;
  const isSelected = object.id === selectedObjectId;
  const isDragging = draggedObjectId === object.id;
  const isDropTarget = dropTarget?.objectId === object.id && dropTarget?.parentId === parentId;

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditName(object.name);
  }, [object.name]);

  const handleDoubleClick = () => {
    if (onObjectRename) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editName !== object.name && editName.trim() && onObjectRename) {
      onObjectRename(object.id, editName.trim());
    } else {
      setEditName(object.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setEditName(object.name);
      setIsEditing(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!onObjectReorder && !onObjectReparent) return;
    onDragStart(object.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", object.id);
    if (dragRef.current) {
      e.dataTransfer.setDragImage(dragRef.current, 0, 0);
    }
  };

  const handleDragEnd = () => {
    onDragEnd();
    setDragOverPosition(null);
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === object.id) {
      setDragOverPosition(null);
      onDropTargetChange(null);
      return;
    }

    const position = dragOverPosition || "inside";
    setDragOverPosition(null);
    onDropTargetChange(null);

    if (position === "inside" && onObjectReparent) {
      // Reparent: make dragged object a child of this object
      onObjectReparent(draggedId, object.id);
    } else if ((position === "before" || position === "after") && onObjectReorder) {
      // Reorder: move dragged object to before/after this object
      const targetOrder = position === "before" ? object.order : object.order + 1;
      onObjectReorder(draggedId, targetOrder, parentId || undefined);
    }
  };

  // Sort children by order
  const sortedChildren = [...object.children].sort((a, b) => b.order - a.order);

  const isFirst = siblingIndex === 0;
  const isLast = siblingIndex === siblingCount - 1;
  
  // Determine if we should show drop indicator before this node
  const showDropIndicatorBefore = isDropTarget && dragOverPosition === "before";
  
  // Determine if we should show drop indicator after this node
  // Show if: this is the drop target with "after" position (including last sibling)
  const showDropIndicatorAfter = isDropTarget && dragOverPosition === "after";

  React.useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (dragLeaveTimeoutRef.current) {
        clearTimeout(dragLeaveTimeoutRef.current);
      }
    };
  }, []);

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Wrapper drag handler that handles both the node and drop indicator areas
  const handleContainerDragOver = (e: React.DragEvent) => {
    if (!draggedObjectId || draggedObjectId === object.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Clear any pending drag leave timeout
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }

    if (!nodeRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const nodeRect = nodeRef.current.getBoundingClientRect();
    const y = e.clientY - containerRect.top;
    const nodeTop = nodeRect.top - containerRect.top;
    const nodeHeight = nodeRect.height;
    const threshold = nodeHeight / 3;

    let position: "before" | "after" | "inside";
    // If hovering in the drop indicator area above node or top third of node, treat as "before"
    if (y < nodeTop + threshold) {
      position = "before";
    } else if (y > nodeTop + nodeHeight - threshold) {
      // If hovering in bottom third of node or drop indicator area below, treat as "after"
      position = "after";
    } else {
      position = "inside";
    }

    setDragOverPosition(position);
    onDropTargetChange({ objectId: object.id, position, parentId });
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (containerRef.current && relatedTarget && containerRef.current.contains(relatedTarget)) {
      return; // Still within this container or its children
    }

    dragLeaveTimeoutRef.current = setTimeout(() => {
      setDragOverPosition(null);
      if (dropTarget?.objectId === object.id && dropTarget?.parentId === parentId) {
        onDropTargetChange(null);
      }
    }, 50);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleDrop}
    >
      {showDropIndicatorBefore && <DropIndicator />}
      <div
        ref={nodeRef}
        draggable={!!(onObjectReorder || onObjectReparent)}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          "flex items-center gap-1 p-2 hover:bg-accent cursor-pointer transition-colors",
          isSelected && "bg-accent",
          isDragging && "opacity-50",
          isDropTarget && dragOverPosition === "inside" && "ring-2 ring-primary ring-inset"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onObjectClick?.(object.id)}
      >
        {(onObjectReorder || onObjectReparent) && (
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab active:cursor-grabbing" />
        )}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onObjectVisibilityToggle?.(object.id);
          }}
        >
          {object.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-7 flex-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-sm truncate"
            onDoubleClick={handleDoubleClick}
          >
            {object.name}
          </span>
        )}
        {onObjectAdd && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onObjectAdd(object.id);
            }}
            title="Add child object"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
        {onObjectDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onObjectDelete(object.id);
            }}
            title="Delete object"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {showDropIndicatorAfter && <DropIndicator />}
      {hasChildren && isExpanded && (
        <div>
          {sortedChildren.map((child, index) => (
            <ObjectTreeNode
              key={child.id}
              object={child}
              selectedObjectId={selectedObjectId}
              draggedObjectId={draggedObjectId}
              dropTarget={dropTarget}
              onObjectClick={onObjectClick}
              onObjectVisibilityToggle={onObjectVisibilityToggle}
              onObjectAdd={onObjectAdd}
              onObjectDelete={onObjectDelete}
              onObjectRename={onObjectRename}
              onObjectReorder={onObjectReorder}
              onObjectReparent={onObjectReparent}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropTargetChange={onDropTargetChange}
              level={level + 1}
              siblingIndex={index}
              siblingCount={sortedChildren.length}
              parentId={object.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
