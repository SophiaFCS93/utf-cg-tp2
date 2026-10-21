# COMO ESTOU PENSANDO ESSE TRABALHO INICIALMENTE? 

→ Aquário fechado, inspirado nas Pokébolas das referências do professor, mas sem Pokémon
→ Base inferior arredondada, chão circular e uma parte superior transparente, permitindo visualizar o cenário em 360°
→ Base inferior: Hemisfério azul-marinho, lembrando o fundo do oceano
→ Chão: Disco de areia bege
→ Cúpula: Semiesfera transparente que fecha o diorama (como um globo de neve)
→ Personagem: animal marinho fictício ou real
→ Decoração: Corais, algas, pedras, conchas e estrela-do-mar, fóssil, ancora
→ Objeto hierárquico: Baú articulado ou pequeno moinho subaquático
→ Iluminação: Luz azulada simulando a iluminação da água? 

# PODE SER AQUELE PEIXE COM LUZ? 
https://www.cgtrader.com/3d-models/animal/fish/peixe-lanterna 
https://www.meshy.ai/pt-BR/tags/fish  


# PODE SER UM MERGULHADOR? 
https://sketchfab.com/3d-models/old-school-diver-free-19a83e61364f4bcc964eb749529a70e6


# PODE SER UM SUBMARINO? 
https://theunseenvulga.itch.io/ocean-vehicle-pack 


# PEIXES E ANIMAIS MARINHOS EM 3D
https://polyyai.itch.io/3d-fish-pack --------- OLHA QUE LEGAL!!
https://www.fab.com/listings/15a15d83-737b-4361-8ff9-a215c83a5607 
https://www.fab.com/listings/6339b958-9535-40ef-baaf-37d6bcaf4950 



# ONDE CONSEGUIR AS COISAS?
→ INSPIRAÇÃO: 
1- https://sketchfab.com/3d-models/underwater-diorama-0974de1a9bb7415d8f39ae5eaeecfb3c  
2- https://sketchfab.com/3d-models/above-and-below-39abb5860a584e3fb2ec6cee5ecce2db 
3- https://sketchfab.com/3d-models/aquarium-7b04425c2f0f48c5a07d634431f93e02 --------- OLHA QUE LEGAL!!
4- https://sketchfab.com/3d-models/ancient-aquarium-00caf44781e247aea99303ef8f078ab5


→ ONDE PEGAR ASSETS EM 3D COM A TEMÁTICA OCEANO/AQUÁRIO: 
1- https://poly.pizza/bundle/Coral-Reef-Kit-ghN8EmbYa6 
2- https://poly.pizza/search/reefs
3- https://poly.pizza/search/Marine%20Life  
 

# CHÃO
 → A IDEIA É TER UM CHÃO DE AREIA
1- Criar o chão com WebGL: utilizar um cilindro bem achatado ou um disco circular e aplicar uma textura de areia.
2- Importar um modelo 3D: baixar um fundo de areia já modelado com o formato adequado.

# REFERÊNCIAS PARA A PRODUÇÃO DO TP2 
→ MATERIAL DO PROFESSOR (TODOS OS SLIDES)
→ The WebGL Globe: https://experiments.withgoogle.com/chrome/globe 
→ WebGL2 3D Geometry - Lathe: https://webgl2fundamentals.org/webgl/lessons/webgl-3d-geometry-lathe.html
→ WebGL2 Drawing Without Data:https://webgl2fundamentals.org/webgl/lessons/webgl-drawing-without-data.html?utm_source=chatgpt.com
→ WebGL model view projection: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection?utm_source=chatgpt.com
→ Documentação TWGL.js: https://twgljs.org/docs/module-twgl.html?utm_source=chatgpt.com
→ 


# PARTE 1 PRIMITIVA 
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
    const matriz = twgl.m4.multiply(projecao,visualizacao); // multiplica as matrizes projeção e visualização
    gl.useProgram(programInfo.program); // ativa o programa WebGL
    twgl.setBuffersAndAttributes(gl,programInfo,bufferInfo); // configura os buffers com as posições dos vértices
    twgl.setUniforms(programInfo, {u_matrix: matriz});// envie a matriz que calculamos no JavaScript para a variável u_matrix do shader para calcular a posição final dos vértices
    twgl.drawBufferInfo(gl, bufferInfo);  // desenha os triângulos
}

desenharCena();

