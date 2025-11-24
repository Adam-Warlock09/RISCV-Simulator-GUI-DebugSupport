import * as vscode from 'vscode';

export interface MetricPoint {
    cycle: number;
    cpi: number;
    stalls: number;
}

export class MetricsTracker {

    private history: MetricPoint[] = [];
    private maxHistoryLength: number = 1000;

    public reset() {
        this.history = [];
    }

    public update(vmState: any) {

        const cycle = parseInt(vmState.cycle_count || "0");
        const instrs = parseInt(vmState.instructions_retired || "0");
        const stalls = parseInt(vmState.stall_cycles || "0");

        if (cycle <= 0) {
            this.reset();
            return;
        }

        if (this.history.length > 0) {
            const lastRecordedCycle = this.history[this.history.length - 1].cycle;

            if (cycle <= lastRecordedCycle) {
                this.history = this.history.filter(p => p.cycle < cycle);
            }
        }

        const cpi = instrs > 0 ? cycle / instrs : 0;

        this.history.push({
            cycle: cycle,
            cpi: cpi,
            stalls: stalls
        });

        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
        }

    }
    
    public getHistory(): MetricPoint[] {
        return this.history;
    }

}

export const metricsTracker = new MetricsTracker();