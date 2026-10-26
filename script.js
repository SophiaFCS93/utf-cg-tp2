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
        let modeloConcha = twgl.m4.identity(); // Cria a matriz de modelagem da concha
        modeloConcha = twgl.m4.translate(modeloConcha,[1.5, 0.08, 0]); // Posiciona a concha sobre a areia, fora do centro           
        modeloConcha = twgl.m4.rotateZ(modeloConcha, Math.PI / 2); // Rotaciona a concha em 90 graus no eixo Z  para deixá-la deitada,já que originalmente está em pé
        modeloConcha = twgl.m4.scale(modeloConcha,[12, 12, 12] );// Mantém a escala atual| deixei o maior que gostei
        const matrizConcha = twgl.m4.multiply(matriz,modeloConcha); // Combina as matrizes da cena com a da concha       
        twgl.setBuffersAndAttributes(gl,programInfo,bufferConcha); // Configura o buffer da concha
            
        // Define a posição e a cor temporária
        twgl.setUniforms(programInfo, {
            u_matrix: matrizConcha,
            /*u_color: [0.95, 0.45, 0.55, 1.0] *///rosa
            u_color: [0.60, 0.38, 0.23, 1.0]//marrom
        });

        twgl.drawBufferInfo(gl, bufferConcha); // Desenha os triângulos da concha
    } /*FIM*/

        
      
    /*PARTE 4 - GRUPO DE ALGAS */ 
    if (bufferAlga !== null) {

        // Define a posição e o tamanho de cada alga (03 algas a princípio)
        const algas = [
            { posicao: [-1.3, 0.05, -1.2], escala: 0.85 }, //  Alga 1 - maior, na parte de trás
            { posicao: [-0.3, 0.05, -1.6], escala: 0.60 }, // Alga 2 - menor, mais à direita
            { posicao: [-2.0, 0.05, -0.4], escala: 0.70 } // Alga 3 - média, mais à esquerda
        ];

        // Utiliza o mesmo buffer para todas as algas
        twgl.setBuffersAndAttributes(gl, programInfo, bufferAlga );

        // Percorre cada alga definida no array
        for (const alga of algas) {
            let modeloAlga = twgl.m4.identity(); // Cria uma matriz de modelagem para esta alga
            modeloAlga = twgl.m4.translate( modeloAlga, alga.posicao); // Posiciona a alga na areia
            modeloAlga = twgl.m4.scale(  modeloAlga,[alga.escala, alga.escala, alga.escala] ); // Define o tamanho individual da alga
            const matrizAlga = twgl.m4.multiply( matriz,  modeloAlga); // Combina a matriz da câmera com a da alga

        // Define a matriz e a cor verde
        twgl.setUniforms(programInfo, {
            u_matrix: matrizAlga,
            u_color: [0.12, 0.48, 0.20, 1.0]
        });

        twgl.drawBufferInfo(gl, bufferAlga); // Desenha a alga atual
        }
    }
    

    /*PARTE 4 - ESTRELA DO MAR - CONJUNTO */ 
    if (bufferEstrela !== null) {
        let modeloEstrela = twgl.m4.identity();
        modeloEstrela = twgl.m4.translate( modeloEstrela, [-0.6, 0.03, 0.8]); // Posiciona o conjunto das estrelas sobre a areia
        modeloEstrela = twgl.m4.scale(modeloEstrela,[0.18, 0.18, 0.18]); // Reduz o conjunto para caber melhor no diorama
        const matrizEstrela = twgl.m4.multiply( matriz, modeloEstrela); // Combina a matriz da câmera com a matriz do objeto

        // Ativa os buffers das estrelas
        twgl.setBuffersAndAttributes(
            gl,
            programInfo,
            bufferEstrela
        );

        // Define a matriz e uma cor alaranjada
        twgl.setUniforms(programInfo, {
            u_matrix: matrizEstrela,
            //u_color: [0.92, 0.56, 0.33, 1.0] // cor das estrelas
            u_color: [1.0, 0.45, 0.0, 1.0]
        });
        
        twgl.drawBufferInfo(gl, bufferEstrela); // Desenha as estrelas
}

    /*PARTE 4 - OURIÇOS */
    if (bufferOurico !== null) {

        // Define a posição e o tamanho de cada ouriço
        const ouricos = [
            { posicao: [-1.9, 0.04, 0.6], escala: 0.12 },  // Ouriço 1 - pequeno, à esquerda
            { posicao: [-1.0, 0.05, -1.4], escala: 0.12 },   // Ouriço 2 - maior, perto das algas
            { posicao: [-1.8, 0.05, -0.5], escala: 0.12 }
        ];

        // Ativa o buffer compartilhado pelos dois ouriços
        twgl.setBuffersAndAttributes(gl, programInfo, bufferOurico);

        // Percorre os dois ouriços
        for (const ourico of ouricos) {

            let modeloOurico = twgl.m4.identity(); // Cria a matriz de modelagem
            modeloOurico = twgl.m4.translate(modeloOurico, ourico.posicao); // Posiciona o ouriço na areia
            modeloOurico = twgl.m4.scale(modeloOurico, [ourico.escala, ourico.escala, ourico.escala]); // Define o tamanho
            const matrizOurico = twgl.m4.multiply(matriz, modeloOurico); // Combina as matrizes
            
            twgl.setUniforms(
                programInfo, { 
                u_matrix: matrizOurico, 
                u_color: [0.25, 0.13, 0.32, 1.0] }); // Define a matriz e a cor roxo-escuro
            
                twgl.drawBufferInfo(gl, bufferOurico); // Desenha o ouriço atual
        }
    }





    
    /*PARTE 4 - BOLACHA DO MAR */ 
    if (bufferBolacha !== null) {

        let modeloBolacha = twgl.m4.identity();
        modeloBolacha = twgl.m4.translate( modeloBolacha,  [0.0, 0.03, 1.8] );  // Posiciona a bolacha-do-mar sobre a areia
        modeloBolacha = twgl.m4.scale( modeloBolacha, [0.014, 0.014, 0.014] ); // Reduz o tamanho original do objeto
        const matrizBolacha = twgl.m4.multiply( matriz, modeloBolacha); // Reduz o tamanho original do objeto
        twgl.setBuffersAndAttributes( gl, programInfo, bufferBolacha);

        // Define a matriz e a cor bege-clara
        twgl.setUniforms(programInfo, {
            u_matrix: matrizBolacha,
            //u_color: [0.91, 0.85, 0.72, 1.0] //begezinho
            u_color: [0.97, 0.94, 0.86, 1.0]// branco-marfim
        });

          twgl.drawBufferInfo(gl, bufferBolacha);
    }




    /*PARTE 4 - CORAIS */ 
    if (bufferCoral !== null) {

        let modeloCoral = twgl.m4.identity();
        modeloCoral = twgl.m4.translate( modeloCoral,  [0.50, 0.05, -1.5] );
        modeloCoral = twgl.m4.scale( modeloCoral, [0.18, 0.18, 0.18] );
        modeloCoral = twgl.m4.translate( modeloCoral,[75.49, -1.10, -0.65]); // Corrige o deslocamento original do arquivo OBJ.
        const matrizCoral = twgl.m4.multiply( matriz, modeloCoral );
        twgl.setBuffersAndAttributes( gl, programInfo, bufferCoral );
        
        twgl.setUniforms(programInfo, {
            u_matrix: matrizCoral,
            //u_color: [0.91, 0.47, 0.58, 1.0] // rosa clarinho
            u_color: [0.72, 0.23, 0.44, 1.0]
        });

        twgl.drawBufferInfo(gl, bufferCoral);
    }




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



