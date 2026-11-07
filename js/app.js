const $=(s,e=document)=>e.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>{try{return new Intl.NumberFormat(S.set.locale,{style:'currency',currency:S.set.cur,maximumFractionDigits:S.set.cur==='IDR'?0:2}).format(n||0)}catch{return String(Math.round(n||0))}};
const pc=n=>isFinite(n)?(n*100).toFixed(1)+'%':'–';
const num=v=>{const n=parseFloat(v);return isFinite(n)?n:NaN};
const cl=n=>n<0?'neg':n>0?'pos':'';
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const toast=m=>{const t=$('#toast');t.textContent=m;t.className='show';setTimeout(()=>t.className='',2800)};
const card=(l,v,c='')=>`<div class=k><small>${l}</small><b class="${c}">${v}</b></div>`;
const tbl=(h,r)=>`<div class=tw><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${r.length?r.map(x=>`<tr>${x.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan=${h.length} class=muted>Belum ada data</td></tr>`}</tbody></table></div>`;
const opts=(a,sel)=>a.map(([v,t])=>`<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(t)}</option>`).join('');
const TY={in:'Pemasukan',out:'Pengeluaran',transfer:'Transfer Internal'};
const UI={y:'',m:'',rm:''};let after=null;
const COL=['#16a34a','#0ea5e9','#f59e0b','#8b5cf6','#ef4444','#14b8a6','#64748b','#ec4899'],CH={};
function chart(id,type,labels,sets,single){const c=$('#'+id);if(!c)return;CH[id]?.destroy();
 if(typeof Chart==='undefined'){c.parentNode.innerHTML='<p class=muted>Grafik butuh Chart.js (buka aplikasi sekali dengan internet).</p>';return}
 CH[id]=new Chart(c,{type,data:{labels,datasets:sets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:sets.length>1||type==='doughnut'}},scales:type==='doughnut'?{}:{y:{ticks:{callback:v=>new Intl.NumberFormat(S.set.locale,{notation:'compact'}).format(v)}}}}})}
const cbox=(id,t)=>`<div class=card><b>${t}</b><div class=cbox><canvas id=${id}></canvas></div></div>`;
const G='#16a34a';
function legacyMarketValues(transactions,legacyPrices={}){
 const positions={};
 [...transactions].sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.id||0)-(b.id||0)).forEach(t=>{
  const x=positions[t.name]??={units:0,lastPrice:0,buy:0,sell:0,hasUnitData:false};
  if(t.type==='Buy'){const u=Number(t.units)||0;x.units+=u;x.hasUnitData=x.hasUnitData||u>0;x.lastPrice=Number(t.price)||x.lastPrice;x.buy+=Number(t.amount)||0}
  else if(t.type==='Sell'){const u=Number(t.units)||0;x.units=Math.max(0,x.units-u);x.hasUnitData=x.hasUnitData||u>0;x.lastPrice=Number(t.price)||x.lastPrice;x.sell+=Number(t.amount)||0}
 });
 const values={};Object.entries(positions).forEach(([name,x])=>{
  const price=Number(legacyPrices[name]??x.lastPrice)||0;
  values[name]=x.hasUnitData?(x.units>0&&price>0?x.units*price:0):Math.max(0,x.buy-x.sell);
 });
 return values;
}
async function loadAll(){
 for(const s of STORES)S[s]=await DB.all(s);
 const savedKinds=await DB.getKV('kindLabels');KIND={...DEFAULT_KIND,...(savedKinds||{})};
 let mv=await DB.getKV('marketValues');
 if(mv===undefined){mv=legacyMarketValues(S.inv,await DB.getKV('prices')||{});await DB.setKV('marketValues',mv)}
 S.marketValues=mv||{};
 S.set={cur:'IDR',locale:'id-ID',target:0,...(await DB.getKV('set')||{})};IC=invCalc()
}
async function autoSnap(){const t=totals(),id=today().slice(0,7),o=S.snaps.find(s=>s.id===id);
 if(!o||o.nw!==t.nw||o.inv!==t.invMV||o.A!==t.A||o.liab!==t.liab){await DB.put('snaps',{id,A:t.A,liab:t.liab,nw:t.nw,inv:t.invMV});S.snaps=await DB.all('snaps')}}
async function reload(){await loadAll();await autoSnap();render()}
const PAGES={dashboard:['Dashboard',pgDash],income:['Pemasukan',()=>pgTx('in')],expense:['Pengeluaran',()=>pgTx('out')],savings:['Tabungan',pgSav],invest:['Investasi',pgInv],assets:['Aset & Utang',pgAssets],reports:['Laporan Bulanan',pgRep],settings:['Pengaturan & Backup',pgSet]};
function render(){const k=PAGES[location.hash.slice(1)]?location.hash.slice(1):'dashboard';after=null;
 $('#menu').innerHTML=Object.entries(PAGES).map(([id,[t]])=>`<a href="#${id}" class="${id===k?'on':''}">${t}</a>`).join('');
 $('#main').innerHTML=`<h2>${PAGES[k][0]}</h2>`+PAGES[k][1]();after?.()}
