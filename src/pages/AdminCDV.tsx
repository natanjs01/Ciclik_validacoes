import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AdminCDVProjetos from "@/components/cdv/AdminCDVProjetos";
import AdminCDVQuotas from "@/components/cdv/AdminCDVQuotas";
import AdminCDVStock from "@/components/cdv/AdminCDVStock";
import AdminCDVReconciliationManual from "@/components/cdv/AdminCDVReconciliationManual";
import AdminCDVInvestors from "@/components/cdv/AdminCDVInvestors";
import AdminCDVLeads from "@/components/cdv/AdminCDVLeads";

const tabTooltips = {
  leads: "Gerencie leads interessados em investir. Acompanhe o funil de captação e converta leads em investidores.",
  projetos: "Crie e gerencie projetos CDV. Defina metas de impacto, prazo de maturação e valor total do projeto.",
  investidores: "Visualize investidores cadastrados, envie convites e acompanhe o portfólio de cada um.",
  quotas: "Gerencie quotas por projeto. Atribua quotas a investidores e acompanhe o progresso de maturação.",
  stock: "Visualize o estoque de impactos disponíveis (resíduos, educação, embalagens) para atribuição às quotas.",
  reconciliation: "Atribua manualmente UIBs do estoque às quotas de projetos para gerar CDVs completos."
};

const AdminCDV = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("leads");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gestão CDV</h1>
            <p className="text-muted-foreground">
              Gerenciar investidores, quotas e estoque de impactos
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1.5 rounded-xl">
            {[
              { value: "leads", label: "Leads" },
              { value: "projetos", label: "Projetos" },
              { value: "investidores", label: "Investidores" },
              { value: "quotas", label: "Quotas" },
              { value: "stock", label: "Estoque" },
              { value: "reconciliation", label: "Reconciliação" },
            ].map((tab) => (
              <Tooltip key={tab.value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(tab.value)}
                    className={`
                      relative px-4 py-2.5 rounded-lg font-display text-sm font-medium
                      transition-all duration-200 ease-out
                      ${activeTab === tab.value
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    {tab.label}
                    {activeTab === tab.value && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-foreground/30 rounded-full" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>{tabTooltips[tab.value as keyof typeof tabTooltips]}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TabsList>

          <TabsContent value="leads">
            <AdminCDVLeads />
          </TabsContent>

          <TabsContent value="projetos">
            <AdminCDVProjetos />
          </TabsContent>

          <TabsContent value="investidores">
            <AdminCDVInvestors />
          </TabsContent>

          <TabsContent value="quotas">
            <AdminCDVQuotas />
          </TabsContent>

          <TabsContent value="stock">
            <AdminCDVStock onNavigateToReconciliation={() => setActiveTab("reconciliation")} />
          </TabsContent>

          <TabsContent value="reconciliation">
            <AdminCDVReconciliationManual />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminCDV;
