import React from 'react';
import logo from './logo.svg';
import arrow from './resources/arrow.svg'
import './App.css';
import './Layout.css';
import * as axios from "axios";
import Noty from 'noty';
import '../node_modules/noty/lib/noty.css';
import '../node_modules/noty/lib/themes/relax.css';

class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }
  handleChange(event) {
    this.setState({value: event.target.value});
    this.props.onChange(event.target.value);
  }
  handleSubmit(event) {
    // alert('You submitted:\n' + this.state.value);
    event.preventDefault();
    this.props.onClickSubmit();
  }
  handleReset = () => {
    this.setState({value: ""})
    this.props.onClickReset();
  }

  render() {
    return (
        <form onSubmit={this.handleSubmit} onReset={this.handleReset}>
          <label>
            <textarea name="Program" value={this.state.value} onChange={this.handleChange} cols="60" rows="25" />
          </label>
          <div>
            <input type="submit" value="▶️" />
            <span> </span>
            <input type="reset" value="🔄" />
          </div>
        </form>
    )
  }
}

class Square extends React.Component {
  getValue() {
    const {value, isPlayer} = this.props;
    if (isPlayer) {
      if (value === 'RIGHT')
        return <img className="icon right" src={arrow} />;
      if (value === 'UP')
        return <img className="icon up" src={arrow} />;
      if (value === 'DOWN')
        return <img className="icon down" src={arrow} />;
      if (value === 'LEFT')
        return <img className="icon left" src={arrow} />;
    } else {
      if (value === 'BLOCKED')
        return "🏔";
      if (value === 'GEM')
        return '💎';
      if (value === 'OPENEDSWITCH')
        return '🔲';
      if (value === 'CLOSEDSWITCH')
        return '🔳';
      return null;
    }
  }
  render() {
    return (<div className="square">{this.getValue()}</div>)
  }
}

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      boardData: this.setBoard(this.props.grid, this.props.player),
      consoleLog: "",
      consoleOutput: "",
      answer: [],
    }
    this.onClickReset = this.onClickReset.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onClickSubmit = this.onClickSubmit.bind(this);
  }

  onClickReset() {
    const newData = this.setBoard(this.props.grid, this.props.player);
    this.setState({
      boardData: newData,
      consoleLog: "",
      consoleOutput: "",
      answer: [],
    });
  }
  onClickSubmit() {
    this.makeRequest()
  }
  onChange(data) {
    this.setState({
      consoleLog: data
    });
  }

  makeRequest() {
    const req = {
      code: this.state.consoleLog,
      grid: this.props.grid,
    };
    // console.log(req);
    axios.default.post(
        'http://127.0.0.1:8080/paidiki-xara',
        req,
        { headers: { 'Content-Type': 'application/json'} }
    ).then(response => {
      const answer = response.data
      if (answer.status === 'OK') {
        new Noty({
          type: "info",
          layout: "topLeft",
          theme: "relax",
          text: 'Submit succeeded, your code is running...',
          timeout: 4000,
          progressBar: true,
          closeWith: ['button'],
          killer: true,
        }).show()
        this.setState({
          answer: answer.payload
        })
        // console.log(answer);
      } else {
        new Noty({
          type: "warning",
          layout: "topLeft",
          theme: "relax",
          text: answer.msg,
          timeout: 4000,
          progressBar: true,
          closeWith: ['button'],
          killer: true,
        }).show()
        // console.log(answer)
      }
    });
  }

  componentDidMount() {
    this.getData();
    this.intervalID = setInterval(this.getData.bind(this), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);
  }

  getData = () => {
    if (this.state.answer.length === 0) {
      return;
    }
    else {
      const answer = this.state.answer;
      const nextFrame = answer.shift();
      // console.log(nextFrame);
      this.setState({
        answer: answer,
        boardData: this.setBoard(nextFrame.grid.grid, nextFrame.player),
        consoleOutput: nextFrame.consoleLog
      });
      if (nextFrame.special === 'GEM') {
        new Noty({
          type: "information",
          layout: "topLeft",
          theme: "relax",
          text: "Collected a gem.",
          timeout: 4000,
          progressBar: true,
          closeWith: ['button'],
          killer: true,
        }).show()
      }
      if (nextFrame.special === 'SWITCH') {
        new Noty({
          type: "information",
          layout: "topLeft",
          theme: "relax",
          text: "Toggled a switch.",
          timeout: 4000,
          progressBar: true,
          closeWith: ['button'],
          killer: true,
        }).show()
      }
      if (answer.length === 0) {
        new Noty({
          type: "success",
          layout: "topLeft",
          theme: "relax",
          text: "Your code has just finished.",
          timeout: 4000,
          progressBar: true,
          closeWith: ['button'],
          killer: true,
        }).show()
      }
    }
  }

  renderForm(submit, reset, change) {
    return (
        <div className="Form">
          <Form onClickSubmit={submit} onClickReset={reset} onChange={change}/>
        </div>
    )
  }

  renderGrid(grid, player) {
    return grid.map((gridRow, y) => {

      const row = gridRow.map((gridItem, x) => {
        const key = y * gridRow.length + x;
        if (player.y * gridRow.length + player.x === key) {
          return (
              <div key={key}>
                <Square value={player.dir} isPlayer={true}/>
                {(gridRow[gridRow.length - 1] === gridItem) ? <div className="clear"/> : ""}
              </div>
          )
        } else {
          return (
              <div key={key}>
                <Square value={gridItem} isPlayer={false}/>
                {(gridRow[gridRow.length - 1] === gridItem) ? <div className="clear"/> : ""}
              </div>
          )
        }
      })
      return <div className="row">{row}</div>
    })
  }

  renderConsole(output) {
    return (
        <div className="Console">
          {output}
        </div>
    )
  }

  render() {
    return (
        <div className="Dashboard">
          {this.renderForm(this.onClickSubmit, this.onClickReset, this.onChange)}
          <div className="Window">
            <div className="grid">
              {this.renderGrid(this.state.boardData.grid, this.state.boardData.player)}
            </div>
            {this.renderConsole(this.state.consoleOutput)}
          </div>
        </div>
    )
  }

  setBoard(map, player) {
    let data = {};
    data.grid = map;
    data.player = player;
    return data;
  }
}

