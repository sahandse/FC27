const providers=[
 {name:'FUT.GG public player catalogue',url:'https://www.fut.gg/players/',marker:'FC 27'},
 {name:'FUTBIN public player catalogue',url:'https://www.futbin.com/27/players',marker:'FUTBIN'}
];
let reachable=0;
for(const provider of providers){
 try{
  const response=await fetch(provider.url,{headers:{'User-Agent':'FC27Hub/2.0 (public provider health check)','Accept':'text/html'},signal:AbortSignal.timeout(15000)});
  const text=await response.text();
  const valid=response.ok&&text.toLowerCase().includes(provider.marker.toLowerCase());
  if(valid)reachable++;
  console.log(JSON.stringify({provider:provider.name,httpStatus:response.status,pageReachable:valid,perVersionPerPlatformLivePriceVerified:false,checkedAt:new Date().toISOString()}));
 }catch(error){console.warn(JSON.stringify({provider:provider.name,pageReachable:false,reason:String(error).slice(0,160)}))}
}
console.log('Reachable public providers:',reachable,'; base-card PS5/PC quotes come from scripts/sync-fc27-prices-futgg.mjs. Xbox and promoted card versions remain UNVERIFIED.');
