import * as vscode from 'vscode';

export interface GanttRow {
    id: number;         // Sequence ID
    pc: string;         // Hex PC
    instr: string;      // Instruction "addi x1 ..."
    stages: string[]    // ["IF", "ID", "EX", "MEM", "WB"] (index corresponds to cycle)
}

export class GanttTracker {

    private history: Map<number, GanttRow> = new Map();
    private currentCycle: number = 0;

    public reset() {
        this.history.clear();
        this.currentCycle = 0;
    }

    public update(pipelineState: any, vmState: any) {
    
        this.currentCycle = parseInt(vmState.cycle_count || "0");
        if (this.currentCycle <= 0) {
            this.reset();
            return;
        }

        for (const [id, row] of this.history) {
            // Truncate the stages array to the current cycle length
            if (row.stages.length > this.currentCycle) {
                row.stages.length = this.currentCycle;
            }
            
            // Cleanup: If this row has NO stages left (it was born in the future), delete it.
            // We check if the array is empty or contains only undefined
            const hasHistory = row.stages.some(s => s !== undefined);
            if (!hasHistory) {
                this.history.delete(id);
            }
        }

        const stageMap = [
            { name: "IF", data: pipelineState.IF_ID },
            { name: "ID", data: pipelineState.ID_EX },
            { name: "EX", data: pipelineState.EX_MEM },
            { name: "MEM", data: pipelineState.MEM_WB },
            { name: "WB", data: pipelineState.Retired }
        ];

        const seenSeqIds = new Set<number>();

        for (const stage of stageMap) {

            if (!stage.data) continue;

            const seqId = parseInt(stage.data.seq_id);

            if (!seqId || seqId <= 0) continue;

            seenSeqIds.add(seqId);

            let row = this.history.get(seqId);
            if (!row) {
                row = {
                    id: seqId,
                    pc: stage.data.pc || stage.data.CurrentPC || "??",
                    instr: stage.data.instr || "Unknown",
                    stages: []
                };
                this.history.set(seqId, row);
            }

            row.stages[this.currentCycle - 1] = stage.name;

        }

        for (const [id, row] of this.history) {

            if (seenSeqIds.has(id)) {
                continue; // Already updated this cycle
            }

            const prevStage = row.stages[this.currentCycle - 2];
            if (prevStage && prevStage !== "WB" && prevStage !== "FLUSH") {
                row.stages[this.currentCycle - 1] = "FLUSH";
            }

        }
    
    }

    public getHistory(): GanttRow[] {
        return Array.from(this.history.values()).sort((a, b) => a.id - b.id);
    }

    public getCycleCount(): number {
        return this.currentCycle;
    }

}

export const ganttTracker = new GanttTracker();