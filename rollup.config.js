import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

const plugins = [
  babel({
    exclude: 'node_modules/**'
  }),
  commonjs(),
  resolve({
    customResolveOptions: {
      moduleDirectory: 'node_modules'
    }
  })
];
const external = ['firebase', 'firebase/firestore', 'react', 'prop-types'];

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'build/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins,
    external
  }
];
