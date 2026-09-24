/* ============================================================
   NEURODIVERGÊNCIA
   JAVASCRIPT PRINCIPAL
============================================================ */

/*
    IMPORTANTE:

    Este é o ÚNICO lugar do frontend onde a URL do backend
    é configurada.

    NÃO coloque a chave Gemini aqui.

    A chave deve permanecer no backend.
*/

const CONFIG = Object.freeze({

    API_URL:
        "https://script.google.com/macros/s/AKfycbwh_ihAxxU-eM7YSmDzX-rDP4XabCABM6OON0KKs3Gwx0vvSOCQRxTxUOj2ZAIRbppf/exec",

    QUESTOES_INICIAIS: 18,

    QUESTOES_ADAPTATIVAS: 6,

    TOTAL_QUESTOES: 24

});


/* ============================================================
   ESTADO
============================================================ */

const estado = {

    aluno: {
        nome: "",
        idade: "",
        ano: "",
        materia: "",
        conteudo: "",
        observacoes: ""
    },

    questoes: [],

    respostas: [],

    indiceQuestao: 0,

    inicioQuestao: 0,

    questaoRespondida: false,

    indiceEstrategia: null,

    relatorio: null,

    atividadesAdaptadas: []

};


/* ============================================================
   ESTRATÉGIAS
============================================================ */

const ESTRATEGIAS = Object.freeze({

    etapas: "Divisão em etapas",

    visual: "Apoio visual",

    claras: "Instruções claras",

    repeticao: "Repetição adaptativa"

});


/* ============================================================
   UTILIDADES
============================================================ */

function $(id) {
    return document.getElementById(id);
}


function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function mostrarTela(id) {

    document.querySelectorAll(".tela").forEach(function(tela) {
        tela.classList.remove("ativa");
    });

    const tela = $(id);

    if (!tela) {
        console.error("Tela não encontrada:", id);
        return;
    }

    tela.classList.add("ativa");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function esperar(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}


/* ============================================================
   API
============================================================ */

async function chamarAPI(payload) {

    if (!CONFIG.API_URL) {
        throw new Error("URL do backend não configurada.");
    }

    const resposta = await fetch(CONFIG.API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },

        body: JSON.stringify(payload)

    });

    const texto = await resposta.text();

    let dados;

    try {

        dados = JSON.parse(texto);

    } catch (erro) {

        console.error("Resposta recebida do backend:", texto);

        throw new Error(
            "O backend não retornou uma resposta JSON válida."
        );
    }

    if (!resposta.ok) {

        throw new Error(
            dados.mensagem ||
            dados.error ||
            "Erro na comunicação com o servidor."
        );

    }

    if (dados.ok === false) {

        throw new Error(
            dados.mensagem ||
            dados.error ||
            "O backend informou que a operação falhou."
        );

    }

    return dados;
}


/* ============================================================
   CONFIGURAÇÃO
============================================================ */

function obterDadosFormulario() {

    return {

        nome: $("nome").value.trim(),

        idade: $("idade").value.trim(),

        ano: $("ano").value.trim(),

        materia: $("materia").value.trim(),

        conteudo: $("conteudo").value.trim(),

        observacoes: $("observacoes").value.trim()

    };

}


function validarDados(dados) {

    if (!dados.nome) {
        return "Informe o nome do estudante.";
    }

    if (!dados.idade) {
        return "Informe a idade do estudante.";
    }

    if (!dados.ano) {
        return "Informe o ano escolar.";
    }

    if (!dados.materia) {
        return "Informe a matéria.";
    }

    if (!dados.conteudo) {
        return "Informe o conteúdo que será trabalhado.";
    }

    const idade = Number(dados.idade);

    if (!Number.isFinite(idade) || idade <= 0) {
        return "Informe uma idade válida.";
    }

    return null;

}


/* ============================================================
   PREPARAÇÃO
============================================================ */

function atualizarEtapaPreparacao(numero) {

    for (let i = 1; i <= 3; i++) {

        const elemento = $("etapa" + i);

        if (!elemento) {
            continue;
        }

        elemento.classList.remove("ativa");
        elemento.classList.remove("concluida");

        if (i < numero) {
            elemento.classList.add("concluida");
        }

        if (i === numero) {
            elemento.classList.add("ativa");
        }
    }

}


