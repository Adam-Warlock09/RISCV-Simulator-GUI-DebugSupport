import * as vscode from 'vscode';
import vmHandler from './vmHandler';
import { mapRegisterName } from './utils';

export class RiscvHoverProvider implements vscode.HoverProvider{

    private _vmHandler: vmHandler;

    constructor(handler: vmHandler) {
        this._vmHandler = handler;
    }

    public provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        
        // console.log("🖱️ Hover triggered!");
        // Only provide hover when VM is running
        if (!this._vmHandler.isRunning()) {
            // console.log("🖱️ VM not running");
            return null;
        }

        const range = document.getWordRangeAtPosition(position);
        if (!range) return null;

        const rawWord = document.getText(range);
        const regName = mapRegisterName(rawWord);

        // console.log(`🖱️ Hover word: ${rawWord} -> Mapped: ${regName}`);

        if (/^(x|f)([0-9]|[1-2][0-9]|3[0-1])$/.test(regName)) {
            // console.log("🖱️ Match found! Fetching hover...");
            return this.getRegisterHover(regName, rawWord);
        }

        return null;

    }

    private getRegisterHover(regKey: string, originalName: string): vscode.Hover | null {
        
        // console.log(`  🔍 Looking up key: "${regKey}"`);
        const state = this._vmHandler.readRegistersJson();

        let val = state?.gp_registers?.[regKey] ?? state?.fp_registers?.[regKey];
        // console.log(`  🔢 Value found: "${val}"`);

        if (val === undefined || val === null) {
            return null;
        }

        const cleanHex = '0x' + val.replace(/^0x/, '');
        // console.log(`  🔢 Clean hex value: "${cleanHex}"`);

        let decVal = "0";
        try {
            decVal = BigInt(cleanHex).toString(10);
        } catch (e) {
            decVal = "Err";
        }

        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;

        // console.log(`  📝 Markdown content prepared for register ${originalName.toUpperCase()}`);
        markdown.appendMarkdown(`**Register ${originalName.toUpperCase()}**\n\n`);

        markdown.appendMarkdown(`| Format | Value |\n`);
        markdown.appendMarkdown(`| :--- | :--- |\n`);
        markdown.appendMarkdown(`| **Hex** | \`${cleanHex}\` |\n`);
        markdown.appendMarkdown(`| **Dec** | \`${decVal}\` |\n`);

        return new vscode.Hover(markdown);

    }

}