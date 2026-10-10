import { useState, useEffect, useRef } from "react";

export function useFlash(duration = 3200) {
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function flash(msg, err) {
    setNote(msg);
    setNoteErr(!!err);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setNote(""), duration);
  }

  return { note, noteErr, setNoteErr, flash };
}