async function prepararAvaliacao() {

    const dados = obterDadosFormulario();

    const erro = validarDados(dados);

    if (erro) {

        $("erroConfiguracao").textContent = erro;
        $("erroConfiguracao").hidden = false;

        return;
    }

    $("erroConfiguracao").hidden = true;

    estado.aluno = dados;

    estado.questoes = [];
    estado.respostas = [];
    estado.indiceQuestao = 0;
    estado.indiceEstrategia = null;
    estado.relatorio = null;
    estado.atividadesAdaptadas = [];

    mostrarTela("preparacao");

    $("statusPreparacao").textContent =
        "A inteligência artificial está criando as atividades...";

    atualizarEtapaPreparacao(1);

    $("btnIniciarExercicios").hidden = true;

    try {

        /*
            O backend deve gerar:

            6 Divisão em etapas
            6 Apoio visual
            6 Instruções claras

            Total = 18
        */

        const resposta = await chamarAPI({

            action: "gerar_questoes",

            aluno: estado.aluno,

            estrategias: [
                "etapas",
                "visual",
                "claras"
            ],

            quantidade_por_estrategia: 6,

            quantidade_total: 18,

            contexto: [],

            instrucoes:
                "Gerar atividades escolares exclusivamente sobre a matéria e o conteúdo informados pelo estudante. A primeira questão também deve ser diretamente relacionada à matéria e ao conteúdo escolhidos."

        });


        atualizarEtapaPreparacao(2);

        await esperar(300);


        const questoesGeradas =
            normalizarQuestoes(
                resposta.questoes || resposta.data || []
            );


        if (questoesGeradas.length < 18) {

            throw new Error(
                "A inteligência artificial retornou menos de 18 atividades."
            );

        }


        estado.questoes = questoesGeradas.slice(0, 18);


        atualizarEtapaPreparacao(3);

        $("statusPreparacao").textContent =
            "Avaliação preparada com sucesso.";


        $("btnIniciarExercicios").hidden = false;

    } catch (erro) {

        console.error(erro);

        $("statusPreparacao").textContent =
            "Não foi possível preparar a avaliação.";

        const botao = $("btnIniciarExercicios");

        botao.hidden = false;
        botao.textContent = "Tentar novamente";

        botao.onclick = prepararAvaliacao;

        alert(
            "Erro ao preparar as atividades:\n\n" +
            erro.message
        );

    }

}


/* ============================================================
   NORMALIZAÇÃO DAS QUESTÕES
============================================================ */

function normalizarQuestoes(lista) {

    if (!Array.isArray(lista)) {
        return [];
    }

    return lista.map(function(q, indice) {

        let alternativas = [];

        if (Array.isArray(q.alternativas)) {

            alternativas = q.alternativas.slice(0, 4);

        } else {

            alternativas = [
                q.alternativa_a,
                q.alternativa_b,
                q.alternativa_c,
                q.alternativa_d
            ].filter(function(valor) {
                return valor !== undefined &&
                    valor !== null &&
                    String(valor).trim() !== "";
            });

        }


        let respostaCorreta =
            q.resposta_correta ||
            q.resposta ||
            q.correta;


        if (
            typeof respostaCorreta === "number" &&
            alternativas[respostaCorreta]
        ) {
            respostaCorreta =
                alternativas[respostaCorreta];
        }


        if (
            typeof respostaCorreta === "string" &&
            /^[ABCD]$/i.test(respostaCorreta.trim())
        ) {

            const indice = "ABCD".indexOf(
                respostaCorreta.trim().toUpperCase()
            );

            respostaCorreta =
                alternativas[indice];

        }


        return {

            id:
                q.id ||
                "questao-" + (indice + 1),

            estrategia:
                normalizarEstrategia(
                    q.estrategia ||
                    q.metodo ||
                    ""
                ),

            titulo:
                q.titulo ||
                "Atividade",

            objetivo:
                q.objetivo ||
                "",

            enunciado:
                q.enunciado ||
                q.pergunta ||
                "",

            alternativas: alternativas,

            respostaCorreta:
                respostaCorreta,

            explicacao:
                q.explicacao ||
                "",

            passos:
                Array.isArray(q.passos)
                    ? q.passos
                    : [],

            visual:
                Array.isArray(q.visual)
                    ? q.visual
                    : []

        };

    });

}


