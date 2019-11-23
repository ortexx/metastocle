const path = require('path');
const merge = require('lodash/merge');
const spWebpackConfig = require('spreadable/webpack.client.js');

module.exports = (options = {}, webpack = null, onlyMerge = false) => {
  options = merge({ include: [] }, options);  
  options.include.push(path.resolve(__dirname, 'src/browser/client'));  
  return onlyMerge? options: spWebpackConfig(options);
}