/*********************************************************************************
                    PARTE 4 - Adicionar os objetos 3D
// ********************************************************************************/ 
//,.OBJ POIS GLTF DÁ MUITO TRABALHO, NUUU


/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   CONCHA 1 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */

const caminhoConcha = "assets/models/concha/TurretShell.obj";// Caminho do arquivo OBJ da concha

// Função assíncrona responsável por carregar a concha
async function carregarConcha() {
    const resposta = await fetch(caminhoConcha); // Faz a requisição para buscar o arquivo OBJ

    // Verifica se o arquivo foi encontrado e carregado
    if (!resposta.ok) {
        console.error("Erro ao carregar a concha!"); // Exibe uma mensagem de erro no Console
        return; // Interrompe a execução da função
    }
    
    const conteudoOBJ = await resposta.text(); // Converte o conteúdo do arquivo OBJ para texto
    console.log("Concha carregada com sucesso!"); // Confirma que o arquivo foi carregado


    /* -----------------------------------------------------
       ETAPA 1 - PREPARAR OS DADOS DO OBJ
    ------------------------------------------------------- */
    const linhas = conteudoOBJ.split(/\r?\n/); // Divide o conteúdo do arquivo em linhas
    const vertices = []; // Array que armazenará as posições dos vértices: x, y, z, x, y, z, ...
    const indices = []; // Array que armazenará os índices das faces


    /* -----------------------------------------------------
       ETAPA 2 - LER OS VÉRTICES E AS FACES
       ----------------------------------------------------- */
    // Percorre cada linha do arquivo OBJ
    for (const linha of linhas) {

        // Identifica uma linha de posição de vértice. Ex: v 0.5 1.0 0.3
        if (linha.startsWith("v ")) {
            const valores = linha.trim().split(/\s+/); // Divide a linha em partes usando espaços
            const x = parseFloat(valores[1]);  // Lê a coordenada X
            const y = parseFloat(valores[2]); // Lê a coordenada Y
            const z = parseFloat(valores[3]); // Lê a coordenada Z
            vertices.push(x, y, z); // Adiciona as três coordenadas ao array
        }


        /* -------------------------------------------------
           ETAPA 3 - LER E TRIANGULAR AS FACES
           ------------------------------------------------- */
        // Identifica uma linha de face. Ex: f 1/1/1 2/2/2 3/3/3
        if (linha.startsWith("f ")) {
            const valores = linha.trim().split(/\s+/); // Divide a linha em partes usando espaços
            const indicesFace = [];// Guarda os índices de uma face específica

            // Percorre todos os vértices dessa face
            for (let i = 1; i < valores.length; i++) {           
                const indiceVertice = valores[i].split("/")[0]; // Obtém somente o índice de posição do vértice. Ex: "10/5/3" -> "10"
                indicesFace.push( parseInt(indiceVertice, 10) - 1); // Converte o índice para número.// OBJ começa em 1; WebGL começa em 0.
            }

            /* Divide a face em triângulos. Funciona também com faces convexas que tenham mais de quatro vértices.
            
            Triângulo: A B C -> A B C
            
            Quadrilátero: A B C D dividido em 2 triangulos!!! 
            -> Triângulo 1: A B C
            -> Triângulo 2: A C D
                         
            PORQUE? porque a maioria dos objetos do mar que encontrei como estrela do mar, algas, etc,
            tem faces com 4 vértices e o código que eu tinha antes era somente para faces trinangulares, por causa da concha. */

            for (let i = 1; i < indicesFace.length - 1; i++) {
                indices.push(indicesFace[0], indicesFace[i], indicesFace[i + 1]); // Adiciona os três índices de um triângulo
            }
        }

    } // FIM DO FOR QUE PERCORRE AS LINHAS DO OBJ


    /* -----------------------------------------------------
       ETAPA 4 - CONFERIR OS DADOS LIDOS
       ----------------------------------------------------- */
    console.log("Quantidade de vértices:",vertices.length / 3); // Cada vértice possui três coordenadas: X, Y e Z 
    console.log("Quantidade de índices:",indices.length); // Mostra o total de índices após a triangulação
    console.log("Quantidade de triângulos:",indices.length / 3); // Cada triângulo utiliza três índices
    console.log("Primeiros índices:",indices.slice(0, 12));  // Mostra os primeiros 12 índices para conferência


    /* -----------------------------------------------------
       ETAPA 5 - CRIAR O BUFFER PARA O WEBGL
       ----------------------------------------------------- */
    // Cria os buffers necessários para desenhar a concha
    // a_position → Atributo de posição usado pelo vertex shader
    // numComponents: 3 → Cada vértice tem três coordenadas: X, Y e Z
    // data: vertices → // Coordenadas lidas do arquivo OBJ

    bufferConcha = twgl.createBufferInfoFromArrays(gl, {
        a_position: {
            numComponents: 3,        
            data: vertices
        },
        indices: new Uint16Array(indices)  // Índices que definem os triângulos do modelo
    });
    
    console.log("Buffer da concha criado!", bufferConcha); // Confirma que o buffer foi criado

} // FIM DA FUNÇÃO carregarConcha()

