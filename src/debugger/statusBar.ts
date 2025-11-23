import * as vscode from 'vscode';

let PCLabel: vscode.StatusBarItem | undefined;
let instructionsLabel: vscode.StatusBarItem | undefined;
let performanceLabel: vscode.StatusBarItem | undefined;

export function setupStatusBarItems(): void {

  // PC Label
  PCLabel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  PCLabel.tooltip = 'Program Counter';
  PCLabel.text = 'PC: 0';

  // Instructions Label
  instructionsLabel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  instructionsLabel.tooltip = 'Total Instructions Retired';
  instructionsLabel.text = 'Instr: 0';

  // Performance Label
  performanceLabel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  performanceLabel.tooltip = 'Pipeline Performance Metrics';
  performanceLabel.text = "$(dashboard) Cycles: 0 | Stalls: 0 | CPI: N/A";
  performanceLabel.command = "riscv-debug-support.showPipeline";

  PCLabel.show();
  instructionsLabel.show();
  performanceLabel.show();

}

export function getProgramCounterLabel(){
  return PCLabel;
}

export function getInstructionsExecutedLabel(){
  return instructionsLabel;
}

export function getPerformanceLabel(){
  return performanceLabel;
}

export function disposeStatusBarItems(): void {
  PCLabel?.dispose();
  instructionsLabel?.dispose();
  performanceLabel?.dispose();
}