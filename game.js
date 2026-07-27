
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);

const UI={
  hud:$('hud'),missionBar:$('missionBar'),score:$('score'),runCoins:$('runCoins'),combo:$('combo'),
  menu:$('menuScreen'),pause:$('pauseScreen'),over:$('gameOverScreen'),tutorial:$('tutorial'),
  tutorialTitle:$('tutorialTitle'),tutorialHint:$('tutorialHint'),countdown:$('countdown'),
  best:$('best'),wallet:$('wallet'),gifts:$('gifts'),scoreLabel:$('scoreLabel'),
  bestLabel:$('bestLabel'),walletLabel:$('walletLabel'),giftLabel:$('giftLabel'),
  tagline:$('tagline'),playBtn:$('playBtn'),dailyBtn:$('dailyBtn'),howBtn:$('howBtn'),
  shareBtn:$('shareBtn'),langBtn:$('langBtn'),soundBtn:$('soundBtn'),pauseBtn:$('pauseBtn'),
  pauseTitle:$('pauseTitle'),resumeBtn:$('resumeBtn'),quitBtn:$('quitBtn'),
  gameOverTitle:$('gameOverTitle'),finalScoreLabel:$('finalScoreLabel'),finalScore:$('finalScore'),
  earnedCoins:$('earnedCoins'),earnedLabel:$('earnedLabel'),bestCombo:$('bestCombo'),
  comboLabel:$('comboLabel'),missionResult:$('missionResult'),missionLabel:$('missionLabel'),
  restartBtn:$('restartBtn'),shareScoreBtn:$('shareScoreBtn'),homeBtn:$('homeBtn'),
  missionText:$('missionText'),missionProgress:$('missionProgress'),
  toast:$('toast'),rewardFlash:$('rewardFlash'),rewardText:$('rewardText')
};

const COPY={
 tr:{
  score:'Skor',best:'En iyi',wallet:'Altın',gift:'Hediye',
  tagline:'İstanbul sokaklarında ritmi yakala.',
  play:'OYNA',daily:'🎁 Günlük Ödül',how:'Nasıl Oynanır?',share:'📤 Arkadaşına Gönder',
  lang:'🌐 Türkçe',pause:'DURAKLATILDI',resume:'DEVAM ET',quit:'ANA MENÜ',
  over:'KOŞU BİTTİ',final:'Skor',earned:'Kazandın',combo:'Kombo',mission:'Görev',
  restart:'TEKRAR OYNA',shareScore:'📤 Skoru Paylaş',home:'ANA MENÜ',
  tutorialTitle:'Hazır mısın?',tutorialHint:'Zıplamak için dokun',
  missionText:'Görev: 15 altın topla',missionDone:'TAMAM',missionFail:'DEVAM',
  howMsg:'Ekrana dokunarak zıpla. Havada ikinci kez dokunarak küçük bir destek al. Simit arabası, çay tepsisi, kedi ve yol bariyerlerinden kaç. Altınları ve nazar boncuklarını topla.',
  dailyOk:'Günlük ödül: +30 altın!',dailyWait:'Bugünkü ödülünü zaten aldın!',
  shareText:'Koş Hadi Koş! oyununu dene — İstanbul sokaklarında koşuyorum!'
 },
 en:{
  score:'Score',best:'Best',wallet:'Coins',gift:'Gifts',
  tagline:'Find your rhythm in the streets of Istanbul.',
  play:'PLAY',daily:'🎁 Daily Reward',how:'How to Play',share:'📤 Share with Friends',
  lang:'🌐 English',pause:'PAUSED',resume:'RESUME',quit:'MAIN MENU',
  over:'RUN COMPLETE',final:'Score',earned:'Earned',combo:'Combo',mission:'Mission',
  restart:'PLAY AGAIN',shareScore:'📤 Share Score',home:'MAIN MENU',
  tutorialTitle:'Ready?',tutorialHint:'Tap to jump',
  missionText:'Mission: collect 15 coins',missionDone:'DONE',missionFail:'KEEP GOING',
  howMsg:'Tap to jump. Tap again in the air for a small boost. Avoid simit carts, tea trays, cats and street barriers. Collect coins and evil-eye charms.',
  dailyOk:'Daily reward: +30 coins!',dailyWait:'You already collected today’s reward!',
  shareText:'Try Koş Hadi Koş! — I’m running through the streets of Istanbul!'
 }
};

