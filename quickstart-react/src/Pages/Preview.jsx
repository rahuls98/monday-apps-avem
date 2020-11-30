import React from "react";
import "../App.css";
import mondaySdk from "monday-sdk-js";
const monday = mondaySdk();

class Preview extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audioEvents: {},
            disablePlay: false
        };
    }

    playAudio = (id, delay) => {
        id = id.slice(1, id.length-1);
        const audio = document.getElementById(id);
        const toPlay = new Audio(audio.src)
        setTimeout(() => { toPlay.play(); }, (delay * 1000))
        return;
    }
    
    playFinal = () => {
        const video = document.querySelector('video');
        this.setState({disablePlay: true});
        video.play();
        setTimeout(() => {
            this.setState({disablePlay: false});
        }, (video.duration * 1000))

        Object.keys(this.state.audioEvents).forEach(timestamp => this.playAudio(this.state.audioEvents[timestamp], timestamp));
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

            /** ------ API for getting linkedPulseIds from subitems ------ */
            monday.api(
                `query ($itemId: [Int], $eventsColId: [String]) {
                    items (ids: $itemId) {
                        column_values (ids: $eventsColId) {
                            value
                        }     
                    }
                }`,
                { variables: {
                    itemId: this.state.context.itemId,
                    eventsColId: this.state.events_col
                } }
            ).then(res => {
                const out = JSON.parse(res.data.items[0].column_values[0].value);
                const pulseIds = [];

                if(Object.keys(out).length > 0) {
                    out.linkedPulseIds.forEach(item => pulseIds.push(item.linkedPulseId));
                    pulseIds.shift()
                
                    /** ------ API for getting audio events from subitems ------ */
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
                }
            })
        });
    };

    render() {
        return (
            <div className="container">
                <div className="preview-container">
                    <div className="horizontal-navbar">
                        <button type="button" className="back-btn" onClick={e => this.props.setView({landing:true,editor:false,preview:false})}>Back</button>
                        <span className="navbar-links" id="p-video-nav" style={{color:"#cf7500"}}>Preview</span>
                    </div>
                    <div className="preview-content">
                        {
                            (Object.keys(this.state.audioEvents).length > 0) ?
                            <div className="video_container">
                                { this.state.videoUrl ?
                                    <div>  
                                        { this.state.audioAssets ? 
                                            this.state.audioAssets.map(asset => <audio key={asset.name} id={asset.name} src={asset.public_url}></audio>): null
                                        }
                                        <video src={this.state.videoUrl}></video>
                                        <br/>
                                        <div>
                                            <button type="button" disabled={this.state.disablePlay} className="btn btn-light" onClick={e => this.playFinal()}>Play</button>
                                        </div>
                                    </div>
                                    : <div className="video_container">
                                        <p style={{textAlign:"center", marginTop:"20px"}}>
                                        "Video unavailable!"
                                        </p>
                                    </div>
                                }
                            </div> : 
                            <div className="video_container">
                                <p style={{textAlign:"center", marginTop:"20px"}}>
                                    Preview unavailable! <br/>Please use the editor to add events.
                                </p>
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default Preview;