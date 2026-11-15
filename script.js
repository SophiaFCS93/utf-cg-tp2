/****************************************************************************************************************
                → IDEIA DE DIORAMA: AQUÁRIO  
                → TP2 - PARAÍSO SUBMERSO
******************************************************************************************************************/

const canvas = document.querySelector("#canvas"); // INICIALIZANDO O WEBGL2
const gl = canvas.getContext("webgl2", { alpha: true }); // para que o canvas tenha transparência sabe?
gl.enable(gl.DEPTH_TEST);// Habilitando a comparação de profundidade | permite que objetos mais próximos ocultem superfícies mais distante 


/****************************************************************************************************************
PARTE 1 - Construir o chão circular de areia sobre o qual ficarão as pedras, algas, conchas e outros 
PARTE 2 - Construir o hemisfério inferior - Parte inferior da "pokebola"
******************************************************************************************************************/ 
/* PARA O CHÃO: 
• Para desenhar um disco circular, usar vários triangulos que compatilham UM mesmo vértice central
• Uma grande quantidade de triangulos nos proporcionará um disco cada vez mais arredondado
• Como estamos trabalhando em 3D, temos os eixos x, y e Z. X = posição horizontal | Y = altura | Z = profundidade
• As posições dos pontos da borda são:  x = raio * cos(ângulo) | y = 0 | z = raio * sen(ângulo)

O Foi contru[ido em quatro etapas] 
• criarChaoCircular(): calcula os vértices que formam o disco circular.
• twgl.createTexture(): carrega a imagem areia.jpg.
• twgl.createBufferInfoFromArrays(): cria o buffer do chão, com vértices e coordenadas de textura.
• desenharCena(): utiliza os shaders da areia para desenhar o chão na tela.
*/ 


/* PARA A SEMIESFERA INFERIOR DA POKEBOLA
• Para desenhar um hemisfério, usamos vários triângulos conectados que formam uma superfície curva
• Diferentemente do chão precisou-se de DOIS ângulos para calcular os vértices θ e φ°
• x = raio * cos(phi) * cos(theta) | y = -raio * sen(phi) | z = raio * cos(phi) * sen(theta)
• O valor negativo de Y faz com que o hemisfério seja construído abaixo do chão de areia (Y = 0)
• A superfície é dividida em pequenas regiões, cada uma formada por DOIS triângulos
• Quanto maior a quantidade de segmentos e divisões, mais arredondado e suave será o hemisfério
• Aqui, usamos 64 × 16 × 2 = 2.048 triângulos gerados.*/ 


/*VEXTEX SHADER E FRAGMENT SHADER 
• Como criei diferentes firnas de desenhar os objetos, acabei criando vários shaders.
• Criei um par de shaders de cores simples .
• Criei um par de shaders para a areia que possui uma textura carregada de um arquivo de imagem.
• Criei um par de shaders para a iluminação Phong que recebe/calcula informações específicas.
• Poderia ser apenas um unico programa que tratasse tudo mas achei melhor fazer assim nesse projeto.*/ 


/* CÂMERAS 
• Camêra automática e Camêra orbital permitem observar o mesmo aquário de maneiras diferentes: uma automática e outra controlada pelo mouse.

Camêra automática:
• A ideia da Camêra automática é orbitar automaticamente ao redor do aquário, mantendo uma visão inclinada. A
• velocidade de rotação permanece aproximadamente constante, mesmo quando a taxa de quadros varia. 

Camêra orbital:
• A ideia da Camêra orbital é permitir ao usuário controlar o ponto de observação.
• o ângulo vertical da câmera orbital está limitado a um intervalo limitando evitando que o usuário movimente a câmera para posições indesejadas.*/



/****************************************************************************************************************
    VERTEX SHADER E FRAGMENT SHADER - CORES SIMPLES
******************************************************************************************************************/ 
const vertexShader = `#version 300 es
    in vec4 a_position;
    in float a_shade; // Tonalidade de cada vértice
    uniform mat4 u_matrix;
    out float v_shade; // Envia a tonalidade ao Fragment Shader

    void main() {
        gl_Position = u_matrix * a_position;
        v_shade = a_shade;
    }
`;

const fragmentShader = `#version 300 es
    precision highp float;
    uniform vec4 u_color;
    in float v_shade;
    out vec4 outColor;

    void main() {
        float tonalidade = v_shade > 0.0 ? v_shade : 1.0;
        outColor = vec4(u_color.rgb * tonalidade, u_color.a);
    }
`;
const programInfo = twgl.createProgramInfo(gl, [vertexShader,fragmentShader]); // Cria o programa WebGL 


/****************************************************************************************************************
    VERTEX SHADER E FRAGMENT SHADER - TEXTURA DO CHÃO (AREIA)
******************************************************************************************************************/
// in vec2 a_texcoord → Recebe duas coordenadas por vértice: u e v. Elas representam posições na imagem
// out vec2 v_texcoord → Envia as coordenadas ↑ para o Fragment Shader

const vertexShaderAreia = `#version 300 es
    in vec4 a_position;
    in vec2 a_texcoord;
    uniform mat4 u_matrix;
    out vec2 v_texcoord;

    void main() {
        gl_Position = u_matrix * a_position;
        v_texcoord = a_texcoord;
    }
`;


const fragmentShaderAreia = `#version 300 es
    precision highp float;
    in vec2 v_texcoord;
    uniform sampler2D u_textura;
    out vec4 corFinal;

    void main() {

        // Lê a cor da textura
        vec4 corAreia = texture( u_textura,  v_texcoord );

        // Mantém nossa cor bege original
        vec3 areiaClara = vec3( 0.90, 0.82, 0.68 );

        // Mistura a textura com o bege
        vec3 corAjustada = mix(corAreia.rgb, areiaClara, 0.45 );
        corFinal = vec4(corAjustada,corAreia.a);
    }
`;
// Cria o programa responsável pela textura da areia
const programInfoAreia = twgl.createProgramInfo(
    gl,
    [
        vertexShaderAreia,
        fragmentShaderAreia
    ]
);


