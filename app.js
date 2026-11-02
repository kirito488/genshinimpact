import {REGIONS, DIMENSIONS, getRegion} from './data/regions.js';
import {CHARACTERS} from './data/characters.js';
import {QUESTIONS_WEST} from './data/questions-west.js';
import {QUESTIONS_EAST} from './data/questions-east.js';
import {QUESTIONS_NODKRAI} from './data/questions-nodkrai.js';
import {DATA_VERSION, isValidAnswer, scoreAnswers, matchCharacters, matchingReasons, restoreProgress, verifyKey} from './engine.js';
import {icon, landscape, atlas} from './art.js';

const QUESTIONS = {...QUESTIONS_WEST, ...QUESTIONS_EAST, ...QUESTIONS_NODKRAI};
const main = document.querySelector('#main');
const modal = document.querySelector('#modal');
const memory = new Map();
const unlocked = new Set();
let state = {screen:'home', region:null, answers:[], index:0, draft:null};
let toastTimer, storageWarned = false, openingElement;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regionStyle = r => `--accent:${r.accent};--region-dark:${r.dark}`;
const storageKey = id => `teyvat-journey-v${DATA_VERSION}-${id}`;

function readProgress(id) {
  let raw;
  try { raw = JSON.parse(localStorage.getItem(storageKey(id)) || 'null'); } catch { raw = null; }
  return restoreProgress(memory.get(id) || raw, id, QUESTIONS[id]);
}
function saveProgress() {
  if (!state.region) return;
  const progress = {version:DATA_VERSION, region:state.region.id, answers:state.answers, index:state.index, updatedAt:new Date().toISOString()};
  memory.set(state.region.id, JSON.parse(JSON.stringify(progress)));
  try { localStorage.setItem(storageKey(state.region.id), JSON.stringify(progress)); }
  catch { if (!storageWarned) { toast('此浏览器无法保存进度。请保持本页打开，完成本次旅程。'); storageWarned = true; } }
  updatePassportCount();
}
function updatePassportCount() {
  document.querySelector('#passport-count').textContent = `${REGIONS.filter(r => readProgress(r.id)?.complete).length} / 7`;
}
function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4500);
}
function focusHeading() {
  const heading = main.querySelector('h1') || main.querySelector('h2');
  if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }
}
function openModal(content, className = '') {
  openingElement = document.activeElement;
  modal.className = className;
  modal.innerHTML = `<button type="button" class="modal-close icon-button" data-action="close-modal" aria-label="关闭窗口">×</button>${content}`;
  if (!modal.open) modal.showModal();
}
function closeModal() {
  const wasGate = modal.classList.contains('gate-modal');
  modal.close();
  if (wasGate && !unlocked.has(state.region?.id)) location.hash = '#/';
  openingElement?.focus?.();
}
modal.addEventListener('cancel', event => { event.preventDefault(); closeModal(); });
modal.addEventListener('click', event => { if (event.target === modal) { const box = modal.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeModal(); } });

function home() {
  state.screen = 'home';
  main.innerHTML = `<section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="tiny-star">✧</span> 一封来自提瓦特的邀请</p><h1>走过七方风景，<br>遇见<span>另一个自己。</span></h1><p class="hero-description">如果你也生活在提瓦特，<br class="mobile-break">会与谁拥有相似的灵魂？<br>选一处心之所向，让每一次选择带你靠近答案。</p><a class="primary-button" href="#destinations" data-action="explore">开启我的旅程 ${icon('arrow')}</a><div class="hero-stats"><span><b>7</b> 个独立地区</span><i></i><span><b>350</b> 道原创题目</span><i></i><span><b>${CHARACTERS.length}</b> 位共鸣角色</span></div></div><div class="hero-map">${atlas(REGIONS)}<div class="map-caption"><span class="map-dot"></span> 心之所向，即是旅途的起点 <span>VOL. 02</span></div></div></section>
  <section class="destinations" id="destinations" aria-labelledby="destinations-title"><div class="section-heading"><div><p class="eyebrow">CHOOSE YOUR DESTINATION</p><h2 id="destinations-title">这一站，去哪里？</h2></div><p>${icon('lock')} 每个地区，开启一段独一无二的旅程</p></div><div class="region-grid">${REGIONS.map((r,i) => {
    const saved = readProgress(r.id), count = CHARACTERS.filter(c => c.region === r.id).length;
    const answered = saved?.answers.filter((a,j) => isValidAnswer(QUESTIONS[r.id][j],a)).length || 0;
    return `<a class="region-card" href="#/region/${r.id}" style="${regionStyle(r)}" aria-label="选择${r.name}，50道题，${count}位角色"><div class="region-art">${landscape(r)}<span class="card-number">0${i+1}</span><span class="region-emblem">${icon(r.icon)}</span>${saved ? `<span class="card-status">${saved.complete ? '旅程已完成' : `已探索 ${answered}/50`}</span>` : ''}</div><div class="region-card-copy"><div class="region-name"><h3>${r.name}</h3><span>${r.theme}</span></div><p class="region-english">${r.english}</p><p class="region-tagline">${r.subtitle}</p><div class="region-card-footer"><span>50 道题 <b>·</b> ${count} 位角色</span>${icon(saved ? 'arrow' : 'lock')}</div></div></a>`;
  }).join('')}<div class="journey-note"><span class="note-star">✧</span><h3>没有标准答案，<br>只有你的答案。</h3><p>大约 15–20 分钟<br>五个章节 · 五种答题方式<br>随时暂停，下次接着出发</p><button class="text-button" data-action="about">阅读旅行须知 ${icon('arrow')}</button></div></div></section>
  <section class="how-it-works"><div><span>01</span><p><b>选择你的目的地</b><small>用专属密钥开启地区</small></p></div>${icon('arrow')}<div><span>02</span><p><b>写下你的选择</b><small>收集五枚旅途印记</small></p></div>${icon('arrow')}<div><span>03</span><p><b>遇见共鸣的角色</b><small>解锁属于你的性格手册</small></p></div></section>`;
  document.title = '提瓦特心途 · 原神角色性格测试';
  updatePassportCount();
}

