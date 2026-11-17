// CÚPULA SUPERIOR TRANSPARENTE
// Desenhada por último, para que o vidro se misture com tudo o que está atrás dele.
// Recebe a matriz de projeção × visualização calculada em desenharCena().

function desenharCupula(matriz) {
  //JÁ TEMOS UM HEMISFÉRIO INFERIOR DAI PEGUEI ESSE HEMISFÉRIO INICIAL E O INVERTI
  //NÃO ALTEREI O TAMANHO SABE?
  let modeloCupula = twgl.m4.identity(); // Cria uma matriz para a cúpula
  modeloCupula = twgl.m4.scale(modeloCupula, [1, -1, 1]); // Inverte o hemisfério inferior para ficar acima da areia
  const matrizCupula = twgl.m4.multiply(matriz, modeloCupula); // Combina a matriz da câmera com a matriz da cúpula
  gl.useProgram(programInfoCupula.program); // Ativa o programa da cúpula (facetas com brilho e transparência)
  twgl.setBuffersAndAttributes(gl, programInfoCupula, bufferCupula); // Ativa o buffer low-poly (posições + tonalidades)
  // A IDEIA É UM AQUÁRIO ENTÃO A PARTE DE CIMA TEM QUE, INICIALMENTE SER TRANSPARENTE
  // SE DER, VOU TENTAR COLOCAR TEXTURA DE ALGA!!!
  // Habilita a transparência ↓↓↓ | O blending permite combinar a cor do vidro com a dos objetos que estão atrás dele!!
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false); // Impede que a cúpula altere o buffer de profundidade
  twgl.setUniforms(programInfoCupula, {
    u_matrix: matrizCupula,
    u_color: [0.65, 0.85, 0.95, 0.1],
  }); // Define a matriz e a cor azul-clara transparente
  twgl.drawBufferInfo(gl, bufferCupula); // Desenha a cúpula

  // Restaura as configurações
  gl.depthMask(true);
  gl.disable(gl.BLEND);
  zerarTonalidade(); // a cúpula usa a_shade como array; depois dela o atributo volta ao valor neutro
}