carregarConcha(); // Executa o carregamento da concha





/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   ALGA 1    ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoAlga = "assets/models/alga/SeaWeed.obj";
let bufferAlga = null; 

async function carregarAlga() {
    const resposta = await fetch(caminhoAlga);
    
    if (!resposta.ok) {
        console.error("Erro ao carregar a alga!");
        return;
    }

    const conteudoOBJ = await resposta.text();
    const linhas = conteudoOBJ.split(/\r?\n/);
    const vertices = [];
    const indices = [];

    
    for (const linha of linhas) {
        
        if (linha.startsWith("v ")) {

            const valores = linha.trim().split(/\s+/);
            const x = parseFloat(valores[1]);
            const y = parseFloat(valores[2]);
            const z = parseFloat(valores[3]);
            vertices.push(x, y, z);
        }

        if (linha.startsWith("f ")) {
            const valores = linha.trim().split(/\s+/);
            const indicesFace = [];

            for (let i = 1; i < valores.length; i++) {
                const indiceVertice = valores[i].split("/")[0];
                indicesFace.push(parseInt(indiceVertice, 10) - 1);
            }

            for (let i = 1; i < indicesFace.length - 1; i++) {
                indices.push(indicesFace[0], indicesFace[i], indicesFace[i + 1] );
            }
        }
    }

    bufferAlga = twgl.createBufferInfoFromArrays(gl, {
        a_position: {
            numComponents: 3,
            data: vertices
        },
        indices: new Uint16Array(indices)
    });

    // Confirma o carregamento
    console.log("Alga carregada com sucesso!");
    console.log("Vértices da alga:", vertices.length / 3);
    console.log("Triângulos da alga:", indices.length / 3);
}
carregarAlga();





