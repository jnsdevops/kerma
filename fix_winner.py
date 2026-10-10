"""KERMA — l'ecran de commande en ligne lisait DEUX enseignes a la fois.

Capture du 10 octobre, ecran "Order online" :

  en-tete        Ralphs Fresh Fare
  Items subtotal 58,96 $
  douze lignes   Great Value Organic Chili Powder, Marketside Shredded
                 Iceberg Lettuce, Great Value Taco Shells...  soit 36,78 $
  bouton         "Open Ralphs Fresh Fare to check out"

Great Value et Marketside sont des marques propres WALMART. Elles n'existent
pas chez un Kroger. Et 58,96 n'est pas la somme des lignes affichees.

Une seule cause pour les deux. L'ecran lit deux objets differents :

  const onlineWinner = (s.pickedOnlineId
    && scoredOnline.filter(x => x.id === s.pickedOnlineId)[0])
    || scoredOnline[0];                       <- choix utilisateur, sinon tri

  const _onWin = (s.onlineComparison || [])
    .filter(x => x.priced !== false)[0];      <- PREMIER de la reponse API

`onlineWinner` donne le nom, le sous-total, les coupons, la livraison, le
total et le libelle du bouton. `_onWin` donne les lignes de produits. Des que
l'utilisateur choisit un service qui n'est pas le premier renvoye par l'API -
ou que le tri par total reordonne - l'ecran affiche le panier d'une enseigne
sous le nom et le montant d'une autre.

C'est la comparaison inter-canaux, a l'interieur d'une seule page, sans que
rien ne la signale.

CORRECTION. `decorate` fait `{ ...st, c, total, eta }` : `lines` survit donc
sur `onlineWinner`. Le bloc du panier est deplace apres la designation du
gagnant et lit `onlineWinner.lines`. Une seule source, par construction.

Et un garde-fou, parce que la coherence ne doit pas dependre de ma
vigilance : `onBasketMismatch` compare la somme des lignes affichees au
sous-total annonce. Au-dela d'un dollar d'ecart, l'ecran le dit plutot que
de laisser croire au montant. L'avertissement est lie dans le balisage, juste
au-dessus du sous-total qu'il met en doute : une valeur calculee et non liee
est precisement le defaut qu'on a deja trouve cinq fois dans ce fichier.

    python3 fix_winner.py index.html
Rien n'est ecrit si une seule ancre manque.
"""
import json
import sys

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


# --- 1. le bloc du panier quitte sa place, trop en amont du gagnant ---
OLD_BLOCK = (
    "    // \u2500\u2500 online cart + in-store extras \u2500\u2500\n"
    "    // Le meme detail que l'ecran magasin : ces lignes cherchaient le prix\n"
    "    // dans i.options, vide depuis qu'on a retire les donnees fabriquees. Le\n"
    "    // sous-total etait calcule, les lignes affichaient des tirets.\n"
    "    const _onWin = (s.onlineComparison || []).filter(x => x.priced !== false)[0];\n"
    "    const _onByName = {};\n"
    "    ((_onWin && _onWin.lines) || []).forEach(l => {\n"
    "      if (l && l.name) _onByName[String(l.name).toLowerCase().trim()] = l;\n"
    "    });\n"
    "    const onlineItems = items.map(i => {\n"
    "      const l = _onByName[String(i.name||'').toLowerCase().trim()];\n"
    "      const o = (i.options && i.chosen>=0) ? i.options[i.chosen] : null;\n"
    "      const q = Number(i.qty) || 1;\n"
    "      return { name:i.name, glyph:this.gl(i.name), qty:i.qty,\n"
    "        sub: (l && l.matched_name) ? l.matched_name : i.aisle,\n"
    "        price: (l && typeof l.price === 'number')\n"
    "          ? ('$' + (l.price * q).toFixed(2))\n"
    "          : ((o && o.price && o.source) ? o.price : '\\u2014') };\n"
    "    });\n"
)
tpl = swap(tpl, OLD_BLOCK, "", "ancien bloc du panier en ligne")

