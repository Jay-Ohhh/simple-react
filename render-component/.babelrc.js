module.exports = {
  presets: [
    [
      '@babel/preset-react',
      {
        // https://www.babeljs.cn/docs/babel-preset-react#both-runtimes
        // 编译jsx的函数
        pragma: 'createElement'
      }
    ]
  ]
}