/* PARTE 5 - PERSONAGEM: PEIXE  E PARTE 7 - ILUMINAÇÃO PHONG*/
class Peixe {

    constructor(gl, programInfo) {
        this.gl = gl; // Contexto WebGL2
        // this.programInfo = programInfo; // Programa de shaders do diorama

        // AQUI SERIA PARA UMA UNICA POSIÇÃO MAS O PEIXINHO TEM QUE FICAR NA PISIÇÃO INICIAL E MAIS 3 
        this.escala = 1.0; // Tamanho inicial

        // POSIÇÕES ALTERNATIVAS DO PERSONAGEM
        // A e rotacaoY faz o peixe virar horizontalmente
        // A rotacaoZ faz o corpo ficar inclinado
        this.posicoes = [
            {
                nome: "Posição inicial",
                posicao: [0.0, 1.2, 0.0],
                rotacaoY: 0,
                rotacaoZ: 0
            },
            {
                nome: "Curioso",
                posicao: [0.0, 1.2, 1.5],
                rotacaoY: -3 * Math.PI / 4,
                rotacaoX: Math.PI / 8, // Inclinação de 20°
                rotacaoZ: 0
            },
            {
                nome: "Escondido nas algas",
                posicao: [-0.8, 0.85, -1.4],
                rotacaoY: Math.PI / 2,
                rotacaoZ: 0
            },
            {
                nome: "Descansando na areia",
                posicao: [1.8, 0.7, 1.0],
                rotacaoY: 0,
                rotacaoZ: -Math.PI / 50
            }
        ];

        this.posicaoAtual = 0;
        this.posicao = [...this.posicoes[0].posicao];
        this.rotacao = this.posicoes[0].rotacaoY;
        this.inclinacao = this.posicoes[0].rotacaoZ;
        this.inclinacaoX = this.posicoes[0].rotacaoX || 0;

        this.buffers = []; // Guarda os buffers das partes do peixe
        this.carregado = false; // Indica se o modelo foi carregado
        this.posicaoLuzLocal = null; // PARTE 7 - Posição da bolinha luminosa no modelo

        this.caminhoOBJ = "assets/personagem/peixe/model.obj";
        this.caminhoMTL = "assets/personagem/peixe/materials.mtl";
    }

