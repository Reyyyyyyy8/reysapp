// ReysApp — logika utama
const KATEGORI = {
  pengeluaran:['Makan','Transport','Belanja','Tagihan','Hiburan','Kesehatan','Lainnya'],
  pemasukan:['Gaji','Freelance','Bonus','Jualan','Hadiah','Lainnya']
};
const PALETTE=['#ff5a1f','#ffb02e','#2ed47a','#39a0ff','#b066ff','#ff5d6c','#28c4c4','#9aa7ff'];
const BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
let tipe='pengeluaran';
let kategori=KATEGORI.pengeluaran[0];
let data=[];
let curTab='catat';
let cursor=new Date();
const API_KEY='reysapp_api_url';
const BUDGET_KEY='reysapp_budget';
const GEMINI_KEY='reysapp_gemini_key';
const OPENROUTER_KEY='reysapp_openrouter_key';
const AI_PROVIDER_KEY='reysapp_ai_provider';
function getGemini(){return localStorage.getItem(GEMINI_KEY)||'';}
function getOpenRouter(){return localStorage.getItem(OPENROUTER_KEY)||'';}
function getProvider(){return localStorage.getItem(AI_PROVIDER_KEY)||'gemini';}
function getAiKey(){return getProvider()==='openrouter'?getOpenRouter():getGemini();}
const HIDE_KEY='reysapp_hide_saldo';
function getHide(){return localStorage.getItem(HIDE_KEY)==='1';}
function toggleSaldo(){localStorage.setItem(HIDE_KEY,getHide()?'0':'1');render();}
function getBudgets(){try{return JSON.parse(localStorage.getItem(BUDGET_KEY))||{};}catch(e){return {};}}
function setBudget(kat,val){const b=getBudgets();if(val>0)b[kat]=val;else delete b[kat];localStorage.setItem(BUDGET_KEY,JSON.stringify(b));render();}
function spentByCat(md){const m={};md.filter(d=>d.tipe==='pengeluaran').forEach(d=>{m[d.kategori]=(m[d.kategori]||0)+d.nominal;});return m;}

