/**
 * 合成打工人 - 触摸/点击交互
 * 单击掉落 / 长按连掉 / 拖拽放置
 */

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.onDrop = null;      // (x) => void
    this.onDrag = null;      // (startX, startY, endX, endY) => void
    this.onTap = null;       // (x, y) => void

    this._timer = null;
    this._isLongPress = false;
    this._startX = 0;
    this._startY = 0;
    this._startTime = 0;
    this._autoDropInterval = null;

    this.LONG_PRESS_MS = 400;
    this.AUTO_DROP_INTERVAL = 200;

    this._bind();
  }

  _bind() {
    const c = this.canvas;

    // Touch
    c.addEventListener('touchstart', (e) => this._onStart(e), { passive: false });
    c.addEventListener('touchmove', (e) => this._onMove(e), { passive: false });
    c.addEventListener('touchend', (e) => this._onEnd(e));

    // Mouse (for dev)
    c.addEventListener('mousedown', (e) => this._onStart(e));
    c.addEventListener('mousemove', (e) => { if (this._timer) this._onMove(e); });
    c.addEventListener('mouseup', (e) => this._onEnd(e));
  }

  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  _onStart(e) {
    e.preventDefault();
    const pos = this._getPos(e);
    this._startX = pos.x;
    this._startY = pos.y;
    this._startTime = Date.now();
    this._isLongPress = false;

    // 长按检测
    this._timer = setTimeout(() => {
      this._isLongPress = true;
      this._startAutoDrop(pos.x);
    }, this.LONG_PRESS_MS);
  }

  _onMove(e) {
    const pos = this._getPos(e);
    const dx = pos.x - this._startX;
    const dy = pos.y - this._startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 超过 20px 算拖拽，取消长按
    if (dist > 20 && this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
      this._stopAutoDrop();
    }
  }

  _onEnd(e) {
    // 清除长按计时器
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._stopAutoDrop();

    // 拖拽
    if (this._isLongPress) return; // 长按结束，不触发

    const pos = this._getPos(e.changedTouches ? e.changedTouches[0] : e);
    const dx = pos.x - this._startX;
    const dy = pos.y - this._startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 20 && this.onDrag) {
      this.onDrag(this._startX, this._startY, pos.x, pos.y);
      return;
    }

    // 单击掉落
    if (this.onDrop) {
      this.onDrop(pos.x);
    }
  }

  _startAutoDrop(x) {
    if (this.onDrop) this.onDrop(x);
    this._autoDropInterval = setInterval(() => {
      if (this.onDrop) this.onDrop(x);
    }, this.AUTO_DROP_INTERVAL);
  }

  _stopAutoDrop() {
    if (this._autoDropInterval) {
      clearInterval(this._autoDropInterval);
      this._autoDropInterval = null;
    }
  }

  destroy() {
    clearTimeout(this._timer);
    this._stopAutoDrop();
  }
}
