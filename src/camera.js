/****************************************************************************************************************
    CONFIGURAÇÃO  DAS CÂMERAS
******************************************************************************************************************/
//CAMERA AUTOMÁTICA  ↓
let cameraAtiva = 1; // 1 = câmera automática | 2 = câmera orbital
let anguloCamera = 0; // Ângulo da câmera ao redor do aquário
let distanciaCamera = 10; // Distância da câmera ao centro
const velocidadeCamera = 0.3; // Velocidade da rotação em radianos por segundo
let tempoAnterior = 0; // Tempo do quadro anterior

// CAMERA ORBITAL  ↓
let anguloHorizontal = 0;
let anguloVertical = Math.PI / 4; // inclinação inicial de 45°
let arrastandoMouse = false;
let mouseAnteriorX = 0;
let mouseAnteriorY = 0;
const sensibilidadeMouse = 0.005;

// CONTROLANDO A CÂMERA 2 COM O MOUSE
// Inicia o movimento quando pressionamos o mouse
canvas.addEventListener("pointerdown", function (evento) {
    if (cameraAtiva !== 2) return;
    arrastandoMouse = true;
    mouseAnteriorX = evento.clientX;
    mouseAnteriorY = evento.clientY;
    canvas.setPointerCapture(evento.pointerId);
});

// Movimenta a câmera enquanto arrastamos o mouse
canvas.addEventListener("pointermove", function (evento) {
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

function pararArraste() { arrastandoMouse = false; } // Encerra o movimento quando soltamos o mouse
canvas.addEventListener("pointerup", pararArraste);
canvas.addEventListener("pointercancel", pararArraste);

canvas.addEventListener("wheel", function (evento) {
    evento.preventDefault();
    distanciaCamera += evento.deltaY * 0.01;
    // Limita a distância para não entrar no aquário,  acho legal ver apenas de forma aproximada
    distanciaCamera = Math.max(6, Math.min(20, distanciaCamera));
}, { passive: false });
