// The page logic, run as the page runs it (tests/vm-page.ts): suncalc.js, cities.js, then the
// compiled app.js, with the clock fixed at 5 November 2026 12:00 in Oslo unless a test moves it.
// The expected values are what the JavaScript before the move to TypeScript (commit d8e2e73)
// showed at the same instants.

process.env.TZ = 'Europe/Oslo';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage, type Card, type Page, type PageState } from './vm-page.ts';

const NOW = Date.parse('2026-11-05T11:00:00Z');
const root = new URL('../', import.meta.url);
/** The card text for a night with an M or X flare: an em dash between the two parts (an escape here). */
const NIGHT = 'Nighttime \u2014 No local radio blackout';

/** A list row as app.js writes it. */
const row = (name: string, country: string): string => `<span class="city-name">${name}</span><span class="city-country">${country}</span>`;
/** Moves the clock, then clears the city and chooses the first match of a query, as a visitor would. */
const choose = (page: Page, at: string, query: string): PageState => {
  page.setNow(Date.parse(at));
  page.clear();
  page.type(query);
  page.pick(0);
  return page.state();
};
const dash = (s: PageState): [string, string, string, Card[]] => [s.date, s.status, s.statusColour, s.cards];

test('load: nothing changes before a city is chosen', () => {
  const page = loadPage(root, NOW);
  assert.deepEqual(page.state(), {
    date: 'Loading...', status: 'Active', statusColour: '',
    cards: [['sun-time-card flare-card', '', ''], ['sun-time-card storm-card', '', ''], ['sun-time-card aurora-card', '', '']],
    resultsHidden: true, search: '', searchHidden: false, listHidden: true, list: [], selected: '', selectedHidden: true, focus: '',
  });
});

test('the city search: prefix matches first, at most 10 rows, folded names, exonyms and countries', () => {
  const page = loadPage(root, NOW);
  page.type('B');
  assert.deepEqual([page.state().listHidden, page.state().list], [true, []], 'one letter shows no list');
  page.type('Berg');
  assert.equal(page.state().listHidden, false);
  assert.deepEqual(page.state().list, [
    row('Bergerac', 'France'), row('Bergedorf', 'Germany'), row('Bergheim', 'Germany'), row('Bergisch Gladbach', 'Germany'),
    row('Bergkamen', 'Germany'), row('Bergamo', 'Italy'), row('Bergen', 'Norway'), row('Bergen', 'The Netherlands'),
    row('Bergen op Zoom', 'The Netherlands'), row('Bergama', 'Turkey'),
  ]);
  page.clickOutside();
  assert.equal(page.state().listHidden, true, 'a click outside closes the list');
  page.type('tromso');
  assert.deepEqual(page.state().list, [row('Tromsø', 'Norway')], 'a folded name');
  page.type('gothenburg');
  assert.deepEqual(page.state().list, [row('Göteborg', 'Sweden')], 'an English exonym');
  page.type('  Oslo  ');
  assert.deepEqual(page.state().list, [row('Oslo', 'Norway')], 'spaces are trimmed');
  page.type('norway');
  assert.deepEqual([page.state().list.length, page.state().list[0], page.state().list[1]], [10, row('Arendal', 'Norway'), row('Asker', 'Norway')], 'a country');
  page.type('zzqx');
  assert.deepEqual([page.state().listHidden, page.state().list], [true, []], 'no match closes the list');
});

test('a city: the dashboard opens; clearing it closes the dashboard and puts the focus in the search', () => {
  const page = loadPage(root, NOW);
  page.type('bergen');
  assert.equal(page.state().list.length, 9);
  page.pick(0);
  assert.deepEqual(page.state(), {
    date: 'Thursday, 5 November 2026 in Bergen', status: 'Elevated', statusColour: 'var(--accent-orange)',
    cards: [['sun-time-card severity-low', 'B7.3', 'Quiet'], ['sun-time-card severity-med', 'Kp 5', 'Minor Storm (G1)'],
      ['sun-time-card severity-high', 'Visible!', 'Overhead or on northern horizon']],
    resultsHidden: false, search: '', searchHidden: true, listHidden: true, list: [row('Bergen', 'Norway'), ...page.state().list.slice(1)],
    selected: 'Bergen, Norway', selectedHidden: false, focus: '',
  });
  page.clear();
  const s = page.state();
  assert.deepEqual([s.resultsHidden, s.searchHidden, s.selectedHidden, s.focus], [true, false, true, 'city-search']);
});

