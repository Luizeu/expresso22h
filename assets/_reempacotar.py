# Reempacota um spritesheet em um GRID UNIFORME.
# Problema original: os frames não estavam igualmente espaçados, então o recorte
# em fatias iguais (largura/colunas) mostrava o personagem "deslizando" (carrossel).
# Solução: detectar cada sprite, recortar justo e recolar centralizado numa célula
# de tamanho fixo, ancorando pelo TORSO (x estável) e pelos PÉS (y estável).
from PIL import Image

ALPHA = 15

def detectar_sprites(im, y0, y1):
    """Devolve lista de crops (um por sprite) na faixa de linhas [y0,y1)."""
    W = im.width; px = im.load()
    colmask = [False]*W
    for x in range(W):
        for y in range(y0, y1):
            if px[x, y][3] > ALPHA:
                colmask[x] = True; break
    blocos = []; prev = False; st = 0
    for x, v in enumerate(colmask):
        if v and not prev: st = x
        if not v and prev: blocos.append((st, x-1))
        prev = v
    if prev: blocos.append((st, W-1))
    sprites = []
    for (bx0, bx1) in blocos:
        ys = [y for y in range(y0, y1) if any(px[x, y][3] > ALPHA for x in range(bx0, bx1+1))]
        if not ys: continue
        if (bx1 - bx0) < 8 or (ys[-1] - ys[0]) < 8:  # ignora respingos/linhas de movimento
            continue
        sprites.append(im.crop((bx0, ys[0], bx1+1, ys[-1]+1)))
    return sprites

def torso_cx(sp):
    """Centro horizontal usando só o terço superior (torso/cabeça = âncora estável)."""
    px = sp.load(); w, h = sp.size
    lim = max(1, int(h*0.45))
    xs = [x for x in range(w) for y in range(lim) if px[x, y][3] > ALPHA]
    return (min(xs)+max(xs))//2 if xs else w//2

def reempacotar(path, out, linhas=3, pad=10):
    im = Image.open(path).convert("RGBA")
    H = im.height
    bandas = [(int(r*H/linhas), int((r+1)*H/linhas)) for r in range(linhas)]
    por_linha = [detectar_sprites(im, y0, y1) for (y0, y1) in bandas]
    cont = [len(s) for s in por_linha]
    maxw = max(sp.width  for linha in por_linha for sp in linha)
    maxh = max(sp.height for linha in por_linha for sp in linha)
    cols = max(cont)
    cw, ch = maxw + pad*2, maxh + pad*2
    novo = Image.new("RGBA", (cw*cols, ch*linhas), (0, 0, 0, 0))
    for r, linha in enumerate(por_linha):
        for c, sp in enumerate(linha):
            cx = c*cw + cw//2
            baseline = r*ch + ch - pad           # pés na base da célula
            ox = cx - torso_cx(sp)               # torso centralizado (x estável)
            oy = baseline - sp.height            # pés alinhados (y estável)
            novo.paste(sp, (ox, oy), sp)
    novo.save(out)
    print(f"ok {out}  grid={cols}x{linhas}  cell={cw}x{ch}  sprites/linha={cont}")
    return cols

import sys
for arg in sys.argv[1:]:
    src, dst = arg.split("=")
    reempacotar(src, dst)