/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   ESTRELA DO MAR - CONJUNTO    ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoEstrela = "assets/models/estrela/starfish.obj";
let bufferEstrela = null;

async function carregarEstrela() {
    const resposta = await fetch(caminhoEstrela);

    if (!resposta.ok) {
        console.error("Erro ao carregar as estrelas-do-mar!");
        return;
    }

    const conteudoOBJ = await resposta.text();
    const linhas = conteudoOBJ.split(/\r?\n/);
    const vertices = [];
    const indices = [];

    for (const linha of linhas) {

        // Lê os vértices
        if (linha.startsWith("v ")) {
            const valores = linha.trim().split(/\s+/);
            const x = parseFloat(valores[1]);
            const y = parseFloat(valores[2]);
            const z = parseFloat(valores[3]);
            vertices.push(x, y, z);
        }

        // Lê as faces
        if (linha.startsWith("f ")) {
            const valores = linha.trim().split(/\s+/);       
            const indicesFace = []; 

            for (let i = 1; i < valores.length; i++) {
                const indiceVertice = valores[i].split("/")[0];
                indicesFace.push(parseInt(indiceVertice, 10) - 1);
            }

            for (let i = 1; i < indicesFace.length - 1; i++) {
                indices.push( indicesFace[0], indicesFace[i], indicesFace[i + 1]);
            }
        }
    }

    bufferEstrela = twgl.createBufferInfoFromArrays(gl, {
        a_position: {
            numComponents: 3,
            data: vertices
        },
        indices: new Uint16Array(indices)
    });

    console.log("Estrelas-do-mar carregadas com sucesso!");
    console.log("Vértices:", vertices.length / 3);
    console.log("Triângulos:", indices.length / 3);
    console.log("Buffer das estrelas criado!", bufferEstrela);
}
carregarEstrela();



/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   OURIÇO   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoOurico = "assets/models/ourico/Mesh_SeaUrchin.obj";
let bufferOurico = null; 

