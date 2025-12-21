import type { Meta, StoryObj } from "@storybook/react";
import { ObjectHierarchy } from "../../client/src/components/editor/object-hierarchy";
import { useState } from "react";
import { fn } from "storybook/test";
import type { PixelObject } from "@shared/types/pixel-asset";
import { createDefaultObject } from "@shared/utils/pixel-asset";

const meta = {
  title: "Editor/ObjectHierarchy",
  component: ObjectHierarchy,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onObjectClick: fn(),
    onObjectVisibilityToggle: fn(),
  },
} satisfies Meta<typeof ObjectHierarchy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [objects] = useState<PixelObject[]>([]);
    return (
      <div className="w-64">
        <ObjectHierarchy objects={objects} selectedObjectId={null} />
      </div>
    );
  },
};

export const FlatObjectList: Story = {
  render: () => {
    const [objects] = useState<PixelObject[]>([
      createDefaultObject("Character", 2),
      createDefaultObject("Background", 0),
      createDefaultObject("Foreground", 1),
    ]);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
      objects[0].id
    );

    return (
      <div className="w-64">
        <ObjectHierarchy
          objects={objects}
          selectedObjectId={selectedObjectId}
          onObjectClick={(id) => setSelectedObjectId(id)}
        />
      </div>
    );
  },
};

export const NestedObjects: Story = {
  render: () => {
    const [objects] = useState<PixelObject[]>([
      {
        ...createDefaultObject("Character", 1),
        children: [
          createDefaultObject("Head", 0),
          {
            ...createDefaultObject("Body", 1),
            children: [createDefaultObject("Torso", 0), createDefaultObject("Arms", 1)],
          },
          createDefaultObject("Legs", 2),
        ],
      },
      createDefaultObject("Background", 0),
    ]);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
      objects[0].children[1].id
    );

    return (
      <div className="w-64">
        <ObjectHierarchy
          objects={objects}
          selectedObjectId={selectedObjectId}
          onObjectClick={(id) => setSelectedObjectId(id)}
        />
      </div>
    );
  },
};

export const ObjectSelection: Story = {
  render: () => {
    const [objects] = useState<PixelObject[]>([
      createDefaultObject("Object 1", 0),
      createDefaultObject("Object 2", 1),
      createDefaultObject("Object 3", 2),
    ]);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
      objects[1].id
    );

    return (
      <div className="w-64">
        <ObjectHierarchy
          objects={objects}
          selectedObjectId={selectedObjectId}
          onObjectClick={(id) => setSelectedObjectId(id)}
        />
      </div>
    );
  },
};

export const VisibilityToggle: Story = {
  render: () => {
    const [objects, setObjects] = useState<PixelObject[]>([
      { ...createDefaultObject("Visible Object", 0), visible: true },
      { ...createDefaultObject("Hidden Object", 1), visible: false },
      { ...createDefaultObject("Another Visible", 2), visible: true },
    ]);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
      objects[0].id
    );

    const handleVisibilityToggle = (objectId: string) => {
      const updateObject = (obj: PixelObject): PixelObject => {
        if (obj.id === objectId) {
          return { ...obj, visible: !obj.visible };
        }
        return {
          ...obj,
          children: obj.children.map(updateObject),
        };
      };
      setObjects(objects.map(updateObject));
    };

    return (
      <div className="w-64">
        <ObjectHierarchy
          objects={objects}
          selectedObjectId={selectedObjectId}
          onObjectClick={(id) => setSelectedObjectId(id)}
          onObjectVisibilityToggle={handleVisibilityToggle}
        />
      </div>
    );
  },
};

