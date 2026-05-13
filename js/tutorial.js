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
    this.idleTimer = null;
    this.idleFired = false;
    this.complete = false;
    this.onComplete = null;
  }

  reset() {
    this.currentText = this.stages[0].text;
    this.dropCount = 0;
    this.mergeCount = 0;
    this.idleTimer = null;
    this.idleFired = false;
    this.complete = false;
    this.startIdleWatch();
  }

  // 玩家掉落了一个物品
  onDrop() {
    this.dropCount++;
    if (this.dropCount === 3 && this.currentText === this.stages[0].text) {
      this.currentText = this.stages[1].text;
    }
    this.resetIdle();
  }

  // 发生了一次合成
  onMerge(newLevel) {
    this.mergeCount++;
    if (this.mergeCount === 1 && this.currentText === this.stages[1].text) {
      this.currentText = this.stages[2].text;
    }
    if (newLevel >= 1 && this.currentText === this.stages[2].text) {
      this.currentText = this.stages[3].text;
    }
    if (newLevel >= 2) {
      this.complete = true;
      this.currentText = '';
      this.onComplete?.();
    }
    this.resetIdle();
  }

  startIdleWatch() {
    this.resetIdle();
  }

  resetIdle() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (!this.idleFired && !this.complete) {
        this.idleFired = true;
        this.currentText = this.stages[4].text;
      }
    }, 5000);
  }

  getText() {
    return this.complete ? '' : this.currentText;
  }
}
