/**
 * Comprehensive unit tests for object reordering and reparenting logic
 * 
 * Run with: tsx client/src/components/editor/object-explorer-reorder.test.ts
 */

import { moveObject } from "@shared/utils/object-reorder";
import type { PixelObject, PixelAssetContent } from "@shared/types/pixel-asset";
import { createDefaultObject } from "@shared/utils/pixel-asset";

/**
 * Helper function to create a test object with a specific name and order
 */
function createTestObject(name: string, order: number, children: PixelObject[] = []): PixelObject {
  const obj = createDefaultObject(name, order);
  return { ...obj, children };
}

/**
 * Helper function to get object IDs in order (for easier assertion)
 */
function getObjectIds(objects: PixelObject[]): string[] {
  return objects.map((o) => o.id);
}

/**
 * Helper function to get child IDs of a specific parent
 */
function getChildIds(objects: PixelObject[], parentId: string): string[] {
  const findParent = (objs: PixelObject[]): PixelObject | null => {
    for (const obj of objs) {
      if (obj.id === parentId) return obj;
      const found = findParent(obj.children);
      if (found) return found;
    }
    return null;
  };
  const parent = findParent(objects);
  return parent ? parent.children.map((c) => c.id) : [];
}

/**
 * Helper function to get order values of objects
 */
function getOrders(objects: PixelObject[]): number[] {
  return objects.map((o) => o.order);
}

/**
 * Helper function to get order values of children of a specific parent
 */
function getChildOrders(objects: PixelObject[], parentId: string): number[] {
  const findParent = (objs: PixelObject[]): PixelObject | null => {
    for (const obj of objs) {
      if (obj.id === parentId) return obj;
      const found = findParent(obj.children);
      if (found) return found;
    }
    return null;
  };
  const parent = findParent(objects);
  return parent ? parent.children.map((c) => c.order) : [];
}

/**
 * Helper to create content from objects
 */
function createContent(objects: PixelObject[]): PixelAssetContent {
  return {
    version: 1,
    objects,
    animations: [],
    activeObjectId: null,
  };
}

// Test cases

interface TestCase {
  name: string;
  setup: () => PixelAssetContent;
  operation: (content: PixelAssetContent) => PixelAssetContent;
  assertions: (result: PixelAssetContent) => void;
}

