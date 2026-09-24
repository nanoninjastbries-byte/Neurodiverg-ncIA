// ============================================================
// NEURODIVERGÊNCIA
// FRONTEND — AVALIAÇÃO ADAPTATIVA
// ============================================================

// ============================================================
// CONFIGURAÇÃO DA API
// ============================================================

// ATENÇÃO:
// Não coloque a Gemini API Key aqui.
//
// Este endereço deve apontar para o seu backend,
// Google Apps Script ou outra API segura.
//
// Substitua pelo endereço do seu backend.
const API_URL =
    "COLE_AQUI_A_URL_DA_SUA_API";


// ============================================================
// ESTADO
// ============================================================

const estado = {

    nome: "",
    idade: "",
    ano: "",
    materia: "",
    conteudo: "",
    observacoes: "",

    questoes: [],

    respostas: [],

    questaoAtual: 0,

    alternativaSelecionada: null,

    dificuldadeSelecionada: null,

    inicioQuestao: null,

    adaptativasGeradas: false,

    relatorio: null

};


// ============================================================
// ESTRATÉGIAS
// ============================================================

const ESTRATEGIAS = {

    etapas: {
        nome: "Divisão em etapas"
    },

    visual: {
        nome: "Apoio visual"
    },

    claras: {
        nome: "Instruções claras"
    },

    repeticao: {
        nome: "Repetição adaptativa"
    }

};


// ============================================================
// TROCAR TELA
// ============================================================

function mostrarTela(id) {

    document
        .querySelectorAll(".tela")
        .forEach(tela => {

            tela.classList.remove("ativa");

        });

    const tela =
        document.getElementById(id);

    if (!tela) {
        console.error(
            "Tela não encontrada:",
            id
        );
        return;
    }

    tela.classList.add("ativa");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// INICIAR AVALIAÇÃO
// ============================================================

async function iniciarAvaliacao() {

    const nome =
        document
            .getElementById("nome")
            .value
            .trim();

    const idade =
        document
            .getElementById("idade")
            .value
            .trim();

    const ano =
        document
            .getElementById("ano")
            .value
            .trim();

    const materia =
        document
            .getElementById("materia")
            .value
            .trim();

    const conteudo =
        document
            .getElementById("conteudo")
            .value
            .trim();

    const observacoes =
        document
            .getElementById("observacoes")
            .value
            .trim();


    const erro =
        document.getElementById(
            "erroConfiguracao"
        );


    erro.hidden = true;
    erro.textContent = "";


    // --------------------------------------------------------
    // VALIDAÇÃO
    // --------------------------------------------------------

    if (!materia) {

        erro.textContent =
            "Informe a matéria.";

        erro.hidden = false;

        return;
    }


    if (!conteudo) {

        erro.textContent =
            "Informe o conteúdo.";

        erro.hidden = false;

        return;
    }


    // --------------------------------------------------------
    // SALVAR DADOS
    // --------------------------------------------------------

    estado.nome = nome;
    estado.idade = idade;
    estado.ano = ano;
    estado.materia = materia;
    estado.conteudo = conteudo;
    estado.observacoes = observacoes;

    estado.questoes = [];
    estado.respostas = [];
    estado.questaoAtual = 0;
    estado.alternativaSelecionada = null;
    estado.dificuldadeSelecionada = null;
    estado.adaptativasGeradas = false;
    estado.relatorio = null;


    // --------------------------------------------------------
    // PREPARAÇÃO
    // --------------------------------------------------------

    mostrarTela("preparacao");


    document.getElementById(
        "statusPreparacao"
    ).textContent =
        `Criando atividades de ${materia} sobre ${conteudo}.`;


    try {

        const questoes =
            await gerarQuestoesIniciais();


        if (!Array.isArray(questoes)) {

            throw new Error(
                "A IA não retornou uma lista de questões válida."
            );

        }


        if (questoes.length !== 18) {

            throw new Error(
                `A IA retornou ${questoes.length} questões. Eram esperadas 18.`
            );

        }


        estado.questoes =
            questoes;


        document.getElementById(
            "materiaAtual"
        ).textContent =
            `${materia} — ${conteudo}`;


        mostrarTela("avaliacao");


        mostrarQuestao();


    } catch (erroApi) {

        console.error(
            erroApi
        );


        mostrarTela("configuracao");


        erro.textContent =
            "Não foi possível preparar a avaliação: "
            + erroApi.message;

        erro.hidden = false;

    }
}


// ============================================================
// GERAR 18 QUESTÕES
// ============================================================

async function gerarQuestoesIniciais() {

    atualizarPreparacao(
        "01 — Criando atividades sobre o conteúdo"
    );


    const resposta =
        await chamarAPI({

            acao:
                "gerar_iniciais",

            estudante: {

                nome:
                    estado.nome,

                idade:
                    estado.idade,

                ano:
                    estado.ano,

                materia:
                    estado.materia,

                conteudo:
                    estado.conteudo,

                observacoes:
                    estado.observacoes

            },

            quantidade:
                18,

            estrategias: [

                "etapas",
                "visual",
                "claras"

            ]

        });


    atualizarPreparacao(
        "02 — Organizando as estratégias"
    );


    const questoes =
        normalizarQuestoes(
            resposta
        );


    atualizarPreparacao(
        "03 — Avaliação pronta"
    );


    return questoes;
}


// ============================================================
// PREPARAÇÃO
// ============================================================

function atualizarPreparacao(
    texto
) {

    document.getElementById(
        "statusPreparacao"
    ).textContent =
        texto;
}


// ============================================================
// CHAMAR API
// ============================================================

async function chamarAPI(
    dados
) {

    if (
        !API_URL ||
        API_URL.includes(
            "COLE_AQUI"
        )
    ) {

        throw new Error(
            "A URL da API ainda não foi configurada no script.js."
        );

    }


    const resposta =
        await fetch(
            API_URL,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        dados
                    )

            }
        );


    if (!resposta.ok) {

        const texto =
            await resposta.text();

        throw new Error(
            `Erro da API (${resposta.status}): ${texto}`
        );

    }


    const dadosResposta =
        await resposta.json();


    if (
        dadosResposta.erro
    ) {

        throw new Error(
            dadosResposta.erro
        );

    }


    return dadosResposta;
}


