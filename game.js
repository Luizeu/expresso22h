// ==========================================
// 1. CONFIGURAÇÃO E CARREGAMENTO DE ASSETS
// ==========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let faseAtual = 3; 
let jogoAcabou = false; 
let tempoRestante = 15; // Ajustei para 15 para você não perder logo no começo!

// --- CARREGAMENTO DOS SPRITES ---
const spritesheetPrincipal = new Image();
spritesheetPrincipal.src = 'assets/lucca1.png'; 

const spritesheetProfessor2 = new Image();
spritesheetProfessor2.src = 'assets/professor.png'; // Professor de Moletom Azul (Fase 2)

const spritesheetProfessor3 = new Image();
spritesheetProfessor3.src = 'assets/professor2.png'; // Professor de Terno e Óculos (Fase 3)

// --- ASSETS DE CENÁRIO E OBJETOS (cartoon) ---
function carregarImg(src) { const i = new Image(); i.src = src; return i; }

const imgOnibus   = carregarImg('assets/onibus.png');
const imgMoeda    = carregarImg('assets/moeda.png');
const imgCarteira = carregarImg('assets/carteira.png');
const imgNpc      = carregarImg('assets/npc.png');
const imgPorta    = carregarImg('assets/porta.png');
const imgPapel    = carregarImg('assets/papel.png');

// Um carro por cor (o nome do arquivo usa o hex em minúsculo, ex.: car_ff4500.png)
const imgsCarro = {
    "#FF4500": carregarImg('assets/car_ff4500.png'),
    "#8A2BE2": carregarImg('assets/car_8a2be2.png'),
    "#A9A9A9": carregarImg('assets/car_a9a9a9.png'),
    "#DC143C": carregarImg('assets/car_dc143c.png'),
    "#FFD700": carregarImg('assets/car_ffd700.png')
};

// Fundos por fase
const fundos = {
    1: carregarImg('assets/bg_saguao.png'),
    2: carregarImg('assets/bg_sala.png'),
    3: carregarImg('assets/bg_prova.png'),
    4: carregarImg('assets/bg_rua.png')
};

function imgPronta(img) { return img && img.complete && img.naturalWidth !== 0; }

// Desenha uma imagem esticada na caixa (x,y,w,h). Se não carregou, usa cor de reserva.
function desenharImg(img, x, y, w, h, corReserva) {
    if (imgPronta(img)) { ctx.drawImage(img, x, y, w, h); }
    else if (corReserva) { ctx.fillStyle = corReserva; ctx.fillRect(x, y, w, h); }
}

// Igual à de cima, mas espelha na horizontal (para carros indo p/ esquerda).
function desenharImgEspelhada(img, x, y, w, h, espelhar, corReserva) {
    if (!imgPronta(img)) { if (corReserva) { ctx.fillStyle = corReserva; ctx.fillRect(x, y, w, h); } return; }
    if (espelhar) {
        ctx.save(); ctx.scale(-1, 1);
        ctx.drawImage(img, -x - w, y, w, h);
        ctx.restore();
    } else {
        ctx.drawImage(img, x, y, w, h);
    }
}

// Desenha o fundo da fase atual (se carregado).
function desenharFundo() {
    const f = fundos[faseAtual];
    if (imgPronta(f)) ctx.drawImage(f, 0, 0, canvas.width, canvas.height);
}

// ==========================================
// 2. OBJETOS COM PROPRIEDADES DE ANIMAÇÃO
// ==========================================

const aluno = {
    x: canvas.width / 2 - 30, 
    y: canvas.height - 90, 
    largura: 60, 
    altura: 80, 
    velocidade: 5,
    
    // --- COLISÃO REDUZIDA (HITBOX) ---
    // Estas propriedades controlam apenas a área física, não o desenho
    hitboxLargura: 20, 
    hitboxAltura: 15,  
    offsetX: 20,       
    offsetY: 65,       

    colunasSheet: 9, // CORRIGIDO: o spritesheet do Lucca tem 9 colunas (estava 10 e cortava errado)
    linhasSheet: 3,
    linhaAnimacao: 0,
    frameAtual: 0,
    totalFrames: 1,
    velocidadeAnim: 0.2,
    viradoEsquerda: false
};

