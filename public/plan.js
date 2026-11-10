// Shared what-if model (browser + server checks). lv = {causeKey: 0..1 fix progress, sale: bool}
export const LABEL={stockouts:"Restock top products",dispatch:"Dispatch speed",price:"Re-price top products",ratings:"Fix ratings & returns",listings:"Refresh listings",visibility:"Boost visibility"};
export function project(s,lv){
  const parts=s.causes.filter(c=>c.recover!=null).map(c=>({key:c.key,label:LABEL[c.key]||c.label,v:Math.round(c.rupees*c.recover*(lv[c.key]||0)/100)*100}));
  if(lv.sale)parts.push({key:"sale",label:"Year-End Sale",v:Math.round(s.sales*0.0625/100)*100});
  const gain=parts.reduce((a,p)=>a+p.v,0),projected=s.sales+gain;
  return{parts,gain,projected,vsLast:(projected-s.lastSales)/s.lastSales*100};
}