// ============================================================
// NORMALIZAR QUESTÕES
// ============================================================

function normalizarQuestoes(
    resposta
) {

    const lista =
        Array.isArray(resposta)
            ? resposta
            : resposta.questoes;


    if (!Array.isArray(lista)) {

        throw new Error(
            "Formato de questões inválido."
        );

    }


    return lista.map(
        (questao, indice) => {

            const alternativas = [

                questao.alternativa_a ??
                    questao.alternativas?.[0],

                questao.alternativa_b ??
                    questao.alternativas?.[1],

                questao.alternativa_c ??
                    questao.alternativas?.[2],

                questao.alternativa_d ??
                    questao.alternativas?.[3]

            ];


            let resposta =
                questao.resposta ??
                questao.resposta_correta;


            if (
                typeof resposta ===
                "number"
            ) {

                resposta =
                    ["A", "B", "C", "D"][
                        resposta
                    ];

            }


            return {

                id:
                    questao.id ??
                    indice + 1,

                estrategia:
                    questao.estrategia ??
                    "etapas",

                titulo:
                    questao.titulo ??
                    `Questão ${indice + 1}`,

                objetivo:
                    questao.objetivo ??
                    "",

                enunciado:
                    questao.enunciado ??
                    questao.pergunta ??
                    "",

                alternativas,

                resposta,

                explicacao:
                    questao.explicacao ??
                    "",

                passos:
                    Array.isArray(
                        questao.passos
                    )
                        ? questao.passos
                        : [],

                visual:
                    Array.isArray(
                        questao.visual
                    )
                        ? questao.visual
                        : []

            };

        }
    );
}


// ============================================================
// MOSTRAR QUESTÃO
// ============================================================

