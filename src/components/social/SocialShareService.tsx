import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  Share2,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Copy,
  Download,
  QrCode,
  Link,
  Camera,
  Video,
  FileImage,
  Globe,
  Smartphone,
  X,
  Check,
  ExternalLink,
  Heart
} from 'lucide-react';

interface ShareableContent {
  type: 'note' | 'task' | 'achievement' | 'calendar' | 'dashboard';
  title: string;
  content?: string;
  imageUrl?: string;
  url?: string;
  metadata?: {
    tags?: string[];
    category?: string;
    priority?: string;
    completionDate?: string;
    stats?: Record<string, any>;
  };
}

interface SocialShareServiceProps {
  content: ShareableContent;
  onClose?: () => void;
  className?: string;
}

interface SocialPlatform {
  name: string;
  icon: React.ReactNode;
  color: string;
  shareUrl: (content: ShareableContent) => string;
  features: string[];
}

export const SocialShareService: React.FC<SocialShareServiceProps> = ({
  content,
  onClose,
  className = ""
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Generate shareable URL
  const generateShareableUrl = useCallback((content: ShareableContent): string => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      type: content.type,
      title: content.title,
      ...(content.content && { content: content.content.substring(0, 200) }),
      ...(content.metadata && { metadata: JSON.stringify(content.metadata) })
    });
    return `${baseUrl}/share?${params.toString()}`;
  }, []);

  // Social platforms configuration
  const socialPlatforms: SocialPlatform[] = [
    {
      name: 'Twitter',
      icon: <Twitter className="h-5 w-5" />,
      color: 'from-blue-400 to-blue-600',
      features: ['텍스트', '이미지', '링크'],
      shareUrl: (content) => {
        const text = `${content.title}\n\n${content.content || ''}\n\n#JIHYUNG #생산성 #AI`;
        const url = generateShareableUrl(content);
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      }
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      color: 'from-blue-600 to-blue-800',
      features: ['텍스트', '이미지', '링크', '스토리'],
      shareUrl: (content) => {
        const url = generateShareableUrl(content);
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      }
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="h-5 w-5" />,
      color: 'from-blue-700 to-blue-900',
      features: ['전문 네트워크', '이미지', '링크'],
      shareUrl: (content) => {
        const url = generateShareableUrl(content);
        const title = content.title;
        const summary = content.content?.substring(0, 200) || '';
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
      }
    },
    {
      name: 'Instagram',
      icon: <Instagram className="h-5 w-5" />,
      color: 'from-pink-500 via-red-500 to-yellow-500',
      features: ['스토리', '릴스', '이미지'],
      shareUrl: (content) => {
        // Instagram doesn't support direct URL sharing, so we'll copy the content
        return '#';
      }
    },
    {
      name: 'KakaoTalk',
      icon: <MessageCircle className="h-5 w-5" />,
      color: 'from-yellow-400 to-yellow-600',
      features: ['메시지', '링크', '이미지'],
      shareUrl: (content) => {
        const url = generateShareableUrl(content);
        return `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
      }
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-5 w-5" />,
      color: 'from-green-500 to-green-700',
      features: ['메시지', '링크', '이미지'],
      shareUrl: (content) => {
        const text = `${content.title}\n\n${content.content || ''}\n\n${generateShareableUrl(content)}`;
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
      }
    }
  ];

  // Copy link to clipboard
  const copyLink = useCallback(async () => {
    try {
      const url = generateShareableUrl(content);
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success('링크가 클립보드에 복사되었습니다! 🔗');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error('링크 복사에 실패했습니다.');
    }
  }, [content, generateShareableUrl]);

  // Generate QR code
  const generateQRCode = useCallback(() => {
    const url = generateShareableUrl(content);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    return qrUrl;
  }, [content, generateShareableUrl]);

  // Share to platform
  const shareToPlatform = useCallback(async (platform: SocialPlatform) => {
    setIsSharing(true);
    setSelectedPlatform(platform.name);

    try {
      if (platform.name === 'Instagram') {
        // For Instagram, we'll copy the content and show instructions
        const text = `${content.title}\n\n${content.content || ''}\n\n#JIHYUNG #생산성 #AI`;
        await navigator.clipboard.writeText(text);
        toast.success('Instagram용 텍스트가 복사되었습니다! Instagram 앱에서 붙여넣으세요.');
      } else {
        const shareUrl = platform.shareUrl(content);
        if (shareUrl !== '#') {
          window.open(shareUrl, '_blank', 'width=600,height=400');
        }
      }

      // Analytics tracking
      trackSocialShare(platform.name, content.type);

    } catch (error) {
      toast.error(`${platform.name} 공유에 실패했습니다.`);
    } finally {
      setIsSharing(false);
      setSelectedPlatform(null);
    }
  }, [content]);

  // Track social sharing analytics
  const trackSocialShare = useCallback((platform: string, contentType: string) => {
    // Here you would integrate with your analytics service
    console.log(`Share tracked: ${platform} - ${contentType}`);
  }, []);

  // Download as image (for visual content)
  const downloadAsImage = useCallback(async () => {
    try {
      // This would integrate with a service to convert content to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = 800;
        canvas.height = 600;

        // Create a beautiful background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add content
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(content.title, canvas.width / 2, 200);

        ctx.font = '20px Arial';
        if (content.content) {
          const words = content.content.split(' ');
          let line = '';
          let y = 280;

          for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 600 && line !== '') {
              ctx.fillText(line, canvas.width / 2, y);
              line = word + ' ';
              y += 30;
            } else {
              line = testLine;
            }
            if (y > 500) break;
          }
          ctx.fillText(line, canvas.width / 2, y);
        }

        // Download
        const link = document.createElement('a');
        link.download = `jihyung-${content.type}-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();

        toast.success('이미지가 다운로드되었습니다! 📸');
      }
    } catch (error) {
      toast.error('이미지 생성에 실패했습니다.');
    }
  }, [content]);

  // Native sharing (mobile)
  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.content || '',
          url: generateShareableUrl(content)
        });
        toast.success('공유되었습니다! 📱');
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('공유에 실패했습니다.');
        }
      }
    }
  }, [content, generateShareableUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`w-full max-w-4xl mx-auto ${className}`}
    >
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-2xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">소셜 공유</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  당신의 성과를 친구들과 공유하세요
                </p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Content Preview */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {content.title}
                </h3>
                {content.content && (
                  <p className="text-gray-700 dark:text-gray-300 mt-2 line-clamp-3">
                    {content.content}
                  </p>
                )}
                {content.metadata?.tags && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {content.metadata.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Badge variant="outline" className="capitalize">
                {content.type}
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.button
              onClick={copyLink}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {copiedLink ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {copiedLink ? '복사됨!' : '링크 복사'}
              </span>
            </motion.button>

            <motion.button
              onClick={downloadAsImage}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">이미지 저장</span>
            </motion.button>

            <motion.button
              onClick={() => setShowPreview(!showPreview)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              <span className="text-sm font-medium">QR 코드</span>
            </motion.button>

            {navigator.share && (
              <motion.button
                onClick={nativeShare}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-medium">네이티브 공유</span>
              </motion.button>
            )}
          </div>

          {/* QR Code Preview */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
              >
                <img
                  src={generateQRCode()}
                  alt="QR Code"
                  className="w-48 h-48 rounded-xl shadow-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Platforms */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              소셜 플랫폼에 공유
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialPlatforms.map((platform) => (
                <motion.div
                  key={platform.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <div className={`h-2 bg-gradient-to-r ${platform.color}`} />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-gradient-to-r ${platform.color} text-white rounded-lg`}>
                            {platform.icon}
                          </div>
                          <div>
                            <h5 className="font-medium">{platform.name}</h5>
                            <div className="flex gap-1 mt-1">
                              {platform.features.slice(0, 2).map(feature => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>

                      <Button
                        onClick={() => shareToPlatform(platform)}
                        disabled={isSharing && selectedPlatform === platform.name}
                        className={`w-full bg-gradient-to-r ${platform.color} hover:opacity-90 text-white`}
                        size="sm"
                      >
                        {isSharing && selectedPlatform === platform.name ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>공유하기</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Analytics Preview */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="h-5 w-5 text-red-500" />
              <h5 className="font-medium">공유 효과</h5>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  +15%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  동기 부여
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  +25%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  네트워킹
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  +10%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  영감 전달
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SocialShareService;