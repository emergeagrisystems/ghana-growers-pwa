export type HandoverDraft = {note:string; nextAction:string; dueLocal:string};

/** Staff enter Ghana time, independent of the browser's own time zone. */
export function prepareHandover(draft:HandoverDraft) {
  const note=draft.note.trim(), nextAction=draft.nextAction.trim();
  if(note.length>2000||nextAction.length>300)return {error:"Shorten the note or next action."} as const;
  if(!note&&!nextAction&&!draft.dueLocal)return {error:"Enter a note or next action."} as const;
  if(draft.dueLocal && !nextAction)return {error:"Add the action that is due."} as const;
  let dueAt:string|null=null;
  if(draft.dueLocal){
    const time=new Date(draft.dueLocal+":00Z");
    if(!Number.isFinite(time.getTime())||time.toISOString().slice(0,16)!==draft.dueLocal)return {error:"Enter a valid Ghana date and time."} as const;
    dueAt=time.toISOString();
  }
  return {note:note||null,nextAction:nextAction||null,dueAt} as const;
}