function mostrarQuestao() {

    const questao =
        estado.questoes[
            estado.questaoAtual
        ];


    if (!questao) {

        finalizarAvaliacao();

        return;

    }


    estado.alternativaSelecionada =
        null;

    estado.dificuldadeSelecionada =
        null;

    estado.inicioQuestao =
        Date.now();


    const numero =
        estado.questaoAtual + 1;


    const total =
        estado.questoes.length;


    document.getElementById(
        "contador"
    ).textContent =
        `Questão ${numero} de ${total}`;


    document.getElementById(
        "estrategia"
    ).textContent =
        ESTRATEGIAS[
            questao.estrategia
        ]?.nome ??
        questao.estrategia;


    document.getElementById(
        "materiaAtual"
    ).textContent =
        `${estado.materia} — ${estado.conteudo}`;


    document.getElementById(
        "progresso"
    ).style.width =
        `${(numero / total) * 100}%`;


    document.getElementById(
        "tituloQuestao"
    ).textContent =
        questao.titulo;


    document.getElementById(
        "objetivoQuestao"
    ).textContent =
        questao.objetivo;


    document.getElementById(
        "enunciado"
    ).textContent =
        questao.enunciado;


    renderizarPassos(
        questao
    );


    renderizarVisual(
        questao
    );


    renderizarAlternativas(
        questao
    );


    document.getElementById(
        "feedback"
    ).hidden = true;


    document.getElementById(
        "responderBtn"
    ).hidden = false;


    document.getElementById(
        "proximaBtn"
    ).hidden = true;


    document
        .querySelectorAll(".dificuldade")
        .forEach(botao => {

            botao.classList.remove(
                "selecionada"
            );

        });

}


// ============================================================
// PASSOS
// ============================================================

function renderizarPassos(
    questao
) {

    const elemento =
        document.getElementById(
            "passos"
        );


    if (
        !questao.passos ||
        questao.passos.length === 0
    ) {

        elemento.hidden = true;
        elemento.innerHTML = "";

        return;

    }


    elemento.hidden = false;


    let html =
        "<h3>Organize seu raciocínio</h3>";


    questao.passos.forEach(
        (passo, indice) => {

            html += `

                <div class="step">

                    <strong>
                        ${indice + 1}
                    </strong>

                    <span>
                        ${escaparHTML(
                            passo
                        )}
                    </span>

                </div>

            `;

        }
    );


    elemento.innerHTML =
        html;
}


// ============================================================
// VISUAL
// ============================================================

function renderizarVisual(
    questao
) {

    const elemento =
        document.getElementById(
            "apoioVisual"
        );


    if (
        !questao.visual ||
        questao.visual.length === 0
    ) {

        elemento.hidden = true;
        elemento.innerHTML = "";

        return;

    }


    elemento.hidden = false;


    let html =
        "<h3>Apoio visual</h3>";

    html +=
        '<div class="visual-grid">';


    questao.visual.forEach(
        item => {

            html += `

                <div class="visual-item">
                    ${escaparHTML(item)}
                </div>

            `;

        }
    );


    html +=
        "</div>";


    elemento.innerHTML =
        html;
}


// ============================================================
// ALTERNATIVAS
// ============================================================

function renderizarAlternativas(
    questao
) {

    const container =
        document.getElementById(
            "alternativas"
        );


    container.innerHTML = "";


    const letras =
        ["A", "B", "C", "D"];


    questao.alternativas.forEach(
        (alternativa, indice) => {

            const botao =
                document.createElement(
                    "button"
                );


            botao.type =
                "button";

            botao.className =
                "alternativa";


            botao.innerHTML = `

                <span class="letra-alternativa">
                    ${letras[indice]}
                </span>

                ${escaparHTML(
                    alternativa
                )}

            `;


            botao.addEventListener(
                "click",
                () => {

                    selecionarAlternativa(
                        indice,
                        botao
                    );

                }
            );


            container.appendChild(
                botao
            );

        }
    );
}


// ============================================================
// SELECIONAR ALTERNATIVA
// ============================================================

function selecionarAlternativa(
    indice,
    botao
) {

    estado.alternativaSelecionada =
        ["A", "B", "C", "D"][
            indice
        ];


    document
        .querySelectorAll(
            ".alternativa"
        )
        .forEach(
            elemento => {

                elemento.classList.remove(
                    "selecionada"
                );

            }
        );


    botao.classList.add(
        "selecionada"
    );
}


