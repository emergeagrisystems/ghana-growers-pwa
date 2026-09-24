"use client";
import { Children, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import s from "./PublicCardRail.module.css";
// Adapted from the existing MobileCardBrowser; native scrolling, no auto-advance.
export function PublicCardRail({children,label,className}:{children:ReactNode;label:string;className:string}){
 const track=useRef<HTMLDivElement>(null),id=useId();
 const [position,setPosition]=useState(0),[overflow,setOverflow]=useState(false);
 const count=Children.count(children);
 const sync=useCallback(()=>{const node=track.current;if(!node)return;const width=node.firstElementChild?.getBoundingClientRect().width??0;const gap=parseFloat(getComputedStyle(node).columnGap)||0;setOverflow(node.scrollWidth>node.clientWidth+1);setPosition(Math.max(0,Math.min(count-1,Math.round(node.scrollLeft/(width+gap)))))},[count]);
 useEffect(()=>{const node=track.current;if(!node)return;const observer=new ResizeObserver(sync);observer.observe(node);return()=>observer.disconnect()},[sync]);
 function move(next:number){const node=track.current,target=node?.children[Math.max(0,Math.min(count-1,next))];if(!node||!target||!node.firstElementChild)return;node.scrollTo({left:target.getBoundingClientRect().left-node.firstElementChild.getBoundingClientRect().left,behavior:"instant"});sync()}
 return <div className={s.browser}><div ref={track} id={id} className={className} role="group" aria-label={label} tabIndex={overflow?0:undefined} onScroll={sync} onKeyDown={e=>{if(e.target!==e.currentTarget||!overflow)return;if(e.key==="ArrowRight")move(position+1);else if(e.key==="ArrowLeft")move(position-1);else if(e.key==="Home")move(0);else if(e.key==="End")move(count-1);else return;e.preventDefault()}}>{children}</div>{overflow&&<div className={s.controls}><span role="status" aria-live="polite">{position+1} of {count} · Swipe to browse</span><button type="button" disabled={position===0} aria-controls={id} aria-label={`Previous ${label} card`} onClick={()=>move(position-1)}>Previous</button><button type="button" disabled={position===count-1} aria-controls={id} aria-label={`Next ${label} card`} onClick={()=>move(position+1)}>Next</button></div>}</div>
}