test('the simulation: flare, storm and aurora by day, night and latitude', () => {
  const page = loadPage(root, NOW);
  const rose = 'var(--accent-rose)', orange = 'var(--accent-orange)';
  assert.deepEqual(dash(choose(page, '2026-01-02T23:00:00Z', 'oslo')), ['Saturday, 3 January 2026 in Oslo', 'Elevated', orange,
    [['sun-time-card severity-low', 'M0.4', NIGHT], ['sun-time-card severity-low', 'Kp 2', 'Quiet/Normal'],
      ['sun-time-card severity-low', 'Unlikely', 'Latitude 60° too low for Kp 2']]]);
  assert.deepEqual(dash(choose(page, '2026-01-02T23:00:00Z', 'honolulu')), ['Saturday, 3 January 2026 in Honolulu, HI', 'Elevated', orange,
    [['sun-time-card severity-med', 'M0.4', 'Minor dayside radio blackout (R1-R2)'], ['sun-time-card severity-low', 'Kp 2', 'Quiet/Normal'],
      ['sun-time-card severity-low', 'Unlikely', 'Latitude 21° too low for Kp 2']]]);
  assert.deepEqual(dash(choose(page, '2026-02-09T11:00:00Z', 'tromso')), ['Monday, 9 February 2026 in Tromsø', 'Storm Active', rose,
    [['sun-time-card severity-high', 'X3.5', 'Major dayside radio blackout (R3-R5)'], ['sun-time-card severity-low', 'Kp 1', 'Quiet/Normal'],
      ['sun-time-card severity-high', 'Visible!', 'Overhead or on northern horizon']]]);
  assert.deepEqual(dash(choose(page, '2026-01-27T23:00:00Z', 'ushuaia')), ['Wednesday, 28 January 2026 in Ushuaia', 'Storm Active', rose,
    [['sun-time-card severity-med', 'M7.7', 'Minor dayside radio blackout (R1-R2)'], ['sun-time-card severity-high', 'Kp 9', 'Strong Storm (G3-G5)'],
      ['sun-time-card severity-high', 'Visible!', 'Overhead or on northern horizon']]]);
  assert.deepEqual(dash(choose(page, '2026-01-03T23:00:00Z', 'oslo')), ['Sunday, 4 January 2026 in Oslo', 'Elevated', orange,
    [['sun-time-card severity-low', 'B8.6', 'Quiet'], ['sun-time-card severity-med', 'Kp 5', 'Minor Storm (G1)'],
      ['sun-time-card severity-med', 'Possible', 'Look low on horizon']]]);
});

test('the model without a city, and the seeded random function', () => {
  const page = loadPage(root, Date.parse('2026-03-25T23:00:00Z'));
  page.run('generateSpaceWeather(null)');
  assert.deepEqual(dash(page.state()), ['Thursday, 26 March 2026', 'Storm Active', 'var(--accent-rose)',
    [['sun-time-card severity-high', 'X2.9', 'Major Flare Activity'], ['sun-time-card severity-high', 'Kp 9', 'Strong Storm (G3-G5)'],
      ['sun-time-card severity-high', 'High', 'Visible at mid-latitudes']]]);
  page.setNow(Date.parse('2026-06-02T23:00:00Z'));
  page.run('generateSpaceWeather(null)');
  assert.deepEqual(page.state().cards[2], ['sun-time-card severity-med', 'Moderate', 'Visible at high-latitudes']);
  assert.equal(page.run('seededRandom(0)'), '0');
  assert.equal(page.run('seededRandom(1)'), '0.7098480789645691');
  assert.equal(page.run('seededRandom(20261105)'), '0.805894493414371');
  assert.equal(page.run('seededRandom(20261105 * 1.1)'), '0.23569358796453344');
});