// ============================================================
// DIFICULDADE
// ============================================================

document
    .querySelectorAll(".dificuldade")
    .forEach(
        botao => {

            botao.addEventListener(
                "click",
                () => {

                    estado.dificuldadeSelecionada =
                        botao.dataset.valor;


                    document
                        .querySelectorAll(
                            ".dificuldade"
                        )
                        .forEach(
                            outro => {

                                outro.classList.remove(
                                    "selecionada"
                                );

                            }
                        );


                    botao.classList.add(
                        "selecionada"
                    );

                }
            );

        }
    );


// ============================================================
// RESPONDER
// ============================================================

function responderQuestao() {

    if (
        !estado.alternativaSelecionada
    ) {

        mostrarFeedback(
            "Escolha uma alternativa antes de continuar.",
            true
        );

        return;

    }


    if (
        !estado.dificuldadeSelecionada
    ) {

        mostrarFeedback(
            "Informe como você percebeu a atividade.",
            true
        );

        return;

    }


    const questao =
        estado.questoes[
            estado.questaoAtual
        ];


    const tempo =
        (
            Date.now()
            -
            estado.inicioQuestao
        ) / 1000;


    const acertou =
        estado.alternativaSelecionada
        ===
        questao.resposta;


    estado.respostas.push({

        numero:
            estado.questaoAtual + 1,

        estrategia:
            questao.estrategia,

        acertou,

        tempo:

            Math.round(
                tempo * 100
            ) / 100,

        dificuldade:
            estado.dificuldadeSelecionada,

        resposta:
            estado.alternativaSelecionada,

        correta:
            questao.resposta

    });


    if (acertou) {

        mostrarFeedback(
            "Resposta registrada. Você acertou!",
            false
        );

    } else {

        mostrarFeedback(
            `Resposta registrada. A alternativa correta era ${questao.resposta}.`,
            false
        );

    }


    document.getElementById(
        "responderBtn"
    ).hidden = true;


    document.getElementById(
        "proximaBtn"
    ).hidden = false;
}


// ============================================================
// FEEDBACK
// ============================================================

function mostrarFeedback(
    texto,
    erro
) {

    const elemento =
        document.getElementById(
            "feedback"
        );


    elemento.innerHTML =
        escaparHTML(texto);


    elemento.hidden =
        false;

}


// ============================================================
// PRÓXIMA QUESTÃO
// ============================================================

async function proximaQuestao() {

    estado.questaoAtual++;


    // --------------------------------------------------------
    // TERMINOU AS 18 INICIAIS
    // --------------------------------------------------------

    if (
        estado.questaoAtual === 18 &&
        !estado.adaptativasGeradas
    ) {

        await prepararAdaptacao();

        return;

    }


    // --------------------------------------------------------
    // TERMINOU TUDO
    // --------------------------------------------------------

    if (
        estado.questaoAtual >=
        estado.questoes.length
    ) {

        finalizarAvaliacao();

        return;

    }


    mostrarQuestao();
}


// ============================================================
// PREPARAR ADAPTAÇÃO
// ============================================================

async function prepararAdaptacao() {

    mostrarTela(
        "adaptacao"
    );


    document.getElementById(
        "statusAdaptacao"
    ).textContent =
        "Analisando acertos, tempo e dificuldade...";


    try {

        const resposta =
            await chamarAPI({

                acao:
                    "gerar_adaptativas",

                estudante: {

                    nome:
                        estado.nome,

                    idade:
                        estado.idade,

                    ano:
                        estado.ano,

                    materia:
                        estado.materia,

                    conteudo:
                        estado.conteudo,

                    observacoes:
                        estado.observacoes

                },

                resultados:
                    estado.respostas,

                quantidade:
                    6

            });


        const adaptativas =
            normalizarQuestoes(
                resposta
            );


        if (
            adaptativas.length !== 6
        ) {

            throw new Error(
                "A IA não retornou 6 atividades adaptativas."
            );

        }


        estado.questoes =
            estado.questoes
                .slice(0, 18)
                .concat(
                    adaptativas
                );


        estado.adaptativasGeradas =
            true;


        estado.questaoAtual =
            18;


        mostrarTela(
            "avaliacao"
        );


        mostrarQuestao();


    } catch (erro) {

        console.error(
            erro
        );


        mostrarTela(
            "avaliacao"
        );


        mostrarFeedback(
            "Não foi possível gerar as atividades adaptativas: "
            + erro.message,
            true
        );

    }
}


