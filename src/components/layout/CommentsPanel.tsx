import { useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { CommentTarget } from "@/types/project";

function targetLabel(t: CommentTarget): string {
  switch (t.kind) {
    case "room":
      return "this room";
    case "opening":
      return "this door/window";
    case "elevation":
      return `${t.side} elevation`;
    case "version":
      return "this design version";
    default:
      return "general";
  }
}

function sameTarget(a: CommentTarget, b: CommentTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "room" && b.kind === "room") return a.roomId === b.roomId;
  if (a.kind === "opening" && b.kind === "opening") return a.openingId === b.openingId;
  if (a.kind === "elevation" && b.kind === "elevation") return a.side === b.side;
  if (a.kind === "version" && b.kind === "version") return a.versionId === b.versionId;
  return a.kind === "general" && b.kind === "general";
}

export default function CommentsPanel({ target }: { target: CommentTarget }) {
  const comments = useProjectStore((s) => s.project.comments);
  const addComment = useProjectStore((s) => s.addComment);
  const resolveComment = useProjectStore((s) => s.resolveComment);
  const activeVersionId = useProjectStore((s) => s.activeVersionId);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState(() => localStorage.getItem("hds:authorName") ?? "");

  const relevant = comments.filter((c) => sameTarget(c.target, target));

  const submit = () => {
    if (!text.trim()) return;
    localStorage.setItem("hds:authorName", author);
    addComment({
      target,
      author: author.trim() || "Family member",
      text: text.trim(),
    });
    setText("");
  };

  return (
    <div className="panel-section">
      <div className="panel-title">Comments on {targetLabel(target)}</div>

      {relevant.length === 0 && <p className="helper-text">No comments yet.</p>}
      {relevant.map((c) => (
        <div className="comment-item" key={c.id} style={{ opacity: c.resolved ? 0.55 : 1 }}>
          <div>{c.text}</div>
          <div className="meta">
            {c.author} · {new Date(c.createdAt).toLocaleString()}
          </div>
          <button
            className="btn small"
            style={{ alignSelf: "flex-start" }}
            onClick={() => resolveComment(c.id, !c.resolved)}
          >
            {c.resolved ? "Reopen" : "Mark resolved"}
          </button>
        </div>
      ))}

      <input
        type="text"
        placeholder="Your name"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <textarea
        className="textarea"
        placeholder='e.g. "Can we make this bedroom one foot wider?"'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn primary" onClick={submit}>
        Add comment
      </button>
      <p className="helper-text">
        Comments are saved with this design ({activeVersionId ? "current version" : ""}) in your
        browser. They travel with a share link you send to family.
      </p>
    </div>
  );
}
