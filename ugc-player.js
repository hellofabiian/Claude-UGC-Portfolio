// <ugc-player src="..." accent="#C6F24E"> — custom video player: big center play,
// custom play/pause/mute/seek/volume bar (native controls off).
(function(){
const tpl = document.createElement('template');
tpl.innerHTML = `
<style>
:host{display:block;position:relative;width:100%;height:100%;background:#000;font-family:'Space Grotesk',system-ui,sans-serif}
video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}
.big{position:absolute;inset:0;display:grid;place-items:center;cursor:pointer;background:rgba(0,0,0,.12);transition:opacity .25s}
.big span{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;transition:transform .2s;box-shadow:0 4px 16px rgba(0,0,0,.35)}
.big:hover span{transform:scale(1.1)}
.big svg{margin-left:3px}
:host(.playing) .big{opacity:0;pointer-events:none}
.bar{position:absolute;left:8px;right:8px;bottom:8px;display:flex;align-items:center;gap:7px;background:rgba(20,17,14,.72);backdrop-filter:blur(8px);border-radius:100px;padding:6px 12px;opacity:0;transition:opacity .25s;pointer-events:none}
:host(.started:hover) .bar,:host(.started.paused) .bar{opacity:1;pointer-events:auto}
button{all:unset;cursor:pointer;width:20px;height:20px;display:grid;place-items:center;color:#fff;flex:none}
button:hover{color:var(--accent,#C6F24E)}
.time{font-size:10px;color:rgba(255,255,255,.8);flex:none;min-width:28px;text-align:center;font-variant-numeric:tabular-nums}
input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:100px;background:rgba(255,255,255,.25);outline:none;cursor:pointer;margin:0}
.seek{flex:1;min-width:0}
.vol{width:42px;flex:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:11px;height:11px;border-radius:50%;background:#fff;border:none;box-shadow:0 1px 4px rgba(0,0,0,.4)}
input[type=range]::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:#fff;border:none}
</style>
<video playsinline preload="metadata"></video>
<div class="big"><span><svg width="20" height="20" viewBox="0 0 24 24" fill="#1E1B16"><path d="M8 5v14l11-7z"/></svg></span></div>
<div class="bar">
 <button class="pp" aria-label="Play"></button>
 <div class="time t1">0:00</div>
 <input type="range" class="seek" min="0" max="100" value="0" step="0.1" aria-label="Seek">
 <button class="mute" aria-label="Mute"></button>
 <input type="range" class="vol" min="0" max="1" value="1" step="0.05" aria-label="Volume">
</div>`;
const PLAY='<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const PAUSE='<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const VOL='<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16.5 12a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>';
const MUTED='<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="m19.6 8.4-1.2-1.2L16 9.6l-2.4-2.4-1.2 1.2 2.4 2.4-2.4 2.4 1.2 1.2L16 12l2.4 2.4 1.2-1.2-2.4-2.4 2.4-2.4z"/></svg>';
class UGCPlayer extends HTMLElement{
 static get observedAttributes(){return ['src','accent']}
 connectedCallback(){
  if(this._v){this._sync();return}
  this.attachShadow({mode:'open'}).appendChild(tpl.content.cloneNode(true));
  const $=s=>this.shadowRoot.querySelector(s);
  this._v=$('video');this._pp=$('.pp');this._seek=$('.seek');this._t1=$('.t1');this._muteB=$('.mute');this._vol=$('.vol');
  this._pp.innerHTML=PLAY;this._muteB.innerHTML=VOL;
  $('.big').addEventListener('click',e=>{e.stopPropagation();this.toggle()});
  this._pp.addEventListener('click',()=>this.toggle());
  this._v.addEventListener('click',()=>this.toggle());
  this._v.addEventListener('play',()=>{this.classList.add('playing','started');this.classList.remove('paused');this._pp.innerHTML=PAUSE});
  this._v.addEventListener('pause',()=>{this.classList.remove('playing');this.classList.add('paused');this._pp.innerHTML=PLAY});
  this._v.addEventListener('ended',()=>{this.classList.remove('playing','started','paused');this._pp.innerHTML=PLAY});
  this._v.addEventListener('timeupdate',()=>this._tick());
  this._v.addEventListener('loadedmetadata',()=>this._tick());
  this._seek.addEventListener('input',()=>{if(this._v.duration){this._v.currentTime=this._seek.value/100*this._v.duration}});
  this._seek.addEventListener('click',e=>e.stopPropagation());
  this._vol.addEventListener('click',e=>e.stopPropagation());
  this._muteB.addEventListener('click',()=>{this._v.muted=!this._v.muted;this._updVol()});
  this._vol.addEventListener('input',()=>{this._v.volume=+this._vol.value;this._v.muted=(+this._vol.value===0);this._updVol()});
  this._sync();this._updVol();this._fill(this._seek,0);
 }
 attributeChangedCallback(){if(this._v)this._sync()}
 _sync(){
  const src=this.getAttribute('src')||'';
  if(this._src!==src){this._src=src;this._v.src=src;this.classList.remove('playing','started','paused');if(this._pp)this._pp.innerHTML=PLAY;if(this._seek){this._seek.value=0;this._fill(this._seek,0)}if(this._t1)this._t1.textContent='0:00'}
  this.style.setProperty('--accent',this.getAttribute('accent')||'#C6F24E');
 }
 toggle(){this._v.paused?this._v.play():this._v.pause()}
 _accent(){return this.getAttribute('accent')||'#C6F24E'}
 _fill(r,p){r.style.background=`linear-gradient(to right,${this._accent()} ${p}%,rgba(255,255,255,.25) ${p}%)`}
 _updVol(){const m=this._v.muted||this._v.volume===0;this._muteB.innerHTML=m?MUTED:VOL;const p=(m?0:this._v.volume)*100;this._vol.value=m?0:this._v.volume;this._fill(this._vol,p)}
 _tick(){const v=this._v;if(!v.duration)return;const p=v.currentTime/v.duration*100;this._seek.value=p;this._fill(this._seek,p);this._t1.textContent=Math.floor(v.currentTime/60)+':'+String(Math.floor(v.currentTime%60)).padStart(2,'0')}
}
if(!customElements.get('ugc-player'))customElements.define('ugc-player',UGCPlayer);
})();
