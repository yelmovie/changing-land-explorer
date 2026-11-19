/** Reveal a visual copy while callers keep the complete transcript and voice ID. */
export function createDialogueText(node, onComplete) {
  let timer;
  let characters = [];
  let position = 0;

  // The not-yet-typed rest stays in place as hidden text, so the line breaks are those of the whole line
  // from the first letter (balanced, no lone last word) and nothing jumps between lines while it types.
  function render() {
    node.textContent = characters.slice(0, position).join('');
    if (position < characters.length && node.ownerDocument) {
      const rest = node.ownerDocument.createElement('span');
      rest.className = 'dialogue-rest';
      rest.style.visibility = 'hidden';
      rest.textContent = characters.slice(position).join('');
      node.append(rest);
    }
  }

  function finish() {
    const wasTyping = position < characters.length;
    clearTimeout(timer);
    position = characters.length;
    render();
    onComplete();
    return wasTyping;
  }

  function tick() {
    position++;
    render();
    if (position < characters.length) timer = setTimeout(tick, 22);
    else onComplete();
  }

  return {
    show(text, immediate = false) {
      clearTimeout(timer);
      characters = Array.from(text);
      position = 0;
      render();
      if (immediate || !characters.length) finish();
      else timer = setTimeout(tick, 22);
    },
    finish,
    stop() { clearTimeout(timer); },
    get typing() { return position < characters.length; }
  };
}
