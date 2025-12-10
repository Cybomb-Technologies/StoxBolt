import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  FileText, 
  Download, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      const fileName = selectedFile.name.toLowerCase();
      
      console.log('Selected file:', {
        name: selectedFile.name,
        type: fileType,
        size: selectedFile.size,
        lastModified: new Date(selectedFile.lastModified).toLocaleString()
      });
      
      // Accept CSV files
      const isCSV = fileType === 'text/csv' || 
                    fileType === 'application/vnd.ms-excel' || 
                    fileType === 'application/csv' ||
                    fileType === 'text/plain' ||
                    fileName.endsWith('.csv');
      
      if (isCSV) {
        // Check file size (5MB limit)
        if (selectedFile.size > 5 * 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: 'Maximum file size is 5MB',
            variant: 'destructive'
          });
          e.target.value = '';
          return;
        }
        
        setFile(selectedFile);
        setUploadResult(null);
        setShowErrors(false);
        setDebugInfo(null);
        setFilePreview(null);
        
        // Read and preview first few lines
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          console.log('File content preview:', content.substring(0, 500));
          setFilePreview(content.substring(0, 1000)); // Store first 1000 chars
        };
        reader.readAsText(selectedFile);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a CSV file. Received: ' + fileType,
          variant: 'destructive'
        });
        e.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to upload',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setShowErrors(false);
    setDebugInfo(null);

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Authentication required. Please login again.');
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('Auth token present:', !!adminToken);

      const response = await fetch(`${baseURL}/api/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
          // Note: Don't set Content-Type for FormData - browser sets it automatically
        },
        body: formData
      });

      console.log('Response status:', response.status);

      let data;
      try {
        const text = await response.text();
        console.log('Full response:', text);
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        console.log('Response text that failed to parse:', text ? text.substring(0, 500) : 'No response text');
        throw new Error('Server returned invalid response. Response was not JSON.');
      }

      if (!response.ok) {
        console.error('Upload failed:', data);
        
        // Store debug info if available
        if (data.debug) {
          setDebugInfo(data.debug);
        }
        
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      if (data.success) {
        setUploadResult(data);
        
        // Store debug info if available
        if (data.debug) {
          setDebugInfo(data.debug);
        }
        
        toast({
          title: data.errors?.length > 0 ? 'Upload Completed with Issues' : 'Upload Successful',
          description: `${data.count} posts imported successfully${data.errors?.length > 0 ? ` with ${data.errors.length} errors` : ''}`,
          variant: data.errors?.length > 0 ? 'default' : 'success'
        });

        // Clear file input
        setFile(null);
        setFilePreview(null);
        const fileInput = document.getElementById('csv-upload');
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('ERR_UPLOAD_FILE_CHANGED')) {
        errorMessage = 'File upload error. Please try again with a different file.';
      } else if (error.message.includes('Authentication required')) {
        errorMessage = 'Your session has expired. Please login again.';
        navigate('/admin/login');
      }

      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to download template',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${baseURL}/api/bulk-upload/template`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stoxbolt-bulk-upload-template.csv';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({
        title: 'Template Downloaded',
        description: 'CSV template downloaded successfully'
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download template',
        variant: 'destructive'
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-orange-500', 'bg-orange-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-orange-500', 'bg-orange-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-orange-500', 'bg-orange-50');
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fileType = droppedFile.type;
      const fileName = droppedFile.name.toLowerCase();
      
      const isCSV = fileType === 'text/csv' || 
                    fileType === 'application/vnd.ms-excel' || 
                    fileType === 'application/csv' ||
                    fileType === 'text/plain' ||
                    fileName.endsWith('.csv');
      
      if (isCSV) {
        
        if (droppedFile.size > 5 * 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: 'Maximum file size is 5MB',
            variant: 'destructive'
          });
          return;
        }
        
        setFile(droppedFile);
        setUploadResult(null);
        setShowErrors(false);
        setDebugInfo(null);
        setFilePreview(null);
        
        // Read and preview
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target.result.substring(0, 1000));
        };
        reader.readAsText(droppedFile);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a CSV file',
          variant: 'destructive'
        });
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadResult(null);
    setShowErrors(false);
    setDebugInfo(null);
    setFilePreview(null);
    const fileInput = document.getElementById('csv-upload');
    if (fileInput) fileInput.value = '';
  };

  const viewUploadedPosts = () => {
    navigate('/admin/posts');
  };

  const showFilePreview = () => {
    if (filePreview) {
      toast({
        title: 'File Preview',
        description: 'Check browser console for file content',
        duration: 3000
      });
      console.log('Full file preview:', filePreview);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Posts</h2>
        <Button
          onClick={() => navigate('/admin/posts')}
          variant="outline"
          size="sm"
        >
          View All Posts
        </Button>
      </div>

      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <h3 className="font-semibold text-orange-900 mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Important Instructions
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-orange-800">
            <li><strong className="font-bold">Download the CSV template first</strong> to ensure correct format</li>
            <li><strong>Required fields:</strong> title, shortTitle, body, author (must have values)</li>
            <li><strong>Status values:</strong> draft, scheduled, published (admin cannot upload published)</li>
            <li><strong>Date format:</strong> YYYY-MM-DDTHH:mm:ss (e.g., 2025-12-01T10:00:00)</li>
            <li><strong>Boolean fields (isSponsored):</strong> true, false, 1, 0, yes, no</li>
            <li><strong>Tags:</strong> Comma-separated (e.g., stockmarket,investing)</li>
            <li><strong>File encoding:</strong> UTF-8 recommended</li>
            <li><strong>File size limit:</strong> 5MB</li>
            <li>Posts with errors will be skipped but you can see error details</li>
          </ul>
        </div>

        {/* Download Template Button */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Step 1: Get Template</h4>
          <p className="text-sm text-blue-800 mb-3">Download and fill the template with your post data.</p>
          <Button
            onClick={downloadTemplate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </div>

        {/* File Upload Area */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <h4 className="font-semibold text-green-900 mb-2">Step 2: Upload CSV</h4>
          <p className="text-sm text-green-800 mb-3">Select your filled CSV file.</p>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer bg-white"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-upload').click()}
          >
            <input
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            
            {file ? (
              <div className="flex flex-col items-center">
                <FileText className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <p className="text-gray-800 font-medium mb-1">{file.name}</p>
                <p className="text-sm text-gray-500">
                  Size: {(file.size / 1024).toFixed(0)} KB • {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Click to change file or drag and drop a new one
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium mb-2">
                  Click to select CSV file or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: 5MB
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supports .csv files
                </p>
              </div>
            )}
          </div>

          {/* File Info and Controls */}
          {file && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(0)} KB • CSV file
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={showFilePreview}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFile}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Quick preview */}
              {filePreview && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">File preview (first 10 lines):</p>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                    {filePreview.split('\n').slice(0, 10).join('\n')}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <h4 className="font-semibold text-red-900 mb-2">Step 3: Upload Posts</h4>
          <p className="text-sm text-red-800 mb-3">Click to upload and process your CSV file.</p>
          
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Uploading and Processing...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload Posts
              </>
            )}
          </Button>
          
          {!file && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Select a CSV file first
            </p>
          )}
        </div>

        {/* Debug Info - For troubleshooting */}
        {debugInfo && (
          <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800">Debug Information</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugInfo(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <pre className="text-xs text-gray-600 bg-gray-800 text-gray-200 p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            <p className="text-xs text-gray-500 mt-2">
              This information helps troubleshoot upload issues. Check browser console for more details.
            </p>
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-xl ${uploadResult.errors?.length > 0 ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-green-50 border-2 border-green-200'}`}
          >
            <div className="flex items-start mb-4">
              {uploadResult.errors?.length > 0 ? (
                <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
              ) : (
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {uploadResult.errors?.length > 0 ? 'Upload Completed with Issues' : 'Upload Successful!'}
                </h3>
                <p className="text-sm mt-1">
                  {uploadResult.message}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600">{uploadResult.count}</div>
                <div className="text-sm text-gray-600">Posts Uploaded</div>
              </div>
              {uploadResult.errors?.length > 0 && (
                <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                  <div className="text-2xl font-bold text-yellow-600">{uploadResult.errors.length}</div>
                  <div className="text-sm text-gray-600">Errors Found</div>
                </div>
              )}
            </div>

            {uploadResult.errors?.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Error Details</h4>
                  <Button
                    onClick={() => setShowErrors(!showErrors)}
                    variant="outline"
                    size="sm"
                  >
                    {showErrors ? 'Hide Errors' : 'Show Errors'}
                  </Button>
                </div>
                
                {showErrors && (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                        <div className="flex items-start">
                          <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                Row {error.row} Errors:
                              </span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {error.errors?.length} error{error.errors?.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <ul className="list-disc list-inside text-sm text-red-700 mb-3">
                              {error.errors?.map((err, errIndex) => (
                                <li key={errIndex} className="mb-1">{err}</li>
                              ))}
                            </ul>
                            {error.data && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500 font-semibold mb-1">Row Data:</p>
                                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                                  {JSON.stringify(error.data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                onClick={viewUploadedPosts}
                variant="default"
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                size="lg"
              >
                View Uploaded Posts
              </Button>
              <Button
                onClick={() => {
                  setUploadResult(null);
                  setDebugInfo(null);
                  setShowErrors(false);
                  clearFile();
                }}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Upload Another File
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BulkUpload;