/****************************************************************************************************************
     VERTEX SHADER E FRAGMENT SHADER  - ILUMINAÇÃO PHONG
******************************************************************************************************************/
/* recebe a posição e a normal de cada vértice
o vetor normal indica a orientação da superfície, permitindo calcular quanto ela recebe de luz*/
const vertexShaderPhong = `#version 300 es
    in vec4 a_position;
    in vec3 a_normal;
    uniform mat4 u_matrix;
    uniform mat4 u_modelo;
    uniform mat4 u_matrizNormais;
    out vec3 v_posicao;
    out vec3 v_normal;

    void main() {
        gl_Position = u_matrix * a_position;      
        v_posicao = (u_modelo * a_position).xyz; // Posição do vértice no mundo 3D      
        v_normal = normalize(mat3(u_matrizNormais) * a_normal); // Normal transformada para o mundo 3D
    }
`; 


/* FRAGMENT SHADER DA ILUMINAÇÃO PHONG:
• o Phong é calculado por fragmento (pixel)
• A parte especular depende tanto da direção da luz quanto da posição da câmera*/
const fragmentShaderPhong = `#version 300 es
    precision highp float;
    in vec3 v_posicao;
    in vec3 v_normal;
    uniform vec4 u_color;
    uniform vec3 u_direcaoLuz; // Luz direcional do aquário
     uniform vec3 u_posicaoCamera; // Posição da câmera

    // Propriedades do material
    uniform float u_ambiente;
    uniform float u_difusa;
    uniform float u_especular;
    uniform float u_brilho;

    
    uniform bool u_iluminacaoAtiva; // Controle da iluminação Phong

    // Emissão própria da bolinha amarela
    uniform float u_emissao;
    uniform vec3 u_corEmissao;

    // Nova luz pontual do peixe
    uniform vec3 u_posicaoLuzPeixe;
    uniform bool u_luzPeixeAtiva;

    out vec4 outColor;

    void main() {

        
        vec3 luzEmitida = u_corEmissao * u_emissao; // Emissão própria do material

        // Quando a iluminação está desligada mostra a cor original e a emissão.
        if (!u_iluminacaoAtiva) {
            vec3 corFinal =
                u_color.rgb + luzEmitida;

            outColor = vec4(
                clamp(corFinal, 0.0, 1.0),
                u_color.a
            );

            return;
        }

        vec3 normal = normalize(v_normal);

        /********************************************************
            1 - LUZ DIRECIONAL DO AQUÁRIO
        ********************************************************/
        vec3 luz = normalize(u_direcaoLuz);

        
        float ambiente = u_ambiente; // Componente ambiente

        // Componente difusa
        float intensidadeDifusa = max(
            dot(normal, luz),
            0.0
        );

        float difusa = u_difusa * intensidadeDifusa;      
        vec3 direcaoCamera = normalize(u_posicaoCamera - v_posicao );   // Direção até a câmera      
        vec3 reflexao = reflect(-luz, normal);   // Componente especular

        float intensidadeEspecular = pow(
            max(dot(direcaoCamera, reflexao), 0.0),
            u_brilho
        );

        if (intensidadeDifusa == 0.0) {
            intensidadeEspecular = 0.0;
        }

        float especular =
            u_especular * intensidadeEspecular;

        // Resultado da luz direcional
        vec3 corDirecional =
            u_color.rgb * (ambiente + difusa)
            + vec3(especular);

        /********************************************************
            2 - LUZ PONTUAL DO PEIXE ABISSAL
        ********************************************************/

        vec3 luzPontual = vec3(0.0);

        if (u_luzPeixeAtiva) {
            // Vetor da superfície até a bolinha
            vec3 vetorLuz =
                u_posicaoLuzPeixe - v_posicao;
            
            float distancia = length(vetorLuz); // Distância até a fonte de luz        
            vec3 direcaoPontual = normalize(vetorLuz); // Direção da luz pontual

            // Iluminação difusa da luz pontual
            float difusaPontual = max(
                dot(normal, direcaoPontual),
                0.0
            );

            // A luz perde intensidade com a distância
            float atenuacao =
                1.0 / (
                    1.0
                    + 2.0 * distancia
                    + 2.0 * distancia * distancia
                );

            // Cor amarela da luz do peixe
            vec3 corLuzPontual = vec3(
                1.0,
                0.88,
                0.35
            );

            // Intensidade da luz
            float intensidadePontual = 2.5;

            // Luz que atinge a superfície
            luzPontual =
                u_color.rgb
                * corLuzPontual
                * difusaPontual
                * atenuacao
                * intensidadePontual;
        }

        /********************************************************
            3 - COR FINAL
        ********************************************************/

        vec3 corFinal =
            corDirecional
            + luzPontual
            + luzEmitida;

        outColor = vec4(
            clamp(corFinal, 0.0, 1.0),
            u_color.a
        );
    }
    `;//FIM
const programInfoPhong = twgl.createProgramInfo(gl, [
    vertexShaderPhong,
    fragmentShaderPhong
]);


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
        vertices.push( raio * Math.cos(angulo2), 0,raio * Math.sin(angulo2)); // Segundo ponto da borda
        vertices.push( raio * Math.cos(angulo1), 0, raio * Math.sin(angulo1)  //Primeiro ponto da borda
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
/*fim*/



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
} /* FIM*/


/* PARTE 2 */
const verticesHemisferio = criarHemisferioInferior(3, 64, 16);// Cria os vértices do hemisfério inferior

const bufferHemisferio = twgl.createBufferInfoFromArrays(gl, {
    a_position: {
        numComponents: 3,
        data: verticesHemisferio
    } // Envia os vértices para a GPU
}); /*FIM*/