function normalizarEstrategia(valor) {

    const texto = String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (
        texto.includes("etapa")
    ) {
        return "etapas";
    }

    if (
        texto.includes("visual")
    ) {
        return "visual";
    }

    if (
        texto.includes("clara")
    ) {
        return "claras";
    }

    if (
        texto.includes("repet")
    ) {
        return "repeticao";
    }

    return "";

}


/* ============================================================
   INICIAR QUESTÕES
============================================================ */

function iniciarExercicios() {

    if (!estado.questoes.length) {

        alert(
            "Nenhuma atividade foi preparada."
        );

        return;
    }

    estado.indiceQuestao = 0;
    estado.respostas = [];

    mostrarTela("avaliacao");

    mostrarQuestao();

}


/* ============================================================
   MOSTRAR QUESTÃO
============================================================ */

function mostrarQuestao() {

    const questao =
        estado.questoes[estado.indiceQuestao];

    if (!questao) {

        finalizarAvaliacaoInicial();

        return;
    }


    estado.questaoRespondida = false;
    estado.inicioQuestao = Date.now();


    const numero =
        estado.indiceQuestao + 1;

    const total =
        estado.questoes.length;


    $("contador").textContent =
        "Questão " + numero + " de " + total;


    $("progressoTexto").textContent =
        Math.round((numero / total) * 100) + "%";


    $("progresso").style.width =
        ((numero / total) * 100) + "%";


    const nomeEstrategia =
        ESTRATEGIAS[questao.estrategia] ||
        "Atividade personalizada";


    $("estrategia").textContent =
        nomeEstrategia;


    $("tituloQuestao").textContent =
        questao.titulo || "Atividade";


    $("objetivoQuestao").textContent =
        questao.objetivo || "";


    $("enunciado").textContent =
        questao.enunciado || "";


    mostrarPassos(questao.passos);

    mostrarVisual(questao.visual);

    mostrarAlternativas(
        questao.alternativas
    );


    document
        .querySelectorAll(
            'input[name="dificuldade"]'
        )
        .forEach(function(input) {
            input.checked = false;
        });


    $("btnResponder").disabled = true;

    $("btnResponder").hidden = false;

    $("btnProximo").hidden = true;

    $("feedback").hidden = true;

    $("feedback").textContent = "";

}


function mostrarPassos(passos) {

    const bloco = $("passos");
    const lista = $("listaPassos");

    lista.innerHTML = "";

    if (
        !Array.isArray(passos) ||
        passos.length === 0
    ) {

        bloco.hidden = true;

        return;
    }

    passos.forEach(function(passo) {

        const li =
            document.createElement("li");

        li.textContent = passo;

        lista.appendChild(li);

    });

    bloco.hidden = false;

}


function mostrarVisual(visual) {

    const bloco = $("visual");
    const lista = $("listaVisual");

    lista.innerHTML = "";

    if (
        !Array.isArray(visual) ||
        visual.length === 0
    ) {

        bloco.hidden = true;

        return;
    }

    visual.forEach(function(item) {

        const div =
            document.createElement("div");

        div.textContent = item;

        lista.appendChild(div);

    });

    bloco.hidden = false;

}


function mostrarAlternativas(alternativas) {

    const container =
        $("alternativas");

    container.innerHTML = "";


    if (
        !Array.isArray(alternativas) ||
        alternativas.length === 0
    ) {

        container.innerHTML =
            "<p>Não foi possível carregar as alternativas.</p>";

        return;
    }


    alternativas.forEach(function(alternativa, indice) {

        const botao =
            document.createElement("button");

        botao.type = "button";

        botao.className =
            "alternativa";

        botao.textContent =
            alternativa;

        botao.dataset.indice =
            indice;

        botao.addEventListener(
            "click",
            function() {
                selecionarAlternativa(indice);
            }
        );

        container.appendChild(botao);

    });

}


