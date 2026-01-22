// ============================================================
// 🧩 COMPONENTE: BotaoConsultarCosmos
// ============================================================
// Arquivo: src/components/BotaoConsultarCosmos.tsx
// Descrição: Botão para consultar produto na API Cosmos

import React from 'react';
import { useConsultaProduto } from '../hooks/useConsultaProduto';
import { extrairDadosParaFormulario } from '../services/cosmosApi';

interface BotaoConsultarCosmosProps {
  gtin: string;
  onDadosRecebidos?: (dados: any) => void;
}

export function BotaoConsultarCosmos({ 
  gtin, 
  onDadosRecebidos 
}: BotaoConsultarCosmosProps) {
  
  const { dados, loading, error, consultar } = useConsultaProduto();

  // Handler do clique
  async function handleConsultar() {
    await consultar(gtin);
    
    // Se encontrou dados, notificar componente pai
    if (dados && onDadosRecebidos) {
      const dadosFormulario = extrairDadosParaFormulario(dados);
      onDadosRecebidos(dadosFormulario);
    }
  }

  return (
    <div className="consulta-cosmos">
      {/* Botão de Consulta */}
      <button
        onClick={handleConsultar}
        disabled={loading || !gtin}
        className="btn-consultar-cosmos"
      >
        {loading ? (
          <>
            <span className="spinner" />
            Buscando dados...
          </>
        ) : (
          <>
            <span className="icon">🔍</span>
            Buscar Dados na Cosmos
          </>
        )}
      </button>

      {/* Mensagem de Erro */}
      {error && (
        <div className="alert alert-error">
          <strong>❌ Erro:</strong> {error}
        </div>
      )}

      {/* Mensagem de Sucesso */}
      {dados && (
        <div className="alert alert-success">
          <strong>✅ Produto encontrado!</strong>
          <ul>
            {dados.categoria_api && <li>Categoria: {dados.categoria_api}</li>}
            {dados.ncm && <li>NCM: {dados.ncm}</li>}
            {dados.peso_liquido && <li>Peso: {dados.peso_liquido}g</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 📝 CSS SUGERIDO
// ============================================================

/*
.consulta-cosmos {
  margin: 1rem 0;
}

.btn-consultar-cosmos {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-consultar-cosmos:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.btn-consultar-cosmos:disabled {
  background: #ccc;
  cursor: not-allowed;
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

.alert {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
}

.alert-error {
  background: #ffebee;
  border-left: 4px solid #f44336;
  color: #c62828;
}

.alert-success {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
  color: #2e7d32;
}

.alert ul {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
}
*/
