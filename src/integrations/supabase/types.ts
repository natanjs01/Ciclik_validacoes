export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ajustes_pontos_manuais: {
        Row: {
          created_at: string | null
          detalhes: string | null
          diferenca: number
          id: string
          id_admin: string
          id_usuario: string
          motivo: string
          pontos_antes: number
          pontos_depois: number
        }
        Insert: {
          created_at?: string | null
          detalhes?: string | null
          diferenca: number
          id?: string
          id_admin: string
          id_usuario: string
          motivo: string
          pontos_antes: number
          pontos_depois: number
        }
        Update: {
          created_at?: string | null
          detalhes?: string | null
          diferenca?: number
          id?: string
          id_admin?: string
          id_usuario?: string
          motivo?: string
          pontos_antes?: number
          pontos_depois?: number
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_pontos_manuais_id_admin_fkey"
            columns: ["id_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_pontos_manuais_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_estoque: {
        Row: {
          data_alerta: string | null
          data_visualizacao: string | null
          id: string
          id_cupom: string | null
          mensagem: string
          tipo_alerta: string
          visualizado: boolean | null
        }
        Insert: {
          data_alerta?: string | null
          data_visualizacao?: string | null
          id?: string
          id_cupom?: string | null
          mensagem: string
          tipo_alerta: string
          visualizado?: boolean | null
        }
        Update: {
          data_alerta?: string | null
          data_visualizacao?: string | null
          id?: string
          id_cupom?: string | null
          mensagem?: string
          tipo_alerta?: string
          visualizado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_estoque_id_cupom_fkey"
            columns: ["id_cupom"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_notas_fiscais: {
        Row: {
          chave_acesso: string
          cnpj: string | null
          created_at: string
          dados_completos: Json | null
          data_consulta: string
          data_emissao: string | null
          data_expiracao: string
          fonte: string | null
          id: string
          itens: Json | null
          nome_fantasia: string | null
          numero_nota: string | null
          razao_social: string | null
          serie: string | null
          valor_total: number | null
        }
        Insert: {
          chave_acesso: string
          cnpj?: string | null
          created_at?: string
          dados_completos?: Json | null
          data_consulta?: string
          data_emissao?: string | null
          data_expiracao?: string
          fonte?: string | null
          id?: string
          itens?: Json | null
          nome_fantasia?: string | null
          numero_nota?: string | null
          razao_social?: string | null
          serie?: string | null
          valor_total?: number | null
        }
        Update: {
          chave_acesso?: string
          cnpj?: string | null
          created_at?: string
          dados_completos?: Json | null
          data_consulta?: string
          data_emissao?: string | null
          data_expiracao?: string
          fonte?: string | null
          id?: string
          itens?: Json | null
          nome_fantasia?: string | null
          numero_nota?: string | null
          razao_social?: string | null
          serie?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      cdv_certificados: {
        Row: {
          cnpj: string
          created_at: string | null
          data_emissao: string | null
          embalagens_certificadas: number
          hash_validacao: string
          horas_certificadas: number
          id: string
          id_investidor: string
          id_projeto: string | null
          id_quota: string | null
          kg_certificados: number
          link_publico: string | null
          numero_certificado: string
          pdf_url: string | null
          periodo_fim: string
          periodo_inicio: string
          qrcode_data: string | null
          quotas_incluidas: Json | null
          razao_social: string
          total_quotas: number | null
          valido: boolean | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          data_emissao?: string | null
          embalagens_certificadas: number
          hash_validacao: string
          horas_certificadas: number
          id?: string
          id_investidor: string
          id_projeto?: string | null
          id_quota?: string | null
          kg_certificados: number
          link_publico?: string | null
          numero_certificado: string
          pdf_url?: string | null
          periodo_fim: string
          periodo_inicio: string
          qrcode_data?: string | null
          quotas_incluidas?: Json | null
          razao_social: string
          total_quotas?: number | null
          valido?: boolean | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          data_emissao?: string | null
          embalagens_certificadas?: number
          hash_validacao?: string
          horas_certificadas?: number
          id?: string
          id_investidor?: string
          id_projeto?: string | null
          id_quota?: string | null
          kg_certificados?: number
          link_publico?: string | null
          numero_certificado?: string
          pdf_url?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          qrcode_data?: string | null
          quotas_incluidas?: Json | null
          razao_social?: string
          total_quotas?: number | null
          valido?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cdv_certificados_id_investidor_fkey"
            columns: ["id_investidor"]
            isOneToOne: false
            referencedRelation: "cdv_investidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cdv_certificados_id_projeto_fkey"
            columns: ["id_projeto"]
            isOneToOne: false
            referencedRelation: "cdv_projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cdv_certificados_id_quota_fkey"
            columns: ["id_quota"]
            isOneToOne: false
            referencedRelation: "cdv_quotas"
            referencedColumns: ["id"]
          },
        ]
      }
      cdv_conciliacoes: {
        Row: {
          data_conciliacao: string | null
          id: string
          id_quota: string
          ids_estoque: Json
          observacoes: string | null
          processado_por: string | null
          quantidade_conciliada: number
          tipo_impacto: string
        }
        Insert: {
          data_conciliacao?: string | null
          id?: string
          id_quota: string
          ids_estoque: Json
          observacoes?: string | null
          processado_por?: string | null
          quantidade_conciliada: number
          tipo_impacto: string
        }
        Update: {
          data_conciliacao?: string | null
          id?: string
          id_quota?: string
          ids_estoque?: Json
          observacoes?: string | null
          processado_por?: string | null
          quantidade_conciliada?: number
          tipo_impacto?: string
        }
        Relationships: [
          {
            foreignKeyName: "cdv_conciliacoes_id_quota_fkey"
            columns: ["id_quota"]
            isOneToOne: false
            referencedRelation: "cdv_quotas"
            referencedColumns: ["id"]
          },
        ]
      }
      cdv_config: {
        Row: {
          chave: string
          created_at: string | null
          descricao: string | null
          id: string
          valor: number
        }
        Insert: {
          chave: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          valor: number
        }
        Update: {
          chave?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          valor?: number
        }
        Relationships: []
      }
      cdv_investidores: {
        Row: {
          cnpj: string
          convite_enviado: boolean | null
          data_cadastro: string | null
          data_convite: string | null
          email: string
          id: string
          id_user: string
          nome_responsavel: string
          primeiro_acesso: boolean | null
          razao_social: string
          status: string | null
          telefone: string | null
        }
        Insert: {
          cnpj: string
          convite_enviado?: boolean | null
          data_cadastro?: string | null
          data_convite?: string | null
          email: string
          id?: string
          id_user: string
          nome_responsavel: string
          primeiro_acesso?: boolean | null
          razao_social: string
          status?: string | null
          telefone?: string | null
        }
        Update: {
          cnpj?: string
          convite_enviado?: boolean | null
          data_cadastro?: string | null
          data_convite?: string | null
          email?: string
          id?: string
          id_user?: string
          nome_responsavel?: string
          primeiro_acesso?: boolean | null
          razao_social?: string
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      cdv_leads: {
        Row: {
          data_cadastro: string | null
          data_contato: string | null
          email: string
          empresa: string
          id: string
          id_investidor: string | null
          nome: string
          notas: string | null
          origem: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          data_cadastro?: string | null
          data_contato?: string | null
          email: string
          empresa: string
          id?: string
          id_investidor?: string | null
          nome: string
          notas?: string | null
          origem?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          data_cadastro?: string | null
          data_contato?: string | null
          email?: string
          empresa?: string
          id?: string
          id_investidor?: string | null
          nome?: string
          notas?: string | null
          origem?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cdv_leads_id_investidor_fkey"
            columns: ["id_investidor"]
            isOneToOne: false
            referencedRelation: "cdv_investidores"
            referencedColumns: ["id"]
          },
        ]
      }
      cdv_novo: {
        Row: {
          created_at: string | null
          data_certificacao: string | null
          data_completo: string | null
          hash_validacao: string | null
          id: string
          id_projeto: string
          id_quota: string | null
          link_publico: string | null
          numero_cdv: string
          pdf_url: string | null
          qrcode_data: string | null
          status: string
          total_uib: number | null
          total_uib_educacao: number | null
          total_uib_produtos: number | null
          total_uib_residuos: number | null
          uib_educacao_ids: Json
          uib_produtos_ids: Json
          uib_residuos_ids: Json
        }
        Insert: {
          created_at?: string | null
          data_certificacao?: string | null
          data_completo?: string | null
          hash_validacao?: string | null
          id?: string
          id_projeto: string
          id_quota?: string | null
          link_publico?: string | null
          numero_cdv: string
          pdf_url?: string | null
          qrcode_data?: string | null
          status?: string
          total_uib?: number | null
          total_uib_educacao?: number | null
          total_uib_produtos?: number | null
          total_uib_residuos?: number | null
          uib_educacao_ids?: Json
          uib_produtos_ids?: Json
          uib_residuos_ids?: Json
        }
        Update: {
          created_at?: string | null
          data_certificacao?: string | null
          data_completo?: string | null
          hash_validacao?: string | null
          id?: string
          id_projeto?: string
          id_quota?: string | null
          link_publico?: string | null
          numero_cdv?: string
          pdf_url?: string | null
          qrcode_data?: string | null
          status?: string
          total_uib?: number | null
          total_uib_educacao?: number | null
          total_uib_produtos?: number | null
          total_uib_residuos?: number | null
          uib_educacao_ids?: Json
          uib_produtos_ids?: Json
          uib_residuos_ids?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cdv_novo_id_projeto_fkey"
            columns: ["id_projeto"]
            isOneToOne: false
            referencedRelation: "cdv_projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cdv_novo_id_quota_fkey"
            columns: ["id_quota"]
            isOneToOne: false
            referencedRelation: "cdv_quotas"
            referencedColumns: ["id"]
          },
        ]
      }
      cdv_projetos: {
        Row: {
          co2_conciliado_kg: number | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          descricao: string
          id: string
          kg_conciliados: number | null
          meta_co2_evitado_kg: number | null
          meta_kg_residuos: number | null
          meta_minutos_educacao: number | null
          meta_produtos_catalogados: number | null
          metas_principais: Json | null
          minutos_conciliados: number | null
          prazo_maturacao_meses: number | null
          produtos_conciliados: number | null
          publico_alvo: string | null
          quotas_por_periodo: number | null
          quotas_vendidas: number | null
          status: string | null
          titulo: string
          total_quotas: number | null
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          co2_conciliado_kg?: number | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          descricao: string
          id?: string
          kg_conciliados?: number | null
          meta_co2_evitado_kg?: number | null
          meta_kg_residuos?: number | null
          meta_minutos_educacao?: number | null
          meta_produtos_catalogados?: number | null
          metas_principais?: Json | null
          minutos_conciliados?: number | null
          prazo_maturacao_meses?: number | null
          produtos_conciliados?: number | null
          publico_alvo?: string | null
          quotas_por_periodo?: number | null
          quotas_vendidas?: number | null
          status?: string | null
          titulo: string
          total_quotas?: number | null
          updated_at?: string | null
          valor_total: number
        }
        Update: {
          co2_conciliado_kg?: number | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string
          id?: string
          kg_conciliados?: number | null
          meta_co2_evitado_kg?: number | null
          meta_kg_residuos?: number | null
          meta_minutos_educacao?: number | null
          meta_produtos_catalogados?: number | null
          metas_principais?: Json | null
          minutos_conciliados?: number | null
          prazo_maturacao_meses?: number | null
          produtos_conciliados?: number | null
          publico_alvo?: string | null
          quotas_por_periodo?: number | null
          quotas_vendidas?: number | null
          status?: string | null
          titulo?: string
          total_quotas?: number | null
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: []
      }
      cdv_quotas: {
        Row: {
          co2_conciliado_kg: number | null
          created_at: string | null
          data_atribuicao: string | null
          data_compra: string | null
          data_maturacao: string
          embalagens_conciliadas: number | null
          horas_conciliadas: number | null
          id: string
          id_cdv_novo: string | null
          id_investidor: string | null
          id_projeto: string | null
          kg_conciliados: number | null
          marcos_notificados: Json | null
          meta_co2_evitado_kg: number | null
          meta_embalagens: number | null
          meta_horas_educacao: number | null
          meta_kg_residuos: number | null
          numero_quota: string
          status: string | null
          status_maturacao: string | null
          updated_at: string | null
          valor_pago: number
        }
        Insert: {
          co2_conciliado_kg?: number | null
          created_at?: string | null
          data_atribuicao?: string | null
          data_compra?: string | null
          data_maturacao: string
          embalagens_conciliadas?: number | null
          horas_conciliadas?: number | null
          id?: string
          id_cdv_novo?: string | null
          id_investidor?: string | null
          id_projeto?: string | null
          kg_conciliados?: number | null
          marcos_notificados?: Json | null
          meta_co2_evitado_kg?: number | null
          meta_embalagens?: number | null
          meta_horas_educacao?: number | null
          meta_kg_residuos?: number | null
          numero_quota: string
          status?: string | null
          status_maturacao?: string | null
          updated_at?: string | null
          valor_pago?: number
        }
        Update: {
          co2_conciliado_kg?: number | null
          created_at?: string | null
          data_atribuicao?: string | null
          data_compra?: string | null
          data_maturacao?: string
          embalagens_conciliadas?: number | null
          horas_conciliadas?: number | null
          id?: string
          id_cdv_novo?: string | null
          id_investidor?: string | null
          id_projeto?: string | null
          kg_conciliados?: number | null
          marcos_notificados?: Json | null
          meta_co2_evitado_kg?: number | null
          meta_embalagens?: number | null
          meta_horas_educacao?: number | null
          meta_kg_residuos?: number | null
          numero_quota?: string
          status?: string | null
          status_maturacao?: string | null
          updated_at?: string | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "cdv_quotas_id_cdv_novo_fkey"
            columns: ["id_cdv_novo"]
            isOneToOne: false
            referencedRelation: "cdv_novo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cdv_quotas_id_investidor_fkey"
            columns: ["id_investidor"]
            isOneToOne: false
            referencedRelation: "cdv_investidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cdv_quotas_id_projeto_fkey"
            columns: ["id_projeto"]
            isOneToOne: false
            referencedRelation: "cdv_projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversas: {
        Row: {
          created_at: string | null
          estado_atual: string | null
          id: string
          id_entrega: string
          mensagens_log: Json | null
          numero_whatsapp_cooperativa: string
          ultimo_material_selecionado: string | null
          ultimo_submaterial_selecionado:
            | Database["public"]["Enums"]["tipo_submaterial"]
            | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado_atual?: string | null
          id?: string
          id_entrega: string
          mensagens_log?: Json | null
          numero_whatsapp_cooperativa: string
          ultimo_material_selecionado?: string | null
          ultimo_submaterial_selecionado?:
            | Database["public"]["Enums"]["tipo_submaterial"]
            | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado_atual?: string | null
          id?: string
          id_entrega?: string
          mensagens_log?: Json | null
          numero_whatsapp_cooperativa?: string
          ultimo_material_selecionado?: string | null
          ultimo_submaterial_selecionado?:
            | Database["public"]["Enums"]["tipo_submaterial"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversas_id_entrega_fkey"
            columns: ["id_entrega"]
            isOneToOne: true
            referencedRelation: "entregas_reciclaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          chave: string
          created_at: string | null
          descricao: string | null
          id: string
          updated_at: string | null
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      cooperativas: {
        Row: {
          bairro: string | null
          capacidade_mensal_ton: number | null
          cep: string
          cidade: string | null
          cnpj: string
          complemento: string | null
          convite_enviado: boolean | null
          data_cadastro: string | null
          data_primeiro_acesso: string | null
          documento_constituicao_url: string | null
          documento_representante_url: string | null
          email: string | null
          id: string
          id_user: string
          logradouro: string | null
          nome_fantasia: string
          nome_responsavel: string | null
          numero: string | null
          pontuacao_confiabilidade: number | null
          razao_social: string
          status: Database["public"]["Enums"]["status_cooperativa"] | null
          tipo_operador: Database["public"]["Enums"]["tipo_operador_logistico"]
          uf: string | null
          whatsapp: string | null
        }
        Insert: {
          bairro?: string | null
          capacidade_mensal_ton?: number | null
          cep: string
          cidade?: string | null
          cnpj: string
          complemento?: string | null
          convite_enviado?: boolean | null
          data_cadastro?: string | null
          data_primeiro_acesso?: string | null
          documento_constituicao_url?: string | null
          documento_representante_url?: string | null
          email?: string | null
          id?: string
          id_user: string
          logradouro?: string | null
          nome_fantasia: string
          nome_responsavel?: string | null
          numero?: string | null
          pontuacao_confiabilidade?: number | null
          razao_social: string
          status?: Database["public"]["Enums"]["status_cooperativa"] | null
          tipo_operador?: Database["public"]["Enums"]["tipo_operador_logistico"]
          uf?: string | null
          whatsapp?: string | null
        }
        Update: {
          bairro?: string | null
          capacidade_mensal_ton?: number | null
          cep?: string
          cidade?: string | null
          cnpj?: string
          complemento?: string | null
          convite_enviado?: boolean | null
          data_cadastro?: string | null
          data_primeiro_acesso?: string | null
          documento_constituicao_url?: string | null
          documento_representante_url?: string | null
          email?: string | null
          id?: string
          id_user?: string
          logradouro?: string | null
          nome_fantasia?: string
          nome_responsavel?: string | null
          numero?: string | null
          pontuacao_confiabilidade?: number | null
          razao_social?: string
          status?: Database["public"]["Enums"]["status_cooperativa"] | null
          tipo_operador?: Database["public"]["Enums"]["tipo_operador_logistico"]
          uf?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      cupons: {
        Row: {
          ativo: boolean | null
          codigo: string
          data_cadastro: string | null
          data_resgate: string | null
          data_uso: string | null
          data_validade: string | null
          id: string
          id_usuario_resgatou: string | null
          limite_alerta: number | null
          marketplace: string
          minimo_compra: number
          pontos_necessarios: number
          quantidade_disponivel: number | null
          quantidade_resgatada: number | null
          quantidade_total: number | null
          status: Database["public"]["Enums"]["status_cupom"] | null
          valor_reais: number
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          data_cadastro?: string | null
          data_resgate?: string | null
          data_uso?: string | null
          data_validade?: string | null
          id?: string
          id_usuario_resgatou?: string | null
          limite_alerta?: number | null
          marketplace: string
          minimo_compra: number
          pontos_necessarios?: number
          quantidade_disponivel?: number | null
          quantidade_resgatada?: number | null
          quantidade_total?: number | null
          status?: Database["public"]["Enums"]["status_cupom"] | null
          valor_reais?: number
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          data_cadastro?: string | null
          data_resgate?: string | null
          data_uso?: string | null
          data_validade?: string | null
          id?: string
          id_usuario_resgatou?: string | null
          limite_alerta?: number | null
          marketplace?: string
          minimo_compra?: number
          pontos_necessarios?: number
          quantidade_disponivel?: number | null
          quantidade_resgatada?: number | null
          quantidade_total?: number | null
          status?: Database["public"]["Enums"]["status_cupom"] | null
          valor_reais?: number
        }
        Relationships: []
      }
      cupons_resgates: {
        Row: {
          codigo_unico: string
          data_resgate: string | null
          data_uso: string | null
          id: string
          id_cupom: string
          id_usuario: string
          pontos_utilizados: number
          qr_code: string | null
          status: string | null
        }
        Insert: {
          codigo_unico: string
          data_resgate?: string | null
          data_uso?: string | null
          id?: string
          id_cupom: string
          id_usuario: string
          pontos_utilizados?: number
          qr_code?: string | null
          status?: string | null
        }
        Update: {
          codigo_unico?: string
          data_resgate?: string | null
          data_uso?: string | null
          id?: string
          id_cupom?: string
          id_usuario?: string
          pontos_utilizados?: number
          qr_code?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cupons_resgates_id_cupom_fkey"
            columns: ["id_cupom"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_resgates_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_cooperativas: {
        Row: {
          assunto: string
          created_at: string
          data_envio: string
          email_destino: string
          id: string
          id_cooperativa: string
          mensagem_erro: string | null
          metadata: Json | null
          status_envio: string
          tipo_email: string
        }
        Insert: {
          assunto: string
          created_at?: string
          data_envio?: string
          email_destino: string
          id?: string
          id_cooperativa: string
          mensagem_erro?: string | null
          metadata?: Json | null
          status_envio?: string
          tipo_email: string
        }
        Update: {
          assunto?: string
          created_at?: string
          data_envio?: string
          email_destino?: string
          id?: string
          id_cooperativa?: string
          mensagem_erro?: string | null
          metadata?: Json | null
          status_envio?: string
          tipo_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_cooperativas_id_cooperativa_fkey"
            columns: ["id_cooperativa"]
            isOneToOne: false
            referencedRelation: "cooperativas"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_investidores: {
        Row: {
          assunto: string
          created_at: string | null
          email_destino: string
          id: string
          id_investidor: string | null
          mensagem_erro: string | null
          metadata: Json | null
          status_envio: string | null
          tipo_email: string
        }
        Insert: {
          assunto: string
          created_at?: string | null
          email_destino: string
          id?: string
          id_investidor?: string | null
          mensagem_erro?: string | null
          metadata?: Json | null
          status_envio?: string | null
          tipo_email: string
        }
        Update: {
          assunto?: string
          created_at?: string | null
          email_destino?: string
          id?: string
          id_investidor?: string | null
          mensagem_erro?: string | null
          metadata?: Json | null
          status_envio?: string | null
          tipo_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_investidores_id_investidor_fkey"
            columns: ["id_investidor"]
            isOneToOne: false
            referencedRelation: "cdv_investidores"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          id: string
          id_user: string
          nivel_selo_origem: Database["public"]["Enums"]["nivel_selo"] | null
          nivel_selo_venda_limpa:
            | Database["public"]["Enums"]["nivel_selo"]
            | null
          percentual_faturamento_verde: number | null
          percentual_recuperacao: number | null
          plano_atual: string | null
          tipo_empresa: Database["public"]["Enums"]["tipo_empresa"]
        }
        Insert: {
          id?: string
          id_user: string
          nivel_selo_origem?: Database["public"]["Enums"]["nivel_selo"] | null
          nivel_selo_venda_limpa?:
            | Database["public"]["Enums"]["nivel_selo"]
            | null
          percentual_faturamento_verde?: number | null
          percentual_recuperacao?: number | null
          plano_atual?: string | null
          tipo_empresa: Database["public"]["Enums"]["tipo_empresa"]
        }
        Update: {
          id?: string
          id_user?: string
          nivel_selo_origem?: Database["public"]["Enums"]["nivel_selo"] | null
          nivel_selo_venda_limpa?:
            | Database["public"]["Enums"]["nivel_selo"]
            | null
          percentual_faturamento_verde?: number | null
          percentual_recuperacao?: number | null
          plano_atual?: string | null
          tipo_empresa?: Database["public"]["Enums"]["tipo_empresa"]
        }
        Relationships: []
      }
      entregas_reciclaveis: {
        Row: {
          data_geracao: string | null
          data_recebimento: string | null
          data_validacao: string | null
          hash_qrcode: string | null
          id: string
          id_cooperativa: string
          id_usuario: string
          itens_vinculados: Json | null
          peso_estimado: number | null
          peso_rejeito_kg: number | null
          peso_validado: number | null
          qrcode_id: string
          status: Database["public"]["Enums"]["status_entrega"] | null
          status_promessa:
            | Database["public"]["Enums"]["status_promessa_entrega"]
            | null
          tipo_material: string
        }
        Insert: {
          data_geracao?: string | null
          data_recebimento?: string | null
          data_validacao?: string | null
          hash_qrcode?: string | null
          id?: string
          id_cooperativa: string
          id_usuario: string
          itens_vinculados?: Json | null
          peso_estimado?: number | null
          peso_rejeito_kg?: number | null
          peso_validado?: number | null
          qrcode_id: string
          status?: Database["public"]["Enums"]["status_entrega"] | null
          status_promessa?:
            | Database["public"]["Enums"]["status_promessa_entrega"]
            | null
          tipo_material: string
        }
        Update: {
          data_geracao?: string | null
          data_recebimento?: string | null
          data_validacao?: string | null
          hash_qrcode?: string | null
          id?: string
          id_cooperativa?: string
          id_usuario?: string
          itens_vinculados?: Json | null
          peso_estimado?: number | null
          peso_rejeito_kg?: number | null
          peso_validado?: number | null
          qrcode_id?: string
          status?: Database["public"]["Enums"]["status_entrega"] | null
          status_promessa?:
            | Database["public"]["Enums"]["status_promessa_entrega"]
            | null
          tipo_material?: string
        }
        Relationships: [
          {
            foreignKeyName: "entregas_reciclaveis_id_cooperativa_fkey"
            columns: ["id_cooperativa"]
            isOneToOne: false
            referencedRelation: "cooperativas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_educacao: {
        Row: {
          created_at: string | null
          data: string
          data_atribuicao: string | null
          id: string
          id_cdv: string | null
          id_missao: string | null
          id_usuario: string
          minutos_assistidos: number
          modulo: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          data_atribuicao?: string | null
          id?: string
          id_cdv?: string | null
          id_missao?: string | null
          id_usuario: string
          minutos_assistidos: number
          modulo: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          data_atribuicao?: string | null
          id?: string
          id_cdv?: string | null
          id_missao?: string | null
          id_usuario?: string
          minutos_assistidos?: number
          modulo?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_educacao_id_cdv_fkey"
            columns: ["id_cdv"]
            isOneToOne: false
            referencedRelation: "cdv_quotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_educacao_id_missao_fkey"
            columns: ["id_missao"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_educacao_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_embalagens: {
        Row: {
          created_at: string | null
          data: string
          data_atribuicao: string | null
          gtin: string
          id: string
          id_cdv: string | null
          id_produto: string | null
          nome_produto: string
          reciclabilidade: number | null
          status: string | null
          tipo_embalagem: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          data_atribuicao?: string | null
          gtin: string
          id?: string
          id_cdv?: string | null
          id_produto?: string | null
          nome_produto: string
          reciclabilidade?: number | null
          status?: string | null
          tipo_embalagem?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          data_atribuicao?: string | null
          gtin?: string
          id?: string
          id_cdv?: string | null
          id_produto?: string | null
          nome_produto?: string
          reciclabilidade?: number | null
          status?: string | null
          tipo_embalagem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_embalagens_id_cdv_fkey"
            columns: ["id_cdv"]
            isOneToOne: false
            referencedRelation: "cdv_quotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_embalagens_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produtos_ciclik"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_residuos: {
        Row: {
          created_at: string | null
          data_atribuicao: string | null
          data_entrega: string
          id: string
          id_cdv: string | null
          id_cooperativa: string
          id_entrega: string | null
          id_usuario: string
          kg: number
          status: string | null
          submaterial: string
        }
        Insert: {
          created_at?: string | null
          data_atribuicao?: string | null
          data_entrega: string
          id?: string
          id_cdv?: string | null
          id_cooperativa: string
          id_entrega?: string | null
          id_usuario: string
          kg: number
          status?: string | null
          submaterial: string
        }
        Update: {
          created_at?: string | null
          data_atribuicao?: string | null
          data_entrega?: string
          id?: string
          id_cdv?: string | null
          id_cooperativa?: string
          id_entrega?: string | null
          id_usuario?: string
          kg?: number
          status?: string | null
          submaterial?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_residuos_id_cdv_fkey"
            columns: ["id_cdv"]
            isOneToOne: false
            referencedRelation: "cdv_quotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_residuos_id_cooperativa_fkey"
            columns: ["id_cooperativa"]
            isOneToOne: false
            referencedRelation: "cooperativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_residuos_id_entrega_fkey"
            columns: ["id_entrega"]
            isOneToOne: false
            referencedRelation: "entregas_reciclaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_residuos_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      impacto_bruto: {
        Row: {
          created_at: string | null
          data_hora: string | null
          descricao_origem: string | null
          gtin: string | null
          id: string
          id_cooperativa: string | null
          id_entrega: string | null
          id_missao: string | null
          id_nota_fiscal: string | null
          id_usuario: string | null
          processado: boolean | null
          submaterial: string | null
          tipo: string
          valor_bruto: number
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_hora?: string | null
          descricao_origem?: string | null
          gtin?: string | null
          id?: string
          id_cooperativa?: string | null
          id_entrega?: string | null
          id_missao?: string | null
          id_nota_fiscal?: string | null
          id_usuario?: string | null
          processado?: boolean | null
          submaterial?: string | null
          tipo: string
          valor_bruto: number
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_hora?: string | null
          descricao_origem?: string | null
          gtin?: string | null
          id?: string
          id_cooperativa?: string | null
          id_entrega?: string | null
          id_missao?: string | null
          id_nota_fiscal?: string | null
          id_usuario?: string | null
          processado?: boolean | null
          submaterial?: string | null
          tipo?: string
          valor_bruto?: number
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impacto_bruto_id_cooperativa_fkey"
            columns: ["id_cooperativa"]
            isOneToOne: false
            referencedRelation: "cooperativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impacto_bruto_id_entrega_fkey"
            columns: ["id_entrega"]
            isOneToOne: false
            referencedRelation: "entregas_reciclaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impacto_bruto_id_missao_fkey"
            columns: ["id_missao"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impacto_bruto_id_nota_fiscal_fkey"
            columns: ["id_nota_fiscal"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impacto_bruto_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      indicacoes: {
        Row: {
          data_indicacao: string | null
          id: string
          id_indicado: string
          id_indicador: string
          pontos_cadastro_concedidos: boolean | null
          pontos_primeira_missao_concedidos: boolean | null
        }
        Insert: {
          data_indicacao?: string | null
          id?: string
          id_indicado: string
          id_indicador: string
          pontos_cadastro_concedidos?: boolean | null
          pontos_primeira_missao_concedidos?: boolean | null
        }
        Update: {
          data_indicacao?: string | null
          id?: string
          id_indicado?: string
          id_indicador?: string
          pontos_cadastro_concedidos?: boolean | null
          pontos_primeira_missao_concedidos?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "indicacoes_id_indicado_fkey"
            columns: ["id_indicado"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_id_indicador_fkey"
            columns: ["id_indicador"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          cooperativas_ativas: number | null
          cupons_resgatados_total: number | null
          cupons_usados_total: number | null
          data_referencia: string
          empresas_parceiras: number | null
          id: string
          missoes_concluidas_total: number | null
          notas_validas_total: number | null
          toneladas_validas: number | null
          usuarios_ativos: number | null
          usuarios_totais: number | null
        }
        Insert: {
          cooperativas_ativas?: number | null
          cupons_resgatados_total?: number | null
          cupons_usados_total?: number | null
          data_referencia: string
          empresas_parceiras?: number | null
          id?: string
          missoes_concluidas_total?: number | null
          notas_validas_total?: number | null
          toneladas_validas?: number | null
          usuarios_ativos?: number | null
          usuarios_totais?: number | null
        }
        Update: {
          cooperativas_ativas?: number | null
          cupons_resgatados_total?: number | null
          cupons_usados_total?: number | null
          data_referencia?: string
          empresas_parceiras?: number | null
          id?: string
          missoes_concluidas_total?: number | null
          notas_validas_total?: number | null
          toneladas_validas?: number | null
          usuarios_ativos?: number | null
          usuarios_totais?: number | null
        }
        Relationships: []
      }
      materiais_coletados_detalhado: {
        Row: {
          created_at: string | null
          id: string
          id_cooperativa: string
          id_entrega: string
          observacoes: string | null
          peso_kg: number
          registrado_em: string | null
          registrado_por_whatsapp: string | null
          subtipo_material: Database["public"]["Enums"]["tipo_submaterial"]
          tipo_material: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_cooperativa: string
          id_entrega: string
          observacoes?: string | null
          peso_kg: number
          registrado_em?: string | null
          registrado_por_whatsapp?: string | null
          subtipo_material: Database["public"]["Enums"]["tipo_submaterial"]
          tipo_material: string
        }
        Update: {
          created_at?: string | null
          id?: string
          id_cooperativa?: string
          id_entrega?: string
          observacoes?: string | null
          peso_kg?: number
          registrado_em?: string | null
          registrado_por_whatsapp?: string | null
          subtipo_material?: Database["public"]["Enums"]["tipo_submaterial"]
          tipo_material?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_coletados_detalhado_id_cooperativa_fkey"
            columns: ["id_cooperativa"]
            isOneToOne: false
            referencedRelation: "cooperativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_coletados_detalhado_id_entrega_fkey"
            columns: ["id_entrega"]
            isOneToOne: false
            referencedRelation: "entregas_reciclaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais_pontuacao: {
        Row: {
          pontos_por_6kg: number
          tipo_material: string
        }
        Insert: {
          pontos_por_6kg: number
          tipo_material: string
        }
        Update: {
          pontos_por_6kg?: number
          tipo_material?: string
        }
        Relationships: []
      }
      materiais_reciclaveis_usuario: {
        Row: {
          created_at: string | null
          data_cadastro: string | null
          data_entrega: string | null
          descricao: string
          gtin: string | null
          id: string
          id_entrega: string | null
          id_nota_fiscal: string | null
          id_usuario: string
          origem_cadastro: string
          percentual_reciclabilidade: number | null
          peso_total_estimado_gramas: number | null
          peso_unitario_gramas: number | null
          pontos_ganhos: number | null
          quantidade: number | null
          reciclavel: boolean | null
          status: string | null
          tipo_embalagem:
            | Database["public"]["Enums"]["tipo_embalagem_enum"]
            | null
        }
        Insert: {
          created_at?: string | null
          data_cadastro?: string | null
          data_entrega?: string | null
          descricao: string
          gtin?: string | null
          id?: string
          id_entrega?: string | null
          id_nota_fiscal?: string | null
          id_usuario: string
          origem_cadastro: string
          percentual_reciclabilidade?: number | null
          peso_total_estimado_gramas?: number | null
          peso_unitario_gramas?: number | null
          pontos_ganhos?: number | null
          quantidade?: number | null
          reciclavel?: boolean | null
          status?: string | null
          tipo_embalagem?:
            | Database["public"]["Enums"]["tipo_embalagem_enum"]
            | null
        }
        Update: {
          created_at?: string | null
          data_cadastro?: string | null
          data_entrega?: string | null
          descricao?: string
          gtin?: string | null
          id?: string
          id_entrega?: string | null
          id_nota_fiscal?: string | null
          id_usuario?: string
          origem_cadastro?: string
          percentual_reciclabilidade?: number | null
          peso_total_estimado_gramas?: number | null
          peso_unitario_gramas?: number | null
          pontos_ganhos?: number | null
          quantidade?: number | null
          reciclavel?: boolean | null
          status?: string | null
          tipo_embalagem?:
            | Database["public"]["Enums"]["tipo_embalagem_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "materiais_reciclaveis_usuario_id_entrega_fkey"
            columns: ["id_entrega"]
            isOneToOne: false
            referencedRelation: "entregas_reciclaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_reciclaveis_usuario_id_nota_fiscal_fkey"
            columns: ["id_nota_fiscal"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_reciclaveis_usuario_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_empresas: {
        Row: {
          created_at: string | null
          cupons_emitidos: number | null
          data_registro: string
          faturamento_total: number | null
          faturamento_verde: number | null
          id: string
          id_empresa: string
          notas_fiscais_validadas: number | null
          percentual_faturamento_verde: number | null
          taxa_recuperacao: number | null
          toneladas_recuperadas: number | null
        }
        Insert: {
          created_at?: string | null
          cupons_emitidos?: number | null
          data_registro?: string
          faturamento_total?: number | null
          faturamento_verde?: number | null
          id?: string
          id_empresa: string
          notas_fiscais_validadas?: number | null
          percentual_faturamento_verde?: number | null
          taxa_recuperacao?: number | null
          toneladas_recuperadas?: number | null
        }
        Update: {
          created_at?: string | null
          cupons_emitidos?: number | null
          data_registro?: string
          faturamento_total?: number | null
          faturamento_verde?: number | null
          id?: string
          id_empresa?: string
          notas_fiscais_validadas?: number | null
          percentual_faturamento_verde?: number | null
          taxa_recuperacao?: number | null
          toneladas_recuperadas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_empresas_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      missoes: {
        Row: {
          alternativa_a: string | null
          alternativa_b: string | null
          alternativa_c: string | null
          alternativa_d: string | null
          apostila_pdf_url: string | null
          descricao: string
          duracao_minutos: number | null
          id: string
          ordem: number
          pergunta: string | null
          pontos: number
          resposta_correta: string | null
          status: Database["public"]["Enums"]["status_missao"] | null
          tipo: Database["public"]["Enums"]["tipo_missao"]
          titulo: string
          valor_credito: number | null
          video_url: string | null
        }
        Insert: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          apostila_pdf_url?: string | null
          descricao: string
          duracao_minutos?: number | null
          id?: string
          ordem?: number
          pergunta?: string | null
          pontos: number
          resposta_correta?: string | null
          status?: Database["public"]["Enums"]["status_missao"] | null
          tipo: Database["public"]["Enums"]["tipo_missao"]
          titulo: string
          valor_credito?: number | null
          video_url?: string | null
        }
        Update: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          apostila_pdf_url?: string | null
          descricao?: string
          duracao_minutos?: number | null
          id?: string
          ordem?: number
          pergunta?: string | null
          pontos?: number
          resposta_correta?: string | null
          status?: Database["public"]["Enums"]["status_missao"] | null
          tipo?: Database["public"]["Enums"]["tipo_missao"]
          titulo?: string
          valor_credito?: number | null
          video_url?: string | null
        }
        Relationships: []
      }
      missoes_usuarios: {
        Row: {
          data_conclusao: string | null
          id: string
          id_missao: string
          id_usuario: string
          percentual_acerto: number | null
          quiz_completo: boolean | null
        }
        Insert: {
          data_conclusao?: string | null
          id?: string
          id_missao: string
          id_usuario: string
          percentual_acerto?: number | null
          quiz_completo?: boolean | null
        }
        Update: {
          data_conclusao?: string | null
          id?: string
          id_missao?: string
          id_usuario?: string
          percentual_acerto?: number | null
          quiz_completo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "missoes_usuarios_id_missao_fkey"
            columns: ["id_missao"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          cnpj_estabelecimento: string | null
          data_compra: string | null
          data_envio: string | null
          id: string
          id_usuario: string
          imagem_nf: string
          itens: Json | null
          itens_enriquecidos: Json | null
          numero_nota: string | null
          produtos_nao_cadastrados: number | null
          status_validacao:
            | Database["public"]["Enums"]["status_validacao"]
            | null
          valor_total: number | null
        }
        Insert: {
          cnpj_estabelecimento?: string | null
          data_compra?: string | null
          data_envio?: string | null
          id?: string
          id_usuario: string
          imagem_nf: string
          itens?: Json | null
          itens_enriquecidos?: Json | null
          numero_nota?: string | null
          produtos_nao_cadastrados?: number | null
          status_validacao?:
            | Database["public"]["Enums"]["status_validacao"]
            | null
          valor_total?: number | null
        }
        Update: {
          cnpj_estabelecimento?: string | null
          data_compra?: string | null
          data_envio?: string | null
          id?: string
          id_usuario?: string
          imagem_nf?: string
          itens?: Json | null
          itens_enriquecidos?: Json | null
          numero_nota?: string | null
          produtos_nao_cadastrados?: number | null
          status_validacao?:
            | Database["public"]["Enums"]["status_validacao"]
            | null
          valor_total?: number | null
        }
        Relationships: []
      }
      notas_fiscais_cooperativa: {
        Row: {
          data_emissao: string
          data_envio: string | null
          id: string
          id_cooperativa: string
          nf_pdf: string | null
          nf_xml: string | null
          peso_total_nf: number | null
          status_validacao:
            | Database["public"]["Enums"]["status_validacao"]
            | null
        }
        Insert: {
          data_emissao: string
          data_envio?: string | null
          id?: string
          id_cooperativa: string
          nf_pdf?: string | null
          nf_xml?: string | null
          peso_total_nf?: number | null
          status_validacao?:
            | Database["public"]["Enums"]["status_validacao"]
            | null
        }
        Update: {
          data_emissao?: string
          data_envio?: string | null
          id?: string
          id_cooperativa?: string
          nf_pdf?: string | null
          nf_xml?: string | null
          peso_total_nf?: number | null
          status_validacao?:
            | Database["public"]["Enums"]["status_validacao"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_cooperativa_id_cooperativa_fkey"
            columns: ["id_cooperativa"]
            isOneToOne: false
            referencedRelation: "cooperativas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          data_criacao: string | null
          id: string
          id_usuario: string
          lida: boolean | null
          mensagem: string
          tipo: string
        }
        Insert: {
          data_criacao?: string | null
          id?: string
          id_usuario: string
          lida?: boolean | null
          mensagem: string
          tipo: string
        }
        Update: {
          data_criacao?: string | null
          id?: string
          id_usuario?: string
          lida?: boolean | null
          mensagem?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_mensais_usuarios: {
        Row: {
          created_at: string | null
          id: string
          id_usuario: string
          mes_referencia: string
          nivel_atingido: Database["public"]["Enums"]["nivel_usuario"] | null
          pontos_acumulados: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_usuario: string
          mes_referencia: string
          nivel_atingido?: Database["public"]["Enums"]["nivel_usuario"] | null
          pontos_acumulados?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_usuario?: string
          mes_referencia?: string
          nivel_atingido?: Database["public"]["Enums"]["nivel_usuario"] | null
          pontos_acumulados?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      produto_embalagens: {
        Row: {
          created_at: string | null
          id: string
          percentual_reciclabilidade: number | null
          peso_medio_gramas: number | null
          produto_id: string
          reciclavel: boolean
          tipo_embalagem: Database["public"]["Enums"]["tipo_embalagem_enum"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          percentual_reciclabilidade?: number | null
          peso_medio_gramas?: number | null
          produto_id: string
          reciclavel?: boolean
          tipo_embalagem: Database["public"]["Enums"]["tipo_embalagem_enum"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          percentual_reciclabilidade?: number | null
          peso_medio_gramas?: number | null
          produto_id?: string
          reciclavel?: boolean
          tipo_embalagem?: Database["public"]["Enums"]["tipo_embalagem_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produto_embalagens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_ciclik"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_ciclik: {
        Row: {
          data_atualizacao: string | null
          data_cadastro: string | null
          descricao: string
          gtin: string
          id: string
          ncm: string
          observacoes: string | null
          percentual_reciclabilidade: number | null
          peso_medio_gramas: number | null
          reciclavel: boolean
          tipo_embalagem: Database["public"]["Enums"]["tipo_embalagem_enum"]
        }
        Insert: {
          data_atualizacao?: string | null
          data_cadastro?: string | null
          descricao: string
          gtin: string
          id?: string
          ncm: string
          observacoes?: string | null
          percentual_reciclabilidade?: number | null
          peso_medio_gramas?: number | null
          reciclavel?: boolean
          tipo_embalagem: Database["public"]["Enums"]["tipo_embalagem_enum"]
        }
        Update: {
          data_atualizacao?: string | null
          data_cadastro?: string | null
          descricao?: string
          gtin?: string
          id?: string
          ncm?: string
          observacoes?: string | null
          percentual_reciclabilidade?: number | null
          peso_medio_gramas?: number | null
          reciclavel?: boolean
          tipo_embalagem?: Database["public"]["Enums"]["tipo_embalagem_enum"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bairro: string | null
          cep: string
          cidade: string | null
          cnpj: string | null
          codigo_indicacao: string | null
          complemento: string | null
          cpf: string | null
          creditos_resgate: number | null
          cupons_resgatados: number | null
          data_cadastro: string | null
          email: string
          id: string
          instagram_handle: string | null
          linkedin_profile: string | null
          logradouro: string | null
          missoes_concluidas: number | null
          nivel: Database["public"]["Enums"]["nivel_usuario"] | null
          nome: string
          numero: string | null
          score_verde: number | null
          telefone: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pj: Database["public"]["Enums"]["tipo_pj_enum"] | null
          uf: string | null
        }
        Insert: {
          avatar_url?: string | null
          bairro?: string | null
          cep: string
          cidade?: string | null
          cnpj?: string | null
          codigo_indicacao?: string | null
          complemento?: string | null
          cpf?: string | null
          creditos_resgate?: number | null
          cupons_resgatados?: number | null
          data_cadastro?: string | null
          email: string
          id: string
          instagram_handle?: string | null
          linkedin_profile?: string | null
          logradouro?: string | null
          missoes_concluidas?: number | null
          nivel?: Database["public"]["Enums"]["nivel_usuario"] | null
          nome: string
          numero?: string | null
          score_verde?: number | null
          telefone?: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pj?: Database["public"]["Enums"]["tipo_pj_enum"] | null
          uf?: string | null
        }
        Update: {
          avatar_url?: string | null
          bairro?: string | null
          cep?: string
          cidade?: string | null
          cnpj?: string | null
          codigo_indicacao?: string | null
          complemento?: string | null
          cpf?: string | null
          creditos_resgate?: number | null
          cupons_resgatados?: number | null
          data_cadastro?: string | null
          email?: string
          id?: string
          instagram_handle?: string | null
          linkedin_profile?: string | null
          logradouro?: string | null
          missoes_concluidas?: number | null
          nivel?: Database["public"]["Enums"]["nivel_usuario"] | null
          nome?: string
          numero?: string | null
          score_verde?: number | null
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pj?: Database["public"]["Enums"]["tipo_pj_enum"] | null
          uf?: string | null
        }
        Relationships: []
      }
      questoes_missao: {
        Row: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          explicacao: string | null
          id: string
          id_missao: string
          ordem: number
          pergunta: string
          resposta_correta: string
        }
        Insert: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          explicacao?: string | null
          id?: string
          id_missao: string
          ordem?: number
          pergunta: string
          resposta_correta: string
        }
        Update: {
          alternativa_a?: string
          alternativa_b?: string
          alternativa_c?: string
          alternativa_d?: string
          explicacao?: string | null
          id?: string
          id_missao?: string
          ordem?: number
          pergunta?: string
          resposta_correta?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_missao_id_missao_fkey"
            columns: ["id_missao"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_quiz: {
        Row: {
          correta: boolean
          data_resposta: string | null
          id: string
          id_missao: string
          id_questao: string
          id_usuario: string
          resposta_usuario: string
        }
        Insert: {
          correta: boolean
          data_resposta?: string | null
          id?: string
          id_missao: string
          id_questao: string
          id_usuario: string
          resposta_usuario: string
        }
        Update: {
          correta?: boolean
          data_resposta?: string | null
          id?: string
          id_missao?: string
          id_questao?: string
          id_usuario?: string
          resposta_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_quiz_id_missao_fkey"
            columns: ["id_missao"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_quiz_id_questao_fkey"
            columns: ["id_questao"]
            isOneToOne: false
            referencedRelation: "questoes_missao"
            referencedColumns: ["id"]
          },
        ]
      }
      saldo_parcial: {
        Row: {
          id: string
          saldo: number | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          saldo?: number | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          saldo?: number | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      uib: {
        Row: {
          created_at: string | null
          data_atribuicao: string | null
          data_geracao: string | null
          data_reserva: string | null
          id: string
          id_cdv_novo: string | null
          id_projeto: string | null
          ids_origem: Json
          numero_sequencial: number
          status: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          data_atribuicao?: string | null
          data_geracao?: string | null
          data_reserva?: string | null
          id?: string
          id_cdv_novo?: string | null
          id_projeto?: string | null
          ids_origem?: Json
          numero_sequencial?: number
          status?: string
          tipo: string
        }
        Update: {
          created_at?: string | null
          data_atribuicao?: string | null
          data_geracao?: string | null
          data_reserva?: string | null
          id?: string
          id_cdv_novo?: string | null
          id_projeto?: string | null
          ids_origem?: Json
          numero_sequencial?: number
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_uib_cdv_novo"
            columns: ["id_cdv_novo"]
            isOneToOne: false
            referencedRelation: "cdv_novo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uib_id_projeto_fkey"
            columns: ["id_projeto"]
            isOneToOne: false
            referencedRelation: "cdv_projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variacoes_peso_entrega: {
        Row: {
          created_at: string | null
          dentro_margem: boolean
          fator_pontuacao: number
          id: string
          id_entrega: string
          id_usuario: string
          observacoes: string | null
          peso_estimado_kg: number
          peso_validado_kg: number
          pontos_aplicados: number
          pontos_base: number
          variacao_absoluta_kg: number
          variacao_percentual: number
        }
        Insert: {
          created_at?: string | null
          dentro_margem: boolean
          fator_pontuacao?: number
          id?: string
          id_entrega: string
          id_usuario: string
          observacoes?: string | null
          peso_estimado_kg: number
          peso_validado_kg: number
          pontos_aplicados: number
          pontos_base: number
          variacao_absoluta_kg: number
          variacao_percentual: number
        }
        Update: {
          created_at?: string | null
          dentro_margem?: boolean
          fator_pontuacao?: number
          id?: string
          id_entrega?: string
          id_usuario?: string
          observacoes?: string | null
          peso_estimado_kg?: number
          peso_validado_kg?: number
          pontos_aplicados?: number
          pontos_base?: number
          variacao_absoluta_kg?: number
          variacao_percentual?: number
        }
        Relationships: [
          {
            foreignKeyName: "variacoes_peso_entrega_id_entrega_fkey"
            columns: ["id_entrega"]
            isOneToOne: false
            referencedRelation: "entregas_reciclaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variacoes_peso_entrega_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_pontos_mensais: {
        Args: { p_pontos_ganhos: number; p_usuario_id: string }
        Returns: Json
      }
      atualizar_status_maturacao_cdv_quotas: {
        Args: { p_id_projeto?: string }
        Returns: number
      }
      calcular_pontos_entrega_finalizada: {
        Args: { p_id_entrega: string }
        Returns: number
      }
      calcular_pontuacao_com_variacao: {
        Args: {
          p_peso_estimado: number
          p_peso_validado: number
          p_pontos_base: number
        }
        Returns: {
          dentro_margem: boolean
          fator_pontuacao: number
          pontos_finais: number
          variacao_percentual: number
        }[]
      }
      conceder_pontos_missao: {
        Args: { p_missao_id: string; p_usuario_id: string }
        Returns: Json
      }
      distribuir_datas_maturacao_quotas: {
        Args: { p_id_projeto: string }
        Returns: number
      }
      expirar_promessas_antigas: { Args: never; Returns: undefined }
      expirar_promessas_antigas_v2: { Args: never; Returns: undefined }
      gerar_codigo_indicacao: { Args: never; Returns: string }
      gerar_numero_cdv: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      marcar_cupons_expirados: { Args: never; Returns: undefined }
      registrar_indicacao: {
        Args: { p_codigo_indicacao: string; p_usuario_novo_id: string }
        Returns: Json
      }
      resgatar_cupom: {
        Args: { p_cupom_id: string; p_usuario_id: string }
        Returns: Json
      }
      validar_nota_fiscal: {
        Args: { p_nota_id: string; p_usuario_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "usuario" | "cooperativa" | "admin" | "empresa" | "investidor"
      nivel_selo: "Bronze" | "Prata" | "Ouro" | "Nenhum"
      nivel_usuario: "Iniciante" | "Ativo" | "Guardiao Verde"
      status_cooperativa: "pendente_aprovacao" | "aprovada" | "suspensa"
      status_cupom: "disponivel" | "reservado" | "usado"
      status_entrega: "gerada" | "recebida" | "validada" | "fechada"
      status_missao: "ativa" | "inativa"
      status_promessa_entrega:
        | "ativa"
        | "em_coleta"
        | "finalizada"
        | "expirada"
        | "cancelada"
      status_validacao: "pendente" | "validada" | "reprovada"
      tipo_embalagem_enum:
        | "vidro"
        | "plastico"
        | "papel"
        | "papelao"
        | "aluminio"
        | "laminado"
        | "misto"
      tipo_empresa:
        | "Industria"
        | "Comercio_Online"
        | "Comercio_Fisico"
        | "Servico"
      tipo_missao: "estudo" | "quiz" | "nota_fiscal" | "entrega_reciclaveis"
      tipo_operador_logistico:
        | "cooperativa"
        | "rota_ciclik"
        | "operador_parceiro"
      tipo_pessoa: "PF" | "PJ"
      tipo_pj_enum:
        | "Condominio"
        | "Restaurante"
        | "Comercio"
        | "Servico"
        | "Industria"
        | "Outro"
      tipo_submaterial:
        | "PET"
        | "PP"
        | "PEAD"
        | "PEBD"
        | "PVC"
        | "PS"
        | "OUTROS_PLASTICOS"
        | "VIDRO_TRANSPARENTE"
        | "VIDRO_COLORIDO"
        | "VIDRO_TEMPERADO"
        | "PAPEL_BRANCO"
        | "PAPEL_COLORIDO"
        | "PAPELAO_ONDULADO"
        | "ALUMINIO_LATA"
        | "ALUMINIO_PERFIL"
        | "ACO"
        | "LAMINADO_CAFE"
        | "LAMINADO_SALGADINHO"
        | "LAMINADO_OUTROS"
        | "REJEITO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["usuario", "cooperativa", "admin", "empresa", "investidor"],
      nivel_selo: ["Bronze", "Prata", "Ouro", "Nenhum"],
      nivel_usuario: ["Iniciante", "Ativo", "Guardiao Verde"],
      status_cooperativa: ["pendente_aprovacao", "aprovada", "suspensa"],
      status_cupom: ["disponivel", "reservado", "usado"],
      status_entrega: ["gerada", "recebida", "validada", "fechada"],
      status_missao: ["ativa", "inativa"],
      status_promessa_entrega: [
        "ativa",
        "em_coleta",
        "finalizada",
        "expirada",
        "cancelada",
      ],
      status_validacao: ["pendente", "validada", "reprovada"],
      tipo_embalagem_enum: [
        "vidro",
        "plastico",
        "papel",
        "papelao",
        "aluminio",
        "laminado",
        "misto",
      ],
      tipo_empresa: [
        "Industria",
        "Comercio_Online",
        "Comercio_Fisico",
        "Servico",
      ],
      tipo_missao: ["estudo", "quiz", "nota_fiscal", "entrega_reciclaveis"],
      tipo_operador_logistico: [
        "cooperativa",
        "rota_ciclik",
        "operador_parceiro",
      ],
      tipo_pessoa: ["PF", "PJ"],
      tipo_pj_enum: [
        "Condominio",
        "Restaurante",
        "Comercio",
        "Servico",
        "Industria",
        "Outro",
      ],
      tipo_submaterial: [
        "PET",
        "PP",
        "PEAD",
        "PEBD",
        "PVC",
        "PS",
        "OUTROS_PLASTICOS",
        "VIDRO_TRANSPARENTE",
        "VIDRO_COLORIDO",
        "VIDRO_TEMPERADO",
        "PAPEL_BRANCO",
        "PAPEL_COLORIDO",
        "PAPELAO_ONDULADO",
        "ALUMINIO_LATA",
        "ALUMINIO_PERFIL",
        "ACO",
        "LAMINADO_CAFE",
        "LAMINADO_SALGADINHO",
        "LAMINADO_OUTROS",
        "REJEITO",
      ],
    },
  },
} as const
