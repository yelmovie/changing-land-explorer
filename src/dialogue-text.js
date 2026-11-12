/** Reveal a visual copy while callers keep the complete transcript and voice ID. */
export function createDialogueText(node, onComplete) {
  let timer;
  let characters = [];
  let position = 0;

  function finish() {
    const wasTyping = position < characters.length;
    clearTimeout(timer);
    position = characters.length;
    node.textContent = characters.join('');
    onComplete();
    return wasTyping;
  }

  function tick() {
    position++;
    node.textContent = characters.slice(0, position).join('');
    if (position < characters.length) timer = setTimeout(tick, 22);
    else onComplete();
  }

  return {
    show(text, immediate = false) {
      clearTimeout(timer);
      characters = Array.from(text);
      position = 0;
      node.textContent = '';
      if (immediate || !characters.length) finish();
      else timer = setTimeout(tick, 22);
    },
    finish,
    stop() { clearTimeout(timer); },
    get typing() { return position < characters.length; }
  };
}
