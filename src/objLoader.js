/****************************************************************************************************************
    LEITOR DE ARQUIVOS '.OBJ'
    Um único carregador usado por todos os modelos do cenário (concha, alga, estrela, ouriço, bolacha, corais).
******************************************************************************************************************/

/* ETAPA 1 e 2 - LER OS VÉRTICES E AS FACES DO OBJ (e triangular as faces)
   Quadrilátero: A B C D dividido em 2 triangulos!!!
   -> Triângulo 1: A B C
   -> Triângulo 2: A C D
   (funciona também com faces convexas que tenham mais de quatro vértices) */

function lerOBJ(conteudoOBJ) {
    const linhas = conteudoOBJ.split(/\r?\n/); // Divide o conteúdo do arquivo em linhas
    const vertices = []; // Posições dos vértices: x, y, z, x, y, z, ...
    const indices = []; // Índices das faces (já em triângulos)

    for (const linha of linhas) {

        // Linha de posição de vértice. Ex: v 0.5 1.0 0.3
        if (linha.startsWith("v ")) {
            const valores = linha.trim().split(/\s+/);
            const x = parseFloat(valores[1]);
            const y = parseFloat(valores[2]);
            const z = parseFloat(valores[3]);
            vertices.push(x, y, z);
        }

        // Linha de face. Ex: f 1/1/1 2/2/2 3/3/3
        if (linha.startsWith("f ")) {
            const valores = linha.trim().split(/\s+/);
            const indicesFace = [];

            for (let i = 1; i < valores.length; i++) {
                const indiceVertice = valores[i].split("/")[0]; // Ex: "10/5/3" -> "10"
                indicesFace.push(parseInt(indiceVertice, 10) - 1); // OBJ começa em 1; WebGL começa em 0.
            }

            for (let i = 1; i < indicesFace.length - 1; i++) {
                indices.push(indicesFace[0], indicesFace[i], indicesFace[i + 1]);
            }
        }
    }

    return { vertices, indices };
}

/* Organiza os vértices em triângulos já separados (necessário para calcular uma normal por face - Phong) */
function desindexarVertices(vertices, indices) {
    const verticesTriangulos = [];

    for (let i = 0; i < indices.length; i++) {
        const indice = indices[i] * 3; // Localiza a posição do vértice no array original

        // Copia as coordenadas X, Y e Z
        verticesTriangulos.push(
            vertices[indice],
            vertices[indice + 1],
            vertices[indice + 2]
        );
    }

    return verticesTriangulos;
}

/* CARREGA UM MODELO OBJ E CRIA OS DOIS BUFFERS (original e com normais para o Phong)
   • caminho: arquivo .obj
   • nome: usado nas mensagens do console. Ex: "a concha"
   • ajustarVertices (opcional): função que altera os vértices antes de criar os buffers (ex: centralizar o modelo)
   Devolve { buffer, bufferPhong } ou null se o arquivo não foi encontrado. */
async function carregarModeloOBJ(caminho, nome, ajustarVertices = null) {
    const resposta = await fetch(caminho); // Faz a requisição para buscar o arquivo OBJ

    // Verifica se o arquivo foi encontrado e carregado
    if (!resposta.ok) {
        console.error("Erro ao carregar " + nome + "!");
        return null;
    }

    const conteudoOBJ = await resposta.text(); // Converte o conteúdo do arquivo OBJ para texto
    const { vertices, indices } = lerOBJ(conteudoOBJ);

    if (ajustarVertices !== null) {
        ajustarVertices(vertices);
    }

    // Buffer com os vértices e índices do OBJ
    // const buffer = twgl.createBufferInfoFromArrays(gl, {
    //     a_position: {
    //         numComponents: 3,
    //         data: vertices
    //     },
    //     indices: new Uint16Array(indices)
    // });

    // Buffer com posições e normais (Phong)
    const bufferPhong = criarBufferPhong(
        gl,
        desindexarVertices(vertices, indices)
    );

    console.log("Modelo carregado com sucesso: " + nome);
    console.log("Vértices:", vertices.length / 3);
    console.log("Triângulos:", indices.length / 3);

    //return { buffer, bufferPhong };
    return { bufferPhong };
}