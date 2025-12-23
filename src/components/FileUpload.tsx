'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, BarChart3, Download, FileDown, AlertCircle, X, ChevronRight, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DataProcessor, DataAnalysis } from '@/lib/dataProcessor';
import { ReportGenerator } from '@/lib/reportGenerator';
import { cn } from '@/lib/utils';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<DataAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setAnalysis(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const processor = new DataProcessor();
      const result = await processor.processFile(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setAnalysis(result);
      
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCleanedData = () => {
    if (!analysis) return;

    const csvContent = [
      Object.keys(analysis.cleanedData[0] || {}).join(','),
      ...analysis.cleanedData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, '')}_cleaned.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDFReport = async () => {
    if (!analysis || !file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    await ReportGenerator.generatePDF(analysis, fileName);
  };

  const downloadHTMLReport = async () => {
    if (!analysis || !file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const html = await ReportGenerator.generateHTMLReport(analysis);
    ReportGenerator.downloadHTML(html, fileName);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="w-full space-y-12">
      <header className="border-b-2 border-black pb-6 mb-8 md:mb-12">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2 break-words">
          Data Cleaner
        </h1>
        <p className="text-lg md:text-xl font-medium text-gray-500 uppercase tracking-widest">
          High Precision Analysis Tool v1.1
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* Left Column: Upload & Controls */}
        <div className="space-y-6 md:space-y-8">
          <section>
            <h2 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
              <span className="bg-black text-white px-2 py-0.5 text-xs">01</span>
              Input Source
            </h2>
            
            {!file ? (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-black p-6 md:p-12 transition-all duration-200 cursor-pointer bg-white hover:bg-gray-50",
                  isDragActive && "bg-black text-white"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <Upload className={cn("h-12 w-12", isDragActive ? "text-white" : "text-black")} />
                  <div className="space-y-1">
                    <p className="text-xl font-bold uppercase">Drop File Here</p>
                    <p className={cn("text-sm font-mono", isDragActive ? "text-gray-300" : "text-gray-500")}>
                      .CSV .XLSX .XLS
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-black p-6 bg-white space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-black text-white flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight break-all">{file.name}</p>
                      <p className="text-xs font-mono text-gray-500 uppercase">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={clearFile}
                    className="border-2 border-black rounded-none hover:bg-black hover:text-white transition-colors h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {!analysis && (
                  <Button 
                    onClick={processFile} 
                    disabled={isProcessing}
                    className="w-full h-14 bg-black text-white rounded-none border-2 border-black hover:bg-white hover:text-black transition-colors text-lg font-bold uppercase"
                  >
                    {isProcessing ? 'Processing...' : 'Start Analysis'}
                  </Button>
                )}

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono uppercase">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-4 rounded-none border-2 border-black bg-white [&>div]:bg-black" />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border-2 border-red-500 p-4 flex items-start gap-3 text-red-600">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {analysis && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
                <span className="bg-black text-white px-2 py-0.5 text-xs">02</span>
                Export Options
              </h2>
              <div className="grid gap-3">
                <Button 
                  onClick={downloadCleanedData}
                  className="h-14 justify-between bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white group"
                >
                  <span className="font-bold uppercase flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    Cleaned CSV
                  </span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  onClick={downloadPDFReport}
                  className="h-14 justify-between bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white group"
                >
                  <span className="font-bold uppercase flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  onClick={downloadHTMLReport}
                  className="h-14 justify-between bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white group"
                >
                  <span className="font-bold uppercase flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    HTML Dashboard
                  </span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Analysis Results */}
        {analysis && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <section>
              <h2 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
                <span className="bg-black text-white px-2 py-0.5 text-xs">03</span>
                Metrics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border-2 border-black p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <p className="text-xs font-mono text-gray-500 uppercase mb-2">Total Rows</p>
                  <p className="text-3xl md:text-4xl font-black">{analysis.summary.totalRows}</p>
                </div>
                <div className="border-2 border-black p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <p className="text-xs font-mono text-gray-500 uppercase mb-2">Total Columns</p>
                  <p className="text-3xl md:text-4xl font-black">{analysis.summary.totalColumns}</p>
                </div>
                <div className="col-span-1 sm:col-span-2 border-2 border-black p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <p className="text-xs font-mono text-gray-500 uppercase mb-2">Missing Values Detected</p>
                  <p className="text-3xl md:text-4xl font-black text-red-600">
                    {Object.values(analysis.summary.missingValues).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
                <span className="bg-black text-white px-2 py-0.5 text-xs">04</span>
                Data Preview
              </h2>
              <div className="border-2 border-black overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black text-white uppercase text-xs">
                    <tr>
                      {Object.keys(analysis.cleanedData[0] || {}).map((column) => (
                        <th key={column} className="p-4 font-bold whitespace-nowrap border-b border-white/20">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analysis.cleanedData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex} className="p-4 font-mono text-xs border-r border-gray-100 last:border-0 whitespace-nowrap">
                            {typeof value === 'number' ? value.toFixed(2) : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-gray-50 p-2 text-center border-t border-black text-xs font-mono uppercase text-gray-500">
                  Showing first 5 rows
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