let lang=localStorage.getItem('khk_lang')||'tr';
let soundOn=localStorage.getItem('khk_sound')!=='off';
let best=Number(localStorage.getItem('khk_best')||0);
let wallet=Number(localStorage.getItem('khk_wallet')||0);
let gifts=Number(localStorage.getItem('khk_gifts')||0);

let state='menu';
let lastTime=performance.now();
let audioCtx;
let score=0,runCoins=0,combo=1,maxCombo=1;
let elapsed=0,speed=220,spawnTimer=0;
let objects=[],particles=[],clouds=[];
let countdownTimer=0,countdownValue=3;
let groundY=0;

const player={
 x:0,y:0,w:48,h:66,vy:0,onGround:true,doubleJump:true,runPhase:0,slide:0
};

function t(key){return COPY[lang][key]}

function refreshText(){
 UI.scoreLabel.textContent=t('score'); UI.bestLabel.textContent=t('best');
 UI.walletLabel.textContent=t('wallet'); UI.giftLabel.textContent=t('gift');
 UI.tagline.textContent=t('tagline'); UI.playBtn.textContent=t('play');
 UI.dailyBtn.textContent=t('daily'); UI.howBtn.textContent=t('how');
 UI.shareBtn.textContent=t('share'); UI.langBtn.textContent=t('lang');
 UI.pauseTitle.textContent=t('pause'); UI.resumeBtn.textContent=t('resume');
 UI.quitBtn.textContent=t('quit'); UI.gameOverTitle.textContent=t('over');
 UI.finalScoreLabel.textContent=t('final'); UI.earnedLabel.textContent=t('earned');
 UI.comboLabel.textContent=t('combo'); UI.missionLabel.textContent=t('mission');
 UI.restartBtn.textContent=t('restart'); UI.shareScoreBtn.textContent=t('shareScore');
 UI.homeBtn.textContent=t('home'); UI.tutorialTitle.textContent=t('tutorialTitle');
 UI.tutorialHint.textContent=t('tutorialHint'); UI.missionText.textContent=t('missionText');
 UI.best.textContent=best; UI.wallet.textContent=wallet; UI.gifts.textContent=gifts;
 UI.soundBtn.textContent=soundOn?'🔊':'🔇';
 localStorage.setItem('khk_lang',lang);
}
refreshText();

function resize(){
 const d=Math.min(devicePixelRatio||1,2);
 canvas.width=innerWidth*d;canvas.height=innerHeight*d;
 canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';
 ctx.setTransform(d,0,0,d,0,0);
 groundY=innerHeight-112;
 player.x=Math.max(68,innerWidth*.20);
 if(player.onGround)player.y=groundY-player.h;
}
addEventListener('resize',resize);resize();

function tone(freq,d=.08,type='sine',vol=.045,slide=0){
 if(!soundOn)return;
 audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
 const o=audioCtx.createOscillator(),g=audioCtx.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);
 if(slide)o.frequency.linearRampToValueAtTime(freq+slide,audioCtx.currentTime+d);
 g.gain.setValueAtTime(vol,audioCtx.currentTime);
 g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+d);
 o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d);
}
function sfx(n){
 if(n==='jump')tone(430,.09,'square',.04,210);
 if(n==='coin')tone(830,.055,'sine',.05,180);
 if(n==='charm'){tone(580,.12,'triangle',.055,320);setTimeout(()=>tone(900,.10,'sine',.04,120),80)}
 if(n==='hit'){tone(180,.28,'sawtooth',.06,-90);navigator.vibrate?.([70,40,90])}
 if(n==='start'){tone(520,.07,'square',.04,160)}
 if(n==='reward'){tone(530,.08,'square',.05,180);setTimeout(()=>tone(760,.10,'square',.05,190),90)}
}
function toast(msg){
 UI.toast.textContent=msg;UI.toast.classList.add('show');
 clearTimeout(toast.tm);toast.tm=setTimeout(()=>UI.toast.classList.remove('show'),1900);
}
function flash(msg){
 UI.rewardText.textContent=msg;UI.rewardFlash.classList.add('show');
 setTimeout(()=>UI.rewardFlash.classList.remove('show'),480);
}

function showScreen(el){
 UI.menu.classList.add('hidden');UI.pause.classList.add('hidden');UI.over.classList.add('hidden');
 if(el)el.classList.remove('hidden');
}

