/**
 * Unit tests for ghosting logic
 * 
 * Run with: tsx client/src/utils/ghosting-logic.test.ts
 */

import { calculateGhostOverlays } from "./ghosting-logic";
import type { GridConfig } from "./frame-extraction";

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
    name: "should return empty array for zero cells",
    test: () => {
      expect(calculateGhostOverlays({ rows: 0, cols: 0 }, false)).toEqual([]);
      expect(calculateGhostOverlays({ rows: 0, cols: 0 }, true)).toEqual([]);
    },
  },
  {
    name: "should return empty array for single cell (no previous cell)",
    test: () => {
      expect(calculateGhostOverlays({ rows: 1, cols: 1 }, false)).toEqual([]);
      expect(calculateGhostOverlays({ rows: 1, cols: 1 }, true)).toEqual([]);
    },
  },
  {
    name: "two cells: cell 1 should get cell 0's ghost",
    test: () => {
      const result = calculateGhostOverlays({ rows: 1, cols: 2 }, false);
      expect(result).toHaveLength(1);
      expect(result[0].targetCellIndex).toBe(1);
      expect(result[0].sourceCellIndex).toBe(0);
    },
  },
  {
    name: "three cells: cells 1 and 2 should get previous cell's ghost",
    test: () => {
      const result = calculateGhostOverlays({ rows: 1, cols: 3 }, false);
      expect(result).toHaveLength(2);
      
      // Cell 1 gets cell 0's ghost
      expect(result[0].targetCellIndex).toBe(1);
      expect(result[0].sourceCellIndex).toBe(0);
      
      // Cell 2 gets cell 1's ghost
      expect(result[1].targetCellIndex).toBe(2);
      expect(result[1].sourceCellIndex).toBe(1);
    },
  },
  {
    name: "cell 0 should get last cell's ghost when looping",
    test: () => {
      const result = calculateGhostOverlays({ rows: 1, cols: 3 }, true);
      expect(result).toHaveLength(3);
      
      // Cell 0 gets cell 2's ghost (last cell)
      expect(result[0].targetCellIndex).toBe(0);
      expect(result[0].sourceCellIndex).toBe(2);
      
      // Cell 1 gets cell 0's ghost
      expect(result[1].targetCellIndex).toBe(1);
      expect(result[1].sourceCellIndex).toBe(0);
      
      // Cell 2 gets cell 1's ghost
      expect(result[2].targetCellIndex).toBe(2);
      expect(result[2].sourceCellIndex).toBe(1);
    },
  },
  {
    name: "2x2 grid: all cells except 0 should get previous cell's ghost",
    test: () => {
      const result = calculateGhostOverlays({ rows: 2, cols: 2 }, false);
      expect(result).toHaveLength(3);
      
      // Cell 1 gets cell 0's ghost
      expect(result[0].targetCellIndex).toBe(1);
      expect(result[0].sourceCellIndex).toBe(0);
      
      // Cell 2 gets cell 1's ghost
      expect(result[1].targetCellIndex).toBe(2);
      expect(result[1].sourceCellIndex).toBe(1);
      
      // Cell 3 gets cell 2's ghost
      expect(result[2].targetCellIndex).toBe(3);
      expect(result[2].sourceCellIndex).toBe(2);
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