// const grid = [
//   [ "OPEN", "CLOSEDSWITCH", "OPEN", "CLOSEDSWITCH", "OPEN", "CLOSEDSWITCH", "OPEN", "CLOSEDSWITCH", "OPEN" ],
//   [ "BLOCKED", "GEM", "BLOCKED", "GEM", "BLOCKED", "GEM", "BLOCKED", "GEM", "BLOCKED" ]
// ]

const grid = [
    [ "OPEN", "OPEN", "BLOCKED", "OPENEDSWITCH", "OPEN", "BLOCKED", "BLOCKED", "BLOCKED", "OPEN" ],
    [ "BLOCKED", "CLOSEDSWITCH", "OPEN", "CLOSEDSWITCH", "OPEN", "CLOSEDSWITCH", "OPEN", "CLOSEDSWITCH", "OPEN" ],
    [ "GEM", "OPEN", "BLOCKED", "BLOCKED", "GEM", "BLOCKED", "OPEN", "BLOCKED", "GEM"],
    [ "BLOCKED", "OPENEDSWITCH", "GEM", "BLOCKED", "BLOCKED", "GEM", "CLOSEDSWITCH", "BLOCKED", "BLOCKED"],
    [ "BLOCKED", "GEM", "BLOCKED", "BLOCKED", "BLOCKED", "BLOCKED", "GEM", "BLOCKED", "BLOCKED"]
]

const player = {
  x: 0,
  y: 0,
  dir: "RIGHT"
}

class Game extends React.Component {
  state = {
    grid: grid,
    player: player
  }
  render() {
    const {grid, player} = this.state;
    return (
        <div className="Game">
          <Dashboard grid={grid} player={player} />
        </div>
    )
  }
}

class App extends React.Component {
  render() {
    return (
        <div className="App">
          <header className="App-header">
            <div>
            <h2>παιδικη χαρα</h2>
            </div>
            <Game />
          </header>
        </div>
    );
  }
}

export default App;
