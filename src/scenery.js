/* Buffers da concha (declarados aqui, junto com o carregamento do modelo) */
let bufferConcha = null;// Buffer original da concha
let bufferConchaPhong = null; // Buffer com posições e normais para Phong

/*********************************************************************************
                    PARTE 4 - Adicionar os objetos 3D
// ********************************************************************************/
//USAR ARQUIVOS '.OBJ' POIS GLTF DÁ MUITO TRABALHO! DEIXA GLTF PARA O PERSONAGEM, SE FOR NECESSÁRIO
// Todos usam o mesmo carregador: carregarModeloOBJ() (src/objLoader.js)
// Os buffers da concha (bufferConcha e bufferConchaPhong) são declarados logo abaixo

/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   CONCHA 1   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoConcha = "assets/models/concha/TurretShell.obj";

async function carregarConcha() {
    const modelo = await carregarModeloOBJ(caminhoConcha, "a concha");
    if (modelo === null) return;

    //bufferConcha = modelo.buffer;
    bufferConchaPhong = modelo.bufferPhong;
}
carregarConcha();

/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   ALGA 1   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoAlga = "assets/models/alga/SeaWeed.obj";
let bufferAlga = null;      // Buffer original
let bufferAlgaPhong = null; // Buffer com normais para Phong

async function carregarAlga() {
    const modelo = await carregarModeloOBJ(caminhoAlga, "a alga");
    if (modelo === null) return;

    //bufferAlga = modelo.buffer;
    bufferAlgaPhong = modelo.bufferPhong;
}
carregarAlga();

/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   ESTRELA DO MAR - CONJUNTO   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoEstrela = "assets/models/estrela/starfish.obj";
let bufferEstrela = null;      // Buffer original
let bufferEstrelaPhong = null; // Buffer com normais para Phong

async function carregarEstrela() {
    const modelo = await carregarModeloOBJ(caminhoEstrela, "as estrelas-do-mar");
    if (modelo === null) return;

    //bufferEstrela = modelo.buffer;
    bufferEstrelaPhong = modelo.bufferPhong;
}
carregarEstrela();

/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   OURIÇO   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoOurico = "assets/models/ourico/Mesh_SeaUrchin.obj";
let bufferOurico = null;      // Buffer original
let bufferOuricoPhong = null; // Buffer com normais para Phong

async function carregarOurico() {
    const modelo = await carregarModeloOBJ(caminhoOurico, "o ouriço-do-mar");
    if (modelo === null) return;

    //bufferOurico = modelo.buffer;
    bufferOuricoPhong = modelo.bufferPhong;
}
carregarOurico();

/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   BOLACHA-DO-MAR   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoBolacha = "assets/models/bolacha/Mesh_SandDollar.obj";
let bufferBolacha = null;      // Buffer original
let bufferBolachaPhong = null; // Buffer com normais para Phong

async function carregarBolacha() {
    const modelo = await carregarModeloOBJ(caminhoBolacha, "a bolacha-do-mar");
    if (modelo === null) return;

    //bufferBolacha = modelo.buffer;
    bufferBolachaPhong = modelo.bufferPhong;
}
carregarBolacha();

/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   CORAIS  1   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoCoral = "assets/models/coral/Coraal.obj";
let bufferCoral = null;      // Buffer original
let bufferCoralPhong = null; // Buffer com normais para Phong

async function carregarCoral() {
    const modelo = await carregarModeloOBJ(caminhoCoral, "o coral");
    if (modelo === null) return;

    //bufferCoral = modelo.buffer;
    bufferCoralPhong = modelo.bufferPhong;
}
carregarCoral();

/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   CORAIS 2   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoKelp5 = "assets/models/coral/kelp5.obj";
let bufferKelp5 = null;      // Buffer original
let bufferKelp5Phong = null; // Buffer com normais para Phong

