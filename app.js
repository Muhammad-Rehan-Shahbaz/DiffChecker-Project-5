let editor1 = CodeMirror.fromTextArea(document.getElementById("orignaltext"), {
  lineNumbers: true,
  lineWrapping: true,
  theme: "default",
});
let editor2 = CodeMirror.fromTextArea(document.getElementById("changetext"), {
  lineNumbers: true,
  lineWrapping: true,
  theme: "default",
});

let editor1Bottom = CodeMirror.fromTextArea(
  document.getElementById("orignaltextBottom"),
  {
    lineNumbers: true,
    lineWrapping: true,
    theme: "default",
  }
);
let editor2Bottom = CodeMirror.fromTextArea(
  document.getElementById("changetextBottom"),
  {
    lineNumbers: true,
    lineWrapping: true,
    theme: "default",
  }
);

function formatAndClean(text1, text2) {
  const lines1 = text1
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
  const lines2 = text2
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
  return [lines1, lines2];
}
function comparison() {
  const rawText1 = editor1Bottom.getValue() || editor1.getValue();
  const rawText2 = editor2Bottom.getValue() || editor2.getValue();

  const errorMessage = document.getElementById("errorMessage");
  if (!rawText1 && !rawText2) {
    errorMessage.textContent =
      "⚠️ Please enter text in both boxes before comparing!";
    errorMessage.style.display = "block";
    return;
  } else {
    errorMessage.style.display = "none";
  }

  const [lines1, lines2] = formatAndClean(rawText1, rawText2);
  const max = Math.max(lines1.length, lines2.length);

  while (lines2.length < max) lines2.push("");

  editor1.setValue(lines1.join("\n"));
  editor2.setValue(lines2.join("\n"));

  editor1.setOption("readOnly", true);
  editor2.setOption("readOnly", true);

  editor1Bottom.setValue(rawText1);
  editor2Bottom.setValue(rawText2);

  const bottomDiv = document.getElementById("bottomEditors");
  bottomDiv.style.display = "flex";

  document.getElementById("bottomHeading").style.display = "block";

  editor1Bottom.refresh();
  editor2Bottom.refresh();

  for (let i = 0; i < editor2.lineCount(); i++) {
    editor2.removeLineClass(i, "background", "same");
    editor2.removeLineClass(i, "background", "diff");
    editor1.removeLineClass(i, "background", "same");
    editor1.removeLineClass(i, "background", "diff");
  }

  let allSame = true,
    additions = 0,
    removals = 0,
    mismatches = 0;

  for (let i = 0; i < max; i++) {
    const a = lines1[i] || "";
    const b = lines2[i] || "";

    if (a === b) {
    } else {
      editor1.addLineClass(i, "background", "diff");
      editor2.addLineClass(i, "background", "diff");
      allSame = false;

      if (!a && b) additions++;
      else if (a && !b) removals++;
      else if (a && b && a !== b) mismatches++;

      highlightWordDiff(editor1, i, a, b);
      highlightWordDiff(editor2, i, a, b);

      if (!a || !b) {
        const editor1LineElem = editor1
          .getWrapperElement()
          .querySelectorAll(".CodeMirror-line")[i];
        const editor2LineElem = editor2
          .getWrapperElement()
          .querySelectorAll(".CodeMirror-line")[i];

        if (editor1LineElem) {
          editor1LineElem.onclick = () =>
            openMergeModal(a, b, i, 0, a.length, 0, b.length);
        }
        if (editor2LineElem) {
          editor2LineElem.onclick = () =>
            openMergeModal(a, b, i, 0, a.length, 0, b.length);
        }
      }
    }
  }

  const summaryText = document.getElementById("summaryText");
  if (allSame) {
    summaryText.innerHTML = `<span class="summary-green">No difference</span>`;
  } else {
    let summaryArr = [];
    if (removals)
      summaryArr.push(`<span class="summary-red">Removals: ${removals}</span>`);
    if (additions)
      summaryArr.push(
        `<span class="summary-green">Additions: ${additions}</span>`
      );
    if (mismatches)
      summaryArr.push(
        `<span class="summary-red">Lines mismatch: ${mismatches}</span>`
      );
    summaryText.innerHTML = summaryArr.join(" &nbsp;&nbsp; ");
  }
}

