# Gera os assets cartoon do jogo (ônibus, carros, moeda, mesa, NPC, porta e fundos).
# Estilo: cores chapadas + contorno escuro + brilho no topo + sombra embaixo, para
# combinar com o visual cartoon/renderizado dos personagens. Tudo livre de licença.
from PIL import Image, ImageDraw, ImageFilter

OUT = "."

def clamp(v): return max(0, min(255, int(v)))
def lighten(c, f=0.35):
    return tuple(clamp(x + (255 - x) * f) for x in c[:3]) + (c[3] if len(c) > 3 else 255,)
def darken(c, f=0.35):
    return tuple(clamp(x * (1 - f)) for x in c[:3]) + (c[3] if len(c) > 3 else 255,)
def hex2rgb(h):
    h = h.lstrip("#"); return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), 255)

def novo(w, h):
    img = Image.new("RGBA", (w, h), (0,0,0,0))
    return img, ImageDraw.Draw(img)

def salvar(img, nome):
    img.save(f"{OUT}/{nome}")
    print("ok", nome, img.size)

# ----------------------------------------------------------------------
# MOEDA
# ----------------------------------------------------------------------
def gerar_moeda():
    s = 64; img, d = novo(s, s)
    ouro = (255, 200, 40, 255)
    d.ellipse([4,4,s-4,s-4], fill=darken(ouro,0.15), outline=(90,60,0,255), width=4)
    d.ellipse([12,12,s-12,s-12], fill=ouro, outline=darken(ouro,0.35), width=3)
    # brilho
    d.ellipse([20,16,34,30], fill=lighten(ouro,0.6))
    # símbolo "$"
    d.line([(s/2,18),(s/2,s-18)], fill=darken(ouro,0.5), width=4)
    d.arc([22,20,42,34], 20, 320, fill=darken(ouro,0.5), width=4)
    d.arc([22,32,42,46], 200, 140, fill=darken(ouro,0.5), width=4)
    salvar(img, "moeda.png")

# ----------------------------------------------------------------------
# CARRO (tingido pela cor) — base 180x80, frente apontando p/ direita
# ----------------------------------------------------------------------
def gerar_carro(cor_hex, nome):
    c = hex2rgb(cor_hex)
    w, h = 180, 80; img, d = novo(w, h)
    # sombra no chão
    d.ellipse([10, h-14, w-10, h-2], fill=(0,0,0,70))
    # corpo inferior
    d.rounded_rectangle([6, 30, w-6, h-12], radius=14, fill=c, outline=(20,20,20,255), width=4)
    # cabine (teto)
    d.rounded_rectangle([46, 8, w-50, 40], radius=14, fill=darken(c,0.12), outline=(20,20,20,255), width=4)
    # vidros
    d.rounded_rectangle([54, 14, 98, 36], radius=6, fill=(150,210,235,255), outline=(20,20,20,255), width=3)
    d.rounded_rectangle([104, 14, w-58, 36], radius=6, fill=(150,210,235,255), outline=(20,20,20,255), width=3)
    # brilho superior no corpo
    d.line([(20, 38), (w-20, 38)], fill=lighten(c,0.5), width=3)
    # faróis (frente = direita) e lanterna
    d.ellipse([w-16, 36, w-6, 50], fill=(255,245,170,255), outline=(20,20,20,255), width=2)
    d.ellipse([6, 36, 16, 50], fill=(220,60,60,255), outline=(20,20,20,255), width=2)
    # rodas
    for cx in (44, w-44):
        d.ellipse([cx-16, h-28, cx+16, h+4], fill=(25,25,25,255))
        d.ellipse([cx-7, h-19, cx+7, h-5], fill=(120,120,120,255))
    salvar(img, nome)

