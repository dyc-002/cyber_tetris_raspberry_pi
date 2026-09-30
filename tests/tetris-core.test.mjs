import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createBoard,
  collides,
  clearLines,
  rotateMatrix,
  getDropInterval,
  getCyberSecurityQuestionByTime,
  getShapeRewardPool,
} from '../public/tetris-core.mjs';

test('createBoard creates the expected board shape', () => {
  const board = createBoard(10, 20);
  assert.equal(board.length, 20);
  assert.equal(board[0].length, 10);
  assert.equal(board[19][9], 0);
});

test('clearLines removes complete rows and rewards scoring progression', () => {
  const board = createBoard(10, 4);
  board[3] = Array(10).fill(1);
  board[2] = Array(10).fill(1);

  const result = clearLines(board);
  assert.equal(result.linesCleared, 2);
  assert.deepEqual(result.board[3], Array(10).fill(0));
  assert.equal(result.board[0][0], 0);
});

test('rotating a matrix changes its orientation without losing cells', () => {
  const matrix = [
    [1, 1],
    [1, 0],
  ];

  const rotated = rotateMatrix(matrix);
  assert.deepEqual(rotated, [
    [1, 1],
    [0, 1],
  ]);
});

test('drop speed scales with level', () => {
  assert.ok(getDropInterval(1) > getDropInterval(10));
  assert.equal(getDropInterval(1), 700);
});

test('collides detects wall and stack overlaps', () => {
  const board = createBoard(10, 20);
  const piece = { x: 8, y: 0, matrix: [[1, 1, 1]] };
  assert.equal(collides(board, piece), true);

  const safePiece = { x: 3, y: 1, matrix: [[1, 1], [1, 1]] };
  assert.equal(collides(board, safePiece), false);
});

test('cyber-security questions escalate with difficulty and always include a valid answer', () => {
  const question = getCyberSecurityQuestionByTime(900000);

  assert.ok(question.prompt.length > 0);
  assert.equal(question.choices.length, 4);
  assert.ok(question.answerIndex >= 0 && question.answerIndex < 4);
  assert.ok(['easy', 'medium', 'hard'].includes(question.mode));
  assert.equal(question.mode, 'hard');
});

test('reward shape selection generates three unique options from the shape pool', () => {
  const pool = getShapeRewardPool(3);

  assert.equal(pool.length, 3);
  assert.equal(new Set(pool).size, 3);
  assert.ok(pool.every((type) => typeof type === 'number'));
  assert.ok(pool.every((type) => type >= 0 && type <= 6));
});
