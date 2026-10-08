"""KERMA — les quatre correctifs en une passe, sur 5d5fc12."""
import json, re, sys

path = sys.argv[1] if len(sys.argv) > 1 else "index.html"
lines = open(path, encoding="utf-8").readlines()
idx = next(i for i, l in enumerate(lines) if l.strip().startswith('"<!DOCTYPE'))
tpl, _ = json.JSONDecoder().raw_decode(lines[idx].strip())
orig = tpl

def die(msg):
    sys.exit("ERREUR: " + msg + " - RIEN MODIFIE")

def swap(txt, old, new, label):
    if txt.count(old) != 1:
        die("%s trouve %d fois" % (label, txt.count(old)))
    return txt.replace(old, new, 1)

CHIPS_MARKUP = (
    '<div style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;'
    'padding:2px 0 14px;margin:0 -20px;padding-left:20px;padding-right:20px;scrollbar-width:none">\n'
    '              <sc-for list="{{ catChips }}" as="cat" hint-placeholder-count="7">\n'
    '                <button onclick="{{ cat.pick }}" style="flex:none;display:flex;'
    'align-items:center;gap:6px;background:#fff;border-radius:12px;padding:9px 13px;'
    'box-shadow:0 1px 2px rgba(17,17,16,.05)"><span style="font-size:16px">{{ cat.emoji }}</span>'
    '<span style="font-size:13.5px;font-weight:600;color:#111110;letter-spacing:-.2px;'
    'white-space:nowrap">{{ cat.label }}</span></button>\n'
    '              </sc-for>\n            </div>\n            '
)
CHIPS_PAYLOAD = (
    "      catChips: [\n"
    "        {emoji:'\U0001F966', label:'Produce', pick:()=>this.pickCategory('produce')},\n"
    "        {emoji:'\U0001F95B', label:'Dairy', pick:()=>this.pickCategory('dairy')},\n"
    "        {emoji:'\U0001F969', label:'Meat', pick:()=>this.pickCategory('meat')},\n"
    "        {emoji:'\U0001F35E', label:'Bakery', pick:()=>this.pickCategory('bread')},\n"
    "        {emoji:'\U0001F9CA', label:'Frozen', pick:()=>this.pickCategory('frozen')},\n"
    "        {emoji:'\U0001F9F4', label:'Household', pick:()=>this.pickCategory('paper towels')},\n"
    "        {emoji:'\U0001F37C', label:'Baby', pick:()=>this.pickCategory('baby food')},\n"
    "      ],\n"
)
CHIPS_METHOD = "\n  pickCategory(term){ this.setState({ typeInput:term }); this.addTyped(); }"
for lbl, frag in (("balisage pastilles", CHIPS_MARKUP), ("tableau catChips", CHIPS_PAYLOAD),
                  ("methode pickCategory", CHIPS_METHOD)):
    tpl = swap(tpl, frag, "", lbl)

tpl = swap(tpl,
    "  openAdd(method){ this.setState({ flow:'add', addMethod: method, scanState:'idle', "
    "menuState:'idle', upcState:'idle', detected:[], typeInput:'', menuText:'' }); }",
    "  openAdd(method){ this.setState({ flow:'add', addMethod: method, scanState:'idle', "
    "menuState:'idle', upcState:'idle', detected:[], typeInput:'', menuText:'', justAdded:[] }); }",
    "openAdd")
tpl = swap(tpl,
    "  addTyped = () => {\n    const v = this.state.typeInput.trim(); if (!v) return;\n"
    "    this.setState(s => ({\n      items: this._mergeItems([...s.items, this.build(v, 1, true)]),\n"
    "      typeInput: '', flow: null,\n    }), () => { this.checkAvailability(); this._queueSave(); });\n  };",
    "  // Le panneau ne se referme plus : une liste se fait d'un trait, et la\n"
    "  // rangee ADDED confirme chaque entree.\n"
    "  addTyped = () => {\n    const v = this.state.typeInput.trim(); if (!v) return;\n"
    "    this.setState(s => ({\n      items: this._mergeItems([...s.items, this.build(v, 1, true)]),\n"
    "      typeInput: '',\n"
    "      justAdded: [v, ...(s.justAdded||[]).filter(x => x.toLowerCase() !== v.toLowerCase())].slice(0, 5),\n"
    "    }), () => { this.checkAvailability(); this._queueSave(); });\n  };",
    "addTyped")
