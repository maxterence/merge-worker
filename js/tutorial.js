/**
 * 合成打工人 - 教学引导（第一关）
 */

export class Tutorial {
  constructor() {
    this.stages = [
      { trigger: 'start',      text: '点击空白处掉落打工人 💼' },
      { trigger: 'drop3',      text: '让相同的人碰在一起 → 合成升级' },
      { trigger: 'firstMerge', text: '对了！继续合成到组长 👔 过关' },
      { trigger: 'reachLv1',   text: '还差一步！再升一级就过关了' },
      { trigger: 'idle5s',     text: '试试长按 — 可以连续掉落哦' },
    ];
    this.currentText = '';
    this.dropCount = 0;
    this.mergeCount = 0;
    this.highestLevel = 0;
    this.idleTimer = null;
    this.idleFired = false;
    this.complete = false;
    this.onComplete = null;
  }

  reset() {
    this.currentText = this.stages[0].text;
    this.dropCount = 0;
    this.mergeCount = 0;
    this.highestLevel = 0;
    this.idleTimer = null;
    this.idleFired = false;
    this.complete = false;
    this.startIdleWatch();
  }

  onDrop() {
    this.dropCount++;
    this.idleFired = false;
    this.resetIdle();
  }

  onMerge(newLevel) {
    this.mergeCount++;
    this.highestLevel = Math.max(this.highestLevel, newLevel);
    this.idleFired = false;

    if (newLevel >= 2) {
      this.complete = true;
      this.currentText = '';
      this.onComplete?.();
      this.resetIdle();
      return;
    }

    this.resetIdle();
  }

  /**
   * 根据当前游戏进度选择合适的提示文本
   */
  getText() {
    if (this.complete) return '';

    if (this.mergeCount > 0 && this.highestLevel >= 1) {
      return this.stages[3].text; // "还差一步！再升一级就过关了"
    }
    if (this.mergeCount > 0) {
      return this.stages[2].text; // "对了！继续合成到组长过关"
    }
    if (this.dropCount >= 3) {
      return this.stages[1].text; // "让相同的人碰在一起 → 合成升级"
    }
    if (this.idleFired) {
      return this.stages[4].text; // "试试长按 — 可以连续掉落哦"
    }
    return this.stages[0].text; // "点击空白处掉落打工人 💼"
  }

  startIdleWatch() {
    this.resetIdle();
  }

  resetIdle() {
    clearTimeout(this.idleTimer);
    if (this.complete) return;
    this.idleTimer = setTimeout(() => {
      if (!this.complete) {
        this.idleFired = true;
      }
    }, 5000);
  }
}