const professorFase3 = {
    x: canvas.width / 2 - 30,
    y: 10,
    largura: 60,
    altura: 80,
    velocidade: 6,
    direcao: 1,
    colunasSheet: 9,
    linhasSheet: 3,
    linhaAnimacao: 1, // Anda de lado
    frameAtual: 0,
    totalFrames: 9,
    velocidadeAnim: 0.2,
    viradoEsquerda: false,

    // --- HITBOX (NOVO): a colisão usa só o corpo, não a moldura transparente do sprite ---
    hitboxLargura: 28,
    hitboxAltura: 50,
    offsetX: 16,
    offsetY: 22
};

const profFase2 = {
    x: 700,
    y: 50,
    largura: 60,
    altura: 80,
    velocidade: 4.2,
    colunasSheet: 9,
    linhasSheet: 3,
    linhaAnimacao: 0,
    frameAtual: 0,
    totalFrames: 8,
    velocidadeAnim: 0.2,
    viradoEsquerda: false,

    // --- HITBOX (NOVO): ser pego agora bate com o corpo visível, não com o ar ao redor ---
    hitboxLargura: 28,
    hitboxAltura: 50,
    offsetX: 16,
    offsetY: 22
};

// ==========================================
// 3. CONTROLES E FUNÇÕES GERAIS
// ==========================================
const teclas = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
window.addEventListener("keydown", (e) => { 
    // Evita a tela rolar
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    if (teclas.hasOwnProperty(e.code)) teclas[e.code] = true; 
});
window.addEventListener("keyup", (e) => { if (teclas.hasOwnProperty(e.code)) teclas[e.code] = false; });

function limparTeclas() { 
    teclas.ArrowLeft = false; teclas.ArrowRight = false; teclas.ArrowUp = false; teclas.ArrowDown = false; 
}

// --- CAIXA DE COLISÃO ---
// Devolve {x, y, w, h} já com a hitbox reduzida (se o objeto tiver uma).
// Centraliza a regra num lugar só, em vez de repetir o "if hitbox" pra cada lado.
function caixaColisao(obj) {
    if (obj.hitboxLargura) {
        return {
            x: obj.x + obj.offsetX,
            y: obj.y + obj.offsetY,
            w: obj.hitboxLargura,
            h: obj.hitboxAltura
        };
    }
    return { x: obj.x, y: obj.y, w: obj.largura, h: obj.altura };
}

// Colisão AABB (retângulo vs retângulo) usando as caixas acima.
function verificarColisao(ret1, ret2) {
    const a = caixaColisao(ret1);
    const b = caixaColisao(ret2);
    return (a.x < b.x + b.w && a.x + a.w > b.x &&
            a.y < b.y + b.h && a.y + a.h > b.y);
}

// --- MOVIMENTO DO ALUNO (unificado) ---
// Move o aluno respeitando as bordas do mapa pela HITBOX (não pelo desenho),
// para que ele encoste na parede no lugar certo em todas as fases.
// limiteTopo trava o topo: a Fase 3 só deixa andar da metade da tela pra baixo.
// Retorna a posição anterior, útil pra desfazer o movimento (ex.: bater na carteira).
function moverAluno(limiteTopo = 0) {
    const xAnterior = aluno.x;
    const yAnterior = aluno.y;

    const esqMin   = -aluno.offsetX;
    const dirMax   = canvas.width  - aluno.hitboxLargura - aluno.offsetX;
    const topoMin  = limiteTopo    - aluno.offsetY;
    const baixoMax = canvas.height - aluno.hitboxAltura  - aluno.offsetY;

    if (teclas.ArrowLeft  && aluno.x > esqMin)   aluno.x -= aluno.velocidade;
    if (teclas.ArrowRight && aluno.x < dirMax)   aluno.x += aluno.velocidade;
    if (teclas.ArrowUp    && aluno.y > topoMin)  aluno.y -= aluno.velocidade;
    if (teclas.ArrowDown  && aluno.y < baixoMax) aluno.y += aluno.velocidade;

    controlarAnimacao();
    return { xAnterior, yAnterior };
}