function resetRun(){
 score=0;runCoins=0;combo=1;maxCombo=1;elapsed=0;speed=220;spawnTimer=3.2;
 objects=[];particles=[];
 player.y=groundY-player.h;player.vy=0;player.onGround=true;player.doubleJump=true;player.slide=0;player.runPhase=0;
 UI.score.textContent='0';UI.runCoins.textContent='0';UI.combo.textContent='1';
 UI.missionProgress.textContent='0/15';
}

function beginRun(){
 resetRun();showScreen(null);
 UI.hud.classList.remove('hidden');UI.missionBar.classList.remove('hidden');
 UI.tutorial.classList.remove('hidden');
 state='countdown';countdownTimer=0;countdownValue=3;UI.countdown.textContent='3';
}

function startPlaying(){
 state='playing';UI.tutorial.classList.add('hidden');sfx('start');
 // gentle opening coin trail, no obstacle
 for(let i=0;i<8;i++)objects.push({type:'coin',x:innerWidth+110+i*62,y:groundY-78,taken:false});
}

function endRun(){
 if(state!=='playing')return;
 state='over';sfx('hit');
 wallet+=runCoins;
 localStorage.setItem('khk_wallet',String(wallet));
 if(score>best){best=score;localStorage.setItem('khk_best',String(best))}
 const missionDone=runCoins>=15;
 if(missionDone){gifts++;localStorage.setItem('khk_gifts',String(gifts))}
 UI.finalScore.textContent=score;UI.earnedCoins.textContent=runCoins;UI.bestCombo.textContent=maxCombo;
 UI.missionResult.textContent=missionDone?t('missionDone'):t('missionFail');
 UI.best.textContent=best;UI.wallet.textContent=wallet;UI.gifts.textContent=gifts;
 UI.hud.classList.add('hidden');UI.missionBar.classList.add('hidden');
 showScreen(UI.over);
}

function pauseGame(){
 if(state==='playing'){
  state='paused';UI.hud.classList.add('hidden');UI.missionBar.classList.add('hidden');showScreen(UI.pause);
 }else if(state==='paused'){
  state='playing';showScreen(null);UI.hud.classList.remove('hidden');UI.missionBar.classList.remove('hidden');
 }
}

function jump(){
 if(state!=='playing')return;
 if(player.onGround){
  player.vy=-760;player.onGround=false;player.doubleJump=true;sfx('jump');
 }else if(player.doubleJump){
  player.vy=-500;player.doubleJump=false;sfx('jump');
 }
}

function spawnPattern(){
 const obstacleTypes=['barrier','cart','tea','cat'];
 const type=obstacleTypes[Math.floor(Math.random()*obstacleTypes.length)];
 const x=innerWidth+100;
 let w=type==='cart'?70:type==='tea'?54:48;
 let h=type==='cart'?55:type==='tea'?48:type==='cat'?38:50;
 objects.push({type,x,y:groundY-h,w,h,passed:false});
 const count=4+Math.floor(Math.random()*3);
 const arc=Math.random()>.45;
 for(let i=0;i<count;i++){
   objects.push({
    type:Math.random()<.11?'charm':'coin',
    x:x+125+i*52,
    y:groundY-(arc?85+Math.sin(i/(count-1)*Math.PI)*62:82),
    taken:false
   });
 }
}

function roundedRect(x,y,w,h,r,fill){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
}
function line(x1,y1,x2,y2,w,color){
 ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=w;ctx.strokeStyle=color;ctx.stroke();
}
function poly(points,fill){
 ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
}