/****************************************************************************************************************
    CONFIGURAÇÃO  DAS CÂMERAS
******************************************************************************************************************/
//CAMERA AUTOMÁTICA  ↓
let cameraAtiva = 1; // 1 = câmera automática | 2 = câmera orbital
let anguloCamera = 0; // Ângulo da câmera ao redor do aquário
let distanciaCamera = 10; // Distância da câmera ao centro
const velocidadeCamera = 0.3; // Velocidade da rotação em radianos por segundo
let tempoAnterior = 0; // Tempo do quadro anterior

//CAMERA ORBITAL  ↓
let anguloHorizontal = 0;
let anguloVertical = Math.PI / 4; //inclinação inicial de 45°
let arrastandoMouse = false;
let mouseAnteriorX = 0;
let mouseAnteriorY = 0;
const sensibilidadeMouse = 0.005;


/*------------------------MUDAR ESSA CONFIGURAÇÃO - PQ ESSE CÓDIGO ESTÁ NESSA PARTE?  -----------------------
/* PARTE 4*/
// Guarda o buffer da concha após o carregamento

let bufferConcha = null;// Buffer original da concha
let bufferConchaPhong = null; // Buffer com posições e normais para Phong


/* PARTE 5 - PERSONAGEM */
const peixe = new Peixe(gl, programInfo);
peixe.carregar();
let posicaoLuzPeixe = null; // Posição da luz amarela no mundo 3D
/* ------------------------------------------------------------------------------------------------------------*/



