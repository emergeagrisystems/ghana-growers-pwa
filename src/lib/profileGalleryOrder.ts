/** Positions refer to the final customer-selected order. Older clients append new images. */
export function orderedGallery(existing:string[],added:{publicUrl:string;position?:number}[]) {
  const order=Array.from(new Set(existing));
  const indexed=added.filter(i=>i.position!==undefined).sort((a,b)=>a.position!-b.position!);
  for(const i of indexed)order.splice(i.position!,0,i.publicUrl);
  return Array.from(new Set([...order,...added.filter(i=>i.position===undefined).map(i=>i.publicUrl)]));
}
