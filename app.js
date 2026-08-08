/* =====================================================
   我的财库 · 攒钱理财管家  v1.0
   纯本地 · 数据存 localStorage · 零依赖
   ===================================================== */

// ---------- 数据存储 ----------
const DB_KEY = 'wealth_tool_v1';
let db = loadData();

function defaultData() {
  return {
    version: 5,          // 第五阶段：数据 schema 版本号
    goal: { name: '', total: 22000, paidCalc: 'assets' }, // paidCalc: 从总资产自动算
    tx: [],            // 账本 {id, type, amt, note, cat, date}
    incomes: [],       // 固定收入 {id, type, amt} +增强5: enabled, start(生效年月), end(失效年月)
    budget: 0,         // 每月消费上限
    fx: { CNY:1, USD:7.2, HKD:0.92, JPY:0.047, EUR:7.8 }, // 默认汇率对CNY
    assets: [],        // 资产 {id, type, name, cur, amt, rate, due}
    debts: [],         // 负债 {id, name, amt} +增强3: rate(年利率%), monthPay(月还款)
    social: [],        // 社保/保险 {id, name, amt, months}
    catIcons: {},      // 增强2/6：分类 emoji 自定义映射 {分类名: 💰}
    quickTpl: [],      // 第九阶段：快捷模板 {id, name, amt, cat, icon}（空=用内置默认）
    recurring: [],     // 第九阶段：周期性支出 {id, name, amt, cat, day, icon, enabled, lastGen}
    _recurGenYm: ''    // 第九阶段：周期性支出已自动生成的年月（YYYY-MM），防止重复生成
  };
}

// 第五阶段：数据迁移。旧版本数据补缺省字段，保证平滑升级不丢数据。
function migrateData(d){
  // 旧数据没有 version（v1.0 时代）→ 兜底字段补齐
  if (typeof d.version === 'undefined') {
    d.version = 1;
  }
  // 统一确保关键数组/对象存在并合法
  ['tx','incomes','assets','debts','social','quickTpl','recurring'].forEach(function(k){
    if (!Array.isArray(d[k])) d[k] = [];
  });
  if (!d._recurGenYm) d._recurGenYm = '';
  ['fx','catIcons'].forEach(function(k){
    if (!d[k] || typeof d[k] !== 'object') d[k] = {};
  });
  if (!d.goal || typeof d.goal !== 'object') d.goal = {};
  // 确保每条 tx 都有 id（极老数据可能缺），缺则补
  d.tx.forEach(function(t, i){ if (!t.id) t.id = 'mig' + i + '-' + (Date.now()%100000); });
  return d;
}

function loadData() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return Object.assign(defaultData(), migrateData(d));
    }
  } catch(e) {}
  return defaultData();
}

function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  // D块：自动备份到单独 key（保留最近一次，防误删/覆盖）
  localStorage.setItem(DB_KEY + '_backup', JSON.stringify(db));
  // D块：版本化历史快照（保留最近20份，可恢复更早状态）
  try {
    const hist = JSON.parse(localStorage.getItem(DB_KEY + '_hist') || '[]');
    hist.push({ t: Date.now(), data: JSON.parse(JSON.stringify(db)) });
    if (hist.length > 20) hist.shift();
    localStorage.setItem(DB_KEY + '_hist', JSON.stringify(hist));
  } catch(e){}
  // 更新底部备份状态提示
  const s = document.getElementById('backStatus');
  if (s) s.textContent = '✅ 已自动备份 ' + new Date().toLocaleTimeString();
  renderAll();
  if (window.syncBudgetAlert) syncBudgetAlert();
}

// D块：从历史快照恢复某一条
function restoreBackup(){
  const hist = JSON.parse(localStorage.getItem(DB_KEY + '_hist') || '[]');
  if (!hist.length) { toastShow('暂无历史备份可恢复','info'); return; }
  const want = prompt(
    '可选恢复点（最近 ' + hist.length + ' 份）：\n' +
    hist.map((h,i)=> (i+1) + '. ' + new Date(h.t).toLocaleString()).join('\n') +
    '\n\n输入编号选择要恢复的版本（1=最新）'
  );
  const idx = parseInt(want, 10);
  if (!idx || idx<1 || idx>hist.length) { toastShow('已取消','info'); return; }
  if (!confirm('确定恢复到所选版本吗？会覆盖当前数据！')) return;
  db = Object.assign(defaultData(), hist[idx-1].data);
  save();
  toastShow('✅ 已恢复。','success');
}

// ---------- 工具 ----------

// ========== 第15阶段：Toast 通知系统 ==========
// 右上角滑入（成功绿/错误红/信息蓝），2.5s 自动消失，多 Toast 堆叠
var __toastSeq = 0;
function toastShow(text, type, dur){
  var stack = document.getElementById('toastStack');
  if (!stack){ /* 老浏览器兜底 */ try { alert(text); } catch(e){} return; }
  type = type || 'info';
  dur = dur == null ? 2500 : dur;
  var ic = { success:'✅', error:'⚠️', info:'ℹ️' }[type] || 'ℹ️';
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.id = 'toast-' + (++__toastSeq);
  el.innerHTML = '<span class="toast-ic">'+ic+'</span><span class="toast-body">'+text+'</span>';
  stack.appendChild(el);
  // 强制回流后加 show 触发滑入动画
  void el.offsetWidth;
  el.classList.add('show');
  __toastTimer(el, dur);
  // 最多保留 5 条，超出移除最旧的
  while (stack.children.length > 5) stack.removeChild(stack.firstChild);
}
function __toastTimer(el, dur){
  setTimeout(function(){
    if (!el.parentNode) return;
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 380);
  }, Math.max(dur, 700));
}
// 快捷别名（旧 alert 升级处调用）
function toastSuccess(msg){ toastShow(msg, 'success'); }
function toastError(msg){ toastShow(msg, 'error'); }
function toastInfo(msg){ toastShow(msg, 'info'); }
window.toastShow = toastShow;
window.toastSuccess = toastSuccess;
window.toastError = toastError;
window.toastInfo = toastInfo;

// ========== 第15阶段：预算警报 Banner（主动化） ==========
// 静态 renderAll 也有 #budgetWarn banner；这里在保存后主动刷新警报状态并自动滑入提示
// 直接由 db.budget 与本月消费精算：超支(over)红 / ≥80%(warn)黄 / 正常不显示
function __budgetState(){
  if (!db || !(db.budget > 0)) return null;
  var exp = (typeof monthExpense === 'function') ? monthExpense() : 0;
  var pct = db.budget > 0 ? exp / db.budget * 100 : 100;
  var remain = db.budget - exp;
  var overState = remain < 0;
  return {
    on: overState || pct >= 80,
    over: overState,
    pct: pct,
    remain: remain,
    txt: overState ? ('🚨 本月已超支 ' + fmt(-remain)) : ('💛 预算已用 ' + pct.toFixed(0) + '%，剩 ' + fmt(remain))
  };
}
function syncBudgetAlert(){
  var el = document.getElementById('budgetBanner');
  if (!el) return;
  var s = __budgetState();
  var show = !!(s && s.on);
  var again = show && !el.classList.contains('show') && !el.classList.contains('seen');
  el.className = 'budget-banner ' + (s && s.over ? 'over' : 'warn');
  var t = document.getElementById('budgetBannerTxt');
  if (t) t.innerHTML = (s && s.txt) || '';
  if (show) el.classList.add('show'); else el.classList.remove('show');
  // 预警新出现/复发（未 seen）时主动 Toast 提醒一次，点击关闭后设 seen 防反复轰炸
  if (again) {
    toastShow(s.txt, (s.over ? 'error' : 'info'), 3200);
    el.classList.add('seen');
  }
}
// 「查看账单」动作：跳到数据 Tab 看明细
function goBudget(){ if (window.switchTab) switchTab('data'); closeBudgetBanner(); }
function closeBudgetBanner(){
  var el = document.getElementById('budgetBanner');
  if (el){ el.classList.remove('show'); el.classList.add('seen'); }
}
window.__budgetState = __budgetState;
window.goBudget = goBudget;
window.syncBudgetAlert = syncBudgetAlert;
window.closeBudgetBanner = closeBudgetBanner;

// ========== 增强2：Emoji 选择器（100+ 表情库） ==========
var EMOJI_SET = [
  '🍜','🍔','🍕','🍣','🍱','🍗','🥗','🌮','🍿','☕','🧋','🍺','🍰','🍎','🥛','🍞',
  '🚌','🚗','🚕','🚆','✈️','🚇','🛵','🚢','🛴','⛽','🚄','🛫','🅿️','🚦','🗺️','🎟️',
  '🛍️','👗','👟','🧥','👜','⌚','💍','🎁','🛒','💄','🖼️','🧸','👔','🧢','💎','📱',
  '🏠','🏢','🏡','🛠️','⚡','💧','🔥','🌡️','🧹','🔑','🔧','💡','🧻','🪣','🛏️','🚿',
  '🎮','🎬','🎵','🎤','🎳','⚽','🏀','🎨','📚','🎯','🎪','🎟️','🎤','🎧','🎫','🃏',
  '💊','🏥','🩺','💉','🦷','👓','🧴','🩹','🌡️','❤️','🧘','🚑','🩺','😷','💧','🧬',
  '📚','✏️','🎓','📖','📝','🧮','🔬','🌐','🗂️','📌','✂️','🖊️','💾','🖥️','📊','📈',
  '💼','💵','💰','🏦','📉','🪙','💳','🧾','🛡️','🏅','🎆','🎇','🧧','⚖️','🔒','🗄️',
  '🐱','🐶','🐹','🐰','🦊','🐼','🐨','🐯','🦁','🐮','🦄','🐷','🐸','🐵','🦉','🐢',
  '🌳','🌸','🌻','🍀','🌿','🌵','🌊','🌙','☀️','⭐','🌈','🌋','❄️','🏔️','🛖','🌍',
  '😀','😁','😅','😂','😊','😇','🙂','😍','🥰','😎','🤩','😜','🤪','😴','🥳','😭',
  '👍','👎','👏','🙏','💪','🤝','✌️','🤞','🫶','✋','👌','🤙','👀','🧠','❤️','🔥',
  '🎂','🎉','🎊','🎁','🎈','🏆','🥇','🥈','🥉','🌟','💫','✨','🔮','🧿','🪄','💝'
];
// 当前正在编辑的分类（供 Emoji 选择器回填）
var __emojiCtx = null;
function openEmojiPicker(done){
  if (typeof done === 'function') __emojiCtx = done;
  var grid = document.getElementById('emojiGrid');
  if (grid) grid.innerHTML = EMOJI_SET.map(function(e,i){
    return '<span class="ep-item" data-i="'+i+'" style="cursor:pointer;font-size:22px;padding:6px;">'+e+'</span>';
  }).join('');
  var m = document.getElementById('emojiModal');
  if (m) m.classList.add('open');
}
function closeEmojiPicker(){
  var m = document.getElementById('emojiModal');
  if (m) m.classList.remove('open');
}
function pickEmoji(i){
  var e = EMOJI_SET[i];
  if (__emojiCtx){ __emojiCtx(e); __emojiCtx = null; }
  closeEmojiPicker();
}
// 增强2/6：共享分类 emoji 获取（优先用 db.catIcons 自定义，否则回退默认）
var __DEFAULT_CAT_EMOJI = {餐饮:'🍜',交通:'🚌',购物:'🛍️',房租:'🏠',娱乐:'🎮',医疗:'💊',教育:'📚',工资:'💼'};
function getCatIcon(cat){
  if (!cat) return '🧾';
  if (db.catIcons && db.catIcons[cat]) return db.catIcons[cat];
  return __DEFAULT_CAT_EMOJI[cat] || '🧾';
}
// 记账时分类下拉变化，回填类默认图标预览
function txCatChanged(catSelId, doneIconId, emojiElId){
  const cat = document.getElementById(catSelId).value;
  const icon = getCatIcon(cat);
  const e = document.getElementById(emojiElId);
  if (e) e.textContent = icon;
  const di = document.getElementById(doneIconId);
  if (di) di.value = icon;
}
// 从分类选择处打开 Emoji 选择器，回填并持久化到 db.catIcons（增强6）
function openCatEmojiPicker(catSelId, doneIconId, emojiElId){
  const cat = document.getElementById(catSelId).value;
  openEmojiPicker(function(ic){
    db.catIcons = db.catIcons || {};
    db.catIcons[cat] = ic;                 // 增强6：分类 emoji 持久化自定义
    const inp = document.getElementById(doneIconId);
    if (inp) inp.value = ic;
    const e = document.getElementById(emojiElId);
    if (e) e.textContent = ic;
    save();
  });
}

