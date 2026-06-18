/**
 * @param {any} target
 * @param {string} attribute
 * @param {any} newValue
 * @param {function} block
 */
async function patch(target, attribute, newValue, block) {
    const oldValue = target[attribute];
    target[attribute] = newValue;
    try {
        await block();
    } finally {
        target[attribute] = oldValue;
    }
}

module.exports = { patch };
