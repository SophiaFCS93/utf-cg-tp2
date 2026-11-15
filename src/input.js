/*******************************************************************************************
    COMANDOS: CÂMERAS 1 E 2, TECLA P (POSIÇÕES DO PEIXE), TECLA L (ILUMINAÇÃO PHONG)
    • Cada comando funciona pelo teclado E pelos botões da tela (index.html, atributos data-acao).
    • Teclado e botões chamam as mesmas funções, então sempre fazem exatamente a mesma coisa.
 *******************************************************************************************/

// AÇÕES
function selecionarCamera(numero) {
    cameraAtiva = numero;
    console.log(numero === 1 ? "Câmera 1 - Automática" : "Câmera 2 - Orbital");
    atualizarBotoes();
}

function alternarPosicaoPeixe() {
    peixe.alternarPosicao();
    atualizarBotoes();
}

function irParaPosicaoPeixe(indice) {
    peixe.irParaPosicao(indice);
    atualizarBotoes();
}

function alternarIluminacao() {
    iluminacaoAtiva = !iluminacaoAtiva;
    console.log("Iluminação Phong:", iluminacaoAtiva ? "Ligada" : "Desligada");
    atualizarBotoes();
}


// BOTÕES NA TELA
const botoesComando = document.querySelectorAll("button[data-acao]");

// Destaca (classe "ativo") o botão que corresponde ao estado atual
function atualizarBotoes() {
    for (const botao of botoesComando) {
        const valor = Number(botao.dataset.valor);
        let ativo = false;

        if (botao.dataset.acao === "camera") ativo = cameraAtiva === valor;
        if (botao.dataset.acao === "iluminacao") ativo = iluminacaoAtiva;
        if (botao.dataset.acao === "pose") {
            ativo = peixe.posicaoAtual === valor && botao.dataset.semDestaque === undefined;
        }

        botao.classList.toggle("ativo", ativo);
        botao.setAttribute("aria-pressed", ativo);
    }
}

for (const botao of botoesComando) {
    botao.addEventListener("click", function() {
        const valor = Number(botao.dataset.valor);

        if (botao.dataset.acao === "camera") selecionarCamera(valor);
        if (botao.dataset.acao === "alternar-peixe") alternarPosicaoPeixe();
        if (botao.dataset.acao === "pose") irParaPosicaoPeixe(valor);
        if (botao.dataset.acao === "iluminacao") alternarIluminacao();
    });
}

atualizarBotoes(); // Estado inicial


// TECLADO
window.addEventListener("keydown", function(evento) {
    if (evento.key === "1") selecionarCamera(1);
    if (evento.key === "2") selecionarCamera(2);

    if (evento.key.toLowerCase() === "p" && !evento.repeat) alternarPosicaoPeixe();
    if (evento.key.toLowerCase() === "l" && !evento.repeat) alternarIluminacao();
});