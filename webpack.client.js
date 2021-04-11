const path = require('path');
const merge = require('lodash/merge');
const spWebpackConfig = require('spreadable/webpack.client.js');

module.exports = (options = {}, wp) => {
  options = merge({ 
    include: []
  }, options);  
  options.include.push([path.resolve(__dirname, 'src/browser/client')]);
  return wp? spWebpackConfig(options, wp): options;
}