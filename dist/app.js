import { PhrasePractice } from './practice-state.mjs';
const $ = (id) => document.getElementById(id);
const phrase = new PhrasePractice();
const speaker = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8"/></svg>';
let data, index = 0, selected, category = 'life', mode = 'both', context, generation = 0, nodes = [], timers = [];
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
const buffers = new Map();
const modeText = () => ({both:'中文與台語',zh:'中文',tw:'台語'}[mode]);
function status(text, error = false) { $('play-status').textContent = text; $('play-status').classList.toggle('error', error); }
function stopPlayback(message) {
  generation++;
  nodes.forEach(node => {try {node.stop();} catch {}}); nodes = [];
  timers.forEach(clearTimeout); timers = [];
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
async function getBuffer(url) {
  if (!buffers.has(url)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const promise = fetch(url, {cache:'no-cache', signal:controller.signal})
      .then(r => {if (!r.ok) throw new Error('audio-missing'); return r.arrayBuffer();})
      .then(async bytes => {
        if (bytes.byteLength < 1000) throw new Error('audio-invalid');
        try {return await context.decodeAudioData(bytes);}
        catch {throw new Error('audio-invalid');}
      }).finally(() => clearTimeout(timeout));
    buffers.set(url, promise); promise.catch(() => buffers.delete(url));
  }
  return buffers.get(url);
}
async function play(word = selected) {
  if (!word || !data) return;
  stopPlayback(); setWord(word);
  const run = generation; const w = data.words[word];
  const plan = mode === 'both' ? [[w.zhAudio,'中文'],[w.twAudio,'台語']] : [[mode === 'zh' ? w.zhAudio : w.twAudio, modeText()]];
  $('stop').hidden = false; status('正在準備發音…');
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('audio-unsupported');
    context ||= new AudioContextClass();
    await context.resume();
    const clips = await Promise.all(plan.map(([url]) => getBuffer(url)));
    if (run !== generation) return;
    let at = context.currentTime + .04;
    $('replay').classList.add('is-playing');
    document.querySelectorAll('.hotspot').forEach(b => b.classList.toggle('is-playing', b.dataset.word === phrase.objectWord));
    clips.forEach((buffer, i) => {
      const node = context.createBufferSource(); node.buffer = buffer; node.connect(context.destination);
      const delay = (at - context.currentTime) * 1000;
      timers.push(setTimeout(() => {if (run === generation) status(`正在唸${plan[i][1]}：${i === 0 && mode !== 'tw' ? w.zh : w.tw}`);}, Math.max(0,delay)));
      if (i === clips.length - 1) node.onended = () => {if (run === generation) {stopPlayback(); status('換你說說看。再點一下，可以再聽。');}};
      nodes.push(node); node.start(at); at += buffer.duration + .65;
    });
  } catch (error) {
    if (run !== generation) return;
    stopPlayback();
    const errors = {
      'audio-missing':'這個單字的音檔尚未準備好，請先試另一個單字。',
      'audio-invalid':'這個音檔無法讀取，請重新整理後再試一次。',
      'audio-unsupported':'此瀏覽器不支援播放，請用 Safari 或 Chrome 開啟。',
    };
    status(errors[error.message] || (error.name === 'NotAllowedError' ? '請再點一次「聽發音」，允許瀏覽器播放聲音。' : '音檔載入失敗，請確認網路後再點一次。'), true);
  }
}
function renderLengthControls() {
  $('phrase-controls').hidden = phrase.levels.length < 2;
  $('phrase-level').textContent = `${['單字','短語','句子'][phrase.level]} · ${phrase.level + 1} / 3`;
  $('shorter').disabled = phrase.level === 0;
  $('longer').disabled = phrase.level === phrase.levels.length - 1;
}
function renderPhoto(resetLevel = true) {
  stopPlayback(); const photos = photosInCategory(); const p = photos[index];
  if (resetLevel) phrase.selectPhoto(p);
  const isNeed = p.category === 'needs';
  const supportsPhrases = phrase.levels.length > 1;
  const objects = p.objects;
  renderLengthControls();
  $('object-buttons').hidden = isNeed;
  document.querySelector('.listen-heading h2').textContent = isNeed ? '從單字，慢慢說成一句話' : supportsPhrases ? '選一個物品，練習長短句' : '選一個單字';
  $('gentle-note').textContent = supportsPhrases ? '換圖或切換長度不會自動播放。點物品或「聽發音」才會唸；換另一個物品會回到單字。' : '聽一聽，慢慢跟著說。想再聽一次，就再點一下。';
  document.querySelector('.intro h1').textContent = isNeed ? '從單字，說出生活需要' : supportsPhrases ? '看照片，從單字練到句子' : '點一下，跟著說';
  document.querySelector('.intro p').textContent = isNeed ? '選擇適合的長度，點一下聽發音，慢慢說。' : '點圖片裡的黃色框框，就能聽發音。';
  $('scene-title').textContent = p.title; $('photo-counter').textContent = `${index+1} / ${photos.length}`;
  $('photo-error').hidden = true;
  $('photo-stage').style.setProperty('--photo-ratio',p.width/p.height);
  $('photo-stage').classList.toggle('is-pictogram',p.kind==='pictogram');
  $('photo').src = photoURL(p); $('photo').alt = p.alt;
  $('image-credit').replaceChildren();$('image-credit').hidden = !p.source;
  if(p.source){
    const link=document.createElement('a');link.href=p.source.sourcePage;link.target='_blank';link.rel='noopener noreferrer';link.textContent='ARASAAC';
    $('image-credit').append(link,document.createTextNode(' · Sergio Palao · Gobierno de Aragón · CC BY-NC-SA'));
  }
  $('hotspots').replaceChildren(); $('object-buttons').replaceChildren();
  objects.forEach(o => {
    const w = data.words[isNeed ? phrase.word : o.word]; const b = document.createElement('button');
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
  phrase.selectObject(word);
  renderLengthControls();
  play(phrase.word);
}
function navigate(delta) {if (!data) return; const length=photosInCategory().length;index = (index + delta + length) % length;renderPhoto();}
$('previous').onclick = () => navigate(-1); $('next').onclick = () => navigate(1);
$('replay').onclick = () => play(); $('stop').onclick = () => stopPlayback('已停止。點一下可以再聽。');
$('shorter').onclick = () => { phrase.setLevel(phrase.level - 1); renderPhoto(false); };
$('longer').onclick = () => { phrase.setLevel(phrase.level + 1); renderPhoto(false); };
$('photo').onerror = () => {$('photo-error').hidden = false;};
document.querySelectorAll('input[name="language"]').forEach(radio => radio.onchange = () => {mode = radio.value;stopPlayback(`點一下，聽${modeText()}`);if(selected) setWord(selected);});
document.addEventListener('keydown', e => {if(e.target.matches('input,textarea,select')) return;if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1);}if(e.key==='ArrowRight'){e.preventDefault();navigate(1);}if(e.key==='Escape')stopPlayback('已停止播放。');});
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
  const snapshot = () => ({photoId:photosInCategory()[index].id,photoNumber:index+1,totalPhotos:photosInCategory().length,category,word:selected,objectWord:phrase.objectWord,language:mode,phraseLevel:phrase.level});
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