function gate(region) {
  openModal(`<div class="gate-art" style="${regionStyle(region)}">${landscape(region,'gate')}<div class="gate-emblem">${icon(region.icon)}</div></div><div class="modal-body"><p class="eyebrow">TRAVEL PERMIT · ${region.english}</p><h2 id="modal-title">下一站，${region.name}</h2><p class="muted">${region.description}</p><form id="key-form"><label for="region-key">请输入${region.name}专属密钥</label><div class="key-input-wrap">${icon('lock')}<input id="region-key" name="key" type="password" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="填写你的旅行密钥" required maxlength="80" aria-describedby="key-help key-error"><button type="button" class="text-button" data-action="toggle-key" aria-label="显示密钥">显示</button></div><p id="key-error" class="form-error" role="alert"></p><button class="primary-button full-width" type="submit">开启旅程 ${icon('arrow')}</button><p id="key-help" class="form-help">密钥由活动发起者提供，每个地区独立使用。</p></form></div>`, 'gate-modal');
  document.querySelector('#region-key').focus();
}

function intro() {
  const r = state.region, saved = readProgress(r.id), pool = CHARACTERS.filter(c => c.region === r.id);
  state.screen = 'intro';
  main.innerHTML = `<section class="region-intro" style="${regionStyle(r)}"><a class="back-link" href="#/">← 返回地区地图</a><div class="intro-layout"><div class="intro-cover">${landscape(r,'intro')}<span class="intro-symbol">${icon(r.icon)}</span><div><p>${r.english}</p><h2>${r.name}</h2><span>${r.theme} · 旅行篇章</span></div></div><div class="intro-copy"><p class="eyebrow">YOUR JOURNEY BEGINS HERE</p><h1>${r.subtitle}</h1><p class="muted">${r.description}</p><div class="intro-pills"><span>50 次选择</span><span>5 枚印记</span><span>${pool.length} 位角色</span></div><ol class="chapter-preview">${r.chapters.map((c,i)=>`<li><span>0${i+1}</span>${c}<small>10 道题</small></li>`).join('')}</ol><p class="gentle-note">没有答题时限，也不考验游戏知识。选你真实会做的事就好。</p><button class="primary-button" data-action="start">${saved ? (saved.complete ? '打开我的角色手册' : `继续旅程 · 第 ${saved.index+1} 题`) : '领取委托，出发'} ${icon('arrow')}</button>${saved ? '<button class="text-button secondary-action" data-action="restart">重新开启本地区</button>' : ''}<div class="cast-preview"><div class="avatar-stack">${pool.slice(0,5).map(c=>portrait(c,'small')).join('')}</div><span>这些旅伴中，谁最像你？<button class="text-button" data-action="roster">查看全部角色 →</button></span></div></div></div></section>`;
  attachImageFallbacks(); focusHeading();
}

