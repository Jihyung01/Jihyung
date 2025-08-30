from typing import List, Dict, Any
import os
import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class UploadService:
    def __init__(self):
        self.access_key = os.getenv('AWS_ACCESS_KEY_ID')
        self.secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        self.region = os.getenv('AWS_DEFAULT_REGION', 'ap-northeast-2')
        self.bucket = os.getenv('AWS_S3_BUCKET')
        self.endpoint_url = os.getenv('AWS_S3_ENDPOINT_URL')  # For MinIO compatibility
        
        self.s3_client = None
        if self.access_key and self.secret_key and self.bucket:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    region_name=self.region,
                    endpoint_url=self.endpoint_url
                )
                logger.info("S3/MinIO client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {e}")
    
    def is_available(self) -> bool:
        """Check if upload service is available."""
        return self.s3_client is not None
    
    def generate_presigned_post(self, filename: str, content_type: Optional[str] = None, max_size: int = 10 * 1024 * 1024) -> Dict[str, Any]:
        """Generate presigned POST URL for direct browser upload."""
        if not self.is_available():
            raise Exception("Upload service not configured")
        
        # Generate unique filename
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{datetime.utcnow().strftime('%Y/%m/%d')}/{uuid.uuid4()}{file_extension}"
        
        # Conditions for the upload
        conditions = [
            ["content-length-range", 1, max_size]
        ]
        
        if content_type:
            conditions.append(["eq", "$Content-Type", content_type])
        
        fields = {
            'key': unique_filename
        }
        
        if content_type:
            fields['Content-Type'] = content_type
        
        try:
            # Generate presigned POST
            response = self.s3_client.generate_presigned_post(
                Bucket=self.bucket,
                Key=unique_filename,
                Fields=fields,
                Conditions=conditions,
                ExpiresIn=3600  # 1 hour
            )
            
            # Add file URL for after upload
            if self.endpoint_url:
                file_url = f"{self.endpoint_url}/{self.bucket}/{unique_filename}"
            else:
                file_url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{unique_filename}"
            
            return {
                'upload_url': response['url'],
                'fields': response['fields'],
                'file_url': file_url,
                'filename': unique_filename,
                'expires_at': (datetime.utcnow() + timedelta(hours=1)).isoformat()
            }
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned POST: {e}")
            raise Exception(f"Upload preparation failed: {e}")
    
    def generate_presigned_url(self, key: str, expiration: int = 3600) -> str:
        """Generate presigned URL for file download."""
        if not self.is_available():
            raise Exception("Upload service not configured")
        
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expiration
            )
            return response
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise Exception(f"Download URL generation failed: {e}")
    
    def delete_file(self, key: str) -> bool:
        """Delete file from storage."""
        if not self.is_available():
            return False
        
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            return True
            
        except ClientError as e:
            logger.error(f"Failed to delete file {key}: {e}")
            return False
    
    def list_files(self, prefix: str = "", max_keys: int = 100) -> List[Dict[str, Any]]:
        """List files in storage with optional prefix filter."""
        if not self.is_available():
            return []
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket,
                Prefix=prefix,
                MaxKeys=max_keys
            )
            
            files = []
            for obj in response.get('Contents', []):
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat(),
                    'etag': obj['ETag'].strip('"')
                })
            
            return files
            
        except ClientError as e:
            logger.error(f"Failed to list files: {e}")
            return []
    
    def get_file_info(self, key: str) -> Optional[Dict[str, Any]]:
        """Get file metadata."""
        if not self.is_available():
            return None
        
        try:
            response = self.s3_client.head_object(Bucket=self.bucket, Key=key)
            
            return {
                'key': key,
                'size': response['ContentLength'],
                'content_type': response.get('ContentType', ''),
                'last_modified': response['LastModified'].isoformat(),
                'etag': response['ETag'].strip('"'),
                'metadata': response.get('Metadata', {})
            }
            
        except ClientError as e:
            logger.error(f"Failed to get file info for {key}: {e}")
            return None