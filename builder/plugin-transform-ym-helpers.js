module.exports = function ({ template, types: t }) {
    function replaceGlobals(path, file) {
        // Object.assign => Object
        // Promise => Promise
        const variableName =
            path.isMemberExpression() && path.get('object').isIdentifier() ? path.get('object').node.name :
            path.isIdentifier() ? path.node.name :
            null;

        if (!variableName ||
            !path.scope.hasGlobal(variableName) ||
            path.scope.hasOwnBinding(variableName)) {
            return;
        }

        const replacement = findReplacement(path, file.opts.replaceGlobals);
        if (!replacement) {
            return;
        }

        try {
            const simple = typeof replacement === 'string';
            const helper = this.file.ym.addImport(simple ? replacement : replacement[0]);

            const replacementNode = simple ? helper :
                t.memberExpression(helper, t.identifier(replacement[1]));

            path.replaceWith(replacementNode);
        } catch (e) {
            console.error(`Error while replacing ${pattern} with ${replacement.join('.')}:`, e);
        }
    }

    function onProgramEnter(path, state) {
        const overrideHelpers = state.opts.overrideHelpers || {};

        // HACK: monkey-patch addHelper to add our specific helpers, instead of babel ones.
        const addHelper = state.file.addHelper;
        state.file.addHelper = name => {
            if (overrideHelpers[name]) {
                return state.file.ym.addImport(overrideHelpers[name]);
            }

            return addHelper.call(state.file, name);
        };
    }

    return {
        visitor: {
            Program: { enter: onProgramEnter },
            ReferencedIdentifier: replaceGlobals,
            CallExpression(path, file) {
                replaceGlobals.call(this, path.get('callee'), file);
            },
        }
    };
};

function findReplacement(path, replacements) {
    if (path.isIdentifier()) {
        return replacements[path.node.name];
    }

    if (path.isMemberExpression()) {
        const key = Object.keys(replacements).find(x => path.matchesPattern(x));
        return key && replacements[key];
    }

    throw new Error(`Can't find replacement. Expected Identifier or MemberExpression, got ${path.node.type}.`);
}