function portrait(character, size = '') {
  const url = character.asset ? `https://enka.network/ui/UI_AvatarIcon_${encodeURIComponent(character.asset)}.png` : '';
  return `<span class="portrait ${size}" style="--portrait-color:${getRegion(character.region).accent}"><span class="portrait-fallback" aria-hidden="true">${esc(character.name.slice(0,1))}</span>${url ? `<img src="${url}" alt="${esc(character.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="sr-only">${esc(character.name)}</span>`}</span>`;
}
function attachImageFallbacks() {
  document.querySelectorAll('.portrait img').forEach(img => { img.addEventListener('error', () => { img.hidden = true; }, {once:true}); });
}
function begin(fresh = false) {
  const saved = fresh ? null : readProgress(state.region.id);
  state.answers = saved?.answers || Array(50).fill(null);
  state.index = saved?.index || 0;
  state.draft = null;
  if (saved?.complete) { result(); return; }
  saveProgress(); quiz();
}
function currentQuestion() { return QUESTIONS[state.region.id][state.index]; }
function setupDraft() {
  const q = currentQuestion(), saved = state.answers[state.index];
  state.draft = Array.isArray(saved) ? [...saved] : (saved ?? (q.type === 'rank' || q.type === 'multi' ? [] : null));
}
const TYPE_NAMES = {choice:'心之抉择',scene:'情境委托',scale:'内心刻度',multi:'双选行囊',rank:'优先序列'};
const TYPE_HINTS = {choice:'选你实际更可能采取的一种做法',scene:'按平时的做法，选一个最接近的答案',scale:'回想遇到类似情况时，这种做法出现的频率',multi:'按题目给出的条件，只选你会优先做的两项',rank:'依次点选，按真实偏好从高到低排序；可用箭头调整'};

function quiz({focus = true} = {}) {
  state.screen = 'quiz'; setupDraft();
  const r = state.region, q = currentQuestion(), chapter = Math.floor(state.index / 10);
  const completed = state.answers.filter((a,i)=>isValidAnswer(QUESTIONS[r.id][i],a)).length;
  main.innerHTML = `<section class="quiz-page" style="${regionStyle(r)}"><div class="quiz-topline"><a class="back-link" href="#/">← 地区地图</a><span>${icon('save')} 进度自动保存在此设备</span><button class="text-button" data-action="save-exit">保存并离开</button></div><div class="quest-layout"><aside class="quest-sidebar"><div class="quest-region">${icon(r.icon)}<div><small>${r.english}</small><h2>${r.name}之旅</h2></div></div><ol class="chapter-list">${r.chapters.map((c,i)=>`<li class="${i===chapter?'active':''} ${completed >= (i+1)*10?'done':''}"><span>${completed >= (i+1)*10 ? icon('check') : '0'+(i+1)}</span><div><small>第${['一','二','三','四','五'][i]}章</small><p>${c}</p></div></li>`).join('')}</ol><div class="sidebar-note">${icon('star')}<p>你不必成为某一种人。<br>此刻的选择，就是你的光。</p></div></aside><div class="question-panel"><div class="quest-progress"><div><span>第 ${chapter+1} 章 · ${r.chapters[chapter]}</span><strong>${String(state.index+1).padStart(2,'0')} <small>/ 50</small></strong></div><div class="progress-track" role="progressbar" aria-label="已完成题目" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="50"><span style="width:${completed*2}%"></span></div></div><div class="question-body"><div class="question-type">${icon(q.type==='scene'?'flag':q.type==='multi'?'book':q.type==='rank'?'star':r.icon)} ${TYPE_NAMES[q.type]}<span>第 ${(state.index%10)+1} / 10 个本章委托</span></div>${q.scene ? `<p class="scene-setting">${esc(q.scene)}</p>` : ''}<h1 id="question-title">${esc(q.prompt)}</h1><p class="question-hint" id="question-hint">${TYPE_HINTS[q.type]}</p><div id="answer-options" aria-labelledby="question-title" aria-describedby="question-hint"></div><div class="question-bottom"><button class="text-button" data-action="previous" ${state.index===0?'disabled':''}>← 上一题</button><span id="selection-status" role="status" aria-live="polite"></span><button class="primary-button" data-action="next" id="next-button" disabled>${state.index===49?'揭晓我的角色':'确认，继续旅程'} ${icon('arrow')}</button></div><p class="keyboard-hint">单选可用数字键 1–${q.options.length} · 答案没有对错</p></div></div></div></section>`;
  renderOptions(); if (focus) focusHeading();
}

