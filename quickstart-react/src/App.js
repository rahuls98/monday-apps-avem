import React,{useState} from "react";
import "./App.css";

import Landing from './Pages/Landing';
import Editor from './Pages/Editor';
import Preview from './Pages/Preview';

const App = () => {
    const [view, setView] = useState({
        landing: true,
        editor: false,
        preview: false
    });
    return (
        <>
            <header><h1>
                AVEM <span>Studio</span>
            </h1></header>
            { view.landing ? <Landing setView={setView}/> : null }
            { view.editor ? <Editor setView={setView}/> : null }
            { view.preview ? <Preview setView={setView}/> : null } 
        </>
    )
}

export default App;