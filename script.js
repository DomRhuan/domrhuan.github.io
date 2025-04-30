// Função para formatar a prescrição com alinhamento correto
  function formatarPrescricao(prescricao) {
      const linhas = prescricao.split('\n');
      const medicamentos = [];
      let maxLength = 0;
      const TAMANHO_LINHA = 80; // Tamanho aproximado de uma linha A4 em caracteres monoespaçados
      const MARGEM_SEGURANCA = 10; // Margem de segurança para garantir que não fique muito próximo da borda
      
      // Padrão para identificar quantidades posológicas (exclui menções a dias)
      const padraoQuantidade = /(\d+\s+(?:COMPRIMIDOS?|CAIXAS?|FRASCOS?|AMPOLAS?|BISNAGAS?))\s*$/i;

      // Primeiro, encontramos o comprimento máximo da linha antes da quantidade
      for (let i = 1; i < linhas.length; i += 2) {
          const linha = linhas[i];
          const match = linha.match(/(.*?)((?:\d+\s+(?:COMPRIMIDOS?|CAIXAS?|FRASCOS?|AMPOLAS?|BISNAGAS?))\s*)$/i);
          if (match) {
              const parteMedicamento = match[1].trim();
              const quantidade = match[2];
              // Calcula o comprimento total necessário
              const comprimentoTotal = parteMedicamento.length + quantidade.length + 1; // +1 para o espaço
              maxLength = Math.max(maxLength, comprimentoTotal);
          }
      }

      // Agora formatamos cada linha
      const linhasFormatadas = [linhas[0]]; // Mantém a primeira linha (USO ORAL/TÓPICO/etc)
      
      for (let i = 1; i < linhas.length; i += 2) {
          const linhaMedicamento = linhas[i];
          const linhaPosologia = linhas[i + 1];
          
          // Verifica se a linha contém uma quantidade posológica
          const match = linhaMedicamento.match(/(.*?)((?:\d+\s+(?:COMPRIMIDOS?|CAIXAS?|FRASCOS?|AMPOLAS?|BISNAGAS?))\s*)$/i);
          
          if (match) {
              const parteMedicamento = match[1].trim();
              const quantidade = match[2].trim();
              
              // Calcula quantos sublinhados são necessários para alinhar à direita, considerando a margem de segurança
              const comprimentoAtual = parteMedicamento.length + quantidade.length + 1;
              const sublinhadosNecessarios = TAMANHO_LINHA - comprimentoAtual - MARGEM_SEGURANCA;
              const sublinhados = '_'.repeat(Math.max(0, sublinhadosNecessarios));
              
              // Adiciona a linha formatada
              linhasFormatadas.push(`${parteMedicamento}${sublinhados} ${quantidade}`);
              linhasFormatadas.push(linhaPosologia);
          } else {
              // Se não encontrar o padrão de quantidade posológica, mantém a linha original
              linhasFormatadas.push(linhaMedicamento);
              linhasFormatadas.push(linhaPosologia);
          }
      }

      return linhasFormatadas.join('\n');
  }

  // Função para buscar sugestões
  function buscarSugestoes(termo) {
      const sugestoes = new Set();
      const termoLower = termo.toLowerCase();
      
      // Busca apenas nos diagnósticos principais
      for (const [key, value] of Object.entries(bancoDeDados)) {
          const diagnostico = value.informacoes.split(' - ')[0];
          if (diagnostico.toLowerCase().includes(termoLower)) {
              sugestoes.add(diagnostico);
              // Limita a 5 sugestões
              if (sugestoes.size >= 5) {
                  break;
              }
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

  // Função principal de busca
  function buscar(confirmado = false) {
      const termo = document.getElementById('searchInput').value.toLowerCase();
      const resultBox = document.getElementById('resultBox');
      const sugestoesDiv = document.getElementById('sugestoes');
    
      let resultado = null;
    
      resultBox.classList.remove("aparecendo");
      void resultBox.offsetWidth;
    
      // Busca sugestões
      const sugestoes = buscarSugestoes(termo);
      exibirSugestoes(sugestoes);
    
      // Primeiro tenta encontrar pelo diagnóstico exato
      for (const key in bancoDeDados) {
          const diagnostico = bancoDeDados[key].informacoes.split(' - ')[0].toLowerCase();
          if (diagnostico === termo) {
              resultado = bancoDeDados[key];
              break;
          }
      }
    
      // Se não encontrou pelo diagnóstico exato, procura nos sinônimos
      if (!resultado) {
          for (const key in bancoDeDados) {
              if (bancoDeDados[key].sinonimos && bancoDeDados[key].sinonimos.includes(termo)) {
                  resultado = bancoDeDados[key];
                  break;
              }
          }
      }
    
      if (resultado) {
          // Formata a prescrição antes de exibir
          const prescricaoFormatada = formatarPrescricao(resultado.prescricao);
          
          resultBox.innerHTML = `
              <div class="title">Prescrição:</div>
              <div class="info prescricao-content" id="prescricaoContent">${prescricaoFormatada}</div>
              <button id="copyButton" class="copy-btn">Copiar Prescrição</button>
        `;
        resultBox.style.display = 'block';
        resultBox.classList.add("aparecendo");
        
        // Adiciona evento ao botão de cópia
        document.getElementById('copyButton').addEventListener('click', copiarPrescricao);
      } else if (termo.trim() !== "" && confirmado) {
        resultBox.innerHTML = `<div class="info">Diagnóstico não encontrado.</div>`;
        resultBox.style.display = 'block';
        resultBox.classList.add("aparecendo");
      } else {
        resultBox.style.display = 'none';
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
              copyButton.textContent = 'Copiar Prescrição';
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
              copyButton.textContent = 'Copiar Prescrição';
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
  
  document.addEventListener('DOMContentLoaded', function() {
  });