function renderOptions() {
  const q = currentQuestion(), draft = state.draft, target = document.querySelector('#answer-options');
  if (q.type === 'rank') {
    const order = Array.isArray(draft) ? draft : [];
    target.innerHTML = `<div class="rank-slots" aria-label="你的优先顺序">${[0,1,2,3].map(pos => `<div class="rank-slot ${order[pos]!==undefined?'filled':''}"><span class="rank-number">${pos+1}</span>${order[pos]!==undefined ? `<span>${esc(q.options[order[pos]].text)}</span><span class="rank-controls"><button type="button" data-action="rank-up" data-index="${pos}" ${pos===0?'disabled':''} aria-label="上移${esc(q.options[order[pos]].text)}">↑</button><button type="button" data-action="rank-down" data-index="${pos}" ${pos===order.length-1?'disabled':''} aria-label="下移${esc(q.options[order[pos]].text)}">↓</button><button type="button" data-action="rank-remove" data-index="${pos}" aria-label="移除${esc(q.options[order[pos]].text)}">×</button></span>` : `<span class="rank-placeholder">${['最符合你','其次','再次','最不符合你'][pos]}</span>`}</div>`).join('')}</div><div class="rank-choices">${q.options.map((option,i) => `<button type="button" class="rank-choice ${order.includes(i)?'used':''}" data-action="choose" data-index="${i}" ${order.includes(i)?'disabled':''}>${order.includes(i)?icon('check'):'+'} ${esc(option.text)}</button>`).join('')}</div>`;
  } else if (q.type === 'scale') {
    target.innerHTML = `<div class="scale-options" role="group" aria-label="五档倾向">${q.options.map((option,i)=>`<button type="button" class="scale-option ${draft===i?'selected':''}" aria-pressed="${draft===i}" data-action="choose" data-index="${i}"><span class="scale-orb"><span>${i+1}</span></span><span>${esc(option.text)}</span></button>`).join('')}</div><div class="scale-axis"><span>← 更接近左侧</span><span>更接近右侧 →</span></div>`;
  } else {
    target.innerHTML = `<div class="answer-list ${q.type==='multi'?'multi-options':''}" role="group">${q.options.map((option,i)=>{ const selected = Array.isArray(draft)?draft.includes(i):draft===i; return `<button type="button" class="answer-option ${selected?'selected':''}" aria-pressed="${selected}" data-action="choose" data-index="${i}"><span class="option-letter">${selected?icon('check'):String.fromCharCode(65+i)}</span><span>${esc(option.text)}</span><span class="option-indicator">${q.type==='multi'?(selected?'已装入':'＋'):(selected?'已选择':'')}</span></button>`; }).join('')}</div>`;
  }
  const valid = isValidAnswer(q, draft);
  document.querySelector('#next-button').disabled = !valid;
  document.querySelector('#selection-status').textContent = q.type==='multi' ? `已选 ${draft.length} / 2` : q.type==='rank' ? `已排序 ${draft.length} / 4` : valid ? '跟随你的直觉' : '等待你的选择';
}
function choose(index) {
  const q = currentQuestion();
  if (q.type === 'multi') {
    if (state.draft.includes(index)) state.draft = state.draft.filter(i => i !== index);
    else if (state.draft.length < 2) state.draft.push(index);
    else { toast('行囊只能装入两项，先取消一项再选择。'); return; }
  } else if (q.type === 'rank') { if (!state.draft.includes(index)) state.draft.push(index); }
  else state.draft = index;
  // Save only committed answers; selection remains editable until Next.
  renderOptions();
  const replacement = document.querySelector(`[data-action="choose"][data-index="${index}"]`);
  if (replacement && !replacement.disabled) replacement.focus({preventScroll:true});
  else (document.querySelector('[data-action="choose"]:not(:disabled)') || document.querySelector('#next-button'))?.focus({preventScroll:true});
}
function next() {
  if (!isValidAnswer(currentQuestion(), state.draft)) return;
  const prior = state.answers[state.index];
  const isNew = !isValidAnswer(currentQuestion(),prior);
  state.answers[state.index] = Array.isArray(state.draft)?[...state.draft]:state.draft;
  const completedIndex = state.index;
  if (state.index < 49) state.index++;
  saveProgress();
  if (completedIndex === 49) { result(); return; }
  if ((completedIndex+1)%10===0 && isNew) checkpoint((completedIndex+1)/10);
  else quiz();
}
function commitDraftIfValid() {
  if (state.screen==='quiz' && isValidAnswer(currentQuestion(),state.draft)) state.answers[state.index] = Array.isArray(state.draft)?[...state.draft]:state.draft;
  saveProgress();
}
function checkpoint(chapter) {
  state.screen='checkpoint'; const r=state.region;
  main.innerHTML = `<section class="checkpoint" style="${regionStyle(r)}"><p class="eyebrow">CHAPTER ${String(chapter).padStart(2,'0')} · COMPLETE</p><div class="earned-stamp">${icon(r.icon)}<span>旅途印记 · ${chapter}</span></div><h1>「${r.chapters[chapter-1]}」<br>已收入你的旅行手册</h1><p>你已经走过 ${chapter*10} 次选择。<br>休息片刻，接下来是「${r.chapters[chapter]}」。</p><div class="stamp-row">${r.chapters.map((_,i)=>`<span class="mini-stamp ${i<chapter?'earned':''}">${i<chapter?icon(r.icon):icon('lock')}</span>`).join('')}</div><button class="primary-button" data-action="continue">前往下一章 ${icon('arrow')}</button><button class="text-button" data-action="save-exit">保存，稍后再出发</button></section>`;
  focusHeading();
}

