# Agent Specification: '7TNT Word' Speech-to-Text Integration

## 1. Objective
Integrate a real-time Speech-to-Text (STT) feature into the **7TNT Word** editor. This allows users to dictate content verbally, with the system automatically typing the recognized text directly into the active document canvas.

---

## 2. Functional Requirements (The Voice Engine)

### A. Open-Source STT Implementation
* **Engine:** Utilize the **Web Speech API** (specifically `SpeechRecognition`), which is an open-source browser standard that requires no external paid API keys.
* **Real-time Typing:** As the user speaks, the recognized "interim" results should appear in the document, finalizing the text once the user pauses.

### B. UI Controls in 7TNT Toolbar
Add the following elements to the existing **7TNT Word** toolbar:
* **Microphone Toggle:** A "Start Dictation" button (Icon: Microphone).
* **Active Status:** A pulsing red indicator or "Listening..." label to show the system is capturing audio.
* **Language Support:** A dropdown to select the input language, linking to the "Multi-language options" already specified for 7TNT Word.

---

## 3. Interaction Logic
1. **Focus:** The user clicks a location in the 7TNT Word document.
2. **Activate:** User clicks the Microphone button in the toolbar.
3. **Capture:** The system captures audio and converts it to a text string.
4. **Inject:** The agent uses the `insertText` command of the rich-text engine (e.g., Quill or Slate) to place the text at the current cursor position.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Media Agent** | Implement the `SpeechRecognition` interface, handling permissions and start/stop triggers. |
| **Phase 2** | **Logic Agent** | Create the "Text Injection" utility to ensure dictated words respect the current "Fancy Font" and "Size" settings. |
| **Phase 3** | **UI/UX Agent** | Add the Microphone UI components to the **7TNT Word** toolbar and implement the "Listening" visual state. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Privacy:** The microphone must automatically turn off if the user navigates away from the 7TNT Word menu.
* **Accuracy:** Implement a "Continuous" mode so the user can speak long paragraphs without the system timing out.

---

## 6. Definition of Done (DoD)
- [ ] A Microphone icon is visible in the 7TNT Word toolbar.
- [ ] Clicking the icon activates voice recognition using open-source Web Speech APIs.
- [ ] Spoken words are accurately typed into the document at the cursor's location.
- [ ] The feature works seamlessly alongside existing font and color adjustments.