// ---------- 工具 ----------
function fmt(n, cur='¥') {
  n = Number(n) || 0;
  return cur + n.toLocaleString('zh-CN', {maximumFractionDigits: 2});
}
// 第五阶段修复：HTML 转义，避免备注/分类含特殊字符时破坏 DOM 或注入
function escapeHtml(s){
  return String(s==null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function curSymbol(code){
  return {CNY:'¥', USD:'$', HKD:'HK$', JPY:'¥', EUR:'€'}[code] || code;
}
// 把外币转成人民币
function toCny(currency, amount){
  const rate = db.fx[currency] || 1;
  return Number(amount) * rate;
}
function today(){ return new Date().toISOString().slice(0,10); }
function thisMonth(){ return today().slice(0,7); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// 总资产（换算成人民币）
function totalAssets(){
  return db.assets.reduce((s,a)=> s + toCny(a.cur, a.amt), 0);
}
// 总负债
function totalDebts(){
  return db.debts.reduce((s,d)=> s + Number(d.amt||0), 0);
}
// 净资产（资产-负债），攒钱目标用它来衡量更真实
function netAssets(){
  return totalAssets() - totalDebts();
}
// 本月收入（固定收入估算 + 记账收入）
function monthIncome(){
  // 增强5：固定收入按启用开关 + 生效/失效年月过滤，仅计入生效月的
  const ym = thisMonth();
  const fixed = db.incomes.reduce((s,i)=>{
    if (i.enabled === false) return s;                 // 已停用不计入
    if (i.start && i.start > ym) return s;            // 尚未生效
    if (i.end && i.end < ym) return s;                // 已失效
    return s + Number(i.amt||0);
  }, 0);
  const tx = db.tx.filter(t=> t.type==='income' && t.date.startsWith(thisMonth()));
  const txSum = tx.reduce((s,t)=> s+Number(t.amt||0),0);
  return fixed + txSum;
}
function monthExpense(){
  return db.tx.filter(t=> t.type==='expense' && t.date.startsWith(thisMonth()))
             .reduce((s,t)=> s+Number(t.amt||0),0);
}

// ---------- 攒钱目标 ----------
function setGoal(){
  const name = document.getElementById('goalNameInput').value.trim();
  const total = parseFloat(document.getElementById('goalTotalInput').value);
  if (name) db.goal.name = name;
  if (total && total > 0) db.goal.total = total;
  save();
}
// 攒钱目标用净资产来算进度（含负债更真实）
function goalPaid(){ return netAssets(); }

// ========== 增强1：达标烟花特效 ==========
var __fwCv = null, __fwCtx = null, __fwPs = [], __fwRaf = null, __fwRunning = false, __fwTimer = null;
function _fwCanvas(){
  if (__fwCv) return true;
  var cv = document.getElementById('fireworks');
  if (!cv) return false;
  __fwCv = cv; __fwCtx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio||1, 2);
  function size(){
    cv.width = Math.round(window.innerWidth * DPR);
    cv.height = Math.round(window.innerHeight * DPR);
  }
  size();
  window.addEventListener('resize', size);
  return true;
}
function _fwBurst(cx, cy){
  var colors = ['#f0d678','#d4af37','#34d399','#60a5fa','#f87171','#f08bb4','#c4b5fd','#ff8a5c'];
  // 第十四阶段：粒子数提升至 70-120/发，视觉更饱满
  var n = 70 + Math.floor(Math.random()*51);
  for (var i=0;i<n;i++){
    var a = (i/n)*Math.PI*2 + Math.random()*0.2;
    var sp = 2 + Math.random()*7;
    __fwPs.push({
      x: cx, y: cy,
      vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
      life: 0, max: 45 + Math.random()*35,
      col: colors[Math.floor(Math.random()*colors.length)],
      r: 1 + Math.random()*2.2
    });
  }
}
function _fwTick(){
  var ctx = __fwCtx, cv = __fwCv;
  ctx.clearRect(0,0,cv.width,cv.height);
  __fwPs = __fwPs.filter(function(p){
    p.life++;
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.12;           // 重力
    p.vx *= 0.985; p.vy *= 0.985;
    var a = Math.max(0, 1 - p.life/p.max);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
    return p.life < p.max;
  });
  ctx.globalAlpha = 1;
  if (__fwPs.length){ __fwRaf = requestAnimationFrame(_fwTick); }
  else { ctx.clearRect(0,0,cv.width,cv.height); __fwRunning = false; }
}
function celebrateGoal(){
  if (!_fwCanvas()) return;
  // 取目标卡中心作为烟花位置
  var DPR = Math.min(window.devicePixelRatio||1, 2);
  var hero = document.querySelector('.hero');
  var cx = window.innerWidth/2 * DPR, cy = window.innerHeight*0.22 * DPR;
  if (hero){
    var r = hero.getBoundingClientRect();
    cx = (r.left + r.width/2) * DPR; cy = (r.top + r.height*0.3) * DPR;
  }
  if (!__fwRunning){ __fwRunning = true; _fwTick(); }
  // 第十四阶段：连放 10 发，营造浓厚的庆祝氛围
  var rounds = 0;
  var iv = setInterval(function(){
    _fwBurst(cx + (Math.random()-0.5)*220, cy + (Math.random()-0.5)*60 + 10);
    if (++rounds >= 10) clearInterval(iv);
  }, 220);
  // canvas 默认半透明，几秒后淡出清空
  clearTimeout(__fwTimer);
  __fwTimer = setTimeout(function(){ __fwPs = []; }, 5000);
  // 第十四阶段：达标祝贺浮层「🎉 目标达成！」
  showCongrats();
}

// ---------- 第十四阶段：达标祝贺浮层 ----------
var __congratsTimer = null;
function showCongrats(){
  var el = document.getElementById('congratsToast');
  if (!el) return;
  // 每次触发重置动画（先移除重加或重设等位以便重播）
  el.classList.remove('show');
  void el.offsetWidth;  // 强制回流以重启动画
  el.classList.add('show');
  clearTimeout(__congratsTimer);
  __congratsTimer = setTimeout(function(){
    el.classList.remove('show');
  }, 4200);
}

// ---------- 复利 / 72法则 计算器（第五阶段第二批） ----------
// 复利终值：本金*(1+r)^n + 每月定投按期末年金终值累加
function calcCompound(){
  const P = parseFloat(document.getElementById('ciPrincipal').value) || 0;
  const r = (parseFloat(document.getElementById('ciRate').value) || 0) / 100;
  const n = parseFloat(document.getElementById('ciYears').value) || 0;
  const M = parseFloat(document.getElementById('ciMonthly').value) || 0;
  const g = document.getElementById('compoundResult');
  if (P <= 0 && M <= 0){ if(g) g.innerHTML = '<span style="color:var(--red,#e0533d);">请输入本金或每月定投</span>'; return; }
  const eol = document.createElement('div');
  const rows = [];
  // 复利终值（一次性投入）
  const fvLump = P * Math.pow(1 + r, n);
  // 每月定投（期末年金）
  let fvMonthly = 0;
  if (M > 0 && r > 0) {
    const rm = r / 12;
    fvMonthly = M * ((Math.pow(1 + rm, n*12) - 1) / rm);
  } else if (M > 0) {
    fvMonthly = M * n * 12;
  }
  const total = fvLump + fvMonthly;
  rows.push(`<div style="color:var(--gold-light,#f5b942);font-size:15px;font-weight:700;">💰 ${n} 年后总值 ${fmt(total)}</div>`);
  if (P > 0)  rows.push(`<div>投入本金 <b>${fmt(P)}</b> → 复利终值 ${fmt(fvLump)}（增值 ${fmt(fvLump-P)}）</div>`);
  if (M > 0)  rows.push(`<div>每月定投 <b>${fmt(M)}</b> × ${n*12} 期 → 定投资金 ${fmt(M*n*12)} → 终值 ${fmt(fvMonthly)}</div>`);
  const grow = total - (P + M*n*12);
  rows.push(`<div style="color:var(--green,#61c454);">📈 总收益（利息+滚利）${fmt(grow)}</div>`);
  eol.innerHTML = rows.join('<br>');
  if (g){ g.innerHTML=''; g.appendChild(eol); }
}
// 72法则：y = 72 / 年利率% → 资产翻倍所需年数
function calcRule72(){
  const r = parseFloat(document.getElementById('ciRate').value) || 0;
  const g = document.getElementById('compoundResult');
  if (r <= 0){ if(g) g.innerHTML = '<span style="color:var(--red,#e0533d);">请输入年利率（%），72法则需正利率</span>'; return; }
  const years = 72 / r;
  // 也让利息滚到 2倍/3倍精确值对比
  const exact2 = Math.log(2) / Math.log(1 + r/100);
  const days = Math.round((years - Math.floor(years)) * 365);
  g.innerHTML =
    `<div style="color:var(--gold-light,#f5b942);font-size:15px;font-weight:700;">⏱ 72法则：${years.toFixed(1)} 年资产翻倍</div>` +
    `<div style="color:var(--text-dim);">约 ${Math.floor(years)} 年 ${days} 天后，本利和翻倍</div>` +
    `<div style="color:var(--green,#61c454);">精确计算：${exact2.toFixed(1)} 年（log₂/ln(1+r)）</div>` +
    `<div style="color:var(--text-dim);font-size:12px;">规律：利率每高 1 倍，翻倍时间减半（近似）</div>`;
}

// ---------- 记账 ----------
function addTx(){
  const type = document.getElementById('txType').value;
  const amt = parseFloat(document.getElementById('txAmt').value);
  const note = document.getElementById('txNote').value.trim();
  const cat = document.getElementById('txCat').value;
  const ic = document.getElementById('txIcon').value || getCatIcon(cat);
  if (!amt || amt <= 0) { toastError('请输入金额'); return; }
  db.tx.unshift({ id: uid(), type, amt, note: note||cat, cat, ic, date: today() });
  document.getElementById('txIcon').value = '';
  save();
}
let editId = null;
function editTx(id){
  const t = db.tx.find(x=> x.id===id);
  if (!t) return;
  editId = id;
  document.getElementById('eId').textContent = (t.type==='income'?'收入':'支出') + ' · ' + t.date;
  document.getElementById('eType').value = t.type;
  document.getElementById('eAmt').value = t.amt;
  document.getElementById('eNote').value = (t.note && t.note!==t.cat) ? t.note : '';
  document.getElementById('eCat').value = t.cat;
  document.getElementById('eIcon').value = t.ic || getCatIcon(t.cat);
  document.getElementById('eEmoji').textContent = t.ic || getCatIcon(t.cat);
  document.getElementById('eDate').value = t.date;
  document.getElementById('editModal').classList.add('open');
}
function saveEditTx(){
  const t = db.tx.find(x=> x.id===editId);
  if (!t){ closeEditModal(); return; }
  const amt = parseFloat(document.getElementById('eAmt').value);
  const cat = document.getElementById('eCat').value.trim() || '其他';
  const note = document.getElementById('eNote').value.trim();
  const date = document.getElementById('eDate').value;
  if (!amt || amt <= 0){ toastError('请输入有效金额'); return; }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)){ toastError('日期格式无效'); return; }
  t.type = document.getElementById('eType').value;
  t.amt = amt;
  t.cat = cat;
  t.note = note || cat;
  t.ic = document.getElementById('eIcon').value || getCatIcon(cat);
  t.date = date;
  // 编辑后聚焦到该记录所在月份
  if (curMonth !== date.slice(0,7)) switchMonth(date.slice(0,7));
  closeEditModal();
  save();
}
function closeEditModal(){
  editId = null;
  document.getElementById('editModal').classList.remove('open');
}
function delTx(id){
  if (!confirm('确定删除这条记录吗？')) return;
  db.tx = db.tx.filter(t=> t.id!==id);
  save();
}
// 月份标签
function monthList(){
  const set = new Set(db.tx.map(t=> t.date.slice(0,7)));
  if (thisMonth() && !set.has(thisMonth())) set.add(thisMonth());
  return Array.from(set).sort().reverse();
}
let curMonth = thisMonth();
function renderListFilters(){
  const cats = Array.from(new Set(db.tx.filter(t=> t.date.slice(0,7)===curMonth).map(t=> t.cat))).sort();
  const sel = document.getElementById('fCat');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="all">全部分类</option>' +
    cats.map(c=> `<option value="${c}">${c}</option>`).join('');
  if (cats.includes(cur)) sel.value = cur; else sel.value = 'all';
}
function renderMonthTags(){
  const el = document.getElementById('monthTags');
  el.innerHTML = monthList().map(m=>
    `<span class="tag ${m===curMonth?'active':''}" onclick="switchMonth('${m}')">${m}</span>`
  ).join('');
  monthLabel();
}
function switchMonth(m){ curMonth = m; save(); }
// 箭头切换月份（上月/下月），最多往回走到最早账单或本期
function shiftMonth(dir){
  const ym = curMonth.split('-').map(Number); // [y, m]
  let y = ym[0], m = ym[1] + dir;
  if (m < 1){ m = 12; y--; }
  else if (m > 12){ m = 1; y++; }
  const tgt = y + '-' + String(m).padStart(2,'0');
  const thisM = thisMonth();
  // 下月不越过当前月
  if (dir > 0 && tgt > thisM) return;
  switchMonth(tgt);
}
function monthLabel(){
  const el = document.getElementById('monthLabel');
  if (!el) return;
  const [y,m] = curMonth.split('-').map(Number);
  el.textContent = y + '年' + m + '月' + (curMonth===thisMonth() ? ' · 本月' : '');
}