// ---------- Dashboard
function pgDash(){const yrs=[...new Set([...S.tx,...S.inv].map(t=>t.date.slice(0,4)))].sort().reverse(),p=UI.y?(UI.m?UI.y+'-'+UI.m:UI.y):'',st=stats(p),T=totals(),
 ms=allMonths(),cum={};let c=0;ms.forEach(m=>{c+=stats(m).sav;cum[m]=c});const fm=ms.filter(m=>m.startsWith(UI.y)),sn=snapsSorted(),fs=sn.filter(s=>s.id.startsWith(UI.y));
 after=()=>{chart('c1','line',fs.map(s=>s.id),[{label:'Net Worth',data:fs.map(s=>s.nw),borderColor:G,backgroundColor:G+'33',fill:true,tension:.3}]);
  chart('c2','bar',fm,[{label:'Pemasukan',data:fm.map(m=>stats(m).inc),backgroundColor:G},{label:'Pengeluaran',data:fm.map(m=>stats(m).exp),backgroundColor:'#ef4444'}]);
  chart('c3','line',fm,[{label:'Tabungan',data:fm.map(m=>cum[m]),borderColor:'#0ea5e9',tension:.3}]);
  chart('c4','line',fs.map(s=>s.id),[{label:'Nilai Investasi',data:fs.map(s=>s.inv),borderColor:'#8b5cf6',tension:.3}]);
  const lab=[],dat=[];Object.entries(KIND).filter(([k])=>!isLiabilityKind(k)).forEach(([k,n])=>{const v=sum(S.assets.filter(a=>a.kind===k).map(a=>a.value));if(v>0){lab.push(n);dat.push(v)}});if(T.invMV>0){lab.push('Investasi');dat.push(T.invMV)}
  chart('c5','doughnut',lab,[{data:dat,backgroundColor:COL}]);
  const pf=sn.map((s,i)=>i?{m:s.id,v:(s.inv-sn[i-1].inv)-((IC.byM[s.id]?.buy||0)-(IC.byM[s.id]?.sell||0))+(IC.byM[s.id]?.div||0)-(IC.byM[s.id]?.fee||0)}:null).filter(x=>x&&x.m.startsWith(UI.y));
  chart('c6','bar',pf.map(x=>x.m),[{label:'Performa',data:pf.map(x=>x.v),backgroundColor:pf.map(x=>x.v>=0?G:'#ef4444')}])};
 return `<div class=bar><select id=fy><option value="">Semua tahun</option>${opts(yrs.map(y=>[y,y]),UI.y)}</select><select id=fm ${UI.y?'':'disabled'}><option value="">Semua bulan</option>${opts(Array.from({length:12},(_,i)=>{const v=String(i+1).padStart(2,'0');return[v,'Bulan '+v]}),UI.m)}</select><span class=muted>Filter berlaku untuk pemasukan, pengeluaran, tabungan, dividen & grafik. Aset/Net Worth = posisi saat ini.</span></div>
 <div class=grid>${card('Total Aset',fmt(T.A))}${card('Total Kewajiban',fmt(T.liab))}${card('Net Worth',fmt(T.nw),cl(T.nw))}${card('Pemasukan',fmt(st.inc))}${card('Pengeluaran',fmt(st.exp))}${card('Tabungan',fmt(st.sav),cl(st.sav))}${card('Savings Rate',pc(st.rate))}${card('Nilai Investasi',fmt(T.invMV))}${card('Total Gain/Loss Investasi',fmt(T.ret),cl(T.ret))}${card('Dividen & Kupon',fmt(st.div))}</div>
 <div class=g2>${cbox('c1','Perkembangan Net Worth')}${cbox('c2','Pemasukan vs Pengeluaran')}${cbox('c3','Perkembangan Tabungan (akumulasi)')}${cbox('c4','Perkembangan Nilai Investasi')}${cbox('c5','Komposisi Aset')}${cbox('c6','Performa Investasi Bulanan')}</div>`}
// ---------- Transaksi
const catOpts=(ty,sel)=>ty==='transfer'?'<option>Transfer Internal</option>':opts(S.cats.filter(c=>c.type===ty).map(c=>[c.name,c.name]),sel);
const txKey=t=>[t.date,t.type,t.cat,t.amount,t.note].join('|');
function pgTx(page){const types=page==='in'?['in']:['out','transfer'];
 after=()=>{const f=$('#f');f.type.onchange=()=>f.cat.innerHTML=catOpts(f.type.value);txList(types)};
 return `<form id=f data-p=${page} class="card form"><input type=hidden name=id><label>Tanggal<input type=date name=date required value="${today()}"></label><label>Jenis<select name=type>${opts(types.map(t=>[t,TY[t]]))}</select></label><label>Kategori<select name=cat>${catOpts(types[0])}</select></label><label>Nominal<input type=number name=amount min=0 step=any required></label><label class=wide>Catatan<input name=note maxlength=120></label><div class=wide><button type=button class=btn data-save-tx>Simpan</button> <button type=button class=btn2 id=cancel hidden data-a=txcancel>Batal edit</button> ${page==='out'?'<span class=muted>Transfer internal & pembelian investasi tidak dihitung sebagai pengeluaran.</span>':''}</div></form>
 <div class=bar><input id=q placeholder="Cari kategori/catatan"><input type=date id=d1 title="Dari"><input type=date id=d2 title="Sampai"></div><div id=list data-types="${types}"></div>`}
function txList(types){const q=$('#q').value.toLowerCase(),a=$('#d1').value,b=$('#d2').value,
 r=S.tx.filter(t=>types.includes(t.type)&&(!a||t.date>=a)&&(!b||t.date<=b)&&(!q||(t.cat+' '+t.note).toLowerCase().includes(q))).sort((x,y)=>y.date.localeCompare(x.date)||y.id-x.id);
 $('#list').innerHTML=`<p class=muted>${r.length} transaksi · Total ${fmt(sum(r.map(t=>t.amount)))}${r.length>300?' (menampilkan 300 terbaru)':''}</p>`+tbl(['Tanggal','Jenis','Kategori','Nominal','Catatan',''],r.slice(0,300).map(t=>[t.date,TY[t.type],esc(t.cat),fmt(t.amount),esc(t.note),`<button class=ic data-a=txedit data-id=${t.id}>✎</button> <button class="ic dg" data-a=txdel data-id=${t.id}>×</button>`]))}
