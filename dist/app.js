import { PhrasePractice } from './practice-state.mjs';
import { SpeechPlayer, normalizeRate } from './speech-player.mjs';
const $ = (id) => document.getElementById(id);
const phrase = new PhrasePractice();
const speaker = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8"/></svg>';
let data, index = 0, selected, category = 'life', mode = 'both', mouthOpen = false, mouthLanguage = 'zh';
let playbackRate = 0.75;
try { playbackRate = normalizeRate(localStorage.getItem('pic-speak-rate-v1')); } catch {}
const player = new SpeechPlayer({createMedia: () => $('speech-audio'), onClip: clip => {
  status(`正在唸${clip.label}：${clip.text}`);
  if (mouthOpen) { mouthLanguage = clip.language; renderMouthHint(); }
}});
const photosInCategory = () => data.photos.filter(p => category === 'all' || (p.category || 'life') === category);
const photoURL = p => p.image || `/assets/photos/${p.id}.webp`;
function renderCategories() {
  $('categories').replaceChildren();
  const categories = data.categories || [{id:'life',label:'生活照片'}];
  for (const c of categories) {
    const button = document.createElement('button'); button.type='button';button.className='category-button';button.dataset.category=c.id;
    const count=data.photos.filter(p=>c.id==='all'||(p.category||'life')===c.id).length;
    button.append(document.createTextNode(c.label));
    const number=document.createElement('span');number.textContent=count;button.append(number);
    button.setAttribute('aria-pressed',String(c.id===category));
    button.onclick=()=>{category=c.id;index=0;renderCategories();renderPhoto();};
    $('categories').append(button);
  }
}
const modeText = () => ({both:'中文與台語',zh:'中文',tw:'台語'}[mode]);
function status(text, error = false) { $('play-status').textContent = text; $('play-status').classList.toggle('error', error); }
function stopPlayback(message) {
  player.stop();
  $('stop').hidden = true; $('replay').classList.remove('is-playing');
  document.querySelectorAll('.hotspot').forEach(b => b.classList.remove('is-playing'));
  if (message) status(message);
}
function setWord(word) {
  selected = word; const w = data.words[word];
  $('word-zh').textContent = w.zh; $('word-tw').textContent = w.tw;
  $('romanization').textContent = w.roman;
  $('replay').setAttribute('aria-label', `播放${w.zh}的${modeText()}發音`);
  document.querySelectorAll('[data-word]').forEach(button => {
    const active = button.dataset.word === phrase.objectWord;
    button.classList.toggle('is-selected', active);
    if (button.classList.contains('object-button')) button.setAttribute('aria-pressed', String(active));
  });
}
async function play(word = selected, language = mode) {
  if (!word || !data) return;
  stopPlayback(); setWord(word);
  const w = data.words[word];
  const languages = language === 'both' ? ['zh', 'tw'] : [language];
  const plan = languages.map(lang => ({url:w[lang+'Audio'], language:lang,
    text:w[lang], label:lang === 'zh' ? '中文' : '台語',
    gainDb:data.audioLevels?.clips[w[lang+'Audio']]?.gainDb}));
  $('stop').hidden = false; status('正在準備發音…');
  $('replay').classList.add('is-playing');
  document.querySelectorAll('.hotspot').forEach(b => b.classList.toggle('is-playing', b.dataset.word === phrase.objectWord));
  try {
    if (!await player.play(plan, playbackRate)) return;
    stopPlayback(); status('換你說說看。再點一下，可以再聽。');
  } catch (error) {
    stopPlayback();
    const errors = {
      'audio-missing':'這個音檔載入失敗，請確認網路後再點一次。',
      'audio-invalid':'這個音檔無法讀取，請重新整理後再試一次。',
      'audio-unsupported':'此瀏覽器不支援播放，請用 Safari 或 Chrome 開啟。',
      'audio-timeout':'音檔載入較久，請確認網路後再點一次。',
      'audio-slow-unsupported':'此瀏覽器無法保留音高減速，請將語速改為「正常」。',
    };
    status(errors[error.message] || (error.name === 'NotAllowedError' ? '請再點一次「聽發音」，允許瀏覽器播放聲音。' : '音檔載入失敗，請確認網路後再點一次。'), true);
  }
}
function renderChoices() {
  const choices = phrase.choices;
  $('phrase-choices').hidden = choices.length < 2;
  $('phrase-options').replaceChildren();
  $('choice-count').textContent = `第 ${phrase.variant + 1} ${phrase.level === 1 ? '組' : '句'}／共 ${choices.length} ${phrase.level === 1 ? '組' : '句'}`;
  choices.forEach((word, i) => {
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = `${i + 1}　${data.words[word].zh}`;
    button.setAttribute('aria-pressed', String(i === phrase.variant));
    button.onclick = () => {
      stopPlayback(); phrase.setVariant(i); setWord(phrase.word); renderChoices();
      $('phrase-options').children[i].focus({preventScroll:true});
      status('已選擇。點「聽發音」就能聽。');
    };
    $('phrase-options').append(button);
  });
}
function renderMouthHint() {
  const hints = data?.mouthHints?.[phrase.objectWord] || {};
  const languages = ['zh', 'tw'].filter(lang => hints[lang] && (mode === 'both' || mode === lang));
  const available = phrase.level === 0 && languages.length > 0;
  $('mouth-toggle').hidden = !available;
  if (!available) mouthOpen = false;
  $('mouth-toggle').setAttribute('aria-expanded', String(mouthOpen));
  $('mouth-toggle').textContent = mouthOpen ? '收起嘴型提示' : '嘴型提示';
  $('mouth-panel').hidden = !mouthOpen;
  document.querySelector('.practice').classList.toggle('has-mouth-hint', mouthOpen);
  if (!mouthOpen) { $('mouth-image').removeAttribute('src'); return; }
  if (!languages.includes(mouthLanguage)) mouthLanguage = languages[0];
  const hint = hints[mouthLanguage];
  $('mouth-language').replaceChildren();
  $('mouth-language').hidden = languages.length < 2;
  languages.forEach(lang => {
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = lang === 'zh' ? '中文嘴型' : '台語嘴型';
    button.setAttribute('aria-pressed', String(lang === mouthLanguage));
    button.onclick = () => {
      stopPlayback(); mouthLanguage = lang; renderMouthHint();
      $('mouth-language').children[languages.indexOf(lang)].focus({preventScroll:true});
      status('點「聽這個單字」配合嘴型練習。');
    };
    $('mouth-language').append(button);
  });
  $('mouth-title').textContent = `${mouthLanguage === 'zh' ? '中文' : '台語'}：${data.words[phrase.objectWord][mouthLanguage]}`;
  $('mouth-instruction').textContent = hint.instruction;
  $('mouth-image').alt = hint.alt;
  $('mouth-image').src = hint.image;
  $('mouth-source').href = hint.sourceUrl;
  $('mouth-source').textContent = '查看發音參考';
}
function closeMouthHint() { mouthOpen = false; }
function renderLengthControls() {
  $('phrase-controls').hidden = phrase.levels.length < 2;
  $('phrase-level').textContent = `${['單字','短語','句子'][phrase.level]} · ${phrase.level + 1} / 3`;
  document.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.level) === phrase.level)));
  renderChoices(); renderMouthHint();
}
function renderPhoto(resetLevel = true) {
  stopPlayback(); const photos = photosInCategory(); const p = photos[index];
  if (resetLevel) { phrase.selectPhoto(p); closeMouthHint(); }
  const isNeed = p.category === 'needs';
  const supportsPhrases = phrase.levels.length > 1;
  const objects = p.objects;
  renderLengthControls();
  $('object-buttons').hidden = isNeed || objects.length === 1;
  document.querySelector('.listen-heading').hidden = objects.length === 1;
  document.querySelector('.listen-heading h2').textContent = isNeed ? '從單字，慢慢說成一句話' : supportsPhrases ? '選一個詞，練習長短句' : '選一個單字';
  $('gentle-note').textContent = supportsPhrases ? '選一句，點一下聽，再慢慢跟著說。' : '聽一聽，慢慢跟著說。想再聽一次，就再點一下。';
  document.querySelector('.intro h1').textContent = isNeed ? '從單字，說出生活需要' : supportsPhrases ? '看圖，從單字練到句子' : '點一下，跟著說';
  document.querySelector('.intro p').textContent = isNeed ? '選擇適合的長度，點一下聽發音，慢慢說。' : '點圖片裡的黃色框框，就能聽發音。';
  $('scene-title').textContent = p.title; $('photo-counter').textContent = `${index+1} / ${photos.length}`;
  $('photo-error').hidden = true;
  $('photo-stage').style.setProperty('--photo-ratio',p.width/p.height);
  $('photo-stage').classList.toggle('is-pictogram',p.kind==='pictogram');
  $('photo').src = photoURL(p); $('photo').alt = p.alt;
  $('image-credit').replaceChildren();$('image-credit').hidden = !p.source;
  if(p.source){
    const link=document.createElement('a');link.href=p.source.sourcePage;link.target='_blank';link.rel='noopener noreferrer';link.textContent=p.source.provider || 'ARASAAC';
    const attribution=[p.source.creator,p.source.owner,p.source.license].filter(Boolean).join(' · ');
    $('image-credit').append(link,document.createTextNode(' · '+attribution));
  }
  $('hotspots').replaceChildren(); $('object-buttons').replaceChildren();
  objects.forEach(o => {
    const w = data.words[o.word]; const b = document.createElement('button');
    b.type = 'button'; b.className = 'hotspot'; b.dataset.word = o.word;
    b.setAttribute('aria-label', `${w.zh}，點一下聽發音`);
    const [x,y,width,height] = o.box;
    Object.assign(b.style, {left:`${x}%`,top:`${y}%`,width:`${width}%`,height:`${height}%`});
    const label = document.createElement('span'); label.className = 'hotspot-label'; label.innerHTML = speaker;
    label.append(document.createTextNode(w.zh)); b.append(label); b.onclick = () => selectObjectAndPlay(o.word);
    $('hotspots').append(b);
    const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'object-button'; chip.dataset.word = o.word;
    chip.textContent = w.zh; chip.onclick = () => selectObjectAndPlay(o.word); $('object-buttons').append(chip);
  });
  setWord(phrase.word); status(`點一下，聽${modeText()}`);
  for (const offset of [-1,1]) {const img = new Image();img.src = photoURL(photos[(index+offset+photos.length)%photos.length]);}
}
function selectObjectAndPlay(word) {
  if (word !== phrase.objectWord) closeMouthHint();
  phrase.selectObject(word);
  renderLengthControls();
  play(phrase.word);
}
function navigate(delta) {if (!data) return; const length=photosInCategory().length;index = (index + delta + length) % length;renderPhoto();}
$('previous').onclick = () => navigate(-1); $('next').onclick = () => navigate(1);
$('replay').onclick = () => play(); $('stop').onclick = () => stopPlayback('已停止。點一下可以再聽。');
function selectLength(level) { closeMouthHint(); phrase.setLevel(level); renderPhoto(false); }
document.querySelectorAll('[data-level]').forEach(b => b.onclick = () => selectLength(Number(b.dataset.level)));
$('speed').value = String(playbackRate);
$('speed').onchange = () => {
  playbackRate = normalizeRate($('speed').value);
  try { localStorage.setItem('pic-speak-rate-v1', String(playbackRate)); } catch {}
  stopPlayback(`已選${playbackRate === 1 ? '正常語速' : '慢 25%'}。點一下再聽。`);
};
$('mouth-toggle').onclick = () => {
  mouthOpen = !mouthOpen;
  stopPlayback(mouthOpen ? '點「聽這個單字」配合嘴型練習。' : `點一下，聽${modeText()}`);
  renderMouthHint();
  if (mouthOpen) $('mouth-panel').scrollIntoView({block:'nearest'});
};
$('mouth-close').onclick = () => { stopPlayback(`點一下，聽${modeText()}`); closeMouthHint(); renderMouthHint(); $('mouth-toggle').focus(); };
$('mouth-replay').onclick = () => play(phrase.objectWord, mouthLanguage);
$('mouth-image').onerror = () => { $('mouth-instruction').textContent = '提示圖片載入失敗，請收起後再試一次。'; };
$('photo-size-toggle').onclick = () => {
  const expanded = document.querySelector('.practice').classList.toggle('is-photo-expanded');
  $('photo-size-toggle').setAttribute('aria-expanded', String(expanded));
  $('photo-size-toggle').textContent = expanded ? '縮小照片' : '放大照片';
};
$('photo').onerror = () => {$('photo-error').hidden = false;};
document.querySelectorAll('input[name="language"]').forEach(radio => radio.onchange = () => {mode = radio.value;closeMouthHint();renderMouthHint();stopPlayback(`點一下，聽${modeText()}`);if(selected) setWord(selected);});
document.addEventListener('keydown', e => {
  if(e.key==='Escape'){stopPlayback('已停止播放。');return;}
  if(e.target.matches('input,textarea,select,button,a,summary')) return;
  if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1);}
  if(e.key==='ArrowRight'){e.preventDefault();navigate(1);}
});
let pointer, suppressClick = false;
$('photo-stage').addEventListener('pointerdown', e => {if (e.isPrimary) pointer = {x:e.clientX,y:e.clientY,id:e.pointerId};});
$('photo-stage').addEventListener('pointerup', e => {
  if (!pointer || pointer.id !== e.pointerId) return;
  const dx = e.clientX-pointer.x, dy = e.clientY-pointer.y; pointer = null;
  if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.35){suppressClick=true;navigate(dx<0?1:-1);setTimeout(()=>suppressClick=false,400);}
});
$('photo-stage').addEventListener('pointercancel',()=>pointer=null);
$('photo-stage').addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback('點一下，可以再聽。');});
window.addEventListener('pagehide',()=>stopPlayback());
try {const response = await fetch('/data.json',{cache:'no-cache'});if(!response.ok)throw new Error('Data missing');data=await response.json();renderCategories();renderPhoto();}
catch {$('scene-title').textContent='載入失敗';status('照片資料無法載入，請重新整理網頁。',true);$('replay').disabled=true;}

