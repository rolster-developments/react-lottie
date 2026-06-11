import rolster from '@rolster/rollup';

export default rolster({
  requiredEsm: true,
  entryFiles: ['index'],
  packages: ['lottie-web', 'react', 'react-dom']
});