// ---------- Tabungan
function pgSav(){const ms=allMonths(),tg=+S.set.target||0;let c=0;const rows=ms.map(m=>{const s=stats(m);c+=s.sav;return{m,...s,cum:c}}),tot=stats(''),cur=stats(today().slice(0,7));
 after=()=>chart('s1','bar',ms,[{label:'Tabungan bulanan',data:rows.map(r=>r.sav),backgroundColor:G},{type:'line',label:'Akumulasi',data:rows.map(r=>r.cum),borderColor:'#0ea5e9',tension:.3}]);
 return `<div class=grid>${card('Akumulasi Tabungan',fmt(tot.sav),cl(tot.sav))}${card('Savings Rate (total)',pc(tot.rate))}${card('Target Bulanan',fmt(tg))}${card('Tabungan Bulan Ini',fmt(cur.sav),cl(cur.sav))}${card('Capaian Target Bulan Ini',tg?pc(cur.sav/tg):'–')}</div>
 <form id=ft class="card bar"><label>Target tabungan per bulan <input type=number name=t min=0 step=any value="${tg}"></label><button class=btn>Simpan target</button><span class=muted>Tabungan = Pemasukan − Pengeluaran.</span></form>${cbox('s1','Perkembangan Tabungan')}
 ${tbl(['Bulan','Pemasukan','Pengeluaran','Tabungan','Savings Rate','Capaian Target','Akumulasi'],rows.reverse().map(r=>[r.m,fmt(r.inc),fmt(r.exp),`<span class=${cl(r.sav)}>${fmt(r.sav)}</span>`,pc(r.rate),tg?pc(r.sav/tg):'–',fmt(r.cum)]))}`}
// ---------- Investasi
const CLS=['Saham','Obligasi','Reksa Dana','ETF','Deposito','Emas','Cash','Lainnya'],ITY=['Buy','Sell','Dividend','Coupon','Fee'];
function pgInv(){const T=totals(),it=IC.items;
 after=()=>{const f=$('#fi');const tg=()=>{$('#cashwrap').hidden=false;f.cashAccountId.required=true;$('#cashlabel').textContent='Akun cash sumber/tujuan';$('#cashhint').textContent=['Buy','Fee'].includes(f.type.value)?'Saldo akun cash akan berkurang.':'Saldo akun cash akan bertambah.'};f.type.onchange=tg;tg();
  const a=it.filter(i=>i.mv>0);chart('i1','doughnut',a.map(i=>i.cls),[{data:a.map(i=>i.mv),backgroundColor:COL}])};
 return `<div class=grid>${card('Total Pembelian',fmt(T.buys))}${card('Total Penjualan',fmt(T.proceeds))}${card('Modal Bersih',fmt(T.buys-T.proceeds))}${card('Market Value',fmt(T.invMV))}${card('Dividen & Kupon',fmt(T.div))}${card('Biaya Investasi',fmt(T.fees))}${card('Total Gain/Loss',fmt(T.ret),cl(T.ret))}${card('Total Return',pc(T.buys?T.ret/T.buys:NaN),cl(T.ret))}</div>
 <form id=fi class="card form"><label>Nama instrumen<input name=name list=nl required maxlength=60></label><datalist id=nl>${it.map(i=>`<option value="${esc(i.name)}">`).join('')}</datalist><label>Kelas aset<select name=cls>${opts(CLS.map(c=>[c,c]))}</select></label><label>Tanggal<input type=date name=date required value="${today()}"></label><label>Jenis transaksi<select name=type>${opts(ITY.map(c=>[c,c]))}</select></label><label id=cashwrap><span id=cashlabel>Akun cash sumber/tujuan</span><select name=cashAccountId><option value="">Pilih akun cash</option>${opts(S.assets.filter(a=>!isLiabilityKind(a.kind)).map(a=>[String(a.id),a.name+' ('+fmt(a.value)+')']))}</select><span class=muted id=cashhint></span></label><label>Nominal<input type=number name=amount min=0 step=any required></label><div class=wide><button class=btn type=submit>Simpan transaksi</button> <span class=muted>Semua transaksi dicatat dalam nominal Rupiah/mata uang pilihan. Pembelian bukan keuntungan.</span></div></form>
 <h3>Posisi & Nilai Pasar</h3><p class=muted>Isi nilai pasar total per instrumen secara manual (bukan harga per unit). Total Gain/Loss = nilai pasar + hasil penjualan + dividen/kupon − pembelian − biaya. Return yang ditampilkan adalah return sederhana, bukan XIRR.</p>${tbl(['Instrumen','Kelas','Total Pembelian','Total Penjualan','Modal Bersih','Nilai Pasar (manual)','Gain/Loss','Dividen','Return'],it.map(i=>[esc(i.name),i.cls,fmt(i.buys),fmt(i.proceeds),fmt(i.netContrib),`<input class=mv type=number min=0 step=any data-n="${esc(i.name)}" value="${i.mv}">`,`<span class=${cl(i.ret)}>${fmt(i.ret)}</span>`,fmt(i.div),`<span class=${cl(i.ret)}>${pc(i.retPct)}</span>`]))}
 <div class=g2 style=margin-top:12px>${cbox('i1','Alokasi Aset Investasi')}</div><h3>Riwayat Transaksi</h3>${tbl(['Tanggal','Instrumen','Jenis','Nominal','Akun Cash',''],[...S.inv].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,300).map(t=>[t.date,esc(t.name),t.type,fmt(t.amount),esc(S.assets.find(a=>a.id===t.cashAccountId)?.name||'–'),`<button class="ic dg" data-a=invdel data-id=${t.id}>×</button>`]))}`}
