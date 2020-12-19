module.exports = {
    "env": {
        "node": true,
        "commonjs": true,
        "es6": true,
        "jest/globals": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": { "ecmaVersion": 2018 },
    "rules": {
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "semi": ["error", "always"],
        "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "no-prototype-builtins": "off"
    }
};
