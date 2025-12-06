import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        toast({
          title: 'Invalid File',
          description: 'Please upload a CSV file',
          variant: 'destructive'
        });
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

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${baseURL}/api/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      if (data.success) {
        setUploadResult(data);
        toast({
          title: 'Upload Successful',
          description: `${data.count} posts imported successfully${data.errors?.length > 0 ? ` with ${data.errors.length} errors` : ''}`
        });

        if (data.errors?.length > 0) {
          // Show error details in console or could show in UI
          console.error('Upload errors:', data.errors);
        }

        // Clear file
        setFile(null);
        document.getElementById('csv-upload').value = '';
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to import posts',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/bulk-upload/template`, {
        headers: {
          'Authorization': `Bearer ${token}`
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
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Template Downloaded',
        description: 'CSV template downloaded successfully'
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download template',
        variant: 'destructive'
      });
    }
  };

  const viewUploadedPosts = () => {
    navigate('/admin/posts');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Bulk Upload Posts</h2>

      <div className="space-y-6">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <h3 className="font-semibold text-orange-900 mb-2">Instructions</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-orange-800">
            <li>Download the CSV template below</li>
            <li>Fill in your post data following the template format</li>
            <li>Required fields: title, shortTitle, body, author</li>
            <li>Status values: draft, scheduled, published (admin cannot upload published)</li>
            <li>Category must be one of: Indian, US, Global, Commodities, Forex, Crypto, IPOs</li>
            <li>Upload the completed CSV file</li>
            <li>Posts will be validated and imported automatically</li>
          </ul>
        </div>

        <Button
          onClick={downloadTemplate}
          variant="outline"
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Download CSV Template
        </Button>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-orange-500 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              {file ? file.name : 'Click to select CSV file'}
            </p>
            <p className="text-sm text-gray-500">or drag and drop</p>
            {file && (
              <p className="text-xs text-gray-400 mt-2">
                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </label>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Posts
            </>
          )}
        </Button>

        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${uploadResult.errors?.length > 0 ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-green-50 border-2 border-green-200'}`}
          >
            <h3 className="font-semibold mb-2">
              {uploadResult.errors?.length > 0 ? 'Upload Completed with Issues' : 'Upload Successful!'}
            </h3>
            <p className="text-sm mb-2">
              {uploadResult.message}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Success: </span>
                <span className="text-green-600">{uploadResult.count}</span>
                {uploadResult.errors?.length > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="font-medium">Errors: </span>
                    <span className="text-yellow-600">{uploadResult.errors.length}</span>
                  </>
                )}
              </div>
              <Button
                onClick={viewUploadedPosts}
                variant="outline"
                size="sm"
              >
                View Posts
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BulkUpload;