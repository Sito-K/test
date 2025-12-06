// ====== 샘플 풀 (실제 이미지로 교체하세요) ======
const pool = {
  standard: [
    {id:'s6_1', name:'아델리아', rarity:6, img:'assets/ardelia.png'},
    {id:'s6_2', name:'엠버', rarity:6, img:'assets/ember.png'},
    {id:'s6_4', name:'질베르타', rarity:6, img:'assets/gilberta.png'},
    {id:'s6_5', name:'레바테인', rarity:6, img:'assets/laevatain.png'},
    {id:'s6_6', name:'라스트 라이트', rarity:6, img:'assets/lastrite.png'},
    {id:'s6_7', name:'여풍', rarity:6, img:'assets/lifeng.png'},
    {id:'s6_8', name:'Pogranichnik', rarity:6, img:'assets/pogranichnik.png'},
    {id:'s6_9', name:'이본', rarity:6, img:'assets/yvonne.png'},
    
    {id:'s5_1', name:'알레쉬', rarity:5, img:'assets/alesh.png'},
    {id:'s5_2', name:'아크라이트', rarity:5, img:'assets/arclight.png'},
    {id:'s5_3', name:'아비웨나', rarity:5, img:'assets/avywenna.png'},
    {id:'s5_4', name:'전천우', rarity:5, img:'assets/chen.png'},
    {id:'s5_5', name:'판', rarity:5, img:'assets/dapan.png'},
    {id:'s5_6', name:'펠리카', rarity:5, img:'assets/perlica.png'},
    {id:'s5_7', name:'스노우샤인', rarity:5, img:'assets/snowshine.png'},
    {id:'s5_8', name:'울프가드', rarity:5, img:'assets/wulfgard.png'},
    {id:'s5_9', name:'자이히', rarity:5, img:'assets/xaihi.png'},

    {id:'s4_1', name:'아케쿠리', rarity:4, img:'assets/akekuri.png'},
    {id:'s4_2', name:'안탈', rarity:4, img:'assets/antal.png'},
    {id:'s4_3', name:'4★: Catcher', rarity:4, img:'assets/catcher.png'},
    {id:'s4_4', name:'에스텔라', rarity:4, img:'assets/estella.png'},
    {id:'s4_5', name:'플로라이트', rarity:4, img:'assets/fluorite.png'}
  ],
  limited: [
    // limited banner can alter pity/rates or pool
    {id:'l6_1', name:'6★: Limited A', rarity:6, img:'assets/6star1.png'},
    {id:'l5_1', name:'5★: Limited A', rarity:5, img:'assets/5star1.png'},
    {id:'l4_1', name:'4★: Limited A', rarity:4, img:'assets/4star1.png'}
  ]
};

// 기본 rates (6★는 슬라이더 조정 가능)
let rates = {6:0.008, 5:0.08, 4:0.912};
const defaultPityLimit = 80;
let pityCounter = 0;

// 요소
const resultsEl = document.getElementById('results');
const logEl = document.getElementById('log');
const leaderboardEl = document.getElementById('leaderboard');
const singleBtn = document.getElementById('singleBtn');
const tenBtn = document.getElementById('tenBtn');
const pityToggle = document.getElementById('pityToggle');
const rate6 = document.getElementById('rate6');
const rate6Label = document.getElementById('rate6Label');
const bannerSelect = document.getElementById('bannerSelect');
const cardTpl = document.getElementById('cardTpl').content;
const simCountInput = document.getElementById('simCount');
const runSim = document.getElementById('runSim');
const simOutput = document.getElementById('simOutput');
const clearLB = document.getElementById('clearLB');

rate6.addEventListener('input', () => {
  const v = parseFloat(rate6.value);
  rate6Label.textContent = v.toFixed(2) + '%';
  // 6%? slider is in percent units where value 0.8 means 0.8%
  rates[6] = v / 100;
  // distribute leftover to 5/4 proportionally (keep 5 at 8% baseline)
  // keep 5 fixed at 8% for simplicity; rest to 4
  rates[5] = 0.08;
  rates[4] = 1 - rates[6] - rates[5];
});

singleBtn.addEventListener('click', ()=> runPull(1));
tenBtn.addEventListener('click', ()=> runPull(10));
runSim.addEventListener('click', ()=> runSimulation());
clearLB.addEventListener('click', ()=> { localStorage.removeItem('gacha_lb'); renderLeaderboard(); });

// 초기화
renderLeaderboard();
updateRateLabel();

