/**
 * 合成打工人 - 核心游戏逻辑
 * 掉落 / 合成 / 道具 / 事件 / 得分
 */

import { LEVELS, QUALITIES, MERGE_QUALITY_TABLE, ITEMS, EVENTS, GAME_CONFIG } from './config.js';
import { ParticleSystem } from './particles.js';

export class Game {
  constructor(physics, renderer) {
    this.physics = physics;
    this.renderer = renderer;
    this.particles = new ParticleSystem();

    this.items = []; // { bodyId, level, quality }
    this.score = 0;
    this.timeLeft = 60;
    this.timer = null;
    this.chairmanActive = false;
    this.nextSSGuarantee = false;

    // 掉落控制
    this.dropInterval = null;
    this.canDrop = true;
    this.dropCooldown = 300; // ms

    // 道具掉落
    this.itemDropTimer = null;

    // 事件触发
    this.eventTimer = null;
    this.eventCooldown = false;

    // 游戏状态
    this.isRunning = false;
    this.onGameOver = null;
    this.onScoreChange = null;
    this.onTimeChange = null;
  }

  // 开始游戏
  start(level = 2) {
    this.isRunning = true;
    this.score = 0;
    this.items = [];
    this.chairmanActive = false;
    this.nextSSGuarantee = false;

    if (level === 2) {
      this.timeLeft = GAME_CONFIG.level2Duration;
      this.startTimer();
      this.startItemDrop();
      this.startEventTrigger();
    }
  }

  // 停止游戏
  stop() {
    this.isRunning = false;
    clearInterval(this.timer);
    clearInterval(this.itemDropTimer);
    clearInterval(this.eventTimer);
    this.particles.clear();
  }

  // ===== 掉落 =====
  dropWorker(x) {
    if (!this.canDrop || !this.isRunning) return;

    const quality = this.rollQuality();
    const level = 0; // 实习生开始
    const radius = LEVELS[0].radius;

    const body = this.physics.createBody(x, 20, radius, {
      type: 'worker',
      level,
      quality,
    });

    this.items.push({ bodyId: body.id, level, quality });
    this.canDrop = false;

    setTimeout(() => { this.canDrop = true; }, this.dropCooldown);
  }

  // 按品质概率掉落
  rollQuality() {
    if (this.nextSSGuarantee) {
      this.nextSSGuarantee = false;
      return 'S';
    }

    const rand = Math.random();
    let cumulative = 0;

    for (const [q, info] of Object.entries(QUALITIES)) {
      cumulative += info.dropRate;
      if (rand <= cumulative) return q;
    }
    return 'B';
  }

  // ===== 合成 =====
  tryMerge(bodyA, bodyB) {
    const itemA = this.items.find(i => i.bodyId === bodyA.id);
    const itemB = this.items.find(i => i.bodyId === bodyB.id);
    if (!itemA || !itemB) return false;

    // SS 万能合成
    if (itemA.quality === 'SS' || itemB.quality === 'SS') {
      return this.executeMerge(itemA, itemB, bodyA, bodyB);
    }

    // 同等级同品质
    if (itemA.level === itemB.level && itemA.quality === itemB.quality) {
      return this.executeMerge(itemA, itemB, bodyA, bodyB);
    }

    return false;
  }