// ---------- 月薪 ----------
function addIncome(){
  const type = document.getElementById('incomeType').value;
  const amt = parseFloat(document.getElementById('incomeAmt').value);
  if (!amt || amt<=0) { toastError('请输入金额'); return; }
  // 增强5：生效/失效年月（选填，格式 YYYY-MM）
  const start = document.getElementById('incomeStart').value || '';
  const end = document.getElementById('incomeEnd').value || '';
  db.incomes.push({ id:uid(), type, amt, enabled:true, start, end });
  document.getElementById('incomeStart').value = '';
  document.getElementById('incomeEnd').value = '';
  save();
}
function delIncome(id){ if (!confirm('确定删除这条固定收入吗？')) return; db.incomes = db.incomes.filter(i=> i.id!==id); save(); }
// 增强5：启用/停用固定收入开关
function toggleIncome(id){
  const i = db.incomes.find(x=> x.id===id);
  if (!i) return;
  i.enabled = !(i.enabled !== false);
  save();
}

// ---------- 预算 ----------
function setBudget(){
  const b = parseFloat(document.getElementById('budgetAmt').value);
  db.budget = b>=0 ? b : 0;
  save();
}

// ---------- 资产 ----------
function addAsset(){
  const type = document.getElementById('assetType').value;
  const cur = document.getElementById('assetCur').value;
  const name = document.getElementById('assetName').value.trim();
  const amt = parseFloat(document.getElementById('assetAmt').value);
  if (!name || !amt || amt<=0) { toastError('请填写账户名和金额'); return; }
  db.assets.push({
    id:uid(), type, cur, name,
    amt,
    rate: parseFloat(document.getElementById('assetRate').value)||0,
    due: document.getElementById('assetDate').value.trim()
  });
  save();
}
function delAsset(id){ if (!confirm('确定删除这个资产账户吗？')) return; db.assets = db.assets.filter(a=> a.id!==id); save(); }
function saveFx(){
  const rate = parseFloat(document.getElementById('fxRate').value);
  document.getElementById('fxRate').blur();
  if (rate && rate>0) { db.fx.USD = rate; save(); }
}
function assetBadge(type){
  return {cash:'badge-cash',deposit:'badge-deposit',stock:'badge-stock',fund:'badge-fund'}[type]||'badge-cash';
}
function assetLabel(type){
  return {cash:'💰 现金',deposit:'🏦 定存',stock:'📈 股票',fund:'📊 基金'}[type]||type;
}

// ---------- 负债 ----------
function addDebt(){
  const name = document.getElementById('debtName').value.trim();
  const amt = parseFloat(document.getElementById('debtAmt').value);
  // 增强3：年利率(%) + 月还款(可选)
  const rate = parseFloat(document.getElementById('debtRate').value) || 0;
  const monthPay = parseFloat(document.getElementById('debtMonthPay').value) || 0;
  if (!name || !amt || amt<=0) { toastError('请填写负债名称和金额'); return; }
  db.debts.push({ id:uid(), name, amt, rate, monthPay });
  document.getElementById('debtRate').value = '';
  document.getElementById('debtMonthPay').value = '';
  save();
}
function delDebt(id){ if (!confirm('确定删除这笔负债吗？')) return; db.debts = db.debts.filter(d=> d.id!==id); save(); }

// 增强3：估算还清月数（等额本息/按月递增本金近似）
function debtPayoffMonths(d){
  const P = Number(d.amt||0);
  const r = Number(d.rate||0)/100/12;   // 月利率
  const m = Number(d.monthPay||0);
  if (P<=0) return 0;
  if (m<=0) return r>0 ? Infinity : 1;
  if (m >= P) return 1;
  // 按月滚动本金：每月还款先付息，剩余还本
  let bal = P, months = 0, maxIt = 1200;
  while (bal > 0 && months < maxIt) {
    const interest = bal * r;
    let pay = m - interest;
    if (pay <= 0) { return Infinity; }   // 月供低于每月利息，永远还不清
    bal -= pay; months++;
  }
  return months;
}
function debtPayoffText(d){
  const mo = debtPayoffMonths(d);
  const m = Number(d.monthPay||0);
  const r = Number(d.rate||0);
  if (mo === Infinity) {
    return '⚠️ 增月供才能还清';
  }
  if (mo === 1) return '· 一次结清';
  const yrs = Math.floor(mo/12);
  const ms = mo%12;
  const when = (yrs>0 ? (yrs+'年') : '') + (ms>0?(ms+'个月'):'');
  return `· 约${when}还清` + (m?`（月还${fmt(m,'')}）`:'') + (r?` · ${r}%/年`:'') + (mo>0?` · 共${Math.round(mo)}期`:'');
}
// 汇总月还款
function totalMonthPay(){
  return (db.debts||[]).reduce((s,d)=> s+(Number(d.monthPay||0)), 0);
}
// 第九阶段增强：还清周期实时估算器（独立输入，不改动数据）
function calcDebtPayoff(){
  const out = document.getElementById('calcDebtOut');
  if (!out) return;
  const P = parseFloat(document.getElementById('calcDebtAmt').value)||0;
  const r = parseFloat(document.getElementById('calcDebtRate').value)||0;
  const m = parseFloat(document.getElementById('calcDebtPay').value)||0;
  if (P <= 0){ out.textContent = '【欠款金额】需大于 0'; return; }
  if (m <= 0){ out.textContent = '【月还款】必填，用于估算还清周期'; return; }
  // 复用现有还清月数逻辑（构造临时对象）
  const mo = debtPayoffMonths({ amt:P, rate:r, monthPay:m });
  if (mo === Infinity){
    out.textContent = '⚠️ 月还款低于每月利息，永远还不清——请提高月还款'; out.style.color='var(--red)'; return;
  }
  out.style.color='var(--text-dim)';
  let txt;
  if (mo === 1){ txt = '✅ 一次即可结清'; }
  else {
    const yrs = Math.floor(mo/12);
    const ms = mo%12;
    txt = (yrs>0?(yrs+'年'):'') + (ms>0?(ms+'个月'):'') + `（共 ${mo} 期）`;
    txt = '✅ 预计约 ' + txt + ' 还清';
  }
  const interest = Math.max(0, (mo===Infinity?0 : mo*m - P));
  txt += '，累计利息约 ¥' + Math.round(interest).toLocaleString();
  out.textContent = txt;
}

// ---------- 社保/保险 ----------
function addSI(){
  const name = document.getElementById('siType').value.trim();
  const amt = parseFloat(document.getElementById('siAmt').value);
  const months = parseFloat(document.getElementById('siMonths').value)||0;
  if (!name || !amt) { toastError('请填写名称和金额'); return; }
  db.social.push({ id:uid(), name, amt, months });
  save();
}
function delSI(id){ if (!confirm('确定删除这条社保/保险记录吗？')) return; db.social = db.social.filter(s=> s.id!==id); save(); }

// ---------- 第五阶段：月度对比报表（本月 vs 上月） ----------
function monthStat(ym){
  const inc = db.tx.filter(t=> t.type==='income'  && t.date.startsWith(ym)).reduce((s,t)=> s+Number(t.amt||0),0);
  const exp = db.tx.filter(t=> t.type==='expense' && t.date.startsWith(ym)).reduce((s,t)=> s+Number(t.amt||0),0);
  return { inc, exp, net: inc-exp, sr: inc>0 ? (inc-exp)/inc*100 : 0 };
}
// 上月 ym（YYYY-MM）
function prevMonthYM(ym){
  let [y,m] = ym.split('-').map(Number);
  m--; if (m<1){ m=12; y--; }
  return y + '-' + String(m).padStart(2,'0');
}
// 生成同比箭头/百分比文本
function vsBadge(diffPct, invert){
  // invert=true：数据越大越坏（如支出）；否则越大越好
  const good = invert ? diffPct < 0 : diffPct > 0;
  const arrow = diffPct > 0 ? '↑' : (diffPct < 0 ? '↓' : '→');
  const color = diffPct===0 ? 'var(--text-dim)' : (good ? 'var(--green)' : 'var(--red)');
  return `<span style="color:${color};font-weight:700;">${arrow} ${Math.abs(diffPct).toFixed(1)}%</span>`;
}
function renderMonthCompare(){
  const box = document.getElementById('monthCompare');
  if (!box) return;
  const cur = monthStat(curMonth);
  const prev = monthStat(prevMonthYM(curMonth));
  const hasCur = cur.inc>0 || cur.exp>0;
  const hasPrev = prev.inc>0 || prev.exp>0;
  // 环比：无上月数据则显示首发
  function pct(c, p){
    if (!hasPrev) return null;
    if (p===0 && c===0) return 0;
    if (p===0) return null; // 基线为0无法算比
    return (c-p)/Math.abs(p)*100;
  }
  const rows = [
    { k:'收入',  c:cur.inc,  p:prev.inc,  inv:false },
    { k:'消费',  c:cur.exp,  p:prev.exp,  inv:true  },
    { k:'结余',  c:cur.net,  p:prev.net,  inv:false },
    { k:'储蓄率',c:cur.sr,   p:prev.sr,   inv:false, unit:'%' },
  ];
  if (!hasCur && !hasPrev) { box.innerHTML = '<div class="empty">暂无数据对比（确保至少记录了一笔收支）</div>'; return; }
  box.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">` + rows.map(r=>{
    const diff = pct(r.c, r.p);
    const bad = diff===null || diff===0 ? '' : vsBadge(diff, r.inv);
    const unit = r.unit || '';
    const prevTxt = hasPrev ? fmt(r.p, unit==='%'?'':'') + (unit) : '—';
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(128,128,128,.08);">
      <span style="width:52px;font-weight:600;font-size:13px;">${r.k}</span>
      <span style="flex:1;font-size:15px;font-weight:700;">${fmt(r.c, '')}${unit}</span>
      <span style="color:var(--text-dim);font-size:12px;">上月 ${prevTxt}</span>
      <span style="width:74px;text-align:right;">${bad || '<span style="color:var(--text-dim);">—</span>'}</span>
    </div>`;
  }).join('') + `</div>`;
}

// 第五阶段：净资产增长趋势（近 N 个月，含固定收入估算，积累可视化）
function renderNetTrend(){
  const el = document.getElementById('netTrend');
  if (!el) return;
  const N = 8; // 近 8 个月
  const now = new Date();
  const months = [];
  for (let i=N-1; i>=0; i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push({ ym: d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'), label:(d.getMonth()+1)+'月' });
  }
  // 每月净流入 = 该月固定收入(按生效月过滤) + 记账收入 - 记账支出
  const ymNow = thisMonth();
  const vals = months.map(m=>{
    const fixed = db.incomes.reduce((s,i)=>{
      if (i.enabled === false) return s;
      if (i.start && i.start > m.ym) return s;
      if (i.end && i.end < m.ym) return s;
      return s + Number(i.amt||0);
    }, 0);
    const txIn  = db.tx.filter(t=> t.type==='income'  && t.date.startsWith(m.ym)).reduce((s,t)=> s+Number(t.amt||0),0);
    const txOut = db.tx.filter(t=> t.type==='expense' && t.date.startsWith(m.ym)).reduce((s,t)=> s+Number(t.amt||0),0);
    return { ym:m.ym, label:m.label, flow: fixed + txIn - txOut };
  });
  // 累计净资产（从初始净资产 0 起逐月累加 flow，再加当前资产基线偏移展示相对变化）
  // 展示「累计净流入」趋势更直观地反映攒钱进度
  let acc = 0;
  const cum = vals.map(v=>{ acc += v.flow; return { ...v, cum: acc }; });
  const maxAbs = Math.max(1, ...cum.map(v=> Math.abs(v.cum)));
  const zero = 50; // 零点在图表高度中点（允许负值向下）
  el.innerHTML = `<div style="display:flex;align-items:flex-end;gap:10px;height:170px;padding-top:6px;">` +
    cum.map(v=>{
      const h = Math.max(2, Math.abs(v.cum)/maxAbs*90);
      const upH = v.cum>=0 ? h : 0;
      const dnH = v.cum<0  ? h : 0;
      const col = v.cum>=0 ? 'var(--green)' : 'var(--red)';
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;color:var(--text-dim);">
        <div style="font-size:10px;color:${col};font-weight:700;">${v.cum>=0?'+':''}${Math.round(v.cum).toLocaleString()}</div>
        <div style="height:${upH}%;width:22px;border-radius:5px;background:linear-gradient(180deg,${col},transparent);"></div>
        <div style="height:${dnH}%;width:22px;border-radius:5px;background:linear-gradient(0deg,${col},transparent);"></div>
        <div>${v.label}</div>
      </div>`;
    }).join('') + `</div>`;
}

