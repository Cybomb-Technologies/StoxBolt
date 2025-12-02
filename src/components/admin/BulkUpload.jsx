
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, Download } from 'lucide-react';

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
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
    try {
      // API call: POST /api/posts/bulk-upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Upload Successful',
        description: 'Posts have been imported successfully'
      });

      setFile(null);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to import posts',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'title,shortTitle,body,category,tags,region,author,publishDateTime,status,isSponsored,metaTitle,metaDescription\n' +
      '"Sample Title","Short Title","Post body text","Indian","tag1,tag2","India","Author Name","2025-11-30T12:00","published","false","Meta Title","Meta Description"';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stoxbolt-bulk-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'CSV template downloaded successfully'
    });
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
          </label>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Posts'}
        </Button>
      </div>
    </motion.div>
  );
};

export default BulkUpload;
