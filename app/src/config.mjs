// Single source of truth for render / audio settings.  Shared by the browser runtime, Node scripts
// and (via a small regex reader in scripts/tts.py) the Python audio scripts.

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;
export const JPG_QUALITY = 93;
export const SAMPLE_RATE = 48000;

// ── 配音 ──────────────────────────────────────────────────────────────
// 默认音色：要换声音只改这一行（或者临时用环境变量 SPEAKER 覆盖），然后重跑
//   python scripts/build_audio.py --all --force
// 已试听过的可选音色见 audio/voice-samples/。
export const SPEAKER = 'zh_female_vv_uranus_bigtts';
export const SPEECH_RATE = 10;
export const TTS_RESOURCE = 'seed-tts-2.0';

export const CHROME_DEFAULT = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ── 时间轴（秒）────────────────────────────────────────────────────────
export const GAP = 0.35;      // between two lines inside a shot
export const LEAD = 0.4;      // shot start → first line
export const TAIL = 0.4;      // last line end → shot end
export const ACT_GAP = 0.8;   // extra breath when the act changes
export const INTRO = 0.6;     // fade in from black before the first shot's lead
export const OUTRO = 2.5;     // end card after the last line
export const XFADE = 0.4;     // cross-dissolve between shots
export const EST_CPS = 4.2;   // estimated chars/second when a line has no measured dur yet

// ── 视觉 ──────────────────────────────────────────────────────────────
export const C = {
  paper: '#f4ecdc',
  ink: '#2b2622',
  inkSoft: '#6b625a',
  line: '#cfc3ad',
  apricot: '#e8b77a',
  apricotDk: '#b97a2e',
  sage: '#9fc3a8',      // 存钱 / 妈妈
  sageDk: '#4c7d5c',
  blue: '#8fb3d9',      // 取钱 / 你
  blueDk: '#3f6b98',
  red: '#d64541',       // 只用于错误
  green: '#3a9a5b',     // 只用于正确 / 成功
  card: '#fffaf0',
};

export const FONT = {
  TITLE: '"KuaiLe", "Microsoft YaHei", "SimHei", sans-serif',
  BODY: '"Microsoft YaHei", "SimHei", "SimSun", sans-serif',
  MONO: 'Consolas, "Microsoft YaHei", monospace',
};
