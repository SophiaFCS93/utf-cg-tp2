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

function alternarIluminacao() {
    iluminacaoAtiva = !iluminacaoAtiva;
    console.log("Iluminação Phong:", iluminacaoAtiva ? "Ligada" : "Desligada");
    atualizarBotoes();
}

// MÚSICA DE FUNDO (tecla M ou botão)

const musicaFundo = new Audio("assets/music/fundoMar.mp3");
musicaFundo.loop = true;   // repete quando acabar, ou seja, NUNCA tem 3h de musica
musicaFundo.volume = 0.6;

function alternarMusica() {
    if (musicaFundo.paused) {
        musicaFundo.play();
    } else {
        musicaFundo.pause();
    }
}

// deixa o botao da musica sincornixaod, caso a musica estja tocando ele está ativo, caso esteja pausada ele está inativo
musicaFundo.addEventListener("play", function () { atualizarBotoes(); });
musicaFundo.addEventListener("pause", function () { atualizarBotoes(); });

// BOTÕES NA TELA
const botoesComando = document.querySelectorAll("button[data-acao]");

// Destaca o botao
function atualizarBotoes() {
    for (const botao of botoesComando) {
        const valor = Number(botao.dataset.valor);
        let ativo = false;

        if (botao.dataset.acao === "camera") ativo = cameraAtiva === valor;
        if (botao.dataset.acao === "iluminacao") ativo = iluminacaoAtiva;
        if (botao.dataset.acao === "musica") ativo = !musicaFundo.paused;

        botao.classList.toggle("ativo", ativo);
        botao.setAttribute("aria-pressed", ativo);
    }
}

for (const botao of botoesComando) {
    botao.addEventListener("click", function () {
        const valor = Number(botao.dataset.valor);

        if (botao.dataset.acao === "camera") selecionarCamera(valor);
        if (botao.dataset.acao === "alternar-peixe") alternarPosicaoPeixe();
        if (botao.dataset.acao === "iluminacao") alternarIluminacao();
        if (botao.dataset.acao === "musica") alternarMusica();
    });
}

atualizarBotoes(); // Estado inicial

// TECLADO
window.addEventListener("keydown", function (evento) {
    if (evento.key === "1") selecionarCamera(1);
    if (evento.key === "2") selecionarCamera(2);

    if (evento.key.toLowerCase() === "p" && !evento.repeat) alternarPosicaoPeixe();
    if (evento.key.toLowerCase() === "l" && !evento.repeat) alternarIluminacao();
    if (evento.key.toLowerCase() === "m" && !evento.repeat) alternarMusica();
});