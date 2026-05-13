/**
 * 合成打工人 - Canvas 渲染器
 * 三层绘制：背景层 / 物品层 / UI层
 */

import { LEVELS, QUALITIES } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.redLineY = 0;
    this.dpr = 1;
    this.showWarning = false;
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.redLineY = this.height * 0.3;
    this.groundY = this.height - 30;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  // ===== 背景层 =====
  drawBackground() {
    const ctx = this.ctx;

    // 半透明白底
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 圆点纹理
    ctx.fillStyle = '#E8DDD0';
    for (let x = 10; x < this.width; x += 20) {
      for (let y = 10; y < this.height; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 红线区域背景（警告区）
    if (this.showWarning) {
      ctx.fillStyle = 'rgba(248, 113, 113, 0.15)';
      ctx.fillRect(0, 0, this.width, this.redLineY);
    }

    // 红线
    ctx.setLineDash([]);
    ctx.strokeStyle = this.showWarning ? '#EF4444' : '#F87171';
    ctx.lineWidth = this.showWarning ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(0, this.redLineY);
    ctx.lineTo(this.width, this.redLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 红线文字
    ctx.font = this.showWarning ? 'bold 13px sans-serif' : '11px sans-serif';
    ctx.fillStyle = this.showWarning ? '#EF4444' : '#F87171';
    ctx.textAlign = 'right';
    ctx.fillText(this.showWarning ? '⚠️ 危险！' : '⚠️ 红线', this.width - 8, this.redLineY - 6);

    // 地面线
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.width, this.groundY);
    ctx.stroke();
  }

  // ===== 物品层 =====
  drawBodies(bodies) {
    const ctx = this.ctx;

    for (const b of bodies) {
      const { x, y, radius, data } = b;

      if (data.type === 'worker') {
        this.drawWorker(x, y, radius, data);
      } else if (data.type === 'powerup') {
        this.drawPowerup(x, y, radius, data);
      }
    }
  }

  drawWorker(x, y, radius, data) {
    const ctx = this.ctx;
    const level = LEVELS[data.level];
    const quality = QUALITIES[data.quality];

    // 品质光圈
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = quality.color + '40';
    ctx.fill();
    ctx.strokeStyle = quality.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 背景圆
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = level.color;
    ctx.fill();
    ctx.strokeStyle = quality.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Emoji
    ctx.font = `${radius}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(level.emoji, x, y);

    // 品质标签
    if (data.quality !== 'B') {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = quality.color;
      ctx.fillText(quality.label, x + radius - 2, y - radius + 2);
    }
  }

  drawPowerup(x, y, radius, data) {
    const ctx = this.ctx;

    // 发光圈
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius + 8);
    glow.addColorStop(0, 'rgba(251,191,36,0.6)');
    glow.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
    ctx.fill();

    // 背景圆
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Emoji
    ctx.font = `${radius}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.emoji, x, y);
  }

  // ===== UI层 =====
  drawHUD(score, timeLeft, best) {
    const ctx = this.ctx;

    // 顶部半透明条
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(4, 4, this.width - 8, 36);
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, this.width - 8, 36);

    ctx.font = 'bold 14px "ZCOOL KuaiLe", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    // 分数
    ctx.fillStyle = '#FB923C';
    ctx.fillText(`💰 ${score.toLocaleString()}`, 14, 22);

    // 计时
    ctx.fillStyle = timeLeft <= 10 ? '#F87171' : '#1A1A2E';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱️ ${timeLeft}s`, this.width / 2, 22);

    // 最高分
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    ctx.fillText(`🏆 ${best.toLocaleString()}`, this.width - 14, 22);
  }

  // 教学提示
  drawTutorial(text) {
    if (!text) return;
    const ctx = this.ctx;
    const y = this.height - 60;

    ctx.fillStyle = 'rgba(26,26,46,0.85)';
    const metrics = ctx.measureText(text);
    const pad = 16;
    const w = metrics.width + pad * 2;
    const x = (this.width - w) / 2;

    ctx.beginPath();
    ctx.moveTo(x + 14, y - 14);
    ctx.lineTo(x + w - 14, y - 14);
    ctx.arcTo(x + w, y - 14, x + w, y, 14);
    ctx.arcTo(x + w, y + 14, x + w - 14, y + 14, 14);
    ctx.lineTo(x + 14, y + 14);
    ctx.arcTo(x, y + 14, x, y, 14);
    ctx.arcTo(x, y - 14, x + 14, y - 14, 14);
    ctx.closePath();
    ctx.fill();

    ctx.font = '14px "ZCOOL KuaiLe", sans-serif';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.width / 2, y);
  }

  // 第一关 HUD
  drawLevel1HUD() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(4, 4, this.width - 8, 36);
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, this.width - 8, 36);

    ctx.font = 'bold 14px "ZCOOL KuaiLe", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#60A5FA';
    ctx.fillText('🔵 试用期  目标：组长 👔', this.width / 2, 22);
  }
}
