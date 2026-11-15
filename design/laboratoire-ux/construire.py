# Assemble src/ + les pictos du projet en un seul fichier index.html.
# Commande (depuis le dossier design/laboratoire-ux) : python construire.py
import re, json, os
ici = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(ici, 'src')
pictos_dir = os.path.join(ici, '..', 'pictos')
P = {}
for f in sorted(os.listdir(pictos_dir)):
    if not f.endswith('.svg'):
        continue
    k = f[:-4]
    s = open(os.path.join(pictos_dir, f), encoding='utf-8').read()
    s = re.sub(r'\s(width|height)="[^"]*"', '', s, count=2)
    for i in set(re.findall(r'id="([^"]+)"', s)):
        s = s.replace('"' + i + '"', '"' + k + '_' + i + '"').replace('url(#' + i + ')', 'url(#' + k + '_' + i + ')')
    P[k] = s.strip()
lire = lambda n: open(os.path.join(src, n), encoding='utf-8').read()
js = ''.join(lire(x) + '\n' for x in ['core.js', 'refs.js', 'mod1.js', 'mod2.js', 'mod3.js', 'mod4.js', 'mod5.js', 'mod6.js', 'mod7.js', 'app.js'])
corps = '''<div class="app"><nav class="side" id="side" aria-label="Modules"></nav><main class="main" id="main"></main></div>
<div id="hap" role="status"><i></i><span id="hap-t">Vibrations simulées : touche un bouton</span><button id="hap-off">Couper</button></div>
<script>
const PICTOS=%s;
</script>
<script>
%s
boot();
</script>''' % (json.dumps(P, ensure_ascii=False), js)
out = lire('head.html') + lire('tail.css') + corps
open(os.path.join(ici, 'index.html'), 'w', encoding='utf-8').write(out)
print('index.html écrit,', len(out), 'caractères')