// ============================================================
// FINALIZAR
// ============================================================

function finalizarAvaliacao() {

    estado.relatorio =
        calcularRelatorio();


    mostrarResultado();


    mostrarTela(
        "resultado"
    );
}


// ============================================================
// CALCULAR RELATÓRIO
// ============================================================

function calcularRelatorio() {

    const estrategias = [
        "etapas",
        "visual",
        "claras",
        "repeticao"
    ];


    const resultados = {};


    estrategias.forEach(
        estrategia => {

            resultados[
                estrategia
            ] = {

                total: 0,

                acertos: 0,

                tempoTotal: 0,

                dificuldades: []

            };

        }
    );


    estado.respostas.forEach(
        resposta => {

            const r =
                resultados[
                    resposta.estrategia
                ];


            if (!r) return;


            r.total++;

            if (
                resposta.acertou
            ) {

                r.acertos++;

            }


            r.tempoTotal +=
                resposta.tempo;


            r.dificuldades.push(
                resposta.dificuldade
            );

        }
    );


    const lista =
        estrategias.map(
            estrategia => {

                const r =
                    resultados[
                        estrategia
                    ];


                const taxa =
                    r.total > 0
                        ? (
                            r.acertos /
                            r.total
                        ) * 100
                        : 0;


                const tempoMedio =
                    r.total > 0
                        ? r.tempoTotal /
                          r.total
                        : 0;


                const dificuldade =
                    calcularDificuldade(
                        r.dificuldades
                    );


                const indice =
                    calcularIndice(
                        taxa,
                        tempoMedio,
                        dificuldade
                    );


                return {

                    estrategia,

                    nome:
                        ESTRATEGIAS[
                            estrategia
                        ].nome,

                    total:
                        r.total,

                    acertos:
                        r.acertos,

                    taxa,

                    tempoMedio,

                    dificuldade,

                    indice

                };

            }
        );


    const ordenado =
        [...lista].sort(
            (
                a,
                b
            ) =>
                b.indice -
                a.indice
        );


    return {

        estrategias:
            lista,

        melhor:
            ordenado[0],

        acertos:
            estado.respostas.filter(
                r =>
                    r.acertou
            ).length,

        total:
            estado.respostas.length

    };
}


// ============================================================
// DIFICULDADE
// ============================================================

function calcularDificuldade(
    lista
) {

    if (!lista.length) {
        return 0;
    }


    const valores = {

        "Fácil": 1,

        "Adequada": 0.8,

        "Difícil": 0.5

    };


    return lista.reduce(
        (
            soma,
            valor
        ) =>
            soma +
            (
                valores[
                    valor
                ] ?? 0.8
            ),
        0
    ) / lista.length;
}


// ============================================================
// ÍNDICE
// ============================================================

function calcularIndice(
    taxa,
    tempo,
    dificuldade
) {

    const taxaNormalizada =
        taxa / 100;


    const tempoNormalizado =
        Math.max(
            0,
            1 -
            (
                tempo /
                60
            )
        );


    return (

        taxaNormalizada *
        0.50

        +

        tempoNormalizado *
        0.20

        +

        dificuldade *
        0.15

        +

        0.15

    ) * 100;
}


// ============================================================
// MOSTRAR RESULTADO
// ============================================================