/* ============================================================
   SELECIONAR ALTERNATIVA
============================================================ */

function selecionarAlternativa(indice) {

    if (estado.questaoRespondida) {
        return;
    }


    document
        .querySelectorAll(".alternativa")
        .forEach(function(botao) {

            botao.classList.remove(
                "selecionada"
            );

        });


    const botoes =
        document.querySelectorAll(
            ".alternativa"
        );


    if (botoes[indice]) {

        botoes[indice].classList.add(
            "selecionada"
        );

    }


    $("btnResponder").disabled = false;

}


/* ============================================================
   REGISTRAR RESPOSTA
============================================================ */

function obterDificuldade() {

    const selecionada =
        document.querySelector(
            'input[name="dificuldade"]:checked'
        );

    if (!selecionada) {
        return null;
    }

    return Number(
        selecionada.value
    );

}


function obterAlternativaSelecionada() {

    const botao =
        document.querySelector(
            ".alternativa.selecionada"
        );

    if (!botao) {
        return null;
    }

    return Number(
        botao.dataset.indice
    );

}


function registrarResposta() {

    if (estado.questaoRespondida) {
        return;
    }


    const indiceAlternativa =
        obterAlternativaSelecionada();


    if (indiceAlternativa === null) {

        alert(
            "Escolha uma alternativa antes de continuar."
        );

        return;
    }


    const dificuldade =
        obterDificuldade();


    if (dificuldade === null) {

        alert(
            "Informe como você percebeu esta atividade."
        );

        return;
    }


    const questao =
        estado.questoes[
            estado.indiceQuestao
        ];


    const alternativaEscolhida =
        questao.alternativas[
            indiceAlternativa
        ];


    const correta =
        String(alternativaEscolhida)
            .trim() ===
        String(questao.respostaCorreta)
            .trim();


    const tempo =
        (Date.now() -
            estado.inicioQuestao) /
        1000;


    estado.respostas[
        estado.indiceQuestao
    ] = {

        questaoId:
            questao.id,

        estrategia:
            questao.estrategia,

        alternativa:
            alternativaEscolhida,

        correta:
            correta,

        dificuldade:
            dificuldade,

        tempo:
            Number(
                tempo.toFixed(2)
            )

    };


    estado.questaoRespondida =
        true;


    const feedback =
        $("feedback");


    feedback.hidden = false;

    feedback.className =
        correta
            ? "feedback correta"
            : "feedback incorreta";


    if (correta) {

        feedback.textContent =
            "Resposta registrada. A alternativa escolhida está correta.";

    } else {

        feedback.textContent =
            "Resposta registrada.";

    }


    $("btnResponder").hidden = true;

    $("btnProximo").hidden = false;

}


/* ============================================================
   PRÓXIMA QUESTÃO
============================================================ */

function proximaQuestao() {

    if (!estado.questaoRespondida) {

        alert(
            "Registre a resposta antes de continuar."
        );

        return;
    }


    estado.indiceQuestao++;


    if (
        estado.indiceQuestao <
        estado.questoes.length
    ) {

        mostrarQuestao();

        return;
    }


    finalizarAvaliacaoInicial();

}


/* ============================================================
   FINALIZAR 18 QUESTÕES
============================================================ */

