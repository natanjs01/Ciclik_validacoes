import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, Loader2, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import PageTransition from "@/components/PageTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDocumentation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportContent, setReportContent] = useState<string>("");
  const [isLoadingReport, setIsLoadingReport] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setIsLoadingReport(true);
      const response = await fetch('/RELATORIO_FUNCIONAL_CICLIK.md');
      const text = await response.text();
      setReportContent(text);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast({
        title: "Erro ao carregar relatório",
        description: "Não foi possível carregar o conteúdo do relatório.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RELATORIO_FUNCIONAL_CICLIK.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download iniciado",
      description: "O arquivo Markdown está sendo baixado.",
    });
  };

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório Funcional Completo - Ciclik', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
      yPosition += 10;

      // Process content
      const lines = reportContent.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        // Headers
        if (line.startsWith('# ')) {
          yPosition += 5;
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('# ', '');
          pdf.text(text, margin, yPosition);
          yPosition += 8;
        } 
        else if (line.startsWith('## ')) {
          yPosition += 4;
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('## ', '');
          pdf.text(text, margin, yPosition);
          yPosition += 7;
        }
        else if (line.startsWith('### ')) {
          yPosition += 3;
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('### ', '');
          pdf.text(text, margin, yPosition);
          yPosition += 6;
        }
        else if (line.startsWith('#### ')) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('#### ', '');
          pdf.text(text, margin, yPosition);
          yPosition += 5;
        }
        // Bullet points
        else if (line.startsWith('- ') || line.startsWith('* ')) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const text = '• ' + line.substring(2);
          const splitText = pdf.splitTextToSize(text, maxWidth - 5);
          pdf.text(splitText, margin + 5, yPosition);
          yPosition += (splitText.length * 4.5);
        }
        // Code blocks (simplified)
        else if (line.startsWith('```')) {
          pdf.setFontSize(9);
          pdf.setFont('courier', 'normal');
          // Skip the line with ``` and process content until next ```
          i++;
          while (i < lines.length && !lines[i].startsWith('```')) {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(lines[i], margin + 3, yPosition);
            yPosition += 4;
            i++;
          }
          pdf.setFont('helvetica', 'normal');
        }
        // Regular text
        else if (line.trim() !== '') {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const splitText = pdf.splitTextToSize(line, maxWidth);
          
          // Check if we need new page for all split lines
          if (yPosition + (splitText.length * 5) > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(splitText, margin, yPosition);
          yPosition += (splitText.length * 5);
        }
        // Empty line
        else {
          yPosition += 4;
        }
      }

      pdf.save('Relatorio_Funcional_Ciclik.pdf');
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O relatório foi baixado em formato PDF.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro durante a geração do PDF.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderMarkdownContent = () => {
    if (isLoadingReport) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="prose prose-sm max-w-none">
        {reportContent.split('\n').map((line, index) => {
          // Headers
          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-foreground">{line.replace('# ', '')}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-foreground">{line.replace('## ', '')}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={index} className="text-xl font-semibold mt-5 mb-2 text-foreground">{line.replace('### ', '')}</h3>;
          }
          if (line.startsWith('#### ')) {
            return <h4 key={index} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.replace('#### ', '')}</h4>;
          }
          
          // Lists
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={index} className="ml-6 text-sm text-muted-foreground">
                {line.substring(2)}
              </li>
            );
          }
          
          // Code blocks
          if (line.startsWith('```')) {
            return null; // Handle code blocks separately
          }
          
          // Horizontal rules
          if (line.trim() === '---') {
            return <hr key={index} className="my-6 border-border" />;
          }
          
          // Bold text
          if (line.includes('**')) {
            const parts = line.split('**');
            return (
              <p key={index} className="text-sm text-muted-foreground my-1">
                {parts.map((part, i) => 
                  i % 2 === 0 ? part : <strong key={i} className="font-semibold text-foreground">{part}</strong>
                )}
              </p>
            );
          }
          
          // Empty line
          if (line.trim() === '') {
            return <div key={index} className="h-2" />;
          }
          
          // Regular text
          return <p key={index} className="text-sm text-muted-foreground my-1">{line}</p>;
        })}
      </div>
    );
  };

  const extractTableOfContents = () => {
    const toc: { title: string; level: number; index: number }[] = [];
    const lines = reportContent.split('\n');
    
    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        toc.push({ title: line.replace('# ', ''), level: 1, index });
      } else if (line.startsWith('## ')) {
        toc.push({ title: line.replace('## ', ''), level: 2, index });
      } else if (line.startsWith('### ')) {
        toc.push({ title: line.replace('### ', ''), level: 3, index });
      }
    });
    
    return toc;
  };

  const tableOfContents = reportContent ? extractTableOfContents() : [];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-warning/10 p-2">
                  <FileText className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Documentação do Sistema</h1>
                  <p className="text-sm text-muted-foreground">Relatório Funcional Completo - Ciclik</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadMarkdown}
                className="gap-2"
                disabled={isLoadingReport}
              >
                <FileDown className="h-4 w-4" />
                Baixar MD
              </Button>
              <Button
                onClick={generatePDF}
                disabled={isGeneratingPdf || isLoadingReport}
                className="gap-2"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Baixar PDF
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>Relatório Funcional Completo</CardTitle>
              <CardDescription>
                Documentação técnica completa sobre todas as funcionalidades, fluxos, modelos de dados e impactos ambientais do aplicativo Ciclik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Conteúdo Completo</TabsTrigger>
                  <TabsTrigger value="toc">Índice</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="mt-6">
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-4 space-y-2">
                    {renderMarkdownContent()}
                  </div>
                </TabsContent>
                
                <TabsContent value="toc" className="mt-6">
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-4">
                    {isLoadingReport ? (
                      <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tableOfContents.map((item, index) => (
                          <div
                            key={index}
                            className={`py-2 px-4 hover:bg-muted rounded-lg cursor-pointer transition-colors ${
                              item.level === 1 ? 'font-bold text-foreground' :
                              item.level === 2 ? 'ml-4 font-semibold text-foreground' :
                              'ml-8 text-muted-foreground'
                            }`}
                          >
                            <span className="text-sm">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDocumentation;