function rp(n){return 'Rp '+(Number(n)||0).toLocaleString('id-ID');}
function rpShort(n){n=Number(n)||0;if(n>=1e9)return 'Rp '+(n/1e9).toFixed(1)+'M';if(n>=1e6)return 'Rp '+(n/1e6).toFixed(1)+'jt';if(n>=1e3)return 'Rp '+(n/1e3).toFixed(0)+'rb';return 'Rp '+n;}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);}
function getApi(){return localStorage.getItem(API_KEY)||'';}
function ymOf(s){return (s||'').slice(0,7);}
function curYM(){return cursor.getFullYear()+'-'+String(cursor.getMonth()+1).padStart(2,'0');}
function monthData(){const ym=curYM();return data.filter(d=>ymOf(d.tanggal)===ym);}
function prevYM(){const d=new Date(cursor.getFullYear(),cursor.getMonth()-1,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function monthDataYM(ym){return data.filter(d=>ymOf(d.tanggal)===ym);}
const RUTIN_KEY='reysapp_rutin';
const GOAL_KEY='reysapp_goal';
function getRutin(){try{return JSON.parse(localStorage.getItem(RUTIN_KEY))||[];}catch(e){return [];}}
function setRutinArr(arr){localStorage.setItem(RUTIN_KEY,JSON.stringify(arr));}
function getGoal(){try{return JSON.parse(localStorage.getItem(GOAL_KEY))||null;}catch(e){return null;}}
function setGoalData(g){localStorage.setItem(GOAL_KEY,JSON.stringify(g));}
function avgSurplus(){
  const byM={};
  data.forEach(d=>{const m=ymOf(d.tanggal);if(!byM[m])byM[m]=0;byM[m]+=d.tipe==='pemasukan'?d.nominal:-d.nominal;});
  const vals=Object.values(byM);
  if(!vals.length)return 0;
  return vals.reduce((s,v)=>s+v,0)/vals.length;
}

function setTab(t){
  curTab=t;
  document.getElementById('tabCatat').classList.toggle('active',t==='catat');
  document.getElementById('tabDash').classList.toggle('active',t==='dash');
  document.getElementById('tabBudget').classList.toggle('active',t==='budget');
  document.getElementById('tabAI').classList.toggle('active',t==='ai');
  document.getElementById('viewCatat').classList.toggle('hidden',t!=='catat');
  document.getElementById('viewDash').classList.toggle('hidden',t!=='dash');
  document.getElementById('viewBudget').classList.toggle('hidden',t!=='budget');
  document.getElementById('viewAI').classList.toggle('hidden',t!=='ai');
  render();
}
function shiftMonth(d){cursor.setMonth(cursor.getMonth()+d);render();}

function setTipe(t){
  tipe=t;
  document.getElementById('segOut').classList.toggle('active',t==='pengeluaran');
  document.getElementById('segIn').classList.toggle('active',t==='pemasukan');
  renderChips();
}
function renderChips(){
  const box=document.getElementById('chips');box.innerHTML='';
  kategori=KATEGORI[tipe][0];
  KATEGORI[tipe].forEach((k,i)=>{
    const c=document.createElement('div');
    c.className='chip'+(i===0?' active':'');c.textContent=k;
    c.onclick=()=>{kategori=k;[...box.children].forEach(x=>x.classList.remove('active'));c.classList.add('active');};
    box.appendChild(c);
  });
}
function formatNominal(el){let v=el.value.replace(/[^0-9]/g,'');el.value=v?Number(v).toLocaleString('id-ID'):'';}
function nominalVal(){return Number(document.getElementById('nominal').value.replace(/[^0-9]/g,''))||0;}

function render(){
  document.getElementById('monthLbl').textContent=BULAN[cursor.getMonth()]+' '+cursor.getFullYear();
  const md=monthData();
  let tin=0,tout=0;
  md.forEach(d=>{d.tipe==='pemasukan'?tin+=d.nominal:tout+=d.nominal;});
  let allIn=0,allOut=0;
  data.forEach(d=>{d.tipe==='pemasukan'?allIn+=d.nominal:allOut+=d.nominal;});
  const hidden=getHide();
  document.getElementById('saldo').textContent=hidden?'Rp \u2022\u2022\u2022\u2022\u2022\u2022':rp(allIn-allOut);
  const eye=document.getElementById('eyeBtn');if(eye)eye.textContent=hidden?'\ud83d\ude48':'\ud83d\udc41\ufe0f';
  document.getElementById('totalIn').textContent=rp(tin);
  document.getElementById('totalOut').textContent=rp(tout);
  const fl=document.getElementById('flowLabel');if(fl)fl.textContent='Arus '+BULAN[cursor.getMonth()]+' '+cursor.getFullYear();
  const list=document.getElementById('list');
  if(!md.length){list.innerHTML='<div class="empty">Belum ada transaksi bulan ini.</div>';}
  else{
    list.innerHTML='';
    md.forEach(d=>{
      const inc=d.tipe==='pemasukan';
      const row=document.createElement('div');row.className='tx';
      row.innerHTML='<div class="ic '+(inc?'in':'out')+'">'+(inc?'↑':'↓')+'</div>'+
        '<div class="info"><div class="k"></div><div class="m"></div></div>'+
        '<div class="amt '+(inc?'in':'out')+'">'+(inc?'+':'-')+rp(d.nominal)+'</div>'+
        '<button class="del">✕</button>';
      row.querySelector('.k').textContent=d.kategori;
      row.querySelector('.m').textContent=d.tanggal+(d.catatan?' · '+d.catatan:'');
      row.querySelector('.del').onclick=()=>hapus(d.id);
      list.appendChild(row);
    });
  }
  if(curTab==='dash')renderDash(md,tin,tout);
  if(curTab==='budget'){renderBudget(md);renderGoal();}
  renderRutin();
}

function renderDash(md,tin,tout){
  document.getElementById('dIn').textContent=rp(tin);
  document.getElementById('dOut').textContent=rp(tout);
  const net=document.getElementById('dNet');net.textContent=rp(tin-tout);
  net.className='v '+((tin-tout)>=0?'in':'out');
  const pm=monthDataYM(prevYM());
  let pin=0,pout=0;pm.forEach(d=>{d.tipe==='pemasukan'?pin+=d.nominal:pout+=d.nominal;});
  renderCompare(tin,tout,pin,pout);
  renderSavings(tin,tout);
  const map={};
  md.filter(d=>d.tipe==='pengeluaran').forEach(d=>{map[d.kategori]=(map[d.kategori]||0)+d.nominal;});
  const arr=Object.keys(map).map(k=>({nama:k,val:map[k]})).sort((a,b)=>b.val-a.val);
  arr.forEach((a,i)=>a.color=PALETTE[i%PALETTE.length]);
  const total=arr.reduce((s,a)=>s+a.val,0);
  drawDonut(arr,total);
  const lg=document.getElementById('legend');
  if(!arr.length){lg.innerHTML='<div class="empty" style="text-align:left;padding:0;">Belum ada pengeluaran.</div>';}
  else{
    lg.innerHTML='';
    arr.forEach(a=>{
      const pc=total?Math.round(a.val/total*100):0;
      const li=document.createElement('div');li.className='li';
      li.innerHTML='<span class="dot" style="background:'+a.color+'"></span>'+
        '<span class="nm"></span><span class="vl"></span> <span class="pc">'+pc+'%</span>';
      li.querySelector('.nm').textContent=a.nama;
      li.querySelector('.vl').textContent=rpShort(a.val);
      lg.appendChild(li);
    });
  }
  const bars=document.getElementById('bars');
  if(!arr.length){bars.innerHTML='<div class="empty">Belum ada pengeluaran bulan ini.</div>';}
  else{
    const max=arr[0].val;bars.innerHTML='';
    arr.slice(0,6).forEach(a=>{
      const b=document.createElement('div');b.className='bar';
      b.innerHTML='<div class="top"><span></span><span class="vl"></span></div>'+
        '<div class="track"><div class="fill" style="width:'+(max?a.val/max*100:0)+'%;background:'+a.color+'"></div></div>';
      b.querySelector('.top span').textContent=a.nama;
      b.querySelector('.vl').textContent=rp(a.val);
      bars.appendChild(b);
    });
  }
}

function drawDonut(arr,total){
  const svg=document.getElementById('donut');
  const cx=65,cy=65,r=48,sw=18,C=2*Math.PI*r;
  let html='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#1f0f3e" stroke-width="'+sw+'"/>';
  let off=0;
  if(total>0){
    arr.forEach(a=>{
      const len=a.val/total*C;
      html+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+a.color+'" stroke-width="'+sw+'" '+
        'stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 '+cx+' '+cy+')"/>';
      off+=len;
    });
  }
  html+='<text x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" class="donutcenter">Total</text>';
  html+='<text x="'+cx+'" y="'+(cy+13)+'" text-anchor="middle" class="donuttotal">'+rpShort(total)+'</text>';
  svg.innerHTML=html;
}

function renderBudget(md){
  const spent=spentByCat(md);
  const budgets=getBudgets();
  const box=document.getElementById('budgetList');
  box.innerHTML='';
  KATEGORI.pengeluaran.forEach(kat=>{
    const limit=budgets[kat]||0;
    const used=spent[kat]||0;
    const pct=limit?Math.min(used/limit*100,100):0;
    let color='var(--green)';
    if(limit&&used/limit>=1)color='var(--red)';
    else if(limit&&used/limit>=0.8)color='var(--orange)';
    const row=document.createElement('div');row.className='bgt';
    row.innerHTML='<div class="bgt-top"><span class="nm"></span>'+
      '<span class="lim">Rp <input type="tel" inputmode="numeric" class="bgt-in" placeholder="0"></span></div>'+
      '<div class="track"><div class="fill"></div></div>'+
      '<div class="bgt-info"></div>';
    row.querySelector('.nm').textContent=kat;
    const inp=row.querySelector('.bgt-in');
    inp.value=limit?limit.toLocaleString('id-ID'):'';
    inp.oninput=()=>{formatNominal(inp);};
    inp.onchange=()=>{setBudget(kat,Number(inp.value.replace(/[^0-9]/g,''))||0);};
    const fill=row.querySelector('.fill');
    fill.style.width=pct+'%';fill.style.background=color;
    const info=row.querySelector('.bgt-info');
    if(!limit){info.innerHTML='Belum diset \u00b7 kepake '+rp(used);}
    else if(used>limit){info.innerHTML='<span class="bad">\u26a0\ufe0f Over '+rp(used-limit)+'</span> \u00b7 '+rp(used)+' / '+rp(limit);}
    else{info.innerHTML=rp(used)+' / '+rp(limit)+' \u00b7 sisa '+rp(limit-used);}
    box.appendChild(row);
  });
}

function checkBudgetAlert(kat){
  const b=getBudgets();const limit=b[kat];if(!limit)return;
  const used=spentByCat(monthData())[kat]||0;
  const r=used/limit;
  if(r>=1)toast('\u26a0\ufe0f Budget '+kat+' udah OVER! ('+rp(used)+' / '+rp(limit)+')');
  else if(r>=0.8)toast('\u26a0\ufe0f Budget '+kat+' udah '+Math.round(r*100)+'% kepake');
}

function buildFinanceSummary(){
  let allIn=0,allOut=0;
  data.forEach(d=>{d.tipe==='pemasukan'?allIn+=d.nominal:allOut+=d.nominal;});
  const md=monthData();
  let mIn=0,mOut=0;const catOut={};
  md.forEach(d=>{
    if(d.tipe==='pemasukan')mIn+=d.nominal;
    else{mOut+=d.nominal;catOut[d.kategori]=(catOut[d.kategori]||0)+d.nominal;}
  });
  const budgets=getBudgets();
  let s='Data keuangan user (mata uang Rupiah):\n';
  s+='- Total saldo akumulatif (semua waktu): '+rp(allIn-allOut)+'\n';
  s+='- Total pemasukan semua waktu: '+rp(allIn)+'\n';
  s+='- Total pengeluaran semua waktu: '+rp(allOut)+'\n';
  s+='Bulan '+BULAN[cursor.getMonth()]+' '+cursor.getFullYear()+':\n';
  s+='- Pemasukan: '+rp(mIn)+'\n';
  s+='- Pengeluaran: '+rp(mOut)+'\n';
  s+='- Selisih: '+rp(mIn-mOut)+'\n';
  s+='Pengeluaran per kategori bulan ini:\n';
  const cats=Object.keys(catOut).sort((a,b)=>catOut[b]-catOut[a]);
  if(!cats.length)s+='  (belum ada pengeluaran)\n';
  cats.forEach(k=>{
    let line='  - '+k+': '+rp(catOut[k]);
    if(budgets[k])line+=' (budget '+rp(budgets[k])+', kepake '+Math.round(catOut[k]/budgets[k]*100)+'%)';
    s+=line+'\n';
  });
  s+='Jumlah transaksi bulan ini: '+md.length+'\n';
  return s;
}

function mdLite(t){
  let h=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  h=h.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  h=h.replace(/^#{1,6}\s*(.+)$/gm,'<b>$1</b>');
  h=h.replace(/^\s*[-*]\s+/gm,'\u2022 ');
  h=h.replace(/\n/g,'<br>');
  return h;
}

async function callGemini(key,prompt){
  const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+encodeURIComponent(key),{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
  });
  const j=await res.json();
  if(j.error)throw new Error(j.error.message||'API error');
  const txt=j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts[0].text;
  if(!txt)throw new Error('Respon kosong dari AI');
  return txt;
}
async function callOpenRouter(key,prompt){
  const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
    method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
    body:JSON.stringify({model:'meta-llama/llama-3.3-70b-instruct:free',messages:[{role:'user',content:prompt}]})
  });
  const j=await res.json();
  if(j.error)throw new Error((j.error&&j.error.message)||'API error');
  const txt=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;
  if(!txt)throw new Error('Respon kosong dari AI');
  return txt;
}
async function analisaAI(){
  const provider=getProvider();
  const key=getAiKey();
  const pname=provider==='openrouter'?'OpenRouter':'Gemini';
  if(!key){toast('Set API Key '+pname+' dulu di \u2699\ufe0f');openSettings();return;}
  if(!data.length){toast('Belum ada data buat dianalisa');return;}
  const btn=document.getElementById('aiBtn');btn.disabled=true;btn.textContent='Lagi mikir\u2026 \ud83e\udd14';
  const box=document.getElementById('aiResult');
  box.innerHTML='<div class="empty">AI lagi nganalisa keuangan lo\u2026</div>';
  const prompt='Kamu adalah penasihat keuangan pribadi yang santai, tajam, dan jujur. '+
    'Panggil user dengan "lo" dan sebut diri "gue", pakai bahasa Indonesia gaul tapi tetap berisi. '+
    'Analisa data keuangan di bawah ini. Berikan:\n'+
    '1. Ringkasan kondisi keuangan (sehat/boros/aman).\n'+
    '2. 2-3 insight tajam (kategori paling boros, rasio pengeluaran vs pemasukan, dll).\n'+
    '3. 2-3 saran konkret yang bisa langsung dilakuin.\n'+
    'Jangan kepanjangan, to the point, pakai poin-poin. Jangan pakai tabel.\n\n'+buildFinanceSummary();
  try{
    const txt=provider==='openrouter'?await callOpenRouter(key,prompt):await callGemini(key,prompt);
    box.innerHTML=mdLite(txt);
  }catch(e){
    box.innerHTML='<div class="empty">Gagal: '+e.message+'</div>';
    toast('Gagal analisa: '+e.message);
  }
  btn.disabled=false;btn.textContent='\u2728 Analisa Ulang';
}