# --- 2. il revient juste apres la designation du gagnant, et le lit ---
ANCHOR = "    const onMax = Math.max(...scoredOnline.map(x=>x.total));"
NEW_BLOCK = (
    "    // \u2500\u2500 online cart \u2500\u2500\n"
    "    // Ce bloc vivait 27 000 caracteres plus haut, avant meme que le\n"
    "    // gagnant existe, et lisait donc le PREMIER service renvoye par\n"
    "    // l'API au lieu de celui affiche. Un panier Walmart s'est retrouve\n"
    "    // sous un en-tete et un sous-total Ralphs. Une seule source\n"
    "    // desormais, par construction : decorate fait { ...st }, donc\n"
    "    // onlineWinner porte ses propres lignes.\n"
    "    const _onByName = {};\n"
    "    ((onlineWinner && onlineWinner.lines) || []).forEach(l => {\n"
    "      if (l && l.name) _onByName[String(l.name).toLowerCase().trim()] = l;\n"
    "    });\n"
    "    let _onLinesSum = 0, _onLinesPriced = 0;\n"
    "    const onlineItems = items.map(i => {\n"
    "      const l = _onByName[String(i.name||'').toLowerCase().trim()];\n"
    "      const o = (i.options && i.chosen>=0) ? i.options[i.chosen] : null;\n"
    "      const q = Number(i.qty) || 1;\n"
    "      if (l && typeof l.price === 'number') {\n"
    "        _onLinesSum += l.price * q; _onLinesPriced++;\n"
    "      }\n"
    "      return { name:i.name, glyph:this.gl(i.name), qty:i.qty,\n"
    "        sub: (l && l.matched_name) ? l.matched_name : i.aisle,\n"
    "        price: (l && typeof l.price === 'number')\n"
    "          ? ('$' + (l.price * q).toFixed(2))\n"
    "          : ((o && o.price && o.source) ? o.price : '\\u2014') };\n"
    "    });\n"
    "    // Un sous-total qui ne vaut pas la somme de ses lignes est un\n"
    "    // montant que personne ne peut verifier. On ne le rattrape pas en\n"
    "    // douce : on le constate, et l'ecran le dira.\n"
    "    const _onSubNum = Number((onlineWinner && onlineWinner.basket) || 0);\n"
    "    const onBasketMismatch = (_onLinesPriced > 0 && _onSubNum > 0)\n"
    "      && Math.abs(_onLinesSum - _onSubNum) > 1;\n"
    "    const onBasketMismatchText = onBasketMismatch\n"
    "      ? ('These lines add up to $' + _onLinesSum.toFixed(2)\n"
    "         + ', not $' + _onSubNum.toFixed(2)\n"
    "         + '. I won\\u2019t vouch for the total until they agree.')\n"
    "      : '';\n"
)
tpl = swap(tpl, ANCHOR, NEW_BLOCK + ANCHOR, "ancre onMax")

# --- 3. les deux valeurs entrent dans la charge ---
tpl = swap(tpl,
           "      onSubtotal: '$' + Number((onlineWinner.basket)||0).toFixed(2),\n",
           "      onSubtotal: '$' + Number((onlineWinner.basket)||0).toFixed(2),\n"
           "      onBasketMismatch, onBasketMismatchText,\n",
           "sous-total en ligne dans la charge")

# --- 4. et l'ecran le dit ---
TOT_ANCHOR = (
    '<div style="background:#fff;border-radius:18px;padding:16px 18px;'
    'margin-top:12px;box-shadow:0 1px 3px rgba(17,17,16,.05)">\n'
    '            <div style="display:flex;justify-content:space-between;'
    'margin-bottom:10px"><span style="font-size:14.5px;font-weight:500;'
    'color:#4A463F">Items subtotal</span>'
)
WARN = (
    '<sc-if value="{{ onBasketMismatch }}" hint-placeholder-val="{{ false }}">\n'
    '          <div style="display:flex;gap:10px;background:#FBF1D8;'
    'border-radius:14px;padding:13px 15px;margin-top:12px">\n'
    '            <span style="color:#6B5A2E;font-size:14px;line-height:1.35">!</span>\n'
    '            <span style="font-size:13.5px;font-weight:500;color:#6B5A2E;'
    'letter-spacing:-.1px;line-height:1.45">{{ onBasketMismatchText }}</span>\n'
    '          </div>\n'
    '          </sc-if>\n'
    '          '
)
tpl = swap(tpl, TOT_ANCHOR, WARN + TOT_ANCHOR, "bloc des totaux en ligne")


# --- garde-fous, en deltas ---
def ck(cond, msg):
    if not cond:
        die(msg)


ck(tpl.count("_onWin") == 0, "%d references a _onWin subsistent" % tpl.count("_onWin"))
ck("(s.onlineComparison || []).filter(x => x.priced !== false)[0]" not in tpl,
   "l'ancienne selection du panier subsiste")