# ----------------------------------------------------------------------
# ÔNIBUS — base 300x120
# ----------------------------------------------------------------------
def gerar_onibus():
    w, h = 300, 120; img, d = novo(w, h)
    azul = (60, 120, 200, 255)
    d.ellipse([14, h-18, w-14, h-2], fill=(0,0,0,80))  # sombra
    d.rounded_rectangle([8, 14, w-8, h-14], radius=20, fill=azul, outline=(20,20,30,255), width=5)
    # faixa branca
    d.rectangle([12, h-44, w-12, h-30], fill=(245,245,245,255))
    # janelas
    jy0, jy1 = 26, 60
    for i in range(6):
        x0 = 26 + i*44
        d.rounded_rectangle([x0, jy0, x0+34, jy1], radius=6, fill=(160,215,240,255), outline=(20,20,30,255), width=3)
    # porta
    d.rounded_rectangle([w-40, 30, w-16, h-46], radius=4, fill=(120,160,200,255), outline=(20,20,30,255), width=3)
    # brilho topo
    d.line([(24, 22), (w-24, 22)], fill=lighten(azul,0.5), width=4)
    # placa de destino
    d.rectangle([24, 18, 120, 30], fill=(30,40,60,255))
    # rodas
    for cx in (60, w-70):
        d.ellipse([cx-20, h-30, cx+20, h+6], fill=(25,25,25,255))
        d.ellipse([cx-9, h-19, cx+9, h-1], fill=(120,120,120,255))
    salvar(img, "onibus.png")

# ----------------------------------------------------------------------
# CARTEIRA / MESA de madeira — base 160x90 (vista levemente de cima)
# ----------------------------------------------------------------------
def gerar_carteira():
    # Painel de madeira neutro (sem pernas/perspectiva) — estica bem em qualquer
    # proporção, servindo tanto p/ mesas largas quanto p/ "paredes" altas e estreitas.
    w, h = 120, 120; img, d = novo(w, h)
    mad = (150, 95, 50, 255)
    d.rounded_rectangle([3, 3, w-3, h-3], radius=10, fill=mad, outline=(60,35,15,255), width=5)
    # ripas horizontais
    for yy in range(24, h-10, 24):
        d.line([(8, yy), (w-8, yy)], fill=darken(mad,0.20), width=3)
        d.line([(8, yy+2), (w-8, yy+2)], fill=lighten(mad,0.18), width=1)
    # brilho no topo e sombra na base
    d.line([(10, 9), (w-10, 9)], fill=lighten(mad,0.4), width=3)
    d.line([(10, h-9), (w-10, h-9)], fill=darken(mad,0.35), width=3)
    salvar(img, "carteira.png")

# ----------------------------------------------------------------------
# NPC (aluno genérico) — 64x72, visto de frente
# ----------------------------------------------------------------------
def gerar_npc():
    w, h = 64, 72; img, d = novo(w, h)
    d.ellipse([10, h-12, w-10, h-2], fill=(0,0,0,70))  # sombra
    camisa = (60, 160, 90, 255)
    # corpo
    d.rounded_rectangle([14, 30, w-14, h-8], radius=12, fill=camisa, outline=(20,40,25,255), width=3)
    # braços
    d.rounded_rectangle([6, 32, 16, 56], radius=6, fill=darken(camisa,0.12), outline=(20,40,25,255), width=2)
    d.rounded_rectangle([w-16, 32, w-6, 56], radius=6, fill=darken(camisa,0.12), outline=(20,40,25,255), width=2)
    # cabeça
    pele = (240, 200, 160, 255)
    d.ellipse([18, 6, w-18, 36], fill=pele, outline=(120,90,60,255), width=3)
    # cabelo
    d.pieslice([18, 2, w-18, 32], 180, 360, fill=(70,45,25,255))
    # olhos
    d.ellipse([26, 18, 31, 23], fill=(30,30,30,255))
    d.ellipse([w-31, 18, w-26, 23], fill=(30,30,30,255))
    salvar(img, "npc.png")

# ----------------------------------------------------------------------
# PORTA de saída — 64x80
# ----------------------------------------------------------------------
def gerar_porta():
    w, h = 64, 80; img, d = novo(w, h)
    d.rounded_rectangle([4, 2, w-4, h-2], radius=8, fill=(80,60,40,255), outline=(40,28,16,255), width=4)
    d.rounded_rectangle([10, 8, w-10, h-8], radius=6, fill=(120,90,60,255))
    # placa EXIT verde
    d.rounded_rectangle([10, 10, w-10, 30], radius=4, fill=(40,180,80,255), outline=(15,90,40,255), width=2)
    d.line([(18,20),(w-18,20)], fill=(240,255,245,255), width=4)  # traço estilizado "saída"
    # maçaneta
    d.ellipse([w-22, h/2-4, w-14, h/2+4], fill=(255,215,90,255), outline=(120,90,0,255), width=2)
    salvar(img, "porta.png")

