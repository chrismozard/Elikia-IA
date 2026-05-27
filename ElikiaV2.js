"use strict";

/* ============================================================
   1. STATE
   ============================================================ */
const DEFAULT_STATE = {
  playerName: "Joueur",
  score: 0,
  xp: 0,
  globalLevel: 1,
  streak: 0,
  maxStreak: 0,
  totalPlayed: 0,
  badges: [],
  subjectStats: {
    math: { played: 0, correct: 0, types: {} },
    fr:   { played: 0, correct: 0, types: {} }
  }
};

let S = loadState();
let session = {};   // per-session data

function loadState() {
  try {
    return JSON.parse(localStorage.getItem('elikia-v2')) || { ...DEFAULT_STATE };
  } catch { return { ...DEFAULT_STATE }; }
}
function saveState() {
  localStorage.setItem('elikia-v2', JSON.stringify(S));
}

/* ============================================================
   2. XP / LEVEL / BADGES
   ============================================================ */
const XP_TABLE = [0,100,250,450,700,1000,1400,1900,2500,3200,4000];
const AVATARS   = ['🐣','🐥','🐧','🦉','🦅','🦁','🐉','🌟','🏆','👑'];

function xpForLevel(lv) { return XP_TABLE[Math.min(lv, XP_TABLE.length-1)] || (lv*500); }

function addXP(amount) {
  S.xp += amount;
  let newLevel = 1;
  for (let i = 1; i < XP_TABLE.length; i++) {
    if (S.xp >= XP_TABLE[i]) newLevel = i+1;
  }
  const leveled = newLevel > S.globalLevel;
  S.globalLevel = newLevel;
  updatePlayerBar();
  if (leveled) levelUpAnimation();
  saveState();
  return leveled;
}

const ALL_BADGES = [
  { id:'first',    icon:'🌱', label:'Premier pas',   desc:'Première bonne réponse' },
  { id:'streak3',  icon:'🔥', label:'En feu x3',     desc:'3 bonnes réponses de suite' },
  { id:'streak5',  icon:'⚡', label:'Super série x5', desc:'5 bonnes de suite' },
  { id:'streak10', icon:'💫', label:'Légendaire x10', desc:'10 bonnes de suite' },
  { id:'math50',   icon:'🧮', label:'Calculateur',    desc:'50 exercices de maths' },
  { id:'fr50',     icon:'📖', label:'Lecteur',        desc:'50 exercices de français' },
  { id:'lv3',      icon:'🥈', label:'Niveau 3',       desc:'Atteindre le niveau 3' },
  { id:'lv5',      icon:'🥇', label:'Niveau 5',       desc:'Atteindre le niveau 5' },
  { id:'lv10',     icon:'👑', label:'Champion',       desc:'Atteindre le niveau 10' },
  { id:'score100', icon:'💯', label:'Centurion',      desc:'100 points de score' },
  { id:'perfect',  icon:'✨', label:'Parfait !',      desc:'10 bonnes sans erreur' },
];

function checkBadges() {
  const earned = [];
  const has = id => S.badges.includes(id);
  if (S.subjectStats.math.correct >= 1 && !has('first')) earned.push('first');
  if (S.streak >= 3  && !has('streak3'))  earned.push('streak3');
  if (S.streak >= 5  && !has('streak5'))  earned.push('streak5');
  if (S.streak >= 10 && !has('streak10')) earned.push('streak10');
  if (S.subjectStats.math.played >= 50   && !has('math50'))  earned.push('math50');
  if (S.subjectStats.fr.played   >= 50   && !has('fr50'))    earned.push('fr50');
  if (S.globalLevel >= 3  && !has('lv3'))  earned.push('lv3');
  if (S.globalLevel >= 5  && !has('lv5'))  earned.push('lv5');
  if (S.globalLevel >= 10 && !has('lv10')) earned.push('lv10');
  if (S.score >= 100 && !has('score100'))  earned.push('score100');
  if (session.perfectRun >= 10 && !has('perfect')) earned.push('perfect');
  earned.forEach(id => S.badges.push(id));
  saveState();
  return earned;
}

/* ============================================================
   3. NAVIGATION
   ============================================================ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function navTo(screenId, btnId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(btnId)?.classList.add('active');
  showScreen(screenId);
}

function openMathMenu() {
  buildMathMenu();
  showScreen('screen-math-menu');
  document.getElementById('nav-math').classList.add('active');
  document.getElementById('nav-home').classList.remove('active');
}

function openFrMenu() {
  buildFrMenu();
  showScreen('screen-fr-menu');
  document.getElementById('nav-fr').classList.add('active');
  document.getElementById('nav-home').classList.remove('active');
}

/* ============================================================
   4. PLAYER BAR
   ============================================================ */
function updatePlayerBar() {
  const curLv   = S.globalLevel;
  const xpNeeded = xpForLevel(curLv) - xpForLevel(curLv-1);
  const xpGot    = S.xp - xpForLevel(curLv-1);
  const pct      = Math.min(100, Math.round((xpGot/xpNeeded)*100));

  document.getElementById('xp-bar').style.width = pct + '%';
  document.getElementById('xp-label').textContent = `${S.xp} / ${xpForLevel(curLv)}`;
  document.getElementById('player-name').textContent = S.playerName;
  document.getElementById('player-avatar').textContent = AVATARS[Math.min(curLv-1, AVATARS.length-1)];
  document.getElementById('disp-score').textContent  = S.score;
  document.getElementById('disp-level').textContent  = curLv;
  document.getElementById('disp-streak').textContent = S.streak;

  // Welcome
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  document.getElementById('welcome-msg').textContent = `${greet} ! Que veux-tu apprendre ? 🎒`;
}