const testCases: TestCase[] = [
  // Reordering within same parent (root level)
  {
    name: "Move first object to second position (root level)",
    setup: () => {
      const obj1 = createTestObject("Object 1", 2);
      const obj2 = createTestObject("Object 2", 1);
      const obj3 = createTestObject("Object 3", 0);
      return createContent([obj1, obj2, obj3]);
    },
    operation: (content) => {
      // Move obj1 (index 0) to index 1 (between obj2 and obj3)
      return moveObject(content, content.objects[0].id, null, 1);
    },
    assertions: (result) => {
      // Expected: [obj2, obj1, obj3]
      const ids = getObjectIds(result.objects);
      expect(ids[0]).toBe(result.objects.find((o) => o.name === "Object 2")!.id);
      expect(ids[1]).toBe(result.objects.find((o) => o.name === "Object 1")!.id);
      expect(ids[2]).toBe(result.objects.find((o) => o.name === "Object 3")!.id);
      expect(getOrders(result.objects)).toEqual([2, 1, 0]);
    },
  },
  {
    name: "Move first object to last position (root level)",
    setup: () => {
      const obj1 = createTestObject("Object 1", 2);
      const obj2 = createTestObject("Object 2", 1);
      const obj3 = createTestObject("Object 3", 0);
      return createContent([obj1, obj2, obj3]);
    },
    operation: (content) => {
      return moveObject(content, content.objects[0].id, null, 3);
    },
    assertions: (result) => {
      // Expected: [obj2, obj3, obj1]
      const ids = getObjectIds(result.objects);
      expect(ids[0]).toBe(result.objects.find((o) => o.name === "Object 2")!.id);
      expect(ids[1]).toBe(result.objects.find((o) => o.name === "Object 3")!.id);
      expect(ids[2]).toBe(result.objects.find((o) => o.name === "Object 1")!.id);
      expect(getOrders(result.objects)).toEqual([2, 1, 0]);
    },
  },
  {
    name: "Move last object to first position (root level)",
    setup: () => {
      const obj1 = createTestObject("Object 1", 2);
      const obj2 = createTestObject("Object 2", 1);
      const obj3 = createTestObject("Object 3", 0);
      return createContent([obj1, obj2, obj3]);
    },
    operation: (content) => {
      return moveObject(content, content.objects[2].id, null, 0);
    },
    assertions: (result) => {
      // Expected: [obj3, obj1, obj2]
      const ids = getObjectIds(result.objects);
      expect(ids[0]).toBe(result.objects.find((o) => o.name === "Object 3")!.id);
      expect(ids[1]).toBe(result.objects.find((o) => o.name === "Object 1")!.id);
      expect(ids[2]).toBe(result.objects.find((o) => o.name === "Object 2")!.id);
      expect(getOrders(result.objects)).toEqual([2, 1, 0]);
    },
  },
  {
    name: "Move middle object to first position (root level)",
    setup: () => {
      const obj1 = createTestObject("Object 1", 2);
      const obj2 = createTestObject("Object 2", 1);
      const obj3 = createTestObject("Object 3", 0);
      return createContent([obj1, obj2, obj3]);
    },
    operation: (content) => {
      return moveObject(content, content.objects[1].id, null, 0);
    },
    assertions: (result) => {
      // Expected: [obj2, obj1, obj3]
      const ids = getObjectIds(result.objects);
      expect(ids[0]).toBe(result.objects.find((o) => o.name === "Object 2")!.id);
      expect(ids[1]).toBe(result.objects.find((o) => o.name === "Object 1")!.id);
      expect(ids[2]).toBe(result.objects.find((o) => o.name === "Object 3")!.id);
      expect(getOrders(result.objects)).toEqual([2, 1, 0]);
    },
  },
  {
    name: "Move middle object to last position (root level)",
    setup: () => {
      const obj1 = createTestObject("Object 1", 2);
      const obj2 = createTestObject("Object 2", 1);
      const obj3 = createTestObject("Object 3", 0);
      return createContent([obj1, obj2, obj3]);
    },
    operation: (content) => {
      return moveObject(content, content.objects[1].id, null, 3);
    },
    assertions: (result) => {
      // Expected: [obj1, obj3, obj2]
      const ids = getObjectIds(result.objects);
      expect(ids[0]).toBe(result.objects.find((o) => o.name === "Object 1")!.id);
      expect(ids[1]).toBe(result.objects.find((o) => o.name === "Object 3")!.id);
      expect(ids[2]).toBe(result.objects.find((o) => o.name === "Object 2")!.id);
      expect(getOrders(result.objects)).toEqual([2, 1, 0]);
    },
  },

  // Reordering within same parent (nested children) - THE BUG CASE
  {
    name: "Move first child to second position (3 children) - BUG TEST",
    setup: () => {
      const child1 = createTestObject("Child 1", 2);
      const child2 = createTestObject("Child 2", 1);
      const child3 = createTestObject("Child 3", 0);
      const parent = createTestObject("Parent", 0, [child1, child2, child3]);
      return createContent([parent]);
    },
    operation: (content) => {
      const parent = content.objects[0];
      const child1 = parent.children[0];
      // Move child1 (index 0) to index 1 (between child2 and child3)
      return moveObject(content, child1.id, parent.id, 1);
    },
    assertions: (result) => {
      const parent = result.objects[0];
      // Expected children: [child2, child1, child3]
      expect(parent.children).toHaveLength(3);
      expect(parent.children[0].name).toBe("Child 2");
      expect(parent.children[1].name).toBe("Child 1");
      expect(parent.children[2].name).toBe("Child 3");
      expect(getChildOrders(result.objects, parent.id)).toEqual([2, 1, 0]);
    },
  },
  {
    name: "Move first child to last position (3 children)",
    setup: () => {
      const child1 = createTestObject("Child 1", 2);
      const child2 = createTestObject("Child 2", 1);
      const child3 = createTestObject("Child 3", 0);
      const parent = createTestObject("Parent", 0, [child1, child2, child3]);
      return createContent([parent]);
    },
    operation: (content) => {
      const parent = content.objects[0];
      const child1 = parent.children[0];
      return moveObject(content, child1.id, parent.id, 3);
    },
    assertions: (result) => {
      const parent = result.objects[0];
      // Expected children: [child2, child3, child1]
      expect(parent.children[0].name).toBe("Child 2");
      expect(parent.children[1].name).toBe("Child 3");
      expect(parent.children[2].name).toBe("Child 1");
      expect(getChildOrders(result.objects, parent.id)).toEqual([2, 1, 0]);
    },
  },
  {
    name: "Move last child to first position (3 children)",
    setup: () => {
      const child1 = createTestObject("Child 1", 2);
      const child2 = createTestObject("Child 2", 1);
      const child3 = createTestObject("Child 3", 0);
      const parent = createTestObject("Parent", 0, [child1, child2, child3]);
      return createContent([parent]);
    },
    operation: (content) => {
      const parent = content.objects[0];
      const child3 = parent.children[2];
      return moveObject(content, child3.id, parent.id, 0);
    },
    assertions: (result) => {
      const parent = result.objects[0];
      // Expected children: [child3, child1, child2]
      expect(parent.children[0].name).toBe("Child 3");
      expect(parent.children[1].name).toBe("Child 1");
      expect(parent.children[2].name).toBe("Child 2");
      expect(getChildOrders(result.objects, parent.id)).toEqual([2, 1, 0]);
    },
  },
  {
    name: "Move middle child to first position (3 children)",
    setup: () => {
      const child1 = createTestObject("Child 1", 2);
      const child2 = createTestObject("Child 2", 1);
      const child3 = createTestObject("Child 3", 0);
      const parent = createTestObject("Parent", 0, [child1, child2, child3]);
      return createContent([parent]);
    },
    operation: (content) => {
      const parent = content.objects[0];
      const child2 = parent.children[1];
      return moveObject(content, child2.id, parent.id, 0);
    },
    assertions: (result) => {
      const parent = result.objects[0];
      // Expected children: [child2, child1, child3]
      expect(parent.children[0].name).toBe("Child 2");
      expect(parent.children[1].name).toBe("Child 1");
      expect(parent.children[2].name).toBe("Child 3");
      expect(getChildOrders(result.objects, parent.id)).toEqual([2, 1, 0]);
    },
  },
  {
    name: "Move middle child to last position (3 children)",
    setup: () => {
      const child1 = createTestObject("Child 1", 2);
      const child2 = createTestObject("Child 2", 1);
      const child3 = createTestObject("Child 3", 0);
      const parent = createTestObject("Parent", 0, [child1, child2, child3]);
      return createContent([parent]);
    },
    operation: (content) => {
      const parent = content.objects[0];
      const child2 = parent.children[1];
      return moveObject(content, child2.id, parent.id, 3);
    },
    assertions: (result) => {
      const parent = result.objects[0];
      // Expected children: [child1, child3, child2]
      expect(parent.children[0].name).toBe("Child 1");
      expect(parent.children[1].name).toBe("Child 3");
      expect(parent.children[2].name).toBe("Child 2");
      expect(getChildOrders(result.objects, parent.id)).toEqual([2, 1, 0]);
    },
  },

  // Reparenting tests
  {
    name: "Move root object to become child of another root object",
    setup: () => {
      const obj1 = createTestObject("Object 1", 1);
      const obj2 = createTestObject("Object 2", 0, []);
      return createContent([obj1, obj2]);
    },
    operation: (content) => {
      return moveObject(content, content.objects[0].id, content.objects[1].id, 0);
    },
    assertions: (result) => {
      expect(result.objects).toHaveLength(1);
      expect(result.objects[0].id).toBe(content.objects[1].id);
      expect(getChildIds(result.objects, content.objects[1].id)).toEqual([content.objects[0].id]);
      expect(getChildOrders(result.objects, content.objects[1].id)).toEqual([0]);
    },
  },
  {
    name: "Move child to become sibling of parent",
    setup: () => {
      const child = createTestObject("Child", 0);
      const parent = createTestObject("Parent", 1, [child]);
      const sibling = createTestObject("Sibling", 0);
      return createContent([parent, sibling]);
    },
    operation: (content) => {
      const parent = content.objects[0];
      const child = parent.children[0];
      return moveObject(content, child.id, null, 1);
    },
    assertions: (result) => {
      expect(result.objects).toHaveLength(3);
      expect(getObjectIds(result.objects)).toEqual([content.objects[0].id, content.objects[0].children[0].id, content.objects[1].id]);
      expect(getChildIds(result.objects, content.objects[0].id)).toEqual([]);
    },
  },
  {
    name: "Move child from one parent to another parent",
    setup: () => {
      const child = createTestObject("Child", 0);
      const parent1 = createTestObject("Parent 1", 1, [child]);
      const parent2 = createTestObject("Parent 2", 0, []);
      return createContent([parent1, parent2]);
    },
    operation: (content) => {
      const parent1 = content.objects[0];
      const parent2 = content.objects[1];
      const child = parent1.children[0];
      return moveObject(content, child.id, parent2.id, 0);
    },
    assertions: (result) => {
      expect(getChildIds(result.objects, content.objects[0].id)).toEqual([]);
      expect(getChildIds(result.objects, content.objects[1].id)).toEqual([content.objects[0].children[0].id]);
    },
  },

  // Edge cases
  {
    name: "Move object to same position (no-op)",
    setup: () => {
      const obj1 = createTestObject("Object 1", 2);
      const obj2 = createTestObject("Object 2", 1);
      const obj3 = createTestObject("Object 3", 0);
      return createContent([obj1, obj2, obj3]);
    },
    operation: (content) => {
      return moveObject(content, content.objects[0].id, null, 0);
    },
    assertions: (result) => {
      expect(getObjectIds(result.objects)).toEqual([content.objects[0].id, content.objects[1].id, content.objects[2].id]);
    },
  },
  {
    name: "Move object with children (preserves children)",
    setup: () => {
      const grandchild = createTestObject("Grandchild", 0);
      const child = createTestObject("Child", 0, [grandchild]);
      const parent = createTestObject("Parent", 0, [child]);
      const sibling = createTestObject("Sibling", 0);
      return createContent([parent, sibling]);
    },
    operation: (content) => {
      const parent = content.objects[0];
      const child = parent.children[0];
      return moveObject(content, child.id, null, 1);
    },
    assertions: (result) => {
      expect(result.objects).toHaveLength(3);
      const movedChild = result.objects.find((o) => o.name === "Child");
      expect(movedChild).toBeDefined();
      expect(movedChild!.children).toHaveLength(1);
      expect(movedChild!.children[0].name).toBe("Grandchild");
    },
  },
];

// Simple test runner
function expect<T>(actual: T) {
  return {
    toEqual: (expected: T) => {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, got ${actualStr}`);
      }
    },
    toBe: (expected: T) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toHaveLength: (expected: number) => {
      if (Array.isArray(actual) && actual.length !== expected) {
        throw new Error(`Expected array length ${expected}, got ${actual.length}`);
      }
    },
  };
}

// Run tests
console.log("Running object reordering tests...\n");

let passed = 0;
let failed = 0;
const failures: Array<{ name: string; error: string }> = [];

for (const testCase of testCases) {
  try {
    const content = testCase.setup();
    const result = testCase.operation(content);
    testCase.assertions(result);
    console.log(`✓ ${testCase.name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${testCase.name}`);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ${errorMsg}`);
    failures.push({ name: testCase.name, error: errorMsg });
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log("\nFailures:");
  for (const failure of failures) {
    console.log(`  - ${failure.name}: ${failure.error}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
