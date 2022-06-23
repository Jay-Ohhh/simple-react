function Item (props) {
  return <li className="item" style={props.style} onClick={props.onClick}>{props.children}</li>;
}

class List extends Component {
  constructor(props) {
    super();
    this.state = {
      list: [
        {
          text: 'aaa',
          color: 'blue'
        },
        {
          text: 'bbb',
          color: 'orange'
        },
        {
          text: 'ccc',
          color: 'red'
        }
      ],
      textColor: props.textColor
    }
  }

  render () {
    return <ul className="list">
      {this.state.list.map((item, index) => {
        return <Item key={index} style={{ background: item.color, color: this.state.textColor }} onClick={() => alert(item.text)}>{item.text}-{item.color}{[1, 2].map(v => v)}</Item>
      })}
    </ul>;
  }
}

render(<List textColor={'pink'} />, document.getElementById('root'));