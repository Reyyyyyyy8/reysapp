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
const DEFAULT_API='https://script.google.com/macros/s/AKfycbxXhptJeFPphxRWApoDlloPQDPIvBamPhbx6PvadFjGTzuw_I28ko1WiduA3Jp3G9AL/exec'; // <- URL lo

function rp(n){return 'Rp '+(Number(n)||0).toLocaleString('id-ID');}
function rpShort(n){n=Number(n)||0;if(n>=1e9)return 'Rp '+(n/1e9).toFixed(1)+'M';if(n>=1e6)return 'Rp '+(n/1e6).toFixed(1)+'jt';if(n>=1e3)return 'Rp '+(n/1e3).toFixed(0)+'rb';return 'Rp '+n;}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);}
function getApi(){return localStorage.getItem(API_KEY)||DEFAULT_API;}
function ymOf(s){return (s||'').slice(0,7);}
function curYM(){return cursor.getFullYear()+'-'+String(cursor.getMonth()+1).padStart(2,'0');}
function monthData(){const ym=curYM();return data.filter(d=>ymOf(d.tanggal)===ym);}

function setTab(t){
  curTab=t;
  document.getElementById('tabCatat').classList.toggle('active',t==='catat');
  document.getElementById('tabDash').classList.toggle('active',t==='dash');
  document.getElementById('viewCatat').classList.toggle('hidden',t!=='catat');
  document.getElementById('viewDash').classList.toggle('hidden',t!=='dash');
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
  document.getElementById('totalIn').textContent=rp(tin);
  document.getElementById('totalOut').textContent=rp(tout);
  document.getElementById('saldo').textContent=rp(tin-tout);
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
}

function renderDash(md,tin,tout){
  document.getElementById('dIn').textContent=rp(tin);
  document.getElementById('dOut').textContent=rp(tout);
  const net=document.getElementById('dNet');net.textContent=rp(tin-tout);
  net.className='v '+((tin-tout)>=0?'in':'out');
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
  }catch(e){toast('Gagal simpan: '+e.message);}
  btn.disabled=false;btn.textContent='Simpan Transaksi';
}

async function hapus(id){
  if(!confirm('Hapus transaksi ini?'))return;
  try{await api('POST',{action:'delete',id});data=data.filter(d=>d.id!==id);render();toast('Dihapus');}
  catch(e){toast('Gagal hapus: '+e.message);}
}

function openSettings(){document.getElementById('apiUrl').value=getApi();document.getElementById('settings').classList.add('show');}
function saveSettings(){
  const v=document.getElementById('apiUrl').value.trim();
  localStorage.setItem(API_KEY,v);
  document.getElementById('settings').classList.remove('show');
  toast('Tersambung!');muat();
}
document.getElementById('settings').addEventListener('click',e=>{if(e.target.id==='settings')e.target.classList.remove('show');});

// init
document.getElementById('tanggal').valueAsDate=new Date();
renderChips();
render();
muat();
