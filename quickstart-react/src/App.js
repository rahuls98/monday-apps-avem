import React,{useState} from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
const monday = mondaySdk();

/** ------ AVEM Editor ------ */
class Editor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            formSeen: false,
            eventTitle: "",
            eventsList: {}
        };
    }

    /** ------ AVEM Editor - Styles ------ */
    eventItemStyle = {
        padding: "20px",
        fontSize: "2vw",
        borderBottom: "grey solid 1px",
        color: "white"
    }
    timestampStyle = {
        padding: "2px 5px 2px 5px",
        border: "#0d7377 solid 1px",
        background: "#0d7377",
        borderRadius: "5px",
        color: "white"
    }
    titleStyle = {
        color: "white"
    }
    audioItemStyle = {
        padding: "20px",
        fontSize: "2vw",
        borderBottom: "gainsboro solid 1px",
        color: "white",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center"
    }
    audioTitleStyle = {
        height: "fit-content",
        padding: "2px 5px 2px 5px",
        border: "#0d7377 solid 1px",
        background: "#0d7377",
        borderRadius: "5px",
        color: "white"
    }

    /** ------ AVEM Editor - Handler for form toggling ------ */
    handleToggleForm = () => {
        if(this.state.formSeen) {
            this.setState({formSeen: !this.state.formSeen});
            this.setState({eventTitle: ""});
        } else {
            this.setState({formSeen: !this.state.formSeen});
            const v = document.querySelector("video"); 
            v.pause(); 
            this.setState({timestamp: v.currentTime});
        }
    }

    /** ------ AVEM Editor - Handler for new event addition ------ */
    handleAddEvent = () => {
        const tempObj = {...this.state.eventsList};
        tempObj[`${this.state.timestamp.toString()}`] = {
            title: this.state.eventTitle, 
            timestamp: this.state.timestamp, 
            audio: ""
        }; 
        this.setState({eventsList: {...tempObj} });
        this.handleToggleForm();
    }

    /** ------ AVEM Editor - Handler for event deletion ------ */
    handleDeleteEvent = (e, timestamp) => {
        e.preventDefault();
        const tempObj = {...this.state.eventsList};
        delete tempObj[timestamp];
        this.setState({eventsList: {...tempObj} });
    }

    /** ------ AVEM Editor - Handler for time formatting ------ */
    timeFormat = (seconds) => {
        let m,s,ms;
        let duration = seconds*1000;
        ms = parseInt(duration%1000);
        s = parseInt((duration/1000)%60);
        m = parseInt((duration/(1000*60))%60);
        m = (m < 10) ? "0" + m : m;
        s = (s < 10) ? "0" + s : s;
        ms = (ms < 10) ? "00" + ms : (ms < 100) ? "0" + ms : ms;
        return(`${m}:${s}:${ms}`);
    }

    /** ------ AVEM Editor - Handler for audio-event attachment ------ */
    handleAttachAudio = (e, ts, audio) => {
        e.preventDefault();
        const tempObj = {...this.state.eventsList};
        tempObj[ts].audio = audio;
        this.setState({eventsList: {...tempObj} });
    }

    /** ------ AVEM Editor - Handler for event submission ------ */
    handleSubmitEvents = (e) => {
        e.preventDefault();
        Object.keys(this.state.eventsList).forEach(timestamp => {
            const column_values = { "timestamp": this.state.eventsList[timestamp].timestamp, "assetid": this.state.eventsList[timestamp].audio }
            /** ------ AVEM Editor - API for new subitem creation ------ */
            monday.api(
                `mutation ($parent_item_id: Int, $item_name: String, $column_values: JSON) {
                    create_subitem(parent_item_id: $parent_item_id, item_name: $item_name, column_values: $column_values) { 
                        id 
                    } 
                }`,
                { variables: {
                    parent_item_id: this.state.context.itemId, 
                    item_name: this.state.eventsList[timestamp].title, 
                    column_values: JSON.stringify(column_values) 
                }}
            ).then(res => {
                this.props.setView({landing: false,editor: false,preview: true})
            });
        })
    }
    
    /** ------ AVEM Editor - Component Did Mount ------ */
    componentDidMount = () => {
        monday.listen("context", res => {
            this.setState({context: res.data});
            /** ------ AVEM Editor - API for getting audio and video asset ids ------ */
            monday.api(
                `query ($itemId: [Int]) { 
                    items(ids:$itemId) { 
                        column_values (ids: ["file", "file_1"]) {
                            value
                        } 
                    } 
                }`,
                { variables: {itemId: this.state.context.itemId} }
            ).then(res => {
                const videoAssetId = JSON.parse(res.data.items[0].column_values[0].value).files[0].assetId;
                const audioAssetIds = [];
                JSON.parse(res.data.items[0].column_values[1].value).files.map( file => audioAssetIds.push(file.assetId));
                this.setState({videoAssetId, audioAssetIds});

                /** ------ AVEM Editor - API for getting audio urls ------ */
                monday.api(
                    `query ($assetId: [Int]!) { 
                        assets(ids: $assetId) { 
                            name 
                            public_url 
                        } 
                    }`,
                    { variables: {assetId: this.state.audioAssetIds} }
                ).then(res2 => this.setState({audioAssets: res2.data.assets}));

                /** ------ AVEM Editor - API for getting video urls ------ */
                monday.api(
                    `query ($assetId: [Int]!) { 
                        assets(ids: $assetId) { 
                            public_url 
                        } 
                    }`,
                    { variables: {assetId: this.state.videoAssetId} }
                ).then(res3 => this.setState({videoUrl: [res3.data.assets[0].public_url]}));
            });
        });
    };

    /** ------ AVEM Editor - render ------ */
    render () {
        return (
            <>
                <div className="container-fluid">
                    {/** ------ AVEM Editor - Editor tabs ------ */}
                    <ul className="nav nav-pills mb-3" id="pills-tab" role="tablist">
                        <li className="nav-item">
                            <button className="back-btn" type="button" 
                            onClick={e => this.props.setView({landing: true,editor: false,preview: false})}
                            >Home</button>
                        </li>
                        <li className="nav-item">
                            <button className="tab-btn active" id="pills-audio-tab" data-toggle="pill" 
                            href="#pills-audio" role="tab" aria-controls="pills-audio" aria-selected="true">Audio Assets</button>
                        </li>
                        <li className="nav-item">
                            <button className="tab-btn" id="pills-video-tab" data-toggle="pill" 
                            href="#pills-video" role="tab" aria-controls="pills-video" aria-selected="false">Event Selector</button>
                        </li>
                        <li className="nav-item">
                            <button className="tab-btn" id="pills-events-tab" data-toggle="pill" 
                            href="#pills-events" role="tab" aria-controls="pills-events" aria-selected="false">Event List</button>
                        </li>
                    </ul>
                    {/** ------ AVEM Editor - Editor tab content ------ */}
                    <div className="tab-content" id="pills-tabContent">
                        {/** ------ AVEM Editor - Audio contents ------ */}
                        <div className="tab-pane fade show active" id="pills-audio" role="tabpanel" aria-labelledby="pills-audio-tab">
                            <div className="audio_container">
                                { this.state.audioAssets ? 
                                    this.state.audioAssets.map(asset => {
                                        return (
                                            <div key={asset.name} style={this.audioItemStyle}>
                                                <span style={this.audioTitleStyle}>{asset.name}</span>
                                                <audio controls id={asset.name} src={asset.public_url}></audio>
                                            </div>
                                        )
                                    }): <p style={{textAlign:"center", marginTop:"20px"}}>"Loading assets!"</p>
                                }
                            </div>
                        </div>
                        {/** ------ AVEM Editor - Video player ------ */}
                        <div className="tab-pane fade" id="pills-video" role="tabpanel" aria-labelledby="pills-video-tab">
                            { this.state.videoUrl ?
                                <div>  
                                    <video controls src={this.state.videoUrl}></video>
                                    <div>
                                        <button className="secondary-btn" type="button" onClick={e => this.handleToggleForm()}>Add</button>
                                        { this.state.formSeen ?
                                        <form id="event_form_container">
                                            <input autoComplete="off" type="text" id="inlineFormInputName" placeholder="Event title"
                                                    value={this.state.eventTitle} onChange={e=>this.setState({eventTitle: e.target.value})}
                                            />
                                            <button type="button" className="btn btn-primary" onClick={e => this.handleAddEvent()}><i className="fa fa-plus"></i></button>
                                            <button type="button" className="btn btn-danger" onClick={e => this.handleToggleForm()}><i className="fa fa-times"></i></button>
                                        </form> : null }
                                    </div>
                                </div>
                                : "Loading video!" 
                            }
                        </div>
                        {/** ------ AVEM Editor - Event List ------ */}
                        <div className="tab-pane fade" id="pills-events" role="tabpanel" aria-labelledby="pills-events-tab">
                            <div className="event_list_container">
                                { (Object.keys(this.state.eventsList).length > 0) ?
                                    Object.keys(this.state.eventsList).sort().map(timestamp => {
                                        return (
                                        <div key={timestamp} style={ this.eventItemStyle }>
                                            <span style={this.timestampStyle}>{this.timeFormat(this.state.eventsList[timestamp].timestamp)}</span>
                                            <span style={this.titleStyle}>{` : ${this.state.eventsList[timestamp].title} `}</span>
                                            {(this.state.eventsList[timestamp].audio) ? <span>{`-> `}<span style={this.timestampStyle}>{`${this.state.eventsList[timestamp].audio}`}</span></span> : null}
                                            <button className="btn btn-danger" style={{float:"right", marginLeft:"10px"}}
                                                onClick={e => this.handleDeleteEvent(e,timestamp)}
                                                ><i className="fa fa-trash"></i>
                                            </button>
                                            <button className="secondary-btn dropdown-toggle" type="button" id="dropdownMenuButton" 
                                                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{float:"right"}}>
                                                Attach audio
                                            </button>
                                            <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                                {
                                                    this.state.audioAssets.map(asset => {
                                                        return (
                                                            <div key={asset.name}>
                                                                <button onClick={e => this.handleAttachAudio(e,timestamp,asset.name)}>{asset.name}</button>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </div>
                                        )
                                    }) : <p style={{textAlign:"center", marginTop:"20px"}}>"No events attached!"</p>
                                }
                            </div>
                            { (Object.keys(this.state.eventsList).length > 0) ? 
                                <p style={{textAlign:"center", marginTop:"5px"}}>
                                    <button className="secondary-btn" onClick={e => this.handleSubmitEvents(e)}>Submit events</button>
                                </p> : null 
                            }
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

/** ------ AVEM Preview ------ */
class Preview extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audioEvents: []
        };
    }

    /** ------ AVEM Preview - Handler for playing audio ------ */
    playAudio = (id, delay) => {
        id = id.slice(1, id.length-1);
        const audio = document.getElementById(id);
        setTimeout(() => {
            audio.play();
        }, (delay * 1000))
        return;
    }
    
    /** ------ AVEM Preview - Handler for video onPlay() ------ */
    playFinal = () => {
        Object.keys(this.state.audioEvents).forEach(timestamp => this.playAudio(this.state.audioEvents[timestamp], timestamp));
    }
    
    /** ------ AVEM Preview - Component Did Mount ------ */
    componentDidMount = () => {
        monday.listen("context", res => {
            this.setState({context: res.data});

            /** ------ AVEM Preview - API for getting video and audio asset ids ------ */
            monday.api(
                `query ($itemId: [Int]) { 
                    items(ids:$itemId) { 
                        column_values (ids: ["file", "file_1"]) {
                            value
                        } 
                    } 
                }`,
                { variables: {itemId: this.state.context.itemId} }
            ).then(res => {
                const videoAssetId = JSON.parse(res.data.items[0].column_values[0].value).files[0].assetId;
                const audioAssetIds = [];
                JSON.parse(res.data.items[0].column_values[1].value).files.map( file => audioAssetIds.push(file.assetId));
                this.setState({videoAssetId, audioAssetIds});

                /** ------ AVEM Editor - API for getting audio urls ------ */
                monday.api(
                    `query ($assetId: [Int]!) { 
                        assets(ids: $assetId) { 
                            name 
                            public_url 
                        } 
                    }`,
                    { variables: {assetId: this.state.audioAssetIds} }
                ).then(res2 => this.setState({audioAssets: res2.data.assets}));

                /** ------ AVEM Editor - API for getting video url ------ */
                monday.api(
                    `query ($assetId: [Int]!) { 
                        assets(ids: $assetId) { 
                            public_url 
                        } 
                    }`,
                    { variables: {assetId: this.state.videoAssetId} }
                ).then(res3 => this.setState({videoUrl: [res3.data.assets[0].public_url]}));
            });

            /** ------ AVEM Editor - API for getting linkedPulseIds from subitems ------ */
            monday.api(
                `query ($itemId: [Int]) {
                    items (ids: $itemId) {
                        column_values (ids: "subitems4") {
                            value
                        }     
                    }
                }`,
                { variables: {itemId: this.state.context.itemId} }
            ).then(res => {
                const out = JSON.parse(res.data.items[0].column_values[0].value);
                const pulseIds = [];
                out.linkedPulseIds.forEach(item => pulseIds.push(item.linkedPulseId));
                
                 /** ------ AVEM Editor - API for getting audio events from subitems ------ */
                monday.api(
                    `query ($itemIds: [Int]){
                        items (ids: $itemIds) {
                            column_values {
                                id
                                value
                            }   
                        }
                    }`,
                    { variables: {itemIds: pulseIds} }
                ).then(res2 => {
                    const items = res2.data.items;
                    const audioEvents = {};
                    items.forEach(item => {
                        audioEvents[item.column_values[0].value] = item.column_values[1].value;
                    })
                    this.setState({audioEvents});
                })
            })
        });
    };

    render() {
        return (
            <>
                <div className="container-fluid">
                    {/** ------ AVEM Preview - Preview tabs ------ */}
                    <ul className="nav nav-pills mb-3" id="pills-tab" role="tablist">
                        <li className="nav-item">
                            <button className="back-btn" type="button" 
                            onClick={e => this.props.setView({landing: true,editor: false,preview: false})}
                            >Home</button>
                        </li>
                        <li className="nav-item">
                            <button className="tab-btn active" id="pills-finalcut-tab" data-toggle="pill" 
                            href="#pills-finalcut" role="tab" aria-controls="pills-finalcut" aria-selected="true">Final Cut</button>
                        </li>
                    </ul>
                    {/** ------ AVEM Preview - Preview tab content ------ */}
                    <div className="tab-content" id="pills-tabContent">
                        <div className="tab-pane fade show active" id="pills-finalcut" role="tabpanel" aria-labelledby="pills-finalcut-tab">
                            <div className="final_cut_container">
                            { this.state.audioAssets ? 
                                this.state.audioAssets.map(asset => <audio key={asset.name} id={asset.name} src={asset.public_url}></audio>)
                                : null
                            }
                            <video controls src={this.state.videoUrl} onPlay={() => this.playFinal()}></video>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

/** ------ AVEM Landing ------ */
const Landing = ({ setView }) => {
    return (
        <div className="container">
            <div className="button_container">
                <p><button type="button" className="primary-btn" onClick={e => setView({landing: false,editor: true,preview: false})}>Editor</button></p>
                <p><button type="button" className="primary-btn" onClick={e => setView({landing: false,editor: false,preview: true})}>Preview</button></p>
            </div>
        </div>
    )
}

/** ------ AVEM App ------ */
const App = () => {
    const [view, setView] = useState({
        landing: true,
        editor: false,
        preview: false
    });
    return (
        <>
            <header><h1>AVEM</h1></header>
            { view.landing ? <Landing setView={setView}/> : null }
            { view.editor ? <Editor setView={setView}/> : null }
            { view.preview ? <Preview setView={setView}/> : null }
        </>
    )
}

export default App;