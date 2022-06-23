/**
 * https://mp.weixin.qq.com/s?__biz=Mzg3OTYzMDkzMg==&mid=2247487842&idx=1&sn=4576f83fbf8ac974fe0223ab7b3efeff&chksm=cf00de59f877574f695024890de3a3c8063ebf2dd0fb36702b6e63b974be405ca6b39043c739&scene=178&cur_album_id=2235430201809928196#rd
 * 如果是文本类型，那么就要用 document.createTextNode 来创建文本节点
 * 如果是元素类型，那么就要用 document.createElement来创建元素节点，元素节点还有属性要处理，并且要递归的渲染子节点
 */

function isTextVdom (vdom) {
  return typeof vdom === 'string' || typeof vdom === 'number'
}

function isElementVDom (vdom) {
  return typeof vdom === 'object' && typeof vdom.type === 'string'
}


function render (vdom, parent = null) {
  // node.appendChild(el) 返回 el
  const mount = parent ? (el => parent.appendChild(el)) : (el => el)
  if (isTextVdom(vdom)) {
    return mount(document.createTextNode(vdom))
  } else if (isElementVDom(vdom)) {
    const dom = mount(document.createElement(vdom.type))
    for (const child of vdom.children) {
      render(child, dom)
    }
    for (const prop in vdom.props) {
      setAttribute(dom, prop, vdom.props[prop])
    }
    return dom
  } else {
    throw new Error(`Invalid VDOM: ${vdom}.`)
  }
}

function isEventListenerAttr (key, value) {
  return key.startsWith('on') && typeof value === 'function'
}

function isStyleAttr (key, value) {
  return key == 'style' && typeof value == 'object';
}

function isPlainAttr (value) {
  return typeof value != 'object' && typeof value != 'function';
}

function setAttribute (dom, key, value) {
  if (isEventListenerAttr(key, value)) {
    const eventType = key.slice(2).toLowerCase()
    dom.addEventListener(eventType, value)
  } else if (isStyleAttr(key, value)) {
    Object.assign(dom.style, value)
  } else if (isPlainAttr(value)) {
    dom.setAttribute(key, value)
  }
}