import React from "react";
import "../App.css";
import mondaySdk from "monday-sdk-js";
const monday = mondaySdk();

class Checklist extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            items: [
                {id:1, dependency:"File column to contain base video.", status:this.props.dependencies.video_col},
                {id:2, dependency:"File column to contain audio assets.", status:this.props.dependencies.audio_col},
                {id:3, dependency:"Subitems column to contain selected events.", status:this.props.dependencies.events_col}
            ]
        }
    }

    itemStyleDone = {
        margin: "2px 0 2px 0",
        background: "#cf750050",
        padding: "7px 10px 7px 10px",
        borderRadius: "5px"
    }
    itemStylePending = {
        margin: "2px 0 2px 0",
        background: "rgb(39, 39, 39)",
        padding: "7px 10px 7px 10px",
        borderRadius: "5px"
    }

    render() {
        return (
            <div style={{display:"flex", justifyContent:"center"}}>
                <div className="item-list-style">
                    {
                        this.state.items.map(item => {
                            return (
                                <div key={item.id} style={(item.status)?this.itemStyleDone:this.itemStylePending}>
                                    {
                                        (item.status)?
                                        <span>{item.dependency} <i className="fa fa-check-circle" style={{color:"green",float:"right"}}></i></span> :
                                        <span>{item.dependency} <i className="fa fa-exclamation-triangle" style={{color:"red",float:"right"}}></i></span>
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        )
    }
}

class Landing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dependencies: {},
            disableEditor: true,
            disablePreview: true,
            navs:["about-nav","editor-nav","preview-nav","instr-nav"],
            slide: 1
        }
    }

    tooltipStyle = {
        color:"#cf7500", 
        marginLeft: "10px"
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
                        <p>
                            Use AVEM to test the suitability of audio assets
                            for your demo video, right within the Monday Platform.

                        </p>
                        <br/>
                        <div className="about-logo-btn">
                            <button type="button" disabled={this.state.disableEditor} className="activity-btn" onClick={e => this.props.setView({landing:false,editor:true,preview:false})}>Editor</button>
                            <img id="avem-logo" src={process.env.PUBLIC_URL + '/AVEM-logo.png'} alt="logo" style={{height:"15vh", borderRadius:"50%"}}></img>
                            <button type="button" disabled={this.state.disablePreview} className="activity-btn" onClick={e => this.props.setView({landing:false,editor:false,preview:true})}>Preview</button>
                        </div>
                    </>
                )
            case 2:
                return (
                    <div>
                        <p>
                            Use the editor to add events in the base video and 
                            attach corresponding audio assets.
                            <i style={this.tooltipStyle} className="fa fa-info-circle"
                            data-toggle="tooltip" data-placement="right" title="The editor is enabled when the video and audio dependencies are handled.">
                            </i>
                            <br/><br/><br/>
                            <button className="activity-btn" disabled={this.state.disableEditor} onClick={e => this.props.setView({landing:false,editor:true,preview:false})}>Editor</button>
                        </p>
                    </div>
                )
            case 3:
                return (
                    <div>
                        <p>
                            Preview the final cut with the mixed audio and video.
                            <i style={this.tooltipStyle} className="fa fa-info-circle"
                            data-toggle="tooltip" data-placement="right" title="The preview is enabled when the video, audio and event dependencies are handled.">
                            </i>
                            <br/><br/><br/>
                            <button className="activity-btn" disabled={this.state.disablePreview} onClick={e => this.props.setView({landing:false,editor:false,preview:true})}>Preview</button>
                        </p>
                    </div>
                )
            case 4:
                return (
                    <div>
                        <p style={{margin: "0 0 25px 0"}}>
                            AVEM requires a few dependencies to be satisfied.
                            Use the settings option above to handle these dependencies.
                        </p>
                        <Checklist dependencies={this.state.dependencies}/>
                    </div>
                )
            default: break;
        }
    }

    componentDidMount = () => {
        monday.listen("settings", res => {
            const tempObj = {};
            Object.keys(res.data).forEach(dependency => {
                if(res.data[dependency]) {
                    tempObj[`${dependency}_col`] = Object.values(res.data[dependency])[0];
                }
            }) 
            this.setState({ dependencies: tempObj });
            if(tempObj.video_col && tempObj.audio_col) {
                this.setState({ disableEditor: false });

                if(tempObj.events_col) {
                    this.setState({ disablePreview: false });
                } else {
                    this.setState({ disablePreview: true });
                }
            } else {
                this.setState({ disableEditor: true });
                this.setState({ disablePreview: true });
            }
        });
    }

    render() {
        return (
            <div className="container">
                <div className="landing-container">
                    <div className="horizontal-navbar">
                        <span className="navbar-links" id="about-nav" style={{color:"#cf7500"}} onClick={e=>this.setActive(e.target.id)}>About</span>
                        <span className="navbar-links" id="editor-nav" onClick={e=>this.setActive(e.target.id)}>Editor</span>
                        <span className="navbar-links" id="preview-nav" onClick={e=>this.setActive(e.target.id)}>Preview</span>
                        <span className="navbar-links" id="instr-nav" onClick={e=>this.setActive(e.target.id)}>Help</span>
                    </div>
                    <div className="landing-content">
                        {this.setContent(this.state.slide)}
                    </div>
                </div>

                {
                    ((this.state.disableEditor || this.state.disablePreview) && ([1,2,3].includes(this.state.slide)))?
                    <span id="instructions-warning-span"><i className="fa fa-question-circle"></i>Something not right? Head over to the 'Help' section.</span> :
                    null
                }
            </div>
        )
    }
}

export default Landing;