function controlarAnimacao() {
    let estaMovendo = false;
    let novaLinha = aluno.linhaAnimacao;
    let novosFrames = aluno.totalFrames;

    if (teclas.ArrowLeft) {
        novaLinha = 2; novosFrames = 9; estaMovendo = true; // 9 frames de corrida (era 10)
    } else if (teclas.ArrowRight) {
        novaLinha = 1; novosFrames = 9; estaMovendo = true; // 9 frames de corrida (era 10)
    } else if (teclas.ArrowUp || teclas.ArrowDown) {
        estaMovendo = true;
    }

    if (!estaMovendo) { novaLinha = 0; novosFrames = 1; }

    if (aluno.linhaAnimacao !== novaLinha) {
        aluno.linhaAnimacao = novaLinha; aluno.totalFrames = novosFrames; aluno.frameAtual = 0;
    }
}

// ==========================================
// 4. VARIÁVEIS E LÓGICAS DAS FASES
// ==========================================
const folhas = []; 
let framesFase3 = 0;    

const portaSaidaFase2 = { x: 730, y: 530, largura: 50, altura: 50, cor: "#00FF00" }; 
const carteiras = [ 
    { x: 100, y: 100, largura: 150, altura: 60, cor: "#8B4513" }, 
    { x: 350, y: 150, largura: 150, altura: 60, cor: "#8B4513" }, 
    { x: 100, y: 300, largura: 150, altura: 60, cor: "#8B4513" }, 
    { x: 350, y: 350, largura: 150, altura: 60, cor: "#8B4513" }, 
    { x: 600, y: 150, largura: 60,  altura: 300, cor: "#8B4513" }, 
    { x: 200, y: 450, largura: 250, altura: 60, cor: "#8B4513" } 
];
let moedas = [];

const portaSaidaFase1 = { x: canvas.width / 2 - 25, y: canvas.height - 50, largura: 50, altura: 50, cor: "#00FF00" };
const npcs = []; 
let framesFase1 = 0; 

const onibus = { x: canvas.width / 2 - 75, y: 10, largura: 150, altura: 60, cor: "#4682B4" };

// --- CORREÇÃO NOS CARROS ---
// Mudei "velocidad" para "velocidade" em todos os objetos do array
const carros = [ 
    { x: 0, y: 450, largura: 90, altura: 40, velocidade: 5, direcao: 1, cor: "#FF4500" }, 
    { x: 300, y: 450, largura: 90, altura: 40, velocidade: 5, direcao: 1, cor: "#FF4500" }, 
    { x: 600, y: 450, largura: 90, altura: 40, velocidade: 5, direcao: 1, cor: "#FF4500" }, 
    { x: 800, y: 360, largura: 70, altura: 40, velocidade: 8, direcao: -1, cor: "#8A2BE2" }, 
    { x: 200, y: 360, largura: 70, altura: 40, velocidade: 8, direcao: -1, cor: "#8A2BE2" }, 
    { x: 0, y: 270, largura: 140, altura: 40, velocidade: 4, direcao: 1, cor: "#A9A9A9" }, 
    { x: 450, y: 270, largura: 140, altura: 40, velocidade: 4, direcao: 1, cor: "#A9A9A9" }, 
    { x: 800, y: 180, largura: 80, altura: 40, velocidade: 6, direcao: -1, cor: "#DC143C" }, 
    { x: 400, y: 180, largura: 80, altura: 40, velocidade: 6, direcao: -1, cor: "#DC143C" }, 
    { x: 0, y: 90, largura: 60, altura: 40, velocidade: 9, direcao: 1, cor: "#FFD700" } 
];

