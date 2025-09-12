import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { 
  Minimize2, 
  Maximize2, 
  X, 
  Pin, 
  PinOff,
  Move,
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Monitor
} from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface PIPWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  isMinimized?: boolean;
  isPinned?: boolean;
  isVisible?: boolean;
  canResize?: boolean;
  canMove?: boolean;
  canMinimize?: boolean;
  canClose?: boolean;
  onClose?: () => void;
  onMinimize?: (minimized: boolean) => void;
  onPin?: (pinned: boolean) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  className?: string;
}

export const PIPWindow: React.FC<PIPWindowProps> = ({
  id,
  title,
  children,
  defaultPosition = { x: window.innerWidth - 320, y: 80 },
  defaultSize = { width: 300, height: 200 },
  minSize = { width: 200, height: 150 },
  maxSize = { width: 800, height: 600 },
  isMinimized = false,
  isPinned = false,
  isVisible = true,
  canResize = true,
  canMove = true,
  canMinimize = true,
  canClose = true,
  onClose,
  onMinimize,
  onPin,
  onPositionChange,
  onSizeChange,
  className
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [minimized, setMinimized] = useState(isMinimized);
  const [pinned, setPinned] = useState(isPinned);
  const [visible, setVisible] = useState(isVisible);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [opacity, setOpacity] = useState(1);
  
  const dragControls = useDragControls();
  const windowRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // Constrain position to viewport
  const constrainPosition = useCallback((pos: { x: number; y: number }) => {
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;
    
    return {
      x: Math.max(0, Math.min(maxX, pos.x)),
      y: Math.max(0, Math.min(maxY, pos.y))
    };
  }, [size.width, size.height]);

  // Handle drag
  const handleDrag = useCallback((event: any, info: PanInfo) => {
    if (!canMove || pinned) return;
    
    const newPosition = constrainPosition({
      x: position.x + info.delta.x,
      y: position.y + info.delta.y
    });
    
    setPosition(newPosition);
    onPositionChange?.(newPosition);
  }, [canMove, pinned, position, constrainPosition, onPositionChange]);

  // Handle minimize
  const handleMinimize = useCallback(() => {
    if (!canMinimize) return;
    
    const newMinimized = !minimized;
    setMinimized(newMinimized);
    onMinimize?.(newMinimized);
  }, [canMinimize, minimized, onMinimize]);

  // Handle pin
  const handlePin = useCallback(() => {
    const newPinned = !pinned;
    setPinned(newPinned);
    onPin?.(newPinned);
  }, [pinned, onPin]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!canClose) return;
    setVisible(false);
    setTimeout(() => onClose?.(), 300);
  }, [canClose, onClose]);

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      setPosition(prev => constrainPosition(prev));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [constrainPosition]);

  // Auto-hide when not focused (unless pinned)
  useEffect(() => {
    if (pinned) {
      setOpacity(1);
      return;
    }

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0.7);
    
    const element = windowRef.current;
    if (element) {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [pinned]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={windowRef}
        className={cn(
          "fixed z-[9999] select-none",
          pinned && "shadow-2xl ring-2 ring-blue-500/50",
          className
        )}
        style={{
          x: position.x,
          y: position.y,
          width: minimized ? 250 : size.width,
          height: minimized ? 40 : size.height,
          opacity
        }}
        drag={canMove && !pinned}
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        onDrag={handleDrag}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        whileDrag={{ scale: 1.02, rotate: 1 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 flex-1">
              <div 
                className="flex items-center gap-2 cursor-move flex-1"
                onPointerDown={(e) => {
                  if (canMove && !pinned) {
                    dragControls.start(e);
                  }
                }}
              >
                <Move className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {title}
                </span>
              </div>
              
              {pinned && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  고정됨
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {canMinimize && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  onClick={handleMinimize}
                >
                  {minimized ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  pinned 
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" 
                    : "hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                )}
                onClick={handlePin}
              >
                {pinned ? (
                  <PinOff className="h-3 w-3" />
                ) : (
                  <Pin className="h-3 w-3" />
                )}
              </Button>
              
              {canClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400"
                  onClick={handleClose}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {!minimized && (
            <motion.div 
              className="flex-1 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </Card>

        {/* Resize handle */}
        {canResize && !minimized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-400/50 hover:bg-gray-400/80 transition-colors"
            onPointerDown={(e) => {
              setIsResizing(true);
              e.preventDefault();
            }}
          >
            <div className="w-2 h-2 bg-white rounded-full m-1" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// PIP Manager Component
interface PIPManagerProps {
  children: React.ReactNode;
  maxWindows?: number;
}

export const PIPManager: React.FC<PIPManagerProps> = ({ 
  children, 
  maxWindows = 5 
}) => {
  const [windows, setWindows] = useState<Array<{ id: string; visible: boolean }>>([]);

  const addWindow = useCallback((id: string) => {
    setWindows(prev => {
      if (prev.length >= maxWindows) {
        return prev;
      }
      if (prev.find(w => w.id === id)) {
        return prev.map(w => w.id === id ? { ...w, visible: true } : w);
      }
      return [...prev, { id, visible: true }];
    });
  }, [maxWindows]);

  const removeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const toggleWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    ));
  }, []);

  // Provide context to children
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onWindowAdd: addWindow,
            onWindowRemove: removeWindow,
            onWindowToggle: toggleWindow,
            windows
          } as any);
        }
        return child;
      })}
    </div>
  );
};

// Mini Video Call PIP
export const MiniVideoCallPIP: React.FC<{
  roomId: string;
  participants: Array<{ id: string; name: string; stream?: MediaStream }>;
  onExpand?: () => void;
  onClose?: () => void;
}> = ({ roomId, participants, onExpand, onClose }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  return (
    <PIPWindow
      id={`video-call-${roomId}`}
      title={`화상회의 (${participants.length}명)`}
      defaultSize={{ width: 280, height: 200 }}
      onClose={onClose}
    >
      <div className="relative h-full bg-gray-900 rounded-b-lg overflow-hidden">
        {/* Video Grid */}
        <div className="grid grid-cols-2 gap-1 h-full p-2">
          {participants.slice(0, 4).map((participant, index) => (
            <div
              key={participant.id}
              className="relative bg-gray-800 rounded-lg overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                {participant.name}
              </div>
              {/* Video would go here in real implementation */}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setIsVideoOff(!isVideoOff)}
          >
            {isVideoOff ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
            onClick={onExpand}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </PIPWindow>
  );
};

// Mini Notes PIP
export const MiniNotesPIP: React.FC<{
  noteId: string;
  title: string;
  content: string;
  onEdit?: () => void;
  onClose?: () => void;
}> = ({ noteId, title, content, onEdit, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  return (
    <PIPWindow
      id={`note-${noteId}`}
      title={title}
      defaultSize={{ width: 320, height: 240 }}
      onClose={onClose}
    >
      <div className="p-3 h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          {isEditing ? (
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              className="w-full h-full text-xs border-0 resize-none focus:ring-0 bg-transparent"
              placeholder="노트 내용..."
            />
          ) : (
            <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {content || '내용이 없습니다.'}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '완료' : '편집'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={onEdit}
          >
            전체보기
          </Button>
        </div>
      </div>
    </PIPWindow>
  );
};

export default PIPWindow;