async function finalizarAvaliacaoInicial() {

    mostrarTela("adaptacao");

    $("statusAdaptacao").textContent =
        "Analisando as 18 atividades iniciais...";


    try {

        const analise =
            calcularDesempenhoInicial();


        $("statusAdaptacao").textContent =
            "Identificando a estratégia que apresentou maior desempenho...";


        await esperar(700);


        const resposta =
            await chamarAPI({

                action:
                    "gerar_adaptativas",

                aluno:
                    estado.aluno,

                estrategias:
                    analise,

                respostas:
                    estado.respostas,

                questoes:
                    estado.questoes,

                estrategiaSelecionada:
                    analise.melhorEstrategia,

                quantidade:
                    CONFIG.QUESTOES_ADAPTATIVAS,

                instrucoes:
                    "Gerar 6 atividades de Repetição adaptativa sobre a mesma matéria e conteúdo da avaliação. Adaptar o nível, formato e explicação de acordo com o desempenho observado nas 18 atividades iniciais. Não mudar a matéria nem o conteúdo."

            });


        const adaptativas =
            normalizarQuestoes(
                resposta.questoes ||
                resposta.data ||
                []
            );


        if (adaptativas.length < 6) {

            throw new Error(
                "A inteligência artificial não retornou as 6 atividades adaptativas."
            );

        }


        adaptativas.forEach(function(questao) {

            questao.estrategia =
                "repeticao";

        });


        estado.questoes =
            estado.questoes
                .slice(0, 18)
                .concat(
                    adaptativas.slice(0, 6)
                );


        $("statusAdaptacao").textContent =
            "Atividades adaptativas preparadas.";


        await esperar(700);


        estado.indiceQuestao = 18;


        mostrarTela("avaliacao");

        mostrarQuestao();


    } catch (erro) {

        console.error(erro);

        $("statusAdaptacao").textContent =
            "Não foi possível criar as atividades adaptativas.";

        alert(
            "Erro ao preparar a etapa adaptativa:\n\n" +
            erro.message
        );

        mostrarResultado();

    }

}


/* ============================================================
   DESEMPENHO
============================================================ */

function calcularDesempenhoInicial() {

    const dados = {

        etapas: {
            total: 0,
            acertos: 0,
            tempo: 0,
            dificuldade: 0
        },

        visual: {
            total: 0,
            acertos: 0,
            tempo: 0,
            dificuldade: 0
        },

        claras: {
            total: 0,
            acertos: 0,
            tempo: 0,
            dificuldade: 0
        }

    };


    estado.respostas
        .slice(0, 18)
        .forEach(function(resposta) {

            if (
                !resposta ||
                !dados[resposta.estrategia]
            ) {
                return;
            }


            const grupo =
                dados[resposta.estrategia];


            grupo.total++;

            if (resposta.correta) {
                grupo.acertos++;
            }

            grupo.tempo +=
                Number(resposta.tempo || 0);

            grupo.dificuldade +=
                Number(
                    resposta.dificuldade || 2
                );

        });


    const indices = {};


    Object.keys(dados)
        .forEach(function(estrategia) {

            const grupo =
                dados[estrategia];


            if (grupo.total === 0) {

                indices[estrategia] = 0;

                return;
            }


            const acerto =
                (grupo.acertos /
                    grupo.total) *
                100;


            const tempoMedio =
                grupo.tempo /
                grupo.total;


            const dificuldadeMedia =
                grupo.dificuldade /
                grupo.total;


            /*
                Quanto menor o tempo, melhor.
                O valor é limitado para evitar distorções.
            */

            const indicadorTempo =
                Math.max(
                    0,
                    Math.min(
                        100,
                        100 -
                        (tempoMedio * 2)
                    )
                );


            /*
                Dificuldade:
                1 = fácil
                2 = adequada
                3 = difícil

                Uma dificuldade próxima de 2
                representa melhor adequação.
            */

            const distancia =
                Math.abs(
                    dificuldadeMedia - 2
                );


            const indicadorDificuldade =
                Math.max(
                    0,
                    100 -
                    (distancia * 50)
                );


            const indice =
                (acerto * 0.50) +
                (indicadorTempo * 0.20) +
                (indicadorDificuldade * 0.15) +
                (acerto * 0.15);


            indices[estrategia] =
                Number(
                    indice.toFixed(2)
                );

        });


    let melhorEstrategia =
        "etapas";


    Object.keys(indices)
        .forEach(function(estrategia) {

            if (
                indices[estrategia] >
                indices[melhorEstrategia]
            ) {

                melhorEstrategia =
                    estrategia;

            }

        });


    return {

        dados: dados,

        indices: indices,

        melhorEstrategia:
            melhorEstrategia

    };

}


/* ============================================================
   RESULTADO
============================================================ */

