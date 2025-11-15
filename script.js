// VARIÁVEIS GLOBAIS
const modal = document.getElementById('modal-principal');
const abrirCadastroBtn = document.getElementById('abrir-cadastro');
const fecharModalBtn = document.getElementById('fechar-modal');
const passoTipo = document.getElementById('passo-tipo');
const passoDados = document.getElementById('passo-dados');
const tituloDados = document.getElementById('titulo-dados');
const btnCadastrar = document.getElementById('btn-cadastrar');

const valorInput = document.getElementById('valor-input');
const descricaoInput = document.getElementById('descricao-input');
const dataInput = document.getElementById('data-input');

const listaTransacoesBody = document.getElementById('lista-transacoes');
const progressAreaEl = document.querySelector('.progress-area'); // Elemento para a Meta
let tipoLancamentoAtual = '';

// Carrega a meta salva ou define 5000 como padrão
let META_FINANCEIRA = parseFloat(localStorage.getItem('metaFinanceira')) || 5000;

// Variáveis para Totais
const totalLancadoEl = document.getElementById('total-lancado');
const totalDividasEl = document.getElementById('total-dividas');

// ------------------------------------------
// FUNÇÕES DE UTILIDADE (LOCAL STORAGE)
// ------------------------------------------

const carregarTransacoes = () => {
    const transacoes = localStorage.getItem('transacoes');
    return transacoes ? JSON.parse(transacoes) : [];
};

const salvarTransacoes = (transacoes) => {
    localStorage.setItem('transacoes', JSON.stringify(transacoes));
};

const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// ------------------------------------------
// LÓGICA DA META DINÂMICA
// ------------------------------------------

const atualizarBarraProgresso = (totalLancado, meta) => {
    const progressoBar = document.getElementById('progresso-bar');
    if (progressoBar) {
        // Garante que o progresso não passe de 100%
        const progressoPercentual = Math.min(100, (totalLancado / meta) * 100);
        progressoBar.style.width = `${progressoPercentual}%`;
    }
}

const renderizarMeta = () => {
    const transacoes = carregarTransacoes();
    let totalLancado = 0;
    transacoes.forEach(t => {
        if (t.tipo === 'CAIXA') {
            totalLancado += parseFloat(t.valor);
        }
    });
    
    // Verifica se a meta foi alcançada
    const metaConcluida = totalLancado >= META_FINANCEIRA;

    // Atualiza o rótulo com o valor e status da meta
    progressAreaEl.querySelector('.rotulo').innerHTML = `
        Meta Atual: <span id="meta-valor">${formatarMoeda(META_FINANCEIRA)}</span>
        <span class="${metaConcluida ? 'meta-concluida' : 'meta-pendente'}">
            (${metaConcluida ? 'CONCLUÍDA' : 'Pendente'})
        </span>
    `;

    // Atualiza a área de conteúdo (barra ou botão de edição)
    if (metaConcluida) {
        // Se concluída, mostra o botão para definir a próxima meta
        progressAreaEl.querySelector('.progress-area-content').innerHTML = `
            <button id="btn-editar-meta" class="btn-editar">Definir Nova Meta</button>
            <div class="barra-progresso-fundo">
                <div id="progresso-bar" class="progresso" style="width: 100%;"></div>
            </div>
        `;
        document.getElementById('btn-editar-meta').addEventListener('click', iniciarEdicaoMeta);
    } else {
        // Se pendente, mostra a barra de progresso e a mensagem de bloqueio
        progressAreaEl.querySelector('.progress-area-content').innerHTML = `
            <p class="aviso-meta">Conclua a meta atual para definir uma nova.</p>
            <div class="barra-progresso-fundo">
                <div id="progresso-bar" class="progresso"></div>
            </div>
        `;
    }
    
    // Atualiza a barra de progresso após o HTML ser renderizado
    atualizarBarraProgresso(totalLancado, META_FINANCEIRA);
};

const iniciarEdicaoMeta = () => {
    const oldMeta = META_FINANCEIRA;
    
    // Substitui o botão por um campo de input e um botão OK
    progressAreaEl.querySelector('.progress-area-content').innerHTML = `
        <input type="number" id="input-nova-meta" value="${oldMeta.toFixed(2)}" class="input-meta">
        <button id="btn-salvar-meta" class="btn-ok-meta">OK</button>
    `;
    
    // Foca e seleciona o valor para facilitar a edição
    const inputNovaMeta = document.getElementById('input-nova-meta');
    inputNovaMeta.select();

    // Anexa o evento de salvar
    document.getElementById('btn-salvar-meta').addEventListener('click', salvarNovaMeta);
};

