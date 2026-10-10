"""KERMA — le bouton de paiement ouvre vraiment l'enseigne, et dit ce que
Kerma ne sait pas faire.

    placeOrder = () => this.setState({ flow:'confirmed', verifyError:'' });

Corps identique a finishTrip. Le bouton porte "Open Ralphs Fresh Fare to
check out" avec une fleche de lien externe, et il n'ouvre rien : il saute a
l'ecran du ticket. C'est ce que Jean Noel a vu le 10 octobre.

DEUX CHOSES A REPARER, PAS UNE.

1. Le bouton n'ouvre pas l'enseigne. On lui donne une vraie adresse, prise
   dans une table explicite des trois services que le moteur connait. On ne
   fabrique pas d'URL a partir d'un identifiant : 'ralphs-o.com' n'existe
   pas. Une enseigne absente de la table n'ouvre rien et le bouton le dit.

2. Le bouton PROMET CE QUE KERMA NE SAIT PAS FAIRE. Il n'existe aucune
   integration de panier avec Walmart, Ralph's ou Target. Ouvrir leur site
   ne transfere rien : le panier y sera vide. "Open X to check out" laisse
   croire l'inverse, et c'est la meme faute que "You saved $47" sans ticket.

   Donc : la liste part dans le presse-papier avec _copyText (la copie
   synchrone posee en 52f5cc5), le bouton s'appelle "Open X", et une ligne
   sous le bouton dit exactement ce qui se passe. Le libelle et la phrase
   sont calcules, pas ecrits en dur, parce qu'ils changent selon qu'on a une
   adresse ou non.

L'ordre dans le gestionnaire compte : copie d'abord, ouverture ensuite. Les
deux doivent rester dans le geste de l'utilisateur, et un onglet qui prend
le focus peut faire echouer une selection de texte lancee apres lui.

A APPLIQUER APRES fix_winner.py.

    python3 fix_checkout.py index.html
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


# --- 1. l'ancien placeOrder disparait de la classe ---
tpl = swap(tpl,
           "  placeOrder = () => this.setState({ flow:'confirmed', verifyError:'' });\n",
           "",
           "ancien placeOrder")

# --- 2. adresse, libelle, phrase, calcules pres du gagnant ---
ANCHOR = "    const onMax = Math.max(...scoredOnline.map(x=>x.total));"
BLOCK = (
    "    // Les trois services que le moteur connait, et rien d'autre. Une\n"
    "    // adresse deduite d'un identifiant serait inventee.\n"
    "    const ONLINE_SITE = {\n"
    "      'walmartp': 'https://www.walmart.com',\n"
    "      'ralphs-o': 'https://www.ralphs.com',\n"
    "      'target-o': 'https://www.target.com'\n"
    "    };\n"
    "    const _onShort = String((onlineWinner && onlineWinner.name) || 'your store')\n"
    "      .split(' \\u00b7 ')[0];\n"
    "    const _onSite = ONLINE_SITE[(onlineWinner && onlineWinner.id) || ''] || '';\n"
    "    const _onCartText = ['Kerma \\u2014 cart for ' + _onShort, '']\n"
    "      .concat(onlineItems.map(o => '  ' + o.name + '  \\u00d7' + o.qty))\n"
    "      .join('\\n');\n"
    "    // Kerma n'a aucune integration de panier avec ces enseignes : ouvrir\n"
    "    // leur site ne transfere rien. Le bouton ne doit pas laisser croire\n"
    "    // le contraire, donc il le dit sous lui.\n"
    "    const placeOrderLabel = _onSite ? ('Open ' + _onShort)\n"
    "                                    : ('Copy my list for ' + _onShort);\n"
    "    const placeOrderNote = _onSite\n"
    "      ? ('I can\\u2019t fill their cart for you \\u2014 your list is copied.'\n"
    "         + ' Paste or re-add it on ' + _onShort + '.')\n"
    "      : ('I don\\u2019t have a link for ' + _onShort\n"
    "         + ' \\u2014 your list is copied. Open their site or app yourself.');\n"
)
tpl = swap(tpl, ANCHOR, BLOCK + ANCHOR, "ancre onMax")

# --- 3. le gestionnaire, dans la charge, ferme sur ces valeurs ---
tpl = swap(tpl,
           "      isOnline:screen==='online', orderOnline:this.orderOnline,"
           " placeOrder:this.placeOrder,\n",
           "      isOnline:screen==='online', orderOnline:this.orderOnline,\n"
           "      // Copie d'abord, ouverture ensuite : les deux doivent rester\n"
           "      // dans le geste, et l'onglet qui prend le focus ferait echouer\n"
           "      // une selection de texte lancee apres lui.\n"
           "      placeOrder: () => {\n"
           "        this._copyText(_onCartText);\n"
           "        if (_onSite) {\n"
           "          try { window.open(_onSite, '_blank', 'noopener'); }\n"
           "          catch(e) { this._trail('open site failed: ' + _onShort); }\n"
           "        }\n"
           "        this.setState({ flow:'confirmed', verifyError:'' });\n"
           "      },\n"
           "      placeOrderLabel, placeOrderNote,\n",
           "liaison de placeOrder dans la charge")

# --- 4. le bouton cesse de promettre un panier transfere ---
tpl = swap(tpl,
           '>Open {{ onlineWinnerShort }} to check out</span>',
           '>{{ placeOrderLabel }}</span>',
           "libelle du bouton de paiement")

tpl = swap(tpl,
           '<span style="font-size:12px;font-weight:500;color:#A6A19A">You pay on '
           '{{ onlineWinnerShort }}. Kerma never sees your card.</span>\n'
           '          </div>\n',
           '<span style="font-size:12px;font-weight:500;color:#A6A19A">You pay on '
           '{{ onlineWinnerShort }}. Kerma never sees your card.</span>\n'
           '          </div>\n'
           '          <div style="font-size:12.5px;font-weight:500;color:#6E6A65;'
           'text-align:center;letter-spacing:-.1px;line-height:1.45;margin-top:8px;'
           'padding:0 6px">{{ placeOrderNote }}</div>\n',
           "mention de paiement sous le bouton")


# --- garde-fous, en deltas ---
def ck(cond, msg):
    if not cond:
        die(msg)


ck(tpl.count("window.open(_onSite, '_blank', 'noopener')") == 1,
   "l'ouverture de l'enseigne n'est pas posee une fois")
ck(tpl.count("const ONLINE_SITE = {") == 1, "la table des adresses n'est pas posee une fois")
ck(tpl.count("https://www.walmart.com") == 1
   and tpl.count("https://www.ralphs.com") == 1
   and tpl.count("https://www.target.com") == 1,
   "les trois adresses ne sont pas posees une fois chacune")
ck(tpl.count("ONLINE_SITE[") == 1, "l'adresse n'est pas resolue une seule fois")
ck("placeOrder = () => this.setState" not in tpl, "l'ancien placeOrder subsiste")
ck(tpl.count("placeOrder: () => {") == 1, "le nouveau gestionnaire n'est pas pose une fois")
ck(tpl.count("this._copyText(_onCartText)") == 1,
   "la copie de la liste n'est pas posee une fois")
ck(tpl.index("this._copyText(_onCartText)") < tpl.index("window.open(_onSite"),
   "l'ouverture precede la copie")
ck(tpl.count("placeOrderLabel") == 3,
   "%d occurrences de placeOrderLabel au lieu de 3" % tpl.count("placeOrderLabel"))
ck(tpl.count("placeOrderNote") == 3,
   "%d occurrences de placeOrderNote au lieu de 3" % tpl.count("placeOrderNote"))
ck(tpl.count("{{ placeOrderLabel }}") == 1 and tpl.count("{{ placeOrderNote }}") == 1,
   "le libelle ou la phrase ne sont pas lies une seule fois")
ck("to check out" not in tpl, "l'ancien libelle du bouton subsiste")
ck(tpl.index("const onlineItems = items.map") < tpl.index("const _onCartText"),
   "le texte du panier est construit avant le panier")
ck(tpl.index("const placeOrderNote") < tpl.index("placeOrderLabel, placeOrderNote"),
   "le libelle est utilise avant d'etre calcule")
ck(tpl.count("_copyText") == orig.count("_copyText") + 1,
   "%d -> %d occurrences de _copyText (attendu +1)"
   % (orig.count("_copyText"), tpl.count("_copyText")))
ck(tpl.count("document.execCommand('copy')") == 1, "la copie synchrone a bouge")
for need in ["{{ onSubtotal }}", "{{ onTotal }}", "{{ onlineItems }}",
             "{{ onBasketMismatch }}", "Kerma never sees your card"]:
    ck(tpl.count(need) == orig.count(need), "%s a bouge" % need)
ck(tpl.count("{{ onlineWinnerShort }}") == orig.count("{{ onlineWinnerShort }}") - 1,
   "%d -> %d liaisons onlineWinnerShort (attendu -1 : le libelle du bouton)"
   % (orig.count("{{ onlineWinnerShort }}"), tpl.count("{{ onlineWinnerShort }}")))
ck(tpl.count("flow:'confirmed'") == orig.count("flow:'confirmed'"),
   "le nombre de routages vers l'ecran de confirmation a change")
ck(tpl.count("finishTrip = () =>") == 1, "finishTrip a bouge")
ck(tpl.count("<sc-if") == orig.count("<sc-if")
   and tpl.count("<sc-for") == orig.count("<sc-for")
   and tpl.count("<button") == orig.count("<button"),
   "la structure du balisage a change au-dela de la ligne ajoutee")
ck(tpl.count("<div") == orig.count("<div") + 1
   and tpl.count("</div>") == orig.count("</div>") + 1,
   "%d -> %d <div> (attendu +1)" % (orig.count("<div"), tpl.count("<div")))

lines[idx] = json.dumps(tpl).replace("/", "\\/") + "</script>\n"
open(path, "w", encoding="utf-8").write("".join(lines))

chk = next(l for l in open(path, encoding="utf-8").read().split("\n")
           if l.strip().startswith('"<!DOCTYPE'))
assert json.JSONDecoder().raw_decode(chk.strip())[0] == tpl, "ECHEC: aller-retour JSON"
n = open(path, encoding="utf-8").read().count("</script>")
assert n == 4, "ECHEC: %d </script> au lieu de 4" % n
print("OK - le bouton ouvre l'enseigne, copie la liste, et dit ce qu'il ne fait pas")
