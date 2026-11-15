/* CONTEXTO WEBGL2 */
const canvas = document.querySelector("#canvas"); // INICIALIZANDO O WEBGL2
const gl = canvas.getContext("webgl2", { alpha: true }); // para que o canvas tenha transparência sabe?
gl.enable(gl.DEPTH_TEST);// Habilitando a comparação de profundidade | permite que objetos mais próximos ocultem superfícies mais distante

/************************************************************************************************************
    SHADERS E PROGRAMAS
************************************************************************************************************/

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
const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]); // Cria o programa WebGL 

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
    `;

const programInfoPhong = twgl.createProgramInfo(gl, [
    vertexShaderPhong,
    fragmentShaderPhong
]);