const salvarNovaMeta = () => {
    const inputNovaMeta = document.getElementById('input-nova-meta');
    const novaMeta = parseFloat(inputNovaMeta.value);
    
    if (isNaN(novaMeta) || novaMeta <= 0) {
        alert("Por favor, insira um valor de meta válido.");
        return;
    }
    
    // 1. Atualiza a meta global e no storage
    META_FINANCEIRA = novaMeta;
    localStorage.setItem('metaFinanceira', novaMeta);
    
    // 2. Re-renderiza o dashboard com a nova meta
    renderizarMeta();
};


// ------------------------------------------
// FUNÇÕES DE ATUALIZAÇÃO DO DASHBOARD
// ------------------------------------------

const atualizarTotais = (transacoes) => {
    let totalLancado = 0;
    let totalDividas = 0;

    // 1. Calcular Totais
    transacoes.forEach(t => {
        const valor = parseFloat(t.valor);
        if (t.tipo === 'CAIXA') {
            totalLancado += valor;
        } else if (t.tipo === 'DIVIDA') {
            totalDividas += valor;
        }
    });

    // 2. Atualizar HTML
    totalLancadoEl.textContent = formatarMoeda(totalLancado);
    totalDividasEl.textContent = formatarMoeda(totalDividas);
    
    // 3. Renderiza a Meta e a barra de progresso
    renderizarMeta();
};


// ------------------------------------------
// FUNÇÕES DE RENDERIZAÇÃO E REGISTRO
// ------------------------------------------

const renderizarTransacoes = (transacoes) => {
    listaTransacoesBody.innerHTML = ''; // Limpa a tabela

    transacoes.forEach((t, index) => {
        const row = listaTransacoesBody.insertRow();
        const tipoClass = t.tipo.toLowerCase(); 

        row.innerHTML = `
            <td>${t.descricao}</td>
            <td class="${tipoClass}">${formatarMoeda(parseFloat(t.valor))}</td>
            <td>${t.data}</td>
            <td class="${tipoClass}">${t.tipo}</td>
            <td><button class="btn-deletar" data-index="${index}">Deletar</button></td>
        `;
    });
    
    // Anexa o evento de deletar
    atualizarTotais(transacoes); // Chamada aqui para garantir que os totais e a meta são atualizados
};

// Usa delegação de eventos para o botão deletar
listaTransacoesBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-deletar')) {
        const index = e.target.getAttribute('data-index');
        deletarTransacao(parseInt(index));
    }
});

const deletarTransacao = (index) => {
    let transacoes = carregarTransacoes();
    transacoes.splice(index, 1); // Remove 1 elemento no índice
    salvarTransacoes(transacoes);
    renderizarTransacoes(transacoes);
};

const adicionarTransacao = () => {
    const valor = parseFloat(valorInput.value);
    const descricao = descricaoInput.value.trim();
    const data = dataInput.value;

    if (isNaN(valor) || valor <= 0 || descricao === "" || data === "") {
        alert("Por favor, preencha todos os campos com valores válidos.");
        return;
    }

    const novaTransacao = {
        tipo: tipoLancamentoAtual,
        valor: valor.toFixed(2), 
        descricao: descricao,
        data: data
    };

    let transacoes = carregarTransacoes();
    transacoes.push(novaTransacao);
    salvarTransacoes(transacoes);
    renderizarTransacoes(transacoes);

    fecharModal();
};

// ------------------------------------------
// FUNÇÕES DO MODAL (POP-UP)
// ------------------------------------------

const abrirModal = () => {
    // Resetar o modal
    passoTipo.style.display = 'block';
    passoDados.style.display = 'none';
    valorInput.value = '';
    descricaoInput.value = '';
    // Define a data de hoje como padrão no input de data
    dataInput.value = new Date().toISOString().slice(0, 10); 

    modal.style.display = 'block';
};

const fecharModal = () => {
    modal.style.display = 'none';
};

const irParaDados = (tipo) => {
    tipoLancamentoAtual = tipo;
    tituloDados.textContent = `Cadastrar ${tipo === 'CAIXA' ? 'Receita' : 'Despesa'} | Valor, Descrição e Data`;
    passoTipo.style.display = 'none';
    passoDados.style.display = 'block';
};


// ------------------------------------------
// INICIALIZAÇÃO E EVENT LISTENERS
// ------------------------------------------

// Carrega os dados na primeira vez que a página abre
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a renderização de transações (que por sua vez chama atualizarTotais e renderizarMeta)
    renderizarTransacoes(carregarTransacoes());
});

// Eventos para abrir/fechar o Modal
abrirCadastroBtn.addEventListener('click', abrirModal);
fecharModalBtn.addEventListener('click', fecharModal);

// Fecha o modal se clicar fora dele
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        fecharModal();
    }
});

// Eventos de Seleção de Tipo
document.querySelectorAll('.selecao-tipo button').forEach(button => {
    button.addEventListener('click', (e) => {
        irParaDados(e.target.getAttribute('data-tipo'));
    });
});

// Evento de Cadastro
btnCadastrar.addEventListener('click', adicionarTransacao);