  executeMerge(itemA, itemB, bodyA, bodyB) {
    // 计算新等级
    const newLevel = Math.min(Math.max(itemA.level, itemB.level) + 1, 7);

    // 计算新品质
    let newQuality;
    if (itemA.quality === 'SS' || itemB.quality === 'SS') {
      // SS 合成时品质按 SS 品质重新随机
      newQuality = this.rollQualityFromTable('SS+SS');
    } else {
      const key = `${itemA.quality}+${itemB.quality}`;
      newQuality = this.rollQualityFromTable(MERGE_QUALITY_TABLE[key] || MERGE_QUALITY_TABLE['B+B']);
    }

    // 计算得分
    const levelData = LEVELS[newLevel];
    const qualityData = QUALITIES[newQuality];
    const salary = levelData.salary * qualityData.multiplier;
    this.score += Math.floor(salary);
    this.onScoreChange?.(this.score);

    // 移除旧物品
    this.physics.removeBody(bodyA.id);
    this.physics.removeBody(bodyB.id);
    this.items = this.items.filter(i => i.bodyId !== bodyA.id && i.bodyId !== bodyB.id);

    // 在中间位置创建新物品
    const midX = (bodyA.x + bodyB.x) / 2;
    const midY = Math.min(bodyA.y, bodyB.y) - 10;

    const newBody = this.physics.createBody(midX, midY, levelData.radius, {
      type: 'worker',
      level: newLevel,
      quality: newQuality,
    });

    this.items.push({ bodyId: newBody.id, level: newLevel, quality: newQuality });

    // 特效
    const color = qualityData.color;
    this.particles.emitFlash(midX, midY, color, 15 + newLevel * 5);
    this.particles.emitFloatText(midX, midY - 20, `+$${salary.toLocaleString()}`);

    // 合成到董事长
    if (newLevel === 7) {
      this.onChairmanAppeared(midX, midY);
    }

    return true;
  }

  rollQualityFromTable(table) {
    const rand = Math.random();
    let cumulative = 0;
    for (const [q, rate] of Object.entries(table)) {
      cumulative += rate;
      if (rand <= cumulative) return q;
    }
    return 'B';
  }

  // ===== 董事长 =====
  onChairmanAppeared(x, y) {
    this.chairmanActive = true;
    this.particles.emitChairmanAura(x, y);
    // 通知 UI 显示董事长特效
    this.onChairmanEffect?.();
  }

  // ===== 道具 =====
  dropPowerup() {
    if (!this.isRunning) return;

    // 按概率选道具
    const rand = Math.random();
    let cumulative = 0;
    let selected = ITEMS[0];
    for (const item of ITEMS) {
      cumulative += item.rate;
      if (rand <= cumulative) {
        selected = item;
        break;
      }
    }

    const x = 30 + Math.random() * (this.renderer.width - 60);
    const body = this.physics.createBody(x, 20, 22, {
      type: 'powerup',
      itemId: selected.id,
      emoji: selected.emoji,
      name: selected.name,
    });

    // 5 秒后消失
    setTimeout(() => {
      if (this.physics.findById(body.id)) {
        this.physics.removeBody(body.id);
      }
    }, GAME_CONFIG.itemDisappearTime);
  }

  pickupPowerup(body) {
    const item = ITEMS.find(i => i.id === body.data.itemId);
    if (!item) return;

    this.physics.removeBody(body.id);
    this.particles.emitFlash(body.x, body.y, '#FBBF24', 10);
    this.onItemPickup?.(item);

    switch (item.id) {
      case 'overtime': // +10秒
        this.timeLeft += 10;
        this.onTimeChange?.(this.timeLeft);
        this.particles.emitFloatText(body.x, body.y, '+10s', '#34D399');
        break;

      case 'promote': // 随机一个物品升一级
        this.promoteRandom();
        break;

      case 'merge': // 随机合并一组同级物品
        this.autoMergeRandom();
        break;

      case 'fire': // 消除最低级
        this.removeLowest();
        break;

      case 'insurance': // 下次合成保底 S
        this.nextSSGuarantee = true;
        this.particles.emitFloatText(body.x, body.y, 'Next S!', '#A78BFA');
        break;

      case 'bonus': // 当前年薪×50% 额外分
        const bonus = Math.floor(this.score * 0.5);
        this.score += bonus;
        this.onScoreChange?.(this.score);
        this.particles.emitFloatText(body.x, body.y, `+$${bonus.toLocaleString()}`, '#FBBF24');
        break;
    }
  }