    /* CARREGA O MODELO 3D E SEUS MATERIAIS */
    async carregar() {

        try {
            const respostaOBJ = await fetch(this.caminhoOBJ); // Busca o arquivo OBJ
            const respostaMTL = await fetch(this.caminhoMTL); // Busca o arquivo MTL

            if (!respostaOBJ.ok || !respostaMTL.ok) {
                throw new Error("Não foi possível carregar o OBJ ou MTL do peixe!");
            }

            const conteudoOBJ = await respostaOBJ.text();
            const conteudoMTL = await respostaMTL.text();

            const vertices = []; // Posições dos vértices
            const materiais = {}; // Cores dos materiais
            const grupos = {}; // Faces separadas por material

            /* ETAPA 1 - LER AS CORES DO MTL */

            let materialAtual = "";

            for (const linha of conteudoMTL.split(/\r?\n/)) {

                const valores = linha.trim().split(/\s+/);

                if (valores[0] === "newmtl") {
                    materialAtual = valores.slice(1).join(" "); // Nome do material
                }

                if (valores[0] === "Kd" && materialAtual) {
                    materiais[materialAtual] = [
                        parseFloat(valores[1]),
                        parseFloat(valores[2]),
                        parseFloat(valores[3]),
                        1.0
                    ];
                }
            }

            /* ETAPA 2 - LER OS VÉRTICES E AS FACES DO OBJ */
            materialAtual = "padrao";

            for (const linha of conteudoOBJ.split(/\r?\n/)) {

                const valores = linha.trim().split(/\s+/);

                if (valores[0] === "v") {
                    const x = parseFloat(valores[1]);
                    const y = parseFloat(valores[2]);
                    const z = parseFloat(valores[3]);
                    vertices.push(x, y, z);
                }

                if (valores[0] === "usemtl") {
                    materialAtual = valores.slice(1).join(" "); // Seleciona o material
                }

                if (valores[0] === "f") {

                    if (!grupos[materialAtual]) grupos[materialAtual] = [];

                    const indicesFace = [];
                    const quantidadeVertices = vertices.length / 3;

                    for (let i = 1; i < valores.length; i++) {
                        const indiceOBJ = parseInt(valores[i].split("/")[0], 10);
                        const indice = indiceOBJ > 0 ? indiceOBJ - 1 : quantidadeVertices + indiceOBJ;
                        indicesFace.push(indice);
                    }

                    // Divide a face em triângulos
                    for (let i = 1; i < indicesFace.length - 1; i++) {

                        const triangulo = [indicesFace[0], indicesFace[i], indicesFace[i + 1]];

                        for (const indice of triangulo) {
                            const inicio = indice * 3;
                            grupos[materialAtual].push(vertices[inicio], vertices[inicio + 1], vertices[inicio + 2]);
                        }
                    }
                }
            }

            /* ETAPA 3 - ENCONTRAR O CENTRO DO PEIXE */
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;

            for (let i = 0; i < vertices.length; i += 3) {
                minX = Math.min(minX, vertices[i]);
                maxX = Math.max(maxX, vertices[i]);
                minY = Math.min(minY, vertices[i + 1]);
                maxY = Math.max(maxY, vertices[i + 1]);
                minZ = Math.min(minZ, vertices[i + 2]);
                maxZ = Math.max(maxZ, vertices[i + 2]);
            }

            const centroX = (minX + maxX) / 2;
            const centroY = (minY + maxY) / 2;
            const centroZ = (minZ + maxZ) / 2;

            /* ETAPA 4 - CRIAR OS BUFFERS DOS MATERIAIS */
            this.buffers = [];

            for (const nomeMaterial in grupos) {

                const posicoes = grupos[nomeMaterial];

                // Centraliza a geometria
                for (let i = 0; i < posicoes.length; i += 3) {
                    posicoes[i] -= centroX;
                    posicoes[i + 1] -= centroY;
                    posicoes[i + 2] -= centroZ;
                }

                /* PARTE 7 - LOCALIZAR A BOLINHA LUMINOSA */
                if (nomeMaterial === "mat12") {

                    let minX = Infinity;
                    let maxX = -Infinity;

                    let minY = Infinity;
                    let maxY = -Infinity;

                    let minZ = Infinity;
                    let maxZ = -Infinity;

                    // Percorre os vértices da parte amarela
                    for (let i = 0; i < posicoes.length; i += 3) {

                        minX = Math.min(minX, posicoes[i]);
                        maxX = Math.max(maxX, posicoes[i]);

                        minY = Math.min(minY, posicoes[i + 1]);
                        maxY = Math.max(maxY, posicoes[i + 1]);

                        minZ = Math.min(minZ, posicoes[i + 2]);
                        maxZ = Math.max(maxZ, posicoes[i + 2]);
                    }

                    // Calcula o centro da bolinha amarela
                    this.posicaoLuzLocal = [
                        (minX + maxX) / 2,
                        (minY + maxY) / 2,
                        (minZ + maxZ) / 2
                    ];

                    console.log(
                        "Posição local da luz do peixe:",
                        this.posicaoLuzLocal
                    );
                }

                // Cria um buffer com posições e normais para Phong
                const buffer = criarBufferPhong(
                    this.gl,
                    posicoes
                );

                // Obtém a cor original do arquivo MTL
                const cor = materiais[nomeMaterial] ||
                    [0.60, 0.40, 0.70, 1.0];

                // Identifica materiais amarelos e luminosos
                const ehBolinhaLuminosa =
                    cor[0] >= 0.80 &&
                    cor[1] >= 0.65 &&
                    cor[2] <= 0.40;

                // Define a intensidade da emissão
                const emissao = ehBolinhaLuminosa ? 0.85 : 0.0;

                // Guarda o buffer, sua cor e a emissão
                this.buffers.push({
                    buffer: buffer,
                    cor: cor,
                    emissao: emissao
                });

                // Permite conferir os materiais no console
                console.log(
                    "Material do peixe:",
                    nomeMaterial,
                    "Cor:", cor,
                    "Emissão:", emissao
                );

            }

            this.carregado = this.buffers.length > 0;

            console.log("Peixe carregado com sucesso!");
            console.log("Vértices:", vertices.length / 3);
            console.log("Partes com materiais:", this.buffers.length);

        } catch (erro) {
            console.error("Erro ao carregar o peixe:", erro);
        }
    }

