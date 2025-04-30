// Variáveis globais
let bancoDeDados = {};
let prescricaoParaExcluir = null;

// Elementos DOM
const prescriptionsList = document.getElementById('prescriptionsList');
const prescriptionModal = document.getElementById('prescriptionModal');
const confirmDeleteModal = document.getElementById('confirmDeleteModal');
const prescriptionForm = document.getElementById('prescriptionForm');
const addNewBtn = document.getElementById('addNewBtn');
const adminSearchInput = document.getElementById('adminSearchInput');
const statusNotification = document.getElementById('statusNotification');

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    carregarDados();

    addNewBtn.addEventListener('click', abrirModalAdicao);
    prescriptionForm.addEventListener('submit', salvarPrescricao);
    document.querySelector('.close-modal').addEventListener('click', fecharModal);
    document.querySelector('.cancel-btn').addEventListener('click', fecharModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmarExclusao);
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        confirmDeleteModal.style.display = 'none';
    });
    adminSearchInput.addEventListener('input', filtrarPrescricoes);
    adminSearchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            filtrarPrescricoes();
            document.querySelectorAll('.categoria-wrapper').forEach(wrapper => {
                const conteudo = wrapper.querySelector('.categoria-conteudo');
                if (conteudo && conteudo.children.length > 0) {
                    wrapper.classList.add('aberto');
                } else {
                    wrapper.classList.remove('aberto');
                }
            });
        }
    });
    
    const areasMedicas = [
        "Alergologia",
        "Cardiologia",
        "Dermatologia",
        "Emergência",
        "Endocrinologia",
        "Gastroenterologia",
        "Geriatria",
        "Ginecologia",
        "Infectologia",
        "Nefrologia",
        "Neurologia",
        "Oftalmologia",
        "Ortopedia",
        "Otorrinolaringologia",
        "Pediatria",
        "Pneumologia",
        "Psiquiatria",
        "Reumatologia / Ortopedia",
        "Urologia / Nefrologia"
      ];
      
      const selectArea = document.getElementById("prescriptionArea");
      areasMedicas.forEach(area => {
        const option = document.createElement("option");
        option.value = area;
        option.textContent = area;
        selectArea.appendChild(option);
      });
      
});


// Carregar banco
function carregarDados() {
    fetch('banco.json')
        .then(res => res.json())
        .then(data => {
            bancoDeDados = data;
            renderizarListaPrescricoes();
        })
        .catch(error => {
            prescriptionsList.innerHTML = `<div class="error-message">Erro ao carregar prescrições: ${error.message}</div>`;
            mostrarNotificacao('Erro ao carregar o banco de dados', 'error');
        });
}

// RENDER com agrupamento por área
function renderizarListaPrescricoes(filtro = '') {
    prescriptionsList.innerHTML = '';

    const categorias = {};

    for (const [key, value] of Object.entries(bancoDeDados)) {
        const area = value.area || 'Outros';
        const nome = value.informacoes.split(' - ')[0];

        if (filtro && !nome.toLowerCase().includes(filtro.toLowerCase())) continue;

        if (!categorias[area]) categorias[area] = [];
        categorias[area].push({ key, nome, ...value });
    }

    for (const [area, prescricoes] of Object.entries(categorias)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'categoria-wrapper';

        const header = document.createElement('button');
        header.className = 'categoria-header';
        header.textContent = area;
        header.onclick = () => wrapper.classList.toggle('aberto');

        const conteudo = document.createElement('div');
        conteudo.className = 'categoria-conteudo';

        prescricoes.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(p => {
            const item = document.createElement('div');
            item.className = 'prescription-item';
            item.innerHTML = `
                <div class="prescription-info">
                    <div class="prescription-name">${p.nome}</div>
                </div>
                <div class="prescription-actions">
                    <button class="edit-btn" data-key="${p.key}">Editar</button>
                    <button class="delete-btn" data-key="${p.key}">Excluir</button>
                </div>
            `;

            item.querySelector('.edit-btn').onclick = () => abrirModalEdicao(p.key);
            item.querySelector('.delete-btn').onclick = () => abrirModalConfirmacaoExclusao(p.key);
            conteudo.appendChild(item);
        });

        wrapper.appendChild(header);
        wrapper.appendChild(conteudo);
        prescriptionsList.appendChild(wrapper);
    }
}