function drawBackground(){
 const W=innerWidth,H=innerHeight;
 const grad=ctx.createLinearGradient(0,0,0,H);
 grad.addColorStop(0,'#5fc1ee');grad.addColorStop(.45,'#d9f4ff');grad.addColorStop(.77,'#f7d8aa');grad.addColorStop(1,'#eab26f');
 ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);

 // Sun
 ctx.fillStyle='rgba(255,224,119,.95)';ctx.beginPath();ctx.arc(W*.82,H*.14,40,0,Math.PI*2);ctx.fill();

 // Clouds
 if(clouds.length===0){
  clouds=[{x:50,y:90,s:.9},{x:250,y:125,s:.65},{x:520,y:72,s:.75}];
 }
 ctx.fillStyle='rgba(255,255,255,.72)';
 clouds.forEach(cl=>{
  const x=((cl.x-elapsed*10)%(W+180)+W+180)%(W+180)-90;
  ctx.beginPath();ctx.arc(x,cl.y,25*cl.s,0,7);ctx.arc(x+25*cl.s,cl.y-8*cl.s,21*cl.s,0,7);ctx.arc(x+49*cl.s,cl.y,25*cl.s,0,7);ctx.fill();
 });

 // Bosphorus
 ctx.fillStyle='#69bddd';ctx.fillRect(0,H*.30,W,H*.24);
 for(let i=0;i<8;i++){ctx.fillStyle=`rgba(255,255,255,${.08+i*.012})`;ctx.fillRect(0,H*(.34+i*.022),W,2)}

 // Istanbul skyline
 ctx.fillStyle='#8d7a6f';
 ctx.fillRect(25,H*.31,150,H*.23);
 ctx.beginPath();ctx.arc(100,H*.31,72,Math.PI,0);ctx.fill();
 for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(60+i*42,H*.34,21,Math.PI,0);ctx.fill()}
 ctx.fillRect(15,H*.19,16,H*.35);ctx.fillRect(176,H*.21,15,H*.33);
 poly([[23,H*.14],[7,H*.19],[39,H*.19]],'#8d7a6f');poly([[184,H*.16],[169,H*.21],[199,H*.21]],'#8d7a6f');

 // Galata tower
 ctx.fillStyle='#78675f';ctx.fillRect(W-128,H*.22,52,H*.32);
 poly([[W-144,H*.22],[W-102,H*.14],[W-60,H*.22]],'#78675f');

 // Bridge
 line(W*.34,H*.28,W*.77,H*.28,5,'#eff3f5');
 line(W*.39,H*.19,W*.39,H*.39,8,'#e1e7ea');line(W*.72,H*.19,W*.72,H*.39,8,'#e1e7ea');
 for(let i=0;i<9;i++)line(W*(.41+i*.037),H*.28,W*(.41+i*.037),H*.39,2,'rgba(240,245,247,.82)');

 // Roadside buildings
 const buildingY=groundY-150;
 for(let x=-((elapsed*35)%160)-40;x<W+160;x+=160){
  ctx.fillStyle='#c59268';ctx.fillRect(x,buildingY,112,150);
  ctx.fillStyle='#ead0ad';
  for(let r=0;r<3;r++)for(let col=0;col<3;col++)ctx.fillRect(x+13+col*31,buildingY+18+r*35,15,20);
  ctx.fillStyle='#7d5542';ctx.fillRect(x+43,buildingY+106,27,44);
 }

 // Street
 ctx.fillStyle='#4d5359';ctx.fillRect(0,groundY,W,H-groundY);
 ctx.fillStyle='#d29e66';ctx.fillRect(0,groundY-12,W,18);
 ctx.fillStyle='rgba(255,255,255,.68)';
 for(let x=-((elapsed*speed*.55)%120);x<W;x+=120)ctx.fillRect(x,groundY+52,55,5);

 // Lamps
 for(let x=-((elapsed*speed*.25)%220);x<W+220;x+=220){
  line(x,groundY-12,x,groundY-105,4,'#2d3d48');
  ctx.fillStyle='#ffd66b';ctx.beginPath();ctx.arc(x,groundY-112,8,0,7);ctx.fill();
 }
}

function drawPlayer(){
 const x=player.x,y=player.y;
 const slideFactor=player.slide>0?.62:1;
 ctx.save();ctx.translate(x+player.w/2,y+player.h/2);ctx.scale(1,slideFactor);ctx.translate(-player.w/2,-player.h/2);

 // shadow
 ctx.fillStyle='rgba(0,0,0,.20)';ctx.beginPath();ctx.ellipse(player.w/2,player.h+9,27,7,0,0,7);ctx.fill();

 const swing=Math.sin(player.runPhase)*8;
 // legs
 line(17,48,13+swing,65,9,'#17364b');line(31,48,35-swing,65,9,'#17364b');

 // jacket
 roundedRect(9,20,30,33,10,'#e95f36');
 roundedRect(14,23,20,23,8,'#f39b42');

 // arms
 line(11,30,2+swing*.35,44,8,'#efbe94');
 line(38,30,46-swing*.35,43,8,'#efbe94');

 // head
 ctx.fillStyle='#efbe94';ctx.beginPath();ctx.arc(24,12,14,0,7);ctx.fill();
 // hair
 ctx.fillStyle='#2b2b2b';ctx.beginPath();ctx.arc(24,8,13,Math.PI,0);ctx.fill();
 // red cap
 roundedRect(12,-1,25,8,4,'#b92f2f');
 // face
 ctx.fillStyle='#111';ctx.fillRect(29,11,2,2);ctx.beginPath();ctx.arc(23,17,5,0,Math.PI);ctx.fill();
 // scarf
 ctx.fillStyle='#fff';ctx.fillRect(10,19,28,5);
 ctx.restore();
}