// --- LÓGICA FASE 3 ---
function atualizarFase3() {
    // Fase 3: só anda da metade da tela pra baixo (limiteTopo = canvas.height / 2)
    moverAluno(canvas.height / 2);

    professorFase3.x += professorFase3.velocidade * professorFase3.direcao;
    if (professorFase3.x + professorFase3.largura >= canvas.width || professorFase3.x <= 0) {
        professorFase3.direcao *= -1; 
    }
    
    professorFase3.viradoEsquerda = (professorFase3.direcao === -1);
    professorFase3.linhaAnimacao = 1; 
    professorFase3.totalFrames = 9;

    framesFase3++;
    if (framesFase3 % 60 === 0) {
        tempoRestante--;
        if (tempoRestante <= 0) { alert("Sinal bateu! Correndo para o 2º Andar!"); limparTeclas(); iniciarFase2(); return; }
    }

    if (framesFase3 % 20 === 0) { folhas.push({ x: professorFase3.x + (professorFase3.largura / 2) - 10, y: professorFase3.y + professorFase3.altura, largura: 20, altura: 30, velocidade: 6 + Math.random() * 4 });}

    for (let i = 0; i < folhas.length; i++) {
        let folha = folhas[i]; folha.y += folha.velocidade;
        if (verificarColisao(aluno, folha)) { alert("Game Over! Mais uma DP na conta..."); limparTeclas(); aluno.x = canvas.width / 2 - 30; aluno.y = canvas.height - 90; professorFase3.x = canvas.width / 2 - 30; folhas.length = 0; framesFase3 = 0; tempoRestante = 15; return; }
        if (folha.y > canvas.height) { folhas.splice(i, 1); i--; }
    }
}

function desenharFase3() {
    desenharSprite(spritesheetProfessor3, professorFase3); // Professor de Terno (Fase 3)
    for (let folha of folhas) { desenharImg(imgPapel, folha.x, folha.y, folha.largura, folha.altura, "#FFFFFF"); }
    ctx.fillStyle = "#FFFFFF"; ctx.font = "24px Arial"; ctx.fillText("Tempo: " + tempoRestante + "s", canvas.width - 150, 40); ctx.fillText("3º Andar: Sobreviva 15s!", 20, 40);
}

// --- LÓGICA FASE 2 ---
function iniciarFase2() {
    faseAtual = 2; aluno.x = 20; aluno.y = 20; profFase2.x = 700; profFase2.y = 50;
    moedas = [ { x: 300, y: 60, largura: 20, altura: 20, cor: "#FFD700" }, { x: 550, y: 120, largura: 20, altura: 20, cor: "#FFD700" }, { x: 200, y: 250, largura: 20, altura: 20, cor: "#FFD700" }, { x: 520, y: 400, largura: 20, altura: 20, cor: "#FFD700" }, { x: 80, y: 400, largura: 20, altura: 20, cor: "#FFD700" } ];
}
function colidiuComCarteira(objeto) { for (let c of carteiras) { if (verificarColisao(objeto, c)) return true; } return false;}

function atualizarFase2() {
    // Move por eixo para poder "deslizar" ao longo das carteiras (e desfazer só o eixo travado)
    const xAnterior = aluno.x;
    if (teclas.ArrowLeft  && aluno.x > -aluno.offsetX) aluno.x -= aluno.velocidade;
    if (teclas.ArrowRight && aluno.x + aluno.hitboxLargura + aluno.offsetX < canvas.width) aluno.x += aluno.velocidade;
    if (colidiuComCarteira(aluno)) aluno.x = xAnterior;

    const yAnterior = aluno.y;
    if (teclas.ArrowUp   && aluno.y > -aluno.offsetY) aluno.y -= aluno.velocidade;
    if (teclas.ArrowDown && aluno.y + aluno.hitboxAltura + aluno.offsetY < canvas.height) aluno.y += aluno.velocidade;
    if (colidiuComCarteira(aluno)) aluno.y = yAnterior;

    controlarAnimacao();

    // Coleta de moedas com área generosa (corpo do aluno), não a hitbox dos pés — fica fácil/intuitivo encostar
    const coletor = { x: aluno.x + 8, y: aluno.y + 18, largura: aluno.largura - 16, altura: aluno.altura - 22 };
    for (let i = 0; i < moedas.length; i++) { if (verificarColisao(coletor, moedas[i])) { moedas.splice(i, 1); i--; } }

    let profXAnterior = profFase2.x; let profYAnterior = profFase2.y;
    let distX = aluno.x - profFase2.x; let distY = aluno.y - profFase2.y; 
    let distTotal = Math.sqrt(distX * distX + distY * distY);

    if (distTotal > 0) { 
        profFase2.x += (distX / distTotal) * profFase2.velocidade; if (colidiuComCarteira(profFase2)) profFase2.x = profXAnterior; 
        profFase2.y += (distY / distTotal) * profFase2.velocidade; if (colidiuComCarteira(profFase2)) profFase2.y = profYAnterior; 
    }

    let moveX = profFase2.x - profXAnterior;
    let moveY = profFase2.y - profYAnterior;

    if (Math.abs(moveX) > Math.abs(moveY) && Math.abs(moveX) > 0.5) { 
        profFase2.linhaAnimacao = 1; profFase2.totalFrames = 9; profFase2.viradoEsquerda = (moveX < 0); 
    } else { 
        if (moveY > 0.5) { profFase2.linhaAnimacao = 0; profFase2.totalFrames = 8; profFase2.viradoEsquerda = false; } 
        else if (moveY < -0.5) { profFase2.linhaAnimacao = 2; profFase2.totalFrames = 9; profFase2.viradoEsquerda = false; }
    }

    if (verificarColisao(aluno, profFase2)) { alert("O professor te pegou! Fim de jogo."); limparTeclas(); iniciarFase2(); }
    if (verificarColisao(aluno, portaSaidaFase2)) { if (moedas.length === 0) { alert("Pegou as moedas e escapou! Indo para o 1º Andar..."); limparTeclas(); iniciarFase1(); } else { aluno.x = xAnterior; aluno.y = yAnterior; } }
}

