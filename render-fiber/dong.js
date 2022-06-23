function createTextElement (text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

function createElement (type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
    }
  }
}

//###### schedule 

// 用两个全局变量来记录当前处理到的 fiber 节点、根 fiber 节点
let nextFiberReconcileWork = null
let wipRoot = null

function workLoop (deadline) {
  let showYield = false
  while (nextFiberReconcileWork && !showYield) {
    nextFiberReconcileWork = performNextWork(nextFiberReconcileWork)
    // deadline.timeRemaining()：单位ms，返回当前空闲期间剩余的估计毫秒数。
    showYield = deadline.timeRemaining() < 1
  }

  if (!nextFiberReconcileWork && wipRoot) commitRoot()
  // requestIdleCallback:将在浏览器空闲时期被调用
  requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)
//###### schedule 


//############ reconcile
// vdom和fiber单元的区别在于，后者还存在child、sibiling、return等属性
// reconcile 是 vdom 转 fiber，但还会做两件事：一个是提前创建对应的 dom 节点，一个是做 diff，确定是增、删还是改。
function reconcile (fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

function reconcileChildren (wipFiber, elements) {
  let index = 0
  let prevSibling = null
  // 如果wipFiber有children
  while (index < elements.length) {
    const element = elements[index]
    let newFiber = {
      type: element.type,
      props: element.props,
      dom: null, // 在reconcile里创建并赋值
      return: wipFiber, // 建出的节点都要用 return 指向父节点
      effectTag: 'PLACEMENT', // 暂时不做 diff 和删除修改，所以这里的 effectTag 都是 placement，也就是新增元素
    }

    // 取children的第一个元素作为 child 串联，其余作为兄弟与第一个大哥进行 sibling 串联。创
    if (index === 0) {
      wipFiber.child = newFiber
    } else if (index !== 0 && element) {
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber
    index++
  }
}

//############ reconcile



// 创建根 fiber 节点，赋值给 wipRoot，并且下一个处理的 fiber 节点指向它，在index.js调用
function render (element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    }
  }

  nextFiberReconcileWork = wipRoot
}

function performNextWork (fiber) {
  reconcile(fiber)

  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.return
  }
}


//########### commit 
//  commit 做的事情：把 reconcile 产生的 fiber 链表一次性添加到 dom 中，因为 fiber 对应的节点提前创建好了、是增是删还是改也都知道了，所以，这一个阶段很快。
function commitRoot () {
  commitWork(wipRoot.child)
  wipRoot = null
}

function commitWork (fiber) {
  if (!fiber) return

  let domParentFiber = fiber.return
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.return
  }
  const domParent = domParentFiber.dom
  // 暂时不做 diff 和删除修改，所以这里的 effectTag 都是 placement，也就是新增元素
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom)
  }
  // 递归
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

//########### commit 

function createDom (fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type)

  for (const prop in fiber.props) {
    setAttribute(dom, prop, fiber.props[prop])
  }
  return dom
}


function isEventListenerAttr (key, value) {
  return typeof value == 'function' && key.startsWith('on');
}

function isStyleAttr (key, value) {
  return key == 'style' && typeof value == 'object';
}

function isPlainAttr (key, value) {
  return typeof value != 'object' && typeof value != 'function';
}

function setAttribute (dom, key, value) {
  if (key === 'children') return
  if (key === 'nodeValue') {
    dom.textContent = value
  } else if (isEventListenerAttr(key, value)) {
    const eventType = key.slice(2).toLowerCase()
    dom.addEventListener(eventType, value)
  } else if (isStyleAttr(key, value)) {
    Object.assign(dom.style, value)
  } else if (isPlainAttr(key, value)) {
    dom.setAttribute(key, value)
  }
}

const Dong = { createElement, render }