tpl = swap(tpl, "      hasTypeInput: !!(s.typeInput||'').trim(),",
    "      hasTypeInput: !!(s.typeInput||'').trim(),\n"
    "      hasJustAdded: (s.justAdded||[]).length > 0,\n"
    "      justAddedList: (s.justAdded||[]).map(n => ({ name:n })),", "hasTypeInput")
COMMON = ('<div style="font-size:12.5px;font-weight:700;color:#A6A19A;letter-spacing:.3px;'
          'text-transform:uppercase;margin:6px 2px 10px">Common items</div>')
tpl = swap(tpl, COMMON,
    '<sc-if value="{{ hasJustAdded }}" hint-placeholder-val="{{ false }}">\n'
    '              <div style="display:flex;align-items:center;justify-content:space-between;'
    'margin:2px 2px 9px">\n'
    '                <span style="font-size:12.5px;font-weight:700;color:#0B7A53;'
    'letter-spacing:.3px;text-transform:uppercase">Added to your list</span>\n'
    '                <button onclick="{{ closeFlow }}" style="background:#0B7A53;color:#fff;'
    'border-radius:10px;padding:7px 15px;font-size:13px;font-weight:700;'
    'letter-spacing:-.1px">Done</button>\n'
    '              </div>\n'
    '              <div style="display:flex;flex-wrap:wrap;gap:7px;margin:0 2px 18px">\n'
    '                <sc-for list="{{ justAddedList }}" as="j" hint-placeholder-count="2">\n'
    '                  <span style="background:#EAF5F0;border-radius:11px;padding:6px 11px;'
    'font-size:13.5px;font-weight:600;color:#0B7A53;letter-spacing:-.2px">{{ j.name }}</span>\n'
    '                </sc-for>\n              </div>\n            </sc-if>\n            ' + COMMON,
    "en-tete Common items")

if "hasVerifyError: !!s.verifyError," not in tpl or "verifyErrorText: s.verifyError || ''," not in tpl:
    die("hasVerifyError / verifyErrorText absents du rendu")
BTN = '<button onclick="{{ verifyReceipt }}"'
tpl = swap(tpl, BTN,
    '<sc-if value="{{ hasVerifyError }}" hint-placeholder-val="{{ false }}">\n'
    '          <div style="display:flex;align-items:flex-start;gap:9px;'
    'background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.32);'
    'border-radius:14px;padding:12px 15px;margin-top:14px;max-width:300px;text-align:left">\n'
    '            <svg width="16" height="16" viewBox="0 0 18 18" style="flex:none;margin-top:1px">'
    '<circle cx="9" cy="9" r="7" fill="none" stroke="#F0CE84" stroke-width="1.5"></circle>'
    '<path d="M9 5.4v4.3M9 12.3v.1" stroke="#F0CE84" stroke-width="1.7" '
    'stroke-linecap="round"></path></svg>\n'
    '            <span style="font-size:13.5px;font-weight:600;color:#F7E3B4;'
    'letter-spacing:-.1px;line-height:1.45">{{ verifyErrorText }}</span>\n'
    '          </div>\n        </sc-if>\n        ' + BTN, "bouton Verify with receipt")
tpl = swap(tpl, "  finishTrip = () => this.setState({ flow:'confirmed' });",
           "  finishTrip = () => this.setState({ flow:'confirmed', verifyError:'' });", "finishTrip")
tpl = swap(tpl, "  placeOrder = () => this.setState({ flow:'confirmed' });",
           "  placeOrder = () => this.setState({ flow:'confirmed', verifyError:'' });", "placeOrder")

if tpl.count("_fetchT = (url, opts)") != 1:
    die("le helper _fetchT est absent")
