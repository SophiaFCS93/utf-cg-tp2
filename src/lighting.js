/************************************************************************
ACDICIONAR O PERSONAGEM
*************************************************************************/

//O PROFESSOR DEU A IDEIA DE SEPARAR POR CLASSES E PARA O PEIXE EU ACHEI UMA EXCELENTE IDEIA.
//O PEIXE TEM QUE MUDAR DE POSIÇÃO 
// O PEIXE TEM VÁRIAS CORES
//SEGUE O ARQUIVO "PEIXE.JS" chama fish agora, pq ficou tudo em ingles, bonito

/*O PEIXE VAI TER QUE VARIAS EM 3 POSIÇÕES QUANDO A TECLA P FOR PRESSIONADA.
  A IDEIA INICIAL É: 
    1. Próximo à parte frontal da cúpula.
    2. Escondido entre as algas.
    3. Descansando sobre a areia.
*/

/* O CONTROLE DAS POSIÇÕES ESTÁ NO EVENTO KEYDOWN QUE IDENTIFICA AS TECLAS 1 E 2.
VOU APRIVEITAR ESSE EVENTO PARA O TRATAMENTO DA TECLA P!!*/

/********************************************************************************
PARTE 6 - Fechar a cúpula e implementar opcionais: semiesfera, transparente, 
que permitirá enxergar os elementos internos.
********************************************************************************/

//FECHAMOS A CULPULA NA FUNÇÃO "DESENHARCENA", INVERTENDO O HEMISFÉRIO INFERIOR
// HÁ INTERESSE EM COLOCAR TEXTURA DE ÁGUA!! 

/************************************************************************
PARTE 7 - Configurar iluminação e materiais
*************************************************************************/
//A tecla L permitirá alternar entre a aparência com iluminação Phong e as cores originais. 
//calcula uma normal por face pois estamos usando low poly
//funciona quando vertices contém triângulos já separados
function calcularNormais(vertices) {

    const normais = [];

    // Cada triângulo possui 3 vértices.
    // Cada vértice possui coordenadas X, Y e Z.
    for (let i = 0; i < vertices.length; i += 9) {
        const p1 = vertices.slice(i, i + 3);
        const p2 = vertices.slice(i + 3, i + 6);
        const p3 = vertices.slice(i + 6, i + 9);

        const u = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];   // Vetor do primeiro lado

        const v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]]; // Vetor do segundo lado

        // Produto vetorial: normal à superfície
        const nx = u[1] * v[2] - u[2] * v[1];
        const ny = u[2] * v[0] - u[0] * v[2];
        const nz = u[0] * v[1] - u[1] * v[0];

        // Normaliza o vetor
        const comprimento = Math.hypot(nx, ny, nz) || 1;
        const normal = [nx / comprimento, ny / comprimento, nz / comprimento];

        // Os três vértices recebem a mesma normal.
        for (let j = 0; j < 3; j++) {
            normais.push(...normal);
        }
    }

    return normais;
}

// buffer com posições e normais
function criarBufferPhong(gl, vertices) {

    const normais = calcularNormais(vertices);

    const arrays = {
        a_position: {
            numComponents: 3,
            data: vertices
        },

        a_normal: {
            numComponents: 3,
            data: normais
        }
    };

    return twgl.createBufferInfoFromArrays(gl, arrays);
}

/*************************************************************************
    APLICAÇÃO DA ILUMINAÇÃO PHONG
**************************************************************************/
// controle para a luminosidade do cenário
let iluminacaoAtiva = true;
const luminosidadeCena = 0.65;

// Direção que aponta da superfície para a luz.
// Simula uma luz vindo de cima do aquário.
const direcaoLuz = [0.4, 1.0, 0.6];