/****************************************************************************************************************
    DESENHAR CENA: 
    • IMPLEMENTAÇÃO DAS CÂMERAS,
    • PROJEÇÃO DE PERSPECTIVA, 
    • IMPLEMENTAÇÃO DAS CÂMERAS, 
    • BUFFERS DOS OBJETOS OBJ,
    • ILUMINAÇÃO PHONG,
    • PERSONAGEM,
    • HEMISFÉRIO SUPERIOR    
***************************************************************************************************************/
function desenharCena(tempoAtual = 0) {
    
    // CÂMERAS
    // Calcula quanto tempo passou desde o último quadro
    // (tempoAtual = 0) Recebe o tempo fornecido pelo requestAnimationFrame para calcular a movimentação da câmera
    const deltaTime = tempoAnterior === 0
        ? 0
        : (tempoAtual - tempoAnterior) / 1000;

    tempoAnterior = tempoAtual;
    
    if (cameraAtiva === 1) {
    anguloCamera += velocidadeCamera * deltaTime;
    }

    twgl.resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0); // Fundo totalmente transparente
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    // PROJEÇÃO PERSPECTIVA
    const aspecto = gl.canvas.width / gl.canvas.height;

    const projecao = twgl.m4.perspective( // cria uma matriz  de projeçãp perspectiva 4x4
        45 * Math.PI / 180, //campo de visão vertial da câmera = 45º (Math.PI / 180 é conversão para radiano)
        aspecto, //proporcao da tela: proporção entre a largura e a altura do canvas | aqui é 800/300 =~1,33
        0.1, //plano próximo
        100 //plano distante
    );


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
    } 

    // A câmera sempre olha para o centro do diorama
    const alvo = [0, 0, 0];
    const cima = [0, 1, 0];
    const camera = twgl.m4.lookAt(posicaoCamera, alvo, cima); // Cria a matriz da câmera na posição calculada
    const visualizacao = twgl.m4.inverse(camera);// Converte a matriz da câmera em matriz de visualização
    const matriz = twgl.m4.multiply(projecao, visualizacao);// Combina projeção e visualização
    posicaoLuzPeixe = peixe.obterPosicaoLuzMundo();// Atualiza a posição da luz pontual para acompanhar os movimentos do peixe


    
    /*AREIA*/
    gl.useProgram(programInfoAreia.program); // Ativa o programa da areia
    twgl.setBuffersAndAttributes(gl, programInfoAreia, bufferInfo); // Ativa o buffer do chão
    twgl.setUniforms(programInfoAreia, { u_matrix: matriz, u_textura: texturaAreia }); // Aplica a imagem
    //twgl.setUniforms(programInfoAreia, { u_matrix: matriz, u_textura: texturaAreia, u_luminosidadeCena: luminosidadeCena});
    twgl.drawBufferInfo(gl, bufferInfo); // Desenha o chão texturizado

    
    /* HEMISFÉRIO INFERIOR */
    // PRECISEI DE AJUDA PARA DAR CERTO!!! 
    gl.useProgram(programInfo.program); // Ativa o programa original
    twgl.setBuffersAndAttributes(gl, programInfo, bufferHemisferio); // Ativa o buffer do hemisfério

    // Impede que as tonalidades da concha afetem o hemisfério
    const localTonalidadeHemisferio = gl.getAttribLocation(programInfo.program, "a_shade");

    if (localTonalidadeHemisferio !== -1) {
        gl.disableVertexAttribArray(localTonalidadeHemisferio);
        gl.vertexAttrib1f(localTonalidadeHemisferio, 1.0);
    }

    //twgl.setUniforms(programInfo, { u_matrix: matriz, u_color: [0.15, 0.45, 0.65, 1.0] }); // Azul original
    twgl.setUniforms(programInfo, {
        u_matrix: matriz,
        u_color: [0.15 * luminosidadeCena, 0.45 * luminosidadeCena, 0.65 * luminosidadeCena, 1.0 ] 
    });
    
    twgl.drawBufferInfo(gl, bufferHemisferio);

    
    /*--------------------- BUFFERS DOS OBJETOS 3D DO DIORAMA ↓↓  -----------------------------------*/
  
    /* 1. CONCHA E ILUMINAÇÃO PHONG */
    if (bufferConchaPhong !== null) {

        
        let modeloConcha = twgl.m4.identity(); // Cria a matriz de modelagem da concha
        modeloConcha = twgl.m4.translate(modeloConcha,[1.5, 0.08, 0] );  // Mantém a posição original     
        modeloConcha = twgl.m4.rotateY(modeloConcha,-Math.PI / 2 ); // Mantém a rotação original no eixo Y
        modeloConcha = twgl.m4.rotateZ( modeloConcha, Math.PI / 2 ); // Mantém a rotação original no eixo Z     
        modeloConcha = twgl.m4.scale( modeloConcha, [12, 12, 12] ); // Mantém a escala original

        // Desenha a concha utilizando Phong
        desenharObjetoPhong(
            bufferConchaPhong,
            modeloConcha,
            [0.60, 0.38, 0.23, 1.0],
            materiais.concha,
            matriz,
            posicaoCamera
        );
        
        gl.useProgram(programInfo.program); // Restaura o programa original

        // Evita interferência dos atributos de Phong nos objetos desenhados depois
        const localTonalidadeConcha = gl.getAttribLocation(
            programInfo.program,
            "a_shade"
        );

        if (localTonalidadeConcha !== -1) {
            gl.disableVertexAttribArray(localTonalidadeConcha);
            gl.vertexAttrib1f(localTonalidadeConcha, 1.0);
        }
    }

    
      
    /* 2. ALGAS E ILUMINAÇÃO PHONG */
    /* REPETE A ESTRUTURA DA CONCHA COM ALGUMAS ALTERAÇÕES */
    if (bufferAlgaPhong !== null) {

        // Posições e tamanhos das cinco algas
        const algas = [
            {
                posicao: [-1.3, 0.05, -1.2],
                escala: 0.95
            },
            {
                posicao: [-0.3, 0.05, -1.6],
                escala: 0.60
            },
            {
                posicao: [-2.0, 0.05, -0.4],
                escala: 0.70
            },
            {
                posicao: [-2.1, 0.05, 0.9],
                escala: 0.50
            },
            {
                posicao: [-2.1, 0.05, 0.7],
                escala: 0.60
            }
        ];

        // Percorre as cinco algas
        for (const alga of algas) {

            let modeloAlga = twgl.m4.identity(); // Cria a matriz de modelagem

            // Posiciona a alga na areia
            modeloAlga = twgl.m4.translate(
                modeloAlga,
                alga.posicao
            );

            // Define o tamanho individual
            modeloAlga = twgl.m4.scale(
                modeloAlga,
                [
                    alga.escala,
                    alga.escala,
                    alga.escala
                ]
            );

            // Desenha a alga utilizando Phong
            desenharObjetoPhong(
                bufferAlgaPhong,
                modeloAlga,
                [0.12, 0.48, 0.20, 1.0],
                materiais.alga,
                matriz,
                posicaoCamera
            );
        }
      
        gl.useProgram(programInfo.program); // Restaura o programa original

        // Evita interferência nos atributos dos próximos objetos
        const localTonalidadeAlga = gl.getAttribLocation(
            programInfo.program,
            "a_shade"
        );

        if (localTonalidadeAlga !== -1) {
            gl.disableVertexAttribArray(localTonalidadeAlga);
            gl.vertexAttrib1f(localTonalidadeAlga, 1.0);
        }
    }
    

    
    /* 3. CONJUNTO DE ESTRELAS DO MAR E ILUMINAÇÃO PHONG */
    /* REPETE A ESTRUTURA DA CONCHA COM ALGUMAS ALTERAÇÕES */
    if (bufferEstrelaPhong !== null) {
        
        let modeloEstrela = twgl.m4.identity(); // Cria a matriz de modelagem

        // Posiciona o conjunto das estrelas na areia
        modeloEstrela = twgl.m4.translate(
            modeloEstrela,
            [0.5, 0.03, 0.8]
        );

        // Define o tamanho original do conjunto
        modeloEstrela = twgl.m4.scale(
            modeloEstrela,
            [0.18, 0.18, 0.18]
        );

        // Desenha as estrelas com iluminação Phong
        desenharObjetoPhong(
            bufferEstrelaPhong,
            modeloEstrela,
            [0.80, 0.35, 0.05, 1.0],
            materiais.estrela,
            matriz,
            posicaoCamera
        );
        
        gl.useProgram(programInfo.program); // Restaura o programa original

        // Impede que os atributos de Phong interfiram nos próximos objetos
        const localTonalidadeEstrela = gl.getAttribLocation(
            programInfo.program,
            "a_shade"
        );

        if (localTonalidadeEstrela !== -1) {
            gl.disableVertexAttribArray(localTonalidadeEstrela);
            gl.vertexAttrib1f(localTonalidadeEstrela, 1.0);
        }
    }



    /* 4. OURIÇOS E ILUMINAÇÃO PHONG */
    /* REPETE A ESTRUTURA DA CONCHA COM ALGUMAS ALTERAÇÕES */
    if (bufferOuricoPhong !== null) {

        // Posições e tamanhos dos três ouriços
        const ouricos = [
            {
                posicao: [-1.9, 0.04, 0.6],
                escala: 0.12
            },
            {
                posicao: [-1.0, 0.05, -1.4],
                escala: 0.12
            },
            {
                posicao: [-1.8, 0.05, -0.5],
                escala: 0.12
            }
        ];

        // Percorre os três ouriços
        for (const ourico of ouricos) {

            // Cria a matriz de modelagem
            let modeloOurico = twgl.m4.identity();

            // Posiciona o ouriço na areia
            modeloOurico = twgl.m4.translate(
                modeloOurico,
                ourico.posicao
            );

            // Define o tamanho individual
            modeloOurico = twgl.m4.scale(
                modeloOurico,
                [
                    ourico.escala,
                    ourico.escala,
                    ourico.escala
                ]
            );

            // Desenha o ouriço utilizando Phong
            desenharObjetoPhong(
                bufferOuricoPhong,
                modeloOurico,
                [0.0, 0.0, 0.0, 1.0],
                materiais.ourico,
                matriz,
                posicaoCamera
            );
        }

        // Restaura o programa original
        gl.useProgram(programInfo.program);

        // Evita que os atributos de Phong interfiram nos próximos objetos
        const localTonalidadeOurico = gl.getAttribLocation(
            programInfo.program,
            "a_shade"
        );

        if (localTonalidadeOurico !== -1) {
            gl.disableVertexAttribArray(localTonalidadeOurico);
            gl.vertexAttrib1f(localTonalidadeOurico, 1.0);
        }
    }


    /* 5. BOLACHA DO MAR E ILUMINAÇÃO PHONG */
    /* REPETE A ESTRUTURA DA CONCHA COM ALGUMAS ALTERAÇÕES */
    if (bufferBolachaPhong !== null) {
        
        let modeloBolacha = twgl.m4.identity(); // Cria a matriz de modelagem

        // Posiciona a bolacha-do-mar na areia
        modeloBolacha = twgl.m4.translate(
            modeloBolacha,
            [0.8, 0.03, 1.8]
        );

        // Define o tamanho original
        modeloBolacha = twgl.m4.scale(
            modeloBolacha,
            [0.014, 0.014, 0.014]
        );

        // Desenha a bolacha-do-mar com Phong
        desenharObjetoPhong(
            bufferBolachaPhong,
            modeloBolacha,
            [0.91, 0.85, 0.72, 1.0],
            materiais.bolacha,
            matriz,
            posicaoCamera
        );
        
        gl.useProgram(programInfo.program); // Restaura o programa original

        // Evita interferência nos atributos dos próximos objetos
        const localTonalidadeBolacha = gl.getAttribLocation(
            programInfo.program,
            "a_shade"
        );

        if (localTonalidadeBolacha !== -1) {
            gl.disableVertexAttribArray(localTonalidadeBolacha);
            gl.vertexAttrib1f(localTonalidadeBolacha, 1.0);
        }
    }
  
    /* 6 - CORAIS E ILUMINAÇÃO PHONG */
    /* REPETE A ESTRUTURA DA CONCHA COM ALGUMAS ALTERAÇÕES */
    if (bufferCoralPhong !== null) {

        const corais = [
            {
                posicao: [-0.7, 0.03, 1.8],
                escala: 0.18,
                cor: [0.68, 0.16, 0.36, 1.0]
            },
            {
                posicao: [-0.3, 0.03, -0.7],
                escala: 0.14,
                cor: [0.56, 0.35, 0.70, 1.0]
            }
        ];

        for (const coral of corais) {
            
            let modeloCoral = twgl.m4.identity(); 

            // Posiciona o coral
            modeloCoral = twgl.m4.translate(
                modeloCoral,
                coral.posicao
            );

            // Define o tamanho
            modeloCoral = twgl.m4.scale(
                modeloCoral,
                [coral.escala, coral.escala, coral.escala]
            );

            // Corrige as coordenadas originais do OBJ
            modeloCoral = twgl.m4.translate(
                modeloCoral,
                [75.49, -1.10, -0.65]
            );

            // Desenha o coral com iluminação Phong
            desenharObjetoPhong(
                bufferCoralPhong,
                modeloCoral,
                coral.cor,
                materiais.coral,
                matriz,
                posicaoCamera
            );
        }
  
        gl.useProgram(programInfo.program); // Restaura o programa original

        // Impede que o atributo das normais do Phong interfira nas tonalidades dos próximos objetos
        const localTonalidade = gl.getAttribLocation(
            programInfo.program,
            "a_shade"
        );

        if (localTonalidade !== -1) {
            gl.disableVertexAttribArray(localTonalidade);
            gl.vertexAttrib1f(localTonalidade, 1.0);
        }
    }

        
    /* 7 - CORAIS 2 E ILUMINAÇÃO PHONG*/
    /* REPETE A ESTRUTURA DA CONCHA COM ALGUMAS ALTERAÇÕES */
    if (bufferKelp5Phong !== null) {

        // Define a posição, tamanho e cor de cada coral
        const kelp = [
            {
                posicao: [0.50, 0.05, -1.5],
                escala: 0.45,
                cor: [0.72, 0.24, 0.22, 1.0] // Terracota
            },
            {
                posicao: [-1.0, 0.07, 0.6],
                escala: 0.30,
                cor: [0.75, 0.55, 0.15, 1.0] // Amarelo-mostarda
            }
        ];

        // Percorre os dois corais
        for (const coral of kelp) {
            let modeloKelp5 = twgl.m4.identity(); // Cria uma matriz de modelagem

            // Posiciona o coral
            modeloKelp5 = twgl.m4.translate(
                modeloKelp5,
                coral.posicao
            );

            // Define o tamanho
            modeloKelp5 = twgl.m4.scale(
                modeloKelp5,
                [
                    coral.escala,
                    coral.escala,
                    coral.escala
                ]
            );

            // Desenha o coral com iluminação Phong
            desenharObjetoPhong(
                bufferKelp5Phong,
                modeloKelp5,
                coral.cor,
                materiais.coral,
                matriz,
                posicaoCamera
            );
        }

        // Restaura o programa original
        gl.useProgram(programInfo.program);

        // Evita que o atributo das normais interfira nos objetos desenhados depois
        const localTonalidade = gl.getAttribLocation(
            programInfo.program,
            "a_shade"
        );

        if (localTonalidade !== -1) {
            gl.disableVertexAttribArray(localTonalidade);
            gl.vertexAttrib1f(localTonalidade, 1.0);
        }
    }

          
    /* PERSONAGEM PEIXE E ILUMINAÇÃO PHONG */
    peixe.atualizar(deltaTime);
    peixe.desenhar( matriz, posicaoCamera);


    /* CÚPULA SUPERIOR TRANSPARENTE */
    //JÁ TEMOS UM HEMISFÉRIO INFERIOR DAI PEGUEI ESSE HEMISFÉRIO INICIAL E O INVERTI
    //NÃO ALTEREI O TAMANHO SABE? 
    let modeloCupula = twgl.m4.identity(); // Cria uma matriz para a cúpula
    modeloCupula = twgl.m4.scale(modeloCupula, [1, -1, 1]);// Inverte o hemisfério inferior para ficar acima da areia
    const matrizCupula = twgl.m4.multiply(matriz, modeloCupula); // Combina a matriz da câmera com a matriz da cúpula
    gl.useProgram(programInfo.program); // Ativa o programa original
    twgl.setBuffersAndAttributes(gl, programInfo, bufferHemisferio); // Ativa o buffer do hemisfério
    const localTonalidadeCupula = gl.getAttribLocation(programInfo.program, "a_shade"); // Impede que as tonalidades da concha afetem a cúpula
    // estava interferindo, precisei de ajuda para resolver e resolvemos dessa forma 

    if (localTonalidadeCupula !== -1) {
        gl.disableVertexAttribArray(localTonalidadeCupula);
        gl.vertexAttrib1f(localTonalidadeCupula, 1.0);
    }
    //A IDEIA É UM AQUÁRIO ENTÃO A PARTE DE CIMA TEM QUE, INICIALMENTE SER TRANSPARENTE 
    //SE DER, VOU TENTAR COLOCAR TEXTURA DE ALGA!!! 
    // Habilita a transparência ↓↓↓ | O blending permite combinar a cor do vidro com a dos objetos que estão atrás dele!!
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false); // Impede que a cúpula altere o buffer de profundidade
    twgl.setUniforms(programInfo, { u_matrix: matrizCupula, u_color: [0.65, 0.85, 0.95, 0.12]}); // Define a matriz e a cor azul-clara transparente
    twgl.drawBufferInfo(gl, bufferHemisferio); // Desenha a cúpula

    // Restaura as configurações
    gl.depthMask(true);
    gl.disable(gl.BLEND);
        
    requestAnimationFrame(desenharCena); // Solicita o próximo quadro da animação
}

