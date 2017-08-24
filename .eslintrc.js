module.exports = {
    "extends": "loris/es5",
    "root": true,
    "env": {
        "browser": true,
        "es6": true,
        "mocha": true
    },
    "rules": {
        "strict": ["error", "never"],
        "curly": [0, "multi"],
        "no-console": ["error", { allow: ["error"] }],
        "no-implicit-globals": 0,
        "no-cond-assign": 0
    },
    "globals": {
        "modules": true,
        "module": true,
        "ymaps": true,
        "chai": true,
        "describe": true,
        "modules": true,
        "expect": true,
        "it": true,
        "before": true,
        "after": true
    },
    "parserOptions": {
        "sourceType": "module"
    }
};