// Propriedades dos materiais
const materiais = {

    coral: {
        ambiente: 0.35,
        difusa: 0.75,
        especular: 0.10,
        brilho: 8
    },

    alga: {
        ambiente: 0.40,
        difusa: 0.70,
        especular: 0.08,
        brilho: 8
    },

    concha: {
        ambiente: 0.35,
        difusa: 0.75,
        especular: 0.25,
        brilho: 20
    },

    peixe: {
        /*ambiente: 0.40,
        difusa: 0.70,
        especular: 0.45,
        brilho: 32*/
        ambiente: 0.12,
        difusa: 0.25,
        especular: 0.20,
        brilho: 32

    },

    ourico: {
        ambiente: 0.30,
        difusa: 0.75,
        especular: 0.08,
        brilho: 8
    },

    estrela: {
        ambiente: 0.40,
        difusa: 0.70,
        especular: 0.15,
        brilho: 12
    },

    bolacha: {
        ambiente: 0.45,
        difusa: 0.65,
        especular: 0.08,
        brilho: 8
    },

    anemona: {
        ambiente: 0.40,
        difusa: 0.70,
        especular: 0.12,
        brilho: 10
    },

    bauMadeira: {
        ambiente: 0.40,
        difusa: 0.70,
        especular: 0.10,
        brilho: 10
    },

    bauMetal: {
        ambiente: 0.30,
        difusa: 0.60,
        especular: 0.45,
        brilho: 40
    },

    bauOuro: {
        ambiente: 0.40,
        difusa: 0.70,
        especular: 0.60,
        brilho: 50
    },

};

// ILUMINAÇÃO PHONG COM EMISSÃO
// A BOLINHA AMARELA É EMISSORA DE LUZ PONTUAL 
function desenharObjetoPhong(
    buffer,
    modelo,
    cor,
    material,
    matrizCamera,
    posicaoCamera,
    emissao = 0.0
) {

    const matrizFinal = twgl.m4.multiply(matrizCamera, modelo); // Combina a câmera com a transformação do objeto 
    const matrizNormais = twgl.m4.transpose(twgl.m4.inverse(modelo));    // Transforma as normais
    gl.useProgram(programInfoPhong.program);
    twgl.setBuffersAndAttributes(gl, programInfoPhong, buffer);

    twgl.setUniforms(programInfoPhong, {
        u_matrix: matrizFinal,
        u_modelo: modelo,
        u_matrizNormais: matrizNormais,

        u_color: cor,
        u_direcaoLuz: direcaoLuz,
        u_posicaoCamera: posicaoCamera,

        u_ambiente: material.ambiente * luminosidadeCena,
        u_difusa: material.difusa * luminosidadeCena,
        u_especular: material.especular * luminosidadeCena,
        u_brilho: material.brilho,

        u_iluminacaoAtiva: iluminacaoAtiva,

        // Emissão própria da superfície
        u_emissao: emissao,
        u_corEmissao: [1.0, 0.95, 0.30],

        // Nova luz pontual do peixe abissal
        u_posicaoLuzPeixe: posicaoLuzPeixe || [0, 0, 0],

        // A luz pontual só funciona com Phong ligado e depois que o peixe tiver sido carregado
        u_luzPeixeAtiva:
            iluminacaoAtiva && posicaoLuzPeixe !== null
    });

    twgl.drawBufferInfo(gl, buffer);
}

/****************************************************************************************************************
    FUNÇÕES AUXILIARES
******************************************************************************************************************/

// Impede que as tonalidades (a_shade) do objeto anterior interfiram no próximo objeto desenhado.
// Estava interferindo, precisei de ajuda para resolver e resolvemos dessa forma
function zerarTonalidade() {
    const localTonalidade = gl.getAttribLocation(programInfo.program, "a_shade");

    if (localTonalidade !== -1) {
        gl.disableVertexAttribArray(localTonalidade);
        gl.vertexAttrib1f(localTonalidade, 1.0);
    }
}

// Depois de desenhar com o programa Phong: restaura o programa original e limpa o atributo de tonalidade
function restaurarProgramaOriginal() {
    gl.useProgram(programInfo.program);
    zerarTonalidade();
}