function radar(vector, traits, color) {
  const point = (index,value) => {const angle=(Math.PI/3)*index-Math.PI/2;return `${160+Math.cos(angle)*value*100},${140+Math.sin(angle)*value*100}`;};
  return `<svg class="radar" viewBox="0 0 320 285" role="img" aria-label="六维性格雷达图，详细数值见下方列表"><g fill="none" stroke="#496069" stroke-opacity=".5">${[.25,.5,.75,1].map(radius=>`<polygon points="${DIMENSIONS.map((_,i)=>point(i,radius)).join(' ')}"/>`).join('')}${DIMENSIONS.map((_,i)=>`<path d="M160 140 ${point(i,1)}"/>`).join('')}</g><polygon points="${traits.map((v,i)=>point(i,(v+1)/2)).join(' ')}" fill="none" stroke="#d7bd87" stroke-dasharray="4 4" stroke-width="1.5"/><polygon points="${vector.map((v,i)=>point(i,(v+1)/2)).join(' ')}" fill="${color}" fill-opacity=".2" stroke="${color}" stroke-width="2"/>${DIMENSIONS.map((d,i)=>{const [x,y]=point(i,1.3).split(',');return `<text x="${x}" y="${Number(y)+4}" text-anchor="middle" fill="#b9c8c9" font-size="11">${d.name}</text>`;}).join('')}</svg>`;
}

