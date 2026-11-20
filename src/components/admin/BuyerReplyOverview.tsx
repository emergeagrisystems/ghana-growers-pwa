import Link from "next/link";
import { replyLabels, type ReplyGroup, type ReplyOverview } from "@/lib/buyerReplies";
import s from "./staff.module.css";

export function BuyerReplyOverview({summary}:{summary:ReplyOverview}) {
  return <section className={s.replyOverview} aria-labelledby="reply-heading">
    <h2 id="reply-heading">Buyer first replies</h2>
    {"problem" in summary ? <div><p>{summary.problem}</p><Link href="/admin?view=buyer">Open buyer queue</Link></div> : <>
      <ul>{(Object.keys(replyLabels) as ReplyGroup[]).map(group => {
        const ids = summary.groups[group];
        const href = "/admin?view=buyer&replies="+group+(ids.length===1 ? "&record="+ids[0] : "");
        return <li key={group}><Link prefetch={false} href={href} data-attention={group==="overdue" && ids.length>0}>
          <strong>{ids.length}</strong> {replyLabels[group]}</Link></li>;
      })}</ul>
      <p>Attention soon and overdue are included in the first total. Older requests are reviewed separately.</p>
    </>}
  </section>;
}