requestAnimationFrame(desenharCena);



/*******************************************************************************************
    EVENTOS: CAMERAS 1 E 2, TECLA P, TECLA L
 *******************************************************************************************/ 
//PARTE 3 - ALTERNANDO ENTRE AS CÂMERAS →  Alterna entre as câmeras usando as teclas 1 e 2
//PARTE 5 - TECLA P PARA ALTERNAR ENTRE 3 POSIÇÕES
//PARTE 7 - TECLA L PARA ILUMINAÇÃO PHONG

// Detectar as teclas pressionadas pelo usuário e executar os comandos das câmeras, do peixinho e da iluminação
// É um Event Listener que detecta quando o usuário pressiona uma tecla do teclado.

window.addEventListener("keydown", function(evento) {
    if (evento.key === "1") {
        cameraAtiva = 1;
        console.log("Câmera 1 - Automática");
    }

    if (evento.key === "2") {
        cameraAtiva = 2;
        console.log("Câmera 2 - Orbital");
    }

    if (evento.key.toLowerCase() === "p" && !evento.repeat) {
        peixe.alternarPosicao();
    }
    if (evento.key.toLowerCase() === "l" && !evento.repeat) {
        iluminacaoAtiva = !iluminacaoAtiva;

        console.log(
            "Iluminação Phong:",
            iluminacaoAtiva ? "Ligada" : "Desligada"
        );
    }

    }); 

