/**
 * 合成打工人 - 主入口
 */

import { LEVELS, GAME_CONFIG } from './config.js';
import { Physics } from './physics.js';
import { Renderer } from './renderer.js';
import { Game } from './game.js';
import { Tutorial } from './tutorial.js';
import { InputHandler } from './input.js';
import { loadHighScore, saveHighScore, getPercentile } from './storage.js';

const STATE = { HOME: 0, LEVEL1: 1, LEVEL2: 2, RESULT: 3 };
let currentState = STATE.HOME;
let physics, renderer, game, tutorial, input;
let canvas;
let highScore = 0;

function init() {
  highScore = loadHighScore();
  updateHighScoreDisplay();

  document.getElementById('btn-start').addEventListener('click', () => {
    console.log('点击开始');
    enterState(STATE.LEVEL1);
  });
  document.getElementById('btn-retry').addEventListener('click', () => {
    enterState(STATE.LEVEL1);
  });
  document.getElementById('btn-share').addEventListener('click', () => {});

  console.log('🎮 合成打工人启动');
}

function enterState(state) {
  currentState = state;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  if (state === STATE.HOME) {
    document.getElementById('screen-home').classList.add('active');
    updateHighScoreDisplay();
  } else if (state === STATE.LEVEL1) {
    document.getElementById('screen-level1').classList.add('active');
    setTimeout(() => setupLevel1(), 50);
  } else if (state === STATE.LEVEL2) {
    document.getElementById('screen-level2').classList.add('active');
    setTimeout(() => setupLevel2(), 50);
  } else if (state === STATE.RESULT) {
    document.getElementById('screen-result').classList.add('active');
    showResult();
  }
}

function setupLevel1() {
  canvas = document.getElementById('game-canvas');
  const rect = canvas.getBoundingClientRect();
  console.log('Level1 canvas:', rect.width, 'x', rect.height);

  if (rect.width < 10 || rect.height < 10) {
    console.log('Canvas 太小，重试...');
    setTimeout(() => setupLevel1(), 100);
    return;
  }

  physics = new Physics(rect.width, rect.height);
  renderer = new Renderer(canvas);
  renderer.resize();
  game = new Game(physics, renderer);
  game.start(1);

  tutorial = new Tutorial();
  tutorial.reset();
  tutorial.onComplete = () => {
    setTimeout(() => enterState(STATE.LEVEL2), 800);
  };

  if (input) input.destroy();
  input = new InputHandler(canvas);
  input.onDrop = (x) => {
    game.dropWorker(x);
    tutorial.onDrop();
  };

  // 重写合成加入教学
  const origMerge = game.tryMerge.bind(game);
  game.tryMerge = (bodyA, bodyB) => {
    const a = game.items.find(i => i.bodyId === bodyA.id);
    const b = game.items.find(i => i.bodyId === bodyB.id);
    if (!a || !b) return false;

    let newLevel;
    if (a.quality === 'SS' || b.quality === 'SS') {
      newLevel = Math.min(Math.max(a.level, b.level) + 1, 7);
    } else if (a.level === b.level && a.quality === b.quality) {
      newLevel = a.level + 1;
    } else {
      return false;
    }

    const ok = origMerge(bodyA, bodyB);
    if (ok) tutorial.onMerge(newLevel);
    return ok;
  };

  console.log('Level1 初始化完成');

  // 测试 Canvas 是否能画东西
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(10, 10, 50, 50);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = 'black';
  ctx.fillText('Canvas OK', 80, 40);
}

