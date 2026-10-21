/*******************************************************
→ IDEIA DE DIORAMA: AQUÁRIO  
→ TP2 - PARAÍSO SUBMERSO
*******************************************************/
//SOMENTE INICIALIZANDO O WEBGL2, PINTANDO O CANVAS DE AZUL PARA TERMOS UM CORPO INCIAL
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2");


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

        vertices.push(0, 0, 0); // Centro do círculo

        // Segundo ponto da borda
        vertices.push( raio * Math.cos(angulo2), 0,raio * Math.sin(angulo2));

        //Primeiro ponto da borda
        vertices.push( raio * Math.cos(angulo1), 0, raio * Math.sin(angulo1)
        );
    }

    return vertices;
}


/* PARTE 2 */
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

/* PARTE 2 */
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


/* PARTE 3 */
//CAMERA AUTOMÁTICA  ↓
let cameraAtiva = 1; // 1 = câmera automática | 2 = câmera orbital
let anguloCamera = 0; // Ângulo da câmera ao redor do aquário
let distanciaCamera = 10; // Distância da câmera ao centro
const velocidadeCamera = 0.3; // Velocidade da rotação em radianos por segundo
let tempoAnterior = 0; // Tempo do quadro anterior

//CAMERA ORBITAL  ↓
let anguloHorizontal = 0;
let anguloVertical = Math.PI / 4;
let arrastandoMouse = false;
let mouseAnteriorX = 0;
let mouseAnteriorY = 0;
const sensibilidadeMouse = 0.005;
/*FIM*/


/* PARTE 4*/
// Guarda o buffer da concha após o carregamento
let bufferConcha = null;

//(tempoAtual = 0) Recebe o tempo fornecido pelo requestAnimationFrame para calcular a movimentação da câmera
function desenharCena(tempoAtual = 0) {
    /*PARTE 3 */
    // Calcula quanto tempo passou desde o último quadro
    const deltaTime = tempoAnterior === 0
        ? 0
        : (tempoAtual - tempoAnterior) / 1000;

    tempoAnterior = tempoAtual;
    
    if (cameraAtiva === 1) {
    anguloCamera += velocidadeCamera * deltaTime;
    } /*FIM*/

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

//PARTE 3
//JÁ MUDEI 500X
//POSIÇÃO DA CÂMERA ATIVA
let posicaoCamera;

if (cameraAtiva === 1) {
    // Câmera 1: gira automaticamente a 45 graus
    const inclinacao = Math.PI / 4;

    posicaoCamera = [
        distanciaCamera * Math.cos(inclinacao) * Math.sin(anguloCamera),
        distanciaCamera * Math.sin(inclinacao),
        distanciaCamera * Math.cos(inclinacao) * Math.cos(anguloCamera)
    ];

} else {
    // Câmera 2: posição controlada pelo mouse
    posicaoCamera = [
        distanciaCamera * Math.cos(anguloVertical) * Math.sin(anguloHorizontal),
        distanciaCamera * Math.sin(anguloVertical),
        distanciaCamera * Math.cos(anguloVertical) * Math.cos(anguloHorizontal)
    ];
} /*FIM*/


    // A câmera sempre olha para o centro do diorama
    const alvo = [0, 0, 0];
    const cima = [0, 1, 0];
    const camera = twgl.m4.lookAt(posicaoCamera, alvo, cima); // Cria a matriz da câmera na posição calculada
    const visualizacao = twgl.m4.inverse(camera);// Converte a matriz da câmera em matriz de visualização
    const matriz = twgl.m4.multiply(projecao, visualizacao);// Combina projeção e visualização

    gl.useProgram(programInfo.program);// Ativa o programa WebGL
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);   // Desenha o chão circular
    twgl.setUniforms(programInfo, {u_matrix: matriz, u_color: [0.87, 0.76, 0.57, 1.0] });// Areia bege
    twgl.drawBufferInfo(gl, bufferInfo);

    twgl.setBuffersAndAttributes(gl, programInfo, bufferHemisferio);// Desenha o hemisfério inferior
    twgl.setUniforms(programInfo, { u_matrix: matriz, u_color: [0.15, 0.45, 0.65, 1.0] });// Azul
    twgl.drawBufferInfo(gl, bufferHemisferio); 

    /*PARTE 4 CONCHA*/
        if (bufferConcha !== null) {

    // Cria a matriz de modelagem da concha
    let modeloConcha = twgl.m4.identity();

    // Posiciona a concha sobre a areia, fora do centro
    modeloConcha = twgl.m4.translate(modeloConcha,[1.5, 0.08, 0]);

    // Rotaciona a concha em 90 graus no eixo Z  para deixá-la deitada,já que originalmente está em pé
    modeloConcha = twgl.m4.rotateZ(modeloConcha, Math.PI / 2);

    // Mantém a escala atual
    modeloConcha = twgl.m4.scale(modeloConcha,[8, 8, 8] // talvez mudar para 10, deixar maior? 
    );

        // Combina as matrizes da cena com a da concha
        const matrizConcha = twgl.m4.multiply(matriz,modeloConcha);

        // Configura o buffer da concha
        twgl.setBuffersAndAttributes(gl,programInfo,bufferConcha
        );

        // Define a posição e a cor temporária
        twgl.setUniforms(programInfo, {
            u_matrix: matrizConcha,
            /*u_color: [0.95, 0.45, 0.55, 1.0] *///rosa
            u_color: [0.60, 0.38, 0.23, 1.0]
        });

        // Desenha os triângulos da concha
        twgl.drawBufferInfo(gl, bufferConcha);
    } /*FIM*/

    requestAnimationFrame(desenharCena); // Solicita o próximo quadro da animação
}
requestAnimationFrame(desenharCena);


