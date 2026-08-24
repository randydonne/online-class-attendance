export const DEFAULT_PASSWORD = '1234';

const rawStudents = [
  ['晶晶唐', [], ''], ['雪儿', [], ''], ['胭脂', [], ''], ['小梅花', [], ''],
  ['何东玲', [], '听几节再安排'], ['梅子', ['梅晓燕'], ''], ['如', [], ''], ['张启梅', [], ''],
  ['与时俱进', ['王伟青'], ''], ['赫奕欢喜', ['慈言', '慧然'], ''], ['雪落无声', [], '八月初才会出勤'],
  ['罗莉', [], ''], ['开心', [], '旁听'], ['陀螺娘', [], '旁听'], ['%hua', [], '旁听'], ['King', [], ''],
];

const lessonRows = [
  // The document's verification table defines 梅子's formal total as 1 (7/26),
  // so the seed data follows that acceptance total rather than the conflicting row note.
  ['2026-07-12', '晶晶唐、雪儿、胭脂、小梅花、何东玲、梅子、如、张启梅、罗莉、开心、陀螺娘、%hua', { 晶晶唐: 1, 雪儿: 1, 胭脂: 1 }],
  ['2026-07-19', '晶晶唐、雪儿、胭脂、小梅花、何东玲、梅子、如、张启梅、与时俱进、赫奕欢喜、罗莉、开心、陀螺娘、%hua', { 雪儿: 1, 小梅花: 1 }],
  ['2026-07-26', '晶晶唐、雪儿、胭脂、小梅花、何东玲、梅子、张启梅、与时俱进、赫奕欢喜、罗莉、开心、陀螺娘、%hua', { 晶晶唐: 1, 梅子: 1, 张启梅: 1 }],
  ['2026-08-02', '晶晶唐、雪儿、胭脂、小梅花、何东玲、梅子、如、张启梅、与时俱进、赫奕欢喜、雪落无声、罗莉、开心、陀螺娘、%hua', { 胭脂: 1, 小梅花: 1, 与时俱进: 1 }],
  ['2026-08-09', '晶晶唐、雪儿、胭脂、小梅花、何东玲、梅子、张启梅、与时俱进、赫奕欢喜、雪落无声、陀螺娘、%hua', { 晶晶唐: 1, 雪儿: 1, 赫奕欢喜: 1 }],
  ['2026-08-16', '晶晶唐、雪儿、胭脂、小梅花、何东玲、梅子、张启梅、与时俱进、赫奕欢喜、雪落无声、罗莉、开心、陀螺娘、%hua', { 何东玲: 1, 张启梅: 1 }],
];

export function buildInitialState() {
  const students = rawStudents.map(([name, aliases, note], index) => ({ id: `s${index + 1}`, name, aliases, note }));
  const byName = new Map(students.map(student => [student.name, student.id]));
  return {
    version: 1,
    course: { name: 'J基础2组考勤', start: '2026-07-12', end: '2026-08-16' },
    password: DEFAULT_PASSWORD,
    students,
    records: lessonRows.map(([date, names, mic]) => ({
      date,
      attendance: names.split('、').map(name => byName.get(name)),
      mic: Object.fromEntries(Object.entries(mic).map(([name, count]) => [byName.get(name), count])),
    })),
  };
}

export function periodRecords(state) {
  return state.records.filter(record => record.date >= state.course.start && record.date <= state.course.end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function todayRecord(state, date) { return state.records.find(record => record.date === date); }

export function studentSummary(state, id) {
  const records = periodRecords(state);
  const attended = records.filter(record => record.attendance.includes(id));
  const mic = attended.reduce((sum, record) => sum + (Number(record.mic[id]) || 0), 0);
  return { attendance: attended.length, mic, records };
}

export function fuzzyDistance(a, b) {
  const source = Array.from(String(a)); const target = Array.from(String(b));
  const matrix = Array.from({ length: source.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= target.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= source.length; i += 1) {
    for (let j = 1; j <= target.length; j += 1) {
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + (source[i - 1] === target[j - 1] ? 0 : 1));
    }
  }
  return matrix[source.length][target.length];
}

export function matchStudents(students, tokens) {
  const found = new Map();
  for (const raw of tokens) {
    const token = String(raw).trim();
    if (!token || /^(已入会|全体静音|全体解除静音|搜索参会|邀请成员|联席主持人|主持人|本人)/.test(token)) continue;
    for (const student of students) {
      const candidates = [student.name, ...student.aliases];
      const exact = candidates.find(candidate => token === candidate);
      const fuzzy = !exact && candidates.find(candidate => candidate.length >= 2 && token.length >= 2 && fuzzyDistance(token, candidate) <= 1);
      if (exact || fuzzy) found.set(student.id, { student, token, method: exact ? '精确匹配' : '模糊匹配' });
    }
  }
  return [...found.values()];
}

export function cleanOcrText(text) {
  return String(text).split(/\n|\r|[，,、]/).map(value => value.replace(/[\d\s|_—–-]+$/g, '').trim()).filter(Boolean);
}