// ---------- 年度汇总 12 个月表格（增强4） ----------
function yearList(){
  const set = new Set(db.tx.map(t=> t.date.slice(0,4)));
  if (!set.has(String(new Date().getFullYear()))) set.add(String(new Date().getFullYear()));
  return Array.from(set).sort();
}
function renderYearSummary(){
  const sel = document.getElementById('sumYear');
  const body = document.getElementById('sumYearBody');
  if (!sel || !body) return;
  const years = yearList();
  if (!sel.options.length) {
    sel.innerHTML = years.map(y=> `<option value="${y}">${y} 年</option>`).join('');
    sel.value = String(new Date().getFullYear());
  }
  const year = sel.value || String(new Date().getFullYear());
  body.innerHTML = '';
  let yInc=0, yExp=0, yNet=0;
  for (let m=1; m<=12; m++){
    const ym = year + '-' + String(m).padStart(2,'0');
    const inc = db.tx.filter(t=> t.type==='income'  && t.date.startsWith(ym)).reduce((s,t)=> s+Number(t.amt||0), 0);
    const exp = db.tx.filter(t=> t.type==='expense' && t.date.startsWith(ym)).reduce((s,t)=> s+Number(t.amt||0), 0);
    const net = inc - exp;
    const sr = inc>0 ? (net/inc*100) : 0;
    const has = inc>0 || exp>0;
    yInc+=inc; yExp+=exp; yNet+=net;
    if (!has) continue;
    body.innerHTML += `<tr style="border-bottom:1px solid rgba(128,128,128,.1);">
      <td style="padding:6px 8px;font-weight:600;">${m} 月</td>
      <td style="padding:6px 8px;text-align:right;color:var(--green,#61c454);">+${fmt(inc).replace('¥','')}</td>
      <td style="padding:6px 8px;text-align:right;color:var(--red,#e0533d);">-${fmt(exp).replace('¥','')}</td>
      <td style="padding:6px 8px;text-align:right;${net>=0?'color:var(--gold-light,#f5b942);':'color:var(--red,#e0533d);'}">${net>=0?'+':''}${fmt(net).replace('¥','')}</td>
      <td style="padding:6px 8px;text-align:right;color:var(--text-dim);">${sr.toFixed(1)}%</td>
    </tr>`;
  }
  if (yInc>0 || yExp>0) {
    body.innerHTML += `<tr style="border-top:1px solid rgba(128,128,128,.3);font-weight:700;color:var(--gold-light,#f5b942);">
      <td style="padding:6px 8px;">${year} 合计</td>
      <td style="padding:6px 8px;text-align:right;color:var(--green,#61c454);">+${fmt(yInc).replace('¥','')}</td>
      <td style="padding:6px 8px;text-align:right;color:var(--red,#e0533d);">-${fmt(yExp).replace('¥','')}</td>
      <td style="padding:6px 8px;text-align:right;">${yNet>=0?'+':''}${fmt(yNet).replace('¥','')}</td>
      <td style="padding:6px 8px;text-align:right;color:var(--text-dim);">${yInc>0?(yNet/yInc*100).toFixed(1):'0'}%</td>
    </tr>`;
  } else {
    body.innerHTML = '<tr><td colspan="5" style="padding:14px;text-align:center;color:var(--text-dim);">该年度暂无收支记录</td></tr>';
  }
}

// ---------- 年度图表 ----------
function renderChart(){
  // 收集近6个月数据
  const now = new Date();
  const months = [];
  for (let i=5; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));
  }
  const data = months.map(m => {
    const inc = db.tx.filter(t=>t.type==='income'&&t.date.startsWith(m)).reduce((s,t)=>s+Number(t.amt||0),0);
    const exp = db.tx.filter(t=>t.type==='expense'&&t.date.startsWith(m)).reduce((s,t)=>s+Number(t.amt||0),0);
    return { m, inc, exp, net: inc-exp };
  });
  const maxV = Math.max(1, ...data.map(d=>Math.max(d.inc,d.exp)));

  const el = document.getElementById('monthChart');
  el.innerHTML = data.map(d => {
    const ih = d.inc/maxV*100, eh = d.exp/maxV*100;
    const net = d.net>=0 ? '+' : '-';
    return `<div class="chart-col">
      <div class="chart-bars">
        <div class="bar-col bar-income" style="height:${Math.max(2,ih)}%">
        </div>
        <div class="bar-col bar-expense" style="height:${Math.max(2,eh)}%">
        </div>
      </div>
      <div class="chart-label">${d.m.slice(5)}月</div>
      <div class="chart-val">${net}${Math.round(d.net).toLocaleString()}</div>
    </div>`;
  }).join('');
}

// ---------- 分类消费排行 ----------
function renderCatRanking(){
  const el = document.getElementById('catRanking');
  const elm = document.getElementById('tab-data');
  if (!el) return;
  // 当月支出按分类汇总
  const monthTx = db.tx.filter(t=> t.type==='expense' && t.date.slice(0,7)===curMonth);
  const map = {};
  monthTx.forEach(t=> { map[t.cat] = (map[t.cat]||0) + Number(t.amt||0); });
  const rows = Object.entries(map).map(([cat,amt])=>({cat,amt})).sort((a,b)=> b.amt-a.amt);
  const total = rows.reduce((s,r)=> s+r.amt, 0);
  const icon = getCatIcon(rows[0] && rows[0].cat);
  if (!rows.length) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:12px;">本月暂无支出记录</div>';
    return;
  }
  const max = rows[0].amt;
  el.innerHTML = rows.map(r=>{
    const pct = total>0 ? (r.amt/total*100) : 0;
    const w = max>0 ? (r.amt/max*100) : 0;
    const c = r.cat;
    const emoji = getCatIcon(c);
    return `<div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
        <span>${emoji} ${c}</span>
        <span>¥${Number(r.amt).toLocaleString()} · ${pct.toFixed(1)}%</span>
      </div>
      <div style="height:8px;background:rgba(128,128,128,.15);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${w}%;background:linear-gradient(90deg,var(--gold-light),#f5b942);border-radius:4px;"></div>
      </div>
    </div>`;
  }).join('');
}

