const { reindexScope } = require("./index");

class MockMemento {
    constructor() {
        this.state = {};
    }
    update(key, value) {
        this.state[key] = value;
    }
}

class MockStatusBarItem {
    constructor() {
        this.text = null;
        this.visible = false;
    }
    show() {
        this.visible = true;
    }
}

describe("reindexScope", () => {
    const scope = { uri: { fsPath: "/test" } };

    it("shows a warning when file does not exist", () => {
        const stash = {
            context: { workspaceState: new MockMemento() },
            statusBarItem: new MockStatusBarItem()
        };
        const fs = {
            existsSync: (path) => {
                expect(path).toEqual("/test/path/to/ctags");
                return false;
            }
        };

        reindexScope(stash, scope, { fs });

        expect(stash.context.workspaceState.state).toEqual({});
        expect(stash.statusBarItem.text).toMatch(/not found/);
        expect(stash.statusBarItem.visible).toBeTruthy();
    });
});

