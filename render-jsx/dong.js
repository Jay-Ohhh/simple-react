
// https://mp.weixin.qq.com/s?__biz=Mzg3OTYzMDkzMg==&mid=2247487842&idx=1&sn=4576f83fbf8ac974fe0223ab7b3efeff&chksm=cf00de59f877574f695024890de3a3c8063ebf2dd0fb36702b6e63b974be405ca6b39043c739&scene=178&cur_album_id=2235430201809928196#rd

function isTextVdom (vdom) {
  return typeof vdom == 'string' || typeof vdom == 'number';
}

function isElementVdom (vdom) {
  return typeof vdom == 'object' && typeof vdom.type == 'string';
}

function isEmpty (vdom) {
  return typeof vdom === 'boolean' || typeof vdom === undefined || vdom === null
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
  } else if (isEmpty(vdom)) {
    return null
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
// 输出 vdom
function createElement (type, props, ...children) {
  if (props === null) props = {};
  return { type, props, children };
};
