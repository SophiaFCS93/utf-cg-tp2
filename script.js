//IDEIA DE DIORAMA: AQUÁRIO 

//SOMENTE INICIALIZANDO O WEBGL2, PINTANDO O CANVAS DE AZUL PARA TERMOS UM CORPO INCIAL
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2");

gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); // Define a área de renderização
gl.clearColor(0.4, 0.7, 0.9, 1.0); // Define a cor de fundo do canvas
gl.clear(gl.COLOR_BUFFER_BIT); // Limpa o canvas com a cor definida