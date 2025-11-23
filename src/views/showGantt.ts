import * as vscode from 'vscode';
import { GanttRow } from '../debugger/ganttTracker';

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function showGanttAsWebview(history: GanttRow[], cycleCount: number) {

    const column = vscode.ViewColumn.Two;

    if (currentPanel) {
        currentPanel.reveal(column);
        currentPanel.webview.html = getWebviewHTML(history, cycleCount);
    } else {
        currentPanel = vscode.window.createWebviewPanel(
            'ganttView',
            'Pipeline Gantt Chart',
            column,
            {
                enableScripts: true
            }
        );

        currentPanel.webview.html = getWebviewHTML(history, cycleCount);

        currentPanel.onDidDispose(
            () => {
                currentPanel = undefined;
            },
            null,
            []
        );
    }

}

export function updateGanttIfActive(history: GanttRow[], cycleCount: number) {
    if (currentPanel) {
        currentPanel.webview.html = getWebviewHTML(history, cycleCount);
    }
}

export function closeGanttView() {
    if (currentPanel) {
        currentPanel.dispose();
        currentPanel = undefined;
    }
}

function getWebviewHTML(history: GanttRow[], totalCycles: number): string {

    let cycleHeaders = '';
    for (let i = 1; i <= totalCycles; i++) {
        cycleHeaders += `<th>Cycle ${i}</th>`;
    }

    const rows = history.map(row => {
        let rowHTML = `<tr><td class="instr-col"><span class="id">#${row.id}</span> <span class="pc">${row.pc}</span> <span class="asm">${row.instr}</span></td>`;

        for (let i = 0; i < totalCycles; i++) {
            const stage = row.stages[i];
            const prevStage = i > 0 ? row.stages[i - 1] : null;
            let cellClass = 'stage-empty';
            let cellText = "";

            if(stage) {
                if (stage === "FLUSH") {
                    cellClass = "stage-flush";
                    cellText = "FLUSH";
                } else if (stage === prevStage && stage !== "WB" && stage !== "FLUSH") {
                    cellClass = "stage-stall";
                    cellText = "STALL";
                } else {
                    cellClass = `stage-${stage.toLowerCase()}`;
                    cellText = stage;
                }
            }

            rowHTML += `<td class="${cellClass}">${cellText}</td>`;
        }

        rowHTML += `</tr>`;
        return rowHTML;
    }).join('');

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 10px; background-color: #1e1e1e; color: #ccc; }
            h2 { margin: 10px 0; color: #fff; }

            /* SCROLLABLE CONTAINER */
            .table-container {
                overflow: auto;
                max-height: 90vh;
                max-width: 100%;
                border: 1px solid #444;
                position: relative;
            }

            table {
                border-collapse: collapse;
                min-width: 100%;
                font-size: 13px;
            }

            /* HEADERS */
            th {
                background-color: #252526;
                color: #fff;
                padding: 8px;
                border-bottom: 1px solid #555;
                border-right: 1px solid #333;
                position: sticky;
                top: 0;
                z-index: 10;
                min-width: 30px;
            }

            /* INSTRUCTION COLUMN (Sticky Left) */
            .instr-col {
                position: sticky;
                left: 0;
                background-color: #252526;
                z-index: 5;
                border-right: 2px solid #555;
                padding: 4px 10px;
                white-space: nowrap;
                font-family: 'Courier New', monospace;
            }
            
            /* Specific Data Styling */
            .instr-col .id { color: #569cd6; font-size: 0.9em; margin-right: 5px; }
            .instr-col .pc { color: #808080; margin-right: 8px; }
            .instr-col .asm { color: #ce9178; font-weight: bold; }

            /* CELLS */
            td {
                border: 1px solid #333;
                text-align: center;
                padding: 4px;
                min-width: 35px;
                font-weight: bold;
                color: #fff;
            }

            /* STAGE COLORS (Matching your Rainbow Theme) */
            .stage-if  { background-color: #444444; color: #aaa; }         /* Grey */
            .stage-id  { background-color: rgba(215, 186, 125, 0.4); }     /* Yellow */
            .stage-ex  { background-color: rgba(79, 193, 255, 0.4); }      /* Blue */
            .stage-mem { background-color: rgba(197, 134, 192, 0.4); }     /* Purple */
            .stage-wb  { background-color: rgba(78, 201, 176, 0.4); }      /* Green */
            .stage-empty { background-color: transparent; }
            .stage-stall { 
                background-color: #e51400; /* Red Background */
                color: #fff; 
                border-radius: 4px;
            }
            .stage-flush { 
                background-color: #444; 
                color: #e51400; /* Red Text */
                font-weight: 900;
                text-decoration: line-through;
            }

        </style>
        </head>
        <body>
        <h2>Execution Timeline</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="z-index: 20; left: 0;">Instruction</th>
                        ${cycleHeaders}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
        <script>
            // Auto-scroll to bottom-right to see latest activity
            const container = document.querySelector('.table-container');
            container.scrollTop = container.scrollHeight;
            container.scrollLeft = container.scrollWidth;
        </script>
        </body>
        </html>`;

}