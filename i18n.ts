import { Language } from "./types";

type TranslationKeys = 
  | 'app.subtitle'
  | 'phase.camera'
  | 'phase.loading'
  | 'error.camera.title'
  | 'error.camera.desc'
  | 'btn.retry_camera'
  | 'rules.normal.title'
  | 'rules.normal.desc'
  | 'rules.inverted.title'
  | 'rules.inverted.desc'
  | 'game.normal'
  | 'game.inverted'
  | 'game.controls'
  | 'btn.start'
  | 'btn.retry'
  | 'btn.practice'
  | 'btn.exit_practice'
  | 'practice.title'
  | 'practice.hit'
  | 'btn.main_menu';

export const translations: Record<Language, Record<TranslationKeys, string>> = {
  en: {
    'app.subtitle': 'COGNITIVE REFLEX ENGINE',
    'phase.camera': 'Initializing Optics...',
    'phase.loading': 'Calibrating Face Mesh...',
    'error.camera.title': 'CAMERA ACCESS DENIED',
    'error.camera.desc': 'We need vision to track your head movements. Please grant camera permission.',
    'btn.retry_camera': 'RETRY ACCESS',
    'rules.normal.title': 'BLUE REALITY',
    'rules.normal.desc': 'Lean LEFT to move LEFT. Lean RIGHT to move RIGHT.',
    'rules.inverted.title': 'RED REALITY',
    'rules.inverted.desc': 'Controls are REVERSED. Lean LEFT to move RIGHT.',
    'game.normal': 'SYSTEM NORMAL',
    'game.inverted': 'SYSTEM INVERTED',
    'game.controls': 'TILT HEAD TO STEER',
    'btn.start': 'INITIATE LINK',
    'btn.retry': 'REBOOT SYSTEM',
    'btn.practice': 'TRAINING SIM (INVERTED)',
    'btn.exit_practice': 'EXIT TRAINING',
    'practice.title': 'INVERSION PRACTICE',
    'practice.hit': 'COLLISION DETECTED',
    'btn.main_menu': 'RETURN TO MENU',
  },
  zh: {
    'app.subtitle': '认知反射引擎',
    'phase.camera': '正在连接视觉神经...',
    'phase.loading': '面部网格校准中...',
    'error.camera.title': '视觉连接失败',
    'error.camera.desc': '我们需要摄像头来捕捉头部动作，请允许访问权限。',
    'btn.retry_camera': '重试连接',
    'rules.normal.title': '蓝色现实 (正常)',
    'rules.normal.desc': '头向左歪 -> 向左移动。头向右歪 -> 向右移动。',
    'rules.inverted.title': '红色现实 (反转)',
    'rules.inverted.desc': '控制反转！头向左歪 -> 向【右】移动。',
    'game.normal': '系统正常',
    'game.inverted': '控制反转',
    'game.controls': '左右歪头控制方向',
    'btn.start': '启动引擎 (开始游戏)',
    'btn.retry': '重启系统',
    'btn.practice': '特训模式 (反转练习)',
    'btn.exit_practice': '退出特训',
    'practice.title': '反转适应训练 (无尽)',
    'practice.hit': '注意！发生碰撞',
    'btn.main_menu': '返回主菜单',
  }
};