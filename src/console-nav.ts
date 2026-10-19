/* Console mode: TV styling toggle, spatial focus navigation and Gamepad polling.
   Built for a TV-distance screen and a controller; it is keyboard-reachable too.
   No PlayStation hardware has been used, so nothing here claims console certification. */

export type Direction = 'up' | 'down' | 'left' | 'right';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
const VECTOR: Record<Direction, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DPAD: Record<number, Direction> = { 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
const TV_KEY = 'fc27-tv-mode';

const isFocusable = (el: Element): el is HTMLElement => {
  const node = el as HTMLElement;
  return node.getClientRects().length > 0 && !node.closest('[hidden]') && !node.closest('[inert]');
};

const candidates = () => [...document.querySelectorAll(FOCUSABLE)].filter(isFocusable);

function pickNext(current: HTMLElement, list: HTMLElement[], direction: Direction) {
  const [dx, dy] = VECTOR[direction];
  const a = current.getBoundingClientRect();
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best: HTMLElement | null = null, bestScore = Infinity;
  for (const el of list) {
    if (el === current) continue;
    const b = el.getBoundingClientRect();
    const bx = b.left + b.width / 2, by = b.top + b.height / 2;
    const forward = (bx - ax) * dx + (by - ay) * dy;
    if (forward <= 1) continue;
    // Sideways drift costs extra, so the nearest element in the aimed direction wins.
    const lateral = Math.abs((bx - ax) * dy - (by - ay) * dx);
    const score = forward + lateral * 2.5;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  return best;
}

export function moveFocus(direction: Direction) {
  const list = candidates();
  if (!list.length) return false;
  const active = document.activeElement;
  const current = active && isFocusable(active) && list.includes(active as HTMLElement) ? active as HTMLElement : null;
  if (!current) { list[0].focus(); return true; }
  const next = pickNext(current, list, direction);
  if (!next) return false;
  next.focus();
  next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  return true;
}

/* The controller's A button activates whatever is focused, so no game logic needs to know about pads. */
function activateFocused() {
  const el = document.activeElement;
  if (el && isFocusable(el)) (el as HTMLElement).click();
}

export function setTVMode(on: boolean) {
  document.body.classList.toggle('tv', on);
  const toggle = document.getElementById('tvToggle');
  if (toggle) {
    toggle.classList.toggle('active', on);
    toggle.setAttribute('aria-pressed', String(on));
  }
  try { localStorage.setItem(TV_KEY, on ? '1' : '0'); } catch (e) { /* private mode: the toggle still works for this visit */ }
}

export function isTVMode() {
  try { return localStorage.getItem(TV_KEY) !== '0'; } catch (e) { return true; }
}

export function initConsoleNav(cancelOverlay: () => void) {
  setTVMode(isTVMode());

  document.addEventListener('keydown', event => {
    const direction = event.key === 'ArrowUp' ? 'up' : event.key === 'ArrowDown' ? 'down'
      : event.key === 'ArrowLeft' ? 'left' : event.key === 'ArrowRight' ? 'right' : null;
    if (!direction || !document.body.classList.contains('tv')) return;
    // Typing inside a field keeps normal caret behaviour.
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if ((tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && (direction === 'left' || direction === 'right')) return;
    event.preventDefault();
    moveFocus(direction);
  });

  const state: Record<string, boolean> = {};
  let frame = 0;
  const poll = () => {
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    const pad = [...pads].find(entry => entry && entry.connected);
    if (pad) {
      for (const [index, direction] of Object.entries(DPAD)) {
        const down = !!pad.buttons[Number(index)]?.pressed;
        if (down && !state[index]) moveFocus(direction);
        state[index] = down;
      }
      const a = !!pad.buttons[0]?.pressed, b = !!pad.buttons[1]?.pressed;
      if (a && !state.a) activateFocused();
      if (b && !state.b) cancelOverlay();
      state.a = a; state.b = b;
    }
    frame = requestAnimationFrame(poll);
  };
  poll();
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
}

export function closeAnyOverlay() {
  const modals = document.querySelectorAll('.ps-overlay.open,.draft-overlay.open,.modal-ov.open,.squad-picker.open,.cc-overlay.open,.solver-modal.open');
  let closed = false;
  for (const modal of modals) if (modal.classList.contains('open')) { modal.classList.remove('open'); closed = true; }
  const dialog = document.getElementById('fc27-detail-dialog');
  if (dialog) { dialog.remove(); closed = true; }
  return closed;
}