// CONTROLANDO A CÂMERA 2 COM O MOUSE
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

canvas.addEventListener("wheel", function(evento) {
    evento.preventDefault();
    distanciaCamera += evento.deltaY * 0.01;
    // Limita a distância para não entrar no aquário,  acho legal ver apenas de forma aproximada
    distanciaCamera = Math.max(6,  Math.min(20, distanciaCamera));
}, { passive: false });



/*********************************************************************************
                    PARTE 4 - Adicionar os objetos 3D
// ********************************************************************************/ 
//USAR ARTUIVOS '.OBJ' POIS GLTF DÁ MUITO TRABALHO, NUUU! DEIXA GLTF PARA O PERSONAGEM, SE FOR NECESSÁRIO
// ESSA ESTRUTURA VAI SER REPETIDA PARA OS OUTROS OBJETOS, SALVO ALGUMAS EXCEÇÕES


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


    /* -------------------------------------------------------------------------------------
       ETAPA 1 - PREPARAR OS DADOS DO OBJ
    -------------------------------------------------------------------------------------- */
    const linhas = conteudoOBJ.split(/\r?\n/); // Divide o conteúdo do arquivo em linhas
    const vertices = []; // Array que armazenará as posições dos vértices: x, y, z, x, y, z, ...
    const indices = []; // Array que armazenará os índices das faces


    /* ---------------------------------------------------------------------------------------
       ETAPA 2 - LER OS VÉRTICES E AS FACES
       ------------------------------------------------------------------------------------ */
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


        /* -----------------------------------------------------------------------------------
           ETAPA 3 - LER E TRIANGULAR AS FACES
           ------------------------------------------------------------------------------- */
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
                         
            PORQUE? porque a maioria dos objetos do mar que encontrei como estrela do mar, algas, etc,tem faces com 4 vértices e
            o código que eu tinha antes era somente para faces trinangulares, por causa da concha. */

            for (let i = 1; i < indicesFace.length - 1; i++) {
                indices.push(indicesFace[0], indicesFace[i], indicesFace[i + 1]); // Adiciona os três índices de um triângulo
            }
        }

    } // FIM DO FOR QUE PERCORRE AS LINHAS DO OBJ


    /* -------------------------------------------------------------------------------------
       ETAPA 4 - CONFERIR OS DADOS LIDOS
       ----------------------------------------------------------------------------------- */
    console.log("Quantidade de vértices:",vertices.length / 3); // Cada vértice possui três coordenadas: X, Y e Z 
    console.log("Quantidade de índices:",indices.length); // Mostra o total de índices após a triangulação
    console.log("Quantidade de triângulos:",indices.length / 3); // Cada triângulo utiliza três índices
    console.log("Primeiros índices:",indices.slice(0, 12));  // Mostra os primeiros 12 índices para conferência


    /* -------------------------------------------------------------------------------------------
       ETAPA 5 - CRIAR O BUFFER PARA O WEBGL
       ------------------------------------------------------------------------------------------ */
    // Cria o buffer com os vértices e índices do OBJ
    bufferConcha = twgl.createBufferInfoFromArrays(gl, {
        a_position: {
            numComponents: 3,
            data: vertices
        },

        indices: new Uint16Array(indices)
    });

    const verticesConchaPhong = []; //Array que armazenará os vértices organizados em triângulos

    // Percorre os índices das faces do OBJ
    for (let i = 0; i < indices.length; i++) {       
        const indice = indices[i] * 3; // Localiza a posição do vértice no array original

        // Copia as coordenadas X, Y e Z
        verticesConchaPhong.push(
            vertices[indice],
            vertices[indice + 1],
            vertices[indice + 2]
        );
    }

    // Cria o buffer com posições e normais
    bufferConchaPhong = criarBufferPhong(
        gl,
        verticesConchaPhong
    );

    console.log("Buffer Phong da concha criado!");
    console.log("Concha carregada com uma única cor!");
    console.log("Triângulos:", indices.length / 3);

    } // FIM DA FUNÇÃO carregarConcha()

