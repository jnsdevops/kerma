"""KERMA — l'arbitrage voyage avec la liste, chacun selon ce qu'il est.

Jean Noel : "la substitution n'a lieu qu'apres optimisation, donc un produit
peut changer et celui qui recoit la share list n'est pas avise."

Exact, et le code va plus loin. _extractSubs lit les remplacements dans le
PANIER TARIFE (best.lines.filter(l => l.substituted)) ; ni l'acceptation ni
le refus n'ecrivent dans state.items. La liste n'apprend donc jamais le
remplacement. Resultat : partager apres optimisation envoyait exactement le
meme message qu'avant, aux deux lignes du magasin pres. Deplacer le bouton
n'aurait rien repare - il fallait mettre l'arbitrage DANS le message.

Trois sortes d'arbitrage, trois statuts differents, et c'est la regle
"le besoin voyage, la decision ne voyage pas" appliquee un cran plus bas :

  1. UN REFUS APPARTIENT AU FOYER. "Pas une autre marque de cafe" vaut a
     Ralph's comme a Walmart Santa Ana. Il part en dur, au meme rang qu'une
     allergie. Il est construit depuis les refus enregistres et non depuis
     la liste des remplacements, parce qu'un refus declenche un replan : le
     remplacement disparait de cette liste, le refus doit survivre.
  2. UN REMPLACEMENT ACCEPTE APPARTIENT AU MAGASIN. `offered` a ete retenu
     parce que `need` manquait LA-BAS - l'entree porte son `store`. Il part
     comme indication nommee avec son enseigne, jamais comme ordre.
  3. UN FORMAT CHOISI APPARTIENT AU RAYON. La quantite est au foyer, la
     taille du conditionnement est au magasin : on dit laquelle etait prevue
     et qu'une autre convient.

Et un defaut decouvert en chemin : loadOrderPolicy, qui remplit orderPlan
(les consignes par article - "ne pas remplacer le lait, allergie"), n'avait
qu'UN SEUL appelant dans tout le fichier : orderOnline. Sur le chemin
magasin ces consignes n'etaient jamais demandees, donc le bloc NOTES du
message partage n'a jamais pu s'afficher pour une course physique. Or une
consigne de ce type est un fait du foyer, pas un sous-produit de la commande
en ligne. Elle est desormais chargee sur changement de liste, en reutilisant
la temporisation de 900 ms de _queueSave - pas un appel par frappe.

Avant optimisation, subs, subRefused et packs sont vides : le message est
identique a aujourd'hui. La section n'apparait que lorsqu'il y a quelque
chose a dire. Le bouton de l'accueil reste donc legitime.

    python3 fix_arbitrage.py index.html
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


# --- 1. les consignes par article ne dependent plus du chemin en ligne ---
tpl = swap(tpl,
           "  _queueSave = () => {\n"
           "    clearTimeout(this._saveTimer);\n"
           "    this._saveTimer = setTimeout(() => this.saveList(), 900);\n"
           "  };\n",
           "  _queueSave = () => {\n"
           "    clearTimeout(this._saveTimer);\n"
           "    // Les consignes par article sont un fait du foyer, pas un\n"
           "    // sous-produit de la commande en ligne : elles suivent la liste,\n"
           "    // sur la meme pause de frappe que l'enregistrement.\n"
           "    this._saveTimer = setTimeout(() => {\n"
           "      this.saveList();\n"
           "      this.loadOrderPolicy();\n"
           "    }, 900);\n"
           "  };\n",
           "temporisation _queueSave")

tpl = swap(tpl,
           "                   category: (i.intent && i.intent.category) || '' }))\n"
           "      .filter(x => x.name);\n"
           "    if (!items.length) return;\n",
           "                   category: (i.intent && i.intent.category) || '' }))\n"
           "      .filter(x => x.name);\n"
           "    if (!items.length) { this.setState({ orderPlan: [] }); return; }\n",
           "sortie anticipee de loadOrderPolicy")

# --- 2. l'arbitrage entre dans le message partage ---
ANCHOR = (
    "      if (this._tripStore) {\n"
    "        L.push('I checked prices at ' + this._tripStore + '.');\n"
)
BLOCK = (
    "      // Trois sortes d'arbitrage, trois statuts. Un refus appartient au\n"
    "      // foyer et vaut partout. Un remplacement appartient au magasin ou il\n"
    "      // a eu lieu : il part nomme avec son enseigne, jamais comme un ordre.\n"
    "      // Un format appartient au rayon : la quantite voyage, la taille non.\n"
    "      const _subLines = [];\n"
    "      const _ref = s.subRefused || {};\n"
    "      // Construit depuis les refus enregistres, et non depuis la liste des\n"
    "      // remplacements : un refus declenche un replan, le remplacement\n"
    "      // disparait de cette liste, le refus doit survivre.\n"
    "      Object.keys(_ref).forEach(need => {\n"
    "        const at = _ref[need];\n"
    "        _subLines.push('  \\u2022 ' + need + ' \\u2014 do NOT swap the '\n"
    "          + (at ? at : 'product') + '. Leave it and tell me.');\n"
    "      });\n"
    "      (s.subs || []).filter(x => x && x.need && !_ref[x.need]).slice(0, 8)\n"
    "        .forEach(x => {\n"
    "          const where = x.store ? (' at ' + x.store) : '';\n"
    "          _subLines.push('  \\u2022 ' + x.need + ' \\u2014 ' + (x.offered\n"
    "            ? ('I had planned ' + x.offered + where\n"
    "               + '. Anywhere else, the closest match is fine.')\n"
    "            : ('may be hard to find' + where\n"
    "               + '. The closest match is fine.')));\n"
    "        });\n"
    "      (s.packs || []).filter(p => p && p.need && p.chosenSize && !_ref[p.need])\n"
    "        .slice(0, 6).forEach(p => {\n"
    "          _subLines.push('  \\u2022 ' + p.need + ' \\u2014 I had planned the '\n"
    "            + p.chosenSize + '. Another size is fine.');\n"
    "        });\n"
    "      if (_subLines.length) {\n"
    "        L.push('IF SOMETHING IS MISSING');\n"
    "        _subLines.forEach(x => L.push(x));\n"
    "        L.push('');\n"
    "      }\n"
)
tpl = swap(tpl, ANCHOR, BLOCK + ANCHOR, "contexte du magasin dans _shareMsg")


# --- garde-fous, en deltas ---
def ck(cond, msg):
    if not cond:
        die(msg)


ck(tpl.count("loadOrderPolicy") == orig.count("loadOrderPolicy") + 1,
   "%d -> %d occurrences de loadOrderPolicy (attendu +1)"
   % (orig.count("loadOrderPolicy"), tpl.count("loadOrderPolicy")))
ck(tpl.count("this.loadOrderPolicy()") == 2,
   "%d appels a loadOrderPolicy au lieu de 2" % tpl.count("this.loadOrderPolicy()"))
ck(tpl.count("orderOnline = (saved) =>") == 1, "orderOnline a bouge")
ck(tpl.count("this.saveList()") == orig.count("this.saveList()"),
   "le nombre d'appels a saveList a change")
ck(tpl.count("this._saveTimer = setTimeout") == 1,
   "la temporisation n'est pas posee une fois")
ck(tpl.count("setState({ orderPlan: [] })") == 1,
   "le vidage de orderPlan n'est pas pose une fois")
ck(tpl.count("orderPlan: d.plan || []") == 1, "l'ecriture de orderPlan a bouge")
ck(tpl.count("IF SOMETHING IS MISSING") == 1,
   "la section d'arbitrage n'est pas posee une fois")
ck(tpl.count("_subLines") == 6,
   "%d occurrences de _subLines au lieu de 6" % tpl.count("_subLines"))
ck(tpl.count("const _ref = s.subRefused || {}") == 1,
   "les refus ne sont pas lus une fois")
ck(tpl.count("do NOT swap the") == 1, "la formule de refus n'est pas posee une fois")
ck(tpl.count("I had planned ") == 2,
   "%d formules 'I had planned' au lieu de 2" % tpl.count("I had planned "))
ck(tpl.count("the closest match is fine") == 1
   and tpl.count("The closest match is fine") == 1,
   "les deux formules de repli ne sont pas posees une fois chacune")
ck(tpl.count("Another size is fine") == 1, "la formule de format n'est pas posee une fois")
ck(tpl.count("MUST AVOID") == 1 and tpl.count("DIET \\u2014") == 1,
   "les contraintes du foyer ont bouge")
ck(tpl.count("L.push('NOTES')") == 1, "le bloc NOTES a bouge")
ck(tpl.count("Please keep the receipt.") == 1, "la cloture du message a bouge")
ck(tpl.count("I checked prices at ") == 1, "le contexte du magasin a bouge")
ck(tpl.index("IF SOMETHING IS MISSING") < tpl.index("I checked prices at "),
   "la section d'arbitrage doit preceder le contexte du magasin")
ck(tpl.index("L.push('NOTES')") < tpl.index("IF SOMETHING IS MISSING"),
   "le bloc NOTES doit preceder la section d'arbitrage")
for need in ["_extractSubs", "_extractPacks", "refuseSub", "refusePack",
             "confirmSubs", "_replanAfterCorrection", "substitutions/decide"]:
    ck(tpl.count(need) == orig.count(need), "%s a bouge" % need)
ck(tpl.count("subRefused") == orig.count("subRefused") + 1,
   "%d -> %d occurrences de subRefused (attendu +1)"
   % (orig.count("subRefused"), tpl.count("subRefused")))
ck(tpl.count("<sc-if") == orig.count("<sc-if")
   and tpl.count("<sc-for") == orig.count("<sc-for")
   and tpl.count("<div") == orig.count("<div")
   and tpl.count("<button") == orig.count("<button"),
   "le balisage a change alors que ce correctif ne le touche pas")
ck(tpl.count("{{ shareListText }}") == 1 and tpl.count("{{ openShare }}") == 2,
   "les liaisons du partage ont bouge")

lines[idx] = json.dumps(tpl).replace("/", "\\/") + "</script>\n"
open(path, "w", encoding="utf-8").write("".join(lines))

chk = next(l for l in open(path, encoding="utf-8").read().split("\n")
           if l.strip().startswith('"<!DOCTYPE'))
assert json.JSONDecoder().raw_decode(chk.strip())[0] == tpl, "ECHEC: aller-retour JSON"
n = open(path, encoding="utf-8").read().count("</script>")
assert n == 4, "ECHEC: %d </script> au lieu de 4" % n
print("OK - l'arbitrage voyage : refus en dur, remplacements nommes avec leur enseigne")