# ----------------------------------------------------------------------
# FUNDOS 800x600
# ----------------------------------------------------------------------
def grad_vertical(d, w, h, c0, c1):
    for y in range(h):
        f = y / h
        col = tuple(clamp(c0[i] + (c1[i]-c0[i])*f) for i in range(3))
        d.line([(0,y),(w,y)], fill=col)

def gerar_fundo_saguao():  # Fase 1 - saguão
    w, h = 800, 600; img, d = novo(w, h)
    grad_vertical(d, w, h, (210,205,195), (170,165,155))
    # piso quadriculado
    t = 80
    for gy in range(0, h, t):
        for gx in range(0, w, t):
            if ((gx//t + gy//t) % 2 == 0):
                d.rectangle([gx, gy, gx+t, gy+t], fill=(195,190,180,255))
    d.rectangle([0,0,w,80], fill=(120,130,150,255))  # parede no topo
    d.line([(0,80),(w,80)], fill=(80,90,110,255), width=4)
    salvar(img, "bg_saguao.png")

def gerar_fundo_sala():  # Fase 2 - sala/labirinto
    w, h = 800, 600; img, d = novo(w, h)
    grad_vertical(d, w, h, (225,220,200), (195,185,160))
    for gx in range(0, w, 100):
        d.line([(gx,0),(gx,h)], fill=(205,198,178,255), width=2)
    for gy in range(0, h, 100):
        d.line([(0,gy),(w,gy)], fill=(205,198,178,255), width=2)
    salvar(img, "bg_sala.png")

def gerar_fundo_prova():  # Fase 3 - sala de prova com lousa
    w, h = 800, 600; img, d = novo(w, h)
    grad_vertical(d, w, h, (200,210,205), (160,170,165))
    # lousa no topo
    d.rectangle([0,0,w,120], fill=(45,75,60,255))
    d.rounded_rectangle([30,18,w-30,104], radius=8, fill=(35,60,48,255), outline=(150,110,60,255), width=8)
    d.line([(60,50),(300,50)], fill=(230,230,230,180), width=3)
    d.line([(60,75),(360,75)], fill=(230,230,230,160), width=3)
    salvar(img, "bg_prova.png")

def gerar_fundo_rua():  # Fase final - rua
    w, h = 800, 600; img, d = novo(w, h)
    # calçadas em cima e embaixo
    d.rectangle([0,0,w,h], fill=(70,72,78,255))           # asfalto
    d.rectangle([0,0,w,40], fill=(150,150,140,255))       # calçada topo (parada de ônibus)
    d.rectangle([0,h-40,w,h], fill=(150,150,140,255))     # calçada base
    # faixas tracejadas nas pistas (alinhadas com as linhas de carros y=90..450)
    for ylane in (130, 220, 310, 400, 490):
        for xx in range(0, w, 60):
            d.rectangle([xx, ylane, xx+34, ylane+6], fill=(235,225,120,255))
    salvar(img, "bg_rua.png")

# ----------------------------------------------------------------------
# PAPEL (recorta o 1º quadro de papeis.png para um sprite limpo)
# ----------------------------------------------------------------------
def gerar_papel():
    im = Image.open("papeis.png").convert("RGBA"); w, h = im.size; px = im.load()
    # acha o primeiro bloco de conteúdo (esquerda) ignorando as linhas de movimento finas
    colcount = [0]*w
    for x in range(w):
        cnt = 0
        for y in range(h):
            if px[x,y][3] > 20: cnt += 1
        colcount[x] = cnt
    # bordas do 1º bloco "grosso"
    x0 = next(x for x in range(w) if colcount[x] > 8)
    x1 = x0
    for x in range(x0, w):
        if colcount[x] > 3: x1 = x
        elif x - x1 > 25: break
    rows = [y for y in range(h) if any(px[x,y][3] > 20 for x in range(x0, x1+1))]
    y0, y1 = rows[0], rows[-1]
    crop = im.crop((x0-2, y0-2, x1+3, y1+3))
    crop.save("papel.png"); print("ok papel.png", crop.size)

gerar_moeda()
for hexc in ["#FF4500", "#8A2BE2", "#A9A9A9", "#DC143C", "#FFD700"]:
    gerar_carro(hexc, "car_" + hexc.lstrip("#").lower() + ".png")
gerar_onibus()
gerar_carteira()
gerar_npc()
gerar_porta()
gerar_fundo_saguao()
gerar_fundo_sala()
gerar_fundo_prova()
gerar_fundo_rua()
gerar_papel()
print("FEITO")