function deltaBadge(now,prev,goodWhenUp){
  if(prev<=0)return '<span class="dlt">data baru</span>';
  const p=(now-prev)/prev*100;
  const sign=p>0?'+':'';
  const good=goodWhenUp?p>0:p<0;
  const cls=p===0?'':(good?'gd':'bd');
  const arrow=p>0?'\u25b2':(p<0?'\u25bc':'\u2022');
  return '<span class="dlt '+cls+'">'+arrow+' '+sign+p.toFixed(0)+'%</span>';
}
function renderCompare(tin,tout,pin,pout){
  const box=document.getElementById('compareBox');if(!box)return;
  box.innerHTML=
    '<div class="cmp"><span class="cl">Pengeluaran</span><span class="cv">'+rp(tout)+'</span>'+deltaBadge(tout,pout,false)+'</div>'+
    '<div class="cmp"><span class="cl">Pemasukan</span><span class="cv">'+rp(tin)+'</span>'+deltaBadge(tin,pin,true)+'</div>'+
    '<div class="cmphint">Bulan lalu: '+rp(pout)+' keluar \u00b7 '+rp(pin)+' masuk</div>';
}
function renderSavings(tin,tout){
  const box=document.getElementById('savingsBox');if(!box)return;
  const net=tin-tout;
  const rate=tin>0?net/tin*100:0;
  let verdict;
  if(tin<=0)verdict='Belum ada pemasukan bulan ini.';
  else if(rate>=20)verdict='Mantap! Nabung lo sehat \ud83d\udcaa';
  else if(rate>=0)verdict='Lumayan, tapi masih bisa ditingkatin.';
  else verdict='Waduh, pengeluaran > pemasukan \u26a0\ufe0f';
  box.innerHTML=
    '<div class="srate"><div class="sr-num">'+rate.toFixed(0)+'%</div><div class="sr-lbl">Savings Rate bulan ini</div></div>'+
    '<div class="sr-verdict">'+verdict+'</div>'+
    '<div class="sr-rule"><b>Patokan 50/30/20</b> dari pemasukan '+rpShort(tin)+':</div>'+
    '<div class="sr-row"><span>\ud83c\udfe0 Kebutuhan (50%)</span><span>'+rp(tin*0.5)+'</span></div>'+
    '<div class="sr-row"><span>\ud83d\uded2 Keinginan (30%)</span><span>'+rp(tin*0.3)+'</span></div>'+
    '<div class="sr-row"><span>\ud83d\udcb0 Nabung (20%)</span><span>'+rp(tin*0.2)+'</span></div>';
}
function renderRutin(){
  const box=document.getElementById('rutinList');if(!box)return;
  const arr=getRutin();
  if(!arr.length){box.innerHTML='<div class="empty">Belum ada transaksi rutin. Isi form di atas, terus tap "Jadikan Rutin".</div>';return;}
  box.innerHTML='';
  arr.forEach((r,i)=>{
    const inc=r.tipe==='pemasukan';
    const row=document.createElement('div');row.className='rutin';
    row.innerHTML='<div class="info"><div class="k"></div><div class="m"></div></div>'+
      '<button class="mini add">+ Catat</button><button class="mini del">\u2715</button>';
    row.querySelector('.k').textContent=(inc?'\u2191 ':'\u2193 ')+r.kategori+' \u00b7 '+rp(r.nominal);
    row.querySelector('.m').textContent=r.catatan||'';
    row.querySelector('.add').onclick=()=>catatRutin(i);
    row.querySelector('.del').onclick=()=>hapusRutin(i);
    box.appendChild(row);
  });
}
function addRutinFromForm(){
  const nominal=nominalVal();
  if(!nominal){toast('Isi form transaksi di atas dulu');return;}
  const arr=getRutin();
  arr.push({tipe,kategori,nominal,catatan:document.getElementById('catatan').value.trim()});
  setRutinArr(arr);renderRutin();toast('Disimpan jadi transaksi rutin \ud83d\udd01');
}
function hapusRutin(i){const arr=getRutin();arr.splice(i,1);setRutinArr(arr);renderRutin();toast('Rutin dihapus');}
async function catatRutin(i){
  const r=getRutin()[i];if(!r)return;
  if(!getApi()){toast('Sambungin ke Sheet dulu di \u2699\ufe0f');openSettings();return;}
  const d=new Date();
  const today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  try{
    const saved=await api('POST',{action:'add',tipe:r.tipe,kategori:r.kategori,nominal:r.nominal,tanggal:today,catatan:r.catatan});
    data.unshift(saved);cursor=new Date(saved.tanggal+'T00:00:00');render();
    toast('Dicatat: '+r.kategori+' '+rp(r.nominal));
    if(saved.tipe==='pengeluaran')setTimeout(()=>checkBudgetAlert(saved.kategori),350);
  }catch(e){toast('Gagal: '+e.message);}
}
function renderGoal(){
  const box=document.getElementById('goalBox');if(!box)return;
  const g=getGoal();
  if(!g){
    box.innerHTML='<div class="empty">Belum ada target. Set di bawah \ud83d\udc47</div>';
    document.getElementById('goalDelBtn').classList.add('hidden');
    return;
  }
  document.getElementById('goalName').value=g.nama;
  document.getElementById('goalTarget').value=g.target.toLocaleString('id-ID');
  document.getElementById('goalDelBtn').classList.remove('hidden');
  let allIn=0,allOut=0;data.forEach(d=>{d.tipe==='pemasukan'?allIn+=d.nominal:allOut+=d.nominal;});
  const saldo=allIn-allOut;
  const pct=g.target>0?Math.min(saldo/g.target*100,100):0;
  const sisa=Math.max(g.target-saldo,0);
  const avg=avgSurplus();
  let eta;
  if(sisa<=0)eta='\ud83c\udf89 Target tercapai!';
  else if(avg>0)eta='Kira-kira '+Math.ceil(sisa/avg)+' bulan lagi (rata-rata nabung '+rpShort(avg)+'/bln)';
  else eta='Belum bisa ngira-ngira, rata-rata nabung lo masih minus';
  box.innerHTML='<div class="goaltop"><span class="gn"></span><span class="gp">'+pct.toFixed(0)+'%</span></div>'+
    '<div class="track"><div class="fill" style="width:'+pct+'%;background:var(--orange)"></div></div>'+
    '<div class="ginfo">'+rp(saldo)+' / '+rp(g.target)+' \u00b7 sisa '+rp(sisa)+'</div>'+
    '<div class="geta">'+eta+'</div>';
  box.querySelector('.gn').textContent=g.nama;
}
function saveGoal(){
  const nama=document.getElementById('goalName').value.trim();
  const target=Number(document.getElementById('goalTarget').value.replace(/[^0-9]/g,''))||0;
  if(!target){toast('Isi target nominalnya dulu');return;}
  setGoalData({nama:nama||'Target Nabung',target});
  renderGoal();toast('Target disimpan \ud83c\udfaf');
}
function hapusGoal(){setGoalData(null);document.getElementById('goalName').value='';document.getElementById('goalTarget').value='';renderGoal();toast('Target dihapus');}