  promoteRandom() {
    if (this.items.length === 0) return;
    const idx = Math.floor(Math.random() * this.items.length);
    const item = this.items[idx];
    if (item.level >= 7) return;

    const body = this.physics.findById(item.bodyId);
    if (!body) return;

    item.level += 1;
    body.data.level = item.level;
    body.radius = LEVELS[item.level].radius;

    this.particles.emitFlash(body.x, body.y, '#FB923C', 12);
    this.particles.emitFloatText(body.x, body.y - 15, `📈 ${LEVELS[item.level].name}`);
  }

  autoMergeRandom() {
    // 找一组同级同品质的
    for (let i = 0; i < this.items.length; i++) {
      for (let j = i + 1; j < this.items.length; j++) {
        const a = this.items[i];
        const b = this.items[j];
        if (a.level === b.level && a.quality === b.quality && a.level < 7) {
          const bodyA = this.physics.findById(a.bodyId);
          const bodyB = this.physics.findById(b.bodyId);
          if (bodyA && bodyB) {
            this.executeMerge(a, b, bodyA, bodyB);
            return;
          }
        }
      }
    }
  }

  removeLowest() {
    if (this.items.length === 0) return;
    let lowest = this.items[0];
    for (const item of this.items) {
      if (item.level < lowest.level) lowest = item;
    }
    const body = this.physics.findById(lowest.bodyId);
    if (body) {
      this.particles.emitFlash(body.x, body.y, '#F87171', 8);
      this.physics.removeBody(body.id);
    }
    this.items = this.items.filter(i => i.bodyId !== lowest.bodyId);
  }

  // ===== 事件 =====
  triggerRandomEvent() {
    if (!this.isRunning || this.eventCooldown) return;

    // 好事:坏事 = 6:4
    let event;
    if (Math.random() < GAME_CONFIG.eventGoodBadRatio) {
      const goodEvents = EVENTS.filter(e => e.type === 'good' || e.type === 'neutral');
      event = goodEvents[Math.floor(Math.random() * goodEvents.length)];
    } else {
      const badEvents = EVENTS.filter(e => e.type === 'bad');
      event = badEvents[Math.floor(Math.random() * badEvents.length)];
    }

    this.eventCooldown = true;
    setTimeout(() => { this.eventCooldown = false; }, 8000);

    this.onEventTriggered?.(event);

    switch (event.id) {
      case 'boss_check': // 停止掉落3秒
        this.canDrop = false;
        setTimeout(() => { this.canDrop = true; }, 3000);
        break;

      case 'slack': // 掉落速度减半5秒
        // TODO: 暂时降低掉落速度
        break;

      case 'blame': // 随机一个物品降一级
        this.demoteRandom();
        break;

      case 'overtime_night': // +15秒
        this.timeLeft += 15;
        this.onTimeChange?.(this.timeLeft);
        break;

      case 'team_build': // 所有同级物品自动合并
        this.mergeAllSameLevel();
        break;

      case 'layoff': // 最低级物品全部消失
        this.removeAllLowest();
        break;

      case 'review': // 10秒内掉落A级以上
        // TODO: 临时修改掉落品质
        break;

      case 'pie': // 下一个掉落必定S级
        this.nextSSGuarantee = true;
        break;

      case '996': // -5秒
        this.timeLeft = Math.max(0, this.timeLeft - 5);
        this.onTimeChange?.(this.timeLeft);
        break;

      case 'vacation': // 暂停掉落5秒
        this.canDrop = false;
        setTimeout(() => { this.canDrop = true; }, 5000);
        break;
    }
  }

  demoteRandom() {
    if (this.items.length === 0) return;
    const item = this.items[Math.floor(Math.random() * this.items.length)];
    if (item.level <= 0) return;

    const body = this.physics.findById(item.bodyId);
    if (!body) return;

    item.level -= 1;
    body.data.level = item.level;
    body.radius = LEVELS[item.level].radius;
    this.particles.emitFlash(body.x, body.y, '#F87171', 8);
  }

