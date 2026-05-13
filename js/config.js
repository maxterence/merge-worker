/**
 * 合成打工人 - 配置数据
 * 等级表 / 品质表 / 概率表 / 道具表 / 事件表
 */

// 打工人等级
export const LEVELS = [
  { id: 0, name: '实习生', emoji: '💼', salary: 3000, radius: 20, color: '#94A3B8' },
  { id: 1, name: '员工',   emoji: '📋', salary: 8000, radius: 24, color: '#60A5FA' },
  { id: 2, name: '组长',   emoji: '👔', salary: 15000, radius: 28, color: '#34D399' },
  { id: 3, name: '经理',   emoji: '📊', salary: 25000, radius: 32, color: '#FBBF24' },
  { id: 4, name: '总监',   emoji: '🎯', salary: 40000, radius: 36, color: '#FB923C' },
  { id: 5, name: 'VP',     emoji: '🏢', salary: 60000, radius: 40, color: '#F87171' },
  { id: 6, name: 'CEO',    emoji: '👔', salary: 100000, radius: 44, color: '#A78BFA' },
  { id: 7, name: '董事长', emoji: '👑', salary: 999999, radius: 48, color: '#FB923C' },
];

// 品质体系
export const QUALITIES = {
  B:  { label: '🟢', multiplier: 1.0, color: '#34D399', dropRate: 0.62 },
  A:  { label: '🔵', multiplier: 1.3, color: '#60A5FA', dropRate: 0.30 },
  S:  { label: '⭐', multiplier: 2.0, color: '#A78BFA', dropRate: 0.08 },
  SS: { label: '✨', multiplier: 3.0, color: '#FBBF24', dropRate: 0.02, isWild: true },
};

// 合成品质概率（按输入品质）
export const MERGE_QUALITY_TABLE = {
  'B+B': { B: 0.62, A: 0.30, S: 0.08, SS: 0 },
  'A+A': { B: 0.30, A: 0.50, S: 0.20, SS: 0 },
  'S+S': { B: 0.10, A: 0.35, S: 0.45, SS: 0.10 },
  'SS+SS': { B: 0, A: 0, S: 0.30, SS: 0.70 },
};

// 道具表
export const ITEMS = [
  { id: 'overtime',   name: '加班卡',   emoji: '⏰', effect: 'time+10',    rate: 0.15 },
  { id: 'promote',    name: '晋升卡',   emoji: '📈', effect: 'levelUp',    rate: 0.08 },
  { id: 'merge',      name: '合并卡',   emoji: '🔗', effect: 'autoMerge',  rate: 0.12 },
  { id: 'fire',       name: '裁员卡',   emoji: '💀', effect: 'removeLow',  rate: 0.10 },
  { id: 'insurance',  name: '五险一金', emoji: '🛡️', effect: 'nextS',      rate: 0.05 },
  { id: 'bonus',      name: '年终奖',   emoji: '🎁', effect: 'scoreBonus', rate: 0.06 },
];

// 职场随机事件
export const EVENTS = [
  { id: 'boss_check',   name: '老板突击检查', emoji: '👁️', effect: 'stopDrop3s',   type: 'neutral' },
  { id: 'slack',        name: '带薪摸鱼',     emoji: '😴', effect: 'slowDrop5s',   type: 'good' },
  { id: 'blame',        name: '同事甩锅',     emoji: '💩', effect: 'levelDown',    type: 'bad' },
  { id: 'overtime_night',name: '加班通知',     emoji: '🌙', effect: 'time+15',      type: 'good' },
  { id: 'team_build',   name: '团建来了',     emoji: '🎉', effect: 'mergeAllSame', type: 'good' },
  { id: 'layoff',       name: '裁员风波',     emoji: '⚠️', effect: 'removeLowest', type: 'bad' },
  { id: 'review',       name: '年终述职',     emoji: '📋', effect: 'dropAPlus10s', type: 'good' },
  { id: 'pie',          name: '领导画饼',     emoji: '🫓', effect: 'nextS',        type: 'good' },
  { id: '996',          name: '996福报',      emoji: '💀', effect: 'time-5',       type: 'bad' },
  { id: 'vacation',     name: '带薪休假',     emoji: '🏖️', effect: 'pauseDrop5s',  type: 'good' },
];

// 游戏配置
export const GAME_CONFIG = {
  level1Target: 2,           // 第一关目标等级（组长）
  level2Duration: 60,        // 第二关时长（秒）
  dropInterval: 1200,        // 掉落间隔（ms）
  itemDropInterval: [8000, 12000], // 道具掉落间隔范围
  eventInterval: [10000, 15000],   // 事件触发间隔范围
  eventGoodBadRatio: 0.6,    // 好事:坏事 = 6:4
  itemDisappearTime: 5000,   // 道具消失时间
  chairmanBonus: 0.5,        // 董事长额外加分
};