// ---------- Aset & Utang
function pgAssets(){const T=totals(),sn=snapsSorted();
 return `<div class=grid>${card('Aset (manual)',fmt(T.man))}${card('Investasi (otomatis)',fmt(T.invMV))}${card('Total Aset',fmt(T.A))}${card('Total Utang',fmt(T.liab))}${card('Net Worth',fmt(T.nw),cl(T.nw))}</div>
 <form id=fa class="card form"><label>Nama<input name=name required maxlength=60></label><label>Jenis<select name=kind>${opts(Object.entries(KIND))}</select></label><label>Nilai saat ini<input type=number name=value min=0 step=any required></label><div class=wide><button class=btn>Tambah</button> <span class=muted>Nilai investasi diambil otomatis dari menu Investasi; jangan dicatat ulang di sini agar tidak dihitung dua kali.</span></div></form>
 <h3>Transfer Antar Aset</h3>
 <form id=fm class="card form"><label>Tanggal<input type=date name=date required value="${today()}"></label><label>Dari aset<select name=from required>${opts(S.assets.filter(a=>!isLiabilityKind(a.kind)).map(a=>[String(a.id),a.name+' ('+fmt(a.value)+')']))}</select></label><label>Ke aset<select name=to required>${opts(S.assets.filter(a=>!isLiabilityKind(a.kind)).map(a=>[String(a.id),a.name+' ('+fmt(a.value)+')']))}</select></label><label>Nominal<input type=number name=amount min=1 step=any required></label><label class=wide>Catatan<input name=note maxlength=120></label><div class=wide><button class=btn>Transfer</button><span class=muted>Memindahkan saldo antar aset tanpa mengubah total kekayaan bersih.</span></div></form>
 ${tbl(['Nama','Jenis','Nilai',''],S.assets.map(a=>[esc(a.name),KIND[a.kind],`<input class=av type=number min=0 step=any data-id=${a.id} value="${a.value}">`,`<button class="ic dg" data-a=asdel data-id=${a.id}>×</button>`]))}
 <h3>Riwayat Transfer Aset</h3>${tbl(['Tanggal','Dari','Ke','Nominal','Catatan',''],[...S.moves].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).map(m=>[m.date,esc(m.fromName),esc(m.toName),fmt(m.amount),esc(m.note||''),`<button class="ic dg" data-a=movdel data-id=${m.id}>×</button>`]))}
 <h3>Snapshot Net Worth Bulanan</h3><form id=fs class="card bar"><input type=month name=m value="${today().slice(0,7)}" required><button class=btn>Simpan nilai saat ini ke bulan ini</button><span class=muted>Snapshot bulan berjalan diperbarui otomatis.</span></form>
 ${tbl(['Bulan','Aset','Utang','Net Worth','Perubahan',''],[...sn].reverse().map((s,i,a)=>{const p=a[i+1];return[s.id,fmt(s.A),fmt(s.liab),fmt(s.nw),p?`<span class=${cl(s.nw-p.nw)}>${fmt(s.nw-p.nw)}</span>`:'–',`<button class="ic dg" data-a=sndel data-id="${s.id}">×</button>`]}))}`}
// ---------- Laporan
function mt(m){const s=stats(m),a=S.snaps.find(x=>x.id===m),b=S.snaps.find(x=>x.id===shift(m,-1));return{...s,nwc:a&&b?a.nw-b.nw:NaN,ivc:a&&b?a.inv-b.inv:NaN}}
function pgRep(){const ms=allMonths(),m=UI.rm||ms[ms.length-1]||today().slice(0,7),c=mt(m),p=mt(shift(m,-1)),y=mt(shift(m,-12)),ev=[],tg=+S.set.target||0;
 const R=[['Pemasukan','inc'],['Pengeluaran','exp'],['Tabungan','sav'],['Savings Rate','rate','p'],['Total investasi (pembelian)','buy'],['Perubahan nilai investasi','ivc'],['Biaya investasi','fee'],['Dividen & kupon','div'],['Perubahan Net Worth','nwc']];
 const v=(o,k,t)=>t?pc(o[k]):isFinite(o[k])?fmt(o[k]):'–';
 if(c.inc||c.exp){ev.push(`Bulan ini Anda menabung ${fmt(c.sav)} (savings rate ${pc(c.rate)}).`);
  if(isFinite(c.rate))ev.push(c.rate>=.2?'Savings rate sudah di atas 20%, tergolong sehat.':'Savings rate di bawah 20%; pertimbangkan menekan pengeluaran.');
  if(p.exp>0){const d=(c.exp-p.exp)/p.exp;ev.push(`Pengeluaran ${d>=0?'naik':'turun'} ${pc(Math.abs(d))} dibanding bulan lalu.`)}
  if(c.sav<0)ev.push('Pengeluaran melebihi pemasukan bulan ini.');
  const cats={};S.tx.filter(t=>t.type==='out'&&t.date.startsWith(m)).forEach(t=>cats[t.cat]=(cats[t.cat]||0)+t.amount);const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];if(top)ev.push(`Pengeluaran terbesar: ${top[0]} (${fmt(top[1])}).`);
  if(tg)ev.push(`Pencapaian target tabungan: ${pc(c.sav/tg)}.`);
  if(isFinite(c.nwc))ev.push(`Net worth ${c.nwc>=0?'naik':'turun'} ${fmt(Math.abs(c.nwc))} dari bulan lalu.`);
  if(c.div)ev.push(`Dividen/kupon diterima ${fmt(c.div)}.`)}else ev.push('Belum ada transaksi pada bulan ini.');
 return `<div class=bar><input type=month id=rm value="${m}"></div>${tbl(['Metrik',m,shift(m,-1)+' (bulan lalu)',shift(m,-12)+' (tahun lalu)'],R.map(r=>[r[0],v(c,r[1],r[2]),v(p,r[1],r[2]),v(y,r[1],r[2])]))}<h3>Ringkasan Evaluasi</h3><div class=card>${ev.map(e=>`<p style=margin:4px 0>• ${esc(e)}</p>`).join('')}</div><p class=muted>Perubahan nilai investasi & Net Worth memakai snapshot bulanan; kolom "–" berarti snapshot belum tersedia.</p>`}