function renderTopSpending(){
  const el = document.getElementById('topSpending');
  if (!el) return;
  const monthTx = db.tx.filter(t=> t.type==='expense' && t.date.slice(0,7)===curMonth)
    .map(t=>({note:t.note, cat:t.cat, amt:Number(t.amt||0), date:t.date}))
    .sort((a,b)=> b.amt-a.amt);
  const top3 = monthTx.slice(0,3);
  if (!top3.length) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:12px;">本月暂无消费记录</div>';
    return;
  }
  const medal = ['🥇','🥈','🥉'];
  const border = ['#f5b942','#c0c0c0','#cd7f32'];
  el.innerHTML = top3.map((t,i)=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;margin-bottom:6px;background:rgba(128,128,128,.06);border:1px solid ${border[i]}55;">
      <span style="font-size:20px;">${medal[i]}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${getCatIcon(t.cat)} ${escapeHtml(t.note||t.cat)}</div>
        <div style="font-size:11px;color:var(--text-dim);">${t.cat} · ${t.date}</div>
      </div>
      <span style="font-size:15px;font-weight:700;color:var(--red,#e0533d);">¥${Number(t.amt).toLocaleString()}</span>
    </div>`).join('');
}

function renderDonut(){
  const el = document.getElementById('donutChart');
  if (!el) return;
  const monthTx = db.tx.filter(t=> t.type==='expense' && t.date.slice(0,7)===curMonth);
  if (!monthTx.length) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:12px;">本月暂无消费记录</div>';
    return;
  }
  const catColor = {
    餐饮:'#f5b942',交通:'#5b8ff9',购物:'#f08bb4',房租:'#c0c0c0',娱乐:'#8dd3c7',医疗:'#ff8a5c',教育:'#9b8afb',工资:'#61c454'
  };
  const map = {};
  monthTx.forEach(t=> { map[t.cat] = (map[t.cat]||0) + Number(t.amt||0); });
  const rows = Object.entries(map).map(([cat,amt])=>({cat,amt})).sort((a,b)=> b.amt-a.amt);
  const total = rows.reduce((s,r)=> s+r.amt, 0);
  const cx=100, cy=100, r=72, sw=30;
  // 环形扇形 path（用 stroke-dasharray 方案直观：每个扇形绘一段圆弧）
  let acc = 0;
  const arcs = rows.map(row=>{
    const frac = row.amt/total;
    const a0 = acc*2*Math.PI - Math.PI/2;
    acc += frac;
    const a1 = acc*2*Math.PI - Math.PI/2;
    const large = (a1-a0) > Math.PI ? 1 : 0;
    const x0 = cx + r*Math.cos(a0), y0 = cy + r*Math.sin(a0);
    const x1 = cx + r*Math.cos(a1), y1 = cy + r*Math.sin(a1);
    const path = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
    return `<path d="${path}" fill="${catColor[row.cat]||'#d0d0d0'}" stroke="var(--bg,#fff)" stroke-width="1.5"/>
`;
  }).join('');
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
      <svg viewBox="0 0 200 200" style="width:170px;height:170px;">
        ${arcs}
        <text x="100" y="100" text-anchor="middle" dominant-baseline="central" fill="var(--gold-light,#f5b942)" font-size="22" font-weight="700">¥${Math.round(total).toLocaleString()}</text>
        <text x="100" y="124" text-anchor="middle" dominant-baseline="central" fill="var(--text-dim)" font-size="10">本月消费</text>
      </svg>
      <div style="display:flex;flex-direction:column;gap:6px;width:100%;">
        ${rows.map(r=>{
          const pct = total>0?(r.amt/total*100):0;
          return `<div style="display:flex;align-items:center;gap:8px;font-size:12px;">
            <span style="width:10px;height:10px;border-radius:2px;background:${catColor[r.cat]||'#d0d0d0'};display:inline-block;"></span>
            <span style="flex:1;">${getCatIcon(r.cat)} ${r.cat}</span>
            <span style="color:var(--text-dim);">${pct.toFixed(1)}%</span>
            <span style="font-weight:600;color:var(--red,#e0533d);">¥${Math.round(r.amt).toLocaleString()}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ---------- 第九阶段：快捷模板 ----------
// 内置默认快捷模板（用户无自定义时展示；可增删覆盖到 db.quickTpl）
function defaultQuickTpl(){
  return [
    { id:'q-breakfast', name:'早餐',   amt:8,  cat:'餐饮', icon:'🥟' },
    { id:'q-metro',    name:'地铁',   amt:4,  cat:'交通', icon:'🚇' },
    { id:'q-lunch',    name:'午餐',   amt:25, cat:'餐饮', icon:'🍱' },
    { id:'q-coffee',   name:'咖啡',   amt:15, cat:'餐饮', icon:'☕' },
    { id:'q-taxi',     name:'打车',   amt:20, cat:'交通', icon:'🚕' },
    { id:'q-snack',    name:'零食',   amt:10, cat:'购物', icon:'🍿' }
  ];
}
// 合并后的模板列表：优先用户自定义，否则用默认（用 id 区分，default 开头为内置）
function quickTplList(){
  const custom = (db.quickTpl||[]).filter(t=> t && !String(t.id||'').startsWith('q-'));
  const defs = defaultQuickTpl().filter(d=> !(db.quickTpl||[]).some(t=> t && String(t.id)===String(d.id)));
  return defs.concat(custom);
}
// 一键记账（快捷模板）
function quickTx(id){
  const t = (db.quickTpl||[]).find(x=> String(x.id)===String(id)) || defaultQuickTpl().find(x=> String(x.id)===String(id));
  if (!t) return;
  quickAdd({ name:t.name, amt:t.amt, cat:t.cat, icon:t.icon });
}
// 按模板写一条支出并提示（供快捷模板/周期支出复用）
function quickAdd(o){
  if (!o || !o.amt || o.amt<=0){ toastError('模板金额无效'); return; }
  db.tx.unshift({
    id: uid(), type:'expense', amt:Number(o.amt),
    note: o.note || o.name || o.cat || '其他',
    cat: o.cat || '其他',
    ic: o.icon || getCatIcon(o.cat||'其他'),
    date: today()
  });
  save();
}
// 渲染快捷模板按钮组（记账 Tab 顶部）
function renderQuickTpl(){
  const el = document.getElementById('quickTpl');
  if (!el) return;
  const list = quickTplList();
  el.innerHTML = list.map(t=>
    `<button class="quick-btn" onclick="quickTx('${t.id}')" title="${t.name} ${t.amt}元（${t.cat}）">
       <span class="q-emoji">${t.icon||getCatIcon(t.cat)}</span>
       <span class="q-name">${escapeHtml(t.name)}</span>
       <span class="q-amt">¥${t.amt}</span>
     </button>`
  ).join('') + `<button class="quick-btn quick-add" onclick="openQuickTplSetup()" title="自定义快捷模板">＋</button>`;
}
// 快捷模板：进入设置/新增（用 prompt 快速编辑名称/金额/分类，足够简洁）
function openQuickTplSetup(){
  const list = (db.quickTpl||[]).filter(t=> t && !String(t.id||'').startsWith('q-'));
  const names = list.map(t=> `${escapeHtml(t.name)}（¥${t.amt}/${t.cat}）`).join('\n');
  const menu = '当前自定义模板：\n' + (names || '（无，使用内置默认）') + '\n\n' +
    '请操作：\n1. 新增模板 → 先输入 \"添加\"\n2. 删除模板 → 先输入 \"删除\"\n3. 取消 → 直接回车/取消';
  const cmd = prompt(menu, '');
  if (!cmd) return;
  if (cmd.indexOf('添加')>=0 || cmd.indexOf('新增')>=0 || cmd.indexOf('add')>=0 || cmd.toLowerCase().indexOf('add')>=0){
    const name = prompt('模板名称（如：奶茶）','');
    if (!name) return;
    const amt = parseFloat(prompt('默认金额 ¥（如：18）',''));
    if (!amt || amt<=0){ toastError('金额无效'); return; }
    const cat = prompt('分类（餐饮/交通/购物/房租/娱乐/医疗/其他）','餐饮') || '餐饮';
    const icon = prompt('图标 emoji（默认 🧾）','🧾') || '🧾';
    if (!db.quickTpl) db.quickTpl = [];
    db.quickTpl.push({ id:'c'+uid(), name, amt, cat, icon });
    save();
    toastShow('✅ 已添加模板「'+name+'」','success');
  } else if (cmd.indexOf('删除')>=0 || cmd.indexOf('del')>=0 || cmd.toLowerCase().indexOf('del')>=0){
    if (!list.length){ toastShow('暂无自定义模板可删除','info'); return; }
    const idx = prompt('输入要删除的模板序号（1~'+list.length+'）：\n' + list.map((t,i)=> (i+1)+'. '+t.name+'（¥'+t.amt+'）').join('\n'),'');
    const n = parseInt(idx,10);
    if (!n || n<1 || n>list.length){ toastError('序号无效'); return; }
    db.quickTpl = (db.quickTpl||[]).filter(t=> t && t.id!==list[n-1].id);
    save();
    toastShow('✅ 已删除模板','success');
  }
}

// ---------- 第九阶段：周期性支出 ----------
// 渲染周期支出管理卡片（记账 Tab）
function renderRecurring(){
  const el = document.getElementById('recurringList');
  if (!el) return;
  const list = db.recurring||[];
  el.innerHTML = list.length ? list.map(r=>{
    const on = (r.enabled !== false);
    return `<div class="item" style="${on?'':'opacity:.45;'}">
      <div class="left"><span class="emoji">${r.icon||getCatIcon(r.cat)}</span><div>
        <div class="name">${escapeHtml(r.name)}${on?'':'（停用）'}</div>
        <div class="sub">每月${r.day}日扣款 · ${r.cat}</div>
      </div></div>
      <div style="display:flex;align-items:center;gap:10px;">
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--text-dim);cursor:pointer;">
          <input type="checkbox" ${on?'checked':''} onchange="toggleRecurring('${r.id}')" style="accent-color:var(--gold-light,#f5b942);">
          启用
        </label>
        <span class="amt red">${fmt(r.amt).replace('¥','')}</span>
        <button class="del" onclick="delRecurring('${r.id}')">✕</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">暂无周期性支出，点下方“新增”添加（如房租、网费）</div>';
}
// 新增周期性支出
function addRecurring(){
  const name = document.getElementById('recName').value.trim();
  const amt = parseFloat(document.getElementById('recAmt').value);
  const cat = document.getElementById('recCat').value;
  const day = parseInt(document.getElementById('recDay').value, 10);
  if (!name || !amt || amt<=0){ toastError('请填写名称和金额'); return; }
  if (!day || day<1 || day>31){ toastError('扣款日期需在 1~31 之间'); return; }
  if (!db.recurring) db.recurring = [];
  const icon = getCatIcon(cat);
  const todayDay = new Date().getDate();
  db.recurring.push({ id: uid(), name, amt, cat, day, icon, enabled:true, lastGen:'' });
  // 新增后若当前未到扣款日则不立即生成，等年度匹配
  // 若今天已 >= 扣款日 且 本月还没生成过 → 立即补生成一条，符合直觉
  if (todayDay >= day) {
    quickAddRecurring(db.recurring[db.recurring.length-1], thisMonth());
  }
  document.getElementById('recName').value='';
  document.getElementById('recAmt').value='';
  document.getElementById('recDay').value='1';
  save();
}
// 周期项生成一条支出（写 lastGen=该月）
function quickAddRecurring(r, ym){
  if (!r || (r.enabled === false)) return;
  quickAdd({ name:r.name, amt:r.amt, cat:r.cat, icon:r.icon });
  r.lastGen = ym;
}
// 切换启用
function toggleRecurring(id){
  const r = (db.recurring||[]).find(x=> x.id===id);
  if (!r) return;
  r.enabled = !(r.enabled !== false);
  save();
}
function delRecurring(id){
  if (!confirm('确定删除这条周期性支出吗？删除后不再自动生成账本。')) return;
  db.recurring = (db.recurring||[]).filter(x=> x.id!==id);
  save();
}
// 每月首次进入时，为已到扣款日的周期项自动生成当月的支出账单
function processRecurring(){
  const ym = thisMonth();
  if (db._recurGenYm === ym) return;   // 本月已处理过，跳过防重复
  const todayDay = new Date().getDate();
  (db.recurring||[]).forEach(function(r){
    if (r.enabled === false) return;
    // r.day 已到（今天 >= 扣款日），且该项本月还没被生成过 → 补一条
    if (todayDay >= (r.day||1) && r.lastGen !== ym) {
      quickAddRecurring(r, ym);
    }
  });
  db._recurGenYm = ym;   // 标记本月已处理，防止重复
}

// ---------- 渲染 ----------
// 第八阶段：数据仪表盘 · 首页聚合总览
function renderDash(){
  const st = monthStat(curMonth);          // 本月收入/支出/结余/储蓄率
  const exp = monthExpense(), inc = monthIncome();
  const net = inc - exp;
  const rate = inc>0 ? (net/inc*100) : 0;

  const [dY, dM] = curMonth.split('-').map(Number);
  document.getElementById('dashMonth').textContent = dY + '年' + dM + '月';
  document.getElementById('dashInc').textContent = fmt(inc);
  document.getElementById('dashExp').textContent = fmt(exp);
  document.getElementById('dashNet').textContent = fmt(Math.abs(net));
  document.getElementById('dashRate').textContent = rate.toFixed(1) + '%';

  // 资产净资
  const ta = totalAssets(), td = totalDebts(), na = netAssets();
  document.getElementById('dashAssets').textContent = fmt(ta);
  document.getElementById('dashDebts').textContent = fmt(td);
  document.getElementById('dashNetAssets').textContent = fmt(na);

  // 预算进度条
  const bwWrap = document.getElementById('dashBudgetBarWrap');
  if (db.budget > 0 && exp > 0) {
    const bp = Math.min(100, exp/db.budget*100);
    const remain = db.budget - exp;
    document.getElementById('dashBudget').textContent = '¥'+Math.round(db.budget).toLocaleString()+' · 已用 '+bp.toFixed(0)+'%';
    const fill = document.getElementById('dashBudgetFill');
    fill.style.width = bp + '%';
    fill.className = 'dash-bar-fill' + (remain<0?' over':(bp>=80?' warn':''));
    document.getElementById('dashBudgetTxt').textContent = remain<0 ? '超支 '+fmt(-remain) : '剩 '+fmt(remain);
    bwWrap.style.display = 'block';
  } else {
    document.getElementById('dashBudget').textContent = db.budget>0 ? '预算 ¥'+Math.round(db.budget).toLocaleString() : '未设置';
    bwWrap.style.display = 'none';
  }

  // 本月消费分类排行（Top5）
  const catsEl = document.getElementById('dashCats');
  const map = {};
  db.tx.filter(t=> t.type==='expense' && t.date.slice(0,7)===curMonth).forEach(t=>{
    map[t.cat] = (map[t.cat]||0) + (Number(t.amt)||0);
  });
  const cats = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if (cats.length) {
    const max = cats[0][1] || 1;
    catsEl.innerHTML = cats.map(([c,v])=>
      `<div class="cat-item"><span class="c-emoji">${getCatIcon(c)}</span>`+
      `<span class="c-name">${escapeHtml(c)}</span>`+
      `<span class="c-bar"><i style="width:${(v/max*100).toFixed(1)}%"></i></span>`+
      `<span class="c-val">${fmt(v)}</span></div>`).join('');
  } else catsEl.innerHTML = '<div class="empty" style="padding:8px;">本月暂无支出</div>';

  // 最近流水速览（全部最新5笔）
  const recEl = document.getElementById('dashRecent');
  const recent = [...db.tx].sort((a,b)=> b.date.localeCompare(a.date) || (Number(b.ts||0)-Number(a.ts||0))).slice(0,5);
  if (recent.length) {
    recEl.innerHTML = recent.map(t=>
      `<div class="r-item"><span class="r-emoji">${t.ic||getCatIcon(t.cat)}</span>`+
      `<div class="r-info"><div class="r-name">${escapeHtml(t.note||t.cat)}</div>`+
      `<div class="r-sub">${t.date} · ${escapeHtml(t.cat)}</div></div>`+
      `<span class="r-amt ${t.type==='income'?'inc':'exp'}">${t.type==='income'?'+':'-'}${fmt(t.amt).replace('¥','')}</span></div>`).join('');
  } else recEl.innerHTML = '<div class="empty" style="padding:8px;">暂无记录</div>';
}

function renderAll(){
  // 第九阶段：每月首次进入自动生成周期账单（需在统计前，影响月度消费）
  processRecurring();

  // 目标
  const paid = goalPaid();
  const total = db.goal.total;
  const pct = total>0 ? Math.min(100, paid/total*100) : 0;
  // 达标烟花：净资产已达到目标且本次达到峰值时触发一次
  if (total>0 && paid>=total && (window.__fwLast = window.__fwLast||0) < total) {
    window.__fwLast = total;
    celebrateGoal();
  }
  document.getElementById('goalName').textContent = (db.goal.name||'').trim() ? db.goal.name : '🎯 未设置目标';
  document.getElementById('goalProgressNum').textContent = pct.toFixed(1) + '%';
  document.getElementById('goalBar').style.width = pct + '%';
  document.getElementById('goalPaid').textContent = '已攒 ' + fmt(paid);
  document.getElementById('goalTotal').textContent = '目标 ' + fmt(total);
  const need = Math.max(0, total - paid);
  document.getElementById('goalNeed').textContent = fmt(need);

  // 预估攒够时间（储蓄率）：精算到具体日期
  const inc = monthIncome(), exp = monthExpense();
  const monthlySave = inc - exp;
  let months = 0;
  if (monthlySave > 0) months = need / monthlySave;
  const noData = (inc <= 0 && exp <= 0);
  if (months > 0) {
    const yrs = Math.floor(months / 12);
    const remMonths = Math.round(months % 12);
    document.getElementById('goalYears').textContent = (yrs>0 ? yrs+'年' : '') + (remMonths>0 ? remMonths+'个月' : (yrs>0?'':'<1个月')) || months.toFixed(1)+'个月';
    document.getElementById('goalMonths').textContent = months.toFixed(1)+' 个月';
  } else {
    const s = need<=0?'已达标':(noData?'先记收入':'—');
    document.getElementById('goalYears').textContent = s;
    document.getElementById('goalMonths').textContent = s;
  }
  if (months > 0) {
    // 精算：今天 + 所需月份数 → 具体年月日
    const now = new Date();
    const totalDays = Math.ceil(months * 30.4375); // 平均每月天数
    const d = new Date(now);
    d.setDate(d.getDate() + totalDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    document.getElementById('goalDate').textContent = yyyy+'-'+mm+'-'+dd;
  } else {
    document.getElementById('goalDate').textContent = '—';
  }

  // 记账列表（当前月，可筛选）
  let monthTx = db.tx.filter(t=> t.date.slice(0,7)===curMonth);
  const fType = document.getElementById('fType').value;
  const fCat  = document.getElementById('fCat').value;
  const fQ    = (document.getElementById('fQ').value||'').toLowerCase().trim();
  if (fType !== 'all') monthTx = monthTx.filter(t=> t.type===fType);
  if (fCat !== 'all')  monthTx = monthTx.filter(t=> t.cat===fCat);
  if (fQ) monthTx = monthTx.filter(t=> (t.note||'').toLowerCase().includes(fQ) || (t.cat||'').toLowerCase().includes(fQ));
  const el = document.getElementById('txList');
  const empty = fQ ? '没有匹配的记录' : '本月暂无记录，记一笔吧';
  el.innerHTML = monthTx.length ? monthTx.map((t,i)=>`
    <div class="swipe-wrap" style="margin-bottom:0;">
      <button class="swipe-delete" data-id="${t.id}" aria-label="删除">🗑<br>删除</button>
      <div class="swipe-zone">
        <div class="item" style="animation-delay:${Math.min(i*30,240)}ms">
          <div class="left">
            <span class="emoji">${t.ic || getCatIcon(t.cat)}</span>
            <div>
              <div class="name">${t.note} <span style="font-size:11px;color:var(--text-dim)">· ${t.cat}</span></div>
              <div class="sub">${t.date}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="amt ${t.type==='income'?'green':'red'}">${t.type==='income'?'+':'-'}${fmt(t.amt).replace('¥','')}</span>
            <button class="del" onclick="editTx('${t.id}')">✎</button>
            <button class="del" onclick="delTx('${t.id}')">✕</button>
          </div>
        </div>
      </div>
    </div>`).join('') : `<div class="empty">${empty}</div>`;
  renderMonthTags();
  renderListFilters();

  // 月度统计
  document.getElementById('mIncome').textContent = fmt(inc);
  document.getElementById('mExpense').textContent = fmt(exp);
  document.getElementById('mNet').textContent = fmt(inc-exp, (inc-exp)>=0?'¥':'-¥').replace('--','-');
  const rate = inc>0 ? (monthlySave/inc*100) : 0;
  document.getElementById('saveRate').textContent = rate.toFixed(1) + '%';

  renderChart();
  renderCatRanking();
  renderTopSpending();
  renderDonut();
  renderYearSummary();
  renderMonthCompare();      // 第五阶段：月度对比
  renderNetTrend();          // 第五阶段：净资产增长趋势
  renderDash();              // 第八阶段：数据仪表盘（首页聚合总览）
  renderQuickTpl();          // 第九阶段：快捷模板
  renderRecurring();         // 第九阶段：周期性支出

  // 收入列表
  document.getElementById('incomeList').innerHTML = db.incomes.length ? db.incomes.map((i,idx)=>{
    const on = (i.enabled !== false);
    const period = (i.start||'') ? ((i.start||'?') + ' ~ ' + (i.end||'至今')) : '';
    return `<div class="item" style="${on?'':'opacity:.45;'}animation-delay:${Math.min(idx*30,240)}ms">
      <div class="left"><span class="emoji">💼</span><div>
        <div class="name">${i.type}${on?'':'（停用）'}</div><div class="sub">每月固定${period?' · '+period:''}</div>
      </div></div>
      <div style="display:flex;align-items:center;gap:10px;">
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--text-dim);cursor:pointer;" title="启用/停用">
          <input type="checkbox" ${on?'checked':''} onchange="toggleIncome('${i.id}')" style="accent-color:var(--gold-light,#f5b942);">
          启用
        </label>
        <span class="amt green">+${fmt(i.amt).replace('¥','')}</span>
        <button class="del" onclick="delIncome('${i.id}')">✕</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">暂无固定收入</div>';

  // 预算
  const bw = document.getElementById('budgetWarn');
  if (db.budget > 0) {
    const remain = db.budget - exp;
    const pct = db.budget>0 ? exp/db.budget*100 : 100;
    if (remain < 0) {
      bw.innerHTML = `<div class="warn">⚠️ 已超支 ${fmt(-remain)}，本月要省着点啦！</div>`;
    } else if (pct >= 80) {
      bw.innerHTML = `<div class="warn" style="background:rgba(251,146,60,.12);border-color:rgba(251,146,60,.4);color:var(--danger)">⚠️ 预算已用 ${pct.toFixed(0)}%，只剩 ${fmt(remain)}，注意控制</div>`;
    } else if (remain < db.budget * 0.2) {
      bw.innerHTML = `<div class="warn">⚠️ 预算仅剩 ${fmt(remain)}，快超支了</div>`;
    } else {
      bw.innerHTML = `<div class="warn" style="background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.3);color:var(--green)">✅ 预算内，还剩 ${fmt(remain)}</div>`;
    }
    document.getElementById('budgetStatus').textContent = `本月消费上限 ¥${db.budget.toLocaleString()} · 已消费 ¥${exp.toLocaleString()}`;
    document.getElementById('budgetStatus').style.color = 'var(--text-dim)';
  } else {
    bw.innerHTML = '';
    document.getElementById('budgetStatus').textContent = '未设置预算';
  }

  // 资产
  document.getElementById('assetTotal').textContent = fmt(totalAssets());
  document.getElementById('debtTotal').textContent = fmt(totalDebts());
  document.getElementById('netAsset').textContent = fmt(netAssets());
  document.getElementById('assetList').innerHTML = db.assets.length ? db.assets.map(a=>{
    const rates = a.rate ? `<div class="meta">利率 ${a.rate}%/年 ${a.due?'· 到期 '+a.due:''}</div>` : (a.due?`<div class="meta">到期 ${a.due}</div>`:'');
    return `<div class="asset-card">
      <span class="type-badge ${assetBadge(a.type)}">${assetLabel(a.type)} · ${a.cur}</span>
      <div class="name" style="font-weight:600;">${a.name}</div>
      <div class="val">${curSymbol(a.cur)}${Number(a.amt).toLocaleString()}</div>
      <div class="meta">≈ ${fmt(toCny(a.cur,a.amt))}</div>
      ${rates}
      <button class="del" onclick="delAsset('${a.id}')">✕ 删除</button>
    </div>`;
  }).join('') : '<div class="empty">暂无资产账户，添加一个吧</div>';

  // 负债列表
  document.getElementById('debtList').innerHTML = db.debts.length ? db.debts.map((d,idx)=>`
    <div class="item" style="animation-delay:${Math.min(idx*30,240)}ms">
      <div class="left"><span class="emoji">📉</span><div>
        <div class="name">${d.name}</div><div class="sub">${debtPayoffText(d)}</div>
      </div></div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="amt red">-${fmt(d.amt).replace('¥','')}</span>
        <button class="del" onclick="delDebt('${d.id}')">✕</button>
      </div>
    </div>`).join('') : '<div class="empty">暂无负债，财务状况健康 🎉</div>';

  // 社保/保险
  document.getElementById('siList').innerHTML = db.social.length ? db.social.map((s,idx)=>`
    <div class="item" style="animation-delay:${Math.min(idx*30,240)}ms">
      <div class="left"><span class="emoji">🛡️</span><div>
        <div class="name">${s.name}</div>
        <div class="sub">已缴 ${s.months} 年 · 月缴/分红 ${fmt(s.amt)}</div>
      </div></div>
      <button class="del" onclick="delSI('${s.id}')">✕</button>
    </div>`).join('') : '<div class="empty">暂无社保/保险记录</div>';
}

// ---------- 数据备份（导出/导入） ----------
function exportData(){
  const json = JSON.stringify(db, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  const name = '财库备份_' + d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') + '.json';
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toastShow('✅ 备份已导出：'+name,'success');
}

function importData(ev){
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const data = JSON.parse(e.target.result);
      if (!data.goal && !data.assets) throw new Error('不是财库备份文件');
      if (!confirm('导入将覆盖当前所有数据，确定吗？')) { ev.target.value=''; return; }
      db = Object.assign(defaultData(), data);
      save();
      toastShow('✅ 导入成功！数据已恢复。','success');
    } catch(err) {
      toastError('❌ 导入失败：' + (err && err.message));
    }
    ev.target.value = '';
  };
  reader.readAsText(file);
}

function resetAll(){
  if (!confirm('⚠️ 确定要清空全部数据吗？此操作不可恢复！\n建议先导出一份备份。')) return;
  db = defaultData();
  save();
}

// ---------- 多格式导出（CSV / Excel） ----------
function _triggerDownload(content, name, mime){
  const blob = new Blob(['\ufeff' + content], {type: mime}); // 加 BOM，Excel/首列中文不乱码
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function _csvEsc(v){
  const s = String(v == null ? '' : v);
  return (/[,"\n]/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// 生成账本（交易）CSV 表格数据：[[表头], [行...]]
function _txTable(){
  const rows = db.tx.slice().sort(function(a,b){ return (a.date||'').localeCompare(b.date||''); });
  const head = ['日期','类型','分类','备注','金额'];
  const body = rows.map(function(t){
    return [t.date||'', t.type==='income' ? '收入' : '支出', getCatIcon(t.cat)+' '+t.cat, t.note||'', t.amt==null ? '' : +t.amt];
  });
  return [head].concat(body);
}

function exportDataCSV(){
  const rows = _txTable();
  const csv = rows.map(function(r){ return r.map(_csvEsc).join(','); }).join('\r\n');
  const d = new Date();
  const name = '财库账本_' + d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') + '.csv';
  _triggerDownload(csv, name, 'text/csv;charset=utf-8');
  toastShow('✅ 已导出 CSV（共 ' + (rows.length-1) + ' 条账目）：' + name,'success',3500);
}

function exportDataExcel(){
  // 生成含两个 Sheet 的 HTML 表格，保存为 .xls（Excel/WPS 均兼容打开）
  const d = new Date();
  const dateStr = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const txRows = _txTable();
  const assetRows = [
    ['类型','名称','币种','金额','年利率%','到期/备注']
  ].concat((db.assets||[]).map(function(a){ return [a.type||'', a.name||'', a.cur||'CNY', a.amt==null?'':+a.amt, a.rate==null?'':a.rate, a.due||a.note||'']; }));
  const html =
    '<html xmlns:x="urn:schemas-microsoft-com:office:spreadsheet"><head><meta charset="utf-8"></head><body>' +
    "<table border=\"1\"><caption>📒 账本明细（" + dateStr + "）</caption>" +
    txRows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td>'+String(c==null?'':c)+'</td>'; }).join('') + '</tr>'; }).join('') +
    "</table><br/>" +
    "<table border=\"1\"><caption>🏦 资产账户（" + dateStr + "）</caption>" +
    assetRows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td>'+String(c==null?'':c)+'</td>'; }).join('') + '</tr>'; }).join('') +
    "</table></body></html>";
  const name = '财库账本_' + dateStr + '.xls';
  _triggerDownload(html, name, 'application/vnd.ms-excel;charset=utf-8');
  toastShow('✅ 已导出 Excel（账本 ' + (txRows.length-1) + ' 条 + 资产 ' + (assetRows.length-1) + ' 条）：' + name,'success',3500);
}

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', renderAll);
window.exportData = exportData;
window.exportDataCSV = exportDataCSV;
window.exportDataExcel = exportDataExcel;
window.importData = importData;
window.resetAll = resetAll;
window.switchMonth = switchMonth;
window.shiftMonth = shiftMonth;
window.setGoal = setGoal;
window.addTx = addTx;
window.editTx = editTx;
window.saveEditTx = saveEditTx;
window.closeEditModal = closeEditModal;
window.renderListFilters = renderListFilters;
window.delTx = delTx;
window.addIncome = addIncome;
window.delIncome = delIncome;
window.setBudget = setBudget;
window.saveFx = saveFx;
window.addDebt = addDebt;
window.delDebt = delDebt;
window.addAsset = addAsset;
window.delAsset = delAsset;
window.addSI = addSI;
window.delSI = delSI;
window.restoreBackup = restoreBackup;
window.celebrateGoal = celebrateGoal;
window.openEmojiPicker = openEmojiPicker;
window.closeEmojiPicker = closeEmojiPicker;
window.pickEmoji = pickEmoji;
window.escapeHtml = escapeHtml;   // 第五阶段修复：全局暴露
window.renderMonthCompare = renderMonthCompare;   // 第五阶段
window.renderNetTrend = renderNetTrend;           // 第五阶段

// ---------- 底部 Tab 切换 ----------
function moveTabSlider(){
  var slider = document.getElementById('tabSlider');
  if (!slider) return;
  var active = document.querySelector('.tabbar .tab-btn.active');
  if (!active) return;
  var rect = active.getBoundingClientRect();
  var bar = document.getElementById('tabbar');
  var barRect = bar.getBoundingClientRect();
  slider.style.left = (rect.left - barRect.left) + 'px';
  slider.style.width = rect.width + 'px';
}
function switchTab(name){
  document.querySelectorAll('.tab-btn').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-tab') === name);
  });
  document.querySelectorAll('.panel').forEach(function(p){
    p.classList.toggle('active', p.getAttribute('id') === 'tab-' + name);
  });
  moveTabSlider();
}
window.switchTab = switchTab;
window.moveTabSlider = moveTabSlider;
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.tab-btn').forEach(function(b){
    b.addEventListener('click', function(){ switchTab(b.getAttribute('data-tab')); });
  });
  // 恢复上次所在的 Tab（默认第一个）
  var saved = localStorage.getItem(DB_KEY + '_tab') || 'save';
  if (saved) switchTab(saved);
  requestAnimationFrame(moveTabSlider);
  window.addEventListener('resize', moveTabSlider);
  // Emoji 选择器网格点击委托
  var egrid = document.getElementById('emojiGrid');
  if (egrid) {
    egrid.addEventListener('click', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest('.ep-item') : null;
      if (t) pickEmoji(parseInt(t.getAttribute('data-i'), 10));
    });
  }
  document.querySelectorAll('.tab-btn').forEach(function(b){
    b.addEventListener('click', function(){
      localStorage.setItem(DB_KEY + '_tab', b.getAttribute('data-tab'));
    });
  });
});

