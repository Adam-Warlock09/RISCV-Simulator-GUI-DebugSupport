import * as vscode from 'vscode';
import { MetricPoint } from '../debugger/metricTracker';

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function showPerformanceAsWebview(history: MetricPoint[]) {

    const column = vscode.ViewColumn.Two;

    if (currentPanel) {
        currentPanel.reveal(column);
        currentPanel.webview.html = getWebviewHTML(history);
    } else {
        currentPanel = vscode.window.createWebviewPanel(
            'performanceView',
            'Performance Metrics',
            column,
            {
                enableScripts: true
            }
        );

        currentPanel.webview.html = getWebviewHTML(history);

        currentPanel.onDidDispose(
            () => {
                currentPanel = undefined;
            },
            null,
            []
        );
    }

}

export function updatePerformanceIfActive(history: MetricPoint[]) {
    if (currentPanel) {
        currentPanel.webview.html = getWebviewHTML(history);
    }
}

export function closePerformanceView() {
    if (currentPanel) {
        currentPanel.dispose();
        currentPanel = undefined;
    }
}

function getWebviewHTML(data: MetricPoint[]): string {

    if (data.length === 0) return "<h3>No data yet. Run the simulation!</h3>";

    const width = 800;
    const height = 400;
    const padding = 40;

    const maxCycle = data[data.length - 1].cycle || 1;
    const maxCPI = Math.max(...data.map(d => d.cpi), 5);
    const maxStalls = Math.max(...data.map(d => d.stalls), 5);

    const getX = (cycle: number) => padding + (cycle / maxCycle) * (width - 2 * padding);
    const getYCPI = (val: number) => height - padding - (val / maxCPI) * (height - 2 * padding);
    const getYStalls = (val: number) => height - padding - (val / maxStalls) * (height - 2 * padding);

    const cpiPoints = data.map(d => `${getX(d.cycle)},${getYCPI(d.cpi)}`).join(" ");
    const stallPoints = data.map(d => `${getX(d.cycle)},${getYStalls(d.stalls)}`).join(" ");

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background-color: #1e1e1e; color: #ccc; display: flex; flex-direction: column; align-items: center; }
        h2 { color: #fff; }
        
        .chart-container {
            border: 1px solid #444;
            background-color: #252526;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        /* Legend */
        .legend { display: flex; gap: 20px; margin-bottom: 10px; font-size: 14px; font-weight: bold;}
        .legend span { display: flex; align-items: center; gap: 5px; }
        .dot-cpi { width: 10px; height: 10px; background-color: #4ec9b0; border-radius: 50%; }
        .dot-stall { width: 10px; height: 10px; background-color: #ce9178; border-radius: 50%; }

        /* SVG Styles */
        svg { font-size: 10px; overflow: visible; }
        .axis { stroke: #555; stroke-width: 1; }
        .grid { stroke: #333; stroke-width: 1; stroke-dasharray: 4; }
        .text { fill: #888; text-anchor: middle; }

        /* Data Lines */
        .line-cpi {
            fill: none;
            stroke: #4ec9b0;
            stroke-width: 2;
            stroke-linejoin: round;
        }
        .line-stalls {
            fill: none;
            stroke: #ce9178;
            stroke-width: 2;
            stroke-linejoin: round;
            opacity: 0.7;
        }
    </style>
    </head>
    <body>
    <h2>Performance Metrics</h2>
    
    <div class="legend">
        <span><div class="dot-cpi"></div> CPI (Current: ${data[data.length-1].cpi})</span>
        <span><div class="dot-stall"></div> Stalls (Total: ${data[data.length-1].stalls})</span>
    </div>

    <div class="chart-container">
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            
            <line x1="${padding}" y1="${height-padding}" x2="${width-padding}" y2="${height-padding}" class="axis" /> <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height-padding}" class="axis" /> <text x="${width/2}" y="${height-10}" class="text">Clock Cycles (${maxCycle})</text>
            <text x="20" y="${height/2}" class="text" transform="rotate(-90, 20, ${height/2})">Value</text>

            <polyline points="${stallPoints}" class="line-stalls" />
            <polyline points="${cpiPoints}" class="line-cpi" />

        </svg>
    </div>
    </body>
    </html>`;

}