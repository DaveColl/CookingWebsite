module.exports = {
  apps: [
    {
      name: 'kochseite',
      script: '/var/www/CookingWebsite/build/index.js',
      cwd: '/var/www/CookingWebsite',
      env: {
        PORT: '187',
        NODE_ENV: 'production'
      }
    }
  ]
};