tpl = swap(tpl, "const resp = await fetch(this._SB_URL+endpoint, {",
           "const resp = await this._fetchT(this._SB_URL+endpoint, {", "fetch auth")
tpl = swap(tpl,
    "    } catch(e) { this.setState({ authError:'Connection issue \u2014 try again.',"
    " authLoading:false }); }",
    "    } catch(e) { this.setState({ authError: (e && e.name === 'AbortError')\n"
    "        ? 'That took too long. Check your connection and try again.'\n"
    "        : 'Connection issue \u2014 try again.', authLoading:false }); }", "catch auth")

def ck(cond, msg):
    if not cond: die(msg)

ck(tpl.count("catChips") == 0, "des catChips subsistent")
ck(tpl.count("pickCategory") == 0, "des pickCategory subsistent")
ck(tpl.count("quickAdd") == orig.count("quickAdd"), "quickAdd a ete touche")
ck(tpl.count("Common items") == 1 and tpl.count('list="{{ commonItems }}"') == 1,
   "la grille Common items a ete affectee")
ck("typeInput: '', flow: null," not in tpl, "addTyped ferme encore le panneau")
ck(tpl.count("flow: null") == orig.count("flow: null") - 1, "flow: null n'a pas baisse de 1")
ck(tpl.count("{{ hasJustAdded }}") == 1 and tpl.count("{{ justAddedList }}") == 1,
   "les liaisons ADDED ne sont pas posees une fois chacune")
ck(tpl.count("{{ hasVerifyError }}") == 1 and tpl.count("{{ verifyErrorText }}") == 1,
   "les liaisons d'erreur de ticket ne sont pas posees une fois chacune")
ck(tpl.count("{{ closeFlow }}") == orig.count("{{ closeFlow }}") + 1, "closeFlow n'a pas augmente de 1")
ck(tpl.count("verifyError:''") == orig.count("verifyError:''") + 2,
   "les remises a zero de verifyError n'ont pas augmente de 2")
ck(tpl.count("{{ verifyReceipt }}") == 1 and tpl.count("{{ skipVerify }}") == 1,
   "une sortie de l'ecran de confirmation a disparu")
ck(tpl.count("{{ hasScanError }}") == orig.count("{{ hasScanError }}"), "le panneau Receipt a ete affecte")
ck(tpl.count("return fetch(url, Object.assign({}, opts, { signal: c.signal }))") == 1,
   "le fetch interne du helper n'est plus unique")
ck(len(re.findall(r"(?<!_fetchT\()(?<!\w)fetch\(", tpl)) - 1 == 0, "un fetch nu subsiste hors du helper")
ck(tpl.count("this._fetchT(") == orig.count("this._fetchT(") + 1, "les appels via _fetchT n'ont pas augmente de 1")
ck(tpl.count("authLoading:false") == orig.count("authLoading:false"), "une remise a zero de authLoading a disparu")
ck(tpl.count("<sc-if") == orig.count("<sc-if") + 2 and tpl.count("</sc-if>") == orig.count("</sc-if>") + 2,
   "les balises sc-if ne sont plus equilibrees")
ck(tpl.count("<sc-for") == orig.count("<sc-for") and tpl.count("</sc-for>") == orig.count("</sc-for>"),
   "les balises sc-for ne sont plus equilibrees")
ck(tpl.count("overflow-x:auto") == orig.count("overflow-x:auto") - 1, "overflow-x:auto n'a pas baisse de 1")

lines[idx] = json.dumps(tpl).replace("/", "\\/") + "</script>\n"
open(path, "w", encoding="utf-8").write("".join(lines))

chk = next(l for l in open(path, encoding="utf-8").read().split("\n")
           if l.strip().startswith('"<!DOCTYPE'))
assert json.JSONDecoder().raw_decode(chk.strip())[0] == tpl, "ECHEC: aller-retour JSON"
n = open(path, encoding="utf-8").read().count("</script>")
assert n == 4, "ECHEC: %d </script> au lieu de 4" % n
print("OK - les quatre correctifs sont appliques")
