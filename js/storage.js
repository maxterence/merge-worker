/**
 * 合成打工人 - localStorage 存储
 */

const STORAGE_KEY = 'merge_worker_data';

export function loadHighScore() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data?.highScore || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    if (score > (data.highScore || 0)) {
      data.highScore = score;
    }
    // 记录历史分数（用于计算超过百分比）
    if (!data.history) data.history = [];
    data.history.push(score);
    // 只保留最近 100 条
    if (data.history.length > 100) data.history = data.history.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getPercentile(score) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const history = data?.history || [];
    if (history.length === 0) return 50;
    const lower = history.filter(s => s < score).length;
    return Math.round((lower / history.length) * 100);
  } catch {
    return 50;
  }
}
