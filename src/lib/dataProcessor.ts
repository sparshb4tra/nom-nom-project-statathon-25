import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface DataRow {
  [key: string]: string | number | null | undefined;
}

export interface DataAnalysis {
  originalData: DataRow[];
  cleanedData: DataRow[];
  summary: {
    totalRows: number;
    totalColumns: number;
    missingValues: { [key: string]: number };
    dataTypes: { [key: string]: string };
    outliers: { [key: string]: number[] };
    cleaningActions: string[];
  };
  statistics: {
    [key: string]: {
      mean?: number;
      median?: number;
      std?: number;
      min?: number;
      max?: number;
      missingCount: number;
    };
  };
}

export class DataProcessor {
  private data: DataRow[] = [];
  private columns: string[] = [];

  async processFile(file: File): Promise<DataAnalysis> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      await this.parseCSV(file);
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      await this.parseExcel(file);
    } else {
      throw new Error('Unsupported file format. Please upload CSV or Excel file.');
    }

    const originalData = [...this.data];
    const cleanedData = this.cleanData();
    const summary = this.generateSummary();
    const statistics = this.calculateStatistics();

    return {
      originalData,
      cleanedData,
      summary,
      statistics
    };
  }

  private async parseCSV(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          this.data = results.data as DataRow[];
          this.columns = results.meta.fields || [];
          resolve();
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  private async parseExcel(file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    this.data = jsonData as DataRow[];
    this.columns = Object.keys(jsonData[0] || {});
  }

  private cleanData(): DataRow[] {
    const cleanedData: DataRow[] = [];
    const cleaningActions: string[] = [];

    for (const row of this.data) {
      const cleanedRow: DataRow = {};
      
      for (const column of this.columns) {
        let value = row[column];
        
        // Handle missing values
        if (value === null || value === undefined || value === '' || value === 'NaN') {
          value = this.imputeValue(column);
          if (value !== null) {
            cleaningActions.push(`Imputed missing value in column ${column}`);
          }
        }
        
        // Handle outliers for numerical data
        if (this.isNumeric(value) && typeof value === 'number' && this.isOutlier(column, value)) {
          const cleanedValue = this.handleOutlier(column, value);
          value = cleanedValue;
          cleaningActions.push(`Handled outlier in column ${column}`);
        }
        
        cleanedRow[column] = value;
      }
      
      cleanedData.push(cleanedRow);
    }

    return cleanedData;
  }

  private isNumeric(value: string | number | null | undefined): boolean {
    if (typeof value === 'number') return true;
    if (typeof value === 'string') {
      return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
    }
    return false;
  }

  private isOutlier(column: string, value: number): boolean {
    const values = this.data
      .map(row => row[column])
      .filter(val => this.isNumeric(val))
      .map(val => typeof val === 'number' ? val : parseFloat(val as string));
    
    if (values.length < 4) return false;
    
    const sorted = values.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return value < lowerBound || value > upperBound;
  }

  private handleOutlier(column: string, value: number): number {
    const values = this.data
      .map(row => row[column])
      .filter(val => this.isNumeric(val))
      .map(val => typeof val === 'number' ? val : parseFloat(val as string));
    
    const sorted = values.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    // Cap the outlier at the boundary
    if (value < lowerBound) return lowerBound;
    if (value > upperBound) return upperBound;
    return value;
  }

  private imputeValue(column: string): string | number | null {
    const values = this.data
      .map(row => row[column])
      .filter(val => val !== null && val !== undefined && val !== '' && val !== 'NaN');
    
    if (values.length === 0) return null;
    
    // Check if column is numeric
    const numericValues = values.filter(val => this.isNumeric(val));
    if (numericValues.length > 0) {
      // Use median for numeric data
      const sorted = numericValues.map(v => typeof v === 'number' ? v : parseFloat(v as string)).sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    } else {
      // Use mode for categorical data
      const frequency: { [key: string]: number } = {};
      values.forEach(val => {
        const key = String(val);
        frequency[key] = (frequency[key] || 0) + 1;
      });
      return Object.keys(frequency).reduce((a, b) => 
        frequency[a] > frequency[b] ? a : b
      );
    }
  }

  private generateSummary() {
    const missingValues: { [key: string]: number } = {};
    const dataTypes: { [key: string]: string } = {};
    const outliers: { [key: string]: number[] } = {};

    for (const column of this.columns) {
      const values = this.data.map(row => row[column]);
      missingValues[column] = values.filter(v => 
        v === null || v === undefined || v === '' || v === 'NaN'
      ).length;
      
      // Determine data type
      const numericCount = values.filter(v => this.isNumeric(v)).length;
      if (numericCount > values.length * 0.8) {
        dataTypes[column] = 'numeric';
      } else {
        dataTypes[column] = 'categorical';
      }
      
      // Find outliers
      if (dataTypes[column] === 'numeric') {
        const numericValues = values.filter(v => this.isNumeric(v)).map(v => typeof v === 'number' ? v : parseFloat(v as string));
        outliers[column] = numericValues.filter(v => this.isOutlier(column, v));
      }
    }

    return {
      totalRows: this.data.length,
      totalColumns: this.columns.length,
      missingValues,
      dataTypes,
      outliers,
      cleaningActions: []
    };
  }

  private calculateStatistics() {
    const statistics: { [key: string]: {
      mean?: number;
      median?: number;
      std?: number;
      min?: number;
      max?: number;
      missingCount: number;
    } } = {};

    for (const column of this.columns) {
      const values = this.data
        .map(row => row[column])
        .filter(val => this.isNumeric(val))
        .map(val => typeof val === 'number' ? val : parseFloat(val as string));
      
      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);
        
        statistics[column] = {
          mean: parseFloat(mean.toFixed(4)),
          median: parseFloat(median.toFixed(4)),
          std: parseFloat(std.toFixed(4)),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          missingCount: this.data.filter(row => 
            !this.isNumeric(row[column])
          ).length
        };
      } else {
        statistics[column] = {
          missingCount: this.data.filter(row => 
            row[column] === null || row[column] === undefined || row[column] === '' || row[column] === 'NaN'
          ).length
        };
      }
    }

    return statistics;
  }
}
