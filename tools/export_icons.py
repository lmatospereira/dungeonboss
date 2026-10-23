# Exporta os símbolos SVG de src/body.html (ícones dos poderes e da interface) para
# game/assets/icons/<id>.svg, em branco (o Godot tinge com modulate). Acrescenta o diamante.
#   python3 tools/export_icons.py
import os, re
R = os.path.join(os.path.dirname(__file__), '..')
html = open(f'{R}/src/body.html', encoding='utf8').read()
out = f'{R}/game/assets/icons'; os.makedirs(out, exist_ok=True)
extra = {'i-gem': '<path d="M7 3h10l5 6-10 12L2 9z" opacity=".9"/><path d="M2 9h20M7 3l5 18M17 3l-5 18M7 3l-1 6M17 3l1 6" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.2"/>',
         'i-pause': '<rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/>',
         'i-play': '<path d="M7 4l13 8-13 8z"/>',
         'i-chest': '<path d="M3 10h18v10H3z"/><path d="M3 10a9 5 0 0 1 18 0z" opacity=".8"/><rect x="10.5" y="11" width="3" height="4" rx=".8" fill="#000" fill-opacity=".35"/>'}
n = 0
for sid, vb, body in re.findall(r'<symbol id="([^"]+)" viewBox="([^"]+)">(.*?)</symbol>', html, re.S):
    extra.setdefault(sid, body)
for sid, body in extra.items():
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="#fff" color="#fff">{body}</svg>'
    open(f'{out}/{sid[2:]}.svg', 'w', encoding='utf8').write(svg); n += 1
print(n, 'ícones em', out)
