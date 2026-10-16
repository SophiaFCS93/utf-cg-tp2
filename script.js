/*******************************************************
→ IDEIA DE DIORAMA: AQUÁRIO  
→ TP2 - PARAÍSO SUBMERSO
*******************************************************/
//SOMENTE INICIALIZANDO O WEBGL2, PINTANDO O CANVAS DE AZUL PARA TERMOS UM CORPO INCIAL
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2");

gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); // Define a área de renderização
gl.clearColor(0.75, 0.88, 0.96, 1.0); //Define a cor de fundo do canvas como um azul bem clarinho e pastel
gl.clear(gl.COLOR_BUFFER_BIT); // Limpa o canvas com a cor definida 


/****************************************************************************************************************
PARTE 1 - Construir o chão circular de areia sobre o qual ficarão as pedras, algas, conchas e outros objetos
******************************************************************************************************************/ 
// Para desenhar um disco circular, usar vários triangulos que compattilham UM mesmo vértice central
// Uma grande quantidade de triangulos nos proporcionará um disco cada vez mais arredondado
// Como estamos trabalhando em 3D, temos os eixos x, y e Z. X = posição horizontal | Y = altura | Z = profundidade
// As posições dos pontos da borda são:  x = raio * cos(ângulo) | y = 0 | z = raio * sen(ângulo)


// VERTEX SHADER
const vertexShader = `#version 300 es
    in vec4 a_position;

    uniform mat4 u_matrix;

    void main() {
        gl_Position = u_matrix * a_position;
    }
`;

// FRAGMENT SHADER 
// Cor bege representando a areia
const fragmentShader = `#version 300 es
    precision highp float;

    out vec4 corFinal;

    void main() {
        corFinal = vec4(0.87, 0.76, 0.57, 1.0);
    }
`; 

// Cria o programa WebGL
const programInfo = twgl.createProgramInfo(gl, [vertexShader,fragmentShader]);

// Cria os vértices do chão circular
// Raio: define o tamanho do chão
// Segmentos: define quantos triangulos formarão o círculo ( quanto maior, melhor)
function criarChaoCircular(raio, segmentos) {
    const vertices = [];

    // Percorrendo todos os segmentos e calculando os ângulos de cada triângulo.
    for (let i = 0; i < segmentos; i++) {
        const angulo1 = i * 2 * Math.PI / segmentos;
        const angulo2 = (i + 1) * 2 * Math.PI / segmentos;

        // Centro do círculo
        vertices.push(0, 0, 0);

        // Segundo ponto da borda
        vertices.push(
            raio * Math.cos(angulo2),
            0,
            raio * Math.sin(angulo2)
        );

        // Primeiro ponto da borda
        vertices.push(
            raio * Math.cos(angulo1),
            0,
            raio * Math.sin(angulo1)
        );
    }

    return vertices;
}

// Chão com raio 3 e 64 triângulos = 192 posições de vértices ( quanto maior, melhor) | AUMENTA MAIS?
const verticesChao = criarChaoCircular(3, 64);

// Envia os vértices para a GPU
const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: {
        numComponents: 3,
        data: verticesChao
    }
});

// Ativa o teste de profundidade
// Habilitando a comparação de profundidade | permite que objetos mais próximos ocultem superfícies mais distante 
gl.enable(gl.DEPTH_TEST);

function desenharCena() {
    twgl.resizeCanvasToDisplaySize(canvas);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.75, 0.88, 0.96, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // PROJEÇÃO PERSPECTIVA
    const aspecto = gl.canvas.width / gl.canvas.height;

    const projecao = twgl.m4.perspective(
        45 * Math.PI / 180,
        aspecto,
        0.1,
        100
    );

    // POSIÇÃO DA CÂMERA
    const posicaoCamera = [5, 5, 7];
    const alvo = [0, 0, 0];
    const cima = [0, 1, 0];

    const camera = twgl.m4.lookAt(posicaoCamera,alvo,cima);

    const visualizacao = twgl.m4.inverse(camera);

    // Combina projeção e visualização
    const matriz = twgl.m4.multiply(projecao,visualizacao);

    gl.useProgram(programInfo.program);

    twgl.setBuffersAndAttributes(gl,programInfo,bufferInfo);

    twgl.setUniforms(programInfo, {u_matrix: matriz});

    // Desenha os triângulos
    twgl.drawBufferInfo(gl, bufferInfo);
}

desenharCena();


/*****************************************************************************************************************
PARTE 2 - Construir o hemisfério inferior - Parte infefior da "pokebola"
*****************************************************************************************************************/


/************************************************************************
PARTE 3 - Implementar as duas câmeras
*************************************************************************/


/************************************************************************
PARTE 4 - Adicionar os objetos 3D
*************************************************************************/


/************************************************************************
PARTE 5 - Adicionar o personagem
*************************************************************************/



/************************************************************************
PARTE 6 - Implementar modelagem hierárquica
*************************************************************************/


/************************************************************************
PARTE 7 - Configurar iluminação e materiais
*************************************************************************/ 


/**************************************************************************************************************************
PARTE 8- Fechar a cúpula e implementar opcionais: semiesfera, transparente, que permitirá enxergar os elementos internos.
*************************************************************************************************************************/


/************************************************************************
PARTE 9-  Fechar a cúpula e implementar opcionais
*************************************************************************/


/************************************************************************
PARTE 10 - Testar, documentar e publicar
*************************************************************************/