// ---------- Pengaturan
function pgSet(){const cur=S.set.cur+'|'+S.set.locale,C=[['IDR|id-ID','IDR – Rupiah'],['USD|en-US','USD – Dollar AS'],['EUR|de-DE','EUR – Euro'],['SGD|en-SG','SGD – Dollar Singapura'],['MYR|ms-MY','MYR – Ringgit']];
 return `<div class=card><b>⚠ Penyimpanan lokal.</b> Data hanya tersimpan di browser & perangkat ini (IndexedDB). Jika data browser dihapus atau berganti perangkat, data hilang. Lakukan <b>backup JSON</b> secara berkala.</div>
 <h3>Mata uang</h3><select id=cur>${opts(C,cur)}</select>
 <h3>Kategori Pemasukan & Pengeluaran</h3><form id=fc class="card bar"><select name=type><option value=in>Pemasukan</option><option value=out>Pengeluaran</option></select><input name=name required maxlength=40 placeholder="Nama kategori"><button class=btn>Tambah kategori transaksi</button></form>
 ${['in','out'].map(t=>`<p><b>${TY[t]}:</b> ${S.cats.filter(c=>c.type===t).map(c=>`<span class=chip>${esc(c.name)} <button class=ic data-a=catedit data-id=${c.id}>✎</button><button class=ic data-a=catdel data-id=${c.id}>×</button></span>`).join('')}</p>`).join('')}
 <h3>Kategori Aset & Kewajiban</h3><p class=muted>Buat kategori sesuai kebutuhan, misalnya Rekening Bank Digital, E-wallet, Properti, Kendaraan, Piutang, atau Kartu Kredit. Kategori kewajiban akan mengurangi Net Worth.</p>
 <form id=fk class="card bar"><select name=group><option value=asset>Aset</option><option value=liability>Kewajiban</option></select><input name=name required maxlength=40 placeholder="Nama kategori aset/kewajiban"><button class=btn>Tambah kategori</button></form>
 <p>${Object.entries(KIND).map(([k,n])=>`<span class=chip>${esc(n)} <button class=ic data-a=kindedit data-id="${esc(k)}" title="Ubah nama">✎</button>${k.startsWith('custom_')?`<button class="ic dg" data-a=kinddel data-id="${esc(k)}" title="Hapus kategori">×</button>`:''}</span>`).join('')}</p>
 <h3>Data</h3><div class="card bar"><button class=btn data-a=bk>Backup JSON</button><label class=btn2 style="padding:7px 9px;border:1px solid var(--b);border-radius:8px;cursor:pointer">Restore JSON<input type=file id=rs accept=".json" hidden></label><button class=btn2 data-a=excsv>Export CSV</button><label style="padding:7px 9px;border:1px solid var(--b);border-radius:8px;cursor:pointer">Import CSV<input type=file id=ic accept=".csv" hidden></label></div>
 <p class=muted>Format CSV: <code>tanggal,jenis,kategori,nominal,catatan</code> — tanggal YYYY-MM-DD; jenis: pemasukan / pengeluaran / transfer. Baris duplikat dilewati.</p>
 <div class="card bar"><button class=btn2 data-a=demo>Muat data demo</button><button class="btn2" data-a=undemo>Hapus data demo</button><button class="btn2 dg" data-a=wipe>Hapus semua data</button></div>`}