function drawObject(o){
 if(o.type==='coin'){
  const rg=ctx.createRadialGradient(o.x-3,o.y-3,1,o.x,o.y,11);
  rg.addColorStop(0,'#fff7bb');rg.addColorStop(.45,'#ffd84c');rg.addColorStop(1,'#c88b00');
  ctx.fillStyle=rg;ctx.beginPath();ctx.arc(o.x,o.y,11,0,7);ctx.fill();
  ctx.strokeStyle='#9f6800';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#865600';ctx.font='bold 13px Arial';ctx.fillText('₺',o.x-4,o.y+4);
 }else if(o.type==='charm'){
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(o.x,o.y,13,0,7);ctx.fill();
  ctx.strokeStyle='#1d6cc0';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#1d6cc0';ctx.beginPath();ctx.arc(o.x,o.y,6,0,7);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(o.x,o.y,2.5,0,7);ctx.fill();
 }else if(o.type==='barrier'){
  roundedRect(o.x,o.y,o.w,o.h,7,'#e04a3d');
  ctx.fillStyle='#fff';ctx.fillRect(o.x+7,o.y+13,o.w-14,7);
  ctx.fillStyle='#333';ctx.fillRect(o.x+7,o.y+o.h-2,6,12);ctx.fillRect(o.x+o.w-13,o.y+o.h-2,6,12);
 }else if(o.type==='cart'){
  roundedRect(o.x,o.y+10,o.w,o.h-10,8,'#cf3b34');
  roundedRect(o.x+8,o.y,o.w-16,18,6,'#f5c841');
  ctx.fillStyle='#9c5c24';
  for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(o.x+17+i*12,o.y+8,6,0,7);ctx.fill()}
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(o.x+18,o.y+o.h+2,8,0,7);ctx.arc(o.x+o.w-18,o.y+o.h+2,8,0,7);ctx.fill();
 }else if(o.type==='tea'){
  // tea tray
  ctx.fillStyle='#7e542f';ctx.fillRect(o.x,o.y+o.h-8,o.w,8);
  for(let i=0;i<2;i++){
   const gx=o.x+14+i*25;
   ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.moveTo(gx,o.y+8);ctx.lineTo(gx+18,o.y+8);ctx.lineTo(gx+15,o.y+33);ctx.lineTo(gx+3,o.y+33);ctx.fill();
   ctx.fillStyle='#8a3f16';ctx.beginPath();ctx.moveTo(gx+3,o.y+12);ctx.lineTo(gx+15,o.y+12);ctx.lineTo(gx+13,o.y+30);ctx.lineTo(gx+5,o.y+30);ctx.fill();
  }
 }else if(o.type==='cat'){
  ctx.fillStyle='#6f7275';ctx.beginPath();ctx.arc(o.x+o.w/2,o.y+14,13,0,7);ctx.fill();
  roundedRect(o.x+10,o.y+16,o.w-20,o.h-16,8,'#6a6d70');
  poly([[o.x+8,o.y+9],[o.x+14,o.y],[o.x+18,o.y+11]],'#6f7275');
  poly([[o.x+o.w-8,o.y+9],[o.x+o.w-14,o.y],[o.x+o.w-18,o.y+11]],'#6f7275');
  ctx.fillStyle='#fff';ctx.fillRect(o.x+17,o.y+12,3,3);ctx.fillRect(o.x+27,o.y+12,3,3);
 }
}

