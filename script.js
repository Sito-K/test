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
// 히스토리 / 리더보드
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
  const b = bannerSelect.value;
  const bannerPool = pool.banners[b] || [];
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
    if(any.length>0) return any[Math.floor(Math.random()*any.length)];
    return all[Math.floor(Math.random()*all.length)];
  }
  return candidates[Math.floor(Math.random()*candidates.length)];
}

// ==============================
// 단발/10연 뽑기 확률
// ==============================
function weightedRarityRoll(){
  let rate6 = baseRate6;

  // 6성 가속 피티
  if(pityCounter >= pityStart) {
    rate6 += pityIncrement * (pityCounter - pityStart + 1);
  }
  if(rate6 > 1) rate6 = 1;

  // -------------------------------------
  // ① 5성 천장: 10회 동안 5성 이상 없으면 이번 뽑기는 강제 5성
  // -------------------------------------
  if(pity5Counter >= 9) {
    return 5; // 이번 뽑기는 반드시 5성
  }

  // -------------------------------------
  // ② 6성 천장: 80회째는 강제 6성
  // -------------------------------------
  if(pityCounter >= defaultPityLimit - 1) {
    return 6;
  }

  // -------------------------------------
  // ③ 일반 확률 계산
  // -------------------------------------
  const r = Math.random();
  let acc = 0;

  acc += rate6;
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
// 단발/10연 실행
// ==============================
function runPull(count=1){
  const outcomes = [];
  for(let i=0;i<count;i++){
    const rty = weightedRarityRoll();
    const pick = pickRandomFromPool(rty);
    outcomes.push(pick);

// pity 처리
  if(rty === 6){
    pityCounter = 0;      // 6성 피티 리셋
    pity5Counter = 0;     // 5성 피티도 리셋
  } else if(rty === 5){
    pity5Counter = 0;     // 5성 피티 리셋
    pityCounter++;        // 6성 피티 증가
  } else {
    pityCounter++;        // 4성 → 6성 피티 증가
    pity5Counter++;       // 4성 → 5성 피티 증가
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
  // 안전히 입력값 읽기
  const nRaw = parseInt(simCountInput.value, 10);
  const trials = (Number.isFinite(nRaw) && nRaw > 0) ? nRaw : 1000;

  // 통계 초기화
  const stats = {6:0, 5:0, 4:0};
  let pullsToFirst6Sum = 0; // 각 trial에서 첫 6성까지 걸린 뽑기 수 합 (평균 계산용)
  let trialsWith6 = 0;

  // 로컬 카운터 (실제 pityCounter를 변경하지 않음)
  // 시뮬레이션을 각 trial마다 '독립'으로 보려면 pity를 0부터 시작하거나
  // 현재 pityCounter에서 시작하려면 아래와 같이 세팅.
  // 여기서는 실제 UI의 pityCounter 값에서 시작하도록 설정 (현 코드의 의도 반영)
  const startPity = pityCounter || 0;

  for(let t=0; t<trials; t++){
    let localPity = startPity;
    let pulls = 0;
    let got6ThisTrial = false;

    // 시뮬레이션에서는 '한 번에 한 장' 뽑으며, 원하는 만큼 반복.
    // 여기서는 한 trial을 '한 번의 6성 등장까지'로 정의해도 되고,
    // 단순히 trials번의 단발 뽑기를 수행할 수도 있음.
    // 편의상: 한 trial을 '단발 뽑기 1회'로 간주하는 원래 시나리오와
    // '6성까지 걸린 풀 수' 평균을 같이 보고 싶어하실 수 있어
    // 그래서 아래는 '한 trial에서 1회만 뽑기' 방식으로 구현하되,
    // 동시에 '6성까지 걸린 풀 수'는 별도 루틴으로 측정한다.

    // ------- 1) 단발 뽑기 통계 (trials 번) -------
    // 이 루프는 단발 뽑기 1회를 수행해서 등급 집계
    {
      // 확률 계산: pity 보정
      let rate6 = baseRate6;
      if(localPity >= pityStart) rate6 += pityIncrement * (localPity - pityStart + 1);
      if(rate6 > 1) rate6 = 1;

      // 천장 직전 보장
      let rty;
      if(localPity >= defaultPityLimit - 1) {
        rty = 6;
      } else {
        const r = Math.random();
        // 누적 비율 계산 (6,5,4) — rates 객체 사용
        let acc = 0;
        const r6 = rate6;
        const r5 = rates[5];
        const r4 = rates[4];
        acc += r6;
        if(r < acc) rty = 6;
        else {
          acc += r5;
          if(r < acc) rty = 5;
          else rty = 4;
        }
      }

      stats[rty] += 1;

      // pity 증가/리셋 (로컬)
      if(rty === 6) localPity = 0;
      else localPity++;

      // 끝: 이 trial은 단발 1회만 수행 (아래 추가로 6성까지 걸린 평균 계산)
    }

    // ------- 2) 6성까지 걸린 풀 수 측정 (별도 루틴) -------
    // 이 부분은 '한 번의 측정'으로 6성이 나올 때까지 뽑음
    {
      localPity = startPity;
      let ct = 0;
      while(true){
        ct++;
        // 동일한 확률 로직 사용
        let rate6b = baseRate6;
        if(localPity >= pityStart) rate6b += pityIncrement * (localPity - pityStart + 1);
        if(rate6b > 1) rate6b = 1;

        let rty2;
        if(localPity >= defaultPityLimit - 1) {
          rty2 = 6;
        } else {
          const r2 = Math.random();
          let acc2 = 0;
          acc2 += rate6b;
          if(r2 < acc2) rty2 = 6;
          else {
            acc2 += rates[5];
            if(r2 < acc2) rty2 = 5;
            else rty2 = 4;
          }
        }

        if(rty2 === 6){
          pullsToFirst6Sum += ct;
          trialsWith6++;
          break;
        } else {
          localPity++;
        }
      }
    }
  } // end trials loop

  // 결과 계산
  const total = stats[6] + stats[5] + stats[4];
  const pct6 = (stats[6]/total*100).toFixed(4);
  const pct5 = (stats[5]/total*100).toFixed(4);
  const pct4 = (stats[4]/total*100).toFixed(4);
  const avgPullsTo6 = trialsWith6 > 0 ? (pullsToFirst6Sum / trialsWith6).toFixed(2) : 'N/A';

  // 출력 문자열 구성
  const out = [
    `시뮬레이션 횟수: ${trials.toLocaleString()} (단발 기준)`,
    `시작 피티: ${startPity}`,
    '',
    `결과 요약:`,
    `  6★: ${stats[6].toLocaleString()} 회  (${pct6}%)`,
    `  5★: ${stats[5].toLocaleString()} 회  (${pct5}%)`,
    `  4★: ${stats[4].toLocaleString()} 회  (${pct4}%)`,
    '',
    `6★ 평균 획득까지 소요 뽑기수: ${avgPullsTo6}`,
    '',
    `참고: 이 시뮬레이션은 실제 UI의 pityCounter 값을 변경하지 않습니다.`
  ].join('\n');

  simOutput.textContent = out;
}

// ==============================
// 초기화
// ==============================
renderLeaderboard();
updatePullDisplay();
