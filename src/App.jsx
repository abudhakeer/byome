import { useState, createElement, Fragment, useRef } from "react";
import "./App.css";
import { unified } from "unified";
import remarkParse from "remark-parse/lib";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react/lib";
import useCodemirror from "./useCodemirror";

let treeData;

function App() {
  const [doc, setDoc] = useState("#Hello byome");
  const [editorRef, editorView] = useCodemirror({ initialDoc: doc, setDoc });
  const mouseIsOn = useRef(null);

  const defaultPlugin = () => (tree) => {
    treeData = tree; //treeData length corresponds to previewer's childNodes length
    return tree;
  };

  const markdownElem = document.getElementById("markdown");
  const previewElem = document.getElementById("preview");

  const computeElemsOffsetTop = () => {
    let markdownChildNodesOffsetTopList = [];
    let previewChildNodesOffsetTopList = [];

    treeData.children.forEach((child, index) => {
      if (child.type !== "element" || child.position === undefined) return;

      const pos = child.position.start.offset;
      const lineInfo = editorView.lineBlockAt(pos);
      const offsetTop = lineInfo.top;
      markdownChildNodesOffsetTopList.push(offsetTop);
      previewChildNodesOffsetTopList.push(
        previewElem.childNodes[index].offsetTop -
          previewElem.getBoundingClientRect().top //offsetTop from the top of preview
      );
    });

    return [markdownChildNodesOffsetTopList, previewChildNodesOffsetTopList];
  };
  const handleMdScroll = () => {
    console.log(mouseIsOn.current);
    if (mouseIsOn.current !== "markdown") {
      return;
    }
    const [markdownChildNodesOffsetTopList, previewChildNodesOffsetTopList] =
      computeElemsOffsetTop();
    let scrollElemIndex;
    for (let i = 0; markdownChildNodesOffsetTopList.length > i; i++) {
      if (markdownElem.scrollTop < markdownChildNodesOffsetTopList[i]) {
        scrollElemIndex = i - 1;
        break;
      }
    }

    if (
      markdownElem.scrollTop >=
      markdownElem.scrollHeight - markdownElem.clientHeight //true when scroll reached the bottom
    ) {
      previewElem.scrollTop =
        previewElem.scrollHeight - previewElem.clientHeight; //scroll to the bottom
      return;
    }

    if (scrollElemIndex >= 0) {
      let ratio =
        (markdownElem.scrollTop -
          markdownChildNodesOffsetTopList[scrollElemIndex]) /
        (markdownChildNodesOffsetTopList[scrollElemIndex + 1] -
          markdownChildNodesOffsetTopList[scrollElemIndex]);
      previewElem.scrollTop =
        ratio *
          (previewChildNodesOffsetTopList[scrollElemIndex + 1] -
            previewChildNodesOffsetTopList[scrollElemIndex]) +
        previewChildNodesOffsetTopList[scrollElemIndex];
    }
  };

  const handlePreviewScroll = () => {
    if (mouseIsOn.current !== "preview") {
      return;
    }
    const [markdownChildNodesOffsetTopList, previewChildNodesOffsetTopList] =
      computeElemsOffsetTop();
    let scrollElemIndex;
    for (let i = 0; previewChildNodesOffsetTopList.length > i; i++) {
      if (previewElem.scrollTop < previewChildNodesOffsetTopList[i]) {
        scrollElemIndex = i - 1;
        break;
      }
    }

    if (scrollElemIndex >= 0) {
      let ratio =
        (previewElem.scrollTop -
          previewChildNodesOffsetTopList[scrollElemIndex]) /
        (previewChildNodesOffsetTopList[scrollElemIndex + 1] -
          previewChildNodesOffsetTopList[scrollElemIndex]);
      markdownElem.scrollTop =
        ratio *
          (markdownChildNodesOffsetTopList[scrollElemIndex + 1] -
            markdownChildNodesOffsetTopList[scrollElemIndex]) +
        markdownChildNodesOffsetTopList[scrollElemIndex];
    }
  };

  const md = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(defaultPlugin)
    .use(rehypeReact, { createElement, Fragment })
    .processSync(doc).result;

  return (
    <>
      <div id="editor-wrapper">
        <div
          id="markdown"
          ref={editorRef}
          onScroll={handleMdScroll}
          onMouseEnter={() => (mouseIsOn.current = "markdown")}
        ></div>
        <div
          id="preview"
          className="markdown-body"
          onScroll={handlePreviewScroll}
          onMouseEnter={() => (mouseIsOn.current = "preview")}
        >
          {md}
        </div>
      </div>
    </>
  );
}

export default App;
