import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Check, 
  Loader2, 
  Linkedin, 
  Instagram, 
  User, 
  Phone, 
  MapPin, 
  Hash,
  Building2,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReferralSection from '@/components/ReferralSection';
import AvatarUpload from '@/components/AvatarUpload';
import PageTransition from '@/components/PageTransition';
import { z } from 'zod';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    telefone: profile?.telefone || '',
    cep: profile?.cep || '',
    numero: profile?.numero || '',
    complemento: profile?.complemento || '',
    linkedin_profile: profile?.linkedin_profile || '',
    instagram_handle: profile?.instagram_handle || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.linkedin_profile && formData.linkedin_profile.trim()) {
      const linkedinSchema = z.string().url({ message: 'URL do LinkedIn inválida' })
        .refine(
          (url) => url.includes('linkedin.com/'),
          { message: 'Deve ser uma URL do LinkedIn' }
        );
      
      const linkedinResult = linkedinSchema.safeParse(formData.linkedin_profile.trim());
      if (!linkedinResult.success) {
        newErrors.linkedin_profile = linkedinResult.error.errors[0].message;
      }
    }

    if (formData.instagram_handle && formData.instagram_handle.trim()) {
      const instagramSchema = z.string()
        .trim()
        .min(1, { message: 'Handle vazio' })
        .max(30, { message: 'Máximo 30 caracteres' })
        .regex(
          /^@?[a-zA-Z0-9._]+$/,
          { message: 'Use apenas letras, números, . e _' }
        );
      
      const instagramResult = instagramSchema.safeParse(formData.instagram_handle.trim());
      if (!instagramResult.success) {
        newErrors.instagram_handle = instagramResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Corrija os erros no formulário',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        ...formData,
        linkedin_profile: formData.linkedin_profile?.trim() || null,
        instagram_handle: formData.instagram_handle?.trim() 
          ? (formData.instagram_handle.trim().startsWith('@') 
              ? formData.instagram_handle.trim() 
              : `@${formData.instagram_handle.trim()}`)
          : null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas',
      });

      navigate('/user');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header Compacto */}
        <div className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-40">
          <div className="mx-auto max-w-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/user')}
                className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </motion.button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-foreground">Meu Perfil</h1>
                <p className="text-xs text-muted-foreground">Edite suas informações</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={loading}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-lg px-4 py-6 space-y-4"
        >
          {/* Avatar Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center">
                <AvatarUpload />
                <p className="mt-3 text-sm font-medium text-foreground">{profile?.nome}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Personal Info */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Dados Pessoais</span>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Nome</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="h-11 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      Telefone
                    </Label>
                    <Input
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="h-11 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Address */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Endereço</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">CEP</Label>
                    <Input
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      className="h-11 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Número
                    </Label>
                    <Input
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="h-11 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Complemento
                  </Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    className="h-11 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
                    placeholder="Apto, Bloco, etc."
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Social Links */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Share2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Redes Sociais</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                      LinkedIn
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://linkedin.com/in/seu-perfil"
                      value={formData.linkedin_profile}
                      onChange={(e) => {
                        setFormData({ ...formData, linkedin_profile: e.target.value });
                        if (errors.linkedin_profile) {
                          setErrors({ ...errors, linkedin_profile: '' });
                        }
                      }}
                      className={`h-11 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20 ${
                        errors.linkedin_profile ? 'ring-2 ring-destructive/50' : ''
                      }`}
                    />
                    {errors.linkedin_profile && (
                      <p className="text-xs text-destructive mt-1">{errors.linkedin_profile}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Instagram className="h-3 w-3 text-[#E4405F]" />
                      Instagram
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center px-3 h-11 bg-muted/50 rounded-xl">
                        <span className="text-sm text-muted-foreground">@</span>
                      </div>
                      <Input
                        type="text"
                        placeholder="seu_usuario"
                        value={formData.instagram_handle?.replace('@', '') || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, instagram_handle: e.target.value.replace('@', '') });
                          if (errors.instagram_handle) {
                            setErrors({ ...errors, instagram_handle: '' });
                          }
                        }}
                        className={`h-11 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20 ${
                          errors.instagram_handle ? 'ring-2 ring-destructive/50' : ''
                        }`}
                        maxLength={30}
                      />
                    </div>
                    {errors.instagram_handle && (
                      <p className="text-xs text-destructive mt-1">{errors.instagram_handle}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Referral Section */}
          {profile?.codigo_indicacao && user?.id && (
            <motion.div variants={itemVariants}>
              <ReferralSection 
                codigoIndicacao={profile.codigo_indicacao}
                userId={user.id}
              />
            </motion.div>
          )}

          {/* Save Button - Mobile */}
          <motion.div variants={itemVariants} className="pb-6">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 rounded-xl font-medium shadow-lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
