import React, { useMemo, useCallback } from "react";
import { Tree, NodeApi } from "react-arborist";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PixelObject, PixelAssetContent } from "@shared/types/pixel-asset";
import { createDefaultObject } from "@shared/utils/pixel-asset";
import { moveObject } from "@shared/utils/object-reorder";

export interface ObjectExplorerProps {
  content: PixelAssetContent;
  selectedObjectId: string | null;
  onContentChange: (content: PixelAssetContent) => void;
  onObjectSelect?: (objectId: string | null) => void;
  className?: string;
}

// Convert PixelObject to react-arborist data format
interface ArboristNode {
  id: string;
  name: string;
  children?: ArboristNode[];
  // Store reference to original PixelObject
  data: PixelObject;
}

function convertToArboristData(objects: PixelObject[]): ArboristNode[] {
  return objects.map((obj) => ({
    id: obj.id,
    name: obj.name,
    data: obj,
    // Always include children array (even if empty) so react-arborist shows drop zones for leaf nodes
    children: obj.children.length > 0 ? convertToArboristData(obj.children) : [],
  }));
}


export function ObjectExplorer({
  content,
  selectedObjectId,
  onContentChange,
  onObjectSelect,
  className,
}: ObjectExplorerProps) {
  // Convert objects to arborist format, sorted by order (higher order = top)
  const data = useMemo(() => {
    const sorted = [...content.objects].sort((a, b) => b.order - a.order);
    return convertToArboristData(sorted);
  }, [content.objects]);

  // Handle object selection
  const handleSelect = useCallback(
    (nodes: NodeApi<ArboristNode>[]) => {
      const selectedNode = nodes.length > 0 ? nodes[0] : null;
      onObjectSelect?.(selectedNode?.id ?? null);
    },
    [onObjectSelect]
  );

  // Handle drag and drop (reordering/reparenting)
  const handleMove = useCallback(
    ({ dragIds, parentId, index, dragNodes }: { dragIds: string[]; parentId: string | null; index: number; dragNodes: NodeApi<ArboristNode>[] }) => {
      const draggedId = dragIds[0];
      if (!draggedId) return;

      // Prevent dropping into own descendants
      const draggedNode = dragNodes[0];
      if (draggedNode && parentId) {
        const isDescendant = (obj: PixelObject, targetId: string): boolean => {
          if (obj.id === targetId) return true;
          return obj.children.some((child) => isDescendant(child, targetId));
        };
        const draggedObject = draggedNode.data.data;
        if (isDescendant(draggedObject, parentId)) {
          return; // Don't allow dropping into descendants
        }
      }

      // Use the extracted moveObject function
      const newContent = moveObject(content, draggedId, parentId, index);
      onContentChange(newContent);
    },
    [content, onContentChange]
  );

  // Handle rename
  const handleRename = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      const updateObject = (obj: PixelObject): PixelObject => {
        if (obj.id === id) {
          return { ...obj, name };
        }
        return {
          ...obj,
          children: obj.children.map(updateObject),
        };
      };

      onContentChange({
        ...content,
        objects: content.objects.map(updateObject),
      });
    },
    [content, onContentChange]
  );

  // Handle visibility toggle
  const handleVisibilityToggle = useCallback(
    (e: React.MouseEvent, objectId: string) => {
      e.stopPropagation();
      const updateObject = (obj: PixelObject): PixelObject => {
        if (obj.id === objectId) {
          return { ...obj, visible: !obj.visible };
        }
        return {
          ...obj,
          children: obj.children.map(updateObject),
        };
      };

      onContentChange({
        ...content,
        objects: content.objects.map(updateObject),
      });
    },
    [content, onContentChange]
  );

  // Handle add object
  const handleAdd = useCallback(
    (e: React.MouseEvent, parentId?: string) => {
      e.stopPropagation();
      const newObject = createDefaultObject(`New Object`, 0);

      if (parentId) {
        const addToParent = (obj: PixelObject): PixelObject => {
          if (obj.id === parentId) {
            return { ...obj, children: [...obj.children, newObject] };
          }
          return { ...obj, children: obj.children.map(addToParent) };
        };
        onContentChange({
          ...content,
          objects: content.objects.map(addToParent),
        });
      } else {
        // Add to root
        const maxOrder = content.objects.length > 0 ? Math.max(...content.objects.map((o) => o.order)) : -1;
        const newObjectWithOrder = { ...newObject, order: maxOrder + 1 };
        onContentChange({
          ...content,
          objects: [...content.objects, newObjectWithOrder],
        });
      }
    },
    [content, onContentChange]
  );

  // Handle delete object
  const handleDelete = useCallback(
    (e: React.MouseEvent, objectId: string) => {
      e.stopPropagation();
      const removeFromTree = (objs: PixelObject[]): PixelObject[] => {
        return objs
          .filter((obj) => obj.id !== objectId)
          .map((obj) => ({ ...obj, children: removeFromTree(obj.children) }));
      };

      const newObjects = removeFromTree(content.objects);
      onContentChange({
        ...content,
        objects: newObjects,
        activeObjectId: content.activeObjectId === objectId ? null : content.activeObjectId,
      });

      if (selectedObjectId === objectId) {
        onObjectSelect?.(null);
      }
    },
    [content, onContentChange, selectedObjectId, onObjectSelect]
  );

  // Custom node renderer
  const Node = useCallback(
    ({ node, style, dragHandle }: { node: NodeApi<ArboristNode>; style: React.CSSProperties; dragHandle?: (el: HTMLDivElement | null) => void }) => {
      const object = node.data.data;
      const isSelected = node.id === selectedObjectId;
      const isEditing = node.isEditing;

      return (
        <div
          ref={dragHandle} // Make entire row draggable
          style={style}
          className={cn(
            "flex items-center gap-1 py-1 pl-3 pr-2 hover:bg-accent cursor-grab active:cursor-grabbing select-none group",
            isSelected && "bg-accent"
          )}
          onClick={() => handleSelect([node])}
        >
          {/* Drag handle icon (visual indicator only, whole row is draggable) */}
          <div className="flex-shrink-0 mr-1 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted-foreground">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
              <circle cx="6" cy="2" r="1" fill="currentColor" />
              <circle cx="10" cy="2" r="1" fill="currentColor" />
              <circle cx="2" cy="6" r="1" fill="currentColor" />
              <circle cx="6" cy="6" r="1" fill="currentColor" />
              <circle cx="10" cy="6" r="1" fill="currentColor" />
              <circle cx="2" cy="10" r="1" fill="currentColor" />
              <circle cx="6" cy="10" r="1" fill="currentColor" />
              <circle cx="10" cy="10" r="1" fill="currentColor" />
            </svg>
          </div>

          {/* Visibility toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 flex-shrink-0"
            onClick={(e) => handleVisibilityToggle(e, object.id)}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
            title={object.visible ? "Hide object" : "Show object"}
          >
            {object.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          </Button>

          {/* Name (editable via double-click, handled by react-arborist) */}
          {isEditing ? (
            <input
              className="flex-1 text-sm px-1 py-0.5 border rounded bg-background min-w-0"
              defaultValue={node.data.name}
              onBlur={(e) => {
                const newName = e.target.value.trim();
                if (newName && newName !== node.data.name) {
                  handleRename({ id: node.id, name: newName });
                }
                node.reset();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  node.reset();
                }
              }}
              onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking input
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap"
              onDoubleClick={(e) => {
                e.stopPropagation();
                node.edit();
              }}
            >
              {node.data.name}
            </span>
          )}

          {/* Add child button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 flex-shrink-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => handleAdd(e, object.id)}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
            title="Add child object"
          >
            <Plus className="h-3 w-3" />
          </Button>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 flex-shrink-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => handleDelete(e, object.id)}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
            title="Delete object"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      );
    },
    [selectedObjectId, handleSelect, handleVisibilityToggle, handleAdd, handleDelete]
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [treeHeight, setTreeHeight] = React.useState(400);
  const [treeWidth, setTreeWidth] = React.useState(300);

  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setTreeHeight(Math.max(200, rect.height - 50)); // Subtract header height
        // Account for left padding (pl-2 = 0.5rem = 8px)
        setTreeWidth(Math.max(0, rect.width - 8));
      }
    };
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <div className={cn("flex flex-col border rounded-lg bg-card", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Objects</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleAdd(e)} title="Add object">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden min-h-0 pl-2" style={{ minHeight: 200 }}>
        {data.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No objects. Click + to add one.</div>
        ) : (
          <Tree
            data={data}
            width={treeWidth}
            height={treeHeight}
            onMove={handleMove}
            onRename={handleRename}
            onSelect={handleSelect}
            openByDefault={true}
            rowHeight={32}
            indent={20}
            disableDrop={() => {
              // Allow dropping into leaf nodes (nodes with no children)
              // Only prevent dropping into own descendants (handled in handleMove)
              return false;
            }}
          >
            {Node}
          </Tree>
        )}
      </div>
    </div>
  );
}

