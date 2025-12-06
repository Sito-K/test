// ==============================
// 상시 풀
// ==============================
const pool = {
  standard: [
    {id:'s6_1', name:'아델리아', rarity:6, img:'assets/ardelia.png'},
    {id:'s6_2', name:'엠버', rarity:6, img:'assets/ember.png'},
    {id:'s6_5', name:'라스트 라이트', rarity:6, img:'assets/lastrite.png'},
    {id:'s6_6', name:'여풍', rarity:6, img:'assets/lifeng.png'},
    {id:'s6_7', name:'포그라니치니크', rarity:6, img:'assets/pogranichnik.png'},
    
    {id:'s5_1', name:'알레쉬', rarity:5, img:'assets/alesh.png'},
    {id:'s5_2', name:'아크라이트', rarity:5, img:'assets/arclight.png'},
    {id:'s5_3', name:'아비웨나', rarity:5, img:'assets/avywenna.png'},
    {id:'s5_4', name:'진천우', rarity:5, img:'assets/chen.png'},
    {id:'s5_5', name:'판', rarity:5, img:'assets/dapan.png'},
    {id:'s5_6', name:'펠리카', rarity:5, img:'assets/perlica.png'},
    {id:'s5_7', name:'스노우샤인', rarity:5, img:'assets/snowshine.png'},
    {id:'s5_8', name:'울프가드', rarity:5, img:'assets/wulfgard.png'},
    {id:'s5_9', name:'자이히', rarity:5, img:'assets/xaihi.png'},

    {id:'s4_1', name:'아케쿠리', rarity:4, img:'assets/akekuri.png'},
    {id:'s4_2', name:'안탈', rarity:4, img:'assets/antal.png'},
    {id:'s4_3', name:'카치르', rarity:4, img:'assets/catcher.png'},
    {id:'s4_4', name:'에스텔라', rarity:4, img:'assets/estella.png'},
    {id:'s4_5', name:'플루라이트', rarity:4, img:'assets/fluorite.png'}
  ],
  banners: {
    limitedA: [
      {id:'s6_3', name:'질베르타', rarity:6, img:'assets/gilberta.png', isPickup: false},
      {id:'s6_4', name:'레바테인', rarity:6, img:'assets/laevatain.png', isPickup: true},
      {id:'s6_8', name:'이본', rarity:6, img:'assets/yvonne.png', isPickup: false}
    ],
    limitedB: [
      {id:'s6_3', name:'질베르타', rarity:6, img:'assets/gilberta.png', isPickup: false},
      {id:'s6_4', name:'레바테인', rarity:6, img:'assets/laevatain.png', isPickup: false},
      {id:'s6_8', name:'이본', rarity:6, img:'assets/yvonne.png', isPickup: true}
    ],
    limitedC: [
      {id:'s6_3', name:'질베르타', rarity:6, img:'assets/gilberta.png', isPickup: true},
      {id:'s6_4', name:'레바테인', rarity:6, img:'assets/laevatain.png', isPickup: false},
      {id:'s6_8', name:'이본', rarity:6, img:'assets/yvonne.png', isPickup: false}
    ]
  }
};

// ==============================
// 확률 / 천장 설정
// ==============================
const baseRate6 = 0.008;
let rates = {5:0.08, 4:0.912};
const defaultPityLimit = 80;
let pityCounter = 0;
let totalPullCounter = 0;
const pityStart = 65;
const pityIncrement = 0.05;

// ==============================
// DOM
// ==============================
const resultsEl = document.getElementById('results');
const leaderboardEl = document.getElementById('leaderboard');
const singleBtn = document.getElementById('singleBtn');
const tenBtn = document.getElementById('tenBtn');
const bannerSelect = document.getElementById('bannerSelect');
const cardTpl = document.getElementById('cardTpl').content;
const simCountInput = document.getElementById('simCount');
const runSim = document.getElementById('runSim');
const simOutput = document.getElementById('simOutput');
const clearLB = document.getElementById('clearLB');
const currentPullCountEl = document.getElementById('currentPullCount');
const pityRemainingEl = document.getElementById('pityRemaining');
const currentRate6El = document.getElementById('currentRate6');
const totalPullCountEl = document.getElementById('totalPullCount');

// ==============================
// 이벤트
// ==============================
singleBtn.addEventListener('click', ()=> runPull(1));
tenBtn.addEventListener('click', ()=> runPull(10));
runSim.addEventListener('click', ()=> runSimulation());
clearLB.addEventListener('click', ()=> { 
  localStorage.removeItem('gacha_lb'); 
  renderLeaderboard(); 
});

// 배너 변경 시 천장 초기화
bannerSelect.addEventListener('change', ()=>{
  pityCounter = 0;
  updatePullDisplay();
});

// ==============================
// 뽑기 표시
// ==============================
function updatePullDisplay() {
  currentPullCountEl.textContent = pityCounter;
  pityRemainingEl.textContent = Math.max(0, defaultPityLimit - pityCounter);
  totalPullCountEl.textContent = totalPullCounter;

  let currentRate = baseRate6;
  if(pityCounter >= pityStart) currentRate += pityIncrement * (pityCounter - pityStart + 1);
  if(currentRate > 1) currentRate = 1;
  currentRate6El.textContent = (currentRate*100).toFixed(2) + '%';
}