/* PARTE 3 - ALTERNANDO ENTRE AS CÂMERAS*/ 
// Alterna entre as câmeras usando as teclas 1 e 2
window.addEventListener("keydown", function(evento) {

    if (evento.key === "1") {
        cameraAtiva = 1;
        console.log("Câmera 1 - Automática");
    }

    if (evento.key === "2") {
        cameraAtiva = 2;
        console.log("Câmera 2 - Orbital");
    }
}); /* FIM*/ 


/* PARTE 3 - CONTROLANDO A CÂMERA 2 COM O MOUSE*/ 
// Inicia o movimento quando pressionamos o mouse
canvas.addEventListener("pointerdown", function(evento) {
    if (cameraAtiva !== 2) return;

    arrastandoMouse = true;
    mouseAnteriorX = evento.clientX;
    mouseAnteriorY = evento.clientY;
    canvas.setPointerCapture(evento.pointerId);
});

// Movimenta a câmera enquanto arrastamos o mouse
canvas.addEventListener("pointermove", function(evento) {
    if (cameraAtiva !== 2 || !arrastandoMouse) return;

    // Calcula quanto o mouse se movimentou
    const movimentoX = evento.clientX - mouseAnteriorX;
    const movimentoY = evento.clientY - mouseAnteriorY;

    // Atualiza os ângulos da câmera
    anguloHorizontal -= movimentoX * sensibilidadeMouse;
    anguloVertical += movimentoY * sensibilidadeMouse;

    // Impede que a câmera fique exatamente sobre os polos
    anguloVertical = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, anguloVertical)
    );

    // Atualiza a posição anterior do mouse
    mouseAnteriorX = evento.clientX;
    mouseAnteriorY = evento.clientY;
});

function pararArraste() {arrastandoMouse = false;} // Encerra o movimento quando soltamos o mouse

canvas.addEventListener("pointerup", pararArraste);
canvas.addEventListener("pointercancel", pararArraste);
/* FIM*/


/************************************************************************
PARTE 3 - Implementar as duas câmeras
*************************************************************************/
/*Câmera:
• Use projeção perspectiva
• Deve haver 2 câmeras e o usuário pode alternar entre elas via as teclas 1 e 2:
1. Visão a ~45º acima do chão olhando para o centro do diorama e rotacionando sua posição ao longo do tempo. 
   O scroll do mouse deve aproximar ou distanciar a câmera do alvo
2. Câmera orbital controlada pelo movimento do mouse co↑m o alvo fixo no centro do diorama*/

/*CÂMERA 1 AUTOMÁTICA*/
// Aproxima ou afasta a câmera usando o scroll do mouse
// DEU CERTO +-
canvas.addEventListener("wheel", function(evento) {
    evento.preventDefault();

    distanciaCamera += evento.deltaY * 0.01;

    // Limita a distância para não entrar no aquário,  acho legal ver apenas de forma aproximada
    distanciaCamera = Math.max(6,  Math.min(20, distanciaCamera));
}, { passive: false });



/************************************************************************
PARTE 4 - Adicionar os objetos 3D
// *************************************************************************/ 
//OBJ POIUS GLTF DÁ MUITO TRABALHO, NUUU


/* OBJETO 1: CONCHA*/
// Caminho do arquivo da concha
const caminhoConcha = "assets/models/concha/TurretShell.obj";

// Carrega o conteúdo do OBJ
async function carregarConcha() {
    const resposta = await fetch(caminhoConcha);

    if (!resposta.ok) {
        console.error("Erro ao carregar a concha!");
        return;
    }

    // OBJ é um arquivo de texto
    const conteudoOBJ = await resposta.text();
    console.log("Concha carregada com sucesso!");
    console.log("Início do arquivo:", conteudoOBJ.slice(0, 300));

        // Divide o conteúdo do OBJ em linhas
    const linhas = conteudoOBJ.split(/\r?\n/);

    // Guarda as coordenadas dos vértices
    const vertices = []; 

    // Guarda os índices dos vértices que formam as faces
    const indices = [];

    // Percorre todas as linhas do arquivo
    for (const linha of linhas) {

        // Identifica as linhas que começam com "v "
        if (linha.startsWith("v ")) {

            // Separa os valores da linha
            const valores = linha.trim().split(/\s+/);

            // Converte as coordenadas para números
            const x = parseFloat(valores[1]);
            const y = parseFloat(valores[2]);
            const z = parseFloat(valores[3]);

            // Guarda as coordenadas do vértice
            vertices.push(x, y, z);
        }

        
        // Identifica as linhas que representam faces
        if (linha.startsWith("f ")) {

            // Separa os elementos da face
            const valores = linha.trim().split(/\s+/);

            // Percorre os três vértices do triângulo
            for (let i = 1; i <= 3; i++) {

                // Exemplo: "12/8/5" -> "12"
                const indiceVertice = valores[i].split("/")[0];

                // OBJ começa em 1; WebGL começa em 0
                indices.push(parseInt(indiceVertice, 10) - 1);
            }

            
        }

    }

    console.log("Quantidade de vértices:", vertices.length / 3);
    console.log("Primeiras coordenadas:", vertices.slice(0, 12));
    console.log("Quantidade de índices:", indices.length);
    console.log("Quantidade de triângulos:", indices.length / 3);
    console.log("Primeiros índices:", indices.slice(0, 12));


    // Cria o buffer da concha para o WebGL
    bufferConcha = twgl.createBufferInfoFromArrays(gl, {
        a_position: {
            numComponents: 3,
            data: vertices
        },
        indices: new Uint16Array(indices)
    });

console.log("Buffer da concha criado!", bufferConcha);
}
carregarConcha();






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