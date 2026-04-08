1. Force Consistent Border Rendering (CSS Fix)
Avoid fractional borders:
table, td, th {
  border: 1px solid #000;   /* strictly 1px */
  border-collapse: collapse;
}

* {
  box-sizing: border-box;
}
⚠️ Avoid:
border: 0.5px
border: thin
________________________________________
2. Apply Scale Control in html2canvas
Default scaling causes border duplication.
html2canvas(element, {
  scale: 1,   // IMPORTANT: prevents border distortion
  useCORS: true,
  backgroundColor: "#ffffff"
}).then(canvas => {
  document.body.appendChild(canvas);
});
👉 If you need HD output:
scale: window.devicePixelRatio / 2
________________________________________
3. Remove Transform / Zoom Effects
If any parent has:
transform: scale(...)
zoom: ...
👉 REMOVE it — html2canvas miscalculates borders with transforms.
________________________________________
4. Fix Table Layout Explicitly
Set fixed layout to prevent width rounding issues:
table {
  table-layout: fixed;
  width: 100%;
}
________________________________________
5. Use Outline Instead of Border (Advanced Fix)
If borders still break:
td, th {
  border: none;
  outline: 1px solid black;
}
👉 html2canvas renders outline more consistently.
________________________________________
6. Add Pixel Alignment Hack
Force integer rendering:
td, th {
  position: relative;
  top: 0;
  left: 0;
}
________________________________________
7. Use Higher Precision Rendering (Best Practice)
html2canvas(element, {
  scale: 2,
  logging: false,
  letterRendering: true
});
________________________________________
🚀 Recommended Final Setup (Production Ready)
html2canvas(document.getElementById("capture"), {
  scale: 1,
  useCORS: true,
  backgroundColor: "#fff",
  logging: false
}).then(canvas => {
  const img = canvas.toDataURL("image/png");
});
________________________________________
⚠️ Key Takeaways
•	Always use 1px borders 
•	Set scale: 1 for accuracy 
•	Avoid CSS transforms 
•	Prefer border-collapse: collapse 
•	Use outline if borders still break 

