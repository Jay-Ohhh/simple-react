// 虚拟dom格式：其中元素是 {type、props、children} 的结构，文本是字符串、数字
const vdom = {
  type: 'ul',
  props: {
    className: 'list',
  },
  children: [
    {
      type: 'li',
      props: {
        className: 'item',
        style: {
          background: 'blue',
          color: '#fff'
        },
        onClick: () => alert(1)
      },
      children: [
        'aaaa'
      ]
    }, {
      type: 'li',
      props: {
        className: 'item'
      },
      children: [
        'bbbbddd'
      ]
    },
    {
      type: 'li',
      props: {
        className: 'item'
      },
      children: [
        'cccc'
      ]
    }
  ]
}

render(vdom, document.querySelector('#root'))