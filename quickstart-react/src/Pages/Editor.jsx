import React from "react";
import "../App.css";
import mondaySdk from "monday-sdk-js";
const monday = mondaySdk();

class Editor extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            settings: {},
            modalSeen: false,
            timestamp: 0,
            navs:["e-audio-nav","e-editor-nav","e-video-nav"],
            slide: 1,
            eventTitle: "",
            eventsList: {},
        }
    }

    audioItemStyle = {
        padding: "20px",
        fontSize: "2vw",
        borderBottom: "gainsboro solid 1px",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    }
    audioTitleStyle = {
        height: "fit-content",
        padding: "2px 5px 2px 5px",
        background: "#cf750080",
        borderRadius: "5px",
        color: "white"
    }
    eventItemStyle = {
        padding: "20px",
        fontSize: "2vw",
        borderBottom: "grey solid 1px",
        color: "white"
    }
    timestampStyle = {
        padding: "2px 5px 2px 5px",
        background: "#cf750080",
        borderRadius: "5px",
        color: "white"
    }
    titleStyle = {
        color: "white",
        fontSize: "3vw"
    }
    dropdownStyle = {
        height: "25vh",
        overflowY: "scroll",
        background: "#101010",
        textAlign: "center",
        padding: "10px"
    }

    handleToggleModal = () => {
        if(this.state.modalSeen) {
            this.setState({modalSeen: !this.state.modalSeen});
            this.setState({eventTitle: ""});
        } else {
            this.setState({modalSeen: !this.state.modalSeen});
            const v = document.querySelector("video"); 
            v.pause(); 
            this.setState({timestamp: v.currentTime});
        }
    }

    handleAddEvent = () => {
        const tempObj = {...this.state.eventsList};
        tempObj[`${this.state.timestamp.toString()}`] = {
            title: this.state.eventTitle, 
            timestamp: this.state.timestamp, 
            audio: ""
        }; 
        this.setState({eventsList: {...tempObj} });
        this.setState({eventTitle: ""});
    }

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

    handleAttachAudio = (e, ts, audio) => {
        e.preventDefault();
        const tempObj = {...this.state.eventsList};
        tempObj[ts].audio = audio;
        this.setState({eventsList: {...tempObj} });
    }

    handleDeleteEvent = (e, timestamp) => {
        e.preventDefault();
        const tempObj = {...this.state.eventsList};
        delete tempObj[timestamp];
        this.setState({eventsList: {...tempObj} });
    }

    handleSubmitEvents = (e) => {
        e.preventDefault();
        Object.keys(this.state.eventsList).forEach(timestamp => {
            const column_values = { "text": this.state.eventsList[timestamp].timestamp, "text5": this.state.eventsList[timestamp].audio }
            /** ------ API for new subitem creation ------ */
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

    setActive = (id) => {
        this.state.navs.forEach((navId,index) => {
            const ele = document.getElementById(navId);
            if(id === navId) {
                let curr = index+1;
                ele.style.color = "#cf7500";
                this.setState({slide: curr});
            }
            else ele.style.color = "white";
        });
    }

    setContent = (slide) => {
        switch(slide){
            case 1:
                return (
                    <>
                        <div className="audio_container">
                            { this.state.audioAssets ? 
                                this.state.audioAssets.map(asset => {
                                    return (
                                        <div key={asset.name} style={this.audioItemStyle}>
                                            <span style={this.audioTitleStyle}>{asset.name}</span>
                                            <audio controls id={asset.name} src={asset.public_url}></audio>
                                        </div>
                                    )
                                }): <p style={{textAlign:"center", marginTop:"20px"}}>"Audio unavailable!"</p>
                            }
                        </div>
                    </>
                )
            case 2:
                return (
                    <div className="video_container">
                        { this.state.videoUrl ?
                            <div>  
                                <video controls src={this.state.videoUrl}></video>
                                <br/>
                                <div>
                                    {/* <button className="activity-btn" type="button" onClick={e => this.handleToggleForm()}>Add event</button> */}
                                    <button type="button" className="btn btn-light" data-toggle="modal" data-target=".bd-example-modal-sm" onClick={e => this.handleToggleModal()}>Add event</button>
                                    <div className="modal fade bd-example-modal-sm" tabIndex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
                                        <div className="modal-dialog modal-sm">
                                            <div className="modal-content">
                                                <div className="modal-header">
                                                    <h5 className="modal-title">New event</h5>
                                                    <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={e => this.handleToggleModal()}>
                                                        <span aria-hidden="true">&times;</span>
                                                    </button>
                                                </div>
                                                <div className="modal-body">
                                                    <p>
                                                        Timestamp: {this.timeFormat(this.state.timestamp)} <br/><br/>
                                                        <input style={{width:"100%",color:"black"}} autoComplete="off" type="text" id="inlineFormInputName" placeholder="Event title"
                                                                value={this.state.eventTitle} onChange={e=>this.setState({eventTitle: e.target.value})}
                                                        />
                                                    </p>
                                                </div>
                                                <div className="modal-footer">
                                                    <button type="button" className="secondary-btn" data-dismiss="modal" onClick={e => this.handleToggleModal()}>Close</button>
                                                    <button type="button" className="primary-btn" onClick={e => this.handleAddEvent()}>Add</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            : <div className="video_container">
                                <p style={{textAlign:"center", marginTop:"20px"}}>
                                "Video unavailable!"
                                </p>
                            </div>
                        }
                    </div>
                )
            case 3:
                return (
                    <>
                        <div className="event_list_container">
                            {(Object.keys(this.state.eventsList).length > 0) ?
                                Object.keys(this.state.eventsList).sort().map(timestamp => {
                                    return (
                                    <div key={timestamp} style={ this.eventItemStyle }>
                                        <span style={this.timestampStyle}>{this.timeFormat(this.state.eventsList[timestamp].timestamp)}</span>
                                        <span style={this.titleStyle}>{` : ${this.state.eventsList[timestamp].title} `}</span>
                                        {(this.state.eventsList[timestamp].audio) ? <span>{`-> `}<span style={this.timestampStyle}>{`${this.state.eventsList[timestamp].audio}`}</span></span> : null}
                                        <button className="secondary-btn" style={{float:"right", marginLeft:"10px"}}
                                            onClick={e => this.handleDeleteEvent(e,timestamp)}
                                            ><i className="fa fa-trash"></i>
                                        </button>
                                        <button className="primary-btn dropdown-toggle" type="button" id="dropdownMenuButton" 
                                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{float:"right"}}>
                                            Attach
                                        </button>
                                        <div style={this.dropdownStyle} className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                            {
                                                this.state.audioAssets.map(asset => {
                                                    return (
                                                        <div key={asset.name}>
                                                            <button className="btn btn-light" style={{width:"100%", marginBottom:"5px"}} onClick={e => this.handleAttachAudio(e,timestamp,asset.name)}>{asset.name}</button>
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
                        {(Object.keys(this.state.eventsList).length > 0) ? 
                            <p style={{textAlign:"center", marginTop:"10px"}}>
                                <button className="btn btn-light" onClick={e => this.handleSubmitEvents(e)}>Submit events</button>
                            </p> : null 
                        }
                    </>
                )
            default: break;
        }
    }

    componentDidMount = () => {
        monday.listen("settings", res => {
            const tempObj = {};
            Object.keys(res.data).forEach(dependency => {
                if(res.data[dependency]) {
                    tempObj[`${dependency}_col`] = Object.keys(res.data[dependency])[0];
                }
            }) 
            this.setState({ ...tempObj });
        });

        monday.listen("context", res => {
            this.setState({context: res.data});

            /** ------ API for getting audio asset urls ------ */
            monday.api(
                `query ($itemId: [Int], $audioColId: [String]) { 
                    items(ids: $itemId) { 
                        assets(column_ids: $audioColId) {
                            name
                            public_url
                        } 
                    } 
                }`,
                { variables: {
                    itemId: this.state.context.itemId,
                    audioColId: this.state.audio_col
                } }
            ).then(res => {
                if((res.data.items[0].assets).length > 0)
                    this.setState({audioAssets: res.data.items[0].assets})
            });

            /** ------ API for getting video urls ------ */
            monday.api(
                `query ($itemId: [Int], $videoColId: [String]) { 
                    items(ids: $itemId) { 
                        assets(column_ids: $videoColId) {
                            public_url
                        } 
                    } 
                }`,
                { variables: {
                    itemId: this.state.context.itemId,
                    videoColId: this.state.video_col
                } }
            ).then(res => {
                if((res.data.items[0].assets.length) > 0)
                    this.setState({videoUrl: res.data.items[0].assets[0].public_url})
            });
        });
    };

    render() {
        return (
            <div className="container">
                <div className="editor-container">
                    <div className="horizontal-navbar">
                        <button type="button" className="back-btn" onClick={e => this.props.setView({landing:true,editor:false,preview:false})}>Back</button>
                        <span className="navbar-links" id="e-audio-nav" style={{color:"#cf7500"}} onClick={e=>this.setActive(e.target.id)}>Assets</span>
                        <span className="navbar-links" id="e-editor-nav" onClick={e=>this.setActive(e.target.id)}>Editor</span>
                        <span className="navbar-links" id="e-video-nav" onClick={e=>this.setActive(e.target.id)}>Events</span>
                    </div>
                    <div className="editor-content">
                        {this.setContent(this.state.slide)}
                    </div>
                </div>
            </div>
        )
    }
}

export default Editor;