// Filtrar
function filtrarPrescricoes() {
    renderizarListaPrescricoes(adminSearchInput.value);
    document.querySelectorAll('.categoria-wrapper').forEach(wrapper => {
        const conteudo = wrapper.querySelector('.categoria-conteudo');
        if (conteudo && conteudo.children.length > 0) {
            wrapper.classList.add('aberto');
        } else {
            wrapper.classList.remove('aberto');
        }
    });
}

// Modal Adição
function abrirModalAdicao() {
    document.getElementById('modalTitle').textContent = 'Adicionar Prescrição';
    prescriptionForm.reset();
    prescriptionForm.dataset.mode = 'add';
    prescriptionModal.style.display = 'block';
}

// Modal Edição
function abrirModalEdicao(key) {
    const prescricao = bancoDeDados[key];
    if (!prescricao) return;

    document.getElementById('modalTitle').textContent = 'Editar Prescrição';
    document.getElementById('prescriptionName').value = prescricao.informacoes.split(' - ')[0];
    document.getElementById('prescriptionText').value = prescricao.prescricao;
    document.getElementById('prescriptionInfo').value = prescricao.informacoes.split(' - ')[1] || '';
    document.getElementById('prescriptionSynonyms').value = prescricao.sinonimos ? prescricao.sinonimos.join(', ') : '';
    document.getElementById('prescriptionArea').value = prescricao.area || '';

    prescriptionForm.dataset.mode = 'edit';
    prescriptionForm.dataset.editKey = key;
    prescriptionModal.style.display = 'block';
}

// Fechar Modal
function fecharModal() {
    prescriptionModal.style.display = 'none';
    prescriptionForm.reset();
}

// Gerar chave
function gerarChave(nome) {
    return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// SALVAR prescrição
function salvarPrescricao(event) {
    event.preventDefault();

    const nome = document.getElementById('prescriptionName').value.trim();
    const texto = document.getElementById('prescriptionText').value.trim();
    const info = document.getElementById('prescriptionInfo').value.trim();
    const area = document.getElementById('prescriptionArea').value.trim();
    const sinonimos = document.getElementById('prescriptionSynonyms').value.trim();

    if (!nome || !texto || !area) {
        mostrarNotificacao('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    let key;
    const isNew = prescriptionForm.dataset.mode === 'add';

    if (isNew) {
        key = gerarChave(nome);
        let contador = 1;
        const original = key;
        while (bancoDeDados[key]) {
            key = `${original}_${contador++}`;
        }
    } else {
        key = prescriptionForm.dataset.editKey;
    }

    const nova = {
        area,
        prescricao: texto,
        informacoes: `${nome} - ${info || 'Condição médica que requer prescrição específica.'}`,
        sinonimos: sinonimos ? sinonimos.split(',').map(s => s.trim()) : [nome.toLowerCase()]
    };

    bancoDeDados[key] = nova;

    salvarNoBanco().then(() => {
        mostrarNotificacao(`Prescrição ${isNew ? 'adicionada' : 'atualizada'} com sucesso!`, 'success');
        fecharModal();
        renderizarListaPrescricoes(adminSearchInput.value);
    }).catch(error => {
        mostrarNotificacao(`Erro ao salvar: ${error.message}`, 'error');
    });
}

// Modal Exclusão
function abrirModalConfirmacaoExclusao(key) {
    prescricaoParaExcluir = key;
    confirmDeleteModal.style.display = 'block';
}

function confirmarExclusao() {
    if (!prescricaoParaExcluir) return;

    delete bancoDeDados[prescricaoParaExcluir];

    salvarNoBanco().then(() => {
        mostrarNotificacao('Prescrição excluída com sucesso!', 'success');
        confirmDeleteModal.style.display = 'none';
        renderizarListaPrescricoes(adminSearchInput.value);
    }).catch(error => {
        mostrarNotificacao(`Erro ao excluir: ${error.message}`, 'error');
    });
}

// Enviar para servidor
function salvarNoBanco() {
    return fetch('/salvar-banco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bancoDeDados)
    }).then(res => {
        if (!res.ok) throw new Error('Erro ao salvar no servidor');
        return res.json();
    });
}

// Notificações
function mostrarNotificacao(msg, tipo) {
    statusNotification.textContent = msg;
    statusNotification.className = `status-notification ${tipo} show`;
    setTimeout(() => statusNotification.classList.remove('show'), 3000);
}

// Fechar modais ao clicar fora
window.addEventListener('click', function (event) {
    if (event.target === prescriptionModal) fecharModal();
    if (event.target === confirmDeleteModal) confirmDeleteModal.style.display = 'none';
});
