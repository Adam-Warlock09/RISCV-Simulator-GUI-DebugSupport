import * as vscode from 'vscode';

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function showPipelineAsWebview(pipelineState: any, vmState: any): void {
  const column = vscode.ViewColumn.Two;

  if (currentPanel) {
    currentPanel.reveal(column);
    currentPanel.webview.html = getWebviewHtml(pipelineState, vmState);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      'pipelineView',
      'Pipeline Visualizer',
      column,
      { enableScripts: true }
    );

    currentPanel.webview.html = getWebviewHtml(pipelineState, vmState);

    currentPanel.onDidDispose(
      () => { currentPanel = undefined; },
      null,
      []
    );
  }
}

export function updatePipelineIfActive(pipelineState: any, vmState: any): void {
  if (currentPanel) {
    currentPanel.webview.html = getWebviewHtml(pipelineState, vmState);
  }
}

export function closePipelineView(): void {
  if (currentPanel) {
    currentPanel.dispose();
    currentPanel = undefined;
  }
}

function getWebviewHtml(state: any, vmState: any): string {
  // Helper: Get data or default to Bubble
  const getData = (stageKey: string) => {
    const data = state[stageKey];
    const isValid = data && (data.valid === "true" || data.valid === true);
    
    if (!isValid) {
        return { pc: "------", instr: "NOP", isBubble: true, data: {} };
    }
    return { 
        pc: data.pc || data.CurrentPC || "Unknown", 
        instr: data.instr || "Unknown", 
        isBubble: false,
        data: data 
    };
  };

  // 1. IF Stage
  const if_data = {
      pc: vmState.program_counter || "0x0",
      instr: "Fetching...",
      isBubble: false
  };

  // 2. Pipeline Stages
  const id = getData("IF_ID");
  const ex = getData("ID_EX");
  const mem = getData("EX_MEM");
  const wb = getData("MEM_WB");

  // --- FORWARDING LOGIC ---

  // 1. EX Stage Forwarding (Red/Blue) - Arcs ABOVE
  // Controlled by ID_EX register
  const ex_fwd_a = ex.data["forward_a"] || "None";
  const ex_fwd_b = ex.data["forward_b"] || "None";
  
  const show_ex_fwd_ex_a = ex_fwd_a === "ExMem" ? "visible" : "hidden";
  const show_ex_fwd_mem_a = ex_fwd_a === "MemWb" ? "visible" : "hidden";
  const show_ex_fwd_ex_b = ex_fwd_b === "ExMem" ? "visible" : "hidden";
  const show_ex_fwd_mem_b = ex_fwd_b === "MemWb" ? "visible" : "hidden";

  // 2. ID Stage Branch Forwarding (Green) - Arcs BELOW
  // Now reading from ID_EX (as the instruction moves to EX, we show what it used)
  const br_fwd_a = ex.data["forward_branch_a"] || "None";
  const br_fwd_b = ex.data["forward_branch_b"] || "None";

  const show_br_fwd_a = br_fwd_a === "ExMem" ? "visible" : "hidden";
  const show_br_fwd_b = br_fwd_b === "ExMem" ? "visible" : "hidden";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { 
        font-family: 'Segoe UI', sans-serif; 
        padding: 20px; 
        background-color: #1e1e1e; 
        color: #ccc; 
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    h2 { margin-bottom: 60px; color: #fff; letter-spacing: 1px; }

    /* --- LAYOUT --- */
    .diagram-container {
        position: relative;
        display: grid;
        grid-template-columns: repeat(5, 180px);
        gap: 50px; 
        padding-top: 80px; /* Space for top wires */
        padding-bottom: 80px; /* Space for bottom wires */
    }

    /* --- BOX STYLING --- */
    .stage-box {
        background-color: #252526;
        border: 2px solid #454545;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        z-index: 2;
        height: 120px;
        transition: transform 0.2s;
    }
    .stage-box.active { border-color: #4ec9b0; background-color: #2d2d30; }
    .stage-box.bubble { opacity: 0.5; border-style: dashed; }

    .stage-header {
        background-color: #333;
        padding: 8px;
        text-align: center;
        font-weight: bold;
        color: #fff;
        border-bottom: 1px solid #454545;
    }
    .stage-content {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 10px;
        gap: 8px;
    }
    .pc-label {
        font-family: monospace;
        font-size: 12px;
        color: #569cd6;
        background: rgba(86, 156, 214, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
    }
    .instr-text {
        font-family: 'Courier New', monospace;
        color: #ce9178;
        font-size: 16px;
        font-weight: bold;
        text-align: center;
    }

    /* --- WIRES --- */
    .wire-overlay {
        position: absolute;
        top: -50px; /* Start above the grid */
        left: 0;
        width: 100%;
        height: 400px; /* Tall enough for top and bottom arcs */
        z-index: 1;
        pointer-events: none;
    }
    .wire {
        stroke: #555;
        stroke-width: 3;
        fill: none;
        marker-end: url(#arrowhead);
    }
    
    /* EX Forwarding (Red) - Top */
    .wire-fwd-ex {
        stroke: #e51400; 
        stroke-width: 3;
        fill: none;
        stroke-dasharray: 5;
        animation: dash 1s linear infinite;
        marker-end: url(#arrowhead-red);
    }
    
    /* MEM Forwarding (Blue) - Top */
    .wire-fwd-mem {
        stroke: #007acc; 
        stroke-width: 3;
        fill: none;
        stroke-dasharray: 5;
        animation: dash 1s linear infinite;
        marker-end: url(#arrowhead-blue);
    }

    /* Branch Forwarding (Green) - Bottom */
    .wire-fwd-branch {
        stroke: #4ec9b0; 
        stroke-width: 3;
        fill: none;
        stroke-dasharray: 4;
        animation: dash-reverse 1.5s linear infinite;
        marker-end: url(#arrowhead-green);
    }

    @keyframes dash { to { stroke-dashoffset: -20; } }
    @keyframes dash-reverse { to { stroke-dashoffset: 20; } }

  </style>
</head>
<body>

  <h2>Pipeline Flow</h2>

  <div class="diagram-container">
  
    <svg class="wire-overlay">
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#555" />
            </marker>
            <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#e51400" />
            </marker>
            <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#007acc" />
            </marker>
            <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#4ec9b0" />
            </marker>
        </defs>

        <line x1="180" y1="200" x2="230" y2="200" class="wire" />
        <line x1="410" y1="200" x2="460" y2="200" class="wire" />
        <line x1="640" y1="200" x2="690" y2="200" class="wire" />
        <line x1="870" y1="200" x2="920" y2="200" class="wire" />

        <path d="M 665 200 C 665 40, 435 40, 435 200" class="wire-fwd-ex" visibility="${show_ex_fwd_ex_a}" />
        
        <path d="M 665 200 C 665 40, 435 40, 435 200" class="wire-fwd-ex" visibility="${show_ex_fwd_ex_b}" />

        <path d="M 895 200 C 895 10, 435 10, 435 200" class="wire-fwd-mem" visibility="${show_ex_fwd_mem_a}" />
        
        <path d="M 895 200 C 895 10, 435 10, 435 200" class="wire-fwd-mem" visibility="${show_ex_fwd_mem_b}" />


        <path d="M 665 200 C 665 380, 205 380, 205 200" class="wire-fwd-branch" visibility="${show_br_fwd_a}" />
        
        <path d="M 665 200 C 665 380, 205 380, 205 200" class="wire-fwd-branch" visibility="${show_br_fwd_b}" />

    </svg>

    <div class="stage-box active"><div class="stage-header">IF</div><div class="stage-content"><span class="instr-text">${if_data.instr}</span><span class="pc-label">${if_data.pc}</span></div></div>
    <div class="stage-box ${id.isBubble?"bubble":"active"}"><div class="stage-header">ID</div><div class="stage-content"><span class="instr-text">${id.instr}</span><span class="pc-label">${id.pc}</span></div></div>
    <div class="stage-box ${ex.isBubble?"bubble":"active"}"><div class="stage-header">EX</div><div class="stage-content"><span class="instr-text">${ex.instr}</span><span class="pc-label">${ex.pc}</span></div></div>
    <div class="stage-box ${mem.isBubble?"bubble":"active"}"><div class="stage-header">MEM</div><div class="stage-content"><span class="instr-text">${mem.instr}</span><span class="pc-label">${mem.pc}</span></div></div>
    <div class="stage-box ${wb.isBubble?"bubble":"active"}"><div class="stage-header">WB</div><div class="stage-content"><span class="instr-text">${wb.instr}</span><span class="pc-label">${wb.pc}</span></div></div>

  </div>
</body>
</html>`;

}