async function api(method,body){
  const url=getApi();
  if(!url)throw new Error('URL belum diatur');
  const opt={method,redirect:'follow'};
  if(method==='POST'){opt.headers={'Content-Type':'text/plain;charset=utf-8'};opt.body=JSON.stringify(body);}
  const res=await fetch(url,opt);
  const j=await res.json();
  if(!j.ok)throw new Error(j.error||'gagal');
  return j.data;
}

async function muat(){
  if(!getApi()){document.getElementById('status').innerHTML='Mode: <b>belum tersambung</b> — buka ⚙️ buat sambungin Sheet';return;}
  try{
    document.getElementById('status').innerHTML='Mode: <b>menyambungkan…</b>';
    data=await api('GET');
    render();
    document.getElementById('status').innerHTML='Mode: <b>tersambung ke Google Sheet</b> ✅';
  }catch(e){
    document.getElementById('status').innerHTML='Mode: <b>gagal nyambung</b> — cek URL di ⚙️';
    toast('Gagal muat: '+e.message);
  }
}

async function simpan(){
  const nominal=nominalVal();
  if(!nominal){toast('Isi nominalnya dulu bro');return;}
  if(!getApi()){toast('Sambungin ke Sheet dulu di ⚙️');openSettings();return;}
  const btn=document.getElementById('saveBtn');btn.disabled=true;btn.textContent='Menyimpan…';
  const payload={action:'add',tipe,kategori,nominal,
    tanggal:document.getElementById('tanggal').value,
    catatan:document.getElementById('catatan').value.trim()};
  try{
    const saved=await api('POST',payload);
    data.unshift(saved);
    cursor=new Date(saved.tanggal+'T00:00:00');
    render();
    document.getElementById('nominal').value='';
    document.getElementById('catatan').value='';
    toast('Tersimpan ✅');
    if(saved.tipe==='pengeluaran')setTimeout(()=>checkBudgetAlert(saved.kategori),350);
  }catch(e){toast('Gagal simpan: '+e.message);}
  btn.disabled=false;btn.textContent='Simpan Transaksi';
}

