"""KERMA — la carte Privacy dit ce que le code fait."""
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


PARA_OLD = ('Receipts and routes are processed <b style="font-weight:700;color:#111110">'
            'on your device</b> when possible. I never sell your data to retailers '
            '\u2014 that\u2019s what keeps me neutral.')
PARA_NEW = ('Your receipt photo and your location are sent to <b style="font-weight:700;'
            'color:#111110">Kerma\u2019s server</b> \u2014 one to be read, the other to '
            'measure real distances. I never sell your data to retailers \u2014 '
            'that\u2019s what keeps me neutral.')
tpl = swap(tpl, PARA_OLD, PARA_NEW, "paragraphe privacy")

ROWS_OLD = (
    "      privacyRows: [\n"
    "        { label:'Receipts', detail:'Read on-device \u00b7 line items only',"
    " tag:'On-device', tagColor:'#0A5C3F', tagBg:'#EAF5F0' },\n"
    "        { label:'Location', detail:'Routes & store hours',"
    " tag:'While shopping', tagColor:'#6E6A65', tagBg:'#F0EEE9' },\n"
    "        { label:'Shared with retailers', detail:'Never \u2014 keeps Astride neutral',"
    " tag:'Never', tagColor:'#0A5C3F', tagBg:'#EAF5F0' }\n"
    "      ],\n"
)
ROWS_NEW = (
    "      privacyRows: [\n"
    "        { label:'Receipt photo', detail:'Sent to Kerma to be read \u00b7"
    " line items kept', tag:'Kerma server', tagColor:'#6E6A65', tagBg:'#F0EEE9' },\n"
    "        { label:'Location', detail:'Sent with each plan, to measure distances',"
    " tag:'Kerma server', tagColor:'#6E6A65', tagBg:'#F0EEE9' },\n"
    "        { label:'Shared with retailers', detail:'Never \u2014 keeps Astride neutral',"
    " tag:'Never', tagColor:'#0A5C3F', tagBg:'#EAF5F0' }\n"
    "      ],\n"
)
tpl = swap(tpl, ROWS_OLD, ROWS_NEW, "tableau privacyRows")

BTN = ('>\n            <button style="display:flex;align-items:center;'
       'justify-content:center;gap:8px;padding:15px 16px;width:100%;'
       'border-top:1px solid rgba(17,17,16,.055)"><span style="font-size:14.5px;'
       'font-weight:700;color:#C0392B;letter-spacing:-.2px">'
       'Download or delete my data</span></button>\n')
tpl = swap(tpl, BTN, ">\n", "bouton Download or delete my data")


def ck(cond, msg):
    if not cond:
        die(msg)


ck("Download or delete my data" not in tpl, "le libelle du bouton subsiste")
ck("on your device" not in tpl, "'on your device' subsiste quelque part")
ck("On-device" not in tpl, "la pastille 'On-device' subsiste")
ck(tpl.count("I never sell your data to retailers") == 1,
   "l'engagement de neutralite a ete perdu ou duplique")
ck(tpl.count("privacyRows") == orig.count("privacyRows"), "privacyRows a bouge")
ck(tpl.count("{{ p.label }}") == orig.count("{{ p.label }}")
   and tpl.count("{{ p.tag }}") == orig.count("{{ p.tag }}")
   and tpl.count("{{ p.detail }}") == orig.count("{{ p.detail }}"),
   "le balisage des lignes privacy a ete touche")
ck(tpl.count("tagColor") == orig.count("tagColor")
   and tpl.count("tagBg") == orig.count("tagBg"),
   "le nombre de pastilles a change")
ck(tpl.count("<button") == orig.count("<button") - 1,
   "%d -> %d boutons (attendu -1)" % (orig.count("<button"), tpl.count("<button")))
ck(tpl.count("</button>") == orig.count("</button>") - 1,
   "les balises button ne sont plus equilibrees")
ck(tpl.count("onclick=") == orig.count("onclick="),
   "un handler a disparu : le mauvais bouton a ete retire")
ck(tpl.count("<sc-if") == orig.count("<sc-if")
   and tpl.count("<sc-for") == orig.count("<sc-for"),
   "la structure du balisage a change")
ck(tpl.count("#C0392B") == orig.count("#C0392B") - 1,
   "la couleur du bouton rouge n'a pas disparu exactement une fois")

lines[idx] = json.dumps(tpl).replace("/", "\\/") + "</script>\n"
open(path, "w", encoding="utf-8").write("".join(lines))

chk = next(l for l in open(path, encoding="utf-8").read().split("\n")
           if l.strip().startswith('"<!DOCTYPE'))
assert json.JSONDecoder().raw_decode(chk.strip())[0] == tpl, "ECHEC: aller-retour JSON"
n = open(path, encoding="utf-8").read().count("</script>")
assert n == 4, "ECHEC: %d </script> au lieu de 4" % n
print("OK - la carte Privacy decrit ce que le code fait ; le bouton mort est retire")
