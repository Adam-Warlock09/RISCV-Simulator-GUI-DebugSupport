import * as vscode from 'vscode';
import * as path from 'path';

// Instruction Fetch Decoration : dashed border with gray [IF] suffix
const IFDecoration = vscode.window.createTextEditorDecorationType({
    border: '1px dashed #888888',
    borderRadius: '2px',
    after: {
        contentText: ' [IF]',
        color: '#888888',
        margin: '0 0 0 10px'
    }
});

// Instruction Decode Decoration : underline with yellow [ID] suffix
const IDDecoration = vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline solid #D7BA7D',
    after: {
        contentText: ' [ID]',
        color: '#D7BA7D',
        margin: '0 0 0 10px'
    }
});

// Execute Decoration : solid border with blue [EX] suffix
const EXDecoration = vscode.window.createTextEditorDecorationType({
    border: '1px solid #4FC1FF',
    borderRadius: '2px',
    after: {
        contentText: ' [EX]',
        color: '#4FC1FF',
        margin: '0 0 0 10px'
    }
});

// Memory Access Decoration : solid border with purple [MEM] suffix
const MEMDecoration = vscode.window.createTextEditorDecorationType({
    border: '1px solid #C586C0',
    borderRadius: '2px',
    after: {
        contentText: ' [MEM]',
        color: '#C586C0',
        margin: '0 0 0 10px'
    }
});

// Write Back Decoration : semi-transparent background with teal [WB] suffix
const WBDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(78, 201, 176, 0.15)',
    isWholeLine: true,
    after: {
        contentText: ' [WB]',
        color: '#4EC9B0',
        margin: '0 0 0 10px'
    }
});

// Stall Decoration : red exclamation mark in gutter
export let stallDecoration: vscode.TextEditorDecorationType;

export function loadDecorations(context: vscode.ExtensionContext) {

    const iconUri = vscode.Uri.joinPath(
        context.extensionUri,
        'media',
        'hazard_logo.svg'
    );

    stallDecoration = vscode.window.createTextEditorDecorationType({
        gutterIconPath: iconUri,
        gutterIconSize: 'contain',
        overviewRulerColor: '#e51400',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        after: {
            contentText: ' ⚠️ [Stalled By Hazard]',
            color: '#e51400',
            margin: '0 0 0 10px'
        }
    });

}

// Helper function to Update Editor Decorations

export function updatePipelineDecorations(pipelineState: any) {

    // Set Editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        // console.log("🌈 Rainbow: No active editor found!");
        return;
    }

    // console.log(`🌈 Rainbow: Updating decorations for ${editor.document.fileName}`);

    // Parse Line Numbers
    const getRange = (lineNumber: any, stageName: String) => {
        if (!lineNumber || parseInt(lineNumber) <= 0){
            return [];
        }
        const lineIndex = parseInt(lineNumber) - 1;
        // console.log(`🌈 Rainbow: ${stageName} mapped to Line ${lineIndex + 1}`);
        return [new vscode.Range(lineIndex, 0, lineIndex, 1000)];
    };

    // Get Ranges for Each Stage
    const IDRanges = pipelineState?.IF_ID?.valid ? getRange(pipelineState?.IF_ID?.line, "ID") : [];
    const EXRanges = pipelineState?.ID_EX?.valid ? getRange(pipelineState?.ID_EX?.line, "EX") : [];
    const MEMRanges = pipelineState?.EX_MEM?.valid ? getRange(pipelineState?.EX_MEM?.line, "MEM") : [];
    const WBRanges = pipelineState?.MEM_WB?.valid ? getRange(pipelineState?.MEM_WB?.line, "WB") : [];

    // console.log(`🌈 Rainbow Ranges -> ID: ${IDRanges.length}, EX: ${EXRanges.length}, MEM: ${MEMRanges.length}, WB: ${WBRanges.length}`);

    // Get Stall Ranges
    const stallRanges = (pipelineState?.IF_ID?.valid && pipelineState?.IF_ID?.isStalled)
        ? getRange(pipelineState?.IF_ID?.line, "STALL")
        : [];
    
    // Apply Decorations
    editor.setDecorations(IDDecoration, IDRanges);
    editor.setDecorations(EXDecoration, EXRanges);
    editor.setDecorations(MEMDecoration, MEMRanges);
    editor.setDecorations(WBDecoration, WBRanges);

    // Apply Stall Decorations
    editor.setDecorations(stallDecoration, stallRanges);

}

export function clearPipelineDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    
    editor.setDecorations(IDDecoration, []);
    editor.setDecorations(EXDecoration, []);
    editor.setDecorations(MEMDecoration, []);
    editor.setDecorations(WBDecoration, []);
    editor.setDecorations(stallDecoration, []);
}