function highlightWordDiff(editor, lineNumber, text1, text2) {
  const words1 = text1.split(" ");
  const words2 = text2.split(" ");
  const maxLen = Math.max(words1.length, words2.length);

  for (let i = 0, pos1 = 0, pos2 = 0; i < maxLen; i++) {
    const w1 = words1[i] || "";
    const w2 = words2[i] || "";

    if (w1 !== w2) {
      if (w1) {
        editor1.markText(
          { line: lineNumber, ch: pos1 },
          { line: lineNumber, ch: pos1 + w1.length },
          {
            className: "word-diff",
            attributes: {
              onclick: `openMergeModal('${w1}','${w2}',${lineNumber},${pos1},${
                pos1 + w1.length
              },${pos2},${pos2 + w2.length})`,
            },
          }
        );
      }

      if (w2) {
        editor2.markText(
          { line: lineNumber, ch: pos2 },
          { line: lineNumber, ch: pos2 + w2.length },
          {
            className: "word-diff",
            attributes: {
              onclick: `openMergeModal('${w1}','${w2}',${lineNumber},${pos1},${
                pos1 + w1.length
              },${pos2},${pos2 + w2.length})`,
            },
          }
        );
      }
    }
    pos1 += w1.length + 1;
    pos2 += w2.length + 1;
  }
}

function clearbox() {
  editor1.setValue("");
  editor2.setValue("");
  editor1Bottom.setValue("");
  editor2Bottom.setValue("");

  editor1.setOption("readOnly", false);
  editor2.setOption("readOnly", false);

  document.getElementById("bottomEditors").style.display = "none";
  document.getElementById("bottomHeading").style.display = "none";
  const lineCount1 = editor1.lineCount();
  const lineCount2 = editor2.lineCount();

  for (let i = 0; i < lineCount1; i++) {
    editor1.removeLineClass(i, "background", "same");
    editor1.removeLineClass(i, "background", "diff");
  }
  for (let i = 0; i < lineCount2; i++) {
    editor2.removeLineClass(i, "background", "same");
    editor2.removeLineClass(i, "background", "diff");
  }

  const summaryText = document.getElementById("summaryText");
  summaryText.innerHTML =
    '<span class="summary-red">Removals: 0 </span> &nbsp;&nbsp; <span class="summary-green"> Additions: 0</span>';
}

function clearbox1() {
  editor1.setValue("");

  const lineCount1 = editor1.lineCount();
  for (let i = 0; i < lineCount1; i++) {
    editor1.removeLineClass(i, "background", "same");
    editor1.removeLineClass(i, "background", "diff");
  }
}

function clearbox2() {
  editor2.setValue("");

  const lineCount2 = editor2.lineCount();
  for (let i = 0; i < lineCount2; i++) {
    editor2.removeLineClass(i, "background", "same");
    editor2.removeLineClass(i, "background", "diff");
  }
}

function clearbox1Bottom() {
  editor1Bottom.setValue("");
}

function clearbox2Bottom() {
  editor2Bottom.setValue("");
}

let currentMerge = {
  word1: "",
  word2: "",
  line: 0,
  start1: 0,
  end1: 0,
  start2: 0,
  end2: 0,
};

function openMergeModal(word1, word2, line, start1, end1, start2, end2) {
  currentMerge = { word1, word2, line, start1, end1, start2, end2 };

  document.getElementById("wordLeft").textContent = word1;
  document.getElementById("wordRight").textContent = word2;

  const wordLeftBtn = document.getElementById("mergeWordLeft");
  const wordRightBtn = document.getElementById("mergeWordRight");
  const lineLeftBtn = document.getElementById("mergeLineLeft");
  const lineRightBtn = document.getElementById("mergeLineRight");

  // Get full lines from editors for deeper context
  const line1 = (editor1.getLine ? editor1.getLine(line) : "").trim();
  const line2 = (editor2.getLine ? editor2.getLine(line) : "").trim();

  const leftTrimmed = (word1 || "").trim();
  const rightTrimmed = (word2 || "").trim();

  // ✅ If the WHOLE line is empty (not just spaces)
  const isLineEmptyLeft = line1 === "";
  const isLineEmptyRight = line2 === "";

  // ✅ If one side’s *entire line* is empty → only show Merge Line
  if (isLineEmptyLeft || isLineEmptyRight) {
    wordLeftBtn.style.display = "none";
    wordRightBtn.style.display = "none";
  } else {
    // Otherwise always allow word merge
    wordLeftBtn.style.display = "inline-block";
    wordRightBtn.style.display = "inline-block";
  }

  lineLeftBtn.style.display = "inline-block";
  lineRightBtn.style.display = "inline-block";

  const modal = document.getElementById("mergeModal");
  modal.style.display = "flex";
  modal.classList.add("active");
}

