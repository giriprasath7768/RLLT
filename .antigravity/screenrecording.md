# Agent Specification: System-Wide Screen Recorder

## 1. Objective
Develop a new sidebar menu item, "Screen Recorder," that allows users to capture their entire system screen, preview the recording in real-time, and download the resulting video file locally upon completion.

---

## 2. Functional Requirements (JSX)

### A. Screen Capture Interface
* [cite_start]**Media Access:** Implement the `navigator.mediaDevices.getDisplayMedia` API to request permission to record the entire system screen, a specific window, or a browser tab[cite: 31, 32].
* [cite_start]**Recording Controls:** * **Start Recording:** Initiates the capture stream and the `MediaRecorder` instance[cite: 31, 32].
    * [cite_start]**Stop Recording:** Ends the stream and triggers the processing of the video blob[cite: 31, 32].
* [cite_start]**Real-time Preview:** Include a `<video>` element to show the user exactly what is being recorded in real-time[cite: 31, 32].

### B. Video Processing & Download
* **Format:** Record the video in a high-quality format supported by the browser (typically `video/webm` or `video/mp4`).
* **Automatic Download:** Once the "Stop" button is clicked, the agent must:
    1. [cite_start]Convert the recorded chunks into a single `Blob`[cite: 31, 32].
    2. [cite_start]Create a temporary URL using `URL.createObjectURL`[cite: 31, 32].
    3. [cite_start]Programmatically click a hidden `<a>` tag to trigger the system's download manager[cite: 31, 32].
* **Naming Convention:** Files should be saved as `Screen_Recording_[Timestamp].webm`.

---

## 3. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Media Agent** | [cite_start]Set up the `DisplayMedia` stream and handle permission states (including user cancellation)[cite: 31, 32]. |
| **Phase 2** | **Logic Agent** | [cite_start]Implement the `MediaRecorder` chunk collection and the automated download trigger logic[cite: 31, 32]. |
| **Phase 3** | **UI/UX Agent** | [cite_start]Build the "Screen Recorder" page with a clear status indicator (e.g., a pulsing red 'REC' icon)[cite: 31, 32]. |

---

## 4. Constraints & Standards
* [cite_start]**Language:** **JavaScript (JSX)** only[cite: 31, 32].
* [cite_start]**Privacy:** Ensure the recorder clearly indicates when the screen is being shared to maintain user trust[cite: 31, 32].
* [cite_start]**Stability:** Implement error handling for cases where the user denies permission to share their screen[cite: 31, 32].

---

## 5. Definition of Done (DoD)
- [ ] [cite_start]"Screen Recorder" menu item is functional in the sidebar[cite: 31, 32].
- [ ] [cite_start]The browser successfully prompts the user to select the screen/window to share[cite: 31, 32].
- [ ] [cite_start]Clicking "Stop" immediately prompts a local file download of the video[cite: 31, 32].
- [ ] [cite_start]The recorded video plays back correctly in standard system media players[cite: 31, 32].