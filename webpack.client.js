import path from "path";
import _ from "lodash";
import spWebpackConfig from "spreadable-ms/webpack.client.js";

const __dirname = new URL('.', import.meta.url).pathname;

export default (options = {}, wp) => {
    options = _.merge({
        include: []
    }, options);
    options.include.push([path.resolve(__dirname, 'src/browser/client')]);
    return wp ? spWebpackConfig(options, wp) : options;
};
