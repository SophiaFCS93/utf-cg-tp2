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
PARTE 1 - Construir o chão circular de areia sobre o qual ficarão as pedras, algas, conchas e outros 
PARTE 2 - Construir o hemisfério inferior - Parte inferior da "pokebola"
******************************************************************************************************************/ 
/* PARA O CHÃO: 
Para desenhar um disco circular, usar vários triangulos que compattilham UM mesmo vértice central
Uma grande quantidade de triangulos nos proporcionará um disco cada vez mais arredondado
Como estamos trabalhando em 3D, temos os eixos x, y e Z. X = posição horizontal | Y = altura | Z = profundidade
As posições dos pontos da borda são:  x = raio * cos(ângulo) | y = 0 | z = raio * sen(ângulo)*/ 

/* PARA A SEMIESFERA INFERIOR DA POKEBOLA
Para desenhar um hemisfério, usamos vários triângulos conectados que formam uma superfície curva
Diferentemente do chão precisou-se de DOIS ângulos para calcular os vértices θ e φ°
x = raio * cos(phi) * cos(theta) | y = -raio * sen(phi) | z = raio * cos(phi) * sen(theta)
O valor negativo de Y faz com que o hemisfério seja construído abaixo do chão de areia (Y = 0)
A superfície é dividida em pequenas regiões, cada uma formada por DOIS triângulos
Quanto maior a quantidade de segmentos e divisões, mais arredondado e suave será o hemisfério
Aqui, usamos 64 × 16 × 2 = 2.048 triângulos gerados.*/


// VERTEX SHADER
const vertexShader = `#version 300 es
    in vec4 a_position;

    uniform mat4 u_matrix;

    void main() {
        gl_Position = u_matrix * a_position;
    }
`;

// FRAGMENT SHADER 
// Antes: Cor bege representando a areia → corFinal = vec4(0.87, 0.76, 0.57, 1.0);
// Agora: o JS pode enviar uma cor diferente para cada objeto | FLEXIBILIZAÇÃO 
const fragmentShader = `#version 300 es
    precision highp float;

    uniform vec4 u_color; 
    
    out vec4 corFinal;

    void main() {
        corFinal = u_color;
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


/* PARTE 2 → */
function criarHemisferioInferior(raio, segmentos, divisoes) {
    const vertices = [];

    // Calcula a posição de um ponto na semiesfera
    // θ: percorre a circunferência horizontalmente, de 0° até 360°.
    // φ: controla quanto descemos da borda do disco em direção ao fundo da semiesfera, de 0° até 90°.
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
} /* FIM*/

// Chão com raio 3 e 64 triângulos = 192 posições de vértices ( quanto maior, melhor) | AUMENTA MAIS?
const verticesChao = criarChaoCircular(3, 64);

// Envia os vértices para a GPU
const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: {
        numComponents: 3,
        data: verticesChao
    }
});

/* PARTE 2 → */
const verticesHemisferio = criarHemisferioInferior(3, 64, 16);// Cria os vértices do hemisfério inferior

const bufferHemisferio = twgl.createBufferInfoFromArrays(gl, {
    a_position: {
        numComponents: 3,
        data: verticesHemisferio
    } // Envia os vértices para a GPU
}); /*FIM*/


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

    const projecao = twgl.m4.perspective( // cria uma matriz  de projeçãp perspectiva 4x4
        45 * Math.PI / 180, //campo de visão vertial da câmera = 45º (Math.PI / 180 é conversão para radiano)
        aspecto, //proporcao da tela: proporção entre a largura e a altura do canvas | aqui é 800/300 =~1,33
        0.1, //plano próximo
        100 //plano distante
    );

    // POSIÇÃO DA CÂMERA
    const posicaoCamera = [5, 5, 7];
    const alvo = [0, 0, 0];
    const cima = [0, 1, 0];
    const camera = twgl.m4.lookAt(posicaoCamera,alvo,cima);
    const visualizacao = twgl.m4.inverse(camera);

    // Combina projeção e visualização
    /*const matriz = twgl.m4.multiply(projecao,visualizacao); // multiplica as matrizes projeção e visualização
    gl.useProgram(programInfo.program); // ativa o programa WebGL
    twgl.setBuffersAndAttributes(gl,programInfo,bufferInfo); // configura os buffers com as posições dos vértices
    twgl.setUniforms(programInfo, {u_matrix: matriz});// envie a matriz que calculamos no JavaScript para a variável u_matrix do shader para calcular a posição final dos vértices
    twgl.drawBufferInfo(gl, bufferInfo);  // desenha os triângulos*/
    
    // COMBINA PROJEÇÃO E VISUALIZAÇÃO PARA DOIS OBJETOS 3D INDEPENDENTES: CHÃO E HEMISFÉRIO INFERIOR DA POKEBOLA
    const matriz = twgl.m4.multiply(projecao,visualizacao); // multiplica as matrizes projeção e visualização
    gl.useProgram(programInfo.program);// Ativa o programa WebGL
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);   // Desenha o chão circular
    twgl.setUniforms(programInfo, {u_matrix: matriz, u_color: [0.87, 0.76, 0.57, 1.0] });// Areia bege
    twgl.drawBufferInfo(gl, bufferInfo);

    twgl.setBuffersAndAttributes(gl, programInfo, bufferHemisferio);// Desenha o hemisfério inferior
    twgl.setUniforms(programInfo, { u_matrix: matriz, u_color: [0.15, 0.45, 0.65, 1.0] });// Azul
    twgl.drawBufferInfo(gl, bufferHemisferio);
}

desenharCena();

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