function gerarRelatorioFinal() {

    const dados = {

        etapas: criarDadosResultado(),

        visual: criarDadosResultado(),

        claras: criarDadosResultado(),

        repeticao: criarDadosResultado()

    };


    estado.respostas
        .forEach(function(resposta) {

            if (
                !resposta ||
                !dados[resposta.estrategia]
            ) {
                return;
            }


            const grupo =
                dados[resposta.estrategia];


            grupo.total++;

            if (resposta.correta) {
                grupo.acertos++;
            }

            grupo.tempo +=
                Number(resposta.tempo || 0);

            grupo.dificuldade +=
                Number(resposta.dificuldade || 2);

        });


    const indices = {};


    Object.keys(dados)
        .forEach(function(estrategia) {

            const grupo =
                dados[estrategia];


            if (!grupo.total) {

                indices[estrategia] = 0;

                return;
            }


            const acerto =
                (grupo.acertos /
                    grupo.total) *
                100;


            const tempoMedio =
                grupo.tempo /
                grupo.total;


            const dificuldadeMedia =
                grupo.dificuldade /
                grupo.total;


            const indicadorTempo =
                Math.max(
                    0,
                    Math.min(
                        100,
                        100 -
                        tempoMedio * 2
                    )
                );


            const indicadorDificuldade =
                Math.max(
                    0,
                    100 -
                    Math.abs(
                        dificuldadeMedia - 2
                    ) * 50
                );


            indices[estrategia] =
                Number(
                    (
                        acerto * 0.50 +
                        indicadorTempo * 0.20 +
                        indicadorDificuldade * 0.15 +
                        acerto * 0.15
                    ).toFixed(2)
                );

        });


    let melhor =
        Object.keys(indices)
            .sort(function(a, b) {
                return indices[b] - indices[a];
            })[0];


    estado.relatorio = {

        dados: dados,

        indices: indices,

        melhorEstrategia: melhor

    };


    return estado.relatorio;

}


function criarDadosResultado() {

    return {

        total: 0,

        acertos: 0,

        tempo: 0,

        dificuldade: 0

    };

}


/* ============================================================
   MOSTRAR RESULTADO
============================================================ */

function mostrarResultado() {

    const relatorio =
        gerarRelatorioFinal();


    mostrarTela("resultado");


    const nomeMelhor =
        ESTRATEGIAS[
            relatorio.melhorEstrategia
        ] ||
        "estratégia personalizada";


    let html = "";


    html +=
        '<div class="relatorio-resumo">';

    html +=
        "<h3>Análise da avaliação</h3>";

    html +=
        "<p>" +
        "O maior índice de desempenho observado nesta avaliação " +
        "foi apresentado pela estratégia " +
        "<strong>" +
        escaparHTML(nomeMelhor) +
        "</strong>." +
        "</p>";

    html +=
        "</div>";


    html +=
        '<div class="cartoes-estrategias">';


    Object.keys(ESTRATEGIAS)
        .forEach(function(estrategia) {

            const dados =
                relatorio.dados[
                    estrategia
                ];


            const indice =
                relatorio.indices[
                    estrategia
                ] || 0;


            const percentual =
                dados.total > 0
                    ? Math.round(
                        (dados.acertos /
                            dados.total) *
                        100
                    )
                    : 0;


            html +=
                '<div class="cartao-estrategia">';


            html +=
                "<h3>" +
                escaparHTML(
                    ESTRATEGIAS[estrategia]
                ) +
                "</h3>";


            html +=
                '<div class="percentual">' +
                percentual +
                "%</div>";


            html +=
                '<div class="dados-estrategia">';

            html +=
                "<span>" +
                dados.acertos +
                "/" +
                dados.total +
                " acertos</span>";


            html +=
                "<span>Índice " +
                indice +
                "</span>";


            html +=
                "</div>";


            html +=
                "</div>";

        });


    html +=
        "</div>";


    $("relatorio").innerHTML =
        html;

}


/* ============================================================
   ATIVIDADES ADAPTADAS
============================================================ */

