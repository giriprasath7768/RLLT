import { Node, Mark, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import InteractiveNodeView from './InteractiveNodeView';

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
            fontStyle: 'normal', textAlign: 'left', letterSpacing: 0, color: '#000000'
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

export const ResizableImage = Node.create({
    name: 'resizableImage',
    group: 'block',
    inline: false,
    draggable: true,

    addAttributes() {
        return {
            src: { default: null },
            alt: { default: null },
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
