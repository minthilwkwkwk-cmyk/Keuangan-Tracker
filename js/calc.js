const S={tx:[],inv:[],assets:[],cats:[],snaps:[],moves:[],marketValues:{},set:{cur:'IDR',locale:'id-ID',target:0}};
let IC={items:[],byM:{}};
const sum=a=>a.reduce((s,x)=>s+x,0);
const DEFAULT_KIND={cash:'Cash',bank:'Rekening Bank',darurat:'Dana Darurat',deposito:'Deposito',emas:'Emas',lain:'Aset Lainnya',utang:'Utang / Kewajiban'};
let KIND={...DEFAULT_KIND};
const isLiabilityKind=k=>k==='utang'||String(k).startsWith('custom_liab_');
const shift=(m,n)=>{const [y,o]=m.split('-').map(Number),d=new Date(y,o-1+n,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
// Investasi berbasis nominal: Buy/Sell/Dividend/Coupon/Fee dicatat sebagai arus kas.
// Nilai pasar per instrumen diinput manual; total gain/loss = MV + proceeds + distributions - buys - fees.
function invCalc(){const m={},byM={};
 [...S.inv].sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id).forEach(t=>{
  const i=m[t.name]??={name:t.name,cls:t.cls,buys:0,proceeds:0,div:0,fees:0,mv:0,ret:0,retPct:NaN};
  const b=byM[t.date.slice(0,7)]??={buy:0,sell:0,div:0,fee:0};i.cls=t.cls;
  if(t.type==='Buy'){i.buys+=t.amount;b.buy+=t.amount}
  else if(t.type==='Sell'){i.proceeds+=t.amount;b.sell+=t.amount}
  else if(t.type==='Fee'){i.fees+=t.amount;b.fee+=t.amount}
  else{i.div+=t.amount;b.div+=t.amount}
 });
 const items=Object.values(m);items.forEach(i=>{
  i.netContrib=i.buys-i.proceeds;
  i.mv=Number(S.marketValues[i.name]??Math.max(0,i.netContrib));
  i.ret=i.mv+i.proceeds+i.div-i.buys-i.fees;
  i.retPct=i.buys?i.ret/i.buys:NaN;
 });
 return{items,byM}}
// Investasi dihitung otomatis dari modul Investasi (tidak double counting dengan Aset manual).
function totals(){const it=IC.items,g=k=>sum(it.map(i=>i[k])),man=sum(S.assets.filter(a=>!isLiabilityKind(a.kind)).map(a=>a.value)),liab=sum(S.assets.filter(a=>isLiabilityKind(a.kind)).map(a=>a.value)),invMV=g('mv'),A=man+invMV;
 return{invMV,man,A,liab,nw:A-liab,cost:g('netContrib'),unreal:0,real:0,div:g('div'),ret:g('ret'),buys:g('buys'),proceeds:g('proceeds'),fees:g('fees')}}
function stats(p){const f=t=>t.date.startsWith(p),T=y=>sum(S.tx.filter(t=>t.type===y&&f(t)).map(t=>t.amount)),inc=T('in'),exp=T('out'),
 b=Object.entries(IC.byM).filter(([k])=>k.startsWith(p)).map(x=>x[1]),g=k=>sum(b.map(x=>x[k]));
 return{inc,exp,sav:inc-exp,rate:inc?(inc-exp)/inc:NaN,buy:g('buy'),sell:g('sell'),div:g('div'),fee:g('fee')}}
const allMonths=()=>[...new Set(S.tx.map(t=>t.date.slice(0,7)))].sort();
const snapsSorted=()=>[...S.snaps].sort((a,b)=>a.id<b.id?-1:1);
