// https://mp.weixin.qq.com/s?__biz=Mzg3OTYzMDkzMg==&mid=2247487869&idx=1&sn=a2591ac0519401de05f1462f6dd10d47&chksm=cf00de46f8775750a84dd9c93c4f9a5563d81a20acbe30b047e1636111f5b5a9b9da0a7b0e7d&scene=178&cur_album_id=2235430201809928196#rd


function isTextVdom (vdom) {
  return typeof vdom == 'string' || typeof vdom == 'number';
}

function isElementVdom (vdom) {
  return typeof vdom == 'object' && typeof vdom.type == 'string';
}
// class的type是function
function isComponentVdom (vdom) {
  return typeof vdom.type == 'function';
}

// 先看下babel编译jsx的产物长什么样(dist/index.js)，再写逻辑
const render = (vdom, parent = null) => {
  const mount = parent ? (el => parent.appendChild(el)) : (el => el);
  if (isTextVdom(vdom)) {
    return mount(document.createTextNode(vdom));
  } else if (isElementVdom(vdom)) {
    const dom = mount(document.createElement(vdom.type));
    // [].concat(1,2,[3,4]) === [1,2,3,4]
    for (const child of [].concat(...vdom.children)) {
      render(child, dom);
    }
    for (const prop in vdom.props) {
      setAttribute(dom, prop, vdom.props[prop]);
    }
    return dom;
  } else if (isComponentVdom(vdom)) {
    const props = Object.assign({}, vdom.props, {
      // [].concat(1,2,[3,4]) === [1,2,3,4]
      // [3,4] 出现的例子：<span>{1}{2}{[3,4].map(v=>v)}</span>
      children: [].concat(...vdom.children)
    });

    // 判断类组件
    // isPrototypeOf: 判断调用对象是否在参数对象的原型链上，也可以判断类的继承
    if (Component.isPrototypeOf(vdom.type)) {
      const instance = new vdom.type(props);
      instance.componentWillMount();
      const componentVdom = instance.render();
      instance.dom = render(componentVdom, parent);
      instance.componentDidMount();
      return instance.dom;
    } else {
      // 函数组件
      const componentVdom = vdom.type(props);
      return render(componentVdom, parent);
    }
  } else {
    throw new Error(`Invalid VDOM: ${vdom}.`);
  }
};

function isEventListenerAttr (key, value) {
  return typeof value == 'function' && key.startsWith('on');
}

function isStyleAttr (key, value) {
  return key == 'style' && typeof value == 'object';
}

function isPlainAttr (key, value) {
  return typeof value != 'object' && typeof value != 'function';
}

const setAttribute = (dom, key, value) => {
  if (isEventListenerAttr(key, value)) {
    const eventType = key.slice(2).toLowerCase();
    dom.addEventListener(eventType, value);
  } else if (isStyleAttr(key, value)) {
    Object.assign(dom.style, value);
  } else if (isPlainAttr(key, value)) {
    dom.setAttribute(key, value);
  }
}

const createElement = (type, props, ...children) => {
  if (props === null) props = {};
  return { type, props, children };
};

class Component {
  constructor(props) {
    this.props = props || {};
    this.state = null;
  }

  setState (nextState) {
    this.state = nextState;
  }

  componentWillMount () {
    return undefined;
  }

  componentDidMount () {
    return undefined;
  }
}