// ---------- Aksi & event
const dl=(n,t,ty)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:ty}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
const FORMS={
 async f(f){const d=Object.fromEntries(new FormData(f)),amt=num(d.amount),id=d.id?+d.id:undefined;
  if(!d.date||!(amt>0)||!d.cat)return toast('Isi tanggal, kategori, dan nominal > 0');
  const o={date:d.date,type:d.type,cat:d.cat,amount:amt,note:d.note.trim()};if(id)o.id=id;
  if(S.tx.some(t=>t.id!==id&&txKey(t)===txKey(o))&&!confirm('Transaksi serupa sudah ada. Tetap simpan?'))return;
  await DB.put('tx',o);toast('Tersimpan');await reload()},
 async ft(f){const t=num(f.t.value);if(!(t>=0))return toast('Target tidak valid');S.set.target=t;await DB.setKV('set',S.set);render()},
 async fi(f){const d=Object.fromEntries(new FormData(f)),name=d.name.trim(),amount=num(d.amount);if(!name)return toast('Nama wajib diisi');if(!d.date||!(amount>0))return toast('Isi tanggal dan nominal > 0');
  const o={name,cls:d.cls,date:d.date,type:d.type,units:0,price:0,amount};
  const cashId=d.cashAccountId?+d.cashAccountId:null,cash=S.assets.find(a=>a.id===cashId&&!isLiabilityKind(a.kind));
  if(!cash)return toast('Pilih akun cash sumber/tujuan');o.cashAccountId=cash.id;
  if(cash&&(d.type==='Buy'||d.type==='Fee')&&cash.value<amount)return toast('Saldo akun cash tidak cukup');
  if(S.inv.some(t=>['name','date','type','amount','cashAccountId'].every(k=>(t[k]??null)===(o[k]??null))&&!confirm('Transaksi serupa sudah ada. Tetap simpan?')))return;
  if(cash){const delta=(d.type==='Buy'||d.type==='Fee')?-amount:amount;await DB.put('assets',{...cash,value:cash.value+delta})}
  if(d.type==='Buy'||d.type==='Sell'){
   const base=Number(S.marketValues[name]??Math.max(0,sum(S.inv.filter(t=>t.name===name&&t.type==='Buy').map(t=>t.amount))-sum(S.inv.filter(t=>t.name===name&&t.type==='Sell').map(t=>t.amount))));
   S.marketValues[name]=Math.max(0,base+(d.type==='Buy'?amount:-amount));await DB.setKV('marketValues',S.marketValues);
  }
  await DB.put('inv',o);toast('Transaksi investasi tersimpan');await reload()},
 async fa(f){const d=Object.fromEntries(new FormData(f)),v=num(d.value);if(!d.name.trim()||!(v>=0))return toast('Nama dan nilai wajib valid');await DB.put('assets',{name:d.name.trim(),kind:d.kind,value:v});await reload()},
 async fm(f){const d=Object.fromEntries(new FormData(f)),from=S.assets.find(a=>a.id===+d.from),to=S.assets.find(a=>a.id===+d.to),amount=num(d.amount);if(!d.date||!from||!to||from.id===to.id||!(amount>0))return toast('Periksa tanggal, akun asal/tujuan, dan nominal');if(from.value<amount)return toast('Saldo aset asal tidak cukup');await DB.put('assets',{...from,value:from.value-amount});await DB.put('assets',{...to,value:to.value+amount});await DB.put('moves',{date:d.date,fromId:from.id,toId:to.id,fromName:from.name,toName:to.name,amount,note:(d.note||'').trim()});toast('Transfer berhasil');await reload()},
 async fs(f){const id=f.m.value;if(!id)return;if(S.snaps.some(s=>s.id===id)&&!confirm('Snapshot bulan itu akan ditimpa dengan nilai saat ini. Lanjutkan?'))return;const t=totals();await DB.put('snaps',{id,A:t.A,liab:t.liab,nw:t.nw,inv:t.invMV});await reload()},
 async fc(f){const n=f.name.value.trim();if(!n)return;if(S.cats.some(c=>c.type===f.type.value&&c.name.toLowerCase()===n.toLowerCase()))return toast('Kategori sudah ada');await DB.put('cats',{type:f.type.value,name:n});await reload()},
 async fk(f){const n=f.name.value.trim(),group=f.group.value;if(!n)return;if(Object.values(KIND).some(x=>x.toLowerCase()===n.toLowerCase()))return toast('Kategori aset/kewajiban sudah ada');const key=(group==='liability'?'custom_liab_':'custom_asset_')+Date.now();KIND[key]=n;await DB.setKV('kindLabels',KIND);toast('Kategori aset ditambahkan');await reload()}};
