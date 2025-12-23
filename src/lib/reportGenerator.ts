import jsPDF from 'jspdf';
import { DataAnalysis } from './dataProcessor';

export class ReportGenerator {
  static async generatePDF(analysis: DataAnalysis, fileName: string): Promise<void> {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text('DATA ANALYSIS REPORT', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.text(`GENERATED: ${new Date().toLocaleDateString().toUpperCase()}`, 20, 30);
    doc.line(20, 35, 190, 35); // Horizontal line
    
    let yPosition = 50;
    
    // Summary Section
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('01. DATA SUMMARY', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setFont("courier", "bold");
    doc.text(`TOTAL ROWS:    ${analysis.summary.totalRows}`, 20, yPosition);
    yPosition += 7;
    doc.text(`TOTAL COLUMNS: ${analysis.summary.totalColumns}`, 20, yPosition);
    yPosition += 15;
    
    // Missing Values
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('02. MISSING VALUES', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    let hasMissing = false;
    for (const [column, count] of Object.entries(analysis.summary.missingValues)) {
      if (count > 0) {
        hasMissing = true;
        doc.text(`${column.toUpperCase()}: ${count}`, 20, yPosition);
        yPosition += 7;
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      }
    }
    if (!hasMissing) {
      doc.text("NO MISSING VALUES DETECTED.", 20, yPosition);
      yPosition += 7;
    }
    yPosition += 10;
    
    // Data Types
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('03. DATA TYPES', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    for (const [column, type] of Object.entries(analysis.summary.dataTypes)) {
      doc.text(`${column.toUpperCase()}: ${type.toUpperCase()}`, 20, yPosition);
      yPosition += 7;
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    }
    
    // Statistics
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('04. STATISTICAL SUMMARY', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    for (const [column, stats] of Object.entries(analysis.statistics)) {
      if (stats.mean !== undefined) {
        // Box for each stat
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.text(column.toUpperCase(), 20, yPosition);
        yPosition += 5;
        
        doc.setFont("courier", "normal");
        doc.text(`MEAN:    ${stats.mean}`, 25, yPosition);
        doc.text(`MEDIAN:  ${stats.median}`, 100, yPosition);
        yPosition += 5;
        doc.text(`STD DEV: ${stats.std}`, 25, yPosition);
        doc.text(`RANGE:   ${stats.min} - ${stats.max}`, 100, yPosition);
        yPosition += 10;
        
        doc.line(20, yPosition - 3, 190, yPosition - 3); // Separator line
        yPosition += 10;
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
          :root {
            --bg-color: #ffffff;
            --text-color: #000000;
            --border-color: #000000;
            --highlight-bg: #f3f4f6;
          }
          * { box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0;
            padding: 40px;
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.5;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { 
            border-bottom: 4px solid var(--border-color); 
            padding-bottom: 20px; 
            margin-bottom: 60px; 
          }
          h1 { 
            font-size: 3.5rem; 
            text-transform: uppercase; 
            font-weight: 900; 
            margin: 0 0 10px 0; 
            letter-spacing: -2px; 
            line-height: 1;
          }
          .meta {
            font-family: monospace;
            text-transform: uppercase;
            font-size: 0.9rem;
            color: #666;
          }
          .section { margin-bottom: 60px; }
          .section-title { 
            font-size: 1.5rem; 
            text-transform: uppercase; 
            font-weight: 800; 
            border-bottom: 2px solid var(--border-color); 
            padding-bottom: 10px; 
            margin-bottom: 30px; 
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .section-number {
            background: var(--text-color);
            color: var(--bg-color);
            padding: 2px 8px;
            font-size: 0.8rem;
          }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }
          .metric-card {
            border: 2px solid var(--border-color);
            padding: 20px;
            transition: transform 0.2s;
          }
          .metric-card:hover {
            background: var(--highlight-bg);
          }
          .metric-label {
            font-family: monospace;
            text-transform: uppercase;
            font-size: 0.8rem;
            color: #666;
            margin-bottom: 5px;
          }
          .metric-value {
            font-size: 2.5rem;
            font-weight: 900;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 0.9rem;
            border: 2px solid var(--border-color);
          }
          th, td { 
            border: 1px solid var(--border-color); 
            padding: 12px; 
            text-align: left; 
          }
          th { 
            background-color: var(--text-color); 
            color: var(--bg-color); 
            text-transform: uppercase;
            font-weight: 700;
          }
          tr:hover td { background-color: var(--highlight-bg); }
          
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 20px; 
          }
          .stat-card { 
            border: 2px solid var(--border-color); 
            padding: 20px; 
          }
          .stat-header {
            font-weight: 800;
            text-transform: uppercase;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-size: 1.1rem;
          }
          .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-family: monospace;
          }
          
          .badge {
            display: inline-block;
            padding: 2px 6px;
            background: #eee;
            border: 1px solid #000;
            font-family: monospace;
            font-size: 0.8rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Data Analysis Report</h1>
            <div class="meta">Generated on ${new Date().toLocaleString()}</div>
          </div>
          
          <div class="section">
            <h2 class="section-title"><span class="section-number">01</span> Data Summary</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Rows</div>
                <div class="metric-value">${analysis.summary.totalRows}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Columns</div>
                <div class="metric-value">${analysis.summary.totalColumns}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Missing Values</div>
                <div class="metric-value" style="${Object.values(analysis.summary.missingValues).reduce((a, b) => a + b, 0) > 0 ? 'color: red;' : ''}">
                  ${Object.values(analysis.summary.missingValues).reduce((a, b) => a + b, 0)}
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title"><span class="section-number">02</span> Missing Values & Data Types</h2>
            <table>
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>Missing Count</th>
                  <th>Missing %</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(analysis.summary.dataTypes)
                  .map(([column, type]) => {
                    const missingCount = analysis.summary.missingValues[column] || 0;
                    const missingPct = ((missingCount / analysis.summary.totalRows) * 100).toFixed(2);
                    return `
                      <tr>
                        <td style="font-weight: 600;">${column}</td>
                        <td><span class="badge">${type.toUpperCase()}</span></td>
                        <td>${missingCount}</td>
                        <td>${missingPct}%</td>
                      </tr>
                    `;
                  }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2 class="section-title"><span class="section-number">03</span> Statistical Summary</h2>
            <div class="stats-grid">
              ${Object.entries(analysis.statistics)
                .filter(([, stats]) => stats.mean !== undefined)
                .map(([column, stats]) => `
                  <div class="stat-card">
                    <div class="stat-header">${column}</div>
                    <div class="stat-row">
                      <span>MEAN</span>
                      <span>${stats.mean}</span>
                    </div>
                    <div class="stat-row">
                      <span>MEDIAN</span>
                      <span>${stats.median}</span>
                    </div>
                    <div class="stat-row">
                      <span>STD DEV</span>
                      <span>${stats.std}</span>
                    </div>
                    <div class="stat-row">
                      <span>MIN</span>
                      <span>${stats.min}</span>
                    </div>
                    <div class="stat-row">
                      <span>MAX</span>
                      <span>${stats.max}</span>
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title"><span class="section-number">04</span> Outlier Analysis</h2>
            ${Object.entries(analysis.summary.outliers)
              .filter(([, outliers]) => outliers.length > 0)
              .map(([column, outliers]) => `
                <div style="border: 1px solid black; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                  <strong>${column}</strong>
                  <span style="font-family: monospace;">${outliers.length} OUTLIERS DETECTED</span>
                </div>
              `).join('')}
             ${Object.values(analysis.summary.outliers).every(arr => arr.length === 0) ? 
               '<div style="font-family: monospace; color: #666; padding: 20px; border: 1px dashed #ccc; text-align: center;">NO OUTLIERS DETECTED</div>' : ''
             }
          </div>
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