ck(tpl.count("(onlineWinner && onlineWinner.lines)") == 1,
   "le panier ne lit pas onlineWinner.lines une seule fois")
ck(tpl.count("const onlineItems = items.map") == 1,
   "%d constructions de onlineItems au lieu d'une"
   % tpl.count("const onlineItems = items.map"))
ck(tpl.count("const _onByName = {}") == 1, "la table par nom n'est pas posee une fois")
ck(tpl.index("const onlineWinner = (s.pickedOnlineId")
   < tpl.index("const onlineItems = items.map"),
   "onlineItems est toujours calcule avant onlineWinner")
ck(tpl.index("const onlineItems = items.map")
   < tpl.index("onlineItems, tripSavedLabel"),
   "onlineItems est calcule apres son usage dans la charge")
ck(tpl.count("const tripSavedLabel") == 1, "tripSavedLabel a bouge")
ck(tpl.index("const tripSavedLabel") < tpl.index("onlineItems, tripSavedLabel"),
   "tripSavedLabel est calcule apres son usage")
ck(tpl.count("onBasketMismatch") == 7,
   "%d occurrences de onBasketMismatch au lieu de 7" % tpl.count("onBasketMismatch"))
ck(tpl.count("onBasketMismatchText") == 3,
   "%d occurrences de onBasketMismatchText au lieu de 3"
   % tpl.count("onBasketMismatchText"))
ck(tpl.count("_onLinesSum") == 4,
   "%d occurrences de _onLinesSum au lieu de 4" % tpl.count("_onLinesSum"))
ck(tpl.count("_onLinesPriced") == 3,
   "%d occurrences de _onLinesPriced au lieu de 3" % tpl.count("_onLinesPriced"))
for need in ["onSubtotal:", "onCoupons:", "onDelivery:", "onTotal:",
             "onlineWinnerShort:", "onlineWinnerName:", "{{ onlineItems }}",
             "{{ onSubtotal }}", "{{ onTotal }}"]:
    ck(tpl.count(need) == orig.count(need), "%s a bouge" % need)
ck(tpl.count("const onlineWinner = (s.pickedOnlineId") == 1,
   "la designation du gagnant a bouge")
ck(tpl.count("scoredOnline") == orig.count("scoredOnline"), "le classement a bouge")
ck(tpl.count("ONLINE_DEF") == orig.count("ONLINE_DEF"), "ONLINE_DEF a bouge")
ck(tpl.count("priced !== false") == orig.count("priced !== false") - 1,
   "%d -> %d filtres priced (attendu -1 : celui du panier)"
   % (orig.count("priced !== false"), tpl.count("priced !== false")))
ck(tpl.count("{{ onBasketMismatch }}") == 1 and tpl.count("{{ onBasketMismatchText }}") == 1,
   "l'avertissement n'est pas lie une seule fois")
ck(tpl.count("<sc-if") == orig.count("<sc-if") + 1
   and tpl.count("</sc-if>") == orig.count("</sc-if>") + 1,
   "%d -> %d <sc-if> (attendu +1)" % (orig.count("<sc-if"), tpl.count("<sc-if")))
ck(tpl.count("<div") == orig.count("<div") + 1
   and tpl.count("</div>") == orig.count("</div>") + 1,
   "%d -> %d <div> (attendu +1)" % (orig.count("<div"), tpl.count("<div")))
ck(tpl.count("<sc-for") == orig.count("<sc-for")
   and tpl.count("<button") == orig.count("<button"),
   "le balisage a change au-dela de l'avertissement")
ck(tpl.index("{{ onBasketMismatchText }}") < tpl.index("{{ onSubtotal }}"),
   "l'avertissement doit preceder le sous-total qu'il met en doute")

lines[idx] = json.dumps(tpl).replace("/", "\\/") + "</script>\n"
open(path, "w", encoding="utf-8").write("".join(lines))

chk = next(l for l in open(path, encoding="utf-8").read().split("\n")
           if l.strip().startswith('"<!DOCTYPE'))
assert json.JSONDecoder().raw_decode(chk.strip())[0] == tpl, "ECHEC: aller-retour JSON"
n = open(path, encoding="utf-8").read().count("</script>")
assert n == 4, "ECHEC: %d </script> au lieu de 4" % n
print("OK - le panier en ligne et son total viennent de la meme enseigne")