// ---------- 数字滚动浮现动效（纯视觉，零侵入渲染逻辑） ----------
(function () {
  var NUM_IDS = [
    'goalProgressNum','goalPaid','goalTotal','goalNeed','goalMonths','goalDate',
    'mIncome','mExpense','mNet','saveRate',
    'assetTotal','debtTotal','netAsset'
  ];
  var els = [];
  (NUM_IDS).forEach(function (id) { var e = document.getElementById(id); if (e) els.push(e); });

  // 触发一次上浮浮现动效
  function pop(el) {
    el.classList.remove('num-pop');
    // 强制重排以重启动画
    void el.offsetWidth;
    el.classList.add('num-pop');
  }

  // 首次渲染时给已有数字一个入场动效
  window.addEventListener('DOMContentLoaded', function () {
    els.forEach(function (e) { setTimeout(function(){ pop(e); }, 60); });
  });

  // 监听数字变化：渲染更新时自动触发滚动浮现
  var obs = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      if (m.type === 'characterData' && m.target.parentNode) {
        pop(m.target.parentNode);
      } else if (m.type === 'childList') {
        m.addedNodes.forEach(function (n) {
          if (n && n.nodeType === 3 && n.parentNode) pop(n.parentNode);
        });
      }
    });
  });
  els.forEach(function (e) {
    obs.observe(e, { childList: true, characterData: true, subtree: true });
  });
})();

