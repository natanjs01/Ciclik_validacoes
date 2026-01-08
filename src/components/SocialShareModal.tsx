import { useState } from 'react';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, ExternalLink, Download, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  copiarTexto,
  abrirLinkedIn,
  abrirInstagram,
} from '@/utils/socialShare';
import { gerarImagemConquista, baixarImagem } from '@/utils/imageGenerator';

interface SocialShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: 'linkedin' | 'instagram';
  shareText: string;
  title?: string;
  conquistaTitulo?: string;
}

export default function SocialShareModal({
  open,
  onOpenChange,
  platform,
  shareText,
  title,
  conquistaTitulo = 'Missão Concluída',
}: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [imagemGerada, setImagemGerada] = useState<string | null>(null);
  const [gerandoImagem, setGerandoImagem] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Limpar cache da imagem quando o modal é aberto
  React.useEffect(() => {
    if (open) {
      setImagemGerada(null);
    }
  }, [open]);

  const gerarImagem = async () => {
    if (imagemGerada || !profile) return;
    
    setGerandoImagem(true);
    try {
      const primeiroNome = profile.nome.split(' ')[0];
      const imagem = await gerarImagemConquista(
        conquistaTitulo,
        profile.nivel || 'Iniciante',
        primeiroNome
      );
      setImagemGerada(imagem);
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: 'Erro ao gerar imagem',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setGerandoImagem(false);
    }
  };

  const handleCopyText = async () => {
    const success = await copiarTexto(shareText);
    if (success) {
      setCopied(true);
      toast({
        title: 'Texto copiado!',
        description: 'Cole o texto ao criar seu post',
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: 'Erro ao copiar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleOpenPlatform = () => {
    if (platform === 'linkedin') {
      abrirLinkedIn();
    } else {
      abrirInstagram();
    }
    toast({
      title: `Abrindo ${platform === 'linkedin' ? 'LinkedIn' : 'Instagram'}`,
      description: 'Cole o texto copiado ao criar seu post',
    });
  };

  const handleDownloadImage = async () => {
    if (!imagemGerada) {
      await gerarImagem();
      return;
    }

    baixarImagem(imagemGerada, `ciclik-conquista-${Date.now()}.png`);
    
    toast({
      title: 'Imagem baixada!',
      description: `Use a imagem ao criar seu post no ${platformName}`,
    });
  };

  const platformName = platform === 'linkedin' ? 'LinkedIn' : 'Instagram';
  const platformIcon = platform === 'linkedin' 
    ? 'bg-[#0A66C2]' 
    : 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto bg-card border-border shadow-lg">
        <DialogHeader className="space-y-3 pb-2 sticky top-0 bg-card z-10 border-b border-border/50 mb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className={`h-10 w-10 rounded-xl ${platformIcon} flex items-center justify-center shadow-md`}>
              <ExternalLink className="h-5 w-5 text-white" />
            </div>
            <span className="text-foreground font-semibold">
              {title || `Compartilhar no ${platformName}`}
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Gere sua imagem personalizada e compartilhe sua conquista
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pb-4">
          {/* Texto gerado */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              {platform === 'instagram' ? 'Legenda sugerida' : 'Texto sugerido'}
            </label>
            <Textarea
              value={shareText}
              readOnly
              className="min-h-[140px] resize-none bg-muted/50 border-border text-foreground text-sm leading-relaxed"
            />
          </div>

          {/* Botão copiar texto */}
          <Button
            onClick={handleCopyText}
            className="w-full transition-all"
            variant={copied ? 'secondary' : 'default'}
            size="lg"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                <span>Texto Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copiar {platform === 'instagram' ? 'Legenda' : 'Texto'}</span>
              </>
            )}
          </Button>

          {/* Seção de imagem personalizada */}
          <div className="space-y-4 pt-2">
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Imagem Personalizada
              </h3>
              
              <Button 
                onClick={gerarImagem} 
                className="w-full mb-4 shadow-sm" 
                variant={imagemGerada ? "secondary" : "default"}
                disabled={gerandoImagem}
                size="lg"
              >
                {gerandoImagem ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    <span>Gerando...</span>
                  </>
                ) : imagemGerada ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    <span>Imagem Gerada</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    <span>Gerar Imagem</span>
                  </>
                )}
              </Button>
              
              {imagemGerada && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-card shadow-sm overflow-y-scroll max-h-[500px] scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted">
                    <div className="p-4">
                      <img
                        src={imagemGerada}
                        alt="Conquista Ciclik"
                        className="mx-auto w-full max-w-sm object-contain"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleDownloadImage} 
                    variant="outline" 
                    size="lg"
                    className="w-full shadow-sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span>Baixar Imagem</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Botão abrir plataforma */}
          <Button
            onClick={handleOpenPlatform}
            className={`w-full text-white shadow-md ${
              platform === 'linkedin' 
                ? 'bg-[#0A66C2] hover:bg-[#0A66C2]/90' 
                : 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90'
            }`}
            size="lg"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Abrir {platformName}</span>
          </Button>

          {/* Instruções */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              Gere a imagem → Baixe → Copie o texto → Abra o {platformName} → Publique
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
