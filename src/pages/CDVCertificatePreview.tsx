import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  ArrowLeft,
  Leaf,
  GraduationCap,
  Package,
  CheckCircle,
  Calendar,
  Shield,
  CloudOff,
  TreeDeciduous,
  Zap,
  Droplets,
  Users,
  TrendingUp,
  Globe,
  Building2,
  FileCheck
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAssetPath } from '@/utils/assetPath';

// Ícones oficiais das ODS da ONU
import ods08 from "@/assets/ods/ods-08.jpg";
import ods09 from "@/assets/ods/ods-09.jpg";
import ods10 from "@/assets/ods/ods-10.jpg";
import ods11 from "@/assets/ods/ods-11.jpg";
import ods12 from "@/assets/ods/ods-12.jpg";
import ods13 from "@/assets/ods/ods-13.jpg";

/**
 * PREVIEW DO CERTIFICADO DIGITAL VERDE (CDV)
 * 
 * Este componente é um preview estático do modelo de certificado para investidores.
 * Usado para testar e melhorar o layout visual antes da implementação final.
 * 
 * Estrutura:
 * - Header com marca Ciclik
 * - Identificação da empresa investidora
 * - Métricas de impacto ambiental
 * - Equivalências ambientais
 * - Contribuições ODS da ONU
 * - QR Code para validação
 */

