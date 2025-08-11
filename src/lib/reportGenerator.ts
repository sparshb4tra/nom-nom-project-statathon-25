import jsPDF from 'jspdf';
import { DataAnalysis } from './dataProcessor';

export class ReportGenerator {
  static async generatePDF(analysis: DataAnalysis, fileName: string): Promise<void> {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Data Analysis Report', 20, 20);
    doc.setFontSize(12);
    
    let yPosition = 40;
    
    // Summary Section
    doc.setFontSize(16);
    doc.text('Data Summary', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Total Rows: ${analysis.summary.totalRows}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Total Columns: ${analysis.summary.totalColumns}`, 20, yPosition);
    yPosition += 7;
    
    // Missing Values
    yPosition += 10;
    doc.setFontSize(12);
    doc.text('Missing Values by Column:', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    for (const [column, count] of Object.entries(analysis.summary.missingValues)) {
      if (count > 0) {
        doc.text(`${column}: ${count}`, 30, yPosition);
        yPosition += 7;
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      }
    }
    
    // Data Types
    yPosition += 10;
    doc.setFontSize(12);
    doc.text('Data Types:', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    for (const [column, type] of Object.entries(analysis.summary.dataTypes)) {
      doc.text(`${column}: ${type}`, 30, yPosition);
      yPosition += 7;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    }
    
    // Statistics
    yPosition += 10;
    doc.setFontSize(12);
    doc.text('Statistical Summary:', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    for (const [column, stats] of Object.entries(analysis.statistics)) {
      if (stats.mean !== undefined) {
        doc.text(`${column}:`, 30, yPosition);
        yPosition += 7;
        doc.text(`  Mean: ${stats.mean}`, 40, yPosition);
        yPosition += 7;
        doc.text(`  Median: ${stats.median}`, 40, yPosition);
        yPosition += 7;
        doc.text(`  Std Dev: ${stats.std}`, 40, yPosition);
        yPosition += 7;
        doc.text(`  Range: ${stats.min} - ${stats.max}`, 40, yPosition);
        yPosition += 7;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      }
    }
    
    // Save the PDF
    doc.save(`${fileName}_analysis_report.pdf`);
  }
  
  static async generateHTMLReport(analysis: DataAnalysis): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
          .metric { margin: 10px 0; }
          .metric strong { color: #007bff; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Data Analysis Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="section">
          <h2>Data Summary</h2>
          <div class="metric"><strong>Total Rows:</strong> ${analysis.summary.totalRows}</div>
          <div class="metric"><strong>Total Columns:</strong> ${analysis.summary.totalColumns}</div>
        </div>
        
        <div class="section">
          <h2>Missing Values Analysis</h2>
          <table>
            <thead>
              <tr><th>Column</th><th>Missing Count</th><th>Percentage</th></tr>
            </thead>
            <tbody>
              ${Object.entries(analysis.summary.missingValues)
                .filter(([, count]) => count > 0)
                .map(([column, count]) => `
                  <tr>
                    <td>${column}</td>
                    <td>${count}</td>
                    <td>${((count / analysis.summary.totalRows) * 100).toFixed(2)}%</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Data Types</h2>
          <table>
            <thead>
              <tr><th>Column</th><th>Data Type</th></tr>
            </thead>
            <tbody>
              ${Object.entries(analysis.summary.dataTypes)
                .map(([column, type]) => `
                  <tr><td>${column}</td><td>${type}</td></tr>
                `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Statistical Summary</h2>
          <div class="stats-grid">
            ${Object.entries(analysis.statistics)
              .filter(([, stats]) => stats.mean !== undefined)
              .map(([column, stats]) => `
                <div class="stat-card">
                  <h3>${column}</h3>
                  <div class="metric"><strong>Mean:</strong> ${stats.mean}</div>
                  <div class="metric"><strong>Median:</strong> ${stats.median}</div>
                  <div class="metric"><strong>Standard Deviation:</strong> ${stats.std}</div>
                  <div class="metric"><strong>Range:</strong> ${stats.min} - ${stats.max}</div>
                  <div class="metric"><strong>Missing Values:</strong> ${stats.missingCount}</div>
                </div>
              `).join('')}
          </div>
        </div>
        
        <div class="section">
          <h2>Outlier Analysis</h2>
          ${Object.entries(analysis.summary.outliers)
            .filter(([, outliers]) => outliers.length > 0)
            .map(([column, outliers]) => `
              <div class="metric">
                <strong>${column}:</strong> ${outliers.length} outliers detected
                ${outliers.length > 0 ? `(Values: ${outliers.slice(0, 5).join(', ')}${outliers.length > 5 ? '...' : ''})` : ''}
              </div>
            `).join('')}
        </div>
      </body>
      </html>
    `;
    
    return html;
  }
  
  static downloadHTML(html: string, fileName: string): void {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_analysis_report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
