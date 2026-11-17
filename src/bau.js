/****************************************************************************************************************
    BAÚ DO TESOURO - OBJETO HIERÁRQUICO
    CORPO (pai, fixo): define a posição, a rotação e a escala do baú no diorama.
    TAMPA (filha, giratória): herda a matriz do corpo e gira em torno da dobradiça.

        matrizTampa = matrizCorpo × translate(pivô) × rotateX(ângulo)

    Cada material do baú está em um .obj separadocomo nos outros modelos do cenário
    e cada um tem a sua cor, definida aqui.
******************************************************************************************************************/

// Angulo em que a tampa fecha
const ANGULO_FECHAMENTO = Math.PI / 6; // 30°
const PERIODO_BAU = 6; // segundos para abrir e fechar uma vez

const bau = {
    posicao: [0.75, 0.03, -1.9], 
    rotacaoY: 0.7,               
    escala: 0.5,
    pivo: [0, 1.0, -0.65],     // Dobradiça, em coordenadas do corpo OH TREM RUIM

    // arquivo, cor, material e o buffer
    corpo: [
        { caminho: "assets/models/bau/bau_madeira.obj", cor: [0.319, 0.133, 0.058, 1.0], material: "bauMadeira", buffer: null },
        { caminho: "assets/models/bau/bau_metal.obj", cor: [0.233, 0.233, 0.233, 1.0], material: "bauMetal", buffer: null },
        { caminho: "assets/models/bau/bau_ouro.obj", cor: [0.800, 0.518, 0.111, 1.0], material: "bauOuro", buffer: null }
    ],
    tampa: [
        { caminho: "assets/models/bau/bau_tampa.obj", cor: [0.319, 0.133, 0.058, 1.0], material: "bauMadeira", buffer: null },
        { caminho: "assets/models/bau/bau_tampa_metal.obj", cor: [0.233, 0.233, 0.233, 1.0], material: "bauMetal", buffer: null }
    ]
};

/* CARREGA TODAS AS PARTES DO BAÚ (corpo e tampa) */
async function carregarBau() {
    for (const parte of [...bau.corpo, ...bau.tampa]) {
        const modelo = await carregarModeloOBJ(parte.caminho, "o baú");
        if (modelo === null) continue;
        parte.buffer = modelo.bufferPhong;
    }

    bau.carregado = true;
}
carregarBau();

/* ANGULO DA TAMPA NO INSTANTE 'tempo' (ms): 0 = aberta original e ANGULO_FECHAMENTO = fechada */
function calcularAnguloTampa(tempo) {
    const fase = (tempo / 1000) * (2 * Math.PI / PERIODO_BAU);
    const fechamento = 0.5 - 0.5 * Math.cos(fase); // vai de 0 a 1 e volta a 0
    return fechamento * ANGULO_FECHAMENTO;
}

function desenharPartesBau(partes, modelo, matriz, posicaoCamera) {
    for (const parte of partes) {
        if (parte.buffer === null) continue; // o .obj ainda não terminou de carregar
        desenharObjetoPhong(parte.buffer, modelo, parte.cor, materiais[parte.material], matriz, posicaoCamera);
    }
}

/* DESENHA O BAÚ (CORPO + TAMPA) */
function desenharBau(matriz, posicaoCamera, tempo) {

    /* PAI: CORPO */
    let modeloCorpo = twgl.m4.identity();
    modeloCorpo = twgl.m4.translate(modeloCorpo, bau.posicao);
    modeloCorpo = twgl.m4.rotateY(modeloCorpo, bau.rotacaoY);
    modeloCorpo = twgl.m4.scale(modeloCorpo, [bau.escala, bau.escala, bau.escala]);

    desenharPartesBau(bau.corpo, modeloCorpo, matriz, posicaoCamera);

    /* FILHA: TAMPA - parte da matriz do corpo, vai até a dobradiça e gira em torno dela */
    let modeloTampa = twgl.m4.translate(modeloCorpo, bau.pivo);
    modeloTampa = twgl.m4.rotateX(modeloTampa, calcularAnguloTampa(tempo));

    desenharPartesBau(bau.tampa, modeloTampa, matriz, posicaoCamera);

    restaurarProgramaOriginal();
}