function levelUpAnimation() {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.5);
    background:linear-gradient(135deg,#FFD600,#FF7043);
    color:white;padding:24px 36px;border-radius:24px;
    font-family:'Baloo 2',cursive;font-size:1.6rem;font-weight:800;
    z-index:9998;text-align:center;
    animation:lvUp .8s cubic-bezier(.34,1.56,.64,1) forwards;
  `;
  el.innerHTML = `🎉 Niveau ${S.globalLevel} !<br><small style="font-size:.9rem">Tu as grandi !</small>`;
  const style = document.createElement('style');
  style.textContent = `@keyframes lvUp{to{transform:translate(-50%,-50%) scale(1);opacity:1;}0%{opacity:0;}}`;
  document.head.appendChild(style);
  document.body.appendChild(el);
  playSuccess();
  setTimeout(() => el.remove(), 2200);
}

/* ============================================================
   5. MATH MENU
   ============================================================ */
const MATH_LEVELS = [
  { lv:1, label:'Nv.1',  color:'var(--lv1)', desc:'Additions simples (0–10)', unlocksAt:0 },
  { lv:2, label:'Nv.2',  color:'var(--lv2)', desc:'Jusqu\'à 20',              unlocksAt:2 },
  { lv:3, label:'Nv.3',  color:'var(--lv3)', desc:'Multiplications 2–5',      unlocksAt:4 },
  { lv:4, label:'Nv.4',  color:'var(--lv4)', desc:'Mult. avancée · Division', unlocksAt:6 },
  { lv:5, label:'Nv.5',  color:'var(--lv5)', desc:'Opérations mélangées',     unlocksAt:8 },
];

const MATH_EXERCISES = [
  { id:'calc',      icon:'➕',  label:'Calcul mental',         badge:'Rapide',  types:['add','sub','mul','div'] },
  { id:'missing',   icon:'❓',  label:'Nombre manquant',       badge:'Logique', types:['missing'] },
  { id:'compare',   icon:'⚖️', label:'Comparer les nombres',  badge:'Facile',  types:['compare'] },
  { id:'sequence',  icon:'🔢',  label:'Suite logique',         badge:'Défi',    types:['sequence'] },
  { id:'truefalse', icon:'✅',  label:'Vrai ou Faux',          badge:'Quiz',    types:['truefalse'] },
  { id:'timed',     icon:'⏱️', label:'Quiz chronométré',      badge:'Vitesse', types:['timed'] },
  { id:'challenge', icon:'💥',  label:'Mode défi',             badge:'Hard',    types:['challenge'] },
  { id:'mixed',     icon:'🎲',  label:'Aléatoire',             badge:'Mix',     types:['all'] },
  { id:'problems',  icon:'📝',  label:'Problèmes africains',    badge:'Contexte', types:['problems'] },
  { id:'mental-af', icon:'🧠',  label:'Calcul africain',        badge:'Simple',  types:['mental'] },
];

let selectedMathLevel = 1;

function buildMathMenu() {
  // Level buttons
  const sel = document.getElementById('math-level-selector');
  sel.innerHTML = '';
  MATH_LEVELS.forEach(l => {
    const btn = document.createElement('button');
    btn.className = 'level-btn' + (l.lv === selectedMathLevel ? ' active' : '');
    btn.dataset.lv = l.lv;
    const locked = S.globalLevel < l.unlocksAt;
    if (locked) {
      btn.innerHTML = `🔒 ${l.label}`;
      btn.style.opacity = '.5';
      btn.onclick = () => toast(`Atteins le niveau ${l.unlocksAt} pour débloquer !`);
    } else {
      btn.innerHTML = l.label;
      btn.style.setProperty('--c', l.color);
      btn.onclick = () => {
        selectedMathLevel = l.lv;
        buildMathMenu();
      };
    }
    sel.appendChild(btn);
  });

  // Exercise grid
  const grid = document.getElementById('math-exercise-grid');
  grid.innerHTML = '';
  MATH_EXERCISES.forEach(ex => {
    const card = document.createElement('div');
    card.className = 'exercise-card bounce-in';
    card.innerHTML = `
      <div class="ex-icon">${ex.icon}</div>
      <div class="ex-name">${ex.label}</div>
      <div class="ex-badge">${ex.badge}</div>
    `;
    card.onclick = () => launchMath(ex.id);
    grid.appendChild(card);
  });
}

/* ============================================================
   6. FRENCH MENU
   ============================================================ */
const FR_EXERCISES = [
  { id:'lettersort',  icon:'🔡', label:'Lettres mélangées',    badge:'Ortho'    },
  { id:'wordsort',    icon:'📝', label:'Phrase à remettre',     badge:'Lecture'  },
  { id:'complete',    icon:'📖', label:'Mot à compléter',       badge:'Écriture' },
  { id:'correct',     icon:'✏️', label:'Corriger les fautes',   badge:'Ortho'    },
  { id:'synonym',     icon:'🔄', label:'Synonymes',             badge:'Vocab'    },
  { id:'antonym',     icon:'↔️', label:'Antonymes',             badge:'Vocab'    },
  { id:'article',     icon:'📌', label:'Bon article',           badge:'Grammaire'},
  { id:'noun-verb',   icon:'🏷️', label:'Nom ou Verbe ?',       badge:'Grammaire'},
  { id:'right-word',  icon:'💬', label:'Choisir le bon mot',    badge:'Phrases'  },
  { id:'fr-truefalse',icon:'✅', label:'Vrai ou Faux (Français)',badge:'Quiz'     },
  { id:'dictation',   icon:'👂', label:'Dictée simple',        badge:'Écoute'   },
  { id:'copying',     icon:'📋', label:'Recopie',              badge:'Motricité'},
  { id:'order-word',  icon:'📄', label:'Remise en ordre',       badge:'Grammaire'},
];

function buildFrMenu() {
  const grid = document.getElementById('fr-exercise-grid');
  grid.innerHTML = '';
  FR_EXERCISES.forEach(ex => {
    const card = document.createElement('div');
    card.className = 'exercise-card bounce-in';
    card.innerHTML = `
      <div class="ex-icon">${ex.icon}</div>
      <div class="ex-name">${ex.label}</div>
      <div class="ex-badge">${ex.badge}</div>
    `;
    card.onclick = () => launchFr(ex.id);
    grid.appendChild(card);
  });
}

/* ============================================================
   7. SESSION & LAUNCH
   ============================================================ */
let currentExercise = null; // { subject, type, answer, timedMode }
let timerInterval = null;
let timerLeft = 0;

function startSession(subject, exerciseType, opts = {}) {
  session = {
    subject,
    exerciseType,
    correct: 0,
    wrong: 0,
    xpEarned: 0,
    maxStreak: 0,
    perfectRun: 0,
    totalQ: opts.totalQ || Infinity,
    currentQ: 0,
    timed: opts.timed || false,
    timedSeconds: opts.timedSeconds || 15,
    lives: opts.lives !== undefined ? opts.lives : 3,
    startLives: opts.lives !== undefined ? opts.lives : 3,
  };
  document.getElementById('btn-back-menu').onclick = () => {
    clearTimer();
    showScreen(subject === 'math' ? 'screen-math-menu' : 'screen-fr-menu');
  };

  const tag = document.getElementById('ex-tag');
  if (subject === 'math') {
    tag.textContent = '🧮 Maths · Nv.' + selectedMathLevel;
    tag.className = 'ex-subject-tag tag-math';
  } else {
    tag.textContent = '📚 Français';
    tag.className = 'ex-subject-tag tag-fr';
  }

  showScreen('screen-exercise');
  generateExercise();
}

function launchMath(id) {
  const opts = id === 'timed'     ? { timed:true, timedSeconds:10, totalQ:10 }
             : id === 'challenge' ? { lives:3, totalQ:15 }
             : {};
  startSession('math', id, opts);
}

function launchFr(id) {
  startSession('fr', id, {});
}

function startChallenge() {
  selectedMathLevel = 3;
  startSession('math', 'challenge', { lives:3, totalQ:15 });
}

function startDaily() {
  // Seed based on date so same exercises per day
  const d = new Date();
  const seed = d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
  selectedMathLevel = (seed % 3) + 1;
  startSession('math', 'mixed', { timed:true, timedSeconds:12, totalQ:10 });
}

/* ============================================================
   8. EXERCISE GENERATORS
   ============================================================ */
const R = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

function getLevelNums() {
  switch(selectedMathLevel) {
    case 1: return { max:10, maxResult:20, ops:['add','sub'], mulMax:3 };
    case 2: return { max:20, maxResult:50, ops:['add','sub'], mulMax:4 };
    case 3: return { max:30, maxResult:100, ops:['add','sub','mul'], mulMax:5 };
    case 4: return { max:50, maxResult:200, ops:['add','sub','mul','div'], mulMax:9 };
    case 5: return { max:100, maxResult:1000, ops:['add','sub','mul','div','mixed'], mulMax:12 };
    default:return { max:10, maxResult:20, ops:['add','sub'], mulMax:3 };
  }
}

function generateExercise() {
  if (session.currentQ >= session.totalQ) { endSession(); return; }
  session.currentQ++;

  clearTimer();
  resetExUI();

  const { subject, exerciseType } = session;
  let ex;

  if (subject === 'math') {
    ex = genMath(exerciseType);
  } else {
    ex = genFr(exerciseType);
  }

  currentExercise = ex;
  renderExercise(ex);

  if (session.timed) startTimer(session.timedSeconds);
  renderLives();
  updateComboBanner();
}

/* ---- MATH GENERATORS ---- */
function genMath(type) {
  const cfg = getLevelNums();
  
  // Nouveaux types africains
  if (type === 'problems') return genAfricanProblem();
  if (type === 'mental') return genAfricanMental();
  
  const op = type === 'all' || type === 'calc' || type === 'mixed' || type === 'timed' || type === 'challenge'
    ? cfg.ops[R(0, cfg.ops.length-1)]
    : type;

  if (op === 'add' || type === 'calc') return genAdd(cfg);
  if (op === 'sub') return genSub(cfg);
  if (op === 'mul') return genMul(cfg);
  if (op === 'div') return genDiv(cfg);
  if (type === 'missing')   return genMissing(cfg);
  if (type === 'compare')   return genCompare(cfg);
  if (type === 'sequence')  return genSequence();
  if (type === 'truefalse') return genTrueFalse(cfg);
  return genAdd(cfg);
}

function genAdd(cfg) {
  const maxResult = cfg.maxResult || 20;
  const half = Math.floor(maxResult / 2);
  let a = R(1, half);
  let b = R(1, maxResult - a);
  return {
    typeLabel:'Addition', inputType:'text',
    question:`${a} + ${b} = ?`,
    answer: String(a+b),
    xp: 10
  };
}
function genSub(cfg) {
  const maxResult = cfg.maxResult || 20;
  const a = R(1, maxResult);
  const b = R(1, a);
  return {
    typeLabel:'Soustraction', inputType:'text',
    question:`${a} − ${b} = ?`,
    answer: String(a-b),
    xp: 10
  };
}
function genMul(cfg) {
  const maxResult = cfg.maxResult || 100;
  let a, b;
  const mx = cfg.mulMax || 5;
  do {
    a = R(2, mx);
    b = R(2, mx);
  } while (a * b > maxResult);
  return {
    typeLabel:'Multiplication', inputType:'text',
    question:`${a} × ${b} = ?`,
    answer: String(a*b),
    xp: 15
  };
}
function genDiv(cfg) {
  const maxResult = cfg.maxResult || 100;
  const mx = cfg.mulMax || 5;
  let b, q, a;
  do {
    b = R(2, mx);
    q = R(2, Math.min(mx, Math.floor(maxResult / b)));
    a = b * q;
  } while (a > maxResult);
  return {
    typeLabel:'Division', inputType:'text',
    question:`${a} ÷ ${b} = ?`,
    answer: String(q),
    xp: 15
  };
}
function genMissing(cfg) {
  const maxResult = cfg.maxResult || 20;
  const half = Math.floor(maxResult / 2);
  const a = R(1, half);
  const b = R(1, maxResult - a);
  const total = a+b;
  const hide = R(0,1); // 0=hide a, 1=hide b
  const q = hide === 0
    ? `? + ${b} = ${total}`
    : `${a} + ? = ${total}`;
  const ans = hide === 0 ? a : b;
  return {
    typeLabel:'Nombre manquant', inputType:'text',
    question: q, answer: String(ans), xp: 12
  };
}
function genCompare(cfg) {
  const a = R(0, cfg.max); const b = R(0, cfg.max);
  const opts = a>b ? ['>','<','='] : a<b ? ['<','>','='] : ['=','>','<'];
  const correct = opts[0];
  const shuffled = [...opts].sort(()=>Math.random()-.5);
  return {
    typeLabel:'Comparaison', inputType:'choices',
    question:`${a}  ___  ${b}`,
    choices: shuffled,
    answer: correct,
    xp: 10
  };
}
function genSequence() {
  const step = R(1,5);
  const start = R(0,20);
  const seq = [start, start+step, start+step*2, start+step*3];
  return {
    typeLabel:'Suite logique', inputType:'text',
    question:`${seq[0]} – ${seq[1]} – ${seq[2]} – ?`,
    answer: String(seq[3]),
    xp: 14
  };
}
function genTrueFalse(cfg) {
  const maxResult = cfg.maxResult || 20;
  const half = Math.floor(maxResult / 2);
  const a = R(1, half);
  const b = R(1, maxResult - a);
  const sum = a + b;
  const ops = [
    { q:`${a} + ${b} = ?`, correct:sum },
    { q:`${sum} − ${b} = ?`, correct:a },
  ];
  const pick = ops[R(0,1)];
  const isTrue = Math.random() > 0.45;
  const shown = isTrue ? pick.correct : pick.correct + R(1,3) * (Math.random()>.5?1:-1);
  return {
    typeLabel:'Vrai ou Faux', inputType:'truefalse',
    question:`${pick.q.replace('?', shown)}`,
    answer: isTrue ? 'vrai' : 'faux',
    xp: 8
  };
}

function genAfricanProblem() {
  const lvls = ['cp1', 'cp2', 'ce1'];
  const lvl = lvls[Math.floor((S.globalLevel - 1) / 3)];
  // Mix des données de base et étendues
  const allProblems = [...AFRICAN_PROBLEMS_DATA[lvl], ...EXTENDED_AFRICAN_EXERCISES.problems_extended.filter(p => p.lvl === lvl)];
  const prob = pickRandom(allProblems) || { q:"Maman a 2 mangues. Combien ?", ans:2 };
  return {
    typeLabel:'Problème africain', inputType:'text',
    question: prob.q,
    answer: String(prob.ans),
    xp: 16
  };
}

function genAfricanMental() {
  const types = ['addition_simple', 'subtraction_simple', 'doubles', 'halves', 'sequences'];
  const type = types[R(0, types.length-1)];
  let data = AFRICAN_MATH_DATA[type] || [];
  
  // Ajouter les données étendues
  if (type === 'doubles' || type === 'halves' || type === 'sequences') {
    const extended = EXTENDED_AFRICAN_EXERCISES.mental_math_extended.filter(m => m.q.includes(type === 'doubles' ? 'Double' : type === 'halves' ? 'Moitié' : '−'));
    data = [...data, ...extended];
  }
  
  const item = pickRandom(data) || { q:"2 + 1 = ?", ans:"3" };
  return {
    typeLabel:'Calcul africain', inputType:'text',
    question: item.q,
    answer: String(item.ans),
    xp: 10
  };
}

/* ---- FRENCH GENERATORS ---- */
const FR_DATA = {
  mots: ["AVION","CHAT","LUNE","PAPA","MAMAN","VÉLO","POMME","TABLE","FLEUR","LIVRE","ÉCOLE","MAISON","JARDIN","SOLEIL","ÉTOILE"],
  phrases: [
    // CP1 — 35 phrases simples
    {fr:"Papa va au marché.",words:["Papa","va","au","marché."]},
    {fr:"Maman prépare le repas.",words:["Maman","prépare","le","repas."]},
    {fr:"Le chat dort.",words:["Le","chat","dort."]},
    {fr:"La poule mange du maïs.",words:["La","poule","mange","du","maïs."]},
    {fr:"Toto joue au ballon.",words:["Toto","joue","au","ballon."]},
    {fr:"Le bébé pleure.",words:["Le","bébé","pleure."]},
    {fr:"Il fait chaud aujourd'hui.",words:["Il","fait","chaud","aujourd'hui."]},
    {fr:"La lune brille la nuit.",words:["La","lune","brille","la","nuit."]},
    {fr:"L'enfant lave ses mains.",words:["L'enfant","lave","ses","mains."]},
    {fr:"Le chien court vite.",words:["Le","chien","court","vite."]},
    {fr:"Je vais à l'école.",words:["Je","vais","à","l'école."]},
    {fr:"Mimi porte une robe rouge.",words:["Mimi","porte","une","robe","rouge."]},
    {fr:"Le maître écrit au tableau.",words:["Le","maître","écrit","au","tableau."]},
    {fr:"La pluie tombe fort.",words:["La","pluie","tombe","fort."]},
    {fr:"Le soleil se lève.",words:["Le","soleil","se","lève."]},
    {fr:"Nous chantons en classe.",words:["Nous","chantons","en","classe."]},
    {fr:"Le poisson nage dans l'eau.",words:["Le","poisson","nage","dans","l'eau."]},
    {fr:"Ali ouvre son cahier.",words:["Ali","ouvre","son","cahier."]},
    {fr:"La porte est fermée.",words:["La","porte","est","fermée."]},
    {fr:"Le vélo est neuf.",words:["Le","vélo","est","neuf."]},
    {fr:"La fille saute à la corde.",words:["La","fille","saute","à","la","corde."]},
    {fr:"Papa lit le journal.",words:["Papa","lit","le","journal."]},
    {fr:"Le garçon mange une banane.",words:["Le","garçon","mange","une","banane."]},
    {fr:"Le bébé dort bien.",words:["Le","bébé","dort","bien."]},
    {fr:"L'oiseau vole haut.",words:["L'oiseau","vole","haut."]},
    {fr:"Je dessine une maison.",words:["Je","dessine","une","maison."]},
    {fr:"La voiture roule vite.",words:["La","voiture","roule","vite."]},
    {fr:"Le cahier est propre.",words:["Le","cahier","est","propre."]},
    {fr:"Le savon mousse bien.",words:["Le","savon","mousse","bien."]},
    {fr:"La chèvre mange l'herbe.",words:["La","chèvre","mange","l'herbe."]},
    {fr:"Le maître parle doucement.",words:["Le","maître","parle","doucement."]},
    {fr:"Le riz est chaud.",words:["Le","riz","est","chaud."]},
    {fr:"Nous aimons jouer.",words:["Nous","aimons","jouer."]},
    {fr:"Le sac est lourd.",words:["Le","sac","est","lourd."]},
    {fr:"L'école est grande.",words:["L'école","est","grande."]},
    // CP2 — 35 phrases intermédiaires
    {fr:"Chaque matin, Paul arrive tôt à l'école.",words:["Chaque","matin,","Paul","arrive","tôt","à","l'école."]},
    {fr:"La maîtresse corrige les exercices des élèves.",words:["La","maîtresse","corrige","les","exercices","des","élèves."]},
    {fr:"Les enfants plantent des fleurs dans le jardin.",words:["Les","enfants","plantent","des","fleurs","dans","le","jardin."]},
    {fr:"Le pêcheur répare son filet au bord du fleuve.",words:["Le","pêcheur","répare","son","filet","au","bord","du","fleuve."]},
    {fr:"Mon frère aime lire des histoires amusantes.",words:["Mon","frère","aime","lire","des","histoires","amusantes."]},
    {fr:"La pluie a rempli les flaques d'eau.",words:["La","pluie","a","rempli","les","flaques","d'eau."]},
    {fr:"Les élèves récitent une poésie en classe.",words:["Les","élèves","récitent","une","poésie","en","classe."]},
    {fr:"La vendeuse range les tomates dans un panier.",words:["La","vendeuse","range","les","tomates","dans","un","panier."]},
    {fr:"Le médecin soigne les malades du village.",words:["Le","médecin","soigne","les","malades","du","village."]},
    {fr:"Les oiseaux chantent dans les arbres.",words:["Les","oiseaux","chantent","dans","les","arbres."]},
    {fr:"Grand-mère prépare du foufou pour le dîner.",words:["Grand-mère","prépare","du","foufou","pour","le","dîner."]},
    {fr:"Le chauffeur conduit le bus avec prudence.",words:["Le","chauffeur","conduit","le","bus","avec","prudence."]},
    {fr:"Les enfants traversent la route calmement.",words:["Les","enfants","traversent","la","route","calmement."]},
    {fr:"Le directeur visite les salles de classe.",words:["Le","directeur","visite","les","salles","de","classe."]},
    {fr:"La rivière coule derrière notre maison.",words:["La","rivière","coule","derrière","notre","maison."]},
    {fr:"Le maçon construit une nouvelle école.",words:["Le","maçon","construit","une","nouvelle","école."]},
    {fr:"Mon ami partage son goûter avec moi.",words:["Mon","ami","partage","son","goûter","avec","moi."]},
    {fr:"Le menuisier fabrique une belle table.",words:["Le","menuisier","fabrique","une","belle","table."]},
    {fr:"Les élèves nettoient la cour de l'école.",words:["Les","élèves","nettoient","la","cour","de","l'école."]},
    {fr:"Le bébé sourit à sa maman.",words:["Le","bébé","sourit","à","sa","maman."]},
    {fr:"Nous apprenons les tables de multiplication.",words:["Nous","apprenons","les","tables","de","multiplication."]},
    {fr:"Le cultivateur travaille dans son champ.",words:["Le","cultivateur","travaille","dans","son","champ."]},
    {fr:"La cloche annonce la récréation.",words:["La","cloche","annonce","la","récréation."]},
    {fr:"Le marchand vend des oranges fraîches.",words:["Le","marchand","vend","des","oranges","fraîches."]},
    {fr:"Les enfants jouent sous le manguier.",words:["Les","enfants","jouent","sous","le","manguier."]},
    {fr:"Le cahier de Marie est très propre.",words:["Le","cahier","de","Marie","est","très","propre."]},
    {fr:"Le pompier éteint le feu rapidement.",words:["Le","pompier","éteint","le","feu","rapidement."]},
    {fr:"La maîtresse raconte une belle histoire.",words:["La","maîtresse","raconte","une","belle","histoire."]},
    {fr:"Le train transporte beaucoup de voyageurs.",words:["Le","train","transporte","beaucoup","de","voyageurs."]},
    {fr:"Les élèves lèvent la main pour répondre.",words:["Les","élèves","lèvent","la","main","pour","répondre."]},
    {fr:"Le coq chante tôt le matin.",words:["Le","coq","chante","tôt","le","matin."]},
    {fr:"Mon père répare la radio.",words:["Mon","père","répare","la","radio."]},
    {fr:"La lune éclaire le village la nuit.",words:["La","lune","éclaire","le","village","la","nuit."]},
    {fr:"Les enfants respectent leurs parents.",words:["Les","enfants","respectent","leurs","parents."]},
    {fr:"Nous aimons apprendre à lire.",words:["Nous","aimons","apprendre","à","lire."]},
    // CE1 — 30 phrases plus développées
    {fr:"Chaque élève doit respecter les règles de la classe.",words:["Chaque","élève","doit","respecter","les","règles","de","la","classe."]},
    {fr:"Après les cours, les enfants rentrent calmement à la maison.",words:["Après","les","cours,","les","enfants","rentrent","calmement","à","la","maison."]},
    {fr:"Le fleuve Congo est très important pour le pays.",words:["Le","fleuve","Congo","est","très","important","pour","le","pays."]},
    {fr:"Les cultivateurs travaillent dur pendant la saison des pluies.",words:["Les","cultivateurs","travaillent","dur","pendant","la","saison","des","pluies."]},
    {fr:"La maîtresse encourage toujours les élèves courageux.",words:["La","maîtresse","encourage","toujours","les","élèves","courageux."]},
    {fr:"Le marché est très animé le samedi matin.",words:["Le","marché","est","très","animé","le","samedi","matin."]},
    {fr:"Les enfants doivent se laver les mains avant de manger.",words:["Les","enfants","doivent","se","laver","les","mains","avant","de","manger."]},
    {fr:"Grâce à ses efforts, Jules obtient de bonnes notes.",words:["Grâce","à","ses","efforts,","Jules","obtient","de","bonnes","notes."]},
    {fr:"Les habitants du village accueillent chaleureusement les visiteurs.",words:["Les","habitants","du","village","accueillent","chaleureusement","les","visiteurs."]},
    {fr:"Pendant la récréation, les élèves jouent au football.",words:["Pendant","la","récréation,","les","élèves","jouent","au","football."]},
    {fr:"La bibliothèque de l'école contient plusieurs livres intéressants.",words:["La","bibliothèque","de","l'école","contient","plusieurs","livres","intéressants."]},
    {fr:"Le mécanicien répare la moto de mon oncle.",words:["Le","mécanicien","répare","la","moto","de","mon","oncle."]},
    {fr:"Les enfants apprennent à protéger la nature.",words:["Les","enfants","apprennent","à","protéger","la","nature."]},
    {fr:"La couturière confectionne de beaux vêtements colorés.",words:["La","couturière","confectionne","de","beaux","vêtements","colorés."]},
    {fr:"Le directeur félicite les meilleurs élèves de la classe.",words:["Le","directeur","félicite","les","meilleurs","élèves","de","la","classe."]},
    {fr:"Nous devons respecter les personnes âgées.",words:["Nous","devons","respecter","les","personnes","âgées."]},
    {fr:"Les pêcheurs quittent le village très tôt le matin.",words:["Les","pêcheurs","quittent","le","village","très","tôt","le","matin."]},
    {fr:"Le jardin de l'école produit des légumes frais.",words:["Le","jardin","de","l'école","produit","des","légumes","frais."]},
    {fr:"Les élèves chantent l'hymne national avec fierté.",words:["Les","élèves","chantent","l'hymne","national","avec","fierté."]},
    {fr:"La pluie abondante arrose les plantations.",words:["La","pluie","abondante","arrose","les","plantations."]},
    {fr:"Le professeur explique clairement la leçon de mathématiques.",words:["Le","professeur","explique","clairement","la","leçon","de","mathématiques."]},
    {fr:"Les enfants traversent le pont avec prudence.",words:["Les","enfants","traversent","le","pont","avec","prudence."]},
    {fr:"Mon frère rêve de devenir médecin plus tard.",words:["Mon","frère","rêve","de","devenir","médecin","plus","tard."]},
    {fr:"Les voyageurs attendent le train à la gare.",words:["Les","voyageurs","attendent","le","train","à","la","gare."]},
    {fr:"Le policier aide les enfants à traverser la rue.",words:["Le","policier","aide","les","enfants","à","traverser","la","rue."]},
    {fr:"Les élèves révisent leurs leçons avant l'examen.",words:["Les","élèves","révisent","leurs","leçons","avant","l'examen."]},
    {fr:"Le vendeur de pain ouvre sa boutique très tôt.",words:["Le","vendeur","de","pain","ouvre","sa","boutique","très","tôt."]},
    {fr:"La solidarité est importante dans notre communauté.",words:["La","solidarité","est","importante","dans","notre","communauté."]},
    {fr:"Les enfants aiment écouter les histoires de grand-père.",words:["Les","enfants","aiment","écouter","les","histoires","de","grand-père."]},
    {fr:"L'école aide les élèves à préparer leur avenir.",words:["L'école","aide","les","élèves","à","préparer","leur","avenir."]},
  ],
  synonymes: [
    { mot:"CONTENT", syn:"HEUREUX", autres:["TRISTE","FÂCHÉ","CALME"] },
    { mot:"RAPIDE", syn:"VITE",    autres:["LENT","GRAND","BEAU"] },
    { mot:"BEAU",   syn:"JOLI",    autres:["LAID","PETIT","FORT"] },
    { mot:"GRAND",  syn:"ÉNORME",  autres:["PETIT","MINCE","LÉGER"] },
  ],
  antonymes: [
    { mot:"GRAND",  ant:"PETIT",  autres:["LOURD","FORT","BEAU"] },
    { mot:"CHAUD",  ant:"FROID",  autres:["BEAU","GRAND","VITE"] },
    { mot:"JOUR",   ant:"NUIT",   autres:["MATIN","SOIR","HEURE"] },
    { mot:"VITE",   ant:"LENT",   autres:["FORT","DOUX","FAUX"] },
  ],
  articles: [
    { phrase:"___ chat mange.", mot:"chat", correct:"Le",  autres:["La","Les","Un"] },
    { phrase:"___ fleur est belle.", mot:"fleur", correct:"La", autres:["Le","Les","Une"] },
    { phrase:"___ enfants jouent.", mot:"enfants", correct:"Les", autres:["Le","La","Des"] },
    { phrase:"___ livre est ouvert.", mot:"livre", correct:"Un", autres:["Une","Le","Les"] },
    { phrase:"___ maison est grande.", mot:"maison", correct:"La", autres:["Le","Les","Une"] },
  ],
  nouns: [
    { phrase:"Le CHAT dort.", mot:"CHAT", isNoun:true },
    { phrase:"Marie MANGE une pomme.", mot:"MANGE", isNoun:false },
    { phrase:"L'OISEAU chante.", mot:"OISEAU", isNoun:true },
    { phrase:"Nous JOUONS au parc.", mot:"JOUONS", isNoun:false },
    { phrase:"La FLEUR est rouge.", mot:"FLEUR", isNoun:true },
    { phrase:"Il COURT vite.", mot:"COURT", isNoun:false },
  ],
  completions: [
    { template:"PO_ME",   answer:"POMME",   hint:"Un fruit rond et rouge" },
    { template:"_COLE",   answer:"ÉCOLE",   hint:"Où on apprend" },
    { template:"MA_SON",  answer:"MAISON",  hint:"Où on habite" },
    { template:"CH_T",    answer:"CHAT",    hint:"Animal qui miaule" },
    { template:"L_VRE",   answer:"LIVRE",   hint:"On le lit" },
    { template:"SOL_IL",  answer:"SOLEIL",  hint:"Astre du jour" },
    { template:"VÉ_O",    answer:"VÉLO",    hint:"On pédale" },
  ],
  corrections: [
    { wrong:"Le chat dort dans sa nid.", correct:"Le chat dort dans son nid.", error:"'son' pas 'sa'" },
    { wrong:"Elle mange les pomme.", correct:"Elle mange les pommes.", error:"'pommes' au pluriel" },
    { wrong:"Je suis allé à l'école hier.", correct:"Je suis allé à l'école hier.", error:"Correct !" },
    { wrong:"Les enfant jouent dehors.", correct:"Les enfants jouent dehors.", error:"'enfants' au pluriel" },
    { wrong:"Il ont mangé.", correct:"Ils ont mangé.", error:"'Ils' pas 'Il'" },
  ],
  rightWord: [
    { sentence:"Le chat ___ sur le tapis.", choices:["dort","dors","dort"], answer:"dort" },
    { sentence:"Maman ___ les fleurs.", choices:["arrose","arroses","arrosez"], answer:"arrose" },
    { sentence:"Nous ___ à l'école.", choices:["allons","allez","aller"], answer:"allons" },
    { sentence:"Il ___ très vite.", choices:["coure","court","cours"], answer:"court" },
  ],
  truefalse: [
    { q:"'CHAT' s'écrit C-H-A-T", answer:"vrai" },
    { q:"'MAISON' commence par la lettre M", answer:"vrai" },
    { q:"'POMME' a 4 lettres", answer:"faux" },
    { q:"'ÉCOLE' commence par un E", answer:"vrai" },
    { q:"'SOLEIL' se termine par un R", answer:"faux" },
    { q:"'LIVRE' contient la lettre X", answer:"faux" },
  ],
};

/* ============================================================
   AFRICAN PEDAGOGY - EXERCICES SIMPLES CONTEXTUALISÉS AFRICAINS
   ============================================================ */
const AFRICAN_MATH_DATA = {
  addition_simple: [
    { q:"2 + 1 = ?", ans:"3", lvl:"CP1" },
    { q:"3 + 2 = ?", ans:"5", lvl:"CP1" },
    { q:"1 + 1 = ?", ans:"2", lvl:"CP1" },
    { q:"4 + 1 = ?", ans:"5", lvl:"CP1" },
    { q:"2 + 2 = ?", ans:"4", lvl:"CP1" },
    { q:"3 + 3 = ?", ans:"6", lvl:"CP1" },
    { q:"5 + 2 = ?", ans:"7", lvl:"CP2" },
    { q:"6 + 3 = ?", ans:"9", lvl:"CP2" },
    { q:"7 + 2 = ?", ans:"9", lvl:"CP2" },
    { q:"8 + 1 = ?", ans:"9", lvl:"CP2" },
    { q:"5 + 5 = ?", ans:"10", lvl:"CP2" },
    { q:"7 + 3 = ?", ans:"10", lvl:"CP2" },
  ],
  subtraction_simple: [
    { q:"2 - 1 = ?", ans:"1", lvl:"CP1" },
    { q:"3 - 1 = ?", ans:"2", lvl:"CP1" },
    { q:"3 - 2 = ?", ans:"1", lvl:"CP1" },
    { q:"4 - 1 = ?", ans:"3", lvl:"CP1" },
    { q:"5 - 2 = ?", ans:"3", lvl:"CP2" },
    { q:"6 - 3 = ?", ans:"3", lvl:"CP2" },
    { q:"7 - 2 = ?", ans:"5", lvl:"CP2" },
    { q:"8 - 3 = ?", ans:"5", lvl:"CP2" },
    { q:"10 - 5 = ?", ans:"5", lvl:"CP2" },
  ],
  doubles: [
    { q:"Double de 1", ans:"2", lvl:"CP1" },
    { q:"Double de 2", ans:"4", lvl:"CP1" },
    { q:"Double de 3", ans:"6", lvl:"CP1" },
    { q:"Double de 4", ans:"8", lvl:"CP2" },
    { q:"Double de 5", ans:"10", lvl:"CP2" },
  ],
  halves: [
    { q:"Moitié de 2", ans:"1", lvl:"CP1" },
    { q:"Moitié de 4", ans:"2", lvl:"CP1" },
    { q:"Moitié de 6", ans:"3", lvl:"CP2" },
    { q:"Moitié de 8", ans:"4", lvl:"CP2" },
    { q:"Moitié de 10", ans:"5", lvl:"CP2" },
  ],
  sequences: [
    { q:"1 - 2 - 3 - ?", ans:"4", lvl:"CP1" },
    { q:"2 - 4 - 6 - ?", ans:"8", lvl:"CP1" },
    { q:"1 - 3 - 5 - ?", ans:"7", lvl:"CP1" },
    { q:"5 - 6 - 7 - ?", ans:"8", lvl:"CP2" },
    { q:"10 - 9 - 8 - ?", ans:"7", lvl:"CP2" },
  ],
};

const AFRICAN_PROBLEMS_DATA = {
  cp1: [
    { q:"Maman achète 2 mangues puis 1 mangue. Combien a-t-elle ?", ans:"3", ctx:"marché" },
    { q:"Papa a 3 poissons. Il en vend 1. Combien lui reste-t-il ?", ans:"2", ctx:"pêche" },
    { q:"Il y a 2 poules et 1 poule arrive. Combien de poules en tout ?", ans:"3", ctx:"basse-cour" },
    { q:"Grand-mère cueille 4 mangues. Elle en donne 2. Combien lui reste-t-il ?", ans:"2", ctx:"jardin" },
    { q:"Toto a 3 billes. Ali lui en donne 2. Combien a Toto maintenant ?", ans:"5", ctx:"jeu" },
  ],
  cp2: [
    { q:"Maman prépare 5 portions de foufou. Elle en donne 2. Combien lui reste-t-il ?", ans:"3", ctx:"repas" },
    { q:"Au marché, il y a 6 melons. On en vend 4. Combien en reste-t-il ?", ans:"2", ctx:"marché" },
    { q:"Papa pêche 7 poissons et son frère en pêche 2. Combien au total ?", ans:"9", ctx:"fleuve" },
    { q:"L'école a 8 cahiers. Elle en distribue 3. Combien en reste-t-il ?", ans:"5", ctx:"école" },
    { q:"Grand-mère a 10 œufs. Elle en casse 2. Combien lui reste-t-il ?", ans:"8", ctx:"maison" },
  ],
  ce1: [
    { q:"Au champ, Papa cultive 12 rangées de manioc. Il en récolte 5. Combien lui en reste ?", ans:"7", ctx:"agriculture" },
    { q:"Le marché reçoit 15 paniers de mangues. On en vend 9. Combien en reste-t-il ?", ans:"6", ctx:"marché" },
    { q:"L'école a 20 élèves. 8 sont absents. Combien sont présents ?", ans:"12", ctx:"école" },
    { q:"Maman a 18 tomates. Elle prépare 10 portions. Combien lui en reste ?", ans:"8", ctx:"cuisine" },
    { q:"Papa achète 25 litres d'huile. Il en utilise 12. Combien lui reste ?", ans:"13", ctx:"commerce" },
  ],
};

const AFRICAN_DICTATIONS_DATA = {
  cp1: [
    "Papa va au marché.",
    "Maman prépare le repas.",
    "Le chat dort.",
    "La poule pond des œufs.",
    "Toto joue avec un ballon.",
    "Le bébé pleure.",
    "Il fait chaud aujourd'hui.",
    "La lune brille la nuit.",
    "L'enfant lave ses mains.",
    "Le chien court.",
  ],
  cp2: [
    "Chaque matin, Paul va à l'école.",
    "La maîtresse corrige les exercices.",
    "Les enfants plantent des fleurs.",
    "Le pêcheur répare son filet.",
    "Mon frère aime lire des histoires.",
    "La pluie tombe fort.",
    "Les élèves chantent en classe.",
    "Le marchand vend des oranges.",
    "Grand-mère prépare du foufou.",
    "Le chauffeur conduit le bus.",
  ],
  ce1: [
    "Chaque élève doit respecter les règles de l'école.",
    "Après les cours, les enfants rentrent à la maison.",
    "Le fleuve Congo est important pour le pays.",
    "Les cultivateurs travaillent dur pendant la saison des pluies.",
    "La maîtresse encourage toujours les élèves courageux.",
    "Le marché est très animé le samedi matin.",
    "Les enfants doivent se laver les mains avant de manger.",
    "Les habitants du village accueillent chaleureusement les visiteurs.",
    "Pendant la récréation, les élèves jouent au football.",
    "La bibliothèque de l'école contient plusieurs livres intéressants.",
  ],
};

const AFRICAN_GRAMMAR_DATA = {
  word_order: [
    { wrong:"école à va Paul", correct:"Paul va à l'école", lvl:"CP1" },
    { wrong:"chat le dort", correct:"Le chat dort", lvl:"CP1" },
    { wrong:"mangues achète maman", correct:"Maman achète des mangues", lvl:"CP2" },
    { wrong:"école à vont enfants les", correct:"Les enfants vont à l'école", lvl:"CP2" },
    { wrong:"foufou prépare grand-mère du", correct:"Grand-mère prépare du foufou", lvl:"CE1" },
  ],
  complete_sentence: [
    { phrase:"___ chat dort.", correct:"Le", options:["Le","La","Les"] },
    { phrase:"Maman ___ des mangues.", correct:"achète", options:["achète","achètes","achetez"] },
    { phrase:"Les ___ jouent à l'école.", correct:"enfants", options:["enfants","enfant","enfantsz"] },
    { phrase:"Papa ___ au marché.", correct:"va", options:["va","vais","allez"] },
    { phrase:"Grand-mère ___ du foufou.", correct:"prépare", options:["prépare","prépares","préparé"] },
  ],
  noun_or_verb: [
    { word:"CHAT", type:"noun", sent:"Le CHAT dort." },
    { word:"DORT", type:"verb", sent:"Le chat DORT." },
    { word:"ÉCOLE", type:"noun", sent:"Je vais à l'ÉCOLE." },
    { word:"JOUE", type:"verb", sent:"L'enfant JOUE." },
    { word:"MAMAN", type:"noun", sent:"MAMAN prépare le repas." },
  ],
  singular_plural: [
    { sing:"un enfant", plur:"des enfants" },
    { sing:"une mangue", plur:"des mangues" },
    { sing:"le chat", plur:"les chats" },
    { sing:"une poule", plur:"des poules" },
    { sing:"le poisson", plur:"les poissons" },
  ],
};

const AFRICAN_COPYING_DATA = {
  cp1: [
    "Papa",
    "Maman",
    "chat",
    "poule",
    "école",
    "marché",
  ],
  cp2: [
    "Papa va au marché.",
    "Maman prépare le repas.",
    "Le chat dort.",
    "L'école est belle.",
    "Grand-mère est gentille.",
  ],
  ce1: [
    "Les enfants vont à l'école chaque matin.",
    "Papa travaille au marché.",
    "Maman prépare une bonne sauce.",
    "Grand-mère raconte des histoires.",
    "Le fleuve coule près du village.",
  ],
};

/* ============================================================
   EXTENDED AFRICAN EXERCISE BANK - HUNDREDS OF EXERCISES
   ============================================================ */
const EXTENDED_AFRICAN_EXERCISES = {
  problems_extended: [
    // CP1 Additional problems
    { q:"Maman a 1 mangue. Papa lui donne 1 mangue. Combien en a-t-elle ?", ans:2, lvl:"CP1" },
    { q:"Il y a 2 chats. Un autre chat arrive. Combien en total ?", ans:3, lvl:"CP1" },
    { q:"Toto a 2 billes. Ali lui en donne 2. Combien a Toto ?", ans:4, lvl:"CP1" },
    { q:"Grand-mère cueille 1 mangue puis 3 mangues. Combien total ?", ans:4, lvl:"CP1" },
    { q:"Le marché vend 5 oranges. On en achète 1. Combien reste-t-il ?", ans:4, lvl:"CP1" },
    { q:"Papa pêche 3 poissons puis 2 poissons. Combien au total ?", ans:5, lvl:"CP1" },
    { q:"L'école a 4 cahiers. Elle en utilise 2. Combien lui en reste ?", ans:2, lvl:"CP1" },
    { q:"Mimi a 5 perles. Elle en perd 1. Combien lui en reste ?", ans:4, lvl:"CP1" },
    // CP2 Additional problems
    { q:"Au marché, il y a 6 tomates. On en vend 2. Combien en reste ?", ans:4, lvl:"CP2" },
    { q:"Papa a 7 poissons. Il en donne 3 à maman. Combien lui reste ?", ans:4, lvl:"CP2" },
    { q:"Grand-mère prépare 8 portions. Elle en donne 5. Combien lui reste ?", ans:3, lvl:"CP2" },
    { q:"L'école reçoit 9 livres. Elle en distribue 4. Combien en reste ?", ans:5, lvl:"CP2" },
    { q:"Maman achète 10 œufs. Elle en casse 2. Combien lui en reste ?", ans:8, lvl:"CP2" },
    { q:"Papa cultive 12 rangées. Il en récolte 5. Combien en reste ?", ans:7, lvl:"CP2" },
    // CE1 Additional problems
    { q:"L'école a 15 élèves le matin. 3 arrivent en retard. Combien en tout ?", ans:18, lvl:"CE1" },
    { q:"Maman vend 20 mangues. Elle en vend 12. Combien lui en reste ?", ans:8, lvl:"CE1" },
    { q:"Le fleuve a 25 poissons. On en pêche 15. Combien en reste ?", ans:10, lvl:"CE1" },
    { q:"Papa achète 30 litres d'eau. Il en utilise 18. Combien lui reste ?", ans:12, lvl:"CE1" },
  ],
  dictations_extended: [
    // CP1 Extended dictations
    "Bonjour maman.",
    "Bonsoir papa.",
    "Le soleil brille.",
    "Il pleut fort.",
    "Je suis heureux.",
    "Toto court vite.",
    "Ali joue bien.",
    "Marie chante joli.",
    "L'école est grande.",
    "La maison est belle.",
    // CP2 Extended dictations
    "Les enfants jouent ensemble.",
    "Le maitre écrit les leçons.",
    "Les filles dansent joli.",
    "Papa pêche au fleuve.",
    "Maman cuisine bien.",
    "Grand-mère raconte une histoire.",
    "L'arbre est très grand.",
    "Le village est tranquille.",
    "Les oiseaux chantent tôt.",
    "Le marché est animé.",
    // CE1 Extended dictations
    "Les enfants travaillent sérieusement à l'école.",
    "Papa et maman se lèvent tôt le matin.",
    "Grand-mère vend ses fruits au marché.",
    "Les élèves écoutent attentivement le maître.",
    "Le village se remplit de couleurs au coucher du soleil.",
  ],
  mental_math_extended: [
    // Doubles
    { q:"Double de 6", ans:"12", lvl:"CP2" },
    { q:"Double de 7", ans:"14", lvl:"CP2" },
    { q:"Double de 8", ans:"16", lvl:"CP2" },
    { q:"Double de 9", ans:"18", lvl:"CP2" },
    { q:"Double de 10", ans:"20", lvl:"CP2" },
    // Halves
    { q:"Moitié de 12", ans:"6", lvl:"CP2" },
    { q:"Moitié de 14", ans:"7", lvl:"CP2" },
    { q:"Moitié de 16", ans:"8", lvl:"CP2" },
    { q:"Moitié de 18", ans:"9", lvl:"CP2" },
    { q:"Moitié de 20", ans:"10", lvl:"CP2" },
    // Additions CP2
    { q:"6 + 4 = ?", ans:"10", lvl:"CP2" },
    { q:"7 + 3 = ?", ans:"10", lvl:"CP2" },
    { q:"8 + 2 = ?", ans:"10", lvl:"CP2" },
    { q:"9 + 1 = ?", ans:"10", lvl:"CP2" },
    { q:"5 + 4 = ?", ans:"9", lvl:"CP2" },
    // Subtractions CP2
    { q:"10 - 4 = ?", ans:"6", lvl:"CP2" },
    { q:"10 - 3 = ?", ans:"7", lvl:"CP2" },
    { q:"10 - 2 = ?", ans:"8", lvl:"CP2" },
    { q:"10 - 1 = ?", ans:"9", lvl:"CP2" },
    { q:"9 - 4 = ?", ans:"5", lvl:"CP2" },
    // CE1 Sequences
    { q:"2 - 4 - 6 - 8 - ?", ans:"10", lvl:"CE1" },
    { q:"3 - 6 - 9 - 12 - ?", ans:"15", lvl:"CE1" },
    { q:"5 - 10 - 15 - 20 - ?", ans:"25", lvl:"CE1" },
    { q:"20 - 18 - 16 - 14 - ?", ans:"12", lvl:"CE1" },
  ],
  copying_extended: [
    { text:"maman", lvl:"CP1" },
    { text:"papa", lvl:"CP1" },
    { text:"ami", lvl:"CP1" },
    { text:"jour", lvl:"CP1" },
    { text:"nuit", lvl:"CP1" },
    { text:"soleil", lvl:"CP1" },
    { text:"eau", lvl:"CP1" },
    { text:"feu", lvl:"CP1" },
    { text:"pain", lvl:"CP1" },
    { text:"riz", lvl:"CP1" },
    { text:"Maman cuisine bien.", lvl:"CP2" },
    { text:"Papa travaille dur.", lvl:"CP2" },
    { text:"Les enfants jouent.", lvl:"CP2" },
    { text:"Le chat est noir.", lvl:"CP2" },
    { text:"La poule pond.", lvl:"CP2" },
    { text:"Grand-mère est sage.", lvl:"CP2" },
    { text:"L'école est fermée dimanche.", lvl:"CE1" },
    { text:"Papa et maman s'aiment beaucoup.", lvl:"CE1" },
    { text:"Les enfants travaillent fort à l'école.", lvl:"CE1" },
    { text:"Grand-mère raconte des contes traditionnels.", lvl:"CE1" },
  ],
};

function pickRandom(arr) { return arr[R(0, arr.length-1)]; }

function genFr(type) {
  switch(type) {
    case 'lettersort': {
      const mot = pickRandom(FR_DATA.mots);
      const mixed = mot.split('').sort(()=>Math.random()-.5).join(' - ');
      return { typeLabel:'Lettres mélangées', inputType:'text',
        question:`Remets les lettres en ordre :\n${mixed}`, answer:mot, xp:12 };
    }
    case 'wordsort': {
      const p = pickRandom(FR_DATA.phrases);
      const shuffled = [...p.words].sort(()=>Math.random()-.5);
      return { typeLabel:'Remets la phrase en ordre', inputType:'wordsort',
        question:'Clique sur les mots pour reformer la phrase :',
        words: shuffled, answer: p.fr, xp:16 };
    }
    case 'complete': {
      const c = pickRandom(FR_DATA.completions);
      return { typeLabel:'Mot à compléter', inputType:'text',
        question:`Quel est ce mot ?\n${c.template}\nIndice : ${c.hint}`,
        answer: c.answer, xp:12 };
    }
    case 'correct': {
      const c = pickRandom(FR_DATA.corrections);
      const choices = [c.correct, c.wrong, c.wrong.replace('.','!'), c.correct.toUpperCase().slice(0,20)+'…'];
      const shuffled = choices.slice(0,4).sort(()=>Math.random()-.5);
      return { typeLabel:'Corrige la faute', inputType:'choices',
        question: c.wrong,
        choices: shuffled,
        answer: c.correct,
        hint: `Correction : ${c.error}`,
        xp:14 };
    }
    case 'synonym': {
      const s = pickRandom(FR_DATA.synonymes);
      const opts = [s.syn, ...s.autres].sort(()=>Math.random()-.5);
      return { typeLabel:'Synonyme', inputType:'choices',
        question:`Quel mot a le même sens que :\n${s.mot}`,
        choices: opts, answer: s.syn, xp:12 };
    }
    case 'antonym': {
      const a = pickRandom(FR_DATA.antonymes);
      const opts = [a.ant, ...a.autres].sort(()=>Math.random()-.5);
      return { typeLabel:'Antonyme', inputType:'choices',
        question:`Quel mot est le contraire de :\n${a.mot}`,
        choices: opts, answer: a.ant, xp:12 };
    }
    case 'article': {
      const a = pickRandom(FR_DATA.articles);
      const opts = [a.correct, ...a.autres].sort(()=>Math.random()-.5);
      return { typeLabel:'Bon article', inputType:'choices',
        question: a.phrase,
        choices: opts, answer: a.correct, xp:10 };
    }
    case 'noun-verb': {
      const nv = pickRandom(FR_DATA.nouns);
      return { typeLabel:'Nom ou Verbe ?', inputType:'truefalse',
        question: nv.phrase + `\nLe mot "${nv.mot}" est-il un NOM ?`,
        answer: nv.isNoun ? 'vrai' : 'faux',
        xp:10 };
    }
    case 'right-word': {
      const rw = pickRandom(FR_DATA.rightWord);
      const choices = [...rw.choices].sort(()=>Math.random()-.5);
      return { typeLabel:'Bon mot', inputType:'choices',
        question: rw.sentence,
        choices, answer: rw.answer, xp:12 };
    }
    case 'fr-truefalse': {
      const tf = pickRandom(FR_DATA.truefalse);
      return { typeLabel:'Vrai ou Faux', inputType:'truefalse',
        question: tf.q, answer: tf.answer, xp:8 };
    }
    case 'dictation': {
      const lvls = ['cp1', 'cp2', 'ce1'];
      const lvl = lvls[Math.floor(S.globalLevel / 3)];
      let allDictations = [...AFRICAN_DICTATIONS_DATA[lvl]];
      // Ajouter les données étendues
      const extended = EXTENDED_AFRICAN_EXERCISES.dictations_extended.filter((_, i) => {
        if (lvl === 'cp1') return i < 10;
        if (lvl === 'cp2') return i >= 10 && i < 20;
        return i >= 20;
      });
      allDictations = [...allDictations, ...extended];
      const sent = pickRandom(allDictations);
      return { typeLabel:'Dictée africaine', inputType:'text',
        question:`Écris ce que tu entends :\n\n"${sent}"`,
        answer: sent.toLowerCase(), xp:15 };
    }
    case 'copying': {
      const lvls = ['cp1', 'cp2', 'ce1'];
      const lvl = lvls[Math.floor(S.globalLevel / 3)];
      let allCopying = [...AFRICAN_COPYING_DATA[lvl]];
      // Ajouter les données étendues
      const extended = EXTENDED_AFRICAN_EXERCISES.copying_extended.filter(c => c.lvl === lvl);
      allCopying = [...allCopying, ...extended.map(c => c.text)];
      const text = pickRandom(allCopying);
      return { typeLabel:'Recopie', inputType:'text',
        question:`Recopie exactement :\n\n"${text}"`,
        answer: text, xp:12 };
    }
    case 'order-word': {
      const wo = pickRandom(AFRICAN_GRAMMAR_DATA.word_order);
      return { typeLabel:'Remise en ordre', inputType:'text',
        question:`Remets les mots dans le bon ordre :\n\n${wo.wrong}`,
        answer: wo.correct.toLowerCase(), xp:14 };
    }
    default: return genFr('lettersort');
  }
}

/* ============================================================
   9. RENDER EXERCISE
   ============================================================ */
function renderExercise(ex) {
  document.getElementById('ex-type-label').textContent = ex.typeLabel || '';
  const qEl = document.getElementById('ex-question');
  qEl.textContent = ex.question;
  qEl.className = 'ex-question' + (ex.question.length > 40 ? ' small' : '');

  const zone = document.getElementById('ex-input-zone');
  zone.innerHTML = '';

  if (ex.inputType === 'text') {
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'answer-input';
    inp.placeholder = 'Ta réponse…'; inp.autocomplete = 'off';
    inp.setAttribute('autocorrect','off'); inp.setAttribute('spellcheck','false');
    inp.addEventListener('keydown', e => { if(e.key==='Enter') checkAnswer(); });
    zone.appendChild(inp);
    setTimeout(() => inp.focus(), 100);

  } else if (ex.inputType === 'choices') {
    const grid = document.createElement('div');
    grid.className = 'choices-grid';
    ex.choices.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = ch;
      btn.onclick = () => {
        if (btn.disabled) return;
        selectChoice(btn, ch, ex);
      };
      grid.appendChild(btn);
    });
    zone.appendChild(grid);
    document.getElementById('btn-check').classList.add('hidden');

  } else if (ex.inputType === 'truefalse') {
    const g = document.createElement('div');
    g.className = 'tf-grid';
    ['vrai','faux'].forEach(v => {
      const btn = document.createElement('button');
      btn.className = `tf-btn ${v}`;
      btn.innerHTML = v === 'vrai' ? '✅ VRAI' : '❌ FAUX';
      btn.onclick = () => {
        if(btn.disabled) return;
        selectTF(v, ex);
      };
      g.appendChild(btn);
    });
    zone.appendChild(g);
    document.getElementById('btn-check').classList.add('hidden');

  } else if (ex.inputType === 'wordsort') {
    renderWordSort(ex, zone);
    document.getElementById('btn-check').classList.remove('hidden');
  }
}

function renderWordSort(ex, zone) {
  const bank = document.createElement('div');
  bank.className = 'word-bank'; bank.id = 'word-bank';
  const sent = document.createElement('div');
  sent.className = 'answer-sentence'; sent.id = 'answer-sentence';
  sent.style.minHeight = '48px';

  ex._placed = [];
  ex._tokens = [...ex.words];

  ex.words.forEach((w, i) => {
    const tok = document.createElement('div');
    tok.className = 'word-token';
    tok.textContent = w;
    tok.dataset.idx = i;
    tok.onclick = () => {
      if (tok.classList.contains('used')) return;
      tok.classList.add('used');
      ex._placed.push(w);
      const placed = document.createElement('div');
      placed.className = 'placed-token';
      placed.textContent = w;
      placed.onclick = () => {
        // undo
        tok.classList.remove('used');
        ex._placed.splice(ex._placed.indexOf(w), 1);
        placed.remove();
      };
      sent.appendChild(placed);
    };
    bank.appendChild(tok);
  });

  zone.appendChild(sent);
  zone.appendChild(bank);
}

/* ============================================================
   10. CHECK ANSWER
   ============================================================ */
function selectChoice(btn, choice, ex) {
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  clearTimer();
  const correct = choice.trim().toUpperCase() === ex.answer.trim().toUpperCase();
  if (correct) {
    btn.classList.add('selected-correct');
  } else {
    btn.classList.add('selected-wrong');
    // reveal correct
    document.querySelectorAll('.choice-btn').forEach(b => {
      if (b.textContent.trim().toUpperCase() === ex.answer.trim().toUpperCase())
        b.classList.add('reveal-correct');
    });
  }
  processResult(correct, ex);
}

function selectTF(choice, ex) {
  document.querySelectorAll('.tf-btn').forEach(b => b.disabled = true);
  clearTimer();
  const correct = choice === ex.answer;
  processResult(correct, ex);
}

function checkAnswer() {
  if (!currentExercise) return;
  const ex = currentExercise;
  clearTimer();

  if (ex.inputType === 'text') {
    const inp = document.querySelector('.answer-input');
    const val = inp ? inp.value.trim().toUpperCase() : '';
    const correct = val === ex.answer.toUpperCase();
    if(inp) {
      inp.disabled = true;
      inp.classList.add(correct ? 'correct' : 'wrong');
      if (!correct) inp.value = ex.answer; // show correct
    }
    processResult(correct, ex);

  } else if (ex.inputType === 'wordsort') {
    const placed = ex._placed || [];
    const userSentence = placed.join(' ');
    const correct = userSentence.trim().toUpperCase() === ex.answer.trim().toUpperCase();
    processResult(correct, ex);
  }
}

function processResult(correct, ex) {
  const fb = document.getElementById('feedback');
  document.getElementById('btn-check').classList.add('hidden');
  const btnNext = document.getElementById('btn-next');
  btnNext.style.display = 'block';
  btnNext.classList.remove('animate');
  setTimeout(() => btnNext.classList.add('animate'), 10);

  // Update stats
  const sub = session.subject;
  S.subjectStats[sub].played++;
  session.currentQ;

  if (correct) {
    S.score += ex.xp || 10;
    S.streak++;
    session.correct++;
    session.perfectRun = (session.perfectRun||0)+1;
    if (S.streak > S.maxStreak) S.maxStreak = S.streak;
    if (S.streak > session.maxStreak) session.maxStreak = S.streak;
    S.subjectStats[sub].correct++;

    const xpBonus = Math.floor((ex.xp||10) * (1 + (S.streak>2 ? 0.2*(S.streak-2) : 0)));
    session.xpEarned += xpBonus;
    addXP(xpBonus);

    fb.textContent = S.streak > 2
      ? `🔥 Bravo ! +${xpBonus} XP · Série de ${S.streak} !`
      : `✅ Correct ! +${xpBonus} XP`;
    fb.className = 'feedback correct show';
    playSuccess();

    const newBadges = checkBadges();
    if (newBadges.length) showMiniToast(newBadges.map(id => ALL_BADGES.find(b=>b.id===id)?.icon).join('') + ' Nouveau badge !');

  } else {
    S.streak = 0;
    session.perfectRun = 0;
    session.wrong++;

    if (session.lives !== Infinity) {
      session.lives--;
      renderLives();
      if (session.lives <= 0) {
        fb.innerHTML = `❌ Oops ! Réponse : ${ex.answer} — Plus de vies !`;
        fb.className = 'feedback wrong show';
        saveState();
        setTimeout(endSession, 1800);
        return;
      }
    }

    fb.innerHTML = `❌ La bonne réponse était : ${ex.answer}`;
    if (ex.hint) fb.textContent += ` (${ex.hint})`;
    fb.className = 'feedback wrong show';
    playError();
    document.querySelector('.ex-card')?.classList.add('shake');
    setTimeout(()=>document.querySelector('.ex-card')?.classList.remove('shake'),500);
  }

  updatePlayerBar();
  saveState();
  updateComboBanner();
}

function nextExercise() {
  // Check if done
  if (session.currentQ >= session.totalQ || (session.lives !== Infinity && session.lives <= 0)) {
    endSession();
  } else {
    generateExercise();
  }
}

/* ============================================================
   11. TIMER
   ============================================================ */
function startTimer(seconds) {
  timerLeft = seconds;
  const el = document.getElementById('timer-circle');
  el.textContent = seconds;
  el.className = 'timer-circle';
  timerInterval = setInterval(() => {
    timerLeft--;
    el.textContent = timerLeft;
    if (timerLeft <= 3) el.className = 'timer-circle urgent';
    if (timerLeft <= 0) {
      clearTimer();
      el.textContent = '⏰';
      processResult(false, currentExercise || {answer:'?',xp:0});
    }
  }, 1000);
}

function clearTimer() {
  clearInterval(timerInterval);
  const el = document.getElementById('timer-circle');
  if (el) { el.textContent = '–'; el.className = 'timer-circle'; }
}

/* ============================================================
   12. LIVES
   ============================================================ */
function renderLives() {
  const wrap = document.getElementById('lives-display');
  if (session.lives === Infinity || session.startLives === undefined) { wrap.innerHTML=''; return; }
  let html = '';
  for (let i=0; i<session.startLives; i++) {
    html += `<span>${i < session.lives ? '❤️' : '🖤'}</span>`;
  }
  wrap.innerHTML = html;
}

/* ============================================================
   13. COMBO BANNER
   ============================================================ */
function updateComboBanner() {
  const banner = document.getElementById('combo-banner');
  if (S.streak >= 3) {
    document.getElementById('combo-count').textContent = S.streak;
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}

/* ============================================================
   14. RESET EXERCISE UI
   ============================================================ */
function resetExUI() {
  document.getElementById('feedback').className = 'feedback';
  document.getElementById('btn-check').classList.remove('hidden');
  const btnNext = document.getElementById('btn-next');
  btnNext.style.display = 'none';
  btnNext.classList.remove('animate');
  document.getElementById('combo-banner').classList.remove('show');
  document.getElementById('lives-display').innerHTML = '';
}

/* ============================================================
   15. END SESSION
   ============================================================ */
function endSession() {
  clearTimer();
  const sub = session.subject;
  const correct = session.correct;
  const total = session.correct + session.wrong;
  const xp = session.xpEarned;
  const pct = total > 0 ? Math.round((correct/total)*100) : 0;

  document.getElementById('res-correct').textContent = correct + '/' + total;
  document.getElementById('res-xp').textContent      = '+' + xp;
  document.getElementById('res-streak').textContent  = session.maxStreak;

  let emoji = '😊', title = 'Bien joué !', sub2 = '';
  if (pct === 100) { emoji='🌟'; title='Parfait !'; sub2='100% de bonnes réponses !'; launchConfetti(); }
  else if (pct >= 80) { emoji='🎉'; title='Excellent !'; sub2=`${pct}% de réussite`; }
  else if (pct >= 60) { emoji='😊'; title='Bien joué !'; sub2=`${pct}% de réussite`; }
  else { emoji='💪'; title='Continue !'; sub2=`${pct}% – tu peux faire mieux !`; }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-sub').textContent   = sub2 || `${pct}% de réussite`;

  const newBadges = checkBadges();
  const badgesRow = document.getElementById('new-badges');
  badgesRow.innerHTML = '';
  newBadges.forEach(id => {
    const b = ALL_BADGES.find(x=>x.id===id);
    if (!b) return;
    const el = document.createElement('div');
    el.className = 'badge'; el.innerHTML = `${b.icon} ${b.label}`;
    badgesRow.appendChild(el);
  });

  if (pct >= 80) playSuccess();
  showScreen('screen-result');

  // Store for replay
  session._replaySubject = session.subject;
  session._replayType    = session.exerciseType;
  session._replayOpts    = { timed:session.timed, timedSeconds:session.timedSeconds,
                              lives:session.startLives, totalQ:session.totalQ };
}

function replaySession() {
  startSession(session._replaySubject, session._replayType, session._replayOpts || {});
}

/* ============================================================
   16. PARENT PANEL
   ============================================================ */
function fillParentPanel() {
  document.getElementById('ps-score').textContent  = S.score;
  document.getElementById('ps-xp').textContent     = S.xp;
  document.getElementById('ps-level').textContent  = S.globalLevel;
  document.getElementById('ps-streak').textContent = S.maxStreak;
  document.getElementById('ps-played').textContent =
    (S.subjectStats.math.played||0) + (S.subjectStats.fr.played||0);

  // Subject performance
  const sp = document.getElementById('subject-perf');
  sp.innerHTML = '';
  ['math','fr'].forEach(sub => {
    const st = S.subjectStats[sub];
    const pct = st.played > 0 ? Math.round((st.correct/st.played)*100) : 0;
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <span>${sub==='math'?'🧮 Maths':'📚 Français'}</span>
      <div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${pct}%"></div></div>
      <strong>${pct}%</strong>
    `;
    sp.appendChild(row);
  });

  // Badges
  const pb = document.getElementById('ps-badges');
  pb.innerHTML = '';
  if (S.badges.length === 0) {
    pb.innerHTML = '<span style="color:var(--muted);font-size:.85rem">Pas encore de badges.</span>';
  } else {
    S.badges.forEach(id => {
      const b = ALL_BADGES.find(x=>x.id===id);
      if (!b) return;
      const el = document.createElement('div');
      el.className = 'badge'; el.innerHTML = `${b.icon} ${b.label}`;
      pb.appendChild(el);
    });
  }

  // Weak points
  const wp = document.getElementById('weak-points');
  wp.innerHTML = '';
  ['math','fr'].forEach(sub => {
    const st = S.subjectStats[sub];
    const pct = st.played>0 ? Math.round((st.correct/st.played)*100) : 100;
    if (pct < 60 && st.played > 2) {
      const el = document.createElement('div');
      el.className = 'stat-row';
      el.innerHTML = `<span>⚠️ ${sub==='math'?'Maths':'Français'} — seulement ${pct}% de réussite</span>`;
      wp.appendChild(el);
    }
  });
  if (!wp.innerHTML) wp.innerHTML = '<span style="color:var(--green);font-size:.9rem">✅ Aucun point faible détecté !</span>';
}