function closeMergeModal() {
  document.getElementById("mergeModal").style.display = "none";
  document.getElementById("mergeModal").classList.remove("active");
}

function mergeWord(direction) {
  const lineNumber = currentMerge.line;

  if (direction === "left") {
    // Merge from LEFT → RIGHT
    const sourceWord = currentMerge.word1;
    const targetLine = editor2.getLine(lineNumber);

    // Preserve exact spacing before & after
    const before = targetLine.substring(0, currentMerge.start2);
    const after = targetLine.substring(currentMerge.end2);

    const newLine =
      before.replace(/\s*$/, "") +
      " ".repeat(currentMerge.start2 - before.replace(/\s*$/, "").length) +
      sourceWord +
      after;

    editor2.replaceRange(
      newLine,
      { line: lineNumber, ch: 0 },
      { line: lineNumber, ch: targetLine.length }
    );
  } else {
    // Merge from RIGHT → LEFT
    const sourceWord = currentMerge.word2;
    const targetLine = editor1.getLine(lineNumber);

    const before = targetLine.substring(0, currentMerge.start1);
    const after = targetLine.substring(currentMerge.end1);

    const newLine =
      before.replace(/\s*$/, "") +
      " ".repeat(currentMerge.start1 - before.replace(/\s*$/, "").length) +
      sourceWord +
      after;

    editor1.replaceRange(
      newLine,
      { line: lineNumber, ch: 0 },
      { line: lineNumber, ch: targetLine.length }
    );
  }

  closeMergeModal();
  editor1Bottom.setValue(editor1.getValue());
  editor2Bottom.setValue(editor2.getValue());
  setTimeout(() => comparison(), 50);
}

function mergeLine(direction, lineNumber) {
  if (direction === "left") {
    let lineText = editor1.getLine(lineNumber);
    let targetLine = editor2.getLine(lineNumber) || "";

    if (targetLine.length > 0 && !targetLine.endsWith(" ")) {
      lineText = " " + lineText;
    }

    editor2.replaceRange(
      lineText,
      { line: lineNumber, ch: 0 },
      { line: lineNumber, ch: targetLine.length }
    );
  } else {
    let lineText = editor2.getLine(lineNumber);
    let targetLine = editor1.getLine(lineNumber) || "";

    if (targetLine.length > 0 && !targetLine.endsWith(" ")) {
      lineText = " " + lineText;
    }

    editor1.replaceRange(
      lineText,
      { line: lineNumber, ch: 0 },
      { line: lineNumber, ch: targetLine.length }
    );
  }

  closeMergeModal();
  editor1Bottom.setValue(editor1.getValue());
  editor2Bottom.setValue(editor2.getValue());
  setTimeout(() => comparison(), 50);
}

function mergeLine(direction, lineNumber) {
  if (direction === "left") {
    let lineText = editor1.getLine(lineNumber);
    let targetLine = editor2.getLine(lineNumber) || "";

    if (targetLine.length > 0 && !targetLine.endsWith(" ")) {
      lineText = " " + lineText;
    }

    editor2.replaceRange(
      lineText,
      { line: lineNumber, ch: 0 },
      { line: lineNumber, ch: targetLine.length }
    );
  } else {
    let lineText = editor2.getLine(lineNumber);
    let targetLine = editor1.getLine(lineNumber) || "";

    if (targetLine.length > 0 && !targetLine.endsWith(" ")) {
      lineText = " " + lineText;
    }

    editor1.replaceRange(
      lineText,
      { line: lineNumber, ch: 0 },
      { line: lineNumber, ch: targetLine.length }
    );
  }
  closeMergeModal();

  editor1Bottom.setValue(editor1.getValue());
  editor2Bottom.setValue(editor2.getValue());

  setTimeout(() => {
    comparison();
  }, 50);
}

function updateMergeButtonLabels() {
  const isMobile = window.innerWidth <= 1308;

  if (isMobile) {
    document.getElementById("mergeWordLeft").textContent = "Merge Word ↓";
    document.getElementById("mergeWordRight").textContent = "↑ Merge Word";
    document.getElementById("mergeLineLeft").textContent = "Merge Line ↓";
    document.getElementById("mergeLineRight").textContent = "↑ Merge Line";
  } else {
    document.getElementById("mergeWordLeft").textContent = "Merge Word →";
    document.getElementById("mergeWordRight").textContent = "← Merge Word";
    document.getElementById("mergeLineLeft").textContent = "Merge Line →";
    document.getElementById("mergeLineRight").textContent = "← Merge Line";
  }
}

updateMergeButtonLabels();

window.addEventListener("resize", updateMergeButtonLabels);