  mergeAllSameLevel() {
    const groups = {};
    for (const item of this.items) {
      const key = `${item.level}_${item.quality}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    for (const group of Object.values(groups)) {
      while (group.length >= 2) {
        const a = group.shift();
        const b = group.shift();
        const bodyA = this.physics.findById(a.bodyId);
        const bodyB = this.physics.findById(b.bodyId);
        if (bodyA && bodyB) {
          this.executeMerge(a, b, bodyA, bodyB);
        }
      }
    }
  }

  removeAllLowest() {
    if (this.items.length === 0) return;
    let minLevel = Math.min(...this.items.map(i => i.level));
    const toRemove = this.items.filter(i => i.level === minLevel);

    for (const item of toRemove) {
      const body = this.physics.findById(item.bodyId);
      if (body) {
        this.particles.emitFlash(body.x, body.y, '#F87171', 6);
        this.physics.removeBody(body.id);
      }
    }
    this.items = this.items.filter(i => i.level > minLevel);
  }

  // ===== 计时 =====
  startTimer() {
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      this.timeLeft--;
      this.onTimeChange?.(this.timeLeft);

      if (this.timeLeft <= 0) {
        this.stop();
        this.onGameOver?.(this.score);
      }
    }, 1000);
  }

  startItemDrop() {
    const drop = () => {
      if (!this.isRunning) return;
      this.dropPowerup();
      const next = GAME_CONFIG.itemDropInterval[0] +
        Math.random() * (GAME_CONFIG.itemDropInterval[1] - GAME_CONFIG.itemDropInterval[0]);
      this.itemDropTimer = setTimeout(drop, next);
    };
    drop();
  }

  startEventTrigger() {
    const trigger = () => {
      if (!this.isRunning) return;
      this.triggerRandomEvent();
      const next = GAME_CONFIG.eventInterval[0] +
        Math.random() * (GAME_CONFIG.eventInterval[1] - GAME_CONFIG.eventInterval[0]);
      this.eventTimer = setTimeout(trigger, next);
    };
    setTimeout(trigger, 5000); // 5秒后开始触发事件
  }

  // ===== 更新 =====
  update(dt) {
    if (!this.isRunning) return;

    this.physics.update(dt);
    this.particles.update();

    // 红线检测
    this.checkRedLine();

    // 碰撞检测
    const collisions = this.physics.detectCollisions();
    for (const { a, b, overlap } of collisions) {
      // 分离
      this.physics.separate(a, b);

      // 尝试合成
      if (a.data.type === 'worker' && b.data.type === 'worker') {
        this.tryMerge(a, b);
      }

      // 道具拾取
      if (a.data.type === 'worker' && b.data.type === 'powerup') {
        this.pickupPowerup(b);
      }
      if (b.data.type === 'worker' && a.data.type === 'powerup') {
        this.pickupPowerup(a);
      }
    }
  }

  // 红线检测：有物品超过红线就扣时间
  checkRedLine() {
    const redLineY = this.renderer.redLineY;
    const warningZone = redLineY + 30; // 红线以下30px为警告区
    let anyAboveRed = false;
    let anyNearRed = false;

    for (const body of this.physics.bodies) {
      if (body.data.type !== 'worker') continue;
      if (!body.grounded) continue; // 只检查已落地的物品
      const topEdge = body.y - body.radius;

      if (topEdge < redLineY) {
        anyAboveRed = true;
      }
      if (topEdge < warningZone) {
        anyNearRed = true;
      }
    }

    // 显示/隐藏警告
    this.renderer.showWarning = anyNearRed;

    // 超过红线扣时间（每秒扣1秒）
    if (anyAboveRed && !this._redLinePenaltyCd) {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      this.onTimeChange?.(this.timeLeft);
      this._redLinePenaltyCd = true;
      setTimeout(() => { this._redLinePenaltyCd = false; }, 1000);

      if (this.timeLeft <= 0) {
        this.stop();
        this.onGameOver?.(this.score);
      }
    }
  }

  // 绘制
  draw() {
    this.renderer.clear();
    this.renderer.drawBackground();
    this.renderer.drawBodies(this.physics.bodies);
    this.particles.draw(this.renderer.ctx);
  }
}