/* ============================================================
   17. BADGES SCREEN
   ============================================================ */
function showBadges() {
  const cont = document.getElementById('badges-display');
  cont.innerHTML = '';
  ALL_BADGES.forEach(b => {
    const earned = S.badges.includes(b.id);
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.style.opacity = earned ? '1' : '.4';
    card.innerHTML = `
      <div class="ex-icon">${earned ? b.icon : '🔒'}</div>
      <div class="ex-name">${b.label}</div>
      <div class="ex-badge">${b.desc}</div>
    `;
    cont.appendChild(card);
  });
  showScreen('screen-badges');
}

/* ============================================================
   18. AUDIO
   ============================================================ */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, dur, type='sine', vol=0.18) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime+dur);
  } catch(e) {}
}

function playSuccess() {
  playTone(523,.08,'sine',.15);
  setTimeout(()=>playTone(659,.08,'sine',.15),100);
  setTimeout(()=>playTone(784,.2,'sine',.2),200);
}

function playError() {
  playTone(250,.1,'sawtooth',.12);
  setTimeout(()=>playTone(200,.2,'sawtooth',.1),120);
}

/* ============================================================
   19. CONFETTI
   ============================================================ */
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({length:120}, () => ({
    x: Math.random()*canvas.width,
    y: -20,
    r: Math.random()*6+3,
    d: Math.random()*80+20,
    color: `hsl(${Math.random()*360},90%,60%)`,
    tilt: Math.random()*10-5,
    tiltAngle: 0, tiltAngleIncremental: (Math.random()*0.07)+0.05,
    vx: Math.random()*3-1.5, vy: Math.random()*4+2,
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.ellipse(p.x, p.y, p.r, p.r/2, p.tilt, 0, 2*Math.PI);
      ctx.fill();
      p.y  += p.vy;
      p.x  += p.vx;
      p.tiltAngle += p.tiltAngleIncremental;
      p.tilt = Math.sin(p.tiltAngle) * 12;
    });
    frame++;
    if (frame < 160) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

/* ============================================================
   20. DARK MODE
   ============================================================ */
function initDarkMode() {
  const saved = localStorage.getItem('elikia-dark');
  if (saved === 'true') document.documentElement.setAttribute('data-theme','dark');
  document.getElementById('btn-dark').textContent = saved==='true'?'☀️':'🌙';
}

document.getElementById('btn-dark').addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('elikia-dark','false');
    document.getElementById('btn-dark').textContent='🌙';
  } else {
    document.documentElement.setAttribute('data-theme','dark');
    localStorage.setItem('elikia-dark','true');
    document.getElementById('btn-dark').textContent='☀️';
  }
});

document.getElementById('btn-parent').addEventListener('click', () => {
  fillParentPanel();
  navTo('screen-parent','nav-parent');
});

/* ============================================================
   21. TOAST
   ============================================================ */
function toast(msg) {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
    background:var(--card);color:var(--text);
    padding:10px 20px;border-radius:12px;box-shadow:var(--shadow-lg);
    font-weight:700;font-size:.9rem;z-index:9999;
    animation:fadeUp .3s ease;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function showMiniToast(msg) {
  toast('🏅 ' + msg);
}

/* ============================================================
   22. RESET
   ============================================================ */
function resetAll() {
  if (!confirm('Réinitialiser TOUTES les données ? Cette action est irréversible.')) return;
  localStorage.removeItem('elikia-v2');
  location.reload();
}

/* ============================================================
   23. INIT
   ============================================================ */
initDarkMode();
updatePlayerBar();
buildMathMenu();
buildFrMenu();