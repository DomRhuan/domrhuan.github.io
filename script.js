// Função principal de busca
function buscar(confirmado = false) {
    const termo = document.getElementById('searchInput').value.toLowerCase();
    const resultBox = document.getElementById('resultBox');
    const sugestoesDiv = document.getElementById('sugestoes');

    if (!confirmado) {
        // Se não for confirmado, apenas busca e exibe sugestões
        const sugestoes = buscarSugestoes(termo);
        exibirSugestoes(sugestoes);
        resultBox.style.display = 'none';
        return;
    }

    resultBox.classList.remove("aparecendo");
    void resultBox.offsetWidth;

    let resultado = Object.values(bancoDeDados).find(item => {
        const diagnostico = item.informacoes.split(' - ')[0].toLowerCase();
        const sinonimos = item.sinonimos ? item.sinonimos.map(s => s.toLowerCase()) : [];
        return diagnostico === termo || sinonimos.includes(termo);
    });

    if (resultado) {
        const prescricao = resultado.prescricao.split('\n').map(linha => linha.trim()).join('\n');
        resultBox.innerHTML = `
            <div class="title">Prescrição:</div>
            <div class="info prescricao-content" id="prescricaoContent">${prescricao}</div>
            <button id="copyButton" class="copy-btn">Copiar Modelo</button>
        `;
        resultBox.style.display = 'block';
        resultBox.classList.add("aparecendo");

        document.getElementById('copyButton').addEventListener('click', copiarPrescricao);
    } else {
        resultBox.innerHTML = `<div class="info">Diagnóstico não encontrado.</div>`;
        resultBox.style.display = 'block';
        resultBox.classList.add("aparecendo");
    }
}

// Função para buscar sugestões
function buscarSugestoes(termo) {
    const sugestoes = new Set();
    const termoLower = termo.toLowerCase();

    for (const [key, value] of Object.entries(bancoDeDados)) {
        const diagnostico = value.informacoes.split(' - ')[0];
        if (diagnostico.toLowerCase().includes(termoLower)) {
            sugestoes.add(diagnostico);
        }
        
        // Busca nos sinônimos
        if (value.sinonimos) {
            for (const sinonimo of value.sinonimos) {
                if (sinonimo.toLowerCase().includes(termoLower)) {
                    sugestoes.add(diagnostico); // Adiciona o diagnóstico principal, não o sinônimo
                    break;
                }
            }
        }

        // Limita a 5 sugestões
        if (sugestoes.size >= 5) {
            break;
        }
    }

    return Array.from(sugestoes);
}

// Função para exibir sugestões
function exibirSugestoes(sugestoes) {
    const sugestoesDiv = document.getElementById('sugestoes');
    sugestoesDiv.innerHTML = '';

    if (sugestoes.length > 0) {
        sugestoes.forEach(sugestao => {
            const div = document.createElement('div');
            div.className = 'sugestao-item';
            div.textContent = sugestao;
            div.addEventListener('click', function() {
                document.getElementById('searchInput').value = sugestao;
                sugestoesDiv.style.display = 'none';
                buscar(true); // Passa true para indicar que é uma confirmação
            });
            sugestoesDiv.appendChild(div);
        });
        sugestoesDiv.style.display = 'block';
    } else {
        sugestoesDiv.style.display = 'none';
    }
}

  async function copiarPrescricao() {
      const prescricaoContent = document.getElementById('prescricaoContent');
      const copyButton = document.getElementById('copyButton');

      try {
          // Criamos um elemento completamente limpo
          const tempDiv = document.createElement('div');
          tempDiv.style.whiteSpace = 'pre-wrap';
          tempDiv.style.fontFamily = 'Courier New, monospace';

          // Usamos textContent em vez de innerHTML para evitar qualquer HTML
          tempDiv.textContent = prescricaoContent.textContent;

          // Copia apenas o texto puro
          await navigator.clipboard.writeText(tempDiv.textContent);

          // Muda o texto e estilo do botão
          copyButton.textContent = 'Copiado!';
          copyButton.classList.add('copiado');

          // Volta ao normal após 2 segundos
          setTimeout(() => {
              copyButton.textContent = 'Copiar Modelo';
              copyButton.classList.remove('copiado');
          }, 2000);
      } catch(err) {
          console.error('Erro ao copiar:', err);
          // Fallback ultra-simples
          const textarea = document.createElement('textarea');
          textarea.value = prescricaoContent.textContent;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);

          // Muda o texto e estilo do botão mesmo no fallback
          copyButton.textContent = 'Copiado!';
          copyButton.classList.add('copiado');

          // Volta ao normal após 2 segundos
          setTimeout(() => {
              copyButton.textContent = 'Copiar Modelo';
              copyButton.classList.remove('copiado');
          }, 2000);
      }
  }

  // Fecha as sugestões ao clicar fora
  document.addEventListener('click', function(e) {
      const searchInput = document.getElementById('searchInput');
      const sugestoesDiv = document.getElementById('sugestoes');
      if (!searchInput.contains(e.target) && !sugestoesDiv.contains(e.target)) {
          sugestoesDiv.style.display = 'none';
      }
  });

  // DOMContentLoaded event listener removed as it was empty
