# RISC-V Pipeline Visualizer (VS Code Extension)

## 📖 Description
This Visual Studio Code extension acts as a graphical frontend for the C++ RISC-V Pipeline Simulator. It provides real-time visualization of the processor's micro-architectural state using a Client-Server architecture.

**Key Features:**
* **Pipeline Datapath:** Dynamic block diagram showing active instructions and forwarding paths (Red/Blue/Green arcs).
* **Gantt Chart:** Cycle-accurate scrolling timeline visualizing Stalls (`STALL`) and Flushes (`FLUSH`).
* **Rainbow Highlighting:** Color-coded source code lines indicating pipeline stages (IF, ID, EX, MEM, WB).
* **Live Metrics:** Status bar showing Cycle Count, Stall Count, and CPI.
* **Rich Tooltips:** Hover over registers (`x1`, `f5`) to see decimal/hex values.

## 🛠️ Prerequisites
* **Node.js:** Version 18 or higher.
* **VS Code.**
* **The C++ Simulator Backend:** You must have the `vm` binary built from the Backend project.

## 📦 Setup & Installation
1. Open the project folder in the terminal.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```

## ⚙️ Configuration
Before running, you must tell the extension where your C++ simulator is located. Do this once in debug mode (Extension Development Host)

1. Open VS Code Settings (`Ctrl + ,`).
2. Search for `riscv`.
3. Find **Riscv-debug-support: Vm Binary Path**.
4. Enter the **absolute path** to your compiled simulator executable (e.g., `/home/user/projects/riscv-sim/build/vm`).

## ▶️ How to Run
1. Open this folder in VS Code.
2. Press **F5** to launch the **Extension Development Host** window.
3. In the new window, open a RISC-V assembly file (`.s`).
4. Load the binary. (Follow above guide)
5. Open the Debug panel in VSCode and create a new launch configuration. (You may use the provided launch configuration snippets or create your own.)
4. Go to the **Run and Debug** tab and press **Play** beside the riscv.

## 📊 Visualizations
* **Show Pipeline Diagram:** Click the Graph icon in the editor title bar, or the debug controls, or run the command `RISC-V: Show Pipeline Diagram`.
* **Show Gantt Chart:** Click the List icon in the editor title bar, or the debug controls, or run the command `RISC-V: Show Gantt Chart`.
* **Performance:** Click the Line Graph Icon in the editor title bar, or the debug controls, or run the command `RISC-V: Show Performance Metrics`. You can also see the same in the bottom-left corner status bar.

> **Note:**  
> If you're writing a custom `launch.json`, you may use `"program": "${command:riscv-debug-support.riscvSimpleDebug.getProgramName}"`, but if it is missing,
the extension will resolve it at launch time.

# Credits :

[Original Repo By Vishank](https://github.com/VishankSingh/RISCV-Debug-Support)
