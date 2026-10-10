const V="duroosi-v8";
const CORE=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","logo.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET")return;
  const u=new URL(r.url);
  // Firebase realtime/auth API calls: never cache
  if(/googleapis\.com|firebaseio\.com|firebaseapp\.com/.test(u.host)&&!/fonts\./.test(u.host))return;
  // الخطوط: من الكاش فورًا (يمنع اهتزاز الصفحة عند تحميل الخط) وتتحدث في الخلفية
  if(/fonts\.(googleapis|gstatic)\.com/.test(u.host)){
    e.respondWith(caches.match(r).then(m=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque")){const c=res.clone();caches.open(V).then(x=>x.put(r,c)).catch(()=>{})}return res}).catch(()=>m);
      return m||net;
    }));
    return;
  }
  // باقي الملفات: الشبكة أولًا (عشان التحديثات) وبعد 3 ثواني يفتح من الكاش لو النت ضعيف
  e.respondWith(new Promise(resolve=>{
    let done=false;
    const fb=()=>caches.match(r).then(m=>m||caches.match("index.html"));
    const timer=setTimeout(()=>{fb().then(m=>{if(m&&!done){done=true;resolve(m)}})},3000);
    fetch(r).then(res=>{clearTimeout(timer);const c=res.clone();caches.open(V).then(x=>x.put(r,c)).catch(()=>{});if(!done){done=true;resolve(res)}})
      .catch(()=>{clearTimeout(timer);if(!done){done=true;fb().then(resolve)}});
  }));
});
