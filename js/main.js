/**
 * 合成打工人 - 主入口
 * 状态机 + 帧循环 + 全模块整合
 */

import { LEVELS, GAME_CONFIG } from './config.js';
import { Physics } from './physics.js';
import { Renderer } from './renderer.js';
import { Game } from './game.js';
import { Tutorial } from './tutorial.js';
import { InputHandler } from './input.js';
import { loadHighScore, saveHighScore, getPercentile } from './storage.js';

// ===== 状态 =====
const STATE = { HOME: 0, LEVEL1: 1, LEVEL2: 2, RESULT: 3 };
let currentState = STATE.HOME;

// ===== 实例 =====
let physics, renderer, game, tutorial, input;
let canvas;
let currentLevelCanvas;
let highScore = 0;

// ===== 初始化 =====
function init() {
  highScore = loadHighScore();
  updateHighScoreDisplay();

  // 绑定按钮
  document.getElementById('btn-start').addEventListener('click', () => startLevel1());
  document.getElementById('btn-retry').addEventListener('click', () => startLevel1());
  document.getElementById('btn-share').addEventListener('click', () => {
    // TODO: 生成分享卡片
  });

  console.log('🎮 合成打工人启动');
  enterState(STATE.HOME);
}

// ===== 状态切换 =====
function enterState(state) {
  currentState = state;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  switch (state) {
    case STATE.HOME:
      document.getElementById('screen-home').classList.add('active');
      updateHighScoreDisplay();
      break;

    case STATE.LEVEL1:
      document.getElementById('screen-level1').classList.add('active');
      setupLevel1();
      break;

    case STATE.LEVEL2:
      document.getElementById('screen-level2').classList.add('active');
      setupLevel2();
      break;

    case STATE.RESULT:
      document.getElementById('screen-result').classList.add('active');
      showResult();
      break;
  }
}

// ===== 第一关：试用期 =====
function setupLevel1() {
  currentLevelCanvas = document.getElementById('game-canvas');
  physics = new Physics(currentLevelCanvas.clientWidth, currentLevelCanvas.clientHeight);
  renderer = new Renderer(currentLevelCanvas);
  renderer.resize();

  game = new Game(physics, renderer);
  game.start(1); // level 1 = 无限时

  tutorial = new Tutorial();
  tutorial.reset();
  tutorial.onComplete = () => {
    // 过关！进入第二关
    setTimeout(() => enterState(STATE.LEVEL2), 1000);
  };

  // 输入
  if (input) input.destroy();
  input = new InputHandler(currentLevelCanvas);
  input.onDrop = (x) => {
    game.dropWorker(x);
    tutorial.onDrop();
  };

  // 游戏回调
  game.onScoreChange = (score) => {
    // 第一关也更新分数
  };

  // 重写 tryMerge 加入教学
  const originalTryMerge = game.tryMerge.bind(game);
  game.tryMerge = (bodyA, bodyB) => {
    const itemA = game.items.find(i => i.bodyId === bodyA.id);
    const itemB = game.items.find(i => i.bodyId === bodyB.id);
    if (!itemA || !itemB) return false;

    // 计算新等级
    let newLevel;
    if (itemA.quality === 'SS' || itemB.quality === 'SS') {
      newLevel = Math.min(Math.max(itemA.level, itemB.level) + 1, 7);
    } else if (itemA.level === itemB.level && itemA.quality === itemB.quality) {
      newLevel = itemA.level + 1;
    } else {
      return false;
    }

    // 执行合成
    const result = originalTryMerge(bodyA, bodyB);
    if (result) {
      tutorial.onMerge(newLevel);
    }
    return result;
  };
}