// =====================================================
// PIN 隐私锁（第七阶段）
// 独立存储 key，不上传；PIN 加盐 hash 存储（非明文）
// =====================================================
(function () {
  var PIN_KEY   = 'wealth_pin';     // 存 {s:盐, h:hash}
  var PIN_ON    = 'wealth_pin_on';  // '1' = 启用锁屏
  var SALT      = 'w0ulth7';        // 固定盐（客户端混淆，非密码学安全）

  // 简单确定性 hash（1次循环即可，不够安全。为更稳妥用两轮 + 盐）
  function hashPin(pin) {
    var h = 2166136261 >>> 0;      // FNV-1a 起点
    var seed = (SALT + ':' + pin + ':' + SALT);
    for (var i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // 第二遍再加随机感
    h = (h ^ (h >>> 13));
    h = Math.imul(h, 0x5bd1e995);
    h = h ^ (h >>> 15);
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  function isPinSet()   { return !!localStorage.getItem(PIN_KEY); }
  function isPinOn()    { return localStorage.getItem(PIN_ON) === '1'; }
  function savedHash()  { try { return JSON.parse(localStorage.getItem(PIN_KEY)).h; } catch(e){ return null; } }

  // 当前锁屏输入缓冲
  var buf = '';

  function renderDots() {
    for (var i = 1; i <= 6; i++) {
      var el = document.getElementById('pinDot' + i);
      if (el) el.classList.toggle('filled', i <= buf.length);
    }
  }
  function clearHint() { var h = document.getElementById('pinLockHint'); if (h) h.textContent = ''; }
  function fail(msg) {
    var h = document.getElementById('pinLockHint');
    if (h) h.textContent = msg || 'PIN 错误，请重试';
    buf = ''; renderDots();
    setTimeout(clearHint, 1600);
  }

  // 打开锁屏浮层
  function showLock() {
    buf = ''; renderDots(); clearHint();
    var el = document.getElementById('pinLock');
    if (el) el.classList.add('show');
  }
  function hideLock() {
    var el = document.getElementById('pinLock');
    if (el) el.classList.remove('show');
  }

  // 锁屏数字键盘
  window.pinKey = function (n) {
    if (buf.length >= 6) return;
    buf += String(n); renderDots();
  };
  window.pinKeyClear = function () {
    buf = buf.slice(0, -1); renderDots();
  };
  window.pinKeyOk = function () {
    if (buf.length === 0) return;
    if (hashPin(buf) === savedHash()) { hideLock(); }
    else { fail('PIN 错误，请重试'); }
  };

  // 更新管理卡片状态
  function renderPinPanel() {
    var tg = document.getElementById('pinToggle');
    if (tg) tg.checked = isPinOn();
    var st = document.getElementById('pinStatus');
    if (!st) return;
    if (!isPinSet()) {
      st.textContent = '⚠️ 尚未设置 PIN，请先「设置/修改 PIN」再开启锁定。';
      st.style.color = 'var(--red)';
    } else if (isPinOn()) {
      st.textContent = '✅ 锁屏保护已开启：每次打开本页需输入 PIN。';
      st.style.color = 'var(--green)';
    } else {
      st.textContent = '🔒 已设置 PIN，但锁屏保护未开启。';
      st.style.color = 'var(--gold-light)';
    }
  }

  // 设置/修改 PIN
  window.openPinSetup = function () {
    var old = isPinSet() ? (prompt('当前已设 PIN，请输入原 PIN 以修改：') || '') : '';
    if (isPinSet() && hashPin(old) !== savedHash()) {
      if (old !== '') { toastError('原 PIN 不正确，无法修改。'); return; }
    }
    var p1 = prompt('设置 PIN（4~6 位数字）：');
    if (p1 === null) return;
    p1 = (p1 || '').replace(/\D/g, '');
    if (p1.length < 4 || p1.length > 6) { toastError('PIN 需为 4~6 位数字。'); return; }
    var p2 = prompt('请再次输入确认：');
    if (p2 !== p1) { toastError('两次输入不一致，未保存。'); return; }
    localStorage.setItem(PIN_KEY, JSON.stringify({ s: SALT, h: hashPin(p1) }));
    toastShow('✅ PIN 已设置/更新成功。','success');
    renderPinPanel();
  };

  // 开关锁屏
  window.togglePinLock = function (on) {
    var tg = document.getElementById('pinToggle');
    if (on && !isPinSet()) {
      toastShow('请先「设置/修改 PIN」，再开启锁屏保护。','info');
      if (tg) tg.checked = false;
      return;
    }
    localStorage.setItem(PIN_ON, on ? '1' : '0');
    if (on) toastShow('🔒 锁屏保护已开启。下次打开本页将要求输入 PIN。','success');
    else    toastShow('🔓 锁屏保护已关闭。','info');
    renderPinPanel();
  };

  // 页面加载：若启用锁屏，先锁住，等输对再显示
  document.addEventListener('DOMContentLoaded', function () {
    renderPinPanel();
    if (isPinOn() && isPinSet()) {
      showLock();
      // 锁屏优先：锁定期间点击任意数字外区域不关闭；进入后正常渲染在遮罩后
      renderAll();
    }
  });

  // 供外部刷新面板（如数据 Tab 每次进入时）
  window.refreshPinPanel = renderPinPanel;
})();

// =====================================================
// 明/暗主题切换（第十阶段）
// 默认深色；可手动切换，持久化到 localStorage，未设置时跟随系统
// =====================================================
(function () {
  var THEME_KEY = 'wealth_theme';      // 'light' | 'dark' | ''(跟随系统)

  function applyTheme(theme) {
    var body = document.body;
    if (theme === 'light') body.setAttribute('data-theme', 'light');
    else body.removeAttribute('data-theme');  // 深色为默认（无属性）
    var ic = document.getElementById('themeIcon');
    if (ic) ic.textContent = (theme === 'light') ? '🌙' : '☀️';
    // 重新画一下粒子/渲染，保证主题刷新后视觉一致
    if (typeof renderAll === 'function' && document.readyState === 'complete') { /* 不强制整体重渲染，静默即可 */ }
  }

  // 解析当前应生效主题：手动偏好 > 系统偏好
  function resolveTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // 跟随系统
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  // 窗口级切换（供按钮 onclick 调用）
  window.toggleTheme = function () {
    var current = resolveTheme();
    var next = (current === 'dark') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);   // 手动切换后记为用户显式偏好
    applyTheme(next);
  };

  // 初始化：跟随系统时，若系统明暗变化自动切换
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () {
      // 仅在用户未手动指定偏好时跟随系统
      var saved = localStorage.getItem(THEME_KEY);
      if (saved !== 'light' && saved !== 'dark') applyTheme(resolveTheme());
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  // DOM 就绪后应用主题
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyTheme(resolveTheme()); });
  } else {
    applyTheme(resolveTheme());
  }
  window.applyTheme = applyTheme;
  window.resolveTheme = resolveTheme;
})();

