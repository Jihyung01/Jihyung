import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, Image, FileText, Video } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadProgress: number;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10,
  allowedTypes = ['image/*', 'application/pdf', 'text/*', 'video/*', '.doc', '.docx', '.xlsx', '.pptx'],
  className = ''
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    // Simulate file upload with progress
    const uploadedFile: UploadedFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // In production, this would be the server URL
      uploadProgress: 0
    };

    // Simulate upload progress
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        uploadedFile.uploadProgress += 10 + Math.random() * 20;
        if (uploadedFile.uploadProgress >= 100) {
          uploadedFile.uploadProgress = 100;
          clearInterval(interval);
          resolve(uploadedFile);
        }
      }, 200);
    });
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles = Array.from(fileList);
    
    // Check file count limit
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`최대 ${maxFiles}개 파일만 업로드할 수 있습니다.`);
      return;
    }

    // Validate files
    const validFiles = newFiles.filter(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name}: 파일 크기가 ${maxSize}MB를 초과합니다.`);
        return false;
      }
      
      // Check file type
      const isAllowed = allowedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''));
        }
        return file.type === type || file.name.toLowerCase().endsWith(type);
      });
      
      if (!isAllowed) {
        toast.error(`${file.name}: 지원하지 않는 파일 형식입니다.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadPromises = validFiles.map(file => uploadFile(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      const updatedFiles = [...files, ...uploadedFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      
      toast.success(`${uploadedFiles.length}개 파일이 업로드되었습니다.`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('파일 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [files, maxFiles, maxSize, allowedTypes, onFilesChange]);

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <motion.div
            animate={{ scale: isDragOver ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className={`h-8 w-8 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          </motion.div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isDragOver ? (
              <p className="font-medium text-blue-600 dark:text-blue-400">파일을 놓아주세요</p>
            ) : (
              <div>
                <p className="font-medium">파일을 끌어다 놓거나 클릭하여 업로드</p>
                <p className="text-xs mt-1">최대 {maxFiles}개, {maxSize}MB 이하</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="text-blue-500">{getFileIcon(file.type)}</div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {file.uploadProgress < 100 && (
                    <Progress 
                      value={file.uploadProgress} 
                      className="w-full h-1 mt-2" 
                    />
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                  disabled={file.uploadProgress < 100}
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-blue-600 dark:text-blue-400"
        >
          파일 업로드 중...
        </motion.div>
      )}
    </div>
  );
};