const ACT={
 txedit(b){const t=S.tx.find(x=>x.id==b.dataset.id),f=$('#f');if(!t)return;f.id.value=t.id;f.date.value=t.date;f.type.value=t.type;f.cat.innerHTML=catOpts(t.type,t.cat);if(!S.cats.some(c=>c.name===t.cat)&&t.type!=='transfer')f.cat.insertAdjacentHTML('beforeend',`<option selected>${esc(t.cat)}</option>`);f.cat.value=t.cat;f.amount.value=t.amount;f.note.value=t.note;$('#cancel').hidden=false;f.scrollIntoView()},
 txcancel(){render()},
 async txdel(b){if(confirm('Hapus transaksi ini?')){await DB.del('tx',+b.dataset.id);await reload()}},
 async invdel(b){const t=S.inv.find(x=>x.id==b.dataset.id);if(!t||!confirm('Hapus transaksi investasi ini? Perubahan saldo cash dan nilai pasar otomatis dikoreksi. Lanjutkan?'))return;
  const cashDelta=t.type==='Buy'||t.type==='Fee'?-t.amount:t.amount;
  if(t.cashAccountId){const a=S.assets.find(x=>x.id===t.cashAccountId);if(a)await DB.put('assets',{...a,value:a.value-cashDelta})}
  if(t.type==='Buy'||t.type==='Sell'){const current=Number(S.marketValues[t.name]??0);S.marketValues[t.name]=Math.max(0,current-(t.type==='Buy'?t.amount:-t.amount));await DB.setKV('marketValues',S.marketValues)}
  await DB.del('inv',+b.dataset.id);await reload()},
 async movdel(b){const m=S.moves.find(x=>x.id==b.dataset.id);if(!m||!confirm('Batalkan transfer dan kembalikan saldo kedua aset?'))return;const from=S.assets.find(x=>x.id===m.fromId),to=S.assets.find(x=>x.id===m.toId);if(!from||!to)return toast('Akun asal/tujuan tidak ditemukan');await DB.put('assets',{...from,value:from.value+m.amount});await DB.put('assets',{...to,value:to.value-m.amount});await DB.del('moves',m.id);await reload()},
 async asdel(b){const id=+b.dataset.id;if(S.inv.some(t=>t.cashAccountId===id)||S.moves.some(m=>m.fromId===id||m.toId===id))return toast('Akun ini masih dipakai transaksi investasi/transfer. Hapus atau selesaikan riwayat terkait terlebih dahulu.');if(confirm('Hapus item ini?')){await DB.del('assets',id);await reload()}},
 async sndel(b){if(confirm('Hapus snapshot ini?')){await DB.del('snaps',b.dataset.id);await reload()}},
 async catedit(b){const c=S.cats.find(x=>x.id==b.dataset.id),n=(prompt('Nama kategori baru:',c.name)||'').trim();if(!n||n===c.name)return;
  for(const t of S.tx.filter(t=>t.type===c.type&&t.cat===c.name))await DB.put('tx',{...t,cat:n});await DB.put('cats',{...c,name:n});await reload()},
 async catdel(b){if(confirm('Hapus kategori? Transaksi lama tetap menyimpan nama kategorinya.')){await DB.del('cats',+b.dataset.id);await reload()}},
 async kindedit(b){const key=b.dataset.id,old=KIND[key],n=(prompt('Nama kategori baru:',old)||'').trim();if(!n||n===old)return;if(Object.entries(KIND).some(([k,v])=>k!==key&&v.toLowerCase()===n.toLowerCase()))return toast('Nama kategori sudah digunakan');KIND[key]=n;await DB.setKV('kindLabels',KIND);await reload()},
 async kinddel(b){const key=b.dataset.id;if(!key.startsWith('custom_'))return toast('Kategori bawaan tidak bisa dihapus');if(S.assets.some(a=>a.kind===key))return toast('Kategori masih dipakai aset. Pindahkan aset ke kategori lain terlebih dahulu.');if(!confirm('Hapus kategori ini?'))return;delete KIND[key];await DB.setKV('kindLabels',KIND);await reload()},
 bk(){dl(`backup-keuangan-${today()}.json`,JSON.stringify({v:2,exported:new Date().toISOString(),tx:S.tx,inv:S.inv,assets:S.assets,moves:S.moves,cats:S.cats,snaps:S.snaps,marketValues:S.marketValues,kindLabels:KIND,set:S.set}),'application/json')},
 excsv(){const q=s=>'"'+String(s).replace(/"/g,'""')+'"';dl(`transaksi-${today()}.csv`,'tanggal,jenis,kategori,nominal,catatan\n'+[...S.tx].sort((a,b)=>a.date.localeCompare(b.date)).map(t=>[t.date,{in:'pemasukan',out:'pengeluaran',transfer:'transfer'}[t.type],q(t.cat),t.amount,q(t.note)].join(',')).join('\n'),'text/csv')},
 async demo(){if(!confirm('Tambahkan data demonstrasi? (dapat dihapus lewat "Hapus data demo")'))return;const cm=today().slice(0,7),P=(s,o)=>DB.put(s,{...o,demo:true});
  for(let i=5;i>=0;i--){const m=shift(cm,-i);await P('tx',{date:m+'-25',type:'in',cat:'Gaji',amount:8000000,note:'Gaji (demo)'});
   for(const[c,a]of[['Makanan',1800000+i*40000],['Transportasi',600000],['Tagihan',900000],['Hiburan',350000+i*30000]])await P('tx',{date:m+'-10',type:'out',cat:c,amount:a,note:'Demo'});
   await P('tx',{date:m+'-26',type:'transfer',cat:'Transfer Internal',amount:1000000,note:'Ke rekening investasi (demo)'});
   await P('inv',{name:'Reksa Dana Contoh',cls:'Reksa Dana',date:m+'-26',type:'Buy',units:500,price:1000+(5-i)*20,amount:500*(1000+(5-i)*20)});
   if(i>0)await P('snaps',{id:m,A:30e6+(5-i)*2.2e6,liab:5e6,nw:25e6+(5-i)*2.2e6,inv:(6-i)*520000})}
  await P('inv',{name:'Reksa Dana Contoh',cls:'Reksa Dana',date:shift(cm,-2)+'-28',type:'Dividend',units:0,price:0,amount:45000});
  await P('inv',{name:'Emas Contoh (gram)',cls:'Emas',date:shift(cm,-4)+'-05',type:'Buy',units:2,price:1000000,amount:2000000});
  S.marketValues['Reksa Dana Contoh']=1130;S.marketValues['Emas Contoh (gram)']=1050000;await DB.setKV('marketValues',S.marketValues);
  for(const[n,k,v]of[['Rekening Bank (demo)','bank',12e6],['Dana Darurat (demo)','darurat',15e6],['Cicilan (demo)','utang',5e6]])await P('assets',{name:n,kind:k,value:v});
  toast('Data demo ditambahkan');await reload()},
 async undemo(){if(!confirm('Hapus semua data demo?'))return;for(const s of ['tx','inv','assets','snaps'])for(const o of S[s].filter(x=>x.demo))await DB.del(s,o.id);
  await loadAll();const names=new Set(S.inv.map(i=>i.name));for(const k of Object.keys(S.marketValues))if(!names.has(k))delete S.marketValues[k];await DB.setKV('marketValues',S.marketValues);toast('Data demo dihapus');await reload()},
 async wipe(){if(prompt('Semua data akan dihapus permanen. Ketik HAPUS untuk lanjut:')!=='HAPUS')return;for(const s of STORES)await DB.clear(s);await DB.setKV('marketValues',{});await DB.setKV('kindLabels',DEFAULT_KIND);KIND={...DEFAULT_KIND};await seed();toast('Semua data dihapus');await reload()}};
async function importCSV(file){const t=await file.text(),rows=[];let r=[],c='',q=false;
 for(let i=0;i<t.length;i++){const h=t[i];if(q){if(h=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=h}else if(h=='"')q=true;else if(h==','||h==';'){r.push(c);c=''}else if(h=='\n'){r.push(c);rows.push(r);r=[];c=''}else if(h!='\r')c+=h}
 if(c||r.length){r.push(c);rows.push(r)}
 const map={pemasukan:'in',income:'in',in:'in',pengeluaran:'out',expense:'out',out:'out',transfer:'transfer'},keys=new Set(S.tx.map(txKey));let ok=0,dup=0,bad=0;
 for(const[i,x]of rows.entries()){if(x.join('')==='')continue;if(i===0&&/tanggal|date/i.test(x[0]))continue;const[d,j,k,a,n='']=x.map(v=>v.trim()),ty=map[(j||'').toLowerCase()],amt=num(a);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!ty||!(amt>0)){bad++;continue}const o={date:d,type:ty,cat:k||'Lainnya',amount:amt,note:n};if(keys.has(txKey(o))){dup++;continue}keys.add(txKey(o));await DB.put('tx',o);ok++}
 toast(`Import selesai: ${ok} baru, ${dup} duplikat dilewati, ${bad} tidak valid`);await reload()}
async function restore(file){try{const d=JSON.parse(await file.text());if(!d||!Array.isArray(d.tx)||!Array.isArray(d.inv))throw 0;if(!confirm('Data saat ini akan ditimpa. Lanjutkan?'))return;
 for(const s of STORES){await DB.clear(s);for(const o of d[s]||[])await DB.put(s,o)}const restoredInv=d.inv||[];const restoredMV=d.marketValues||legacyMarketValues(restoredInv,d.prices||{});await DB.setKV('marketValues',restoredMV);await DB.setKV('kindLabels',d.kindLabels||DEFAULT_KIND);await DB.setKV('set',d.set||{});await DB.setKV('seeded',1);toast('Data dipulihkan');await reload()}catch{toast('File backup tidak valid')}}
document.addEventListener('submit',async e=>{
 if(!(e.target instanceof HTMLFormElement))return;
 e.preventDefault();
 const handler=FORMS[e.target.id];
 if(!handler){console.error('Form handler tidak ditemukan:',e.target.id);toast('Form tidak dikenali. Muat ulang aplikasi.');return}
 try{await handler(e.target)}catch(err){console.error('Gagal memproses form:',err);toast('Gagal menyimpan: '+(err?.message||'periksa Console'));}
});
document.addEventListener('click',async e=>{
 const save=e.target.closest('[data-save-tx]');
 if(save){
  const form=save.closest('form');
  if(!form)return;
  save.disabled=true; const oldText=save.textContent; save.textContent='Menyimpan...';
  try{await FORMS.f(form)}catch(err){console.error('Gagal menyimpan transaksi:',err);toast('Gagal menyimpan: '+(err?.message||'periksa Console'));}
  finally{if(save.isConnected){save.disabled=false;save.textContent=oldText}}
  return;
 }
 const b=e.target.closest('[data-a]');if(b)ACT[b.dataset.a]?.(b)
});
document.addEventListener('input',e=>{if(['q','d1','d2'].includes(e.target.id))txList($('#list').dataset.types.split(','))});
document.addEventListener('change',async e=>{const t=e.target;
 if(t.id==='fy'){UI.y=t.value;UI.m='';render()}else if(t.id==='fm'){UI.m=t.value;render()}else if(t.id==='rm'){UI.rm=t.value;render()}
 else if(t.id==='cur'){const[c,l]=t.value.split('|');S.set.cur=c;S.set.locale=l;await DB.setKV('set',S.set);toast('Mata uang diubah')}
 else if(t.classList.contains('mv')){const v=num(t.value);if(!(v>=0))return toast('Nilai pasar tidak valid');S.marketValues[t.dataset.n]=v;await DB.setKV('marketValues',S.marketValues);await reload()}
 else if(t.classList.contains('av')){const v=num(t.value),a=S.assets.find(x=>x.id==t.dataset.id);if(!(v>=0))return toast('Nilai tidak valid');await DB.put('assets',{...a,value:v});await reload()}
 else if(t.id==='ic'&&t.files[0])importCSV(t.files[0]);else if(t.id==='rs'&&t.files[0])restore(t.files[0])});
async function seed(){if(await DB.getKV('seeded'))return;for(const[ty,l]of[['in',['Gaji','Bonus','Usaha','Lainnya']],['out',['Makanan','Transportasi','Tagihan','Belanja','Hiburan','Kesehatan','Pendidikan','Lainnya']]])for(const n of l)await DB.put('cats',{type:ty,name:n});await DB.setKV('seeded',1)}
window.addEventListener('hashchange',render);
(async()=>{try{await DB.open();await seed();await reload()}catch(e){$('#main').innerHTML='<div class=card>Gagal membuka penyimpanan browser (IndexedDB). Pastikan bukan mode privat.</div>'}
 if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{})})();