async function carregarAtividadesAdaptadas() {

    mostrarTela("atividades");


    $("listaAtividades").innerHTML =
        "<p>Preparando atividades adaptadas...</p>";


    try {

        /*
            Primeiro utilizamos as 6 questões
            adaptativas que já foram geradas.

            Se o backend fornecer uma lista
            específica de atividades adaptadas,
            ela também poderá ser utilizada.
        */

        const adaptativas =
            estado.questoes
                .filter(function(questao) {

                    return questao.estrategia ===
                        "repeticao";

                });


        if (adaptativas.length) {

            renderizarAtividades(
                adaptativas
            );

            return;
        }


        const resposta =
            await chamarAPI({

                action:
                    "gerar_atividades_adaptadas",

                aluno:
                    estado.aluno,

                estrategia:
                    estado.relatorio
                        ? estado.relatorio
                            .melhorEstrategia
                        : "repeticao",

                desempenho:
                    estado.relatorio,

                quantidade:
                    6

            });


        const atividades =
            normalizarQuestoes(
                resposta.questoes ||
                resposta.atividades ||
                []
            );


        renderizarAtividades(
            atividades
        );


    } catch (erro) {

        console.error(erro);

        $("listaAtividades").innerHTML =
            "<p>Não foi possível carregar as atividades adaptadas.</p>";

    }

}


function renderizarAtividades(lista) {

    if (
        !Array.isArray(lista) ||
        !lista.length
    ) {

        $("listaAtividades").innerHTML =
            "<p>Nenhuma atividade adaptada disponível.</p>";

        return;
    }


    let html = "";


    lista.forEach(function(atividade, indice) {

        html +=
            '<article class="atividade-adaptada">';


        html +=
            "<h3>" +
            "Atividade " +
            (indice + 1) +
            ": " +
            escaparHTML(
                atividade.titulo ||
                "Atividade adaptada"
            ) +
            "</h3>";


        html +=
            "<p>" +
            escaparHTML(
                atividade.enunciado
            ) +
            "</p>";


        if (
            atividade.alternativas &&
            atividade.alternativas.length
        ) {

            html +=
                "<ul>";

            atividade.alternativas
                .forEach(function(alternativa) {

                    html +=
                        "<li>" +
                        escaparHTML(
                            alternativa
                        ) +
                        "</li>";

                });

            html +=
                "</ul>";

        }


        html +=
            '<div class="resposta">' +
            "<strong>Explicação:</strong><br>" +
            escaparHTML(
                atividade.explicacao ||
                "Atividade adaptada de acordo com o desempenho observado."
            ) +
            "</div>";


        html +=
            "</article>";

    });


    $("listaAtividades").innerHTML =
        html;

}


/* ============================================================
   NOVA AVALIAÇÃO
============================================================ */

function novaAvaliacao() {

    estado.aluno = {

        nome: "",
        idade: "",
        ano: "",
        materia: "",
        conteudo: "",
        observacoes: ""

    };


    estado.questoes = [];

    estado.respostas = [];

    estado.indiceQuestao = 0;

    estado.inicioQuestao = 0;

    estado.questaoRespondida = false;

    estado.relatorio = null;

    estado.atividadesAdaptadas = [];


    $("formAvaliacao").reset();

    $("erroConfiguracao").hidden = true;


    mostrarTela("inicio");

}


/* ============================================================
   EVENTOS
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        /*
            Botão inicial
        */

        $("btnComecar")
            .addEventListener(
                "click",
                function() {

                    mostrarTela(
                        "configuracao"
                    );

                }
            );


        /*
            Formulário
        */

        $("formAvaliacao")
            .addEventListener(
                "submit",
                function(evento) {

                    evento.preventDefault();

                    prepararAvaliacao();

                }
            );


        /*
            Iniciar exercícios
        */

        $("btnIniciarExercicios")
            .addEventListener(
                "click",
                iniciarExercicios
            );


        /*
            Registrar resposta
        */

        $("btnResponder")
            .addEventListener(
                "click",
                registrarResposta
            );


        /*
            Próxima questão
        */

        $("btnProximo")
            .addEventListener(
                "click",
                proximaQuestao
            );


        /*
            Resultado
        */

        $("btnAtividades")
            .addEventListener(
                "click",
                carregarAtividadesAdaptadas
            );


        /*
            Reiniciar
        */

        $("btnReiniciar")
            .addEventListener(
                "click",
                novaAvaliacao
            );


        $("btnNovaAvaliacao")
            .addEventListener(
                "click",
                novaAvaliacao
            );

    }
);
