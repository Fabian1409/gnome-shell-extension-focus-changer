'use strict';

import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const SCHEMA_FOCUS_UP = 'focus-up';
const SCHEMA_FOCUS_DOWN = 'focus-down';
const SCHEMA_FOCUS_RIGHT = 'focus-right';
const SCHEMA_FOCUS_LEFT = 'focus-left';

export default class FocusChanger extends Extension {
    constructor(metadata) {
        super(metadata);
        this._workspaceManager = global.workspace_manager;
        this._keyFocusUpId = null;
        this._keyFocusDownId = null;
        this._keyFocusRightId = null;
        this._keyFocusLeftId = null;
        this._activeWindow = null;
    }

    changeFocus(id) {
        const {activeWindow, activeRect} = this._getActiveWindow();
        if (!activeWindow) {
            this._activeWindow = null;
            return;
        }

        this._activeWindow = activeWindow;
        const bestCandidate = this._getBestCandidate(
            id,
            activeWindow.get_monitor(),
            activeRect
        );
        if (bestCandidate) bestCandidate.activate(global.get_current_time());
    }

    _getBestCandidate(id, monitor, activeRect) {
        const windows = this._getAllWindows(monitor);
        const x = this._getCenterX(activeRect);
        const y = this._getCenterY(activeRect);
        let bestCandidate = null;

        switch (id) {
            case SCHEMA_FOCUS_UP:
                windows.forEach(w => {
                    const rect = w.get_frame_rect();
                    if (this._getCenterY(rect) < y) {
                        if (!bestCandidate) {
                            bestCandidate = w;
                        } else {
                            const bestRect = bestCandidate.get_frame_rect();
                            if (
                                this._getCenterX(rect) ===
                                    this._getCenterX(bestRect) &&
                                this._getCenterY(rect) >
                                    this._getCenterY(bestRect)
                            )
                                bestCandidate = w;
                            else if (
                                this._getCenterX(rect) !==
                                    this._getCenterX(bestRect) &&
                                Math.abs(x - this._getCenterX(rect)) <
                                    Math.abs(x - this._getCenterX(bestRect))
                            )
                                bestCandidate = w;
                        }
                    }
                });
                break;
            case SCHEMA_FOCUS_DOWN:
                windows.forEach(w => {
                    const rect = w.get_frame_rect();
                    if (this._getCenterY(rect) > y) {
                        if (!bestCandidate) {
                            bestCandidate = w;
                        } else {
                            const bestRect = bestCandidate.get_frame_rect();
                            if (
                                this._getCenterX(rect) ===
                                    this._getCenterX(bestRect) &&
                                this._getCenterY(rect) <
                                    this._getCenterY(bestRect)
                            )
                                bestCandidate = w;
                            else if (
                                this._getCenterX(rect) !==
                                    this._getCenterX(bestRect) &&
                                Math.abs(x - this._getCenterX(rect)) <
                                    Math.abs(x - this._getCenterX(bestRect))
                            )
                                bestCandidate = w;
                        }
                    }
                });
                break;
            case SCHEMA_FOCUS_RIGHT:
                windows.forEach(w => {
                    const rect = w.get_frame_rect();
                    if (this._getCenterX(rect) > x) {
                        if (!bestCandidate) {
                            bestCandidate = w;
                        } else {
                            const bestRect = bestCandidate.get_frame_rect();
                            if (
                                this._getCenterY(rect) ===
                                    this._getCenterY(bestRect) &&
                                this._getCenterX(rect) <
                                    this._getCenterX(bestRect)
                            )
                                bestCandidate = w;
                            else if (
                                this._getCenterY(rect) !==
                                    this._getCenterY(bestRect) &&
                                Math.abs(y - this._getCenterY(rect)) <
                                    Math.abs(
                                        this._getCenterY(activeRect) -
                                            this._getCenterY(bestRect)
                                    )
                            )
                                bestCandidate = w;
                        }
                    }
                });
                break;
            case SCHEMA_FOCUS_LEFT:
                windows.forEach(w => {
                    const rect = w.get_frame_rect();
                    if (this._getCenterX(rect) < x) {
                        if (!bestCandidate) {
                            bestCandidate = w;
                        } else {
                            const bestRect = bestCandidate.get_frame_rect();
                            if (
                                this._getCenterY(rect) ===
                                    this._getCenterY(bestRect) &&
                                this._getCenterX(rect) >
                                    this._getCenterX(bestRect)
                            )
                                bestCandidate = w;
                            else if (
                                this._getCenterY(rect) !==
                                    this._getCenterY(bestRect) &&
                                Math.abs(y - this._getCenterY(rect)) <
                                    Math.abs(
                                        this._getCenterY(activeRect) -
                                            this._getCenterY(bestRect)
                                    )
                            )
                                bestCandidate = w;
                        }
                    }
                });
                break;
        }

        return bestCandidate;
    }

    _getAllWindows(monitor) {
        const workspace = this._workspaceManager.get_active_workspace();
        const windows = workspace.list_windows();
        return windows.filter(
            w => w.get_monitor() === monitor && w.is_hidden() === false
        );
    }

    _getActiveWindow() {
        const workspace = this._workspaceManager.get_active_workspace();
        const windows = workspace.list_windows();

        let focusedWindow = null;
        let focusedWindowRect = null;

        for (let window of windows) {
            if (window.has_focus()) {
                focusedWindow = window;
                focusedWindowRect = window.get_frame_rect();
                break;
            }
        }

        return {activeWindow: focusedWindow, activeRect: focusedWindowRect};
    }

    _bindShortcut() {
        this._keyFocusUpId = SCHEMA_FOCUS_UP;
        this._keyFocusDownId = SCHEMA_FOCUS_DOWN;
        this._keyFocusRightId = SCHEMA_FOCUS_RIGHT;
        this._keyFocusLeftId = SCHEMA_FOCUS_LEFT;

        Main.wm.addKeybinding(
            this._keyFocusUpId,
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            () => this.changeFocus(this._keyFocusUpId)
        );
        Main.wm.addKeybinding(
            this._keyFocusDownId,
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            () => this.changeFocus(this._keyFocusDownId)
        );
        Main.wm.addKeybinding(
            this._keyFocusRightId,
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            () => this.changeFocus(this._keyFocusRightId)
        );
        Main.wm.addKeybinding(
            this._keyFocusLeftId,
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            () => this.changeFocus(this._keyFocusLeftId)
        );
    }

    _unbindShortcut() {
        if (this._keyFocusUpId !== null)
            Main.wm.removeKeybinding(this._keyFocusUpId);
        if (this._keyFocusDownId !== null)
            Main.wm.removeKeybinding(this._keyFocusDownId);
        if (this._keyFocusRightId !== null)
            Main.wm.removeKeybinding(this._keyFocusRightId);
        if (this._keyFocusLeftId !== null)
            Main.wm.removeKeybinding(this._keyFocusLeftId);

        this._keyFocusUpId = null;
        this._keyFocusDownId = null;
        this._keyFocusRightId = null;
        this._keyFocusLeftId = null;
    }

    enable() {
        this._settings = this.getSettings(
            'org.gnome.shell.extensions.focus-changer'
        );
        this._bindShortcut();
    }

    disable() {
        this._unbindShortcut();
        this._settings = null;
        this._activeWindow = null;
    }
}