function desenharFase2() {
    for (let c of carteiras) { desenharImg(imgCarteira, c.x, c.y, c.largura, c.altura, c.cor); }
    // Porta: imagem quando destrancada (moedas == 0); trancada fica cinza
    if (moedas.length === 0) { desenharImg(imgPorta, portaSaidaFase2.x, portaSaidaFase2.y, portaSaidaFase2.largura, portaSaidaFase2.altura, portaSaidaFase2.cor); }
    else { ctx.fillStyle = "#555555"; ctx.fillRect(portaSaidaFase2.x, portaSaidaFase2.y, portaSaidaFase2.largura, portaSaidaFase2.altura); }
    for (let m of moedas) { desenharImg(imgMoeda, m.x, m.y, m.largura, m.altura, m.cor); }

    desenharSprite(spritesheetProfessor2, profFase2);
    
    ctx.fillStyle = "#FFFFFF"; ctx.font = "20px Arial"; if (moedas.length > 0) { ctx.fillText("2º Andar: Colete " + moedas.length + " moedas para destrancar a porta!", 20, 20); } else { ctx.fillText("A porta abriu! CORRA PARA A SAÍDA!", 20, 20); }
}

// --- LÓGICA FASE 1 ---
function iniciarFase1() { faseAtual = 1; aluno.x = canvas.width / 2 - 30; aluno.y = 20; npcs.length = 0; framesFase1 = 0; }

function atualizarFase1() {
    moverAluno();
    framesFase1++; if (framesFase1 % 30 === 0 && npcs.length < 30) { let nasceEsquerda = Math.random() > 0.5; npcs.push({ x: nasceEsquerda ? 0 : canvas.width - 40, y: Math.random() * (canvas.height - 150) + 100, largura: 40, altura: 40, velX: (Math.random() * 3 + 2) * (nasceEsquerda ? 1 : -1), velY: (Math.random() * 3 + 2) * (Math.random() > 0.5 ? 1 : -1), cor: "#FFFF00" }); }
    for (let npc of npcs) { npc.x += npc.velX; npc.y += npc.velY; if (npc.x <= 0 || npc.x + npc.largura >= canvas.width) npc.velX *= -1; if (npc.y <= 0 || npc.y + npc.altura >= canvas.height) npc.velY *= -1; if (verificarColisao(aluno, npc)) { alert("Esbarrou em alguém! Volte pro início."); limparTeclas(); iniciarFase1(); return; } }
    if (verificarColisao(aluno, portaSaidaFase1)) { alert("Você saiu da faculdade! Prepare-se para a Rua..."); limparTeclas(); iniciarFaseFinal(); }
}
function desenharFase1() {
    desenharImg(imgPorta, portaSaidaFase1.x, portaSaidaFase1.y, portaSaidaFase1.largura, portaSaidaFase1.altura, portaSaidaFase1.cor);
    for (let npc of npcs) { desenharImg(imgNpc, npc.x, npc.y, npc.largura, npc.altura, npc.cor); }
    ctx.fillStyle = "#FFFFFF"; ctx.font = "20px Arial"; ctx.fillText("1º Andar: Saguão (Desvie dos alunos!)", 20, 20);
}

