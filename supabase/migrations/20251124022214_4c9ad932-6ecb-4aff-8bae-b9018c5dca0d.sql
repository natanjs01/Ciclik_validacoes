-- Função para notificar usuários sobre novos cupons
CREATE OR REPLACE FUNCTION notificar_novo_cupom()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só notificar se o cupom for criado com status disponível e ativo
  IF NEW.status = 'disponivel' AND NEW.ativo = true AND NEW.quantidade_disponivel > 0 THEN
    -- Inserir notificação para todos os usuários
    INSERT INTO notificacoes (id_usuario, tipo, mensagem)
    SELECT 
      id,
      'novo_cupom',
      format('🎁 Novo cupom disponível! %s - R$ %s de desconto. Resgate agora com %s pontos!', 
        NEW.marketplace, 
        NEW.valor_reais::text,
        NEW.pontos_necessarios::text
      )
    FROM profiles
    WHERE tipo_pessoa = 'PF'; -- Notificar apenas pessoas físicas (usuários finais)
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função após inserção de cupom
DROP TRIGGER IF EXISTS trigger_notificar_novo_cupom ON cupons;
CREATE TRIGGER trigger_notificar_novo_cupom
  AFTER INSERT ON cupons
  FOR EACH ROW
  EXECUTE FUNCTION notificar_novo_cupom();