function setupLevel2() {
  canvas = document.getElementById('game-canvas-2');
  const rect = canvas.getBoundingClientRect();

  if (rect.width < 10 || rect.height < 10) {
    setTimeout(() => setupLevel2(), 100);
    return;
  }

  physics = new Physics(rect.width, rect.height);
  renderer = new Renderer(canvas);
  renderer.resize();
  game = new Game(physics, renderer);
  game.start(2);

  if (input) input.destroy();
  input = new InputHandler(canvas);
  input.onDrop = (x) => game.dropWorker(x);

  game.onScoreChange = (s) => {
    document.getElementById('hud-score').textContent = `💰 ${s.toLocaleString()}`;
  };
  game.onTimeChange = (t) => {
    document.getElementById('hud-timer').textContent = `⏱️ ${t}s`;
    if (t <= 10) document.getElementById('hud-timer').style.color = '#F87171';
  };
  game.onChairmanEffect = () => showChairmanEffect();
  game.onEventTriggered = (e) => showEventPopup(e);
  game.onGameOver = (s) => {
    highScore = Math.max(highScore, s);
    saveHighScore(highScore);
    setTimeout(() => enterState(STATE.RESULT), 500);
  };

  document.getElementById('hud-score').textContent = '💰 0';
  document.getElementById('hud-timer').textContent = '⏱️ 60s';
  document.getElementById('hud-timer').style.color = '';
  document.getElementById('hud-best').textContent = `🏆 ${highScore.toLocaleString()}`;
}

function showResult() {
  const items = game ? game.items : [];
  let maxLv = 0, maxQ = 'B';
  for (const it of items) {
    if (it.level > maxLv) { maxLv = it.level; maxQ = it.quality; }
  }
  document.getElementById('result-level').textContent = `你合到了：${maxQ}级 ${LEVELS[maxLv].name}`;
  document.getElementById('result-score').textContent = `最终年薪：${(game?.score || 0).toLocaleString()}`;
  document.getElementById('result-percent').textContent = `超过了 ${getPercentile(game?.score || 0)}% 的打工人`;
  document.getElementById('result-quote').textContent = `"${getRandomQuote()}"`;
}

function getRandomQuote() {
  const q = [
    '60秒当上CEO，现实要60年', '我摊牌了，我是SS级打工人',
    '老板看了我的年薪，决定给我加班', '这个薪资，我愿意996',
    '同事问我怎么做到的，我说靠运气', '终于知道为什么我现实是实习生了',
    '你的年薪还不如一个SS实习生', '我用60秒完成了你60年的职业规划',
    '董事长看了我的简历决定退休', '这是我离年薪百万最近的一次',
  ];
  return q[Math.floor(Math.random() * q.length)];
}

function showChairmanEffect() {
  const o = document.createElement('div');
  o.className = 'chairman-overlay';
  document.body.appendChild(o);
  const t = document.createElement('div');
  t.className = 'chairman-text';
  t.textContent = '👑 董事长驾到';
  document.body.appendChild(t);
  setTimeout(() => { o.remove(); t.remove(); }, 2000);
}

function showEventPopup(event) {
  const p = document.createElement('div');
  p.className = 'event-popup';
  p.innerHTML = `<span class="emoji">${event.emoji}</span><span class="name">${event.name}</span>`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 2000);
}

function updateHighScoreDisplay() {
  document.getElementById('high-score').textContent = highScore.toLocaleString();
}

// ===== 帧循环 =====
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if ((currentState === STATE.LEVEL1 || currentState === STATE.LEVEL2) && game && renderer) {
    try {
      game.update(dt);
      game.draw();

      if (currentState === STATE.LEVEL1) {
        renderer.drawLevel1HUD();
        if (tutorial) renderer.drawTutorial(tutorial.getText());
      }
      if (currentState === STATE.LEVEL2) {
        renderer.drawHUD(game.score, game.timeLeft, highScore);
      }
    } catch (e) {
      console.error('游戏循环错误:', e);
    }
  }

  requestAnimationFrame(gameLoop);
}

init();
requestAnimationFrame(gameLoop);

// 全局错误捕获 — 直接显示在页面上
window.onerror = function(msg, url, line, col, err) {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:#F87171;color:#FFF;padding:12px;border-radius:8px;z-index:9999;font-size:13px;word-break:break-all;';
  d.innerHTML = `<b>❌ 错误</b><br>${msg}<br>行${line}:${col}`;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 10000);
};
window.addEventListener('unhandledrejection', function(e) {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:#FB923C;color:#FFF;padding:12px;border-radius:8px;z-index:9999;font-size:13px;word-break:break-all;';
  d.innerHTML = `<b>❌ Promise错误</b><br>${e.reason}`;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 10000);
});