function result() {
  const r=state.region, questions=QUESTIONS[r.id];
  const firstMissing = questions.findIndex((q,i)=>!isValidAnswer(q,state.answers[i]));
  if (firstMissing!==-1) {state.index=firstMissing;quiz();toast('还有未完成的委托，完成后就能揭晓角色。');return;}
  state.screen='result'; saveProgress();
  const {vector,coverage} = scoreAnswers(questions,state.answers);
  const matches=matchCharacters(r.id,vector,CHARACTERS), best=matches[0], c=best.character;
  const reasons=matchingReasons(vector,c), gap=matches[1]?matches[1].resonance-best.resonance:0;
  state.result={vector,coverage,matches};
  main.innerHTML = `<section class="result-page" style="${regionStyle(r)}"><a class="back-link" href="#/">← 返回地区地图</a><div class="result-heading"><p class="eyebrow">JOURNEY COMPLETE · ${r.english}</p><h1>你的灵魂，与 TA 共鸣。</h1><p>50 次真实的选择，在${r.name}汇成一个熟悉的身影。</p></div><div class="result-layout"><article class="character-card"><div class="character-card-top"><span>${icon(r.icon)} ${r.name} · 旅伴档案</span><span>✦ ✦ ✦</span></div><div class="character-portrait-stage"><div class="portrait-orbit"></div>${portrait(c,'hero-portrait')}<span class="portrait-caption">INNER CONSTELLATION</span></div><div class="character-identity"><p>${esc(c.title)}</p><h2>${esc(c.name)}</h2><div class="character-tags">${c.tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div></div><div class="resonance"><div><span>性格共鸣指数</span><small>同地区六维相似度</small></div><strong>${best.resonance}<small>/100</small></strong></div><div class="character-affiliation"><span>角色身份</span><p>${esc(c.affiliation)}</p><a class="source-link" href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">查看资料来源 ↗</a></div></article><div class="result-detail"><section class="result-section"><p class="eyebrow">A LETTER TO YOU</p><p class="interpretation-label">以下为基于角色气质的同人解读</p><h2>你们相似的，是面对世界的方式。</h2><p class="character-description">${esc(c.description)}</p>${Math.abs(gap)<=2?'<p class="close-match-note">你的性格兼具多种色彩：与下方旅伴的共鸣也很接近，不必被一个角色定义。</p>':''}<div class="reason-list">${reasons.length ? reasons.map(item=>`<div>${icon('star')}<p><b>${DIMENSIONS[item.dimension][item.user>=0?'high':'low']}</b><span>${DIMENSIONS[item.dimension].hint[item.user>=0?1:0]}</span></p></div>`).join('') : `<div>${icon('star')}<p><b>你在不同情境中保留弹性</b><span>本次六维倾向比较均衡，因此匹配按整体距离选出；不代表你和角色的每一面都一样。</span></p></div>`}</div><div class="strength-grid"><div><span>你的旅途优势</span><p>${esc(c.strength)}</p></div><div><span>送给你的成长委托</span><p>${esc(c.growth)}</p></div></div></section></div></div><div class="result-bottom-grid"><section class="result-section trait-section"><div class="section-title-row"><h2>你的六维心象</h2><span class="tiny-label">两端都值得被看见</span></div><div class="trait-layout"><div>${radar(vector,c.traits,r.accent)}<div class="chart-legend"><span><i></i>你的倾向</span><span><i></i>气质参考</span></div></div><ul class="trait-bars">${DIMENSIONS.map((d,i)=>`<li><div><b>${d.name}</b><span>${Math.round((vector[i]+1)*50)} / 100</span></div><div class="trait-track"><span style="left:${Math.round((vector[i]+1)*50)}%"></span></div><p><span>${d.low}</span><span>${d.high}</span></p></li>`).join('')}</ul></div><p class="fine-print">数值表达两端倾向，不是能力高低。共鸣指数是本测试规则下的相似程度，不是心理测量置信度。</p></section><section class="result-section nearby-section"><p class="eyebrow">OTHER KINDRED SPIRITS</p><h2>同地区，也与你相近的旅伴</h2><div class="nearby-list">${matches.slice(1,4).map(m=>`<div>${portrait(m.character,'small')}<p><b>${esc(m.character.name)}</b><span>${esc(m.character.title)}</span></p><strong>${m.resonance}<small>共鸣</small></strong></div>`).join('')}</div><div class="completed-stamps">${r.chapters.map((chapter,i)=>`<span title="${chapter}">${icon(r.icon)}<small>0${i+1}</small></span>`).join('')}</div><p class="fine-print">五枚印记已收集 · ${r.name}篇完成</p></section></div><div class="result-actions"><button class="primary-button" data-action="download">保存角色纪念卡 ${icon('save')}</button><button class="outline-button" data-action="copy-result">复制我的结果</button><button class="text-button" data-action="review">回顾我的选择</button><button class="text-button" data-action="restart">再测一次</button></div><p class="result-disclaimer">这是基于原神角色气质创作的同人娱乐测试，不是官方设定或专业心理诊断。你始终比一个结果更丰富。</p></section>`;
  attachImageFallbacks(); focusHeading();
}

