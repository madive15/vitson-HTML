/** @type {import('postcss-load-config').Config} */
const isProd = process.env.NODE_ENV === 'production';

const config = {
  plugins: {
    // '@tailwindcss/postcss': {},
    autoprefixer: {},
    ...(isProd && {
      'postcss-discard-comments': {removeAll: true}
    })
  }
};

module.exports = config;
