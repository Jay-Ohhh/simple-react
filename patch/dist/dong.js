function isTextVdom(vdom) {
  return typeof vdom == 'string' || typeof vdom == 'number';
}

function isElementVdom(vdom) {
  return typeof vdom == 'object' && typeof vdom.type == 'string';
}

function isComponentVdom(vdom) {
  return typeof vdom.type == 'function';
}

function renderComponent(vdom, parent) {
  const props = Object.assign({}, vdom.props, {
    children: [...vdom.children]
  });

  if (isComponentVdom(vdom)) {
    // 类组件
    if (Component.isPrototypeOf(vdom.type)) {
      const instance = new vdom.type(props);
      instance.componentWillMount();
      const componentVdom = instance.render();
      instance.dom = render(componentVdom, parent);
      instance.dom.__instance = instance;
      instance.dom.__key = vdom.props.key;
      instance.componentDidMount();
      return instance.dom;
    } else {
      // 函数组件
      const componentVdom = vdom.type(props);
      return render(componentVdom, parent);
    }
  } else {
    throw new Error(`Invalid Component: ${vdom}.`);
  }
}

function render(vdom, parent = null) {
  const mount = parent ? el => parent.appendChild(el) : el => el;

  if (isTextVdom(vdom)) {
    return mount(document.createTextNode(vdom));
  } else if (isElementVdom(vdom)) {
    const dom = mount(document.createElement(vdom.type));

    for (const child of [].concat(...vdom.children)) {
      render(child, dom);
    }

    for (const prop in vdom.props) {
      setAttribute(dom, prop, vdom.props[prop]);
    }

    return dom;
  } else if (isComponentVdom(vdom)) {
    return renderComponent(vdom, parent);
  } else {
    throw new Error(`Invalid VDOM: ${vdom}.`);
  }
}

function patch(dom, vdom, parent = dom.parentNode) {
  const replace = parent ? el => {
    parent.replaceChild(el, dom);
    return el;
  } : el => el; // 组件判断

  if (isComponentVdom(vdom)) {
    const props = Object.assign({}, vdom.props, {
      children: [...vdom.children]
    }); // new B().constructor === B
    // 同一个类组件则更新

    if (dom.__instance?.constructor === vdom.type) {
      dom.__instance.componentWillReceiveProps(props);

      dom.__instance.props = props;
    } else if (Component.isPrototypeOf(vdom.type)) {
      // 类组件
      const componentDom = renderComponent(vdom, parent);

      if (parent) {
        parent.replaceChild(componentDom, dom);
        return componentDom;
      }

      return componentDom;
    } else if (!Component.isPrototypeOf(vdom.type)) {
      // 函数组件
      return patch(dom, vdom.type(props), parent);
    }
  } else if (dom instanceof Text) {
    // 文本节点
    // Text：DOM text node的构造函数
    // let s = document.createTextNode('111')
    // s instanceof Text // true
    if (typeof vdom === 'object') {
      return replace(render(vdom, parent));
    } else {
      return dom.textContent !== vdom ? replace(render(vdom, parent)) : dom;
    }
  } else if (dom.nodeName !== vdom.type.toUpperCase() && typeof vdom === 'object') {
    // 不同类型的元素，直接替换
    return replace(render(vdom, parent));
  } else if (dom.nodeName === vdom.type.toUpperCase() && typeof vdom === 'object') {
    // 同一类型的元素，更新子节点和属性
    // activeElement 返回当前在 DOM 或者 shadow DOM 树中处于聚焦状态的Element
    const active = document.activeElement;
    const oldDoms = {};
    [].concat(...dom.childNodes).map((child, index) => {
      const key = child.__key || `__index_${index}`;
      oldDoms[key] = child;
    });
    [].concat(...vdom.children).map((child, index) => {
      const key = child.props?.key || `__index_${index}`;
      dom.appendChild(oldDoms[key] ? patch(oldDoms[key], child) : render(child, dom)); // 把可复用的 dom 从 oldDoms 里去掉。剩下的就是不再需要的 dom，直接删掉即可

      oldDoms[key] && delete oldDoms[key];
    });

    for (const key in oldDoms) {
      const instance = oldDoms[key].__instance;
      if (instance) instance.componentWillUnmount();
      oldDoms[key].remove();
    }

    for (const attr of dom.attributes) dom.removeAttribute(attr.name);

    for (const prop in vdom.props) setAttribute(dom, prop, vdom.props[prop]);

    active?.focus();
    return dom;
  }
}

function isEventListenerAttr(key, value) {
  return typeof value == 'function' && key.startsWith('on');
}

function isStyleAttr(key, value) {
  return key == 'style' && typeof value == 'object';
}

function isPlainAttr(key, value) {
  return typeof value != 'object' && typeof value != 'function';
}

function isRefAttr(key, value) {
  return key === 'ref' && typeof value === 'function';
}

function setAttribute(dom, key, value) {
  if (isEventListenerAttr(key, value)) {
    const eventType = key.slice(2).toLowerCase();
    dom.__handlers = dom.__handlers || {};
    dom.__handlers[eventType] && dom.removeEventListener(eventType, dom.__handlers[eventType]);
    dom.__handlers[eventType] = value;
    dom.addEventListener(eventType, value);
  } else if (key === 'checked' || key === 'value' || key === 'className') {
    // 使用名称className而不是class作为属性名，是因为"class" 在 JavaScript 中是个保留字
    dom[key] = value;
  } else if (isRefAttr(key, value)) {
    value(dom);
  } else if (isStyleAttr(key, value)) {
    Object.assign(dom.style, value);
  } else if (key === 'key') {
    // dom.__key = 1 和 dom.setAttribute('__key', 1) 的区别
    // 后者是把属性和属性值设置到元素上，<div __key='1'></div>
    dom.__key = key;
  } else if (isPlainAttr(key, value)) {
    dom.setAttribute(key, value);
  }
}

const createElement = (type, props, ...children) => {
  if (props === null) props = {};
  return {
    type,
    props,
    children
  };
};

class Component {
  constructor(props) {
    this.props = props || {};
    this.state = null;
  }

  setState(nextState) {
    // 这里的this是子组件的this
    this.state = Object.assign(this.state, nextState);

    if (this.dom && this.shouldComponentUpdate(this.props, nextState)) {
      patch(this.dom, this.render());
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // 这里的this是class Component的this
    return nextProps !== this.props || nextState !== this.state;
  }

  componentWillMount() {}

  componentDidMount() {}

  componentWillReceiveProps() {}

  componentWillUnmount() {}

}