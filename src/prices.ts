export type Platform='pc'|'ps'|'xbox';
export type PriceStatus='verified'|'stale'|'unavailable';
export interface CardPrice { cardId:string; versionId:string; platform:Platform; coins:number|null; status:PriceStatus; sourceUrl:string|null; checkedAt:string|null; }
const DEFAULT_WINDOW_MINUTES=45;
export function validatedPrice(item:CardPrice,now=Date.now(),windowMinutes=DEFAULT_WINDOW_MINUTES):CardPrice{
 const timestamp=item.checkedAt?Date.parse(item.checkedAt):NaN;
 const sourceOk=typeof item.sourceUrl==='string'&&item.sourceUrl.startsWith('https://');
 const windowMs=Math.max(1,windowMinutes)*60*1000;
 const current=Number.isFinite(timestamp)&&timestamp<=now&&now-timestamp<=windowMs;
 const valid=sourceOk&&current&&Number.isFinite(item.coins)&&item.coins!==null&&item.coins>=0;
 return {...item,status:valid?'verified':Number.isFinite(timestamp)?'stale':'unavailable',coins:valid?item.coins:null};
}
