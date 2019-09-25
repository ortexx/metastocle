const path = require('path');
const merge = require('lodash/merge');
const spWebpackConfig = require('spreadable/webpack.client.js');

module.exports = (options = {}) => {
  return spWebpackConfig(merge({
    include: [path.resolve(__dirname, 'src/browser/client')].concat(options.include || [])
  }, options));
}