// ============================================================
// 第十二阶段·交互动效（按钮涟漪 / 数字跳动 / 左滑删除 / 下拉刷新 / 骨架屏）
// 全部为纯视觉增强，零侵入数据逻辑，均挂 window 方便 e2e 断言
// ============================================================
(function () {
  var RIPPLE_KEY = 'wealth_ripple_on';
  function isTouch() { return (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) || 'ontouchstart' in window; }

  // ---------- 1. 按钮涟漪水波纹（Material Design） ----------
  function spawnRipple(btn, x, y) {
    if (!btn || btn.classList.contains('swipe-delete')) return;
    btn.classList.add('ripple-js');
    btn.style.position = (getComputedStyle(btn).position === 'static') ? 'relative' : ''; // 不强制，tab-btn.mn-btn 是 static
    btn.style.overflow = 'hidden';
    var rect = btn.getBoundingClientRect();
    var ink = document.createElement('span');
    ink.className = 'ripple-ink';
    var d = Math.max(rect.width, rect.height);
    ink.style.width = ink.style.height = d + 'px';
    ink.style.left = (x - rect.left - d / 2) + 'px';
    ink.style.top  = (y - rect.top  - d / 2) + 'px';
    btn.appendChild(ink);
    setTimeout(function () { if (ink.parentNode) ink.parentNode.removeChild(ink); }, 620);
  }
  document.addEventListener('pointerdown', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('.ripple-js') : null;
    if (!t) return;
    spawnRipple(t, ev.clientX, ev.clientY);
  }, { passive: true });
  // 兼容旧浏览器（无 pointerdown）
  if (!window.PointerEvent) {
    document.addEventListener('mousedown', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest('.ripple-js') : null;
      if (t) spawnRipple(t, ev.clientX, ev.clientY);
    });
  }

  // ---------- 2. 数字跳动：滚动计数 + 完成后上下弹跳缩放 ----------
  // 因观察者写入会导致渲染器过载崩溃，改用「无重入」方案：
  //   - 用 setInterval 轮询元素值，检测到变化才播放动画（不做见 observer，故无反馈循环）
  //   - 滚动计数为有界有限步数（定时器驱动，不逐帧观察），完成后弹跳缩放
  var EXP_NUM = /[\d.,]+/;
  function parseNum(text) {
    var digits = String(text == null ? '' : text).replace(/[^0-9.]/g, '');
    if (!digits) return null;
    var n = parseFloat(digits);
    return isFinite(n) ? n : null;
  }
  function applyBounce(el) {
    el.classList.remove('num-bounce');
    void el.offsetWidth;
    el.classList.add('num-bounce');
  }
  // 有界滚动计数：定时定点（STEPS 次），完成后弹跳
  function rollCount(el, from, to, rawFormat) {
    var STEPS = 16, i = 0;
    var id = (el.id || '_g') + '_r';
    if (window._rollMap && window._rollMap[id]) return;   // 已在滚动
    window._rollMap = window._rollMap || {};
    window._rollMap[id] = true;
    var raw = String(rawFormat);
    var ev = window._rollEv = window._rollEv || {};
    var timer = setInterval(function () {
      i++;
      var p = Math.min(1, i / STEPS);
      var ease = 1 - Math.pow(1 - p, 3);
      var cur = from + (to - from) * ease;
      el.textContent = raw.replace(EXP_NUM, Math.round(cur).toLocaleString('en-US'));
      if (p >= 1) {
        clearInterval(timer);
        el.textContent = raw;              // 最终值
        delete window._rollMap[id];
        applyBounce(el);
      }
    }, 26);   // 16 步 × 26ms ≈ 416ms
  }
  var NUM_IDS2 = [
    'goalProgressNum','goalPaid','goalTotal','goalNeed','mIncome','mExpense','mNet',
    'assetTotal','debtTotal','netAsset'
  ];
  var numEls = [];
  NUM_IDS2.forEach(function (id) { var e = document.getElementById(id); if (e) numEls.push(e); });
  numEls.forEach(function (e) { e.classList.add('num-count'); });
  var _lastNumVal = {};
  // 初入时弹跳一次
  window.addEventListener('DOMContentLoaded', function () {
    numEls.forEach(function (e) { _lastNumVal[e.id] = parseNum(e.textContent); });
    numEls.forEach(function (e, i) {
      setTimeout(function () {
        var text = e.textContent;
        if (String(text).indexOf('%') === -1) { applyBounce(e); }
        else { applyBounce(e); }
      }, 80 + i * 40);
    });
  });
  // 无重入轮询：每 500ms 检查各数字是否变化，变化则播放动画
  setInterval(function () {
    numEls.forEach(function (e) {
      var text = e.textContent;
      var isRated = (e.id === 'saveRate' || String(text).indexOf('%') > -1);
      var newNum = parseNum(text);
      var oldNum = _lastNumVal[e.id] != null ? _lastNumVal[e.id] : newNum;
      if (newNum != null && oldNum != null && Math.abs(newNum - oldNum) > 0.15 && !isRated) {
        _lastNumVal[e.id] = newNum;
        rollCount(e, oldNum, newNum, text);
      } else if (newNum != null && Math.abs((newNum||0) - (oldNum||0)) > 0.001) {
        // 小变化：直接弹跳
        _lastNumVal[e.id] = newNum;
        applyBounce(e);
      }
    });
  }, 500);
  window._animateNum = function (el) { if (el) { applyBounce(el); } };
  window._rollNum = rollCount;

  // ---------- 3. 左滑删除（手机端） ----------
  function initSwipeDelete() {
    if (!isTouch()) return;   // 仅触屏设备
    var list = document.getElementById('txList');
    if (!list) return;
    var hint = document.getElementById('swipeHint');
    if (hint) hint.classList.add('show');
    var startX = null, startY = null, curItem = null;
    list.addEventListener('touchstart', function (ev) {
      var t = ev.changedTouches[0];
      var it = ev.target && ev.target.closest ? ev.target.closest('.swipe-wrap') : null;
      startX = t.clientX; startY = t.clientY; curItem = it;
    }, { passive: true });
    list.addEventListener('touchmove', function (ev) {
      if (!curItem) return;
      var it = curItem, zone = it.querySelector('.swipe-zone');
      if (!zone) return;
      var dx = ev.changedTouches[0].clientX - startX;
      if (dx < 0) zone.classList.add('open');
      else zone.classList.remove('open');
    }, { passive: true });
    // 点击删除
    list.addEventListener('click', function (ev) {
      var del = ev.target && ev.target.closest ? ev.target.closest('.swipe-delete') : null;
      if (!del) return;
      var id = del.getAttribute('data-id');
      if (id && typeof delTx === 'function') delTx(id);
    });
  }

  // ---------- 4. 下拉刷新（记账页） ----------
  function initPullRefresh() {
    var book = document.getElementById('tab-book');
    var indicator = document.getElementById('ptrIndicator');
    var ptrText = document.getElementById('ptrText');
    if (!book || !indicator || !ptrText) return;
    var pullY = 0, pulling = false;
    var lastY = null;
    function toast(msg, ms) {
      var t = document.getElementById('ptrToast');
      if (!t) return;
      t.textContent = msg || '✅ 已刷新';
      t.classList.add('show');
      clearTimeout(t._tm);
      t._tm = setTimeout(function () { t.classList.remove('show'); }, ms || 1400);
    }
    book.addEventListener('touchstart', function (ev) {
      if (window.scrollY > 4) return;
      if (book.scrollTop > 0) return;
      lastY = ev.changedTouches[0].clientY; pulling = true; pullY = 0;
    }, { passive: true });
    book.addEventListener('touchmove', function (ev) {
      if (!pulling || lastY == null) return;
      var dy = ev.changedTouches[0].clientY - lastY;
      if (dy > 0 && window.scrollY <= 0 && book.scrollTop <= 0) {
        pullY = dy;
        if (pullY > 10) indicator.classList.add('pull');
        ptrText.textContent = pullY > 60 ? '释放刷新' : '下拉刷新';
        ev.preventDefault && ev.preventDefault();
      }
    }, { passive: false });
    book.addEventListener('touchend', function () {
      if (pulling && pullY > 60) {
        indicator.classList.add('pull');
        ptrText.textContent = '刷新中…';
        setTimeout(function () {
          if (typeof renderAll === 'function') renderAll();
          indicator.classList.remove('pull');
          pullY = 0;
          toast('✅ 已刷新');
        }, 500);
      } else {
        indicator.classList.remove('pull');
        pullY = 0;
      }
      pulling = false; lastY = null;
    }, { passive: true });
    window._ptrToast = toast;
  }

  // ---------- 5. 图表骨架屏（400ms 淡出） ----------
  function skeletonInto(container, renderFn) {
    if (!container) return;
    // 已包裹过则跳过
    if (container.getAttribute('data-skeleton') === '1') return;
    container.setAttribute('data-skeleton', '1');
    var origHTML = container.innerHTML;
    var sk = document.createElement('div');
    sk.className = 'chart-skeleton';
    sk.innerHTML =
      '<div class="sk-col"><div class="sk-bar a"></div><div class="sk-bar b"></div></div>' +
      '<div class="sk-col"><div class="sk-bar c"></div><div class="sk-bar d"></div></div>' +
      '<div class="sk-col"><div class="sk-bar b"></div><div class="sk-bar e"></div></div>' +
      '<div class="sk-col"><div class="sk-bar d"></div><div class="sk-bar a"></div></div>' +
      '<div class="sk-col"><div class="sk-bar e"></div><div class="sk-bar c"></div></div>' +
      '<div class="sk-col"><div class="sk-bar a"></div><div class="sk-bar d"></div></div>';
    container.innerHTML = '';
    container.appendChild(sk);
    setTimeout(function () {
      sk.classList.add('fade-out');
      setTimeout(function () {
        container.innerHTML = origHTML;
        container.removeAttribute('data-skeleton');
        // 重新渲染真实图表
        if (renderFn) renderFn();
      }, 420);
    }, 400);
  }

  // 初次进入数据 Tab 时对图表做骨架屏
  var firstDataTab = true;
  var origSwitch = window.switchTab;
  window.switchTab = function (name) {
    if (name === 'data' && firstDataTab) {
      firstDataTab = false;
      var mc = document.getElementById('monthChart');
      var orig = window.renderChart;
      // 先展示骨架，400ms 后再渲染真实
      if (mc && mc.querySelector === undefined) {}
      skeletonInto(mc, orig);
    }
    if (typeof origSwitch === 'function') return origSwitch(name);
  };
  window._skeletonInto = skeletonInto;

  // DOM 就绪初始化
  document.addEventListener('DOMContentLoaded', function () {
    initSwipeDelete();
    initPullRefresh();
  });
})();

// =====================================================================
// 第十六阶段：PWA 应用化
//   - manifest.json（应用配置）+ sw.js（Service Worker 离线缓存）
//   - 注册 Service Worker + 在线/离线状态提示
//   - 系统通知（预算超支 / 目标达成）
//   - 添加到桌面安装引导（A2HS）
// =====================================================================
(function () {
  // 仅 HTTPS 或 localhost 才可注册 SW（浏览器安全要求）
  if (!('serviceWorker' in navigator) ||
      location.protocol !== 'https:' && !/^localhost$|^127\./.test(location.hostname)) return;

  /* ---------- 3. 注册 Service Worker + 离线状态提示 ---------- */
  var swOK = false;
  function registerSW(){
    return navigator.serviceWorker.register('./sw.js')
      .then(function (reg) {
        swOK = true;
        window.__pwaSWReady = true;
        return reg;
      })
      .catch(function () { /* 注册失败静默，不影响主功能 */ });
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }

  // 在线 / 离线浮标（左上角小胶囊）
  function ensureOfflineBadge(){
    var b = document.getElementById('netBadge');
    if (!b){
      b = document.createElement('div');
      b.id = 'netBadge';
      b.className = 'net-badge';
      b.textContent = '离线模式';
      document.body.appendChild(b);
    }
    return b;
  }
  function setOnline(state){
    var b = ensureOfflineBadge();
    b.classList.toggle('show', !state);
    if (typeof toastShow === 'function') {
      toastShow(state ? '📶 已恢复联网' : '📴 已进入离线模式', 'info');
    }
  }
  // 初始状态 + 监听变化
  window.addEventListener('online', function(){ setOnline(true); });
  window.addEventListener('offline', function(){ setOnline(false); });
  if (navigator.onLine === false) setOnline(false);
  // 供 e2e / 手动控制
  window.__setOnline = setOnline;

  /* ---------- 4. 系统通知（预算超支 / 目标达成） ---------- */
  // 发送通知：优先 serviceWorker postMessage，无 SW 时退化为页面内 Toast
  function notify(title, body, tab, tagname){
    var tag = tagname || ('wealth-' + Date.now());
    if (swOK && navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'NOTIFY',
          payload: { title: title, body: body, tag: tag, tab: tab || null }
        });
        return true;
      } catch(e){}
    }
    // 兜底：页面内 Toast
    if (typeof toastShow === 'function') toastShow(title + ' ' + body, tab === 'data' ? 'error' : 'success', 3500);
    return false;
  }
  // 权限请求 + 就绪回调（供 save/celebrateGoal 触发时复用）
  var _notifPerm = null;
  function ensureNotifPerm(cb){
    if (!('Notification' in window)) { if (cb) cb(false); return; }
    if (Notification.permission === 'granted') { if (cb) cb(true); return; }
    if (_notifPerm) { if (cb && _notifPerm) { _notifPerm.then(function(p){ cb(p); }); } return; }
    _notifPerm = Notification.requestPermission().then(function (p){ if (cb) cb(p === 'granted'); return p === 'granted'; });
  }
  // 预算超支通知：新增/复发超支时提示
  var __budgetNotifLast = null;
  function notifyBudgetTransient(s){
    if (!s || !s.over) return;
    var key = String(db.budget) + '|' + s.pct.toFixed(1);
    // 同预算同比例只提醒一次（防每次 save 都刷屏）
    if (__budgetNotifLast === key) return;
    __budgetNotifLast = key;
    ensureNotifPerm(function (granted){
      if (!granted) return;
      notify('🚨 预算超支提醒', '本月已超支 ' + fmt(Math.max(0,-s.remain)), 'data', 'budget-over');
    });
  }
  // 目标达成通知：达标瞬间提醒一次
  var __goalNotified = false;
  function notifyGoalIfPaid(paid, total){
    if (!(total > 0) || paid < total) return;
    if (__goalNotified) return;   // 同会话只提醒一次
    __goalNotified = true;
    ensureNotifPerm(function (granted){
      if (!granted) return;
      notify('🎉 目标达成', '恭喜！攒钱目标「' + (db.goal.name || '') + '」已达成 🚀', 'save', 'goal-done');
    });
  }
  // 对外暴露（供保存流程挂接）：挂全局属性，celebrateGoal / syncBudgetAlert 已含对应逻辑时不再双发
  window.__pwaNotify = notify;
  window._notifyBudgetTransient = notifyBudgetTransient;
  window._notifyGoalIfPaid = notifyGoalIfPaid;
  // 暴露节流状态（供 e2e / 用户修改目标后重置）
  window.__goalNotifiedState = function(){ return __goalNotified; };
  window.__resetGoalNotified = function(){ __goalNotified = false; };

  /* ---------- 5. 安装引导（添加到桌面提示） ---------- */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    // 显示引导横幅
    showInstallBar();
  });
  function showInstallBar(){
    var bar = document.getElementById('installBar');
    if (!bar){
      bar = document.createElement('div');
      bar.id = 'installBar';
      bar.className = 'install-bar';
      bar.innerHTML =
        '<span>📲 将「我的财库」添加到桌面，随时使用？</span>' +
        '<button class="install-yes" onclick="window.__installNow()">添加</button>' +
        '<button class="install-no" onclick="window.__installDismiss()">暂不</button>';
      document.body.appendChild(bar);
    }
    bar.classList.add('show');
  }
  function dismissInstallBar(){
    var b = document.getElementById('installBar');
    if (b) b.classList.remove('show');
  }
  window.__installNow = function (){
    dismissInstallBar();
    if (!deferredPrompt) {
      if (typeof toastInfo === 'function') toastInfo('请使用浏览器菜单「添加到主屏幕」安装');
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      if (choice.outcome === 'accepted' && typeof toastSuccess === 'function') toastSuccess('✅ 已添加到主屏幕');
      else if (typeof toastInfo === 'function') toastInfo('已取消安装');
      deferredPrompt = null;
    });
  };
  window.__installDismiss = function (){
    dismissInstallBar();
    // 记录本次已忽略，2 天内不再打扰
    try { localStorage.setItem('wealth_inst_dismiss', String(Date.now())); } catch(e){}
    deferredPrompt = null;
  };
  // 已是独立窗口（已安装）则不打扰
  if (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true) {
    // 已安装，隐藏安装引导（若曾挂载）
    dismissInstallBar();
  }
})();

// 挂接：save() 内 renderAll + syncBudgetAlert 之后触发预算/目标系统通知
(function () {
  var origSync = window.syncBudgetAlert;
  if (typeof origSync === 'function') {
    window.syncBudgetAlert = function () {
      origSync();
      if (typeof window._notifyBudgetTransient === 'function') window._notifyBudgetTransient(window.__budgetState ? window.__budgetState() : null);
    };
  }
  var origCelebrate = window.celebrateGoal ? window.celebrateGoal : null;
  // 目标达成通知：接在 renderAll 的达标判定后——但 ensureNotifPerm 是异步请求权限，
  // 这里用节流标记防重复：仅在达标瞬间触发（celebrateGoal 已保证 peak 一次）
  var origRender = window.renderAll;
  if (typeof origRender === 'function') {
    window.renderAll = function () {
      origRender();
      if (typeof window._notifyGoalIfPaid === 'function') {
        // db 是全局 let，直接读
        try {
          var paid = (typeof goalPaid === 'function') ? goalPaid() : (window.goalPaid ? window.goalPaid() : 0);
          window._notifyGoalIfPaid(paid, db.goal.total);
        } catch(e){}
      }
      void origCelebrate;
    };
  }
})();
