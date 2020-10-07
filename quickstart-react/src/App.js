import React from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
const monday = mondaySdk();

class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      name: "",
      event:"",
      eventList: [],
      finalEvents: []
    };
  }

  playAudio = (id, delay) => {
    id = id.slice(1, id.length-1);
    const audio = document.getElementById(id);
    setTimeout(() => {
        audio.play();
    }, (delay * 1000))
    return;
}

  playFinal = () => {
    console.log(this.state.audioEvents);
    Object.keys(this.state.audioEvents).forEach(timestamp => this.playAudio(this.state.audioEvents[timestamp], timestamp));
  }

  submitEvents = () => {
    this.state.finalEvents.forEach(event => {
      const column_values = { "timestamp": event.ts, "assetid": event.audio }
      monday.api(` mutation ($parent_item_id: Int, $item_name: String, $column_values: JSON) { create_subitem(parent_item_id: $parent_item_id, item_name: $item_name, column_values: $column_values) { id } }`,
      { variables: {parent_item_id: this.state.context.itemId, item_name: event.title, column_values: JSON.stringify(column_values)} }
      )
      .then(res => console.log(res));
    })
  }

  componentDidMount() {
    /* monday.listen("settings", res => {
      this.setState({ settings: res.data });
    }); */

    monday.listen("context", res => {
      this.setState({context: res.data});
      monday.api(`query ($itemId: [Int]) { items(ids:$itemId) { column_values (ids: ["file", "file_1"]) {value} } }`,
        { variables: {itemId: this.state.context.itemId} }
      )
      .then(res => {
        this.setState({boardData: res.data});
        this.setState({videoData: res.data.items[0].column_values[0].value});
        this.setState({audioData: res.data.items[0].column_values[1].value});

        const audioAssetIds = [];
        JSON.parse(this.state.audioData).files.map( file => audioAssetIds.push(file.assetId));

        this.setState({videoAssetId: JSON.parse(this.state.videoData).files[0].assetId});
        this.setState({audioAssetIds});
        console.log(this.state.audioAssetIds);

        monday.api(`query ($assetId: [Int]!) { assets(ids: $assetId) { name public_url } }`,
        { variables: {assetId: this.state.audioAssetIds} }
        )
          .then(res2 => {
            this.setState({audioAssets: res2.data.assets});
        });

        monday.api(`query ($assetId: [Int]!) { assets(ids: $assetId) { public_url } }`,
        { variables: {assetId: this.state.videoAssetId} }
        )
          .then(res3 => {
            this.setState({videoUrls: [res3.data.assets[0].public_url]});
        });
      });

      monday.api(`query ($itemId: [Int]) {
        items (ids: $itemId) {
          column_values (ids: "subitems4") {
            value
          }
        }
      }`,
      { variables: {itemId: this.state.context.itemId} }).then(res => {
        const out = JSON.parse(res.data.items[0].column_values[0].value);
        const pulseIds = [];
        out.linkedPulseIds.forEach(item => pulseIds.push(item.linkedPulseId));
        
        monday.api(`query ($itemIds: [Int]){
          items (ids: $itemIds) {
            column_values {
              id
              value
            }
          }
        }`,
        { variables: {itemIds: pulseIds} }).then(res2 => {
          const items = res2.data.items;
          const audioEvents = {};
          items.forEach(item => {
            audioEvents[item.column_values[0].value] = item.column_values[1].value;
          })

          this.setState({audioEvents});
        })
      })
    });

    monday.listen("context", res => {
      this.setState({context: res.data});

      
    })
  }

  render() {
    return ( 
      <div className="App">
        <div className="app_container">
         <p>
                <button className="btn btn-primary" type="button" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
                    Audio
                </button>
            </p>
            <div className="collapse" id="collapseExample">
            {this.state.audioAssets ? 
                        this.state.audioAssets.map(asset => {
                            return (
                                <div key={asset.name}>
                                    <span>{asset.name}</span>
                                    <audio controls id={asset.name} src={asset.public_url}></audio>
                                </div>
                            )
                        }) :
                        null
                    }
            </div>
          <p>
            Video: 
            <span>{this.state.videoUrls? <video width="300" controls src={this.state.videoUrls} onPlay={() => this.playFinal()}></video> : null}</span>
          </p>
          {/*
          <button className="btn btn-primary" type="button"
                    onClick={e => { const v = document.querySelector("video"); v.pause(); this.setState({timestamp: v.currentTime})}}
                >Add event</button>
                <form>
                    <div className="form-row align-items-center">
                        <div className="col-sm-3 my-1">
                        <label className="sr-only" htmlFor="inlineFormInputName">Name</label>
                        <input type="text" className="form-control" id="inlineFormInputName" placeholder="Jane Doe"
                            value={this.state.event} onChange={e=>this.setState({event: e.target.value})}
                        />
                        </div>
                        <div className="col-auto my-1">
                            <button type="button" className="btn btn-primary"
                                onClick={e=>this.setState({eventList: [...this.state.eventList, {title: this.state.event, ts: this.state.timestamp}]})}
                            >Submit</button>
                        </div>
                    </div>
                </form>


        <div>
          {
            this.state.eventList.map(event => {
            return <div key={event.ts}>
                        {event.ts}: {event.title}
                        <div className="btn-group">
                            <button type="button" className="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Attach audio
                            </button>
                            <div className="dropdown-menu dropdown-menu-left">
                                {
                                    this.state.audioAssets.map(asset => <button key={asset.name} className="dropdown-item" type="button" onClick={e => this.setState({finalEvents: [...this.state.finalEvents, {title: event.title, ts: event.ts, audio: asset.name}]})}>{asset.name}</button>)  
                                }
                            </div>
                        </div>
                    </div>
            })
          }
        </div>
        {(this.state.finalEvents.length > 0) ? <button type="button" onClick={e => this.submitEvents()}>Submit events</button> : null} */}


        </div>
      </div>
    )
  }
}

export default App;