export const ExpandCollapse: Story = {
  render: () => {
    const [objects] = useState<PixelObject[]>([
      {
        ...createDefaultObject("Parent 1", 0),
        children: [
          createDefaultObject("Child 1.1", 0),
          createDefaultObject("Child 1.2", 1),
        ],
      },
      {
        ...createDefaultObject("Parent 2", 1),
        children: [
          createDefaultObject("Child 2.1", 0),
          {
            ...createDefaultObject("Child 2.2", 1),
            children: [createDefaultObject("Grandchild 2.2.1", 0)],
          },
        ],
      },
    ]);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

    return (
      <div className="w-64">
        <ObjectHierarchy
          objects={objects}
          selectedObjectId={selectedObjectId}
          onObjectClick={(id) => setSelectedObjectId(id)}
        />
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [objects, setObjects] = useState<PixelObject[]>([
      {
        ...createDefaultObject("Character", 1),
        children: [
          createDefaultObject("Head", 0),
          {
            ...createDefaultObject("Body", 1),
            children: [createDefaultObject("Torso", 0), createDefaultObject("Arms", 1)],
          },
        ],
      },
      createDefaultObject("Background", 0),
    ]);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
      objects[0].id
    );

    const handleVisibilityToggle = (objectId: string) => {
      const updateObject = (obj: PixelObject): PixelObject => {
        if (obj.id === objectId) {
          return { ...obj, visible: !obj.visible };
        }
        return {
          ...obj,
          children: obj.children.map(updateObject),
        };
      };
      setObjects(objects.map(updateObject));
    };

    const handleAdd = (parentId?: string) => {
      const newObject = createDefaultObject(`New Object ${objects.length + 1}`, objects.length);
      if (parentId) {
        const addToParent = (obj: PixelObject): PixelObject => {
          if (obj.id === parentId) {
            return { ...obj, children: [...obj.children, newObject] };
          }
          return { ...obj, children: obj.children.map(addToParent) };
        };
        setObjects(objects.map(addToParent));
      } else {
        setObjects([...objects, newObject]);
      }
    };

    const handleDelete = (objectId: string) => {
      const removeFromTree = (objs: PixelObject[]): PixelObject[] => {
        return objs
          .filter((obj) => obj.id !== objectId)
          .map((obj) => ({ ...obj, children: removeFromTree(obj.children) }));
      };
      setObjects(removeFromTree(objects));
      if (selectedObjectId === objectId) {
        setSelectedObjectId(null);
      }
    };

    const handleRename = (objectId: string, name: string) => {
      const updateObject = (obj: PixelObject): PixelObject => {
        if (obj.id === objectId) {
          return { ...obj, name };
        }
        return { ...obj, children: obj.children.map(updateObject) };
      };
      setObjects(objects.map(updateObject));
    };

    const handleReorder = (objectId: string, newOrder: number) => {
      const findObject = (objs: PixelObject[]): PixelObject | null => {
        for (const obj of objs) {
          if (obj.id === objectId) return obj;
          const found = findObject(obj.children);
          if (found) return found;
        }
        return null;
      };

      const obj = findObject(objects);
      if (!obj) return;

      const oldOrder = obj.order;
      const reorderObjects = (objs: PixelObject[]): PixelObject[] => {
        const sorted = [...objs].sort((a, b) => b.order - a.order);
        return sorted.map((o, index) => {
          if (o.id === objectId) {
            return { ...o, order: newOrder };
          }
          const targetIndex = sorted.findIndex((x) => x.id === objectId);
          const oldIndex = sorted.findIndex((x) => x.id === o.id);
          let newO = o.order;
          
          if (oldIndex < targetIndex && index >= targetIndex) {
            newO = o.order - 1;
          } else if (oldIndex > targetIndex && index <= targetIndex) {
            newO = o.order + 1;
          }
          
          return { ...o, order: newO, children: reorderObjects(o.children) };
        });
      };

      setObjects(reorderObjects(objects));
    };

    const handleReparent = (objectId: string, newParentId: string | null) => {
      // Remove from current parent
      const removeFromTree = (objs: PixelObject[]): { objects: PixelObject[]; removed: PixelObject | null } => {
        for (let i = 0; i < objs.length; i++) {
          if (objs[i].id === objectId) {
            const removed = objs[i];
            return {
              objects: objs.filter((_, idx) => idx !== i),
              removed,
            };
          }
          const result = removeFromTree(objs[i].children);
          if (result.removed) {
            return {
              objects: objs.map((obj, idx) =>
                idx === i ? { ...obj, children: result.objects } : obj
              ),
              removed: result.removed,
            };
          }
        }
        return { objects: objs, removed: null };
      };

      const { objects: objectsWithout, removed } = removeFromTree(objects);
      if (!removed) return;

      // Find max order in target parent
      const findMaxOrder = (objs: PixelObject[], targetId: string | null): number => {
        if (targetId === null) {
          return objs.length > 0 ? Math.max(...objs.map((o) => o.order)) : -1;
        }
        for (const obj of objs) {
          if (obj.id === targetId) {
            return obj.children.length > 0 ? Math.max(...obj.children.map((o) => o.order)) : -1;
          }
          const found = findMaxOrder(obj.children, targetId);
          if (found !== -1) return found;
        }
        return -1;
      };

      const maxOrder = findMaxOrder(objectsWithout, newParentId);
      const newObject = { ...removed, order: maxOrder + 1 };

      // Add to new parent
      const addToParent = (objs: PixelObject[]): PixelObject[] => {
        if (newParentId === null) {
          return [...objs, newObject];
        }
        return objs.map((obj) => {
          if (obj.id === newParentId) {
            return { ...obj, children: [...obj.children, newObject] };
          }
          return { ...obj, children: addToParent(obj.children) };
        });
      };

      setObjects(addToParent(objectsWithout));
    };

    return (
      <div className="w-64 space-y-4">
        <ObjectHierarchy
          objects={objects}
          selectedObjectId={selectedObjectId}
          onObjectClick={(id) => setSelectedObjectId(id)}
          onObjectVisibilityToggle={handleVisibilityToggle}
          onObjectAdd={handleAdd}
          onObjectDelete={handleDelete}
          onObjectRename={handleRename}
          onObjectReorder={handleReorder}
          onObjectReparent={handleReparent}
        />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click object to select</p>
          <p>• Double-click name to rename</p>
          <p>• Click chevron to expand/collapse</p>
          <p>• Click eye icon to toggle visibility</p>
          <p>• Click + to add object</p>
          <p>• Click trash to delete</p>
          <p>• Drag grip icon to reorder or reparent</p>
          <p>• Drop on object = reparent (make child)</p>
          <p>• Drop between objects = reorder</p>
        </div>
      </div>
    );
  },
};