// --- LÓGICA FASE FINAL (A RUA) ---
function iniciarFaseFinal() { faseAtual = 4; aluno.x = canvas.width / 2 - 30; aluno.y = canvas.height - 90; }
function atualizarFaseFinal() {
    moverAluno();
    for (let carro of carros) { carro.x += carro.velocidade * carro.direcao; if (carro.direcao === 1 && carro.x > canvas.width) { carro.x = -carro.largura; } else if (carro.direcao === -1 && carro.x + carro.largura < 0) { carro.x = canvas.width; } if (verificarColisao(aluno, carro)) { alert("VOCÊ FOI ATROPELADO! Você perdeu o ônibus..."); limparTeclas(); iniciarFaseFinal(); return; } }
    if (verificarColisao(aluno, onibus)) { jogoAcabou = true; alert("PARABÉNS! VOCÊ ENTROU NO ÔNIBUS E ZEROU O JOGO!"); limparTeclas(); }
}
function desenharFaseFinal() {
    desenharImg(imgOnibus, onibus.x, onibus.y, onibus.largura, onibus.altura, onibus.cor);
    for (let carro of carros) {
        // o sprite do carro aponta p/ direita; espelha quando vai p/ esquerda (direcao === -1)
        desenharImgEspelhada(imgsCarro[carro.cor], carro.x, carro.y, carro.largura, carro.altura, carro.direcao === -1, carro.cor);
    }
    ctx.fillStyle = "#FFFFFF"; ctx.font = "20px Arial"; ctx.fillText("FASE FINAL: Atravesse a rua e pegue o ônibus!", 20, 20);
}


// ==========================================
// 5. FUNÇÃO DE DESENHO UNIVERSAL DO SPRITE
// ==========================================
function desenharSprite(imagem, obj) {
    if (!imagem.complete || imagem.naturalWidth === 0) return; 

    let larguraFrameReal = imagem.naturalWidth / obj.colunasSheet; 
    let alturaFrameReal = imagem.naturalHeight / obj.linhasSheet;  

    let sx = Math.floor(obj.frameAtual) * larguraFrameReal; 
    let sy = obj.linhaAnimacao * alturaFrameReal;          

    ctx.save(); 
    if (obj.viradoEsquerda) {
        ctx.scale(-1, 1);
        ctx.drawImage(imagem, sx, sy, larguraFrameReal, alturaFrameReal, -obj.x - obj.largura, obj.y, obj.largura, obj.altura);
    } else {
        ctx.drawImage(imagem, sx, sy, larguraFrameReal, alturaFrameReal, obj.x, obj.y, obj.largura, obj.altura);
    }
    ctx.restore(); 

    obj.frameAtual = (obj.frameAtual + obj.velocidadeAnim) % obj.totalFrames;
}

// ==========================================
// 6. LOOP PRINCIPAL DO JOGO
// ==========================================
function atualizar() {
    if (jogoAcabou) return;
    switch(faseAtual) { 
        case 3: atualizarFase3(); break; 
        case 2: atualizarFase2(); break; 
        case 1: atualizarFase1(); break; 
        case 4: atualizarFaseFinal(); break; 
    }
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo da fase primeiro (fica atrás de tudo)
    desenharFundo();

    // Desenha o Aluno (Lucca)
    if (spritesheetPrincipal.complete && spritesheetPrincipal.naturalWidth !== 0) { 
        desenharSprite(spritesheetPrincipal, aluno); 
    } else { 
        ctx.fillStyle = "#0096FF"; ctx.fillRect(aluno.x, aluno.y, aluno.largura, aluno.altura); 
    }

    // Desenha os elementos de cada fase
    switch(faseAtual) { 
        case 3: desenharFase3(); break; 
        case 2: desenharFase2(); break; 
        case 1: desenharFase1(); break; 
        case 4: desenharFaseFinal(); break; 
    }
}

function gameLoop() { atualizar(); desenhar(); requestAnimationFrame(gameLoop); }

gameLoop();