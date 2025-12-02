
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SocialImageExport = ({ post, onClose }) => {
  const canvasRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = async () => {
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 1200;
      canvas.height = 1200;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 1200, 1200);
      gradient.addColorStop(0, '#ea580c'); // Orange-600
      gradient.addColorStop(1, '#dc2626'); // Red-600
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 1200);
      
      // Load and draw image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = post.image;
      
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 1200, 800);
          
          // Overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, 1200, 1200);
          
          // Category badge
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(50, 50, 200, 60);
          ctx.fillStyle = '#ea580c'; // Orange-600
          ctx.font = 'bold 32px Arial';
          ctx.fillText(post.category, 70, 90);
          
          // Title
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 48px Arial';
          const words = post.shortTitle.split(' ');
          let line = '';
          let y = 950;
          
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 1100) {
              ctx.fillText(line, 50, y);
              line = words[n] + ' ';
              y += 60;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, 50, y);
          
          // Logo
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px Arial';
          ctx.fillText('StoxBolt', 50, 1150);
          
          resolve();
        };
      });
      
      toast({
        title: 'Image Generated!',
        description: 'Your social media image is ready to download'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stoxbolt-${post.id}.webp`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Downloaded!',
        description: 'Image saved to your device'
      });
    }, 'image/webp', 0.95);
  };

  React.useEffect(() => {
    generateImage();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Social Media Image</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="bg-gray-100 rounded-xl p-4 mb-4 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: '400px' }}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={downloadImage}
            disabled={isGenerating}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download (1200x1200)
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SocialImageExport;
