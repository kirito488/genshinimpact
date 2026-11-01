/** Six-dimensional, deterministic, region-restricted matching. All scoring is interpretive entertainment. */
export const DATA_VERSION = 3;
export const RANK_WEIGHTS = [1, 0.35, -0.35, -1];

export function isValidAnswer(question, answer) {
  const validIndex = i => Number.isInteger(i) && i >= 0 && i < question.options.length;
  if (question.type === 'multi') return Array.isArray(answer) && answer.length === 2 && new Set(answer).size === 2 && answer.every(validIndex);
  if (question.type === 'rank') return Array.isArray(answer) && answer.length === question.options.length && new Set(answer).size === answer.length && answer.every(validIndex);
  return validIndex(answer);
}

export function answerVector(question, answer) {
  if (!isValidAnswer(question, answer)) throw new Error(`尚未完成题目 ${question.id}`);
  if (question.type === 'multi') return Array.from({length:6}, (_, d) => answer.reduce((sum, i) => sum + question.options[i].scores[d], 0) / 2);
  if (question.type === 'rank') return Array.from({length:6}, (_, d) => answer.reduce((sum, i, rank) => sum + question.options[i].scores[d] * RANK_WEIGHTS[rank], 0));
  return [...question.options[answer].scores];
}

function permutations(values) {
  if (values.length === 0) return [[]];
  return values.flatMap((value, i) => permutations(values.filter((_, j) => j !== i)).map(tail => [value, ...tail]));
}

export function possibleAnswers(question) {
  const indices = question.options.map((_, i) => i);
  if (question.type === 'rank') return permutations(indices);
  if (question.type === 'multi') return indices.flatMap((a, i) => indices.slice(i + 1).map(b => [a, b]));
  return indices;
}

const boundsCache = new WeakMap();
export function questionBounds(question) {
  if (boundsCache.has(question)) return boundsCache.get(question);
  const vectors = possibleAnswers(question).map(a => answerVector(question, a));
  const bounds = Array.from({length:6}, (_, d) => ({ min:Math.min(...vectors.map(v => v[d])), max:Math.max(...vectors.map(v => v[d])) }));
  boundsCache.set(question, bounds);
  return bounds;
}

export function scoreAnswers(questions, answers, {requireComplete = true} = {}) {
  if (!Array.isArray(answers)) throw new Error('答案格式无效');
  const sums = Array(6).fill(0), coverage = Array(6).fill(0);
  let completed = 0;
  questions.forEach((q, index) => {
    if (!isValidAnswer(q, answers[index])) {
      if (requireComplete) throw new Error(`请先完成第 ${index + 1} 题`);
      return;
    }
    completed++;
    const vector = answerVector(q, answers[index]);
    questionBounds(q).forEach(({min, max}, d) => {
      // Only an explicit choice between both poles is evidence for a dimension.
      // A zero means no evidence, never the opposite personality. Separate positive
      // and negative normalization keeps 0 neutral and both endpoints reachable.
      if (!(min < 0 && max > 0)) return;
      sums[d] += vector[d] >= 0 ? vector[d] / max : vector[d] / -min;
      coverage[d]++;
    });
  });
  return { vector:sums.map((s, d) => coverage[d] ? Math.max(-1, Math.min(1, s / coverage[d])) : 0), coverage, completed };
}

export function matchCharacters(regionId, vector, characters) {
  if (!Array.isArray(vector) || vector.length !== 6 || vector.some(v => !Number.isFinite(v) || Math.abs(v) > 1)) throw new Error('性格向量无效');
  const pool = characters.filter(c => c.region === regionId);
  if (!pool.length) throw new Error('地区角色池为空');
  return pool.map(character => {
    const distance = Math.sqrt(character.traits.reduce((sum, trait, i) => sum + (trait - vector[i]) ** 2, 0) / 6);
    return { character, distance, resonance:Math.round(100 * (1 - distance / 2)) };
  }).sort((a, b) => a.distance - b.distance || a.character.id.localeCompare(b.character.id));
}

export function matchingReasons(vector, character) {
  return character.traits.map((trait, dimension) => ({dimension, trait, user:vector[dimension], difference:Math.abs(trait - vector[dimension])}))
    .filter(item => Math.abs(item.user) >= 0.12 && item.user * item.trait > 0)
    .sort((a, b) => (b.user ** 2 / (1 + b.difference)) - (a.user ** 2 / (1 + a.difference)))
    .slice(0, 3);
}

export function restoreProgress(raw, regionId, questions) {
  if (!raw || raw.version !== DATA_VERSION || raw.region !== regionId || !Array.isArray(raw.answers)) return null;
  const answers = questions.map((q, i) => isValidAnswer(q, raw.answers[i]) ? raw.answers[i] : null);
  const firstMissing = answers.findIndex((a, i) => !isValidAnswer(questions[i], a));
  const complete = firstMissing === -1;
  const index = Number.isInteger(raw.index) && raw.index >= 0 && raw.index < questions.length ? raw.index : (complete ? questions.length - 1 : firstMissing);
  return {version:DATA_VERSION, region:regionId, answers, index:Math.min(index, complete ? questions.length - 1 : firstMissing), complete, updatedAt:raw.updatedAt};
}

export async function verifyKey(region, value, cryptoProvider = globalThis.crypto) {
  const normalized = value.trim().toUpperCase();
  const bytes = await cryptoProvider.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const hash = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  return hash === region.keyHash;
}