// ===== 第二关：正式工 =====
function setupLevel2() {
  currentLevelCanvas = document.getElementById('game-canvas-2');
  physics = new Physics(currentLevelCanvas.clientWidth, currentLevelCanvas.clientHeight);
  renderer = new Renderer(currentLevelCanvas);
  renderer.resize();

  game = new Game(physics, renderer);
  game.start(2);

  // 输入
  if (input) input.destroy();
  input = new InputHandler(currentLevelCanvas);
  input.onDrop = (x) => {
    game.dropWorker(x);
  };

  // 回调
  game.onScoreChange = (score) => {
    document.getElementById('hud-score').textContent = `💰 ${score.toLocaleString()}`;
  };

  game.onTimeChange = (timeLeft) => {
    document.getElementById('hud-timer').textContent = `⏱️ ${timeLeft}s`;
    if (timeLeft <= 10) {
      document.getElementById('hud-timer').style.color = '#F87171';
    }
  };

  game.onChairmanEffect = () => {
    showChairmanEffect();
  };

  game.onEventTriggered = (event) => {
    showEventPopup(event);
  };

  game.onGameOver = (score) => {
    highScore = Math.max(highScore, score);
    saveHighScore(highScore);
    setTimeout(() => enterState(STATE.RESULT), 500);
  };

  document.getElementById('hud-score').textContent = '💰 0';
  document.getElementById('hud-timer').textContent = '⏱️ 60s';
  document.getElementById('hud-timer').style.color = '';
  document.getElementById('hud-best').textContent = `🏆 ${highScore.toLocaleString()}`;
}

// ===== 结算页 =====
function showResult() {
  const items = game.items;
  let highestLevel = 0;
  let highestQuality = 'B';
  for (const item of items) {
    if (item.level > highestLevel) {
      highestLevel = item.level;
      highestQuality = item.quality;
    }
  }

  document.getElementById('result-level').textContent =
    `你合到了：${highestQuality}级 ${LEVELS[highestLevel].name}`;
  document.getElementById('result-score').textContent =
    `最终年薪：${game.score.toLocaleString()}`;
  document.getElementById('result-percent').textContent =
    `超过了 ${getPercentile(game.score)}% 的打工人`;
  document.getElementById('result-quote').textContent =
    `"${getRandomQuote()}"`;
}

function getRandomQuote() {
  const quotes = [
    '60秒当上CEO，现实要60年',
    '我摊牌了，我是SS级打工人',
    '老板看了我的年薪，决定给我加班',
    '这个薪资，我愿意996',
    '同事问我怎么做到的，我说靠运气',
    '终于知道为什么我现实是实习生了',
    '你的年薪还不如一个SS实习生',
    '我用60秒完成了你60年的职业规划',
    '董事长看了我的简历决定退休',
    '这是我离年薪百万最近的一次',
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// ===== 特效 =====
function showChairmanEffect() {
  const overlay = document.createElement('div');
  overlay.className = 'chairman-overlay';
  document.body.appendChild(overlay);

  const text = document.createElement('div');
  text.className = 'chairman-text';
  text.textContent = '👑 董事长驾到';
  document.body.appendChild(text);

  setTimeout(() => {
    overlay.remove();
    text.remove();
  }, 2000);
}

function showEventPopup(event) {
  const popup = document.createElement('div');
  popup.className = 'event-popup';
  popup.innerHTML = `
    <span class="emoji">${event.emoji}</span>
    <span class="name">${event.name}</span>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2000);
}

function updateHighScoreDisplay() {
  document.getElementById('high-score').textContent = highScore.toLocaleString();
}

// ===== 帧循环 =====
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if (currentState === STATE.LEVEL1 || currentState === STATE.LEVEL2) {
    game.update(dt);
    game.draw();

    if (currentState === STATE.LEVEL1) {
      renderer.drawLevel1HUD();
      renderer.drawTutorial(tutorial.getText());
    }
    if (currentState === STATE.LEVEL2) {
      renderer.drawHUD(game.score, game.timeLeft, highScore);
    }
  }

  requestAnimationFrame(gameLoop);
}

// ===== 启动 =====
init();
requestAnimationFrame(gameLoop);