// Centraliza o modelo e coloca sua base em Y = 0
function centralizarBaseKelp5(vertices) {
    // Encontra os limites do modelo original
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i < vertices.length; i += 3) {
        minX = Math.min(minX, vertices[i]);
        maxX = Math.max(maxX, vertices[i]);
        minY = Math.min(minY, vertices[i + 1]);
        minZ = Math.min(minZ, vertices[i + 2]);
        maxZ = Math.max(maxZ, vertices[i + 2]);
    }

    // Centraliza o modelo e coloca sua base em Y = 0
    const centroX = (minX + maxX) / 2;
    const centroZ = (minZ + maxZ) / 2;

    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i] -= centroX;
        vertices[i + 1] -= minY;
        vertices[i + 2] -= centroZ;
    }
}

/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   ANÊMONA   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoAnemona = "assets/models/anemona/CHAHIN_ANEMONE.obj";
let bufferAnemona = null;      // Buffer original
let bufferAnemonaPhong = null; // Buffer com normais para Phong

async function carregarAnemona() {
    const modelo = await carregarModeloOBJ(caminhoAnemona, "a anêmona", centralizarBaseKelp5);
    if (modelo === null) return;

    //=bufferAnemona = modelo.buffer;
    bufferAnemonaPhong = modelo.bufferPhong;
}
carregarAnemona();

async function carregarKelp5() {
    const modelo = await carregarModeloOBJ(caminhoKelp5, "o Kelp 5", centralizarBaseKelp5);
    if (modelo === null) return;

    //bufferKelp5 = modelo.buffer;
    bufferKelp5Phong = modelo.bufferPhong;
}
carregarKelp5();