// ===== 로컬 히스토리/리더보드 (로컬스토리지) =====
function pushHistory(entry){
  const key = 'gacha_history';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift(entry);
  localStorage.setItem(key, JSON.stringify(list.slice(0,200))); // 최근 200개 저장
  // also update leaderboard: track best single 6★ luck (example metric: pull index)
  const lbKey = 'gacha_lb';
  const lb = JSON.parse(localStorage.getItem(lbKey) || '[]');
  if (entry.rarity === 6){
    lb.unshift({when: entry.when, name: entry.name});
    localStorage.setItem(lbKey, JSON.stringify(lb.slice(0,50)));
  }
  renderLeaderboard();
}

function renderLeaderboard(){
  const lb = JSON.parse(localStorage.getItem('gacha_lb') || '[]');
  if (lb.length === 0) leaderboardEl.textContent = '기록 없음';
  else {
    leaderboardEl.innerHTML = lb.slice(0,20).map((e,i)=> `<div>${i+1}. ${e.name} — ${new Date(e.when).toLocaleString()}</div>`).join('');
  }
}

// ===== 뽑기 로직 =====
function weightedRarityRoll(applyPity=true){
  if (applyPity && pityToggle.checked && pityCounter >= defaultPityLimit - 1){
    return 6; // 강제 6성
  }
  const r = Math.random();
  let acc = 0;
  for (const rty of [6,5,4]){
    acc += rates[rty];
    if (r < acc) return rty;
  }
  return 4;
}

function pickRandomFromPool(rarity){
  const b = bannerSelect.value;
  const candidates = (pool[b] || pool.standard).filter(x => x.rarity === rarity);
  if (candidates.length === 0){
    // fallback across banners
    const all = Object.values(pool).flat();
    const any = all.filter(x=>x.rarity===rarity);
    if (any.length>0) return any[Math.floor(Math.random()*any.length)];
    return all[Math.floor(Math.random()*all.length)];
  }
  return candidates[Math.floor(Math.random()*candidates.length)];
}

// 렌더 카드
function renderCards(outcomes, count){
  resultsEl.innerHTML = '';
  resultsEl.className = 'results-grid ' + (count === 10 ? 'ten' : 'single');
  outcomes.forEach(card => {
    const node = cardTpl.cloneNode(true);
    const el = node.querySelector('.card');
    el.classList.add('r' + card.rarity);
    node.querySelector('.char-img').src = card.img || 'assets/placeholder.png';
    node.querySelector('.char-name').textContent = card.name;
    node.querySelector('.rarity-badge').textContent = card.rarity + '★';
    resultsEl.appendChild(node);
  });
}

// 실행: 단발/10연
function runPull(count=1){
  const outcomes = [];
  for (let i=0;i<count;i++){
    const rty = weightedRarityRoll(true);
    const pick = pickRandomFromPool(rty);
    outcomes.push(pick);
    // pity counter
    if (rty === 6) pityCounter = 0;
    else pityCounter++;
    // push history individual entries for single pulls
    pushHistory({when: new Date().toISOString(), name: pick.name, rarity: pick.rarity});
  }
  renderCards(outcomes, count);
  // 로그 요약
  logEl.textContent = `${count}회 소환: ${outcomes.map(o=>`${o.name}(${o.rarity}★)`).join(' / ')}`;
}

// ===== 시뮬레이션 기능 =====
function runSimulation(){
  const n = Math.max(1, parseInt(simCountInput.value || 1000));
  let got6 = 0;
  let pullsToFirst6 = null;
  let totalPulls = 0;
  let localPity = 0;
  for (let i=0;i<n;i++){
    // simulate single pulls until you get a 6 (one full experiment)
    let pulls = 0;
    while(true){
      pulls++;
      totalPulls++;
      const rty = (pityToggle.checked && localPity >= defaultPityLimit-1) ? 6 : (Math.random() < rates[6] ? 6 : (Math.random() < rates[5]/(rates[5]+rates[4]) ? 5 : 4));
      if (rty === 6){
        got6++;
        localPity = 0;
        if (pullsToFirst6 === null) pullsToFirst6 = pulls;
        break;
      } else {
        localPity++;
      }
    }
  }
  const avgPullsFor6 = (totalPulls / got6) || 0;
  simOutput.textContent = `실험 수: ${n}\n6성 획득 총합: ${got6}\n평균 뽑기 (6성 당): ${avgPullsFor6.toFixed(2)}\n첫 6성까지 걸린 뽑기(샘플): ${pullsToFirst6}`;
}

// ===== 보조 =====
function updateRateLabel(){ rate6Label.textContent = (parseFloat(rate6.value)||0).toFixed(2) + '%'; }
updateRateLabel();