function update(dt){
 const sec=dt/1000;

 if(state==='countdown'){
  countdownTimer+=sec;
  if(countdownTimer>=1){
   countdownTimer-=1;countdownValue--;
   if(countdownValue>0)UI.countdown.textContent=String(countdownValue);
   else if(countdownValue===0)UI.countdown.textContent='GO!';
   else startPlaying();
  }
  return;
 }
 if(state!=='playing')return;

 elapsed+=sec;
 speed=Math.min(430,220+elapsed*5.2);

 player.runPhase+=sec*12;
 if(player.slide>0)player.slide-=sec;

 player.vy+=2050*sec;
 player.y+=player.vy*sec;
 const floor=groundY-player.h;
 if(player.y>=floor){
  player.y=floor;player.vy=0;player.onGround=true;player.doubleJump=true;
 }

 spawnTimer-=sec;
 if(spawnTimer<=0){
  spawnPattern();
  spawnTimer=Math.max(1.45,2.45-elapsed*.012);
 }

 for(const o of objects){
  o.x-=speed*sec;
  if(o.type==='coin'||o.type==='charm'){
   if(!o.taken){
    const px=player.x+player.w/2,py=player.y+player.h/2;
    if(Math.hypot(px-o.x,py-o.y)<34){
     o.taken=true;
     const value=o.type==='charm'?5:1;
     runCoins+=value*combo;UI.runCoins.textContent=String(runCoins);
     UI.missionProgress.textContent=`${Math.min(15,runCoins)}/15`;
     sfx(o.type==='charm'?'charm':'coin');flash(`+${value*combo} 🪙`);
     for(let i=0;i<9;i++)particles.push({x:o.x,y:o.y,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160,life:.45,s:3+Math.random()*3,col:o.type==='charm'?'#2f7ed6':'#ffd84c'});
    }
   }
  }else{
   const px=player.x+8,py=player.y+(player.slide>0?22:5),pw=player.w-16,ph=player.slide>0?player.h-24:player.h-8;
   if(px<o.x+o.w-5&&px+pw>o.x+5&&py<o.y+o.h&&py+ph>o.y+5){
    endRun();return;
   }
   if(!o.passed&&o.x+o.w<player.x){
    o.passed=true;score++;UI.score.textContent=String(score);
    if(score%5===0){combo=Math.min(9,combo+1);maxCombo=Math.max(maxCombo,combo);UI.combo.textContent=String(combo)}
   }
  }
 }

 objects=objects.filter(o=>o.x>-100&&!o.taken);
 particles.forEach(p=>{p.x+=p.vx*sec;p.y+=p.vy*sec;p.vy+=300*sec;p.life-=sec});
 particles=particles.filter(p=>p.life>0);
}

function draw(){
 drawBackground();
 objects.forEach(drawObject);
 drawPlayer();

 for(const p of particles){
  ctx.globalAlpha=Math.max(0,p.life/.45);ctx.fillStyle=p.col;ctx.fillRect(p.x,p.y,p.s,p.s);
 }
 ctx.globalAlpha=1;
}

function loop(now){
 const dt=Math.min(34,now-lastTime);lastTime=now;
 update(dt);draw();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function dailyReward(){
 const today=new Date().toISOString().slice(0,10);
 if(localStorage.getItem('khk_daily')===today){toast(t('dailyWait'));return}
 localStorage.setItem('khk_daily',today);wallet+=30;localStorage.setItem('khk_wallet',String(wallet));
 UI.wallet.textContent=String(wallet);sfx('reward');flash('+30 🪙');toast(t('dailyOk'));
}
async function share(text){
 try{
  if(navigator.share)await navigator.share({title:'Koş Hadi Koş!',text,url:location.href});
  else{await navigator.clipboard.writeText(location.href);toast(lang==='tr'?'Bağlantı kopyalandı!':'Link copied!')}
 }catch(e){}
}

['playBtn','dailyBtn','howBtn','shareBtn','langBtn','soundBtn','pauseBtn','resumeBtn','quitBtn','restartBtn','shareScoreBtn','homeBtn'].forEach(id=>{
 $(id).addEventListener('pointerdown',e=>e.stopPropagation());
 $(id).addEventListener('click',e=>e.stopPropagation());
});

UI.playBtn.onclick=beginRun;
UI.restartBtn.onclick=beginRun;
UI.pauseBtn.onclick=pauseGame;
UI.resumeBtn.onclick=pauseGame;
UI.quitBtn.onclick=()=>{state='menu';UI.hud.classList.add('hidden');UI.missionBar.classList.add('hidden');showScreen(UI.menu)};
UI.homeBtn.onclick=()=>{state='menu';showScreen(UI.menu);refreshText()};
UI.dailyBtn.onclick=dailyReward;
UI.howBtn.onclick=()=>toast(t('howMsg'));
UI.shareBtn.onclick=()=>share(t('shareText'));
UI.shareScoreBtn.onclick=()=>share(`${t('shareText')} ${t('score')}: ${score}`);
UI.langBtn.onclick=()=>{lang=lang==='tr'?'en':'tr';refreshText();sfx('coin')};
UI.soundBtn.onclick=()=>{soundOn=!soundOn;localStorage.setItem('khk_sound',soundOn?'on':'off');refreshText();if(soundOn)sfx('coin')};

document.body.addEventListener('pointerdown',e=>{
 if(e.target.closest('button'))return;
 jump();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pauseGame()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
