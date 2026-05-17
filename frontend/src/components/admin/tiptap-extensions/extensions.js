import { Node, Mark, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import InteractiveNodeView from './InteractiveNodeView';
import PageNodeView from './PageNodeView';

const sharedAttributes = {
    width: { default: 200 },
    height: { default: 'auto' },
    left: { default: 0 },
    top: { default: 0 },
    position: { default: 'static' },
    locked: { default: false },
    puzzle: { default: null },
    svgFill: { default: 'currentColor' },
    svgStroke: { default: 'currentColor' },
    textConfig: { 
        default: {
            fontSize: 16, fontFamily: 'Inter, sans-serif', fontWeight: 'normal',
            fontStyle: 'normal', textAlign: 'left', verticalAlign: 'top', letterSpacing: 0, color: '#000000', textEffect: 'none', effectColor: '#cccccc'
        },
        parseHTML: element => {
            const configStr = element.getAttribute('data-text-config');
            if (!configStr) return null;
            try { return JSON.parse(configStr); } catch (e) { return null; }
        },
        renderHTML: attributes => {
            if (!attributes.textConfig) return {};
            return { 'data-text-config': JSON.stringify(attributes.textConfig) };
        }
    }
};

export const PageNode = Node.create({
    name: 'page',
    group: 'block',
    content: 'block+',
    isolating: true,

    parseHTML() {
        return [{ tag: 'div[data-type="page"]' }, { tag: 'div.a4-page-node' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page', class: 'a4-page-node' }), 0];
    },

    addKeyboardShortcuts() {
        return {
            'Enter': ({ editor }) => {
                const { state } = editor;
                const { selection } = state;
                const { $from, empty } = selection;
                
                if (!empty) return false;
                
                // Prevent splitting the page node if we're at the end of it
                if ($from.parent.type.name === 'paragraph' && $from.parent.textContent === '') {
                    if ($from.depth >= 2 && $from.node($from.depth - 1).type.name === 'page') {
                        editor.commands.setHardBreak();
                        return true;
                    }
                }
                return false;
            }
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(PageNodeView);
    },
});

export const CustomDocument = Document.extend({
    content: 'page+',
});

export const ResizableImage = Node.create({
    name: 'resizableImage',
    group: 'block',
    inline: false,
    draggable: true,

    addAttributes() {
        return {
            src: { default: null },
            alt: { default: null },
            isPuzzleImage: { default: false },
            originalSrc: { default: null },
            puzzlePieces: { default: 10 },
            ...sharedAttributes,
        };
    },

    parseHTML() {
        return [
            {
                tag: 'img[src]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(HTMLAttributes)];
    },

    addCommands() {
        return {
            setImage: options => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                })
            },
        }
    },

    addNodeView() {
        return ReactNodeViewRenderer(InteractiveNodeView);
    },
});

export const ShapeNode = Node.create({
    name: 'shape',
    group: 'block',
    inline: false,
    draggable: true,

    addAttributes() {
        return {
            svg: { default: '' },
            ...sharedAttributes,
        };
    },

    parseHTML() {
        return [
            { tag: 'div[data-type="shape"]' },
            { tag: 'div.custom-shape' },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'shape', class: 'custom-shape' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(InteractiveNodeView);
    },
});

export const TextBoxNode = Node.create({
    name: 'textbox',
    group: 'block',
    inline: false,
    draggable: true,

    addAttributes() {
        return {
            text: { default: '' },
            ...sharedAttributes,
        };
    },

    parseHTML() {
        return [
            { tag: 'div[data-type="textbox"]' },
            { tag: 'div.custom-textbox' },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'textbox', class: 'custom-textbox' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(InteractiveNodeView);
    },
});

export const WisdomMark = Mark.create({
    name: 'wisdom',
    inclusive: false,
    addAttributes() {
        return {
            color: { default: '#00C0FF' },
            mode: { default: 'highlight' },
        };
    },
    parseHTML() {
        return [
            { tag: 'span[data-type="wisdom"]' },
            { 
                tag: 'span.wisdom-format',
                getAttrs: element => ({
                    color: element.getAttribute('data-color'),
                    mode: element.getAttribute('data-mode')
                })
            }
        ];
    },
    renderHTML({ HTMLAttributes }) {
        const mode = HTMLAttributes.mode;
        const color = HTMLAttributes.color;
        let style = '';
        if (mode === 'highlight') {
            style = `background-color: ${color}; color: #fff; padding: 2px 4px; border-radius: 2px;`;
        } else if (mode === 'square') {
            style = `border: 2px solid ${color}; padding: 2px 4px;`;
        } else if (mode === 'round') {
            style = `border: 2px solid ${color}; padding: 2px 6px; border-radius: 12px;`;
        } else if (mode === 'underline') {
            style = `border-bottom: 3px solid ${color}; padding-bottom: 2px;`;
        }
        return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'wisdom', style, class: 'wisdom-format' }), 0];
    },
    addCommands() {
        return {
            setWisdom: attributes => ({ commands }) => commands.setMark(this.name, attributes),
            toggleWisdom: attributes => ({ commands }) => commands.toggleMark(this.name, attributes),
            unsetWisdom: () => ({ commands }) => commands.unsetMark(this.name),
        };
    },
});

export const TextEffectMark = Mark.create({
    name: 'textEffect',
    addAttributes() {
        return {
            color: { default: '#00C0FF' },
            mode: { default: '3d' },
        };
    },
    parseHTML() {
        return [
            { tag: 'span[data-type="textEffect"]' },
            { 
                tag: 'span.texteffect-format',
                getAttrs: element => ({
                    color: element.getAttribute('data-color'),
                    mode: element.getAttribute('data-mode')
                })
            }
        ];
    },
    renderHTML({ HTMLAttributes }) {
        const mode = HTMLAttributes.mode;
        const color = HTMLAttributes.color;
        let style = '';
        if (mode === '3d') {
            style = `text-shadow: 1px 1px 0px #fff, 2px 2px 0px ${color}, 3px 3px 0px rgba(0,0,0,0.2); font-weight: bold;`;
        } else if (mode === '4d') {
            style = `text-shadow: 1px 1px 0px #fff, 2px 2px 0px ${color}, 3px 3px 0px ${color}, 4px 4px 0px rgba(0,0,0,0.3); font-weight: bold; letter-spacing: 1px;`;
        } else if (mode === '5d') {
            style = `text-shadow: 0px 0px 5px ${color}, 1px 1px 0px #fff, 2px 2px 0px ${color}, 3px 3px 0px ${color}, 5px 5px 10px rgba(0,0,0,0.5); font-weight: bold; letter-spacing: 2px;`;
        } else if (mode === '6d') {
            style = `text-shadow: 0px 0px 6px ${color}, 1px 1px 0px #fff, 2px 2px 0px ${color}, 3px 3px 0px ${color}, 4px 4px 0px ${color}, 6px 6px 12px rgba(0,0,0,0.5); font-weight: bold; letter-spacing: 2px;`;
        } else if (mode === '7d') {
            style = `text-shadow: 0px 0px 7px ${color}, 1px 1px 0px #fff, 2px 2px 0px ${color}, 3px 3px 0px ${color}, 4px 4px 0px ${color}, 5px 5px 0px ${color}, 7px 7px 14px rgba(0,0,0,0.6); font-weight: bold; letter-spacing: 3px;`;
        } else if (mode === '8d') {
            style = `text-shadow: 0px 0px 8px ${color}, 1px 1px 0px #fff, 2px 2px 0px ${color}, 3px 3px 0px ${color}, 4px 4px 0px ${color}, 5px 5px 0px ${color}, 6px 6px 0px ${color}, 8px 8px 16px rgba(0,0,0,0.6); font-weight: bold; letter-spacing: 3px;`;
        } else if (mode === '9d') {
            style = `text-shadow: 0px 0px 9px ${color}, 1px 1px 0px #fff, 2px 2px 0px ${color}, 3px 3px 0px ${color}, 4px 4px 0px ${color}, 5px 5px 0px ${color}, 6px 6px 0px ${color}, 7px 7px 0px ${color}, 9px 9px 18px rgba(0,0,0,0.7); font-weight: bold; letter-spacing: 4px; display: inline-block; transform: scaleY(1.1);`;
        } else if (mode === '10d') {
            style = `text-shadow: 0px 0px 10px ${color}, 1px 1px 0px #fff, 2px 2px 0px ${color}, 3px 3px 0px ${color}, 4px 4px 0px ${color}, 5px 5px 0px ${color}, 6px 6px 0px ${color}, 7px 7px 0px ${color}, 8px 8px 0px ${color}, 10px 10px 20px rgba(0,0,0,0.8); font-weight: bold; letter-spacing: 4px; display: inline-block; transform: scaleY(1.2);`;
        }
        return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'textEffect', style, class: 'texteffect-format' }), 0];
    },
    addCommands() {
        return {
            setTextEffect: attributes => ({ commands }) => commands.setMark(this.name, attributes),
            toggleTextEffect: attributes => ({ commands }) => commands.toggleMark(this.name, attributes),
            unsetTextEffect: () => ({ commands }) => commands.unsetMark(this.name),
        };
    },
});

export const FontSizeMark = Mark.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: fontSize + 'px' })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
});

export const UnderlineMark = Mark.create({
    name: 'underline',
    parseHTML() {
        return [
            { tag: 'u' },
            { style: 'text-decoration', getAttrs: value => value === 'underline' && null },
        ]
    },
    renderHTML({ HTMLAttributes }) {
        return ['u', mergeAttributes(HTMLAttributes), 0]
    },
    addCommands() {
        return {
            setUnderline: () => ({ commands }) => commands.setMark('underline'),
            toggleUnderline: () => ({ commands }) => commands.toggleMark('underline'),
            unsetUnderline: () => ({ commands }) => commands.unsetMark('underline'),
        }
    },
    addKeyboardShortcuts() {
        return {
            'Mod-u': () => this.editor.commands.toggleUnderline(),
        }
    },
});
