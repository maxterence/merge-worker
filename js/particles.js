/**
 * 合成打工人 - 粒子特效系统
 * 合成闪光 / 飘字 / SS降临 / 董事长光环
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // 合成闪光粒子
  emitFlash(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 3 + Math.random() * 4,
        color,
        type: 'flash',
      });
    }
  }

  // 飘字 "+$3000"
  emitFloatText(x, y, text, color = '#FFF') {
    this.particles.push({
      x, y,
      vx: 0,
      vy: -1.5,
      life: 1,
      decay: 0.015,
      text,
      color,
      size: 16,
      type: 'text',
    });
  }

  // SS 卷王降临 — 金色粒子雨
  emitSSRain(canvasWidth) {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        life: 1,
        decay: 0.008,
        size: 4 + Math.random() * 6,
        color: '#FBBF24',
        type: 'rain',
      });
    }
  }

  // 董事长光环 — 放射状粒子
  emitChairmanAura(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 0.5 + Math.random() * 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.01,
        size: 2 + Math.random() * 3,
        color: i % 2 === 0 ? '#FBBF24' : '#FB923C',
        type: 'aura',
      });
    }
  }

  // 更新所有粒子
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.type === 'text') {
        p.vy *= 0.98; // 减速
      }
      if (p.type === 'rain') {
        p.vy += 0.05; // 重力
      }
      if (p.type === 'aura') {
        p.vx *= 0.97;
        p.vy *= 0.97;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // 绘制所有粒子
  draw(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'text') {
        ctx.font = `bold ${p.size}px 'ZCOOL KuaiLe', sans-serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 清空
  clear() {
    this.particles = [];
  }
}
