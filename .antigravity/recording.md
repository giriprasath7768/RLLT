# Agent Specification: Audio Recording & Dynamic Split System

## 1. Objective
Develop a new menu item, "Recordings," that allows users to record their voice directly in the browser, split the resulting audio into equal segments based on user input, and download the files locally.

---

## 2. Functional Requirements (JSX)

### A. Audio Capture Interface
* **Recording Controls:** Implement "Start Recording," "Pause," and "Stop" buttons.
* **Visual Feedback:** Include a real-time waveform visualizer or a recording timer to show progress.
* **Duration Tracking:** The system must accurately capture the total length of the recording (e.g., 15 minutes).

### B. Post-Recording Workflow (The Modular Pop-up)
Once the user clicks "Stop," a modal pop-up must appear with the following:
* **Recording Summary:** Display the total duration captured.
* **Split Input:** A numeric input field where the user enters the number of desired splits.
* **Logic Rules:**
    * **If Split = 1:** No processing is required; prepare the full file for download.
    * **If Split > 1:** Calculate equal segments. For example, a 15-minute audio with 3 splits results in three 5-minute files.

### C. Processing & Download
* **Splitting Engine:** Use a client-side library (e.g., `ffmpeg.wasm` or Web Audio API) to segment the audio blob.
* **Naming Convention:** Files should be downloaded as `Recording_Part1.mp3`, `Recording_Part2.mp3`, etc.
* **Automatic Download:** Trigger the browser's download manager for each generated segment.

---

## 3. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Media Agent** | Implement the `MediaRecorder` API to capture audio and store the raw Blob in the component state. |
| **Phase 2** | **Logic Agent** | Develop the mathematical split logic and the multi-file download trigger. |
| **Phase 3** | **UI/UX Agent** | Build the "Recordings" page and the Modular Pop-up using the "App Creators" design language. |

---

## 4. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Privacy:** Ensure the microphone permission is requested and handled gracefully.
* **Stability:** For long recordings (e.g., 15+ minutes), ensure the splitting logic does not freeze the UI thread (use Web Workers if necessary).

---

## 5. Definition of Done (DoD)
- [ ] "Recordings" menu item is functional and accessible.
- [ ] Users can record audio, stop it, and see the split configuration pop-up.
- [ ] Entering "1" download the original file; entering a higher number downloads equal parts.
- [ ] All audio files are successfully saved to the user's local system.