// ==============================
// 히스토리 & 리더보드
// ==============================
function pushHistory(entry){
  const key = 'gacha_history';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift(entry);
  localStorage.setItem(key, JSON.stringify(list.slice(0,200)));

  const lbKey = 'gacha_lb';
  const lb = JSON.parse(localStorage.getItem(lbKey) || '[]');
  if(entry.rarity === 6){
    lb.unshift({when: entry.when, name: entry.name});
    localStorage.setItem(lbKey, JSON.stringify(lb.slice(0,50)));
  }
  renderLeaderboard();
}

function renderLeaderboard(){
  const lb = JSON.parse(localStorage.getItem('gacha_lb') || '[]');
  if(lb.length===0) leaderboardEl.textContent='기록 없음';
  else leaderboardEl.innerHTML = lb.slice(0,20)
    .map((e,i)=> `<div>${i+1}. ${e.name} — ${new Date(e.when).toLocaleString()}</div>`).join('');
}

// ==============================
// 배너 풀
// ==============================
function getBannerPool(bannerKey){
  const limitedPool = pool.banners[bannerKey] || [];
  return [...pool.standard, ...limitedPool];
}

// ==============================
// 뽑기 로직
// ==============================
function pickRandomFromPool(rarity){
  const bannerPool = pool.banners[bannerSelect.value] || [];
  const standardPool = pool.standard;

  if(rarity===6){
    const pickup6 = bannerPool.filter(x=>x.rarity===6 && x.isPickup);
    const other6 = [...standardPool, ...bannerPool].filter(x=>x.rarity===6 && !x.isPickup);

    if(pickup6.length>0 && Math.random()<0.5){
      return pickup6[Math.floor(Math.random()*pickup6.length)];
    } else if(other6.length>0){
      return other6[Math.floor(Math.random()*other6.length)];
    }
  }

  const candidates = [...standardPool, ...bannerPool].filter(x=>x.rarity===rarity);
  if(candidates.length===0){
    const all = Object.values(pool.banners).flat().concat(pool.standard);
    const any = all.filter(x=>x.rarity===rarity);
    return any[Math.floor(Math.random()*any.length)];
  }
  return candidates[Math.floor(Math.random()*candidates.length)];
}

// ==============================
// 뽑기 확률
// ==============================
function weightedRarityRoll(){
  let rate6 = baseRate6;
  if(pityCounter >= pityStart) rate6 += pityIncrement * (pityCounter - pityStart + 1);
  if(rate6 > 1) rate6 = 1;

  if(pityCounter >= defaultPityLimit - 1) return 6;

  const r = Math.random();
  let acc = 0;
  for(const rty of [6,5,4]){
    const rRate = (rty===6)? rate6 : rates[rty];
    acc += rRate;
    if(r < acc) return rty;
  }
  return 4;
}

// ==============================
// 카드 렌더링
// ==============================
function renderCards(outcomes,count){
  resultsEl.innerHTML='';
  resultsEl.className='results-grid '+(count===10?'ten':'single');
  outcomes.forEach(card=>{
    const node = cardTpl.cloneNode(true);
    const el = node.querySelector('.card');
    el.classList.add('r'+card.rarity);
    node.querySelector('.char-img').src=card.img||'assets/placeholder.png';
    node.querySelector('.char-name').textContent=card.name;
    node.querySelector('.rarity-badge').textContent=card.rarity+'★';
    resultsEl.appendChild(node);
  });
}

// ==============================
// 단발/10연 뽑기
// ==============================
function runPull(count=1){
  const outcomes = [];
  for(let i=0;i<count;i++){
    const rty = weightedRarityRoll();
    const pick = pickRandomFromPool(rty);
    outcomes.push(pick);

    if(rty===6) pityCounter = 0;
    else pityCounter++;

    totalPullCounter++;
    pushHistory({when:new Date().toISOString(), name:pick.name, rarity:pick.rarity});
  }

  renderCards(outcomes,count);
  updatePullDisplay();
}

// ==============================
// 시뮬레이션
// ==============================
function runSimulation(){
  const n = Math.max(1, parseInt(simCountInput.value||1000));
  let got6 = 0, pullsToFirst6 = null, totalPulls = 0;

  for(let i=0;i<n;i++){
    let localPity = 0;
    let pulls = 0;
    while(true){
      pulls++;
      totalPulls++;
      let rate6 = baseRate6;
      if(localPity >= pityStart) rate6 += pityIncrement*(localPity-pityStart+1);
      if(rate6>1) rate6=1;
      const r = Math.random();
      let rty = 4;
      let acc = 0;
      for(const t of [6,5,4]){
        const rRate = (t===6)? rate6 : rates[t];
        acc += rRate;
        if(r<acc){ rty = t; break; }
      }

      if(rty===6){
        got6++;
        if(pullsToFirst6===null) pullsToFirst6 = pulls;
        break;
      } else localPity++;
    }
  }

  const avgPullsFor6 = (totalPulls / got6) || 0;
  simOutput.textContent = `실험 수: ${n}\n6성 획득 총합: ${got6}\n평균 뽑기 (6성 당): ${avgPullsFor6.toFixed(2)}\n첫 6성까지 걸린 뽑기(샘플): ${pullsToFirst6}`;
}

// ==============================
// 초기화
renderLeaderboard();
updatePullDisplay();
