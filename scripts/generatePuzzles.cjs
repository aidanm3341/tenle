#!/usr/bin/env node
// Generates a set of valid Tenner puzzles and writes them to src/data/puzzles.json.
// A puzzle is valid if at least one combination of operators + UI-expressible brackets
// produces a result of exactly 10.
// Run with: node scripts/generatePuzzles.js

const fs = require('fs');
const path = require('path');

const TARGET = 10;
const OPERATORS = ['+', '-', '*', '/', '**'];
const COUNT = 500;

// Evaluate a JS expression string safely
function evalExpr(expr) {
  try {
    const result = Function('"use strict"; return (' + expr + ')')();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

// Generate all contiguous-range bracket groupings for 5 numbers with 4 operators.
// A "grouping" is represented as a set of (start, end) pairs of number indices
// that should be wrapped in parentheses. We only allow flat (non-nested) groupings
// to match what the UI can express via per-number ( ) toggles.
// We enumerate all subsets of contiguous ranges [i..j] where 0<=i<j<=4.
function* allBracketGroupings() {
  // Possible contiguous ranges
  const ranges = [];
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j <= 4; j++) {
      ranges.push([i, j]);
    }
  }
  // Enumerate all non-overlapping subsets of ranges
  // (two ranges overlap if they share a number but one is not contained in the other)
  const n = ranges.length;
  for (let mask = 0; mask < (1 << n); mask++) {
    const selected = [];
    for (let k = 0; k < n; k++) {
      if (mask & (1 << k)) selected.push(ranges[k]);
    }
    // Check that selected ranges are non-overlapping (or nested)
    // For simplicity, only allow non-overlapping ranges (simpler UI semantics)
    let valid = true;
    for (let a = 0; a < selected.length && valid; a++) {
      for (let b = a + 1; b < selected.length && valid; b++) {
        const [ai, aj] = selected[a];
        const [bi, bj] = selected[b];
        // Overlap if they share indices but neither contains the other
        const overlaps = ai < bj && bi < aj;
        const aContainsB = ai <= bi && bj <= aj;
        const bContainsA = bi <= ai && aj <= bj;
        if (overlaps && !aContainsB && !bContainsA) valid = false;
      }
    }
    if (valid) yield selected;
  }
}

// Build an expression string from numbers, operators, and bracket grouping
function buildExpr(numbers, operators, grouping) {
  // open[i] = true if a '(' starts before number i
  // close[i] = true if a ')' comes after number i
  const open = Array(5).fill(0);
  const close = Array(5).fill(0);
  for (const [start, end] of grouping) {
    open[start] += 1;
    close[end] += 1;
  }
  let expr = '';
  for (let i = 0; i < 5; i++) {
    expr += '('.repeat(open[i]);
    expr += numbers[i];
    expr += ')'.repeat(close[i]);
    if (i < 4) expr += ` ${operators[i]} `;
  }
  return expr;
}

// Check if a set of 5 numbers can produce 10 using any operator combination
// and any UI-expressible bracket grouping
function canMake10(numbers) {
  const base = OPERATORS.length;
  const opCombos = [];
  for (let mask = 0; mask < Math.pow(base, 4); mask++) {
    let m = mask;
    const ops = [];
    for (let k = 0; k < 4; k++) {
      ops.push(OPERATORS[m % base]);
      m = Math.floor(m / base);
    }
    opCombos.push(ops);
  }

  for (const ops of opCombos) {
    for (const grouping of allBracketGroupings()) {
      const expr = buildExpr(numbers, ops, grouping);
      const result = evalExpr(expr);
      if (result !== null && Math.abs(result - TARGET) < 1e-9) return true;
    }
  }
  return false;
}

// Simple seeded pseudo-random number generator (xorshift32) for reproducibility
function makeRng(seed) {
  let state = seed >>> 0 || 1;
  return function () {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function generatePuzzles(count) {
  const rng = makeRng(42);
  const puzzles = [];
  const seen = new Set();
  let attempts = 0;

  while (puzzles.length < count && attempts < 200000) {
    attempts++;
    const nums = Array.from({ length: 5 }, () => Math.floor(rng() * 9) + 1);
    const key = nums.join(',');
    if (seen.has(key)) continue;
    seen.add(key);

    if (canMake10(nums)) {
      puzzles.push({ id: puzzles.length + 1, numbers: nums });
      if (puzzles.length % 50 === 0) {
        process.stdout.write(`\r  ${puzzles.length}/${count} puzzles found (${attempts} attempts)`);
      }
    }
  }
  console.log(`\r  ${puzzles.length}/${count} puzzles found (${attempts} attempts)`);
  return puzzles;
}

console.log('Generating puzzles...');
const puzzles = generatePuzzles(COUNT);
console.log(`Generated ${puzzles.length} valid puzzles.`);

const outPath = path.join(__dirname, '..', 'src', 'data', 'puzzles.json');
fs.writeFileSync(outPath, JSON.stringify(puzzles, null, 2));
console.log(`Written to ${outPath}`);
