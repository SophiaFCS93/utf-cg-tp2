/****************************************************************************************************************
                → IDEIA DE DIORAMA: AQUÁRIO  
                → TP2 - PARAÍSO SUBMERSO
******************************************************************************************************************/

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
    // O próximo quadro é pedido no início: se algum modelo ainda não carregou e o desenho falhar,
    // a animação continua e a cúpula/cenário aparecem no quadro seguinte.
    requestAnimationFrame(desenharCena);

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
    twgl.setBuffersAndAttributes(gl, programInfo, bufferBase); // Ativa o buffer da base
    // twgl.setBuffersAndAttributes(gl, programInfo, bufferHemisferio); // Ativa o buffer do hemisfério


    //twgl.setUniforms(programInfo, { u_matrix: matriz, u_color: [0.15, 0.45, 0.65, 1.0] }); // Azul original
    twgl.setUniforms(programInfo, {
        u_matrix: matriz,
        u_color: [0.15 * luminosidadeCena, 0.45 * luminosidadeCena, 0.65 * luminosidadeCena, 1.0]
    });

    //twgl.drawBufferInfo(gl, bufferHemisferio);
    twgl.drawBufferInfo(gl, bufferBase);
    // Impede que as tonalidades da concha afetem o hemisfério
    zerarTonalidade();

    /*--------------------- OBJETOS 3D DO DIORAMA ↓↓  -----------------------------------*/
    // Concha, algas, estrelas, ouriços, bolacha e corais: lista completa em src/cenario.js
    for (const grupo of cenario) {
        desenharGrupo(grupo, matriz, posicaoCamera);
    }

    /* BAÚ */
    desenharBau(matriz, posicaoCamera, tempoAtual);

    /* PERSONAGEM PEIXE E ILUMINAÇÃO PHONG */
    // peixe.atualizar(deltaTime);
    peixe.desenhar(matriz, posicaoCamera);

    /* CÚPULA SUPERIOR TRANSPARENTE - sempre por último */
    desenharCupula(matriz);
}

requestAnimationFrame(desenharCena);