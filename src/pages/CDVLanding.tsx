import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Leaf, Users, Package, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CDVLanding = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Leaf className="w-8 h-8 text-primary" />,
      title: "1.000 kg de Resíduos",
      description: "Reciclagem certificada de materiais com rastreabilidade completa"
    },
    {
      icon: <GraduationCap className="w-8 h-8 text-primary" />,
      title: "1.200 Horas de Educação",
      description: "Conteúdo ambiental distribuído para 30 pessoas (40h cada)"
    },
    {
      icon: <Package className="w-8 h-8 text-primary" />,
      title: "18 Embalagens Catalogadas",
      description: "Análise técnica de reciclabilidade e impacto ambiental"
    }
  ];

  const process = [
    "Adquira sua quota CDV por R$ 2.000",
    "Acompanhe mensalmente o progresso dos impactos",
    "Aguarde o período de maturação de 12 meses",
    "Receba certificado digital com QR code de validação"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Leaf className="w-5 h-5" />
            <span className="font-semibold">Certificado Digital Verde</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Invista no Futuro Sustentável
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            O CDV (Certificado Digital Verde) é um produto de investimento ambiental que garante a entrega de impactos concretos e mensuráveis em 12 meses.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">R$ 2.000</div>
              <div className="text-sm text-muted-foreground">por quota</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">12 meses</div>
              <div className="text-sm text-muted-foreground">período de maturação</div>
            </div>
          </div>

          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
            Começar Agora <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process */}
        <Card className="max-w-3xl mx-auto mb-16">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center mb-8">Como Funciona</h2>
            <div className="space-y-4">
              {process.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-lg">{step}</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-8">
              <Users className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Pronto para Investir?</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Junte-se às empresas que já estão transformando o impacto ambiental em valor mensurável e certificado.
              </p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Acessar Plataforma <ArrowRight className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CDVLanding;