function passport() {
  openModal(`<div class="modal-body"><p class="eyebrow">YOUR TRAVEL JOURNAL</p><h2 id="modal-title">我的旅行手册</h2><p class="muted">每一段旅途，都有自己的印记。记录仅保存在当前设备。</p><div class="passport-grid">${REGIONS.map(r=>{const p=readProgress(r.id);const count=p?.answers.filter((a,i)=>isValidAnswer(QUESTIONS[r.id][i],a)).length||0;return `<button class="passport-item ${p?.complete?'complete':''}" data-action="visit" data-region="${r.id}" style="${regionStyle(r)}">${icon(r.icon)}<b>${r.name}</b><span>${p?.complete?'五章已完成':count?`${count} / 50 已作答`:'等待启程'}</span></button>`;}).join('')}</div></div>`, 'wide-modal');
}
function about() {
  openModal(`<div class="modal-body"><p class="eyebrow">BEFORE YOU SET OFF</p><h2 id="modal-title">旅行须知</h2><div class="about-copy"><h3>一次没有标准答案的旅程</h3><p>选择七个地区之一，用活动发起者提供的对应密钥进入。每个地区有 50 道独立题目，包含情境单选、五档倾向、双选与优先排序。以你通常的做法回答，无需熟悉游戏知识。</p><h3>角色如何与你相遇</h3><p>答案转换为社交、关怀、节奏、决策、探索、边界六个维度，再与当前地区角色的创作性人格档案比较。结果不会跨地区，也不会随机抽签。</p><h3>你的旅途，由你掌握</h3><p>已确认的答案自动保存在此浏览器；点击「保存并离开」也会保存当前完整选择。不上传个人答案，不采集姓名、手机号或账号。清理浏览器数据会清除进度。</p><h3>关于地区与素材</h3><p>采用六国与挪德卡莱共七个地区入口。挪德卡莱为自治地区。角色按游戏地区归属与明确长期关联收录，不单凭出生地或短暂剧情登场划分。角色图像版权归米哈游／HoYoverse，远程图片不可用时自动显示文字徽记。</p><p>地图插画、题目、人格数值和解读为本站原创同人内容。本测试用于娱乐和自我观察，不是官方测试或科学心理量表。</p><a class="text-button" href="https://genshin.hoyoverse.com/en/character/mondstadt" target="_blank" rel="noopener noreferrer">前往原神官方角色资料 ↗</a></div></div>`, 'wide-modal');
}
function roster() {
  const r=state.region, pool=CHARACTERS.filter(c=>c.region===r.id);
  openModal(`<div class="modal-body"><p class="eyebrow">TRAVEL COMPANIONS</p><h2 id="modal-title">${r.name} · ${pool.length} 位旅伴</h2><p class="muted">结果只会从以下角色中产生。</p><div class="roster-grid">${pool.map(c=>`<div>${portrait(c,'small')}<b>${esc(c.name)}</b><small>${esc(c.title)}</small></div>`).join('')}</div></div>`, 'wide-modal'); attachImageFallbacks();
}
function restart() {
  openModal(`<div class="modal-body"><p class="eyebrow">A NEW CHAPTER</p><h2 id="modal-title">重新开启${state.region.name}之旅？</h2><p class="muted">这会替换本设备上${state.region.name}的答案和结果，其他地区的旅行记录会保留。</p><div class="modal-actions"><button class="primary-button" data-action="confirm-restart">重新出发</button><button class="outline-button" data-action="close-modal">保留记录</button></div></div>`);
}
function review() {
  const qs=QUESTIONS[state.region.id];
  openModal(`<div class="modal-body"><p class="eyebrow">YOUR FIFTY CHOICES</p><h2 id="modal-title">回顾你的选择</h2><p class="muted">点击题目可以修改。重新完成最后一题后，会更新你的角色结果。</p><div class="review-list">${qs.map((q,i)=>`<button data-action="edit-answer" data-index="${i}"><span>${String(i+1).padStart(2,'0')}</span><div><b>${esc(q.prompt)}</b><small>${(Array.isArray(state.answers[i])?state.answers[i]:[state.answers[i]]).map(v=>esc(q.options[v].text)).join(q.type==='rank'?' → ':'；')}</small></div>${icon('arrow')}</button>`).join('')}</div></div>`,'wide-modal');
}
function resultText() {
  const c=state.result.matches[0].character;
  return `我的提瓦特心途 · ${state.region.name}篇\n共鸣角色：${c.name}｜${c.title}\n${c.tags.join(' · ')}\n${DIMENSIONS.map((d,i)=>`${d.name}：${d[state.result.vector[i]>=0?'high':'low']}`).join('\n')}\n50 次选择，完成五章旅程。\n原神同人娱乐测试，非专业心理测量。`;
}
async function copyResult() {
  try {await navigator.clipboard.writeText(resultText()); toast('结果已复制，可以分享给朋友。');}
  catch {openModal(`<div class="modal-body"><h2 id="modal-title">复制你的结果</h2><p class="muted">浏览器未允许自动复制，请长按或全选下方文字。</p><textarea class="copy-area" readonly>${esc(resultText())}</textarea></div>`);modal.querySelector('textarea').select();}
}
function downloadCard() {
  const r=state.region, c=state.result.matches[0].character;
  const lines=DIMENSIONS.map((d,i)=>`<text x="64" y="${390+i*48}" fill="#b7c9ca" font-size="16">${d.name}</text><text x="536" y="${390+i*48}" text-anchor="end" fill="${r.accent}" font-size="18">${d[state.result.vector[i]>=0?'high':'low']}</text>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="820" viewBox="0 0 600 820"><rect width="600" height="820" rx="28" fill="#11232f"/><rect x="24" y="24" width="552" height="772" rx="16" fill="none" stroke="#cfb478"/><g font-family="Microsoft YaHei, PingFang SC, sans-serif"><text x="300" y="85" text-anchor="middle" fill="#cfb478" font-size="17" letter-spacing="4">提瓦特心途 · ${r.name}篇</text><text x="300" y="148" text-anchor="middle" fill="#a9bebc" font-size="16">50 次选择，遇见与你共鸣的角色</text><text x="300" y="229" text-anchor="middle" fill="#f5f0df" font-size="58" font-weight="bold">${esc(c.name)}</text><text x="300" y="277" text-anchor="middle" fill="${r.accent}" font-size="23">${esc(c.title)}</text><text x="300" y="318" text-anchor="middle" fill="#a9bebc" font-size="16">${c.tags.map(esc).join(' · ')}</text><path d="M64 345h472" stroke="#3b5157"/>${lines}<text x="300" y="726" text-anchor="middle" fill="#d8c493" font-size="17">愿你的每一种性格，都有落脚的地方。</text><text x="300" y="762" text-anchor="middle" fill="#89a1a4" font-size="12">原神同人娱乐测试 · 非官方 · 不代表专业心理结论</text></g></svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  const a=document.createElement('a'); a.href=url; a.download=`提瓦特心途-${r.name}-${c.name}.svg`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); toast('纪念卡已生成，可以保存或打印。');
}

document.addEventListener('submit', async event => {
  if(event.target.id!=='key-form')return;event.preventDefault();
  const input=document.querySelector('#region-key'), button=event.target.querySelector('[type="submit"]'), error=document.querySelector('#key-error'), region=state.region;
  button.disabled=true;error.textContent='';
  try {
    const valid=await verifyKey(region,input.value);
    if(state.region!==region || !modal.open)return;
    if(valid){unlocked.add(region.id);try{sessionStorage.setItem(`teyvat-unlock-${region.id}`,region.keyHash);}catch{}modal.close();intro();}
    else{error.textContent='这串密钥无法开启当前地区，请检查地区、字母和数字。';input.setAttribute('aria-invalid','true');input.focus();input.select();}
  } catch {error.textContent='当前浏览器无法验证密钥，请用最新版浏览器通过 HTTPS 或本机预览地址打开。';}
  finally{button.disabled=false;}
});

document.addEventListener('click', event => {
  const button=event.target.closest('[data-action]');if(!button || button.disabled)return;
  const action=button.dataset.action,index=Number(button.dataset.index);
  if(action==='explore'){event.preventDefault();document.querySelector('#destinations').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
  if(action==='close-modal')closeModal();
  if(action==='about')about();
  if(action==='passport')passport();
  if(action==='roster')roster();
  if(action==='toggle-key'){const input=document.querySelector('#region-key');input.type=input.type==='password'?'text':'password';button.textContent=input.type==='password'?'显示':'隐藏';button.setAttribute('aria-label',button.textContent+'密钥');}
  if(action==='start')begin();
  if(action==='choose')choose(index);
  if(action==='next')next();
  if(action==='previous'){commitDraftIfValid();state.index--;saveProgress();quiz();}
  if(action==='continue')quiz();
  if(action==='save-exit'){commitDraftIfValid();location.hash='#/';}
  if(action==='restart')restart();
  if(action==='confirm-restart'){modal.close();begin(true);}
  if(action==='copy-result')void copyResult();
  if(action==='download')downloadCard();
  if(action==='review')review();
  if(action==='edit-answer'){modal.close();state.index=index;quiz();}
  if(action==='visit'){modal.close();const hash=`#/region/${button.dataset.region}`;if(location.hash===hash)route();else location.hash=hash;}
  if(action==='rank-remove'){const [removed]=state.draft.splice(index,1);renderOptions();document.querySelector(`[data-action="choose"][data-index="${removed}"]`)?.focus({preventScroll:true});}
  if(action==='rank-up'||action==='rank-down'){const other=index+(action==='rank-up'?-1:1);[state.draft[index],state.draft[other]]=[state.draft[other],state.draft[index]];renderOptions();const moved=document.querySelector(`[data-action="${action}"][data-index="${other}"]`);(moved&&!moved.disabled?moved:document.querySelector(`[data-action="rank-remove"][data-index="${other}"]`))?.focus({preventScroll:true});}
});
document.addEventListener('keydown', event => {
  if(state.screen!=='quiz'||modal.open||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)||event.ctrlKey||event.altKey||event.metaKey)return;
  if(/^[1-5]$/.test(event.key)){const index=Number(event.key)-1;if(index<currentQuestion().options.length){event.preventDefault();choose(index);}}
});
window.addEventListener('pagehide',()=>{if(state.screen==='quiz')commitDraftIfValid();});

function route() {
  if(state.screen==='quiz')commitDraftIfValid();
  if(modal.open)modal.close();
  const match=location.hash.match(/^#\/region\/([a-z]+)$/),r=match?getRegion(match[1]):null;
  if(!r){state.region=null;home();window.scrollTo(0,0);return;}
  state.region=r;document.title=`${r.name}之旅 · 提瓦特心途`;
  try{if(sessionStorage.getItem(`teyvat-unlock-${r.id}`)===r.keyHash)unlocked.add(r.id);}catch{}
  if(unlocked.has(r.id))intro();else{home();state.region=r;gate(r);}
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView({behavior:'instant'});});
route();
