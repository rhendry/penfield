/**
 * Unit tests for ghosting logic
 * 
 * Run with: tsx client/src/utils/ghosting-logic.test.ts
 */

import { calculateGhostOverlays } from "./ghosting-logic";

// Simple test assertion helpers
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
    toBeGreaterThan: (expected: number) => {
      if (typeof actual !== "number" || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual: (expected: number) => {
      if (typeof actual !== "number" || actual < expected) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
  };
}

interface TestCase {
  name: string;
  test: () => void;
}

const testCases: TestCase[] = [
  {
    name: "should return empty array for zero frames",
    test: () => {
      expect(calculateGhostOverlays([], false)).toEqual([]);
      expect(calculateGhostOverlays([], true)).toEqual([]);
    },
  },
  {
    name: "should return empty array for single frame (no previous frame)",
    test: () => {
      expect(calculateGhostOverlays([{ cellIndex: 0 }], false)).toEqual([]);
      expect(calculateGhostOverlays([{ cellIndex: 0 }], true)).toEqual([]);
    },
  },
  {
    name: "two frames: frame 1 should get frame 0's ghost",
    test: () => {
      const frames = [
        { cellIndex: 0 },
        { cellIndex: 1 },
      ];
      const result = calculateGhostOverlays(frames, false);
      expect(result).toHaveLength(1);
      expect(result[0].targetCellIndex).toBe(1); // Render in frame 1's cell
      expect(result[0].sourceCellIndex).toBe(0); // Extract from frame 0's cell
    },
  },
  {
    name: "three frames: frames 1 and 2 should get previous frame's ghost",
    test: () => {
      const frames = [
        { cellIndex: 0 },
        { cellIndex: 1 },
        { cellIndex: 2 },
      ];
      const result = calculateGhostOverlays(frames, false);
      expect(result).toHaveLength(2);
      
      // Frame 1 gets frame 0's ghost
      expect(result[0].targetCellIndex).toBe(1);
      expect(result[0].sourceCellIndex).toBe(0);
      
      // Frame 2 gets frame 1's ghost
      expect(result[1].targetCellIndex).toBe(2);
      expect(result[1].sourceCellIndex).toBe(1);
    },
  },
  {
    name: "frame 0 should get last frame's ghost when looping",
    test: () => {
      const frames = [
        { cellIndex: 0 },
        { cellIndex: 1 },
        { cellIndex: 2 },
      ];
      const result = calculateGhostOverlays(frames, true);
      expect(result).toHaveLength(3);
      
      // Frame 0 gets frame 2's ghost (last frame)
      expect(result[0].targetCellIndex).toBe(0);
      expect(result[0].sourceCellIndex).toBe(2);
      
      // Frame 1 gets frame 0's ghost
      expect(result[1].targetCellIndex).toBe(1);
      expect(result[1].sourceCellIndex).toBe(0);
      
      // Frame 2 gets frame 1's ghost
      expect(result[2].targetCellIndex).toBe(2);
      expect(result[2].sourceCellIndex).toBe(1);
    },
  },
];

// Run tests
console.log("Running ghosting logic tests...\n");

let passed = 0;
let failed = 0;
const failures: Array<{ name: string; error: string }> = [];

for (const testCase of testCases) {
  try {
    testCase.test();
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