/****************************************************************************************************************
    CENÁRIO - OBJETOS 3D DO DIORAMA
    • Cada grupo tem um modelo (buffer), um material e a lista de cópias (instâncias) que aparecem no diorama.
    • Cada instância tem posição e escala. Quando necessário também tem: rotacaoY, rotacaoZ, cor própria
      (se não tiver, usa a cor do grupo) e correcao (deslocamento aplicado depois da escala).
    • A ordem dos grupos é a ordem em que são desenhados.
******************************************************************************************************************/
const cenario = [

    /* 1. CONCHA */
    {
        buffer: () => bufferConchaPhong, // função, porque o buffer só existe depois que o .obj carregar
        material: "concha",
        cor: [0.60, 0.38, 0.23, 1.0],
        instancias: [
            // Mantém as rotações (Y e Z) e a escala originais
            { posicao: [1.35, 0.08, 0.15], rotacaoY: -Math.PI / 2, rotacaoZ: Math.PI / 2, escala: 12 }
        ]
    },

    /* 2. ALGAS (dez) - as cinco últimas têm tom de verde e rotação próprios */
    {
        buffer: () => bufferAlgaPhong,
        material: "alga",
        cor: [0.12, 0.48, 0.20, 1.0],
        instancias: [
            { posicao: [-1.1, 0.05, -1], escala: 0.95 },
            { posicao: [-0.25, 0.05, -1.5], escala: 0.6 },
            { posicao: [-1.65, 0.05, -0.35], escala: 0.7 },
            { posicao: [-1.65, 0.05, 0.85], escala: 0.5 },
            { posicao: [-1.55, 0.05, 0.6], escala: 0.6 },
            { posicao: [-0.6, 0.05, -1.75], rotacaoY: 1, escala: 0.75, cor: [0.08, 0.40, 0.25, 1.0] },
            { posicao: [-1.5, 0.05, -1.3], rotacaoY: 2.2, escala: 0.6, cor: [0.20, 0.58, 0.25, 1.0] },
            { posicao: [-1.8, 0.05, -0.9], rotacaoY: 1.5, escala: 0.5, cor: [0.15, 0.50, 0.20, 1.0] },
            { posicao: [-1.2, 0.05, 0.5], rotacaoY: 3.5, escala: 0.6, cor: [0.10, 0.45, 0.20, 1.0] },
            { posicao: [-1.8, 0.05, 1.2], rotacaoY: 4, escala: 0.5, cor: [0.15, 0.50, 0.20, 1.0] }
        ]
    },

    /* 3. CONJUNTO DE ESTRELAS DO MAR */
    {
        buffer: () => bufferEstrelaPhong,
        material: "estrela",
        cor: [0.80, 0.35, 0.05, 1.0],
        instancias: [
            { posicao: [0.55, 0.03, 0.55], escala: 0.18 }
        ]
    },

    /* 4. OURIÇOS (três) */
    {
        buffer: () => bufferOuricoPhong,
        material: "ourico",
        cor: [0.0, 0.0, 0.0, 1.0],
        instancias: [
            { posicao: [-1.12, 0.04, -0.43], escala: 0.12 },
            //{ posicao: [0.29, 0.05, -1.46], escala: 0.12 },
            { posicao: [-0.88, 0.05, 0.56], escala: 0.12 }
        ]
    },

    /* 5. BOLACHA DO MAR */
    {
        buffer: () => bufferBolachaPhong,
        material: "bolacha",
        cor: [0.91, 0.85, 0.72, 1.0],
        instancias: [
            { posicao: [0.9, 0.03, 1.55], escala: 0.014 }
        ]
    },

    /* 6. CORAIS (três) */
    {
        buffer: () => bufferCoralPhong,
        material: "coral",
        instancias: [
            { posicao: [-0.42, 0.03, 2], escala: 0.18, cor: [0.68, 0.16, 0.36, 1.0], correcao: [75.49, -1.10, -0.65] },
            { posicao: [-0.23, 0.03, -0.8], escala: 0.14, cor: [0.56, 0.35, 0.70, 1.0], correcao: [75.49, -1.10, -0.65] },
            { posicao: [-1.52, 0.03, 2], escala: 0.15, cor: [0.93, 0.50, 0.28, 1.0], correcao: [75.49, -1.10, -0.65] }
        ]
    },

    /* 7. CORAIS 2 (kelp5) (quatro) */
    {
        buffer: () => bufferKelp5Phong,
        material: "coral",
        instancias: [
            { posicao: [-0.83, 0.05, -1.67], escala: 0.45, cor: [0.72, 0.24, 0.22, 1.0] },
            { posicao: [-1.83, 0.07, 0.4], escala: 0.3, cor: [0.75, 0.55, 0.15, 1.0] },
            //{ posicao: [1.15, 0.05, 0.68], escala: 0.3, cor: [0.85, 0.35, 0.55, 1.0] },
            //{ posicao: [1.95, 0.05, 0.15], escala: 0.3, cor: [0.55, 0.35, 0.70, 1.0] }
        ]
    },

    /* 8. ANÊMONA */
    {
        buffer: () => bufferAnemonaPhong,
        material: "anemona",
        cor: [0.85, 0.35, 0.55, 1.0], // rosa; ajuste ao gosto
        instancias: [
            { posicao: [-1, 0.05, 1.3], rotacaoY: 4, escala: 0.45 }
        ]
    }
];

/* DESENHA TODAS AS INSTÂNCIAS DE UM GRUPO COM ILUMINAÇÃO PHONG */
function desenharGrupo(grupo, matriz, posicaoCamera) {
    const buffer = grupo.buffer();

    if (buffer === null) return; // O modelo ainda não terminou de carregar

    for (const instancia of grupo.instancias) {

        let modelo = twgl.m4.identity(); // Cria a matriz de modelagem

        modelo = twgl.m4.translate(modelo, instancia.posicao); // Posiciona o objeto na areia

        if (instancia.rotacaoY !== undefined) {
            modelo = twgl.m4.rotateY(modelo, instancia.rotacaoY);
        }

        if (instancia.rotacaoZ !== undefined) {
            modelo = twgl.m4.rotateZ(modelo, instancia.rotacaoZ);
        }

        // Define o tamanho individual
        modelo = twgl.m4.scale(modelo, [instancia.escala, instancia.escala, instancia.escala]);

        if (instancia.correcao !== undefined) {
            modelo = twgl.m4.translate(modelo, instancia.correcao);
        }

        desenharObjetoPhong(
            buffer,
            modelo,
            instancia.cor || grupo.cor,
            materiais[grupo.material],
            matriz,
            posicaoCamera
        );
    }

    restaurarProgramaOriginal(); // Evita interferência nos próximos objetos
}