const CDVCertificatePreview = () => {
  const navigate = useNavigate();
  const [version, setVersion] = useState<'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6'>('v1');

  // Dados mockados para preview
  const mockData = {
    numero_quota: "CIC-0001",
    razao_social: "Empresa Exemplo Ltda",
    cnpj: "12.345.678/0001-90",
    nome_responsavel: "João Silva",
    projeto_titulo: "Ciclik Digital Verde",
    kg_reciclados: 512,
    horas_educacao: 25,
    embalagens_mapeadas: 128,
    data_geracao: new Date(),
    data_compra: new Date(2025, 0, 1),
    data_maturacao: new Date(2026, 0, 1),
  };

  // Cálculos de impactos ambientais equivalentes
  const co2Evitado = (mockData.kg_reciclados * 2.5).toFixed(0);
  const arvoresPreservadas = Math.ceil(mockData.kg_reciclados / 200);
  const energiaEconomizada = (mockData.kg_reciclados * 4.5).toFixed(0);
  const aguaEconomizada = (mockData.kg_reciclados * 90).toFixed(0);
  const pessoasImpactadas = Math.ceil((mockData.kg_reciclados / 3) + (mockData.horas_educacao * 10));

  const renderVersion1 = () => (
    <Card className="border-0 overflow-hidden shadow-2xl max-w-4xl mx-auto">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        
        <div className="relative z-10 px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-display font-bold tracking-wide">ciclik</span>
                <p className="text-xs opacity-90">Recicle e Ganhe</p>
              </div>
            </div>
            
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Certificado Oficial
            </Badge>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold mb-2 tracking-tight">
              Certificado Digital Verde
            </h1>
            <p className="text-lg opacity-90 font-body">
              Impacto Ambiental Verificável e Auditado
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-8 space-y-8">
        {/* Identificação Premium */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-2 rounded-full">
            <Award className="w-5 h-5" />
            <span className="font-display font-bold text-lg">#{mockData.numero_quota}</span>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold text-foreground">
              {mockData.razao_social}
            </h2>
            <p className="text-muted-foreground font-body">
              CNPJ: {mockData.cnpj}
            </p>
          </div>

          {/* Selo de Certificação */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500/20 rounded-full px-6 py-3 shadow-sm">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-display font-bold text-green-700">Certificado Válido</p>
              <p className="text-xs text-green-600">Impacto verificado e auditado</p>
            </div>
          </div>
        </div>

        {/* Impactos Principais - Cards Destacados */}
        <div>
          <h3 className="text-xl font-display font-bold text-center mb-6 text-foreground">
            Impactos Ambientais Certificados
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-display font-bold text-primary mb-2">
                {mockData.kg_reciclados.toLocaleString('pt-BR')} kg
              </p>
              <p className="text-sm text-muted-foreground font-body font-semibold">
                Resíduos Reciclados
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-100/50 via-blue-50 to-blue-100/30 border-2 border-blue-300/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-display font-bold text-blue-700 mb-2">
                {mockData.horas_educacao} horas
              </p>
              <p className="text-sm text-muted-foreground font-body font-semibold">
                Educação Ambiental
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-100/50 via-amber-50 to-amber-100/30 border-2 border-amber-300/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-display font-bold text-amber-700 mb-2">
                {mockData.embalagens_mapeadas.toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground font-body font-semibold">
                Embalagens Mapeadas
              </p>
            </div>
          </div>
        </div>

        {/* Equivalências Ambientais */}
        <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-2xl p-6 border">
          <h3 className="text-lg font-display font-bold text-center mb-4 text-foreground">
            Equivalência de Impacto Ambiental
          </h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white border border-blue-200 rounded-xl p-4 text-center shadow-sm">
              <CloudOff className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-blue-700">{Number(co2Evitado).toLocaleString('pt-BR')}</p>
              <p className="text-xs text-blue-600 font-body mt-1">kg de CO₂<br/>evitados</p>
            </div>
            
            <div className="bg-white border border-green-200 rounded-xl p-4 text-center shadow-sm">
              <TreeDeciduous className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-green-700">{arvoresPreservadas}</p>
              <p className="text-xs text-green-600 font-body mt-1">árvores<br/>preservadas</p>
            </div>
            
            <div className="bg-white border border-yellow-200 rounded-xl p-4 text-center shadow-sm">
              <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-yellow-700">{Number(energiaEconomizada).toLocaleString('pt-BR')}</p>
              <p className="text-xs text-yellow-600 font-body mt-1">kWh de<br/>energia</p>
            </div>
            
            <div className="bg-white border border-cyan-200 rounded-xl p-4 text-center shadow-sm">
              <Droplets className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-cyan-700">{Number(aguaEconomizada).toLocaleString('pt-BR')}</p>
              <p className="text-xs text-cyan-600 font-body mt-1">litros de<br/>água</p>
            </div>
            
            <div className="bg-white border border-purple-200 rounded-xl p-4 text-center shadow-sm">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-purple-700">{pessoasImpactadas}</p>
              <p className="text-xs text-purple-600 font-body mt-1">pessoas<br/>impactadas</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground font-body bg-white/50 rounded-lg py-3 px-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>
              Estimativa de <strong className="text-foreground">{pessoasImpactadas} cidadãos</strong> em processo de mudança de comportamento ambiental
            </span>
          </div>
        </div>

        {/* ODS da ONU */}
        <div className="border-t pt-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-display font-bold text-foreground">
                Objetivos de Desenvolvimento Sustentável
              </h3>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Contribuição direta para as ODS da ONU - Agenda 2030
            </p>
          </div>
          
          <div className="flex justify-center gap-3 flex-wrap">
            <img src={ods08} alt="ODS 8" className="w-20 h-20 rounded-lg shadow-md hover:scale-110 transition-transform" />
            <img src={ods09} alt="ODS 9" className="w-20 h-20 rounded-lg shadow-md hover:scale-110 transition-transform" />
            <img src={ods10} alt="ODS 10" className="w-20 h-20 rounded-lg shadow-md hover:scale-110 transition-transform" />
            <img src={ods11} alt="ODS 11" className="w-20 h-20 rounded-lg shadow-md hover:scale-110 transition-transform" />
            <img src={ods12} alt="ODS 12" className="w-20 h-20 rounded-lg shadow-md hover:scale-110 transition-transform" />
            <img src={ods13} alt="ODS 13" className="w-20 h-20 rounded-lg shadow-md hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Informações do Certificado */}
        <div className="grid md:grid-cols-2 gap-6 border-t pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground font-body">Projeto</p>
                <p className="font-display font-semibold">{mockData.projeto_titulo}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground font-body">Período de Maturação</p>
                <p className="font-display font-semibold">
                  {format(mockData.data_compra, "dd/MM/yyyy", { locale: ptBR })} - {format(mockData.data_maturacao, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border">
              <FileCheck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground font-body">Data de Emissão</p>
                <p className="font-display font-semibold">
                  {format(mockData.data_geracao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20 p-6">
            <div className="w-48 h-48 bg-white rounded-xl shadow-lg flex items-center justify-center mb-4 border-2 border-primary/20">
              <div className="w-44 h-44 bg-white p-2">
                <div className="grid grid-cols-8 gap-0.5 w-full h-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-white'} rounded-sm`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground font-body">
              Escaneie para validar a autenticidade<br />
              deste certificado em tempo real
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
            <div className="flex items-center gap-2">
              <img src={getAssetPath('ciclik-logo.png')} alt="Ciclik" className="h-6 opacity-60" />
              <span>Certificado de Impacto Ambiental Verificável</span>
            </div>
            <span className="font-mono">ID: {mockData.numero_quota}</span>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Este certificado comprova o investimento e geração de impacto ambiental real, mensurável e auditado.
            <br />
            Válido permanentemente • Validação pública disponível em <strong>ciclik.com.br</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderVersion2 = () => (
    <Card className="border-0 overflow-hidden shadow-2xl max-w-4xl mx-auto bg-white">
      {/* Header Minimalista */}
      <div className="bg-white border-b-4 border-primary">
        <div className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-display font-bold text-primary">ciclik</span>
              <Leaf className="w-6 h-6 text-ciclik-orange" />
            </div>
            <Badge variant="outline" className="border-primary text-primary px-4 py-2">
              Certificado #CIC-0001
            </Badge>
          </div>
          
          <div className="text-center">
            <h1 className="text-5xl font-display font-bold mb-3 text-foreground">
              Certificado Digital Verde
            </h1>
            <p className="text-lg text-muted-foreground font-body">
              Comprova Impacto Ambiental Real e Mensurável
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-8 space-y-8">
        {/* Empresa */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground font-body uppercase tracking-wider">Certificado emitido para</p>
          <h2 className="text-4xl font-display font-bold text-foreground">{mockData.razao_social}</h2>
          <p className="text-muted-foreground font-body">CNPJ: {mockData.cnpj}</p>
        </div>

        {/* Resumo de Impactos - Layout Horizontal */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <Leaf className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-5xl font-display font-bold text-primary mb-2">{mockData.kg_reciclados}</p>
              <p className="text-sm text-muted-foreground font-body">kg reciclados</p>
            </div>
            <div>
              <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-5xl font-display font-bold text-blue-600 mb-2">{mockData.horas_educacao}</p>
              <p className="text-sm text-muted-foreground font-body">horas de educação</p>
            </div>
            <div>
              <Package className="w-12 h-12 text-amber-600 mx-auto mb-3" />
              <p className="text-5xl font-display font-bold text-amber-600 mb-2">{mockData.embalagens_mapeadas}</p>
              <p className="text-sm text-muted-foreground font-body">embalagens mapeadas</p>
            </div>
          </div>
        </div>

        {/* Equivalências - Versão Compacta */}
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <CloudOff className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-xl font-display font-bold text-blue-700">{co2Evitado}</p>
            <p className="text-xs text-blue-600">kg CO₂</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <TreeDeciduous className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-display font-bold text-green-700">{arvoresPreservadas}</p>
            <p className="text-xs text-green-600">árvores</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-xl font-display font-bold text-yellow-700">{energiaEconomizada}</p>
            <p className="text-xs text-yellow-600">kWh</p>
          </div>
          <div className="text-center p-4 bg-cyan-50 rounded-xl">
            <Droplets className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
            <p className="text-xl font-display font-bold text-cyan-700">{aguaEconomizada}</p>
            <p className="text-xs text-cyan-600">litros</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-display font-bold text-purple-700">{pessoasImpactadas}</p>
            <p className="text-xs text-purple-600">pessoas</p>
          </div>
        </div>

        {/* ODS */}
        <div className="text-center">
          <h3 className="text-sm font-display font-bold mb-4 text-muted-foreground uppercase tracking-wider">
            Contribuição ODS da ONU
          </h3>
          <div className="flex justify-center gap-2">
            {[ods08, ods09, ods10, ods11, ods12, ods13].map((ods, i) => (
              <img key={i} src={ods} alt={`ODS ${i+8}`} className="w-16 h-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Rodapé Minimalista */}
        <div className="border-t pt-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-body">Emitido em</p>
            <p className="font-display font-semibold">{format(mockData.data_geracao, "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
          <div className="w-32 h-32 bg-white rounded-xl border-2 border-muted p-2 flex items-center justify-center">
            <div className="grid grid-cols-8 gap-0.5 w-full h-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-white'} rounded-sm`} />
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-body">Válido permanentemente</p>
            <p className="font-display font-semibold">ciclik.com.br</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVersion3 = () => (
    <Card className="border-0 overflow-hidden shadow-2xl max-w-4xl mx-auto bg-gradient-to-br from-white via-primary/5 to-white">
      {/* Header Elegante */}
      <div className="relative bg-gradient-to-r from-primary/95 via-primary to-primary/90 text-white overflow-hidden">
        {/* Pattern de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10 px-8 py-12">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Leaf className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-3xl font-display font-bold">ciclik</span>
                  <p className="text-sm opacity-90">Digital Verde</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-white text-primary border-0 px-4 py-2 mb-2">
                #{mockData.numero_quota}
              </Badge>
              <p className="text-xs opacity-75">Certificado Oficial</p>
            </div>
          </div>
          
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-block p-1 bg-white/20 rounded-full backdrop-blur-sm mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-display font-bold mb-3">
              Certificado Digital Verde
            </h1>
            <p className="text-lg opacity-95">
              Comprova impacto ambiental real, mensurável e auditado
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-10 space-y-10">
        {/* Identificação Elegante */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground font-body mb-3 uppercase tracking-widest">
            Certificado emitido para
          </p>
          <h2 className="text-4xl font-display font-bold text-foreground mb-2">
            {mockData.razao_social}
          </h2>
          <p className="text-lg text-muted-foreground font-body">
            CNPJ: {mockData.cnpj}
          </p>
        </div>

        {/* Impactos - Grid Premium */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-white border-2 border-primary/20 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <p className="text-5xl font-display font-bold text-primary mb-3">
                {mockData.kg_reciclados}
              </p>
              <p className="text-sm text-muted-foreground font-body uppercase tracking-wider">
                kg de resíduos reciclados
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-white border-2 border-blue-200 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <p className="text-5xl font-display font-bold text-blue-600 mb-3">
                {mockData.horas_educacao}
              </p>
              <p className="text-sm text-muted-foreground font-body uppercase tracking-wider">
                horas de educação ambiental
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-white border-2 border-amber-200 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Package className="w-10 h-10 text-white" />
              </div>
              <p className="text-5xl font-display font-bold text-amber-600 mb-3">
                {mockData.embalagens_mapeadas}
              </p>
              <p className="text-sm text-muted-foreground font-body uppercase tracking-wider">
                embalagens rastreadas
              </p>
            </div>
          </div>
        </div>

        {/* Equivalências Ambientais - Design Premium */}
        <div className="bg-gradient-to-br from-muted/50 to-background rounded-3xl p-8 border-2 border-border/50">
          <h3 className="text-2xl font-display font-bold text-center mb-8 text-foreground">
            Equivalência de Impacto Ambiental
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { icon: CloudOff, value: co2Evitado, label: "kg CO₂", color: "blue" },
              { icon: TreeDeciduous, value: arvoresPreservadas, label: "árvores", color: "green" },
              { icon: Zap, value: energiaEconomizada, label: "kWh", color: "yellow" },
              { icon: Droplets, value: aguaEconomizada, label: "litros", color: "cyan" },
              { icon: Users, value: pessoasImpactadas, label: "pessoas", color: "purple" },
            ].map((item, i) => (
              <div key={i} className={`bg-${item.color}-50 border-2 border-${item.color}-200 rounded-2xl p-6 text-center hover:scale-105 transition-transform`}>
                <item.icon className={`w-10 h-10 text-${item.color}-600 mx-auto mb-3`} />
                <p className={`text-3xl font-display font-bold text-${item.color}-700 mb-2`}>
                  {typeof item.value === 'string' ? Number(item.value).toLocaleString('pt-BR') : item.value}
                </p>
                <p className={`text-xs text-${item.color}-600 font-body`}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ODS */}
        <div className="text-center space-y-6">
          <div>
            <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold mb-2 text-foreground">
              Objetivos de Desenvolvimento Sustentável
            </h3>
            <p className="text-muted-foreground font-body">
              Contribuição verificada para a Agenda 2030 da ONU
            </p>
          </div>
          <div className="flex justify-center gap-4">
            {[ods08, ods09, ods10, ods11, ods12, ods13].map((ods, i) => (
              <div key={i} className="relative group">
                <div className="absolute inset-0 bg-primary rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity" />
                <img src={ods} alt={`ODS ${i+8}`} className="relative w-24 h-24 rounded-xl shadow-lg hover:scale-110 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 pt-8">
          <div className="text-left">
            <p className="text-sm text-muted-foreground font-body mb-1">Emitido em</p>
            <p className="text-xl font-display font-bold">{format(mockData.data_geracao, "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
          <div className="text-center">
            <div className="w-40 h-40 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center border-2 border-primary/20 p-3">
              <div className="grid grid-cols-8 gap-0.5 w-full h-full">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-white'} rounded-sm`} />
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-body mb-1">Válido permanentemente</p>
            <p className="text-xl font-display font-bold text-primary">ciclik.com.br</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVersion4 = () => (
    <Card className="border-0 overflow-hidden shadow-2xl max-w-4xl mx-auto bg-white">
      {/* Header Corporativo */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <div className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={getAssetPath('logo-with-slogan.png')} alt="Ciclik" className="h-12 object-contain" />
            </div>
            <Badge className="bg-white/20 text-white border-0 px-4 py-2 backdrop-blur-sm">
              <Shield className="w-4 h-4 mr-2" />
              Certificado Oficial #{mockData.numero_quota}
            </Badge>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold mb-2">
              Certificado Digital Verde
            </h1>
            <p className="text-lg opacity-90">
              Comprovação de Impacto Ambiental Mensurável
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-8 space-y-6">
        {/* Identificação Corporativa */}
        <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30">
          <p className="text-sm text-muted-foreground font-body mb-2 uppercase tracking-wider">
            Certificado emitido para
          </p>
          <h2 className="text-3xl font-display font-bold text-foreground mb-1">
            {mockData.razao_social}
          </h2>
          <p className="text-muted-foreground font-body">
            CNPJ: {mockData.cnpj} • Responsável: {mockData.nome_responsavel}
          </p>
        </div>

        {/* Métricas em Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary/5">
              <tr>
                <th className="text-left p-4 font-display font-semibold">Categoria de Impacto</th>
                <th className="text-right p-4 font-display font-semibold">Valor Certificado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-4 flex items-center gap-3">
                  <Leaf className="w-5 h-5 text-primary" />
                  <span className="font-body">Resíduos Reciclados</span>
                </td>
                <td className="p-4 text-right font-display font-bold text-xl text-primary">
                  {mockData.kg_reciclados} kg
                </td>
              </tr>
              <tr className="border-t bg-muted/20">
                <td className="p-4 flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span className="font-body">Educação Ambiental</span>
                </td>
                <td className="p-4 text-right font-display font-bold text-xl text-blue-600">
                  {mockData.horas_educacao} horas
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-4 flex items-center gap-3">
                  <Package className="w-5 h-5 text-amber-600" />
                  <span className="font-body">Embalagens Rastreadas</span>
                </td>
                <td className="p-4 text-right font-display font-bold text-xl text-amber-600">
                  {mockData.embalagens_mapeadas} unidades
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Equivalências em Cards Compactos */}
        <div>
          <h3 className="text-sm font-display font-bold mb-3 text-muted-foreground uppercase tracking-wider">
            Equivalência de Impacto Ambiental
          </h3>
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-white border border-blue-200 rounded-lg p-3 text-center shadow-sm">
              <CloudOff className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-blue-700">{co2Evitado}</p>
              <p className="text-[10px] text-blue-600 uppercase">kg CO₂</p>
            </div>
            <div className="bg-white border border-green-200 rounded-lg p-3 text-center shadow-sm">
              <TreeDeciduous className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-green-700">{arvoresPreservadas}</p>
              <p className="text-[10px] text-green-600 uppercase">árvores</p>
            </div>
            <div className="bg-white border border-yellow-200 rounded-lg p-3 text-center shadow-sm">
              <Zap className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-yellow-700">{energiaEconomizada}</p>
              <p className="text-[10px] text-yellow-600 uppercase">kWh</p>
            </div>
            <div className="bg-white border border-cyan-200 rounded-lg p-3 text-center shadow-sm">
              <Droplets className="w-6 h-6 text-cyan-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-cyan-700">{aguaEconomizada}</p>
              <p className="text-[10px] text-cyan-600 uppercase">litros</p>
            </div>
            <div className="bg-white border border-purple-200 rounded-lg p-3 text-center shadow-sm">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-purple-700">{pessoasImpactadas}</p>
              <p className="text-[10px] text-purple-600 uppercase">pessoas</p>
            </div>
          </div>
        </div>

        {/* ODS Compacta */}
        <div className="border-t pt-6">
          <p className="text-xs text-muted-foreground font-body text-center mb-3 uppercase tracking-wider">
            Contribuição ODS da ONU - Agenda 2030
          </p>
          <div className="flex justify-center gap-2">
            {[ods08, ods09, ods10, ods11, ods12, ods13].map((ods, i) => (
              <img key={i} src={ods} alt={`ODS ${i+8}`} className="w-14 h-14 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Footer com QR Code */}
        <div className="grid grid-cols-3 gap-6 border-t pt-6 items-center">
          <div>
            <p className="text-xs text-muted-foreground font-body mb-1">Emitido em</p>
            <p className="font-display font-semibold">{format(mockData.data_geracao, "dd/MM/yyyy", { locale: ptBR })}</p>
            <p className="text-xs text-muted-foreground mt-2">Projeto</p>
            <p className="font-display font-semibold">{mockData.projeto_titulo}</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-slate-100 border-2 border-slate-300 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center mb-1">
                  <div className="grid grid-cols-5 gap-0.5 p-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground font-mono">Validar Online</p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-body mb-1">Válido permanentemente</p>
            <p className="font-display font-semibold text-primary">ciclik.com.br</p>
            <p className="text-xs text-muted-foreground mt-2">ID do Certificado</p>
            <p className="font-mono text-sm">{mockData.numero_quota}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVersion5 = () => (
    <Card className="border-0 overflow-hidden shadow-2xl max-w-4xl mx-auto">
      {/* Header Moderno - Diagonal Split */}
      <div className="relative h-48 bg-gradient-to-br from-primary via-primary/90 to-primary/70 overflow-hidden">
        {/* Forma diagonal */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/10" 
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 100%)' }} />
        
        <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm rotate-12">
                <Leaf className="w-7 h-7 text-white -rotate-12" />
              </div>
              <div>
                <span className="text-2xl font-display font-bold">ciclik</span>
                <p className="text-xs opacity-75">Impacto Verificado</p>
              </div>
            </div>
            <Badge className="bg-ciclik-orange text-white border-0 px-3 py-1.5 font-bold">
              #{mockData.numero_quota}
            </Badge>
          </div>
          
          <div>
            <h1 className="text-4xl font-display font-bold mb-1">
              Certificado Digital Verde
            </h1>
            <p className="text-sm opacity-90">
              Impacto Real • Mensurável • Auditado
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-8 space-y-8">
        {/* Identificação Moderna */}
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-ciclik-orange rounded-full" />
          <div className="pl-4">
            <p className="text-xs text-primary font-body mb-2 uppercase tracking-widest font-bold">
              Empresa Certificada
            </p>
            <h2 className="text-3xl font-display font-bold text-foreground mb-1">
              {mockData.razao_social}
            </h2>
            <p className="text-sm text-muted-foreground font-body">
              CNPJ: {mockData.cnpj}
            </p>
          </div>
        </div>

        {/* Métricas - Design Moderno com Fundo */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-2xl" />
          <div className="relative grid md:grid-cols-3 gap-6">
            <div className="group relative bg-white border-2 border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-body mb-2">Reciclagem</p>
              <p className="text-4xl font-display font-bold text-primary mb-1">
                {mockData.kg_reciclados}
              </p>
              <p className="text-xs text-muted-foreground font-body">quilogramas processados</p>
            </div>

            <div className="group relative bg-white border-2 border-blue-200 rounded-2xl p-6 hover:border-blue-400 transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground font-body mb-2">Educação</p>
              <p className="text-4xl font-display font-bold text-blue-600 mb-1">
                {mockData.horas_educacao}
              </p>
              <p className="text-xs text-muted-foreground font-body">horas de formação ambiental</p>
            </div>

            <div className="group relative bg-white border-2 border-amber-200 rounded-2xl p-6 hover:border-amber-400 transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-sm text-muted-foreground font-body mb-2">Rastreabilidade</p>
              <p className="text-4xl font-display font-bold text-amber-600 mb-1">
                {mockData.embalagens_mapeadas}
              </p>
              <p className="text-xs text-muted-foreground font-body">embalagens rastreadas</p>
            </div>
          </div>
        </div>

        {/* Equivalências - Design Moderno */}
        <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-3xl p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-bold text-foreground">
              Impacto Equivalente
            </h3>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { icon: CloudOff, value: co2Evitado, label: "kg CO₂\nevitados", color: "blue" },
              { icon: TreeDeciduous, value: arvoresPreservadas, label: "árvores\npreservadas", color: "green" },
              { icon: Zap, value: energiaEconomizada, label: "kWh de\nenergia", color: "yellow" },
              { icon: Droplets, value: aguaEconomizada, label: "litros de\nágua", color: "cyan" },
              { icon: Users, value: pessoasImpactadas, label: "pessoas\nimpactadas", color: "purple" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`w-14 h-14 bg-${item.color}-50 border-2 border-${item.color}-200 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                </div>
                <p className={`text-2xl font-display font-bold text-${item.color}-700 mb-1`}>
                  {typeof item.value === 'string' ? Number(item.value).toLocaleString('pt-BR') : item.value}
                </p>
                <p className={`text-[10px] text-${item.color}-600 leading-tight whitespace-pre-line`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ODS e Footer Integrados */}
        <div className="grid md:grid-cols-2 gap-8 border-t pt-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-foreground">
                Objetivos de Desenvolvimento Sustentável
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[ods08, ods09, ods10, ods11, ods12, ods13].map((ods, i) => (
                <img key={i} src={ods} alt={`ODS ${i+8}`} className="w-full rounded-lg shadow-md hover:scale-105 transition-transform" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Agenda 2030 • Investimento em transformação sustentável
            </p>
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Emitido em</p>
                  <p className="font-display font-semibold text-sm">{format(mockData.data_geracao, "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Projeto</p>
                  <p className="font-display font-semibold text-sm">{mockData.projeto_titulo}</p>
                </div>
              </div>
            </div>

            {/* QR Code Destacado */}
            <div className="mt-4 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                <div className="relative w-36 h-36 bg-white border-4 border-primary/30 rounded-2xl flex items-center justify-center shadow-xl">
                  <div className="text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mb-1">
                      <div className="grid grid-cols-6 gap-0.5 p-2">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-sm ${Math.random() > 0.5 ? 'bg-primary' : 'bg-white'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[9px] text-primary font-bold uppercase tracking-wide">Escaneie</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assinatura Final */}
        <div className="text-center border-t pt-4">
          <p className="text-xs text-muted-foreground font-body">
            Certificado válido permanentemente • Validação pública em <strong className="text-primary">ciclik.com.br</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderVersion6 = () => (
    <Card className="border-0 overflow-hidden shadow-2xl max-w-4xl mx-auto bg-white">
      {/* Header Diagonal Híbrido (da V5) */}
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-primary/90 text-white overflow-hidden">
        {/* Elemento diagonal */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-br from-primary to-primary/80 transform skew-x-12 origin-top-right" />
        </div>
        
        <div className="relative z-10 px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={getAssetPath('logo-with-slogan.png')} alt="Ciclik" className="h-12 object-contain" />
            </div>
            <Badge className="bg-white/20 text-white border-0 px-4 py-2 backdrop-blur-sm">
              <Shield className="w-4 h-4 mr-2" />
              Certificado #{mockData.numero_quota}
            </Badge>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold mb-2">
              Certificado Digital Verde
            </h1>
            <p className="text-lg opacity-90">
              Impacto Mensurável • Validado • Transformador
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-8 space-y-6">
        {/* Identificação Corporativa (da V4) */}
        <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
          <p className="text-sm text-muted-foreground font-body mb-2 uppercase tracking-wider">
            Certificado emitido para
          </p>
          <h2 className="text-3xl font-display font-bold text-foreground mb-1">
            {mockData.razao_social}
          </h2>
          <p className="text-muted-foreground font-body">
            CNPJ: {mockData.cnpj} • Responsável: {mockData.nome_responsavel}
          </p>
        </div>

        {/* Métricas em Tabela (da V4) */}
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-primary/10">
              <tr>
                <th className="text-left p-4 font-display font-semibold text-primary">Categoria de Impacto</th>
                <th className="text-right p-4 font-display font-semibold text-primary">Valor Certificado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-medium">Resíduos Reciclados</p>
                    <p className="text-xs text-muted-foreground font-body">Material desviado de aterros</p>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className="text-2xl font-display font-bold text-primary">{mockData.kg_reciclados} kg</span>
                </td>
              </tr>
              <tr className="border-t bg-muted/20 hover:bg-muted/40 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-medium">Educação Ambiental</p>
                    <p className="text-xs text-muted-foreground font-body">Horas de conscientização</p>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className="text-2xl font-display font-bold text-primary">{mockData.horas_educacao}h</span>
                </td>
              </tr>
              <tr className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-medium">Embalagens Mapeadas</p>
                    <p className="text-xs text-muted-foreground font-body">Rastreabilidade logística</p>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className="text-2xl font-display font-bold text-primary">{mockData.embalagens_mapeadas}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Equivalências em Cards Modernos (da V4 com estilo V5) */}
        <div>
          <h3 className="text-sm font-display font-bold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Equivalência de Impacto Ambiental
          </h3>
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-white border-2 border-blue-200 rounded-xl p-3 text-center shadow-md hover:shadow-lg hover:scale-105 transition-all">
              <CloudOff className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-blue-700">{co2Evitado}</p>
              <p className="text-[10px] text-blue-600 uppercase font-semibold">kg CO₂</p>
            </div>
            <div className="bg-white border-2 border-green-200 rounded-xl p-3 text-center shadow-md hover:shadow-lg hover:scale-105 transition-all">
              <TreeDeciduous className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-green-700">{arvoresPreservadas}</p>
              <p className="text-[10px] text-green-600 uppercase font-semibold">árvores</p>
            </div>
            <div className="bg-white border-2 border-yellow-200 rounded-xl p-3 text-center shadow-md hover:shadow-lg hover:scale-105 transition-all">
              <Zap className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-yellow-700">{energiaEconomizada}</p>
              <p className="text-[10px] text-yellow-600 uppercase font-semibold">kWh</p>
            </div>
            <div className="bg-white border-2 border-cyan-200 rounded-xl p-3 text-center shadow-md hover:shadow-lg hover:scale-105 transition-all">
              <Droplets className="w-6 h-6 text-cyan-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-cyan-700">{aguaEconomizada}</p>
              <p className="text-[10px] text-cyan-600 uppercase font-semibold">litros</p>
            </div>
            <div className="bg-white border-2 border-purple-200 rounded-xl p-3 text-center shadow-md hover:shadow-lg hover:scale-105 transition-all">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-purple-700">{pessoasImpactadas}</p>
              <p className="text-[10px] text-purple-600 uppercase font-semibold">pessoas</p>
            </div>
          </div>
        </div>

        {/* ODS com destaque */}
        <div className="border-t-2 border-primary/20 pt-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-display font-bold text-center text-foreground uppercase tracking-wider">
              Contribuição ODS da ONU - Agenda 2030
            </h3>
          </div>
          <div className="flex justify-center gap-3">
            {[ods08, ods09, ods10, ods11, ods12, ods13].map((ods, i) => (
              <div key={i} className="relative group">
                <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                <img src={ods} alt={`ODS ${i+8}`} className="relative w-16 h-16 rounded-xl shadow-md hover:scale-110 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Integrado Moderno (da V5) */}
        <div className="bg-gradient-to-r from-muted/50 to-primary/5 rounded-xl p-6 border border-primary/10">
          <div className="grid grid-cols-3 gap-6 items-center">
            <div>
              <p className="text-xs text-muted-foreground font-body mb-1 uppercase tracking-wide">Emitido em</p>
              <p className="font-display font-semibold text-lg mb-3">{format(mockData.data_geracao, "dd/MM/yyyy", { locale: ptBR })}</p>
              <p className="text-xs text-muted-foreground font-body mb-1 uppercase tracking-wide">Projeto</p>
              <p className="font-display font-medium">{mockData.projeto_titulo}</p>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-20" />
                <div className="relative w-32 h-32 bg-gradient-to-br from-white to-primary/5 rounded-2xl border-2 border-primary/30 p-3 shadow-lg">
                  <div className="grid grid-cols-6 gap-0.5 w-full h-full">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-white'} rounded-sm`} />
                    ))}
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider font-semibold">QR Code de Validação</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-body mb-1 uppercase tracking-wide">Período de Validade</p>
              <p className="font-display font-semibold mb-3">
                {format(mockData.data_compra, "MMM/yy", { locale: ptBR })} - {format(mockData.data_maturacao, "MMM/yy", { locale: ptBR })}
              </p>
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="font-display font-medium text-primary">Verificável em ciclik.com.br</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header de controle */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="font-display font-bold text-lg">Preview - Modelo de Certificado CDV</h1>
                <p className="text-xs text-muted-foreground">Teste e compare diferentes layouts</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={version === 'v1' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVersion('v1')}
              >
                V1
              </Button>
              <Button
                variant={version === 'v2' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVersion('v2')}
              >
                V2
              </Button>
              <Button
                variant={version === 'v3' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVersion('v3')}
              >
                V3
              </Button>
              <Button
                variant={version === 'v4' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVersion('v4')}
              >
                V4
              </Button>
              <Button
                variant={version === 'v5' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVersion('v5')}
              >
                V5
              </Button>
              <Button
                variant={version === 'v6' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVersion('v6')}
              >
                V6
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Área de preview */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6 text-center">
          <Badge variant="outline" className="mb-2">
            {version === 'v1' && 'V1: Premium - Layout Completo com QR Code'}
            {version === 'v2' && 'V2: Minimalista - Design Limpo com QR Code'}
            {version === 'v3' && 'V3: Elegante - Design Sofisticado com QR Code'}
            {version === 'v4' && 'V4: Corporativo - Layout Formal com QR Code'}
            {version === 'v5' && 'V5: Moderno - Design Impactante com QR Code'}
            {version === 'v6' && 'V6: Híbrido - Melhor de V4 + V5 com QR Code'}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Preview com dados mockados • QR Code incluído em todas as versões
          </p>
        </div>

        {version === 'v1' && renderVersion1()}
        {version === 'v2' && renderVersion2()}
        {version === 'v3' && renderVersion3()}
        {version === 'v4' && renderVersion4()}
        {version === 'v5' && renderVersion5()}
        {version === 'v6' && renderVersion6()}
      </div>
    </div>
  );
};

export default CDVCertificatePreview;
