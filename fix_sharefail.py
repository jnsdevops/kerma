"""KERMA — le partage ne peut plus echouer en silence, et ne depend plus
d'une optimisation reussie.

Deux defauts, les deux a moi.

1. LE BOUTON N'ETAIT ATTEIGNABLE QU'APRES UN PLAN.
   "Send this list" vit dans <sc-if value="{{ isShop }}">, c'est-a-dire sur
   l'ecran de courses, qui n'existe qu'apres une optimisation reussie et le
   choix d'un magasin. Or le moment ou l'on envoie sa liste a quelqu'un est
   precisement le moment ou l'on n'y va pas soi-meme : magasins fermes, pas
   de plan, pas de voiture. Le seul chemin vers le partage passait par le
   chemin qu'on ne prend pas. La liste part maintenant depuis l'accueil,
   sous "Today's list", des qu'il y a un article.

2. _doShare AVALAIT TOUTES LES ERREURS.
       try { if (navigator.share) { ... return; } } catch(e) {}
       try { await navigator.clipboard.writeText(msg); ... } catch(e) {}
   Deux catch vides. Si la feuille de partage echoue et que le presse-papier
   asynchrone est refuse - ce qui arrive des que l'activation du geste a ete
   consommee, ou hors contexte securise, ou dans un navigateur embarque -
   l'utilisateur appuie et RIEN ne se produit. Aucun message, aucune trace.
   C'est exactement le defaut qu'on a corrige pour le scan de ticket avec
   hasVerifyError, et je l'ai reintroduit ici.

   Desormais quatre chemins, dans cet ordre, et chacun dit ce qu'il fait :
     a. navigator.share, appele dans le geste, sans attente avant lui ;
        annuler n'est pas un echec, on se tait ;
     b. une copie synchrone par textarea + execCommand, qui passe la ou le
        presse-papier asynchrone est refuse ;
     c. navigator.clipboard.writeText en dernier recours ;
     d. si tout echoue, on le DIT, et on indique la sortie : la liste est
        affichee juste au-dessus, selectionnable a la main.
   Plus un bouton "Copy instead" : un second geste propre pour qui veut
   coller dans WhatsApp sans passer par la feuille systeme.

3. shareList appelait setState AVANT _doShare. navigator.share exige une
   activation transitoire ; on n'interpose plus un rendu complet entre le
   tap et l'appel.

4. Le meme defaut existait dans shareInviteLink, avec en prime une
   incoherence : il partage `msg` mais ne copie que `link`. Meme chaine de
   secours, meme franchise.

    python3 fix_sharefail.py index.html
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


# --- 1. _doShare : quatre chemins, aucun silence ---
OLD_SHARE = (
    "  _doShare = async (msg) => {\n"
    "    if (!msg) return;\n"
    "    try {\n"
    "      if (navigator.share) { await navigator.share({ title:'Kerma', text: msg }); return; }\n"
    "    } catch(e) {}\n"
    "    try {\n"
    "      await navigator.clipboard.writeText(msg);\n"
    "      this.setState({ shareCopied:true });\n"
    "      setTimeout(() => this.setState({ shareCopied:false }), 2200);\n"
    "    } catch(e) {}\n"
    "  };\n"
)
NEW_SHARE = (
    "  // Une copie synchrone, dans le geste de l'utilisateur. Le presse-papier\n"
    "  // asynchrone demande une permission que beaucoup de contextes refusent ;\n"
    "  // celui-ci ne demande rien et passe presque partout.\n"
    "  _copyText = (txt) => {\n"
    "    try {\n"
    "      const ta = document.createElement('textarea');\n"
    "      ta.value = txt;\n"
    "      ta.setAttribute('readonly', '');\n"
    "      ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.left = '0';\n"
    "      ta.style.width = '1px'; ta.style.height = '1px'; ta.style.opacity = '0';\n"
    "      document.body.appendChild(ta);\n"
    "      ta.focus(); ta.select();\n"
    "      try { ta.setSelectionRange(0, txt.length); } catch(e2) {}\n"
    "      const ok = document.execCommand('copy');\n"
    "      document.body.removeChild(ta);\n"
    "      return !!ok;\n"
    "    } catch(e) { return false; }\n"
    "  };\n"
    "  // Un seul endroit pour dire ce qui vient de se passer. 'manual' reste\n"
    "  // affiche : c'est le seul etat qui demande quelque chose a l'utilisateur.\n"
    "  _shareFlash = (st) => {\n"
    "    this.setState({ shareState: st });\n"
    "    if (st !== 'manual') setTimeout(() => this.setState({ shareState:'' }), 2600);\n"
    "  };\n"
    "  _doShare = async (msg) => {\n"
    "    if (!msg) { this._shareFlash('manual'); return; }\n"
    "    // Appele dans le geste de l'utilisateur : aucune attente avant la\n"
    "    // feuille de partage, sinon l'activation expire.\n"
    "    if (navigator.share) {\n"
    "      try { await navigator.share({ title:'Kerma', text: msg });\n"
    "            this._shareFlash('sent'); return; }\n"
    "      catch(e) {\n"
    "        // Annuler n'est pas un echec : l'utilisateur a decide, on se tait.\n"
    "        if (e && e.name === 'AbortError') return;\n"
    "        this._trail('share sheet failed: ' + ((e && e.name) || 'unknown'));\n"
    "      }\n"
    "    }\n"
    "    if (this._copyText(msg)) { this._shareFlash('copied'); return; }\n"
    "    try { await navigator.clipboard.writeText(msg);\n"
    "          this._shareFlash('copied'); return; }\n"
    "    catch(e) { this._trail('clipboard failed: ' + ((e && e.name) || 'unknown')); }\n"
    "    this._shareFlash('manual');\n"
    "  };\n"
)
tpl = swap(tpl, OLD_SHARE, NEW_SHARE, "corps de _doShare")

# --- 2. shareInviteLink : meme chaine de secours ---
OLD_INV = (
    "    try { if (navigator.share) { await navigator.share({ title:'Kerma', "
    "text: msg, url: link }); return; } } catch(e) {}\n"
    "    try {\n"
    "      await navigator.clipboard.writeText(link);\n"
    "      this.setState({ hhInviteMsgText: this._t('Link copied', 'Lien copié', "
    "'Enlace copiado') });\n"
    "    } catch(e) {}\n"
)
NEW_INV = (
    "    if (navigator.share) {\n"
    "      try { await navigator.share({ title:'Kerma', text: msg, url: link }); return; }\n"
    "      catch(e) { if (e && e.name === 'AbortError') return; }\n"
    "    }\n"
    "    const _okCopy = this._t('Link copied', 'Lien copié', 'Enlace copiado');\n"
    "    if (this._copyText(msg)) { this.setState({ hhInviteMsgText: _okCopy }); return; }\n"
    "    try {\n"
    "      await navigator.clipboard.writeText(msg);\n"
    "      this.setState({ hhInviteMsgText: _okCopy });\n"
    "    } catch(e) {\n"
    "      this.setState({ hhInviteMsgText: this._t(\n"
    "        'Copy the link above by hand',\n"
    "        'Copiez le lien ci-dessus à la main',\n"
    "        'Copie el enlace de arriba a mano') });\n"
    "    }\n"
)
tpl = swap(tpl, OLD_INV, NEW_INV, "chaine de secours de shareInviteLink")

# --- 3. la charge : _doShare avant setState, un bouton copier, trois etats ---
OLD_PAY = (
    "      shareList: () => { this.setState({ tripShared:true });\n"
    "                         return this._doShare(_shareMsg); },\n"
    "      shareCopied: !!s.shareCopied,\n"
)
NEW_PAY = (
    "      // _doShare d'abord : la feuille de partage exige l'activation du\n"
    "      // geste, et un rendu complet interpose la fait expirer sur Android.\n"
    "      shareList: () => { const p = this._doShare(_shareMsg);\n"
    "                         this.setState({ tripShared:true });\n"
    "                         return p; },\n"
    "      copyList: () => {\n"
    "        if (this._copyText(_shareMsg)) { this._shareFlash('copied');\n"
    "                                        this.setState({ tripShared:true }); }\n"
    "        else { this._shareFlash('manual'); }\n"
    "      },\n"
    "      shareCopied: s.shareState === 'copied',\n"
    "      shareSent:   s.shareState === 'sent',\n"
    "      shareManual: s.shareState === 'manual',\n"
)
tpl = swap(tpl, OLD_PAY, NEW_PAY, "charge du partage")

# --- 4. la liste affichee devient selectionnable a la main ---
tpl = swap(tpl,
           "max-height:230px;overflow-y:auto;-webkit-overflow-scrolling:touch;"
           "font:12.5px/1.6 ui-monospace",
           "max-height:230px;overflow-y:auto;-webkit-overflow-scrolling:touch;"
           "-webkit-user-select:text;user-select:text;"
           "font:12.5px/1.6 ui-monospace",
           "apercu de la liste partagee")

# --- 5. le bouton copier et les trois etats visibles ---
OLD_FB = (
    '<sc-if value="{{ shareCopied }}" hint-placeholder-val="{{ false }}">\n'
    '            <div style="font-size:13px;font-weight:600;color:#0B7A53;'
    'text-align:center;margin-top:9px">Copied — paste it anywhere</div>\n'
    '          </sc-if>\n'
)
FB_STYLE = ("font-size:13px;font-weight:600;text-align:center;"
            "margin-top:9px;line-height:1.45")
NEW_FB = (
    '<button onclick="{{ copyList }}" style="width:100%;padding:12px;margin-top:2px;'
    'display:flex;align-items:center;justify-content:center">'
    '<span style="font-size:14px;font-weight:700;color:#0B7A53;letter-spacing:-.2px">'
    'Copy instead</span></button>\n'
    '          <sc-if value="{{ shareSent }}" hint-placeholder-val="{{ false }}">\n'
    '            <div style="' + FB_STYLE + ';color:#0B7A53">Shared — ask them to keep '
    'the receipt</div>\n'
    '          </sc-if>\n'
    '          <sc-if value="{{ shareCopied }}" hint-placeholder-val="{{ false }}">\n'
    '            <div style="' + FB_STYLE + ';color:#0B7A53">Copied — paste it anywhere'
    '</div>\n'
    '          </sc-if>\n'
    '          <sc-if value="{{ shareManual }}" hint-placeholder-val="{{ false }}">\n'
    '            <div style="' + FB_STYLE + ';color:#8A2E24">This phone wouldn’t open '
    'the share sheet or the clipboard. Press and hold the list above to select and '
    'copy it.</div>\n'
    '          </sc-if>\n'
)
tpl = swap(tpl, OLD_FB, NEW_FB, "retour visuel du partage")

# --- 6. un second chemin : envoyer la liste depuis l'accueil ---
OLD_HOME = (
    '{{ myListCount }}</span>\n'
    '          </button>\n'
)
NEW_HOME = (
    '{{ myListCount }}</span>\n'
    '          </button>\n'
    '\n'
    '          <!-- On envoie sa liste justement quand on n\'y va pas soi-meme :\n'
    '               ce chemin ne doit donc pas dependre d\'un plan reussi. -->\n'
    '          <sc-if value="{{ hasShareItems }}" hint-placeholder-val="{{ true }}">\n'
    '          <button onclick="{{ openShare }}" style="width:100%;display:flex;'
    'align-items:center;gap:11px;background:#fff;border-radius:14px;padding:13px 14px;'
    'box-shadow:0 1px 3px rgba(17,17,16,.05);text-align:left;margin-top:8px">\n'
    '            <span style="width:32px;height:32px;border-radius:10px;background:#F0EEE9;'
    'display:flex;align-items:center;justify-content:center;flex:none">\n'
    '              <svg width="15" height="15" viewBox="0 0 18 18" fill="none" '
    'stroke="#6E6A65" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
    '<circle cx="13.5" cy="4" r="2.2"></circle><circle cx="4.5" cy="9" r="2.2"></circle>'
    '<circle cx="13.5" cy="14" r="2.2"></circle><path d="M6.5 7.9 11.5 5.1M6.5 10.1l5 2.8">'
    '</path></svg>\n'
    '            </span>\n'
    '            <span style="flex:1;font-size:14.5px;font-weight:600;color:#111110;'
    'letter-spacing:-.2px">Send this list to someone</span>\n'
    '          </button>\n'
    '          </sc-if>\n'
)
tpl = swap(tpl, OLD_HOME, NEW_HOME, "carte Today's list sur l'accueil")


# --- garde-fous, en deltas ---
def ck(cond, msg):
    if not cond:
        die(msg)


ck(tpl.count("_copyText") == 4,
   "%d occurrences de _copyText au lieu de 4 (1 def + 3 usages)" % tpl.count("_copyText"))
ck(tpl.count("_shareFlash") == 8,
   "%d occurrences de _shareFlash au lieu de 8 (1 def + 7 usages)" % tpl.count("_shareFlash"))
ck(tpl.count("document.execCommand('copy')") == 1,
   "la copie synchrone n'est pas posee une fois")
ck(tpl.count("shareState") == 5,
   "%d occurrences de shareState au lieu de 5" % tpl.count("shareState"))
ck(tpl.count("} } catch(e) {}") == orig.count("} } catch(e) {}") - 1,
   "le catch vide de shareInviteLink subsiste")
ck("navigator.clipboard.writeText(msg);\n      this.setState({ shareCopied:true })" not in tpl,
   "l'ancien corps de _doShare subsiste")
ck(tpl.count("navigator.share") == orig.count("navigator.share"),
   "%d -> %d navigator.share (attendu inchange)"
   % (orig.count("navigator.share"), tpl.count("navigator.share")))
ck(tpl.count("navigator.clipboard.writeText") == orig.count("navigator.clipboard.writeText"),
   "%d -> %d clipboard.writeText (attendu inchange)"
   % (orig.count("navigator.clipboard.writeText"), tpl.count("navigator.clipboard.writeText")))
ck(tpl.count("e.name === 'AbortError'") == orig.count("e.name === 'AbortError'") + 2,
   "%d -> %d tests d'annulation (attendu +2)"
   % (orig.count("e.name === 'AbortError'"), tpl.count("e.name === 'AbortError'")))
ck("const p = this._doShare(_shareMsg);\n                         this.setState({ tripShared:true })"
   in tpl, "l'ordre tap -> partage -> etat n'est pas celui attendu")
for need in ["{{ shareSent }}", "{{ shareCopied }}", "{{ shareManual }}", "{{ copyList }}"]:
    ck(tpl.count(need) == 1, "%s n'est pas lie une seule fois (%d)" % (need, tpl.count(need)))
for need in ["shareSent:", "shareManual:", "copyList:"]:
    ck(tpl.count(need) == 1, "%s n'est pas fourni une seule fois (%d)" % (need, tpl.count(need)))
ck(tpl.count("shareCopied") == 2,
   "%d occurrences de shareCopied au lieu de 2 (1 charge + 1 liaison)" % tpl.count("shareCopied"))
ck(tpl.count("user-select:text") == 2,
   "%d declarations user-select:text au lieu de 2" % tpl.count("user-select:text"))
ck(tpl.count("{{ openShare }}") == orig.count("{{ openShare }}") + 1,
   "%d -> %d liaisons openShare (attendu +1)"
   % (orig.count("{{ openShare }}"), tpl.count("{{ openShare }}")))
ck(tpl.count("{{ hasShareItems }}") == orig.count("{{ hasShareItems }}") + 1,
   "%d -> %d liaisons hasShareItems (attendu +1)"
   % (orig.count("{{ hasShareItems }}"), tpl.count("{{ hasShareItems }}")))
ck(tpl.count("Send this list to someone") == 1, "l'entree de l'accueil n'est pas posee une fois")
ck(tpl.count("{{ myListCount }}") == 1, "la carte Today's list a bouge")
ck(tpl.count("<sc-if") == orig.count("<sc-if") + 3,
   "%d -> %d <sc-if> (attendu +3)" % (orig.count("<sc-if"), tpl.count("<sc-if")))
ck(tpl.count("</sc-if>") == orig.count("</sc-if>") + 3,
   "%d -> %d </sc-if> (attendu +3)" % (orig.count("</sc-if>"), tpl.count("</sc-if>")))
ck(tpl.count("<sc-for") == orig.count("<sc-for"), "le nombre de <sc-for> a change")
ck(tpl.count("<button") == orig.count("<button") + 2,
   "%d -> %d <button> (attendu +2)" % (orig.count("<button"), tpl.count("<button")))
ck(tpl.count("<div") - tpl.count("</div>") == orig.count("<div") - orig.count("</div>"),
   "les <div> ne sont plus equilibres comme avant")
ck(tpl.count("<svg") == orig.count("<svg") + 1,
   "%d -> %d <svg> (attendu +1)" % (orig.count("<svg"), tpl.count("<svg")))
for need in ["{{ shareListText }}", "{{ shareList }}", "{{ showShare }}", "{{ closeFlow }}",
             "openShare=()=>this.setState({ flow:'share' })", "tripShared:true"]:
    ck(need in tpl, "%s a disparu" % need)
ck(tpl.count("MUST AVOID") == 1 and tpl.count("Please keep the receipt.") == 1,
   "le message partage a bouge")
ck(tpl.count("hhInviteMsgText") == orig.count("hhInviteMsgText") + 2,
   "%d -> %d hhInviteMsgText (attendu +2)"
   % (orig.count("hhInviteMsgText"), tpl.count("hhInviteMsgText")))

lines[idx] = json.dumps(tpl).replace("/", "\\/") + "</script>\n"
open(path, "w", encoding="utf-8").write("".join(lines))

chk = next(l for l in open(path, encoding="utf-8").read().split("\n")
           if l.strip().startswith('"<!DOCTYPE'))
assert json.JSONDecoder().raw_decode(chk.strip())[0] == tpl, "ECHEC: aller-retour JSON"
n = open(path, encoding="utf-8").read().count("</script>")
assert n == 4, "ECHEC: %d </script> au lieu de 4" % n
print("OK - le partage ne peut plus echouer en silence, et part aussi de l'accueil")
