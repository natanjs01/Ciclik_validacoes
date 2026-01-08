import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { getAssetPath } from '@/utils/assetPath';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface CiclikHeaderProps {
  showBackButton?: boolean;
  backTo?: string;
  title?: string;
  showUserActions?: boolean;
}

export default function CiclikHeader({ 
  showBackButton = false, 
  backTo = '/user',
  title,
  showUserActions = true 
}: CiclikHeaderProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const primeiroNome = profile?.nome.split(' ')[0] || '';

  return (
    <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Botão Voltar e Logo */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(backTo)}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <img 
              src={getAssetPath('ciclik-logo-full.png')}
              alt="Ciclik - Recicle e Ganhe" 
              className="h-10 md:h-12 w-auto object-contain cursor-pointer"
              onClick={() => navigate('/user')}
            />
          </div>

          {/* Saudação e Nome do Usuário (centralizado) */}
          {!title && profile && (
            <div className="flex-1 flex flex-col items-center justify-center px-2 min-w-0">
              <h1 className="text-sm md:text-lg font-bold text-foreground whitespace-nowrap">
                Olá, {primeiroNome}!
              </h1>
              <p className="text-xs text-muted-foreground whitespace-nowrap hidden md:block">
                Bem-vindo ao Ciclik
              </p>
            </div>
          )}

          {title && (
            <div className="flex-1 flex items-center justify-center px-2 min-w-0">
              <h1 className="text-sm md:text-lg font-bold text-foreground truncate">
                {title}
              </h1>
            </div>
          )}

          {/* Menu Hamburguer */}
          {showUserActions && (
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-foreground">Menu</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-1">
                  {/* Perfil do Usuário */}
                  {profile && (
                    <>
                      <div className="px-3 py-2 rounded-lg bg-muted/50">
                        <p className="text-sm font-semibold text-foreground">
                          {profile.nome}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {profile.email}
                        </p>
                      </div>
                      <Separator className="my-3" />
                    </>
                  )}

                  {/* Notificações */}
                  <div className="px-1">
                    <NotificationBell showLabel />
                  </div>

                  {/* Meu Perfil */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="h-5 w-5" />
                    <span>Meu Perfil</span>
                  </Button>

                  <Separator className="my-3" />

                  {/* Sair */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={signOut}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sair</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </div>
  );
}
