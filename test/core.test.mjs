import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInitialState,
  fuzzyDistance,
  matchStudents,
  periodRecords,
  studentSummary,
  sortedStudents,
  todayRecord,
} from '../app-core.mjs';

test('initial data agrees with the supplied six-class verification totals', () => {
  const state = buildInitialState();
  const expected = {
    '晶晶唐': [6, 3], '雪儿': [6, 3], '胭脂': [6, 2], '小梅花': [6, 2],
    '何东玲': [6, 1], '梅子': [6, 1], '如': [3, 0], '张启梅': [6, 2],
    '与时俱进': [5, 1], '赫奕欢喜': [5, 1], '雪落无声': [3, 0], '罗莉': [5, 0],
    '开心': [5, 0], '陀螺娘': [6, 0], '%hua': [6, 0], 'King': [0, 0]
  };
  for (const student of state.students) {
    const summary = studentSummary(state, student.id);
    assert.deepEqual([summary.attendance, summary.mic], expected[student.name]);
  }
  assert.equal(periodRecords(state).length, 6);
});

test('aliases and a single-character OCR error map to one student without duplicates', () => {
  const state = buildInitialState();
  const matches = matchStudents(state.students, ['梅晓燕', '慧燃', '非本班人员', '梅子']);
  assert.deepEqual(matches.map(item => item.student.name).sort(), ['梅子', '赫奕欢喜']);
  assert.equal(fuzzyDistance('慧燃', '慧然'), 1);
});

test('records outside the selected course period are saved but excluded from totals', () => {
  const state = buildInitialState();
  state.records.push({ date: '2026-09-01', attendance: [state.students[0].id], mic: {} });
  assert.equal(periodRecords(state).length, 6);
  assert.equal(studentSummary(state, state.students[0].id).attendance, 6);
});

test('record lookup finds a day and no record returns undefined', () => {
  const state = buildInitialState();
  assert.equal(todayRecord(state, '2026-08-09').attendance.length, 12);
  assert.equal(todayRecord(state, '2026-08-10'), undefined);
});

test('statistics can be ordered by attendance rate or by total mic count', () => {
  const state = buildInitialState();
  const attendanceOrder = sortedStudents(state, 'attendance').map(student => student.name);
  const micOrder = sortedStudents(state, 'mic').map(student => student.name);
  assert.equal(attendanceOrder[0], '晶晶唐');
  assert.equal(attendanceOrder.at(-1), 'King');
  assert.equal(micOrder[0], '晶晶唐');
  assert.equal(micOrder.at(-1), 'King');
});
