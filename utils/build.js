// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

var webpack = require('webpack'),
  path = require('path'),
  fs = require('fs'),
  config = require('../webpack.config'),
  ZipPlugin = require('zip-webpack-plugin');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

var packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

config.plugins = (config.plugins || []).concat(
  new ZipPlugin({
    filename: `${packageInfo.name}-${packageInfo.version}.zip`,
    path: path.join(__dirname, '../', 'zip'),
  })
);

webpack(config, function (err, stats) {
  if (err) {
    console.error('❌ Webpack build failed with error:', err);
    throw err;
  }

  if (stats.hasErrors()) {
    console.error('❌ Webpack build completed with errors:');
    console.error(
      stats.toString({
        colors: true,
        all: false,
        errors: true,
        warnings: true,
      })
    );
    process.exit(1);
  }

  if (stats.hasWarnings()) {
    console.warn('⚠️ Webpack build completed with warnings:');
    console.warn(
      stats.toString({
        colors: true,
        all: false,
        warnings: true,
      })
    );
  }

  console.log('✅ Webpack build completed successfully!');
  console.log(
    stats.toString({
      colors: true,
      all: false,
      assets: true,
      modules: false,
      chunks: false,
    })
  );
});
