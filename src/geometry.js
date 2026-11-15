/****************************************************************************************************************
    CHÃO DO DIORAMA - CRIAÇÃO DA GEOMETRIA CIRCULAR E TEXTURA
******************************************************************************************************************/
// Cria os vértices que formam o chão circular
// Raio: define o tamanho do chão
// Segmentos: Define a quantidade de triângulos do disco | Quanto mais segmentos, mais arredondada será a borda
function criarChaoCircular(raio, segmentos) {
    const vertices = [];

    // Percorrendo todos os segmentos e calculando os ângulos de cada triângulo.
    for (let i = 0; i < segmentos; i++) {
        const angulo1 = i * 2 * Math.PI / segmentos;
        const angulo2 = (i + 1) * 2 * Math.PI / segmentos;
        vertices.push(0, 0, 0); // Centro do círculo    
        vertices.push(raio * Math.cos(angulo2), 0, raio * Math.sin(angulo2)); // Segundo ponto da borda
        vertices.push(raio * Math.cos(angulo1), 0, raio * Math.sin(angulo1)  //Primeiro ponto da borda
        );
    }

    return vertices;
}

const caminhoAreia = "assets/texturasChao/areia.jpg"; /* TEXTURA DE AREIA NO CHÃO*/

// Carrega a imagem da areia para uma textura WebGL
const texturaAreia = twgl.createTexture(gl, {
    src: caminhoAreia,
    flipY: true, //inverte verticalmente a imagem ao carregá-la
    min: gl.LINEAR_MIPMAP_LINEAR, // define como a textura é filtrada quando aparece menor
    mag: gl.LINEAR, // define como a textura é filtrada quando aparece maior
    wrap: gl.CLAMP_TO_EDGE // define o comportamento nas bordas da imagem
});

/* PARTE 1 - CRIA O CHÃO COM COORDENADAS DE TEXTURA */
const verticesChao = criarChaoCircular(3, 64); // mantém o círculo original
const coordenadasTextura = []; // guarda as coordenadas UV

// Percorre os vértices do chão
for (let i = 0; i < verticesChao.length; i += 3) {
    const x = verticesChao[i]; // Coordenada X do vértice
    const z = verticesChao[i + 2]; // Coordenada Z do vértice
    const u = (x + 3) / 6; // Converte X para U
    const v = (z + 3) / 6; // Converte Z para V
    coordenadasTextura.push(u, v); // Guarda as coordenadas UV
}

// Cria o buffer do chão com posições e coordenadas UV
const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 3, data: verticesChao },
    a_texcoord: { numComponents: 2, data: coordenadasTextura }
});

/****************************************************************************************************************
    HEMISFÉRIO INFERIOR DO DIORAMA, COMO UMA POKEBOLA
******************************************************************************************************************/
function criarHemisferioInferior(raio, segmentos, divisoes) {
    const vertices = [];

    // Calcula a posição de um ponto na semiesfera
    // θ: percorre a circunferência horizontalmente, de 0° até 360°
    // φ: controla quanto descemos da borda do disco em direção ao fundo da semiesfera, de 0° até 90°
    function calcularPonto(theta, phi) {
        const x = raio * Math.cos(phi) * Math.cos(theta);
        const y = -raio * Math.sin(phi);
        const z = raio * Math.cos(phi) * Math.sin(theta);
        return [x, y, z];
    }

    // Percorre as divisões verticais
    for (let j = 0; j < divisoes; j++) {
        const phi1 = j * (Math.PI / 2) / divisoes;
        const phi2 = (j + 1) * (Math.PI / 2) / divisoes;

        // Percorre os segmentos ao redor da semiesfera
        for (let i = 0; i < segmentos; i++) {
            const theta1 = i * 2 * Math.PI / segmentos;
            const theta2 = (i + 1) * 2 * Math.PI / segmentos;

            // Quatro pontos da superfície
            const a = calcularPonto(theta1, phi1);
            const b = calcularPonto(theta2, phi1);
            const c = calcularPonto(theta1, phi2);
            const d = calcularPonto(theta2, phi2);

            // Primeiro triângulo
            vertices.push(...a, ...c, ...b);

            // Segundo triângulo
            vertices.push(...b, ...c, ...d);
        }
    }

    return vertices;
}

/* PARTE 2 */
const verticesHemisferio = criarHemisferioInferior(3, 64, 16);// Cria os vértices do hemisfério inferior

const bufferHemisferio = twgl.createBufferInfoFromArrays(gl, {
    a_position: {
        numComponents: 3,
        data: verticesHemisferio
    } // Envia os vértices para a GPU
});