carregarConcha(); // Executa o carregamento da concha



/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   ALGA 1    ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoAlga = "assets/models/alga/SeaWeed.obj";
let bufferAlga = null;      // Buffer original
let bufferAlgaPhong = null; // Buffer com normais para Phong

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

    
    /* PARTE 7 - BUFFER PHONG DAS ALGAS */
        const verticesAlgaPhong = []; // Array com os vértices organizados em triângulos

        // Percorre os índices das faces do modelo OBJ
        for (let i = 0; i < indices.length; i++) {      
            const indice = indices[i] * 3; 

            // Copia as coordenadas X, Y e Z
            verticesAlgaPhong.push(
                vertices[indice],
                vertices[indice + 1],
                vertices[indice + 2]
            );
        }

        // Cria o buffer com posições e normais
        bufferAlgaPhong = criarBufferPhong(
            gl,
            verticesAlgaPhong
        );

        console.log("Buffer Phong das algas criado!");
        console.log("Alga carregada com sucesso!");
        console.log("Vértices da alga:", vertices.length / 3);
        console.log("Triângulos da alga:", indices.length / 3);
    }
carregarAlga();


/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   ESTRELA DO MAR - CONJUNTO    ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoEstrela = "assets/models/estrela/starfish.obj";
let bufferEstrela = null;      // Buffer original das estrelas
let bufferEstrelaPhong = null; // Buffer com normais para Phong

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


    /* PARTE 7 - BUFFER PHONG DAS ESTRELAS-DO-MAR */
    const verticesEstrelaPhong = []; // Array para armazenar os vértices dos triângulos

    // Percorre os índices das faces do OBJ
    for (let i = 0; i < indices.length; i++) {       
        const indice = indices[i] * 3; // Encontra a posição do vértice no array original

        // Copia as coordenadas X, Y e Z
        verticesEstrelaPhong.push(
            vertices[indice],
            vertices[indice + 1],
            vertices[indice + 2]
        );
    }

    // Cria o buffer com posições e normais
    bufferEstrelaPhong = criarBufferPhong(
        gl,
        verticesEstrelaPhong
    );

    console.log("Buffer Phong das estrelas-do-mar criado!");
    console.log("Estrelas-do-mar carregadas com sucesso!");
    console.log("Vértices:", vertices.length / 3);
    console.log("Triângulos:", indices.length / 3);
    console.log("Buffer das estrelas criado!", bufferEstrela);
}
carregarEstrela();



/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   OURIÇO   ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoOurico = "assets/models/ourico/Mesh_SeaUrchin.obj";
let bufferOurico = null;      // Buffer original
let bufferOuricoPhong = null; // Buffer com normais para Phong

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


    /* PARTE 7 - BUFFER PHONG DOS OURIÇOS-DO-MAR */
    const verticesOuricoPhong = []; // Array para armazenar os vértices organizados em triângulos

    // Percorre os índices das faces do OBJ
    for (let i = 0; i < indices.length; i++) {
        const indice = indices[i] * 3; // Localiza o vértice no array original

        // Copia as coordenadas X, Y e Z
        verticesOuricoPhong.push(
            vertices[indice],
            vertices[indice + 1],
            vertices[indice + 2]
        );
    }

    // Cria o buffer com posições e normais
    bufferOuricoPhong = criarBufferPhong(
        gl,
        verticesOuricoPhong
    );

    console.log("Buffer Phong dos ouriços criado!");
       console.log("Ouriço carregado com sucesso!");
    console.log("Vértices do ouriço:", vertices.length / 3);
    console.log("Triângulos do ouriço:", indices.length / 3);
    console.log("Buffer do ouriço criado!", bufferOurico);
}
carregarOurico();




/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   BOLACHA-DO-MAR  ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoBolacha = "assets/models/bolacha/Mesh_SandDollar.obj";
let bufferBolacha = null;      // Buffer original
let bufferBolachaPhong = null; // Buffer com normais para Phong

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



    /* PARTE 7 - BUFFER PHONG DA BOLACHA-DO-MAR */
    const verticesBolachaPhong = [];  // Array para armazenar os vértices organizados em triângulos

    // Percorre os índices das faces do OBJ
    for (let i = 0; i < indices.length; i++) {    
        const indice = indices[i] * 3; // Localiza o vértice no array original

        // Copia as coordenadas X, Y e Z
        verticesBolachaPhong.push(
            vertices[indice],
            vertices[indice + 1],
            vertices[indice + 2]
        );
    }

    // Cria o buffer com posições e normais
    bufferBolachaPhong = criarBufferPhong(
        gl,
        verticesBolachaPhong
    );

    console.log("Buffer Phong da bolacha-do-mar criado!");
    console.log("Bolacha-do-mar carregada com sucesso!");
    console.log("Vértices:", vertices.length / 3);
    console.log("Triângulos:", indices.length / 3);
    console.log("Buffer da bolacha criado!", bufferBolacha);
}
carregarBolacha();