    // /* ATUALIZA O PERSONAGEM */
    // atualizar(deltaTime) {

    //     // Futuramente, colocaremos a animação do peixe aqui SERÁ?
    // }

    /* ALTERNA ENTRE AS TRÊS POSIÇÕES DO PEIXE */
    // COM AJUDA! operador % faz a alternância funcionar continuamente! Assim dá certo!
    alternarPosicao() {
        this.irParaPosicao((this.posicaoAtual + 1) % this.posicoes.length);
    }

    // Vai direto para uma das posições (usado pela tecla P e pelos botões da tela)
    irParaPosicao(indice) {
        this.posicaoAtual = indice;
        const novaPosicao = this.posicoes[this.posicaoAtual];
        this.posicao = [...novaPosicao.posicao];
        this.rotacao = novaPosicao.rotacaoY;
        this.inclinacao = novaPosicao.rotacaoZ;
        console.log("Posição do peixe:", novaPosicao.nome);
        this.inclinacaoX = novaPosicao.rotacaoX || 0;
    }

    /* MATRIZ DE MODELAGEM DO PEIXE (posição, rotações e escala atuais) */
    calcularMatrizModelo() {

        // Cria a matriz de modelagem do peixe
        let modeloPeixe = twgl.m4.identity();

        // Mantém a posição atual
        modeloPeixe = twgl.m4.translate(
            modeloPeixe,
            this.posicao
        );

        // Mantém a rotação horizontal
        modeloPeixe = twgl.m4.rotateY(
            modeloPeixe,
            this.rotacao
        );

        // Mantém a inclinação no eixo X
        modeloPeixe = twgl.m4.rotateX(
            modeloPeixe,
            this.inclinacaoX
        );

        // Mantém a inclinação no eixo Z
        modeloPeixe = twgl.m4.rotateZ(
            modeloPeixe,
            this.inclinacao
        );

        // Mantém o tamanho original
        modeloPeixe = twgl.m4.scale(
            modeloPeixe,
            [this.escala, this.escala, this.escala]
        );

        return modeloPeixe;
    }

    //PARTE 7 - POSIÇÃO DA LUZ PONTUAL DO PEIXE
    obterPosicaoLuzMundo() {

        // Aguarda a identificação da bolinha
        if (!this.posicaoLuzLocal) {
            return null;
        }

        // Converte a posição da bolinha
        // para as coordenadas do mundo 3D
        return twgl.m4.transformPoint(
            this.calcularMatrizModelo(),
            this.posicaoLuzLocal
        );
    }

    /* DESENHA O PEIXE NO DIORAMA */
    desenhar(matriz, posicaoCamera) {

        // Aguarda o carregamento do modelo OBJ e seus materiais
        if (!this.carregado) return;

        // Cria a matriz de modelagem do peixe
        let modeloPeixe = this.calcularMatrizModelo();

        // Desenha cada parte do peixe com Phong e com emissão nas partes luminosas
        for (const parte of this.buffers) {

            desenharObjetoPhong(
                parte.buffer,
                modeloPeixe,
                parte.cor,
                materiais.peixe,
                matriz,
                posicaoCamera,
                parte.emissao
            );
        }
    }
}

/* PARTE 5 - PERSONAGEM */
// const peixe = new Peixe(gl, programInfo);
const peixe = new Peixe(gl);
peixe.carregar();
let posicaoLuzPeixe = null; // Posição da luz amarela no mundo 3D
