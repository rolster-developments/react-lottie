import rolster from '@rolster/rollup';
import css from 'rollup-plugin-import-css';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default rolster({
  entryFiles: ['index'],
  packages: [
    '@rolster/commons',
    '@rolster/components',
    '@rolster/dates',
    '@rolster/forms',
    '@rolster/i18n',
    '@rolster/react-forms',
    '@rolster/strings',
    '@rolster/validators',
    'lottie-react',
    'react',
    'react-dom',
    'uuid'
  ],
  plugins: [peerDepsExternal(), css()]
});
