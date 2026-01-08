import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, User, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AvatarUpload() {
  const { user, profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${Date.now()}.${fileExt}`;

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione uma imagem',
          variant: 'destructive',
        });
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 5MB',
          variant: 'destructive',
        });
        return;
      }

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar perfil com a nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi atualizada com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);

      // Se houver uma URL de avatar, tentar remover o arquivo do storage
      if (profile?.avatar_url) {
        // Extrair o caminho do arquivo da URL
        const urlParts = profile.avatar_url.split('/avatars/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          // Tentar remover o arquivo (não falha se o arquivo não existir)
          await supabase.storage
            .from('avatars')
            .remove([filePath]);
        }
      }

      // Atualizar perfil para remover a URL do avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: 'Foto removida!',
        description: 'Sua foto de perfil foi removida',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover foto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">
            {profile?.nome ? getInitials(profile.nome) : <User className="h-12 w-12" />}
          </AvatarFallback>
        </Avatar>
        
        <Button
          type="button"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full h-10 w-10"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        className="hidden"
        disabled={uploading}
      />

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground text-center">
          Clique no ícone de câmera para alterar sua foto
          <br />
          <span className="text-xs">Máximo 5MB - JPG, PNG ou WEBP</span>
        </p>

        {profile?.avatar_url && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeAvatar}
            disabled={uploading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover foto
          </Button>
        )}
      </div>
    </div>
  );
}
