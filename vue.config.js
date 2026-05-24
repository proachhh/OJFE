module.exports = {
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/admin/, to: '/admin/index.html' },
        { from: /./, to: '/index.html' }
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/public': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      }
    }
  }
}
