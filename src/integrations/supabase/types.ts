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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aceites_termos: {
        Row: {
          aceito_em: string
          id: string
          ip_aceite: string | null
          termo_id: string
          tipo_termo: string
          user_agent: string | null
          user_id: string
          versao_aceita: string
        }
        Insert: {
          aceito_em?: string
          id?: string
          ip_aceite?: string | null
          termo_id: string
          tipo_termo: string
          user_agent?: string | null
          user_id: string
          versao_aceita: string
        }
        Update: {
          aceito_em?: string
          id?: string
          ip_aceite?: string | null
          termo_id?: string
          tipo_termo?: string
          user_agent?: string | null
          user_id?: string
          versao_aceita?: string
        }
        Relationships: [
          {
            foreignKeyName: "aceites_termos_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos_uso"
            referencedColumns: ["id"]
          },
        ]
      }
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
          data_cadastro: string | null
          email: string
          id: string
          id_user: string
          nome_responsavel: string
          razao_social: string
          status: string | null
          telefone: string | null
        }
        Insert: {
          cnpj: string
          data_cadastro?: string | null
          email: string
          id?: string
          id_user: string
          nome_responsavel: string
          razao_social: string
          status?: string | null
          telefone?: string | null
        }
        Update: {
          cnpj?: string
          data_cadastro?: string | null
          email?: string
          id?: string
          id_user?: string
          nome_responsavel?: string
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
          latitude: number | null
          logradouro: string | null
          longitude: number | null
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
          latitude?: number | null
          logradouro?: string | null
          longitude?: number | null
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
          latitude?: number | null
          logradouro?: string | null
          longitude?: number | null
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
          created_at: string | null
          data_envio: string | null
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
          created_at?: string | null
          data_envio?: string | null
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
          created_at?: string | null
          data_envio?: string | null
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
          data_envio_triagem: string | null
          data_geracao: string | null
          data_inicio_triagem: string | null
          data_recebimento: string | null
          data_validacao: string | null
          hash_qrcode: string | null
          id: string
          id_adesao_rota: string | null
          id_cooperativa: string
          id_rota: string | null
          id_usuario: string
          itens_vinculados: Json | null
          observacoes_triagem: string | null
          peso_estimado: number | null
          peso_rejeito_kg: number | null
          peso_validado: number | null
          qrcode_id: string
          qrcode_triagem: string | null
          status: Database["public"]["Enums"]["status_entrega"] | null
          status_promessa:
            | Database["public"]["Enums"]["status_promessa_entrega"]
            | null
          tipo_entrega: string | null
          tipo_material: string
        }
        Insert: {
          data_envio_triagem?: string | null
          data_geracao?: string | null
          data_inicio_triagem?: string | null
          data_recebimento?: string | null
          data_validacao?: string | null
          hash_qrcode?: string | null
          id?: string
          id_adesao_rota?: string | null
          id_cooperativa: string
          id_rota?: string | null
          id_usuario: string
          itens_vinculados?: Json | null
          observacoes_triagem?: string | null
          peso_estimado?: number | null
          peso_rejeito_kg?: number | null
          peso_validado?: number | null
          qrcode_id: string
          qrcode_triagem?: string | null
          status?: Database["public"]["Enums"]["status_entrega"] | null
          status_promessa?:
            | Database["public"]["Enums"]["status_promessa_entrega"]
            | null
          tipo_entrega?: string | null
          tipo_material: string
        }
        Update: {
          data_envio_triagem?: string | null
          data_geracao?: string | null
          data_inicio_triagem?: string | null
          data_recebimento?: string | null
          data_validacao?: string | null
          hash_qrcode?: string | null
          id?: string
          id_adesao_rota?: string | null
          id_cooperativa?: string
          id_rota?: string | null
          id_usuario?: string
          itens_vinculados?: Json | null
          observacoes_triagem?: string | null
          peso_estimado?: number | null
          peso_rejeito_kg?: number | null
          peso_validado?: number | null
          qrcode_id?: string
          qrcode_triagem?: string | null
          status?: Database["public"]["Enums"]["status_entrega"] | null
          status_promessa?:
            | Database["public"]["Enums"]["status_promessa_entrega"]
            | null
          tipo_entrega?: string | null
          tipo_material?: string
        }
        Relationships: [
          {
            foreignKeyName: "entregas_reciclaveis_id_adesao_rota_fkey"
            columns: ["id_adesao_rota"]
            isOneToOne: false
            referencedRelation: "usuarios_rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_reciclaveis_id_cooperativa_fkey"
            columns: ["id_cooperativa"]
            isOneToOne: false
            referencedRelation: "cooperativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_reciclaveis_id_rota_fkey"
            columns: ["id_rota"]
            isOneToOne: false
            referencedRelation: "rotas_coleta"
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
      interesses_funcionalidades: {
        Row: {
          cidade: string | null
          created_at: string
          estado: string | null
          funcionalidade: string
          id: string
          id_usuario: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          estado?: string | null
          funcionalidade: string
          id?: string
          id_usuario?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          estado?: string | null
          funcionalidade?: string
          id?: string
          id_usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interesses_funcionalidades_id_usuario_fkey"
            columns: ["id_usuario"]
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
      log_consultas_api: {
        Row: {
          admin_id: string
          ean_gtin: string
          erro_mensagem: string | null
          id: string
          produto_id: string | null
          resposta_api: Json | null
          sucesso: boolean
          tempo_resposta_ms: number | null
          timestamp: string | null
        }
        Insert: {
          admin_id: string
          ean_gtin: string
          erro_mensagem?: string | null
          id?: string
          produto_id?: string | null
          resposta_api?: Json | null
          sucesso: boolean
          tempo_resposta_ms?: number | null
          timestamp?: string | null
        }
        Update: {
          admin_id?: string
          ean_gtin?: string
          erro_mensagem?: string | null
          id?: string
          produto_id?: string | null
          resposta_api?: Json | null
          sucesso?: boolean
          tempo_resposta_ms?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_consultas_api_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_em_analise"
            referencedColumns: ["id"]
          },
        ]
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
      notification_preferences: {
        Row: {
          created_at: string | null
          enable_email: boolean | null
          enable_in_app: boolean | null
          enable_push: boolean | null
          id: string
          notify_achievements: boolean | null
          notify_new_coleta: boolean | null
          notify_new_message: boolean | null
          notify_status_change: boolean | null
          notify_system_updates: boolean | null
          push_subscription: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_email?: boolean | null
          enable_in_app?: boolean | null
          enable_push?: boolean | null
          id?: string
          notify_achievements?: boolean | null
          notify_new_coleta?: boolean | null
          notify_new_message?: boolean | null
          notify_status_change?: boolean | null
          notify_system_updates?: boolean | null
          push_subscription?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_email?: boolean | null
          enable_in_app?: boolean | null
          enable_push?: boolean | null
          id?: string
          notify_achievements?: boolean | null
          notify_new_coleta?: boolean | null
          notify_new_message?: boolean | null
          notify_status_change?: boolean | null
          notify_system_updates?: boolean | null
          push_subscription?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          icon: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          scheduled_for: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          scheduled_for?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          scheduled_for?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          categoria_api: string | null
          data_atualizacao: string | null
          data_cadastro: string | null
          descricao: string
          gtin: string
          id: string
          imagem_url: string | null
          marca: string | null
          ncm: string
          observacoes: string | null
          percentual_reciclabilidade: number | null
          peso_medio_gramas: number | null
          reciclavel: boolean
          tipo_embalagem: Database["public"]["Enums"]["tipo_embalagem_enum"]
        }
        Insert: {
          categoria_api?: string | null
          data_atualizacao?: string | null
          data_cadastro?: string | null
          descricao: string
          gtin: string
          id?: string
          imagem_url?: string | null
          marca?: string | null
          ncm: string
          observacoes?: string | null
          percentual_reciclabilidade?: number | null
          peso_medio_gramas?: number | null
          reciclavel?: boolean
          tipo_embalagem: Database["public"]["Enums"]["tipo_embalagem_enum"]
        }
        Update: {
          categoria_api?: string | null
          data_atualizacao?: string | null
          data_cadastro?: string | null
          descricao?: string
          gtin?: string
          id?: string
          imagem_url?: string | null
          marca?: string | null
          ncm?: string
          observacoes?: string | null
          percentual_reciclabilidade?: number | null
          peso_medio_gramas?: number | null
          reciclavel?: boolean
          tipo_embalagem?: Database["public"]["Enums"]["tipo_embalagem_enum"]
        }
        Relationships: []
      }
      produtos_em_analise: {
        Row: {
          consultado_em: string | null
          created_at: string
          dados_api: Json | null
          data_primeira_deteccao: string
          data_ultima_deteccao: string
          descricao: string
          ean_gtin: string
          id: string
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_produto_enum"]
          quantidade_ocorrencias: number
          status: Database["public"]["Enums"]["status_analise_enum"]
          updated_at: string
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          consultado_em?: string | null
          created_at?: string
          dados_api?: Json | null
          data_primeira_deteccao?: string
          data_ultima_deteccao?: string
          descricao: string
          ean_gtin: string
          id?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_produto_enum"]
          quantidade_ocorrencias?: number
          status?: Database["public"]["Enums"]["status_analise_enum"]
          updated_at?: string
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          consultado_em?: string | null
          created_at?: string
          dados_api?: Json | null
          data_primeira_deteccao?: string
          data_ultima_deteccao?: string
          descricao?: string
          ean_gtin?: string
          id?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_produto_enum"]
          quantidade_ocorrencias?: number
          status?: Database["public"]["Enums"]["status_analise_enum"]
          updated_at?: string
          usuario_id?: string | null
          usuario_nome?: string | null
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
          codigo_indicador: string | null
          complemento: string | null
          cpf: string | null
          created_at: string | null
          creditos_resgate: number | null
          cupons_resgatados: number | null
          data_cadastro: string | null
          email: string
          id: string
          indicado_por: string | null
          instagram_handle: string | null
          latitude: number | null
          linkedin_profile: string | null
          logradouro: string | null
          longitude: number | null
          missoes_concluidas: number | null
          nivel: Database["public"]["Enums"]["nivel_usuario"] | null
          nome: string
          nome_completo: string | null
          numero: string | null
          role: string
          score_verde: number | null
          telefone: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pj: Database["public"]["Enums"]["tipo_pj_enum"] | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bairro?: string | null
          cep?: string
          cidade?: string | null
          cnpj?: string | null
          codigo_indicacao?: string | null
          codigo_indicador?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          creditos_resgate?: number | null
          cupons_resgatados?: number | null
          data_cadastro?: string | null
          email: string
          id: string
          indicado_por?: string | null
          instagram_handle?: string | null
          latitude?: number | null
          linkedin_profile?: string | null
          logradouro?: string | null
          longitude?: number | null
          missoes_concluidas?: number | null
          nivel?: Database["public"]["Enums"]["nivel_usuario"] | null
          nome: string
          nome_completo?: string | null
          numero?: string | null
          role?: string
          score_verde?: number | null
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pj?: Database["public"]["Enums"]["tipo_pj_enum"] | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bairro?: string | null
          cep?: string
          cidade?: string | null
          cnpj?: string | null
          codigo_indicacao?: string | null
          codigo_indicador?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          creditos_resgate?: number | null
          cupons_resgatados?: number | null
          data_cadastro?: string | null
          email?: string
          id?: string
          indicado_por?: string | null
          instagram_handle?: string | null
          latitude?: number | null
          linkedin_profile?: string | null
          logradouro?: string | null
          longitude?: number | null
          missoes_concluidas?: number | null
          nivel?: Database["public"]["Enums"]["nivel_usuario"] | null
          nome?: string
          nome_completo?: string | null
          numero?: string | null
          role?: string
          score_verde?: number | null
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pj?: Database["public"]["Enums"]["tipo_pj_enum"] | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_indicado_por"
            columns: ["indicado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      rotas_areas_cobertura: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string
          complemento_endereco: string | null
          created_at: string | null
          id: string
          id_dia_coleta: string | null
          id_rota: string
          logradouro: string | null
          uf: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade: string
          complemento_endereco?: string | null
          created_at?: string | null
          id?: string
          id_dia_coleta?: string | null
          id_rota: string
          logradouro?: string | null
          uf: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string
          complemento_endereco?: string | null
          created_at?: string | null
          id?: string
          id_dia_coleta?: string | null
          id_rota?: string
          logradouro?: string | null
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotas_areas_cobertura_id_dia_coleta_fkey"
            columns: ["id_dia_coleta"]
            isOneToOne: false
            referencedRelation: "rotas_dias_coleta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotas_areas_cobertura_id_rota_fkey"
            columns: ["id_rota"]
            isOneToOne: false
            referencedRelation: "rotas_coleta"
            referencedColumns: ["id"]
          },
        ]
      }
      rotas_coleta: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          id_operador: string | null
          nome: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_operador?: string | null
          nome: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_operador?: string | null
          nome?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rotas_coleta_id_operador_fkey"
            columns: ["id_operador"]
            isOneToOne: false
            referencedRelation: "cooperativas"
            referencedColumns: ["id"]
          },
        ]
      }
      rotas_dias_coleta: {
        Row: {
          created_at: string | null
          dia_semana: number
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          id_rota: string
        }
        Insert: {
          created_at?: string | null
          dia_semana: number
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          id_rota: string
        }
        Update: {
          created_at?: string | null
          dia_semana?: number
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          id_rota?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotas_dias_coleta_id_rota_fkey"
            columns: ["id_rota"]
            isOneToOne: false
            referencedRelation: "rotas_coleta"
            referencedColumns: ["id"]
          },
        ]
      }
      saldo_parcial: {
        Row: {
          id: string
          saldo: number
          tipo: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          saldo?: number
          tipo: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          saldo?: number
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      termos_uso: {
        Row: {
          ativo: boolean
          atualizado_em: string
          conteudo_html: string | null
          criado_em: string
          criado_por: string | null
          id: string
          obrigatorio: boolean
          pdf_path: string
          pdf_url: string
          resumo: string | null
          roles_aplicaveis: string[] | null
          tipo: string
          titulo: string
          versao: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          conteudo_html?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          obrigatorio?: boolean
          pdf_path: string
          pdf_url: string
          resumo?: string | null
          roles_aplicaveis?: string[] | null
          tipo: string
          titulo: string
          versao: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          conteudo_html?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          obrigatorio?: boolean
          pdf_path?: string
          pdf_url?: string
          resumo?: string | null
          roles_aplicaveis?: string[] | null
          tipo?: string
          titulo?: string
          versao?: string
        }
        Relationships: []
      }
      triagem_alteracoes: {
        Row: {
          created_at: string | null
          data_alteracao: string | null
          id: string
          id_entrega: string
          id_material_coletado: string | null
          motivo: string | null
          peso_anterior: number | null
          peso_novo: number | null
          realizado_por: string | null
          tipo_alteracao: string
        }
        Insert: {
          created_at?: string | null
          data_alteracao?: string | null
          id?: string
          id_entrega: string
          id_material_coletado?: string | null
          motivo?: string | null
          peso_anterior?: number | null
          peso_novo?: number | null
          realizado_por?: string | null
          tipo_alteracao: string
        }
        Update: {
          created_at?: string | null
          data_alteracao?: string | null
          id?: string
          id_entrega?: string
          id_material_coletado?: string | null
          motivo?: string | null
          peso_anterior?: number | null
          peso_novo?: number | null
          realizado_por?: string | null
          tipo_alteracao?: string
        }
        Relationships: [
          {
            foreignKeyName: "triagem_alteracoes_id_entrega_fkey"
            columns: ["id_entrega"]
            isOneToOne: false
            referencedRelation: "entregas_reciclaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triagem_alteracoes_id_material_coletado_fkey"
            columns: ["id_material_coletado"]
            isOneToOne: false
            referencedRelation: "materiais_coletados_detalhado"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_logs: {
        Row: {
          created_at: string | null
          email: string | null
          error_detail: string | null
          error_message: string | null
          event_type: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          error_detail?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          error_detail?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
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
            foreignKeyName: "uib_id_cdv_novo_fkey"
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_rotas: {
        Row: {
          data_adesao: string | null
          endereco_coleta: string
          hash_qrcode: string
          id: string
          id_area: string | null
          id_rota: string
          id_usuario: string
          observacoes: string | null
          qrcode_adesao: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          data_adesao?: string | null
          endereco_coleta: string
          hash_qrcode: string
          id?: string
          id_area?: string | null
          id_rota: string
          id_usuario: string
          observacoes?: string | null
          qrcode_adesao: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          data_adesao?: string | null
          endereco_coleta?: string
          hash_qrcode?: string
          id?: string
          id_area?: string | null
          id_rota?: string
          id_usuario?: string
          observacoes?: string | null
          qrcode_adesao?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_rotas_id_area_fkey"
            columns: ["id_area"]
            isOneToOne: false
            referencedRelation: "rotas_areas_cobertura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_rotas_id_rota_fkey"
            columns: ["id_rota"]
            isOneToOne: false
            referencedRelation: "rotas_coleta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_rotas_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      buscar_termos_pendentes: {
        Args: { p_user_id: string }
        Returns: {
          conteudo_html: string
          id: string
          obrigatorio: boolean
          pdf_url: string
          resumo: string
          tipo: string
          titulo: string
          versao: string
        }[]
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
      calcular_uib_educacao_mes_atual: {
        Args: { p_usuario_id: string }
        Returns: number
      }
      cleanup_old_notifications: { Args: never; Returns: undefined }
      conceder_pontos_missao: {
        Args: { p_missao_id: string; p_usuario_id: string }
        Returns: Json
      }
      confirmar_email_usuario: {
        Args: { usuario_id: string }
        Returns: undefined
      }
      contar_consultas_hoje: { Args: never; Returns: number }
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_icon?: string
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      create_user_profile_and_role: {
        Args: {
          p_bairro: string
          p_cep: string
          p_cidade: string
          p_cnpj: string
          p_codigo_indicador: string
          p_complemento: string
          p_cpf: string
          p_email: string
          p_logradouro: string
          p_nome: string
          p_numero: string
          p_telefone: string
          p_tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          p_tipo_pj: Database["public"]["Enums"]["tipo_pj_enum"]
          p_uf: string
          p_user_id: string
        }
        Returns: Json
      }
      criar_usuario_completo: {
        Args: {
          bairro: string
          cep: string
          cidade: string
          cnpj?: string
          codigo_indicador?: string
          complemento?: string
          cpf?: string
          email: string
          logradouro: string
          nome: string
          numero: string
          password: string
          telefone: string
          tipo_pessoa: string
          tipo_pj?: string
          uf: string
        }
        Returns: Json
      }
      distribuir_datas_maturacao_quotas: {
        Args: { p_id_projeto: string }
        Returns: number
      }
      estatisticas_aceites_termo: {
        Args: { p_termo_id: string }
        Returns: {
          pendentes: number
          percentual_aceites: number
          total_aceites: number
          total_usuarios: number
        }[]
      }
      expirar_promessas_antigas: { Args: never; Returns: undefined }
      gerar_codigo_indicacao: { Args: never; Returns: string }
      gerar_numero_cdv: { Args: never; Returns: string }
      gerar_qrcode_adesao_rota: { Args: never; Returns: string }
      gerar_url_assinada_termo: {
        Args: { p_expires_in?: number; p_path: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      listar_arquivos_termos: {
        Args: never
        Returns: {
          created_at: string
          last_accessed_at: string
          name: string
          size: number
          updated_at: string
        }[]
      }
      marcar_cupons_expirados: { Args: never; Returns: undefined }
      mark_all_notifications_as_read: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      mark_notification_as_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      processar_indicacao_assincrona: {
        Args: { p_codigo_indicacao: string; p_user_id: string }
        Returns: Json
      }
      processar_pontuacao_retroativa_produto_manual: {
        Args: {
          p_produto: Database["public"]["Tables"]["produtos_ciclik"]["Row"]
        }
        Returns: undefined
      }
      reenviar_email_confirmacao_admin: {
        Args: { usuario_email: string }
        Returns: Json
      }
      register_user_complete: {
        Args: {
          p_bairro: string
          p_cep: string
          p_cidade: string
          p_cnpj?: string
          p_codigo_indicador?: string
          p_complemento?: string
          p_cpf?: string
          p_email: string
          p_logradouro: string
          p_nome: string
          p_numero: string
          p_password: string
          p_telefone: string
          p_tipo_pessoa: string
          p_tipo_pj?: string
          p_uf: string
        }
        Returns: Json
      }
      registrar_indicacao: {
        Args: { p_codigo_indicacao: string; p_usuario_novo_id: string }
        Returns: Json
      }
      registrar_produto_em_analise: {
        Args: {
          p_descricao: string
          p_ean_gtin: string
          p_origem?: string
          p_usuario_id?: string
          p_usuario_nome?: string
        }
        Returns: string
      }
      registrar_usuario_completo: {
        Args: {
          p_bairro?: string
          p_cep?: string
          p_cidade?: string
          p_cnpj?: string
          p_codigo_indicador?: string
          p_complemento?: string
          p_cpf?: string
          p_email: string
          p_logradouro?: string
          p_nome: string
          p_numero?: string
          p_telefone: string
          p_tipo_pessoa: string
          p_tipo_pj?: string
          p_uf?: string
          p_user_id: string
        }
        Returns: Json
      }
      reprocessar_produto_existente: {
        Args: { p_gtin: string }
        Returns: string
      }
      resgatar_cupom: {
        Args: { p_cupom_id: string; p_usuario_id: string }
        Returns: Json
      }
      tem_termos_pendentes: { Args: { p_user_id: string }; Returns: boolean }
      validar_nota_fiscal: {
        Args: { p_nota_id: string; p_usuario_id: string }
        Returns: Json
      }
      validar_path_termo: { Args: { p_path: string }; Returns: boolean }
      verificar_status_email: { Args: { usuario_email: string }; Returns: Json }
      verificar_status_email_frontend: {
        Args: { usuario_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "usuario"
        | "cooperativa"
        | "empresa"
        | "cdv_investidor"
        | "vendedor"
        | "investidor"
      nivel_selo: "Nenhum" | "Bronze" | "Prata" | "Ouro" | "Diamante"
      nivel_usuario: "Iniciante" | "Ativo" | "Guardiao Verde"
      origem_produto_enum: "qrcode" | "manual"
      status_analise_enum:
        | "pendente"
        | "em_analise"
        | "aprovado"
        | "rejeitado"
        | "acao_manual"
        | "consultado"
      status_cooperativa:
        | "pendente_aprovacao"
        | "aprovada"
        | "suspensa"
        | "inativa"
      status_cupom: "disponivel" | "resgatado" | "usado" | "expirado"
      status_entrega:
        | "gerada"
        | "recebida"
        | "em_coleta"
        | "validada"
        | "expirada"
        | "finalizada"
      status_missao: "ativa" | "inativa" | "rascunho"
      status_promessa_entrega:
        | "ativa"
        | "cumprida"
        | "expirada"
        | "finalizada"
        | "em_coleta"
        | "em_triagem"
      status_validacao: "pendente" | "validada" | "rejeitada"
      tipo_embalagem_enum:
        | "plastico"
        | "papel"
        | "vidro"
        | "metal"
        | "tetrapack"
        | "misto"
        | "outros"
      tipo_empresa: "fabricante" | "varejista" | "distribuidora"
      tipo_missao: "video" | "quiz" | "estudo"
      tipo_operador_logistico:
        | "cooperativa"
        | "rota_ciclik"
        | "operador_parceiro"
      tipo_pessoa: "PF" | "PJ"
      tipo_pj_enum:
        | "empresa"
        | "cooperativa"
        | "cdv_investidor"
        | "Condominio"
        | "Restaurante"
        | "Comercio"
        | "Servico"
        | "Industria"
        | "Outro"
      tipo_submaterial:
        | "PET"
        | "PEAD"
        | "PVC"
        | "PEBD"
        | "PP"
        | "PS"
        | "OUTROS_PLASTICOS"
        | "PAPELAO"
        | "PAPEL_BRANCO"
        | "PAPEL_MISTO"
        | "JORNAL"
        | "REVISTA"
        | "VIDRO_INCOLOR"
        | "VIDRO_VERDE"
        | "VIDRO_AMBAR"
        | "ALUMINIO"
        | "ACO"
        | "COBRE"
        | "OUTROS_METAIS"
        | "TETRAPACK"
        | "REJEITO"
        | "PAPELAO_ONDULADO"
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
      app_role: [
        "admin",
        "usuario",
        "cooperativa",
        "empresa",
        "cdv_investidor",
        "vendedor",
        "investidor",
      ],
      nivel_selo: ["Nenhum", "Bronze", "Prata", "Ouro", "Diamante"],
      nivel_usuario: ["Iniciante", "Ativo", "Guardiao Verde"],
      origem_produto_enum: ["qrcode", "manual"],
      status_analise_enum: [
        "pendente",
        "em_analise",
        "aprovado",
        "rejeitado",
        "acao_manual",
        "consultado",
      ],
      status_cooperativa: [
        "pendente_aprovacao",
        "aprovada",
        "suspensa",
        "inativa",
      ],
      status_cupom: ["disponivel", "resgatado", "usado", "expirado"],
      status_entrega: [
        "gerada",
        "recebida",
        "em_coleta",
        "validada",
        "expirada",
        "finalizada",
      ],
      status_missao: ["ativa", "inativa", "rascunho"],
      status_promessa_entrega: [
        "ativa",
        "cumprida",
        "expirada",
        "finalizada",
        "em_coleta",
        "em_triagem",
      ],
      status_validacao: ["pendente", "validada", "rejeitada"],
      tipo_embalagem_enum: [
        "plastico",
        "papel",
        "vidro",
        "metal",
        "tetrapack",
        "misto",
        "outros",
      ],
      tipo_empresa: ["fabricante", "varejista", "distribuidora"],
      tipo_missao: ["video", "quiz", "estudo"],
      tipo_operador_logistico: [
        "cooperativa",
        "rota_ciclik",
        "operador_parceiro",
      ],
      tipo_pessoa: ["PF", "PJ"],
      tipo_pj_enum: [
        "empresa",
        "cooperativa",
        "cdv_investidor",
        "Condominio",
        "Restaurante",
        "Comercio",
        "Servico",
        "Industria",
        "Outro",
      ],
      tipo_submaterial: [
        "PET",
        "PEAD",
        "PVC",
        "PEBD",
        "PP",
        "PS",
        "OUTROS_PLASTICOS",
        "PAPELAO",
        "PAPEL_BRANCO",
        "PAPEL_MISTO",
        "JORNAL",
        "REVISTA",
        "VIDRO_INCOLOR",
        "VIDRO_VERDE",
        "VIDRO_AMBAR",
        "ALUMINIO",
        "ACO",
        "COBRE",
        "OUTROS_METAIS",
        "TETRAPACK",
        "REJEITO",
        "PAPELAO_ONDULADO",
      ],
    },
  },
} as const
