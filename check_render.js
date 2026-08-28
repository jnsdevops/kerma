#!/usr/bin/env node
/**
 * KERMA — verification du rendu avant envoi
 *
 * Trois pages blanches cette semaine, trois fois la meme cause : une variable
 * utilisee avant d'exister. La syntaxe etait valide a chaque fois, donc les
 * verifications passaient — et renderVals a un try/catch qui avale l'erreur
 * et renvoie un ecran vide plutot que de la signaler.
 *
 * Ce script execute reellement renderVals avec un etat factice et fait
 * remonter ce que le try/catch aurait ravale.
 *
 *   node check_render.js index.html
 *
 * Code de sortie 1 si le rendu echoue : a lancer avant chaque git push.
 */

const fs = require('fs');

const path = process.argv[2] || 'index.html';
if (!fs.existsSync(path)) {
  console.error('Fichier introuvable :', path);
  process.exit(1);
}

let tpl = null;
for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
  const t = line.trim();
  if (t.startsWith('"<!DOCTYPE')) {
    const end = t.lastIndexOf('"');
    try { tpl = JSON.parse(t.slice(0, end + 1)); } catch (e) {}
    break;
  }
}
if (!tpl) {
  console.error('ECHEC — template introuvable ou illisible');
  process.exit(1);
}

const problems = [];

const scripts = (fs.readFileSync(path, 'utf8').match(/<\/script/gi) || []).length;
if (scripts !== 4) problems.push(`balises </script> : ${scripts} au lieu de 4`);

for (const tag of ['div', 'button', 'span']) {
  const o = (tpl.match(new RegExp('<' + tag + '\\b', 'g')) || []).length;
  const c = (tpl.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (o !== c) problems.push(`<${tag}> desequilibres : ${o} ouvrants, ${c} fermants`);
}

for (const tag of ['sc-if', 'sc-for']) {
  let depth = 0, min = 0;
  const re = new RegExp('<' + tag + '\\b|</' + tag + '>', 'g');
  let m;
  while ((m = re.exec(tpl))) {
    depth += m[0][1] === '/' ? -1 : 1;
    min = Math.min(min, depth);
  }
  if (depth !== 0 || min !== 0) problems.push(`<${tag}> mal imbrique (solde ${depth})`);
}

for (const m of tpl.matchAll(/<sc-for\b[^>]*>/g)) {
  if (!/\blist=/.test(m[0])) problems.push(`sc-for sans list= : ${m[0].slice(0, 60)}`);
  else if (!/\bas=/.test(m[0])) problems.push(`sc-for sans as= : ${m[0].slice(0, 60)}`);
}

const m = tpl.match(/renderVals\(\)\s*\{[\s\S]*?\n  \}/);
if (!m) {
  problems.push('renderVals introuvable');
} else {
  let body = m[0].replace(/^renderVals\(\)\s*\{/, '').replace(/\}\s*$/, '');
  body = body.replace('} catch(__kermaErr) {',
                      '} catch(__kermaErr) { globalThis.__kermaCaught = __kermaErr;');

  const state = {
    session: { email: 'test@kerma.app' }, welcomeSeen: true, items: [],
    screen: 'home', flow: 'decision', scn: {}, storeComparison: [],
    itemsCounted: 0, itemsElsewhere: 0, unmatchedNames: [], placeHints: [],
    stockTab: 'low', scanError: '', authMode: 'login', subs: [], subRefused: {},
    authEmail: '', authPassword: '', authLoading: false, authRemember: false,
    authError: '', pickedOnlineId: null, onboarded: true, doneTrips: [],
    compareBasis: 'true', showWhy: true, pendingSaved: 0, checked: {},
    detected: [], household: 4, obStep: 0, stockPredictions: {},
    addMethod: 'type', typeInput: '', menuText: '',
  };

  const ctx = {
    state, _geo: null, _tripStore: '',
    gl: (x) => String(x || 'x')[0],
    savings: () => ({ stat: '$0', word: 'less', statLabel: 'x', projection: null }),
    check12: () => '', check14: () => '', dot: () => '',
    _t: (a) => a, _trail: () => {},
    _lastBasketItems: () => ({ ts: '', all: [], fresh: [] }),
    build: () => ({}), qtyProfile: () => ({ unit: 'ct' }),
    TINT: {}, DB: {}, SIMPLE: {}, AISLE_ORDER: [], BACK_FROM: {}, RECIPES: {},
  };

  const scenarios = [
    ['ecran vide', {}],
    ['non connecte', { session: null, welcomeSeen: false, flow: null }],
    ['un magasin sans prix', {
      storeComparison: [
        { id: 'rp', name: "Ralphs", city: 'MV', items: 40, coupons: 2,
          total_miles: 5, priced: true, lines: [] },
        { id: 'tg', name: 'Target', city: 'RSM', items: 0, coupons: 0,
          total_miles: 2, priced: false, lines: [] },
      ],
      items: [{ id: 1, name: 'Milk', qty: 1, aisle: 'Dairy', options: null, chosen: 0 }],
      itemsCounted: 1,
    }],
    ['une substitution refusee', {
      subs: [{ need: 'Parmesan', offered: 'BelGioioso', price: 5.99,
               changes: [{ attribute: 'brand' }], store: "Ralphs" }],
      subRefused: { Parmesan: 'brand' },
      storeComparison: [{ id: 'rp', name: "Ralphs", city: 'MV', items: 40,
                          coupons: 2, total_miles: 5, priced: true, lines: [] }],
    }],
  ];

  for (const [label, extra] of scenarios) {
    globalThis.__kermaCaught = null;
    const st = Object.assign({}, state, extra);
    const c = Object.assign({}, ctx, { state: st });
    try {
      const f = new Function('s', 'React', 'with(this){ ' + body + ' }');
      f.call(new Proxy(c, {
        get: (t, k) => (k in t ? t[k] : (typeof k === 'string' ? (() => {}) : undefined)),
      }), st, { createElement: () => '' });
      if (globalThis.__kermaCaught) {
        problems.push(`rendu "${label}" : ${globalThis.__kermaCaught.message}`);
      }
    } catch (e) {
      problems.push(`rendu "${label}" : ${e.message}`);
    }
  }
}

if (problems.length) {
  console.error('\n  ECHEC — ne pas envoyer\n');
  problems.forEach((p) => console.error('   · ' + p));
  console.error('');
  process.exit(1);
}
console.log('  OK — structure valide, rendu execute sans erreur');
process.exit(0);
