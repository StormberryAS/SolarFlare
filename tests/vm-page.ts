// Runs the page's three scripts, suncalc.js, cities.js and then the compiled app.js, in a fresh
// node:vm context, one global scope as in a browser, with a stub of the page parts app.js touches
// and a clock fixed at a given instant (a test can move it). No browser and no DOM library: app.js
// is a classic script that reads the page as it loads, so it cannot be imported; this runs it as
// the page does, then lets a test type in the city search, pick a city from the list, clear it and
// click elsewhere, through the same listeners the page uses. A click is delivered as the browser
// delivers it: to the element, then (bubbling) to the document.

import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

/** What app.js checks with instanceof Node: a click target. */
class StubNode {}

/** A page element with only what app.js uses. */
class StubElement extends StubNode {
  textContent = '';
  className = '';
  hidden = false;
  #html = '';
  readonly style: { color: string } = { color: '' };
  readonly children: StubElement[] = [];
  parentElement: StubElement | null = null;
  readonly listeners = new Map<string, ((event: { target: StubNode }) => void)[]>();
  readonly tag: string;
  readonly id: string;
  constructor(tag: string, id = '') { super(); this.tag = tag; this.id = id; }
  /** Markup is only recorded; setting it to '' empties the element, as app.js expects. */
  get innerHTML(): string { return this.#html; }
  set innerHTML(html: string) { this.#html = html; if (html === '') this.children.splice(0); }
  appendChild(child: StubElement): StubElement { this.children.push(child); child.parentElement = this; return child; }
  addEventListener(type: string, fn: (event: { target: StubNode }) => void): void { this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]); }
  fire(type: string, target: StubNode = this): void { for (const fn of this.listeners.get(type) ?? []) fn({ target }); }
  /** True for the element itself and every element below it, as Node.contains. */
  contains(node: StubNode | null): boolean {
    return node === this || this.children.some((c) => c.contains(node));
  }
  focus(): void { focused = this.id || this.tag; }
}
// The kind app.js checks with instanceof for the search field.
class StubInput extends StubElement {
  value = '';
}
let focused = '';

/** One card of the dashboard: its class, its value and its description. */
export type Card = [className: string, value: string, desc: string];

/** What the page shows. */
export interface PageState {
  date: string;
  status: string;
  statusColour: string;
  cards: [Card, Card, Card];
  resultsHidden: boolean;
  /** The search: the field, the wrapper's hidden flag, the list's hidden flag and its rows' HTML. */
  search: string;
  searchHidden: boolean;
  listHidden: boolean;
  list: string[];
  /** The chosen city line and its hidden flag. */
  selected: string;
  selectedHidden: boolean;
  focus: string;
}

export interface Page {
  state(): PageState;
  /** Types text into the city search, as the input event delivers it. */
  type(text: string): void;
  /** Clicks row i of the list (bubbling to the document). */
  pick(i: number): void;
  /** Clicks the clear button (bubbling to the document). */
  clear(): void;
  /** Clicks somewhere else on the page. */
  clickOutside(): void;
  /** Moves the clock. */
  setNow(t: number): void;
  /** Runs an expression in the page's global scope and returns it as JSON text. */
  run(expression: string): string;
}

/** Loads suncalc.js, cities.js and app.js from root (a directory URL) at the instant now. */
export function loadPage(root: URL, now: number): Page {
  let clock = now;
  focused = '';
  const el = (tag: string, id: string, className = '', hidden = false, text = ''): StubElement => {
    const e = tag === 'input' ? new StubInput(tag, id) : new StubElement(tag, id);
    e.className = className; e.hidden = hidden; e.textContent = text;
    return e;
  };
  // The page parts, as index.html has them before app.js runs.
  const body = el('body', '');
  const wrapper = body.appendChild(el('div', '', 'search-wrapper'));
  const search = wrapper.appendChild(el('input', 'city-search', 'search-input'));
  const dropdown = wrapper.appendChild(el('ul', 'city-dropdown', 'dropdown', true));
  const selected = body.appendChild(el('div', 'city-selected', 'selected-city', true));
  const selectedText = selected.appendChild(el('span', 'city-selected-text'));
  const clearBtn = selected.appendChild(el('button', 'city-clear-btn', 'clear-btn', false, '×'));
  const results = body.appendChild(el('section', 'results-card', 'card results-card', true));
  results.appendChild(el('strong', 'current-date', '', false, 'Loading...'));
  results.appendChild(el('span', 'overall-status', 'pill-value mono', false, 'Active'));
  for (const [card, kind] of [['xray', 'flare'], ['kp', 'storm'], ['aurora', 'aurora']] as const) {
    const c = results.appendChild(el('div', `card-${card}`, `sun-time-card ${kind}-card`));
    c.appendChild(el('div', `res-${card}`, 'sun-time-value mono'));
    c.appendChild(el('div', `res-${card}-desc`, 'desc-text'));
  }
  const byId = new Map<string, StubElement>();
  const index = (e: StubElement): void => { if (e.id) byId.set(e.id, e); e.children.forEach(index); };
  index(body);
  const docListeners = new Map<string, ((event: { target: StubNode }) => void)[]>();
  const toDocument = (target: StubNode): void => { for (const fn of docListeners.get('click') ?? []) fn({ target }); };

  // The clock: new Date() and Date.now() give the fixed instant; every other use is the real Date.
  class FixedDate extends Date {
    constructor(...args: [] | [number | string | Date]) {
      if (args.length === 0) super(clock); else super(args[0]);
    }
    static override now(): number { return clock; }
  }

  const sandbox = {
    Date: FixedDate,
    Node: StubNode,
    HTMLElement: StubElement,
    HTMLInputElement: StubInput,
    document: {
      getElementById: (id: string): StubElement | null => byId.get(id) ?? null,
      addEventListener: (type: string, fn: (event: { target: StubNode }) => void): void => { docListeners.set(type, [...(docListeners.get(type) ?? []), fn]); },
      createElement: (tag: string): StubElement => new StubElement(tag),
    },
  };
  const context = createContext(sandbox);
  runInContext('var window = globalThis;', context);
  for (const file of ['suncalc.js', 'cities.js', 'app.js']) {
    runInContext(readFileSync(new URL(file, root), 'utf8'), context, { filename: file });
  }

  const get = (id: string): StubElement => {
    const e = byId.get(id);
    if (!e) throw new Error(`no stub #${id}`);
    return e;
  };
  const card = (name: string): Card => [get(`card-${name}`).className, get(`res-${name}`).textContent, get(`res-${name}-desc`).textContent];
  return {
    state: () => ({
      date: get('current-date').textContent,
      status: get('overall-status').textContent,
      statusColour: get('overall-status').style.color,
      cards: [card('xray'), card('kp'), card('aurora')],
      resultsHidden: results.hidden,
      search: search instanceof StubInput ? search.value : '',
      searchHidden: wrapper.hidden,
      listHidden: dropdown.hidden,
      list: dropdown.children.map((li) => li.innerHTML),
      selected: selectedText.textContent,
      selectedHidden: selected.hidden,
      focus: focused,
    }),
    type: (text) => { if (search instanceof StubInput) search.value = text; search.fire('input'); },
    pick: (i) => {
      const li = dropdown.children[i];
      if (!li) throw new Error(`the list has no row ${i}`);
      li.fire('click');
      toDocument(li);
    },
    clear: () => { clearBtn.fire('click'); toDocument(clearBtn); },
    clickOutside: () => { toDocument(body); },
    setNow: (t) => { clock = t; },
    run: (expression) => String(runInContext(`JSON.stringify(${expression})`, context)),
  };
}
