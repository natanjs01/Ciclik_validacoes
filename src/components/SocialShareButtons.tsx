import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import SocialShareModal from './SocialShareModal';
import { gerarTextoCompartilhamento, ShareData } from '@/utils/socialShare';

interface SocialShareButtonsProps {
  shareData: ShareData;
  nomeUsuario?: string;
  className?: string;
  conquistaTitulo?: string;
}

export default function SocialShareButtons({
  shareData,
  nomeUsuario,
  className = '',
  conquistaTitulo,
}: SocialShareButtonsProps) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'linkedin' | 'instagram'>('linkedin');

  const shareText = gerarTextoCompartilhamento(shareData, nomeUsuario);

  const handleShare = (platform: 'linkedin' | 'instagram') => {
    setSelectedPlatform(platform);
    setOpenModal(true);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Compartilhar conquista:
        </span>
      </div>
      <div className="flex gap-2 mt-2">
        <Button
          onClick={() => handleShare('linkedin')}
          variant="outline"
          className="flex-1 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border-[#0A66C2]/30"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          LinkedIn
        </Button>
        <Button
          onClick={() => handleShare('instagram')}
          variant="outline"
          className="flex-1 bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 hover:opacity-80"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
            <defs>
              <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#833AB4" />
                <stop offset="50%" stopColor="#FD1D1D" />
                <stop offset="100%" stopColor="#F77737" />
              </linearGradient>
            </defs>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Instagram
        </Button>
      </div>

      <SocialShareModal
        open={openModal}
        onOpenChange={setOpenModal}
        platform={selectedPlatform}
        shareText={shareText}
        conquistaTitulo={conquistaTitulo}
      />
    </div>
  );
}
