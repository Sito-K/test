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
// 확률 / 천장
// ==============================
const baseRate6 = 0.008;
let rates = {5:0.08, 4:0.912};
const defaultPityLimit = 80;
let pityCounter = 0;
let pity5Counter = 0;
let totalPullCounter = 0;
const pityStart = 65;
const pityIncrement = 0.05;

// ==============================
// DOM 요소
// ==============================
const resultsEl = document.getElementById('results');
const leaderboardEl = document.getElementById('leaderboard');
const singleBtn = document.getElementById('singleBtn');
const tenBtn = document.getElementById('tenBtn');
const cardTpl = document.getElementById('cardTpl').content;
const simCountInput = document.getElementById('simCount');
const runSim = document.getElementById('runSim');
const simOutput = document.getElementById('simOutput');
const clearLB = document.getElementById('clearLB');
const currentPullCountEl = document.getElementById('currentPullCount');
const pityRemainingEl = document.getElementById('pityRemaining');
const currentRate6El = document.getElementById('currentRate6');
const totalPullCountEl = document.getElementById('totalPullCount');

// 🔥 배너 선택 버튼 
const bannerButtons = document.querySelectorAll('.banner-btn');
let currentBanner = "standard";

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

// 🔥 버튼 클릭 → 배너 변경
bannerButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{

    currentBanner = btn.dataset.banner;

    bannerButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');

    pityCounter = 0;
    pity5Counter = 0;
    updatePullDisplay();
  });
});

// ==============================
// 표시 업데이트
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
// 히스토리
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
function getBannerPool(){
  return [...pool.standard, ...(pool.banners[currentBanner] || [])];
}

// ==============================
// 캐릭터 선택
// ==============================
function pickRandomFromPool(rarity){
  const bannerPool = pool.banners[currentBanner] || [];
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
  return candidates[Math.floor(Math.random()*candidates.length)];
}

// ==============================
// 확률 로직 (5성 천장 포함)
// ==============================
function weightedRarityRoll(){
  let rate6 = baseRate6;

  if(pityCounter >= pityStart) {
    rate6 += pityIncrement * (pityCounter - pityStart + 1);
  }
  if(rate6 > 1) rate6 = 1;

  // 5성 천장
  if(pity5Counter >= 9) {
    return 5;
  }

  // 6성 천장
  if(pityCounter >= defaultPityLimit - 1) {
    return 6;
  }

  const r = Math.random();
  let acc = rate6;
  if(r < acc) return 6;

  acc += rates[5];
  if(r < acc) return 5;

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
// 뽑기 실행
// ==============================
function runPull(count=1){
  const outcomes = [];
  for(let i=0;i<count;i++){
    const rty = weightedRarityRoll();
    const pick = pickRandomFromPool(rty);
    outcomes.push(pick);

    // pity 처리
    if(rty === 6){
      pityCounter = 0;
      pity5Counter = 0;
    } else if(rty === 5){
      pity5Counter = 0;
      pityCounter++;
    } else {
      pityCounter++;
      pity5Counter++;
    }

    totalPullCounter++;
    pushHistory({when:new Date().toISOString(), name:pick.name, rarity:pick.rarity});
  }
  renderCards(outcomes,count);
  updatePullDisplay();
}

// ==============================
// 확률 시뮬레이션 기능
// ==============================
function runSimulation(){
  const nRaw = parseInt(simCountInput.value, 10);
  const trials = (Number.isFinite(nRaw) && nRaw > 0) ? nRaw : 1000;

  // 통계
  const stats = {6:0, 5:0, 4:0};
  let pullsToFirst6Sum = 0;
  let trialsWith6 = 0;
  const startPity6 = 0;
  const startPity5 = 0;

  for(let t=0; t<trials; t++){
    // 각 trial마다 pity 독립 관리 (실제 UI 피티와 분리)
    let local6 = startPity6;
    let local5 = startPity5;

    // ---------------------
    // 1) 단발 뽑기 1회 통계
    // ---------------------
    let rate6 = baseRate6;
    if(local6 >= pityStart) rate6 += pityIncrement * (local6 - pityStart + 1);
    if(rate6 > 1) rate6 = 1;

    let rty;

    // ① 5성 천장(10회 보장)
    if(local5 >= 9){
      const r = Math.random();
      if(r < rate6) rty = 6;
      else rty = 5;
    }
    // ② 6성 천장(80회 보장)
    else if(local6 >= defaultPityLimit - 1){
      rty = 6;
    }
    // ③ 일반 롤
    else {
      const r = Math.random();
      let acc = 0;
      acc += rate6;
      if(r < acc) rty = 6;
      else {
        acc += rates[5];
        if(r < acc) rty = 5;
        else rty = 4;
      }
    }

    stats[rty]++;

    // local pity 업데이트
    if(rty === 6){
      local6 = 0;
      local5 = 0;
    } else if(rty === 5){
      local6++;
      local5 = 0;
    } else {
      local6++;
      local5++;
    }

    // ---------------------
    // 2) "6성까지 몇 뽑?" 통계
    // ---------------------
    let p6 = startPity6;
    let p5 = startPity5;
    let pulls = 0;

    while(true){
      pulls++;

      let rate6b = baseRate6;
      if(p6 >= pityStart) rate6b += pityIncrement * (p6 - pityStart + 1);
      if(rate6b > 1) rate6b = 1;

      let r2;
      // 5성 천장
      if(p5 >= 9){
        const r = Math.random();
        if(r < rate6b) r2 = 6;
        else r2 = 5;
      }
      // 6성 천장
      else if(p6 >= defaultPityLimit - 1){
        r2 = 6;
      }
      // 일반 롤
      else {
        const rr = Math.random();
        let acc2 = 0;
        acc2 += rate6b;
        if(rr < acc2) r2 = 6;
        else {
          acc2 += rates[5];
          if(rr < acc2) r2 = 5;
          else r2 = 4;
        }
      }

      if(r2 === 6){
        pullsToFirst6Sum += pulls;
        trialsWith6++;
        break;
      } else if(r2 === 5){
        p6++;
        p5 = 0;
      } else {
        p6++;
        p5++;
      }
    }
  }

  // 결과 계산
  const total = stats[6] + stats[5] + stats[4];
  const pct6 = (stats[6]/total*100).toFixed(4);
  const pct5 = (stats[5]/total*100).toFixed(4);
  const pct4 = (stats[4]/total*100).toFixed(4);
  const avgPullsTo6 = trialsWith6 > 0 ? (pullsToFirst6Sum / trialsWith6).toFixed(2) : 'N/A';

  const out = [
    `시뮬레이션 횟수: ${trials.toLocaleString()}`,
    '',
    `결과 요약:`,
    `  6성: ${stats[6].toLocaleString()}개 (${pct6}%)`,
    `  5성: ${stats[5].toLocaleString()}개 (${pct5}%)`,
    `  4성: ${stats[4].toLocaleString()}개 (${pct4}%)`,
    '',
    `6성 등장까지 평균 뽑기수: ${avgPullsTo6}`,
    '',
  ].join('\n');

  simOutput.textContent = out;
}

// ==============================
// 초기화
// ==============================
renderLeaderboard();
updatePullDisplay();
