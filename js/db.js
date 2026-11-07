const STORES=['tx','inv','assets','cats','snaps','moves'];
const DB={db:null,
open(){return new Promise((ok,no)=>{const r=indexedDB.open('fintrack',2);r.onupgradeneeded=()=>{STORES.forEach(s=>{if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s,{keyPath:'id',autoIncrement:true})});if(!r.result.objectStoreNames.contains('kv'))r.result.createObjectStore('kv')};r.onsuccess=()=>{this.db=r.result;ok()};r.onerror=()=>no(r.error)})},
os(s,m='readonly'){return this.db.transaction(s,m).objectStore(s)},
rq(r){return new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})},
all(s){return this.rq(this.os(s).getAll())},put(s,o){return this.rq(this.os(s,'readwrite').put(o))},
del(s,id){return this.rq(this.os(s,'readwrite').delete(id))},clear(s){return this.rq(this.os(s,'readwrite').clear())},
getKV(k){return this.rq(this.os('kv').get(k))},setKV(k,v){return this.rq(this.os('kv','readwrite').put(v,k))}};
