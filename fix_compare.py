"""KERMA — l'ecran en ligne assume d'etre une comparaison, pas une caisse.

Jean Noel, 10 octobre : "ça m'a orienté vers le site de Ralph mais les
produits ne sont pas déverser. Si je dois utiliser Kerma et aller encore sur
le site du grocery refaire la sélection... ça ne rend pas Kerma intéressant."

Il a raison, et aucune ecriture de frontend ne le rend faux. Kerma n'a AUCUNE
integration de panier :

  - les lignes renvoyees par le backend portent `name`, `matched_name`,
    `price` - aucun UPC, aucun identifiant enseigne. Les cinq `upc` du
    fichier sont tous dans le bout mort du scan de code-barres. Sans
    identifiant, rien ne peut etre pousse nulle part ;
  - l'API Carts de Kroger, qui couvre Ralph's, est une API PARTENAIRE : un
    accord, pas une cle en libre-service ;
  - le lien panier de Walmart passe par un compte affilie et exige les
    identifiants article Walmart ;
  - Instacart accepte des noms, mais ses prix ne sont pas ceux du rayon :
    annoncer un prix Ralph's et renvoyer vers Instacart serait la
    comparaison inter-canaux au coeur du produit.

Tant que ces identifiants n'existent pas et qu'aucun accord n'est signe,
l'ecran ne doit pas ressembler a un passage en caisse. Un gros bouton vert
en bas de page est une promesse de transaction ; c'est la forme qui ment,
pas seulement le texte.

QUATRE CHANGEMENTS, AUCUN MOTEUR TOUCHE.

  1. "Order online" devient "Online prices". L'ecran dit ce qu'il fait.
  2. La phrase d'Astride annonce une comparaison, et non une revue avant
     paiement.
  3. "Your cart · mapped to X" devient "Your list · priced at X". Il n'y a
     pas de panier : il y a une liste tarifee.
  4. Le bouton vert pleine largeur devient un bouton secondaire. Il ouvre
     toujours l'enseigne et copie la liste - utile - mais il cesse d'etre
     l'aboutissement de l'ecran.

Ce qui ne change pas : les montants, le classement, le garde-fou de
coherence, la mention de paiement, et la phrase sous le bouton qui dit deja
que Kerma ne peut pas remplir leur panier.

    python3 fix_compare.py index.html
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


# --- 1. le titre de l'ecran ---
tpl = swap(tpl,
           'letter-spacing:-.1px">Order online</div>',
           'letter-spacing:-.1px">Online prices</div>',
           "titre de l'ecran en ligne")

# --- 2. la phrase d'Astride annonce une comparaison ---
tpl = swap(tpl,
           "I mapped your {{ countLabel }} to {{ onlineWinnerShort }}'s catalog."
           " Review, then check out on {{ onlineWinnerShort }}"
           " \u2014 Kerma never touches payment.",
           "I priced your {{ countLabel }} across the delivery services near you,"
           " and {{ onlineWinnerShort }} comes out cheapest. This is a price"
           " comparison \u2014 Kerma can\u2019t place the order for you.",
           "phrase d'Astride sur l'ecran en ligne")

# --- 3. il n'y a pas de panier, il y a une liste tarifee ---
tpl = swap(tpl,
           ">Your cart \u00b7 mapped to {{ onlineWinnerShort }}</div>",
           ">Your list \u00b7 priced at {{ onlineWinnerShort }}</div>",
           "intitule de la liste tarifee")

# --- 4. le bouton cesse d'etre l'aboutissement de l'ecran ---
tpl = swap(tpl,
           'style="width:100%;height:56px;border-radius:18px;background:#0B7A53;'
           'display:flex;align-items:center;justify-content:center;gap:9px;'
           'margin-top:18px;box-shadow:0 14px 30px -12px rgba(11,122,83,.6)">\n'
           '            <span style="font-size:17px;font-weight:700;color:#fff;'
           'letter-spacing:-.3px">{{ placeOrderLabel }}</span>',
           'style="width:100%;height:50px;border-radius:16px;background:#fff;'
           'border:1px solid rgba(17,17,16,.12);display:flex;align-items:center;'
           'justify-content:center;gap:9px;margin-top:18px">\n'
           '            <span style="font-size:15.5px;font-weight:700;color:#0B7A53;'
           'letter-spacing:-.25px">{{ placeOrderLabel }}</span>',
           "bouton d'ouverture de l'enseigne")

tpl = swap(tpl,
           '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M5 11 11 5M6 5h5v5"'
           ' stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
           ' fill="none"></path></svg>',
           '<svg width="15" height="15" viewBox="0 0 16 16"><path d="M5 11 11 5M6 5h5v5"'
           ' stroke="#0B7A53" stroke-width="2" stroke-linecap="round"'
           ' stroke-linejoin="round" fill="none"></path></svg>',
           "fleche du bouton d'ouverture")


# --- garde-fous, en deltas ---
def ck(cond, msg):
    if not cond:
        die(msg)


ck("Order online" not in tpl, "l'ancien titre subsiste")
ck(tpl.count("Online prices") == 1, "le nouveau titre n'est pas pose une fois")
ck("check out on" not in tpl, "la phrase de passage en caisse subsiste")
ck("Your cart \u00b7 mapped to" not in tpl, "l'ancien intitule de panier subsiste")
ck(tpl.count("Your list \u00b7 priced at") == 1,
   "le nouvel intitule n'est pas pose une fois")
ck(tpl.count("This is a price comparison") == 1,
   "la phrase de comparaison n'est pas posee une fois")
ck(tpl.count("rgba(11,122,83,.6)") == orig.count("rgba(11,122,83,.6)") - 1,
   "%d -> %d ombres vertes (attendu -1)"
   % (orig.count("rgba(11,122,83,.6)"), tpl.count("rgba(11,122,83,.6)")))
ck(tpl.count("height:56px;border-radius:18px;background:#0B7A53")
   == orig.count("height:56px;border-radius:18px;background:#0B7A53") - 1,
   "%d -> %d boutons verts pleine largeur (attendu -1 : celui de l'ecran en ligne)"
   % (orig.count("height:56px;border-radius:18px;background:#0B7A53"),
      tpl.count("height:56px;border-radius:18px;background:#0B7A53")))
ck(tpl.count('letter-spacing:-.25px">{{ placeOrderLabel }}') == 1,
   "le libelle n'est pas sur le bouton secondaire")
ck(tpl.count("{{ placeOrderLabel }}") == 1 and tpl.count("{{ placeOrderNote }}") == 1,
   "les liaisons du bouton ont bouge")
ck(tpl.count("onclick=\"{{ placeOrder }}\"") == 1, "le gestionnaire du bouton a bouge")
ck(tpl.count("window.open(_onSite") == 1, "l'ouverture de l'enseigne a bouge")
ck(tpl.count("this._copyText(_onCartText)") == 1, "la copie de la liste a bouge")
for need in ["{{ onSubtotal }}", "{{ onCoupons }}", "{{ onDelivery }}", "{{ onTotal }}",
             "{{ onlineItems }}", "{{ onBasketMismatch }}", "{{ onBasketMismatchText }}",
             "{{ onlineWinnerName }}", "Kerma never sees your card"]:
    ck(tpl.count(need) == orig.count(need), "%s a bouge" % need)
ck(tpl.count("(onlineWinner && onlineWinner.lines)") == 1,
   "la source unique du panier a bouge")
ck(tpl.count("const onlineWinner = (s.pickedOnlineId") == 1, "le gagnant a bouge")
ck(tpl.count("scoredOnline") == orig.count("scoredOnline"), "le classement a bouge")
ck(tpl.count("{{ onlineWinnerShort }}") == orig.count("{{ onlineWinnerShort }}") - 1,
   "%d -> %d liaisons onlineWinnerShort (attendu -1)"
   % (orig.count("{{ onlineWinnerShort }}"), tpl.count("{{ onlineWinnerShort }}")))
ck(tpl.count("<sc-if") == orig.count("<sc-if")
   and tpl.count("<sc-for") == orig.count("<sc-for")
   and tpl.count("<div") == orig.count("<div")
   and tpl.count("</div>") == orig.count("</div>")
   and tpl.count("<button") == orig.count("<button")
   and tpl.count("<svg") == orig.count("<svg"),
   "la structure du balisage a change alors que ce correctif ne fait que reecrire")

lines[idx] = json.dumps(tpl).replace("/", "\\/") + "</script>\n"
open(path, "w", encoding="utf-8").write("".join(lines))

chk = next(l for l in open(path, encoding="utf-8").read().split("\n")
           if l.strip().startswith('"<!DOCTYPE'))
assert json.JSONDecoder().raw_decode(chk.strip())[0] == tpl, "ECHEC: aller-retour JSON"
n = open(path, encoding="utf-8").read().count("</script>")
assert n == 4, "ECHEC: %d </script> au lieu de 4" % n
print("OK - l'ecran en ligne est une comparaison de prix, et le dit")