function mostrarResultado() {

    const relatorio =
        estado.relatorio;


    if (!relatorio) {
        return;
    }


    const melhor =
        relatorio.melhor;


    document.getElementById(
        "resultadoPrincipal"
    ).innerHTML = `

        <h3>
            Estratégia com maior desempenho
        </h3>

        <h2>
            ${escaparHTML(
                melhor.nome
            )}
        </h2>

        <p>
            Índice de desempenho:
            <strong>
                ${melhor.indice.toFixed(1)}/100
            </strong>
        </p>

    `;


    const container =
        document.getElementById(
            "resultadosEstrategias"
        );


    container.innerHTML = "";


    relatorio.estrategias.forEach(
        item => {

            container.innerHTML += `

                <div class="resultado-item">

                    <div class="nome">
                        ${escaparHTML(
                            item.nome
                        )}
                    </div>

                    <div class="valor">
                        ${item.taxa.toFixed(1)}%
                    </div>

                    <div class="detalhes">

                        ${item.acertos}/${item.total}
                        acertos

                        ·

                        ${item.tempoMedio.toFixed(1)}s
                        de tempo médio

                    </div>

                    <div class="detalhes">

                        Índice:
                        ${item.indice.toFixed(1)}/100

                    </div>

                </div>

            `;

        }
    );


    const taxaGeral =
        relatorio.total > 0
            ? (
                relatorio.acertos /
                relatorio.total
            ) * 100
            : 0;


    document.getElementById(
        "resumoGeral"
    ).innerHTML = `

        <strong>
            Resultado geral
        </strong>

        <p>
            O estudante acertou
            <strong>
                ${relatorio.acertos}
            </strong>
            de
            <strong>
                ${relatorio.total}
            </strong>
            atividades.
        </p>

        <p>
            Taxa geral de acerto:
            <strong>
                ${taxaGeral.toFixed(1)}%
            </strong>
        </p>

        <p>
            As 6 atividades adaptativas foram
            criadas a partir do desempenho observado
            nas 18 atividades iniciais.
        </p>

    `;
}


// ============================================================
// MOSTRAR ATIVIDADES ADAPTADAS
// ============================================================

function mostrarAtividades() {

    const container =
        document.getElementById(
            "listaAtividades"
        );


    const adaptativas =
        estado.questoes.slice(
            18
        );


    container.innerHTML = "";


    adaptativas.forEach(
        (
            questao,
            indice
        ) => {

            let alternativas = "";


            questao.alternativas
                .forEach(
                    (
                        alternativa,
                        i
                    ) => {

                        alternativas += `

                            <div class="alternative">

                                <strong>
                                    ${
                                        [
                                            "A",
                                            "B",
                                            "C",
                                            "D"
                                        ][i]
                                    }
                                </strong>

                                ${escaparHTML(
                                    alternativa
                                )}

                            </div>

                        `;

                    }
                );


            container.innerHTML += `

                <div class="atividade-adaptada">

                    <div class="estrategia">
                        Repetição adaptativa
                    </div>

                    <h3>
                        ${escaparHTML(
                            questao.titulo
                        )}
                    </h3>

                    <div class="objetivo">

                        <strong>
                            Objetivo:
                        </strong>

                        ${escaparHTML(
                            questao.objetivo
                        )}

                    </div>

                    <div class="enunciado">

                        ${escaparHTML(
                            questao.enunciado
                        )}

                    </div>

                    <div class="alternativas">

                        ${alternativas}

                    </div>

                </div>

            `;

        }
    );


    mostrarTela(
        "atividades"
    );
}


// ============================================================
// REINICIAR
// ============================================================

function reiniciarSistema() {

    estado.nome = "";
    estado.idade = "";
    estado.ano = "";
    estado.materia = "";
    estado.conteudo = "";
    estado.observacoes = "";

    estado.questoes = [];
    estado.respostas = [];

    estado.questaoAtual = 0;

    estado.alternativaSelecionada =
        null;

    estado.dificuldadeSelecionada =
        null;

    estado.inicioQuestao =
        null;

    estado.adaptativasGeradas =
        false;

    estado.relatorio =
        null;


    document.getElementById(
        "nome"
    ).value = "";

    document.getElementById(
        "idade"
    ).value = "";

    document.getElementById(
        "ano"
    ).value = "";

    document.getElementById(
        "materia"
    ).value = "";

    document.getElementById(
        "conteudo"
    ).value = "";

    document.getElementById(
        "observacoes"
    ).value = "";


    mostrarTela(
        "inicio"
    );
}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(
    valor
) {

    return String(
        valor ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