/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   CORAIS  1  ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoCoral = "assets/models/coral/Coraal.obj";
let bufferCoral = null;      // Buffer original
let bufferCoralPhong = null; // Buffer com normais para a iluminação

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


    //PARTE 7 - ILUMINAÇÃO PHONG 
    /* CRIAR BUFFER DO CORAL COM NORMAIS */  
    const verticesCoralPhong = []; // Novo array com os vértices organizados em triângulos

    // Percorre os índices das faces
    for (let i = 0; i < indices.length; i++) {

        const indice = indices[i] * 3; // Encontra a posição do vértice no array original

        // Copia as coordenadas X, Y e Z
        verticesCoralPhong.push(
            vertices[indice],
            vertices[indice + 1],
            vertices[indice + 2]
        );
    }

    // Cria o buffer com posições e normais
    bufferCoralPhong = criarBufferPhong(
        gl,
        verticesCoralPhong
    );

    console.log("Buffer Phong do coral criado!");
    console.log("Coral carregado com sucesso!");
    console.log("Vértices do coral:", vertices.length / 3);
    console.log("Triângulos do coral:", indices.length / 3);
    console.log("Buffer do coral criado!", bufferCoral);
}
carregarCoral();




/* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓   CORAIS 2    ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
const caminhoKelp5 = "assets/models/coral/kelp5.obj";
let bufferKelp5 = null;      // Buffer original
let bufferKelp5Phong = null; // Buffer com normais para Phong

async function carregarKelp5() {
    const resposta = await fetch(caminhoKelp5);

    if (!resposta.ok) {
        console.error("Erro ao carregar o Kelp 5!");
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
                indices.push(indicesFace[0], indicesFace[i], indicesFace[i + 1]);
            }
        }
    }

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


    bufferKelp5 = twgl.createBufferInfoFromArrays(gl, {
        a_position: { numComponents: 3, data: vertices },
        indices: new Uint16Array(indices)
    });


    /* PARTE 7 - BUFFER PHONG DOS CORAIS KELP5 */
    const verticesKelp5Phong = [];
  
    for (let i = 0; i < indices.length; i++) {
        const indice = indices[i] * 3;

        verticesKelp5Phong.push(
            vertices[indice],
            vertices[indice + 1],
            vertices[indice + 2]
        );
    }

    bufferKelp5Phong = criarBufferPhong(
        gl,
        verticesKelp5Phong
    );

    console.log("Buffer Phong do Kelp5 criado!");
    console.log("Kelp 5 carregado com sucesso!");
    console.log("Vértices:", vertices.length / 3);
    console.log("Triângulos:", indices.length / 3);
    console.log("Buffer do Kelp 5 criado!", bufferKelp5);
}
carregarKelp5();



/************************************************************************
ACDICIONAR O PERSONAGEM
*************************************************************************/

//O PROFESSOR DEU A IDEIA DE SEPARAR POR CLASSES E PARA O PEIXE EU ACHEI UMA EXCELENTE IDEIA.
//O PEIXE TEM QUE MUDAR DE POSIÇÃO 
// O PEIXE TEM VÁRIAS CORES
//SEGUE O ARQUIVO "PEIXE.JS"

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
// • calcula uma normal por face pois estamos usando low poly
// • funciona quando vertices contém triângulos já separados
function calcularNormais(vertices) {
    
    const normais = [];

    // Cada triângulo possui 3 vértices.
    // Cada vértice possui coordenadas X, Y e Z.
    for (let i = 0; i < vertices.length; i += 9) {
        const p1 = vertices.slice(i, i + 3);
        const p2 = vertices.slice(i + 3, i + 6);
        const p3 = vertices.slice(i + 6, i + 9);
   
        const u = [ p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2] ];   // Vetor do primeiro lado

        const v = [ p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2] ]; // Vetor do segundo lado

        // Produto vetorial: normal à superfície
        const nx = u[1] * v[2] - u[2] * v[1];
        const ny = u[2] * v[0] - u[0] * v[2];
        const nz = u[0] * v[1] - u[1] * v[0];

        // Normaliza o vetor
        const comprimento =  Math.hypot(nx, ny, nz) || 1;
        const normal = [ nx / comprimento, ny / comprimento, nz / comprimento ];

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
} //FIM


/*************************************************************************
    APLICAÇÃO DA ILUMINAÇÃO PHONG
**************************************************************************/
//controle para a luminosidade do cenário
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
    }

};



//ILUMINAÇÃO PHONG COM EMISSÃO
//A BOLINHA AMARELA É EMISSORA DE LUZ PONTUAL 
function desenharObjetoPhong(
    buffer,
    modelo,
    cor,
    material,
    matrizCamera,
    posicaoCamera,
    emissao = 0.0
) {

    
    const matrizFinal = twgl.m4.multiply( matrizCamera, modelo); // Combina a câmera com a transformação do objeto 
    const matrizNormais = twgl.m4.transpose( twgl.m4.inverse(modelo) );    // Transforma as normais
    gl.useProgram(programInfoPhong.program);
    twgl.setBuffersAndAttributes( gl,programInfoPhong,buffer );

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



/***********************************************************************
 Implementar modelagem hierárquica 
************************************************************************/




/************************************************************************
 Testar, documentar e publicar
*************************************************************************/