async function hapus(id){
  if(!confirm('Hapus transaksi ini?'))return;
  try{await api('POST',{action:'delete',id});data=data.filter(d=>d.id!==id);render();toast('Dihapus');}
  catch(e){toast('Gagal hapus: '+e.message);}
}

function openSettings(){
  document.getElementById('apiUrl').value=getApi();
  document.getElementById('geminiKey').value=getGemini();
  document.getElementById('openrouterKey').value=getOpenRouter();
  document.getElementById('aiProvider').value=getProvider();
  syncProviderField();
  document.getElementById('settings').classList.add('show');
}
function syncProviderField(){
  const p=document.getElementById('aiProvider').value;
  document.getElementById('rowGemini').classList.toggle('hidden',p!=='gemini');
  document.getElementById('rowOpenRouter').classList.toggle('hidden',p!=='openrouter');
}
function saveSettings(){
  const v=document.getElementById('apiUrl').value.trim();
  localStorage.setItem(API_KEY,v);
  localStorage.setItem(AI_PROVIDER_KEY,document.getElementById('aiProvider').value);
  localStorage.setItem(GEMINI_KEY,document.getElementById('geminiKey').value.trim());
  localStorage.setItem(OPENROUTER_KEY,document.getElementById('openrouterKey').value.trim());
  document.getElementById('settings').classList.remove('show');
  toast('Tersambung!');muat();
}
document.getElementById('settings').addEventListener('click',e=>{if(e.target.id==='settings')e.target.classList.remove('show');});

// init
document.getElementById('tanggal').valueAsDate=new Date();
renderChips();
render();
muat();
