/**
 * 合成打工人 - 物理引擎（简化版）
 * 不依赖 Matter.js，用原生 JS 实现下落 + 碰撞检测
 */

export class Physics {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.bodies = [];
    this.gravity = 0.3;
    this.friction = 0.98;
    this.groundY = height - 30;
  }

  // 创建物理体
  createBody(x, y, radius, data) {
    const body = {
      x, y,
      vx: 0,
      vy: 0,
      radius,
      data, // { level, quality, type: 'worker'|'item'|'powerup' }
      grounded: false,
      id: Math.random().toString(36).substr(2, 9),
    };
    this.bodies.push(body);
    return body;
  }

  // 移除物理体
  removeBody(id) {
    this.bodies = this.bodies.filter(b => b.id !== id);
  }

  // 按 ID 查找
  findById(id) {
    return this.bodies.find(b => b.id === id);
  }

  // 更新物理
  update(dt) {
    for (const b of this.bodies) {
      if (b.grounded) continue;

      // 重力
      b.vy += this.gravity;
      // 摩擦
      b.vx *= this.friction;

      b.x += b.vx;
      b.y += b.vy;

      // 边界碰撞
      if (b.x - b.radius < 0) {
        b.x = b.radius;
        b.vx = -b.vx * 0.5;
      }
      if (b.x + b.radius > this.width) {
        b.x = this.width - b.radius;
        b.vx = -b.vx * 0.5;
      }

      // 着地
      if (b.y + b.radius >= this.groundY) {
        b.y = this.groundY - b.radius;
        b.vy = 0;
        b.grounded = true;
      }
    }
  }

  // 碰撞检测 — 返回碰撞对
  detectCollisions() {
    const collisions = [];
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const a = this.bodies[i];
        const b = this.bodies[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist) {
          collisions.push({ a, b, overlap: minDist - dist });
        }
      }
    }
    return collisions;
  }

  // 简单弹开
  separate(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const overlap = (a.radius + b.radius - dist) / 2;
    const nx = dx / dist;
    const ny = dy / dist;

    a.x += nx * overlap;
    a.y += ny * overlap;
    b.x -= nx * overlap;
    b.y -= ny * overlap;
  }
}