async function carregarOurico() {
    const resposta = await fetch(caminhoOurico);

    if (!resposta.ok) {
        console.error("Erro ao carregar o ouriço-do-mar!");
        return;
    }

    const conteudoOBJ = await resposta.text();
    const linhas = conteudoOBJ.split(/\r?\n/);
    const vertices = [];
    const indices = [];

    for (const linha of linhas) {
        if (linha.startsWith("v ")) {
            const valores = linha.trim().split(/\s+/);
            const x = parseFloat(valores[1]);
            const y = parseFloat(valores[2]);
            const z = parseFloat(valores[3]);
            vertices.push(x, y, z);
        }

        if (linha.startsWith("f ")) {
            const valores = linha.trim().split(/\s+/);
            const indicesFace = [];

            for (let i = 1; i < valores.length; i++) {
                const indiceVertice = valores[i].split("/")[0];
                indicesFace.push(parseInt(indiceVertice, 10) - 1);
            }

            for (let i = 1; i < indicesFace.length - 1; i++) {
                indices.push( indicesFace[0], indicesFace[i], indicesFace[i + 1]);
            }
        }
    }

    bufferOurico = twgl.createBufferInfoFromArrays(gl, {
        a_position: {
            numComponents: 3,
            data: vertices
        },
        indices: new Uint16Array(indices)
    });

    console.log("Ouriço carregado com sucesso!");
    console.log("Vértices do ouriço:", vertices.length / 3);
    console.log("Triângulos do ouriço:", indices.length / 3);
    console.log("Buffer do ouriço criado!", bufferOurico);
}
carregarOurico();




/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   BOLACHA-DO-MAR  ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoBolacha = "assets/models/bolacha/Mesh_SandDollar.obj";
let bufferBolacha = null; 

async function carregarBolacha() {
    const resposta = await fetch(caminhoBolacha);

    if (!resposta.ok) {
        console.error("Erro ao carregar a bolacha-do-mar!");
        return;
    }

    const conteudoOBJ = await resposta.text();
    const linhas = conteudoOBJ.split(/\r?\n/);
    const vertices = [];
    const indices = [];

    for (const linha of linhas) {
        if (linha.startsWith("v ")) {
            const valores = linha.trim().split(/\s+/);
            const x = parseFloat(valores[1]);
            const y = parseFloat(valores[2]);
            const z = parseFloat(valores[3]);
            vertices.push(x, y, z);
        }

        if (linha.startsWith("f ")) {
            const valores = linha.trim().split(/\s+/);
            const indicesFace = [];

            for (let i = 1; i < valores.length; i++) {
                const indiceVertice = valores[i].split("/")[0];
                indicesFace.push(
                    parseInt(indiceVertice, 10) - 1
                );
            }

            for (let i = 1; i < indicesFace.length - 1; i++) {
                indices.push( indicesFace[0], indicesFace[i], indicesFace[i + 1] );
            }
        }
    }

    bufferBolacha = twgl.createBufferInfoFromArrays(gl, {
        a_position: {
            numComponents: 3,
            data: vertices
        },

        indices: new Uint16Array(indices)
    });

    console.log("Bolacha-do-mar carregada com sucesso!");
    console.log("Vértices:", vertices.length / 3);
    console.log("Triângulos:", indices.length / 3);
    console.log("Buffer da bolacha criado!", bufferBolacha);
}
carregarBolacha();




/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   CORAIS    ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoCoral = "assets/models/coral/Coraal.obj";
let bufferCoral = null; 

async function carregarCoral() {
    const resposta = await fetch(caminhoCoral);

    if (!resposta.ok) {
        console.error("Erro ao carregar o coral!");
        return;
    }

    const conteudoOBJ = await resposta.text();
    const linhas = conteudoOBJ.split(/\r?\n/);
    const vertices = [];
    const indices = [];

    for (const linha of linhas) {

        if (linha.startsWith("v ")) {
            const valores = linha.trim().split(/\s+/);
            const x = parseFloat(valores[1]);
            const y = parseFloat(valores[2]);
            const z = parseFloat(valores[3]);
            vertices.push(x, y, z);
        }

        if (linha.startsWith("f ")) {
            const valores = linha.trim().split(/\s+/);
            const indicesFace = [];

            for (let i = 1; i < valores.length; i++) {
                const indiceVertice = valores[i].split("/")[0];
                indicesFace.push(parseInt(indiceVertice, 10) - 1);
            }

            for (let i = 1; i < indicesFace.length - 1; i++) {
                indices.push( indicesFace[0], indicesFace[i], indicesFace[i + 1]);
            }
        }
    }

    bufferCoral = twgl.createBufferInfoFromArrays(gl, {
        a_position: {
            numComponents: 3,
            data: vertices
        },
        indices: new Uint16Array(indices)
    });

    console.log("Coral carregado com sucesso!");
    console.log("Vértices do coral:", vertices.length / 3);
    console.log("Triângulos do coral:", indices.length / 3);
    console.log("Buffer do coral criado!", bufferCoral);
}
carregarCoral();




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