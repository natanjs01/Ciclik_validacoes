// ============================================================
// 📄 EXEMPLO COMPLETO DE INTEGRAÇÃO
// ============================================================
// Arquivo: src/pages/ProdutosPendentesPage.tsx (EXEMPLO)
// Descrição: Como integrar a consulta Cosmos em tela existente
// 
// ⚠️ IMPORTANTE: Este é um arquivo de EXEMPLO
// Use como referência para implementar no seu projeto React
// Ajuste os imports conforme a estrutura do seu projeto

import React, { useState, useEffect } from 'react';
import { useConsultaProduto } from './useConsultaProduto'; // ← Ajuste o caminho
import { extrairDadosParaFormulario } from './cosmosApi'; // ← Ajuste o caminho

// Remova os imports abaixo se necessário (linha de exemplo comentada)
// import { supabase } from '@/lib/supabase'; // ← Adicione quando integrar

interface Produto {
  id: string;
  gtin: string;
  nome: string;
  categoria?: string;
  ncm?: string;
  peso?: number;
}

export function ProdutosPendentesPage() {
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [formulario, setFormulario] = useState({
    categoria: '',
    ncm: '',
    peso: 0
  });

  const { dados, loading, error, consultar } = useConsultaProduto();

  // ============================================================
  // HANDLER: Buscar dados na Cosmos
  // ============================================================
  async function handleBuscarCosmos() {
    if (!produtoSelecionado?.gtin) {
      alert('Nenhum produto selecionado');
      return;
    }

    await consultar(produtoSelecionado.gtin);
  }

  // ============================================================
  // HANDLER: Preencher formulário automaticamente
  // ============================================================
  React.useEffect(() => {
    if (dados) {
      const dadosExtraidos = extrairDadosParaFormulario(dados);
      
      setFormulario({
        categoria: dadosExtraidos.categoria || '',
        ncm: dadosExtraidos.ncm || '',
        peso: dadosExtraidos.peso_liquido || 0
      });

      // Opcional: Mostrar toast de sucesso
      alert(`✅ Dados preenchidos automaticamente!
        - Categoria: ${dadosExtraidos.categoria}
        - NCM: ${dadosExtraidos.ncm}
        - Peso: ${dadosExtraidos.peso_liquido}g
      `);
    }
  }, [dados]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="produtos-pendentes-page">
      <h1>Produtos Pendentes de Validação</h1>

      {/* Lista de Produtos Pendentes */}
      <section className="lista-produtos">
        {/* ... sua lista existente ... */}
      </section>

      {/* Formulário de Edição */}
      {produtoSelecionado && (
        <section className="formulario-validacao">
          <h2>Validar Produto: {produtoSelecionado.nome}</h2>
          
          <div className="campo-gtin">
            <label>GTIN:</label>
            <input 
              type="text" 
              value={produtoSelecionado.gtin} 
              disabled 
            />
          </div>

          {/* ============================================ */}
          {/* 🎯 BOTÃO DE BUSCA NA COSMOS (NOVO!)        */}
          {/* ============================================ */}
          <div className="acoes-cosmos">
            <button
              onClick={handleBuscarCosmos}
              disabled={loading}
              className="btn-buscar-cosmos"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Buscando na Cosmos...
                </>
              ) : (
                <>
                  🔍 Buscar Dados Automaticamente
                </>
              )}
            </button>

            {error && (
              <div className="alert alert-error">
                ❌ {error}
              </div>
            )}

            {dados && (
              <div className="alert alert-success">
                ✅ Dados encontrados e preenchidos!
              </div>
            )}
          </div>

          {/* Campos do Formulário */}
          <div className="campo">
            <label>Categoria:</label>
            <input
              type="text"
              value={formulario.categoria}
              onChange={(e) => setFormulario({ 
                ...formulario, 
                categoria: e.target.value 
              })}
            />
          </div>

          <div className="campo">
            <label>NCM:</label>
            <input
              type="text"
              value={formulario.ncm}
              onChange={(e) => setFormulario({ 
                ...formulario, 
                ncm: e.target.value 
              })}
            />
          </div>

          <div className="campo">
            <label>Peso (gramas):</label>
            <input
              type="number"
              value={formulario.peso}
              onChange={(e) => setFormulario({ 
                ...formulario, 
                peso: Number(e.target.value) 
              })}
            />
          </div>

          {/* Botão de Salvar */}
          <button className="btn-salvar">
            💾 Salvar Validação
          </button>
        </section>
      )}
    </div>
  );
}

// ============================================================
// 📝 EXEMPLO 2: Versão Mais Simples
// ============================================================

export function ExemploSimples() {
  const { dados, loading, consultar } = useConsultaProduto();

  return (
    <div>
      <button onClick={() => consultar('7891910000197')}>
        Consultar Açúcar União
      </button>

      {loading && <p>Carregando...</p>}
      
      {dados && (
        <div>
          <h3>{dados.descricao}</h3>
          <p>Categoria: {dados.categoria_api}</p>
          <p>NCM: {dados.ncm}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 🎨 CSS SUGERIDO
// ============================================================

/*
.produtos-pendentes-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.formulario-validacao {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 2rem;
}

.acoes-cosmos {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.btn-buscar-cosmos {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  justify-content: center;
}

.btn-buscar-cosmos:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-buscar-cosmos:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.campo {
  margin: 1rem 0;
}

.campo label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.campo input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.campo input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-salvar {
  margin-top: 1.5rem;
  padding: 1rem 2rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.btn-salvar:hover {
  background: #45a049;
}

.alert {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-success {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
  color: #2e7d32;
}

.alert-error {
  background: #ffebee;
  border-left: 4px solid #f44336;
  color: #c62828;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
*/
