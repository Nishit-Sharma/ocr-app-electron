'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import * as Tesseract from 'tesseract.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as pdfjs from 'pdfjs-dist';

// Simple inline utilities for now to avoid import issues
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Simple categorization function
const categorizeDocument = (text) => {
  const textLower = text.toLowerCase();
  
  // Tax Documents
  if (/\bw-?[2-9]\b|\b1099\b|\b1040\b|\btax return\b|\birs\b/i.test(textLower)) {
    return { category: 'Tax Documents', confidence: 85 };
  }
  
  // Invoices
  if (/\binvoice\b|\bdue date\b|\bpayment due\b|\bbill\b/i.test(textLower)) {
    return { category: 'Invoices', confidence: 80 };
  }
  
  // Receipts
  if (/\breceipt\b|\bpaid\b|\bpurchase\b|\btransaction complete\b/i.test(textLower)) {
    return { category: 'Receipts', confidence: 80 };
  }
  
  // Bank Statements
  if (/\bstatement\b|\bbank\b|\baccount\b|\bbalance\b/i.test(textLower)) {
    return { category: 'Bank Statements', confidence: 75 };
  }
  
  // Payroll
  if (/\bpay stub\b|\bpayroll\b|\bgross pay\b|\bnet pay\b|\bwages\b/i.test(textLower)) {
    return { category: 'Payroll', confidence: 85 };
  }
  
  // Expense Reports
  if (/\bexpense\b|\breimbursement\b|\bmileage\b/i.test(textLower)) {
    return { category: 'Expense Reports', confidence: 80 };
  }
  
  return { category: 'Other Documents', confidence: 50 };
};