// Optional agent controls share the same state as the visible interface.
if (data && document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const snapshot = () => ({photoId:photosInCategory()[index].id,photoNumber:index+1,totalPhotos:photosInCategory().length,category,word:selected,objectWord:phrase.objectWord,language:mode,phraseLevel:phrase.level,phraseVariant:phrase.variant,playbackRate});
  const register = tool => {
    try {Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});} catch {}
  };
  register({name:'read_photo_practice',title:'查看發音練習',description:'Read the current photo, language and the available labeled objects.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute:()=>({...snapshot(),photos:data.photos.map(p=>({id:p.id,title:p.title,category:p.category||'life',objects:p.objects.map(o=>({id:o.word,label:data.words[o.word].zh}))}))})});
  register({name:'select_photo_practice',title:'選擇練習照片',description:'Select a photo, optional object and language in the practice interface. Does not start audio; the user can tap to listen.',
    inputSchema:{type:'object',properties:{photoId:{type:'string'},word:{type:'string'},language:{type:'string',enum:['both','zh','tw']}},required:['photoId'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:input=>{
      if(!input || typeof input!=='object' || Object.keys(input).some(k=>!['photoId','word','language'].includes(k)))throw new Error('Invalid selection');
      const nextIndex=data.photos.findIndex(p=>p.id===input.photoId);
      if(nextIndex<0)throw new Error('Unknown photo');
      if(input.word!==undefined && !data.photos[nextIndex].objects.some(o=>o.word===input.word))throw new Error('Object is not in the photo');
      if(input.language!==undefined && !['both','zh','tw'].includes(input.language))throw new Error('Unknown language');
      if(input.language) {mode=input.language;document.querySelector(`input[name="language"][value="${mode}"]`).checked=true;}
      const photo=data.photos[nextIndex];category=photo.category||'life';index=photosInCategory().findIndex(p=>p.id===photo.id);renderCategories();renderPhoto();if(input.word){phrase.selectObject(input.word);renderPhoto(false);}return snapshot();
    }});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
