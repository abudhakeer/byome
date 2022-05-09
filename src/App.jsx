import { useState, createElement, Fragment, useEffect, useRef } from "react";
import "./App.css";
import { unified } from "unified";
import remarkParse from "remark-parse/lib";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react/lib";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

function App() {
  const [doc, setDoc] = useState("# Hello byome");
  const [editorView, setEditorView] = useState(null);
  const [fileName, setFileName] = useState(null);

  const editorExtensions = [
    EditorView.updateListener.of((update) => {
      if (update.changes) {
        setDoc(update.state.doc.toString());
      }
    }),
  ];

  const md = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeReact, { createElement, Fragment })
    .processSync(doc).result;

  useEffect(() => {
    window.addEventListener("beforeunload", (e) => {
      e.returnValue = "";
    });

    const startState = EditorState.create({
      doc,
      extensions: editorExtensions,
    });

    setEditorView(
      new EditorView({
        state: startState,
        parent: document.getElementById("editor"),
      })
    );
  }, []);

  const handleFileOpen = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDoc(ev.target.result);
      const newState = EditorState.create({
        doc: ev.target.result,
        extensions: editorExtensions,
      });
      editorView.setState(newState);
    };
    reader.readAsText(file);

    setFileName(file.name);
  };

  const downloadFile = () => {
    const b64doc = btoa(doc);
    console.log(b64doc, doc);
    const a = document.createElement("a");
    const e = new MouseEvent("click");

    a.download = fileName ? fileName : "doc.md";
    a.href = "data:text/plain;base64," + b64doc;
    a.dispatchEvent(e);
  };

  const inputRef = useRef(null);
  return (
    <>
      <div id="buttons">
        <button onClick={downloadFile}>Save</button>
        <input
          type="file"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleFileOpen}
        />
        <button onClick={() => inputRef.current.click()}>Open file</button>
        {fileName && <p>File name: {fileName}</p>}
      </div>
      <div id="app">
        <div id="editor"></div>
        <div id="previewer">{md}</div>
      </div>
    </>
  );
}

export default App;