// Simple notification hook
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (title, message = '', type = 'info') => {
    const id = Date.now() + Math.random();
    const notification = { id, title, message, type };
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const NotificationSystem = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div key={notification.id} className={`max-w-sm w-64 border rounded-lg p-4 shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
          notification.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
          'bg-blue-100 border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-start">
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium">{notification.title}</p>
              {notification.message && (
                <p className="mt-1 text-sm opacity-90">{notification.message}</p>
              )}
            </div>
            <button
              className="ml-4 inline-flex text-gray-400 hover:text-gray-600"
              onClick={() => removeNotification(notification.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return { notifications, addNotification, removeNotification, NotificationSystem };
};

const OcrApp = () => {
  // Initialize PDF.js worker once
  useEffect(() => {
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
  }, []);

  // State management
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [results, setResults] = useState([]);
  const [downloadReady, setDownloadReady] = useState(false);
  const [currentlyProcessing, setCurrentlyProcessing] = useState([]); // Track files being processed
  
  // Notification system
  const { addNotification, NotificationSystem } = useNotifications();
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // Simplified file drop handler
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    console.log('Files dropped:', acceptedFiles.length);
    
    // Handle rejected files
    rejectedFiles.forEach(rejection => {
      const { file, errors } = rejection;
      const errorMessages = errors.map(e => e.message).join(', ');
      addNotification(
        'File Rejected',
        `${file.name}: ${errorMessages}`,
        'error'
      );
    });

    // Simple validation and add files
    const validFiles = acceptedFiles.filter(file => {
      // Basic size check (50MB)
      if (file.size > 50 * 1024 * 1024) {
        addNotification('File Too Large', `${file.name} is larger than 50MB`, 'error');
        return false;
      }
      return true;
    }).map(file => Object.assign(file, { 
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }));

    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      addNotification(
        'Files Added',
        `${validFiles.length} file(s) added successfully`,
        'success'
      );
    }
  }, [addNotification]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024
  });

  // PDF text extraction
  const extractPdfText = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + ' ';
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  };

  // Process files - with dynamic queue system
  const processFiles = async () => {
    console.log('Processing started with', files.length, 'files');
    
    if (files.length === 0) {
      addNotification('No Files', 'Please add files before processing', 'warning');
      return;
    }
    
    setProcessing(true);
    setProcessed(0);
    setResults([]);
    setDownloadReady(false);
    setCurrentlyProcessing([]);
    
    const processedResults = [];
    const CONCURRENT_LIMIT = 10;
    
    try {
      addNotification('Processing Started', `Processing ${files.length} file(s)...`, 'info');
      
      // Create a queue of files with their indices
      const fileQueue = files.map((file, index) => ({ file, index }));
      let completedCount = 0;
      
      // Process individual file function
      const processFile = async (fileItem) => {
        const { file, index } = fileItem;
        console.log(`Starting file ${index + 1}/${files.length}:`, file.name);
        
        // Add to currently processing list
        setCurrentlyProcessing(prev => [...prev, file.name]);
        
        try {
          let text = '';
          
          if (file.type === 'application/pdf') {
            text = await extractPdfText(file);
          } else {
            // Process image with Tesseract OCR
            const result = await Tesseract.recognize(file, 'eng');
            text = result.data.text;
          }
          
          if (!text || text.trim().length < 5) {
            throw new Error('No text found in document');
          }
          
          // Categorize the document
          const categorization = categorizeDocument(text);
          
          const result = {
            file,
            fileName: file.name,
            text: text.trim(),
            category: categorization.category,
            confidence: categorization.confidence,
            processedAt: new Date().toISOString(),
            index // Keep track of original order
          };
          
          console.log(`Completed file ${index + 1}:`, file.name, '→', categorization.category);
          return result;
          
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          addNotification(
            'Processing Error',
            `${file.name}: ${error.message}`,
            'error'
          );
          
          return {
            file,
            fileName: file.name,
            text: `Error: ${error.message}`,
            category: 'Errors',
            confidence: 0,
            error: true,
            index
          };
        } finally {
          // Remove from currently processing list
          setCurrentlyProcessing(prev => prev.filter(name => name !== file.name));
          
          // Update progress
          completedCount++;
          setProcessed(completedCount);
          console.log(`Progress: ${completedCount}/${files.length} files completed`);
        }
      };
      
      // Queue processor - maintains exactly CONCURRENT_LIMIT active processes
      const processQueue = async () => {
        const activePromises = new Set();
        
        // Function to start processing the next file from queue
        const startNext = () => {
          if (fileQueue.length > 0 && activePromises.size < CONCURRENT_LIMIT) {
            const fileItem = fileQueue.shift();
            console.log(`Starting processing: ${fileItem.file.name} (${activePromises.size + 1}/${CONCURRENT_LIMIT} slots)`);
            
            const promise = processFile(fileItem).then(result => {
              processedResults.push(result);
              activePromises.delete(promise);
              
              // Immediately start the next file if queue has more
              if (fileQueue.length > 0) {
                startNext();
              }
              
              return result;
            }).catch(error => {
              console.error('Process file error:', error);
              activePromises.delete(promise);
              
              // Still try to start the next file even if this one failed
              if (fileQueue.length > 0) {
                startNext();
              }
            });
            
            activePromises.add(promise);
            
            // Start more files if we have slots and queue items
            if (fileQueue.length > 0 && activePromises.size < CONCURRENT_LIMIT) {
              startNext();
            }
          }
        };
        
        // Start initial batch
        for (let i = 0; i < Math.min(CONCURRENT_LIMIT, fileQueue.length); i++) {
          startNext();
        }
        
        // Wait for all files to complete
        while (activePromises.size > 0 || fileQueue.length > 0) {
          if (activePromises.size > 0) {
            await Promise.race(Array.from(activePromises));
          }
          
          // Small delay to prevent busy waiting
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      };
      
      // Start the queue processing
      await processQueue();
      
      // Sort results by original order
      processedResults.sort((a, b) => a.index - b.index);
      
      setResults(processedResults);
      setProcessing(false);
      setDownloadReady(true);
      setCurrentlyProcessing([]);
      
      const successCount = processedResults.filter(r => !r.error).length;
      const errorCount = processedResults.filter(r => r.error).length;
      
      addNotification(
        'Processing Complete',
        `${successCount} file(s) processed successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        successCount === files.length ? 'success' : 'warning'
      );
      
    } catch (error) {
      console.error('Processing failed:', error);
      setProcessing(false);
      setCurrentlyProcessing([]);
      addNotification('Processing Failed', error.message, 'error');
    }
  };

  // Generate and download ZIP file
  const downloadZip = async () => {
    try {
      const zip = new JSZip();
      
      // Group files by category
      const categories = {};
      results.forEach(result => {
        if (!categories[result.category]) {
          categories[result.category] = [];
        }
        categories[result.category].push(result);
      });
      
      // Add files to appropriate folders in the ZIP
      for (const category in categories) {
        const folder = zip.folder(category);
        
        for (const result of categories[category]) {
          const fileData = await result.file.arrayBuffer();
          folder.file(result.fileName, fileData);
        }
      }
      
      // Generate and download the ZIP
      addNotification('Generating ZIP', 'Creating download file...', 'info');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      saveAs(zipBlob, `organized_documents_${timestamp}.zip`);
      
      addNotification('Download Ready', 'Your organized documents have been downloaded', 'success');
    } catch (error) {
      addNotification('Download Failed', `Error creating ZIP file: ${error.message}`, 'error');
    }
  };

  // Reset everything
  const resetApp = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    setFiles([]);
    setProcessed(0);
    setResults([]);
    setDownloadReady(false);
    setCurrentlyProcessing([]);
    
    addNotification('Reset Complete', 'Application has been reset', 'info');
  };

  // Remove individual file
  const removeFile = (fileToRemove) => {
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setFiles(prev => prev.filter(file => file.id !== fileToRemove.id));
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
      {/* Notification System */}
      <NotificationSystem />
      
      {/* Upload Area */}
      <div className="p-6">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400'}`
          }
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isDragActive ? (
              <p className="text-blue-600 dark:text-blue-400 font-medium text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Supports images (JPEG, PNG, GIF, BMP, WebP) and PDF files (max 50MB each)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="px-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Files to Process ({files.length})
          </h3>
          <div className="max-h-60 overflow-y-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">File Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 truncate max-w-xs" title={file.name}>
                      {file.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {file.type.split('/')[1]?.toUpperCase() || 'Unknown'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeFile(file)}
                        disabled={processing}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        title="Remove file"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-6 flex flex-wrap gap-3 justify-center">
        <button 
          onClick={processFiles}
          disabled={files.length === 0 || processing}
          className={`px-5 py-2.5 rounded-md font-medium text-white transition-colors duration-200
            ${files.length === 0 || processing 
              ? 'bg-blue-400 dark:bg-blue-800 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'}`
          }
        >
          {processing ? `Processing... (${processed}/${files.length})` : 'Process Documents'}
        </button>
        
        <button 
          onClick={downloadZip}
          disabled={!downloadReady}
          className={`px-5 py-2.5 rounded-md font-medium text-white transition-colors duration-200
            ${!downloadReady 
              ? 'bg-green-400 dark:bg-green-800 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'}`
          }
        >
          Download Organized ZIP
        </button>
        
        <button 
          onClick={resetApp}
          disabled={processing}
          className="px-5 py-2.5 rounded-md font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {/* Processing Status */}
      {processing && (
        <div className="px-6 pb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${(processed / files.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            Processing {processed} of {files.length} files...
          </p>
          
          {/* Show currently processing files */}
          {currentlyProcessing.length > 0 && (
            <div className="mt-3 bg-gray-50 dark:bg-gray-900 rounded p-3">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currently processing ({currentlyProcessing.length} parallel):
              </p>
              <div className="space-y-1">
                {currentlyProcessing.map((fileName, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="truncate">{fileName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !processing && (
        <div className="px-6 pb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Results ({results.length} files)
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {results.filter(r => !r.error).length} successful, {results.filter(r => r.error).length} errors
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">File Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {results.map((result, index) => (
                  <tr key={index} className={result.error ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 truncate max-w-xs" title={result.fileName}>
                      {result.fileName}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full
                        ${result.category === 'Invoices' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                        ${result.category === 'Receipts' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                        ${result.category === 'Bank Statements' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                        ${result.category === 'Tax Documents' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                        ${result.category === 'Payroll' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
                        ${result.category === 'Expense Reports' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                        ${result.category === 'Other Documents' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
                        ${result.category === 'Errors' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                      `}>
                        {result.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {result.error ? 'N/A' : `${result.confidence}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OcrApp;