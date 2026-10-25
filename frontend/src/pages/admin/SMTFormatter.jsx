import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
import { Node, Mark, mergeAttributes } from '@tiptap/core';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

// Custom A4 Multi-Page Document & Page Node for TipTap
const SMTDocument = Document.extend({
    content: 'smtPage+'
});

const SMTPageNode = Node.create({
    name: 'smtPage',
    group: 'block',
    content: 'block+',
    defining: true,
    isolating: true,
    addAttributes() {
        return {
            pageNumber: {
                default: 1,
                parseHTML: element => parseInt(element.getAttribute('data-page-number') || '1', 10),
                renderHTML: attributes => ({
                    'data-page-number': attributes.pageNumber || 1
                })
            },
            totalPages: {
                default: 1,
                parseHTML: element => parseInt(element.getAttribute('data-total-pages') || '1', 10),
                renderHTML: attributes => ({
                    'data-total-pages': attributes.totalPages || 1
                })
            }
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="smt-page"]' }, { tag: 'div.smt-a4-page' }];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'smt-page',
                class: 'smt-a4-page smt-prosemirror-editor'
            }),
            0
        ];
    }
});

// Preserves hanging-indent attribute on numbered points/verses inside TipTap
const SMTBlockAttributes = Node.create({
    name: 'smtBlockAttributes',
    addGlobalAttributes() {
        return [
            {
                types: ['paragraph'],
                attributes: {
                    numberedItem: {
                        default: false,
                        parseHTML: element =>
                            element.getAttribute('data-numbered') === 'true' ||
                            element.classList.contains('smt-numbered-item'),
                        renderHTML: attributes => {
                            if (!attributes.numberedItem) return {};
                            return {
                                'data-numbered': 'true',
                                class: 'smt-numbered-item'
                            };
                        }
                    }
                }
            }
        ];
    }
});

// Custom Underline Mark
const SmartUnderlineMark = Mark.create({
    name: 'smartUnderline',
    parseHTML() {
        return [
            { tag: 'u' },
            {
                style: 'text-decoration',
                getAttrs: value => (typeof value === 'string' && value.includes('underline')) ? {} : false
            }
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['u', mergeAttributes(HTMLAttributes), 0];
    },
    addCommands() {
        return {
            toggleSmartUnderline: () => ({ commands }) => commands.toggleMark(this.name),
        };
    }
});

// Semantic Table Extensions for TipTap (preserves <table>, <tr>, <th>, <td>)
const SmartTable = Node.create({
    name: 'table',
    group: 'block',
    content: 'tableRow+',
    isolating: true,
    parseHTML() {
        return [{ tag: 'table' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', { class: 'smt-table-wrapper' }, ['table', mergeAttributes(HTMLAttributes, { class: 'smt-normalized-table' }), ['tbody', 0]]];
    }
});

const SmartTableRow = Node.create({
    name: 'tableRow',
    content: '(tableHeader | tableCell)+',
    parseHTML() {
        return [{ tag: 'tr' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['tr', mergeAttributes(HTMLAttributes), 0];
    }
});

const SmartTableHeader = Node.create({
    name: 'tableHeader',
    content: 'block+',
    isolating: true,
    parseHTML() {
        return [{ tag: 'th' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['th', mergeAttributes(HTMLAttributes), 0];
    }
});

const SmartTableCell = Node.create({
    name: 'tableCell',
    content: 'block+',
    isolating: true,
    parseHTML() {
        return [{ tag: 'td' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['td', mergeAttributes(HTMLAttributes), 0];
    }
});

// Sample messy HTML matching the specification's "Before paste" example + numbered verses/points
const SAMPLE_MESSY_HTML = `<div style="font-family: 'Times New Roman', serif; line-height: 1.9;">
    <p class="MsoNormal" style="margin: 0in; font-size: 20pt; color: #0f172a; font-family: Georgia, serif;"><b>Spies Sent Out</b></p>
    <p class="MsoNormal" style="margin-top: 10pt; font-family: Georgia, serif; font-size: 13.5pt; color: #1f2937;">
        <b style="color: #2563eb;">19</b>Then, as the Lord our God commanded us, we set out from Horeb and went toward the hill country of the Amorites through all that vast and dreadful wilderness that you have seen, and so we reached Kadesh Barnea. <b style="color: #2563eb;">20</b>Then I said to you, “You have reached the hill country of the Amorites, which the Lord our God is giving us. <b style="color: #2563eb;">21</b>See, the Lord your God has given you the land. Go up and take possession of it as the Lord, the God of your ancestors, told you. Do not be afraid; do not be discouraged.”
    </p>
    <p class="MsoNormal" style="margin-top: 10pt; font-family: Georgia, serif; font-size: 13.5pt; color: #1f2937;">
        <b style="color: #2563eb;">22</b>Then all of you came to me and said, “Let us send men ahead to spy out the land for us and bring back a report about the route we are to take and the towns we will come to.”
    </p>
    <p class="MsoNormal" style="margin-top: 10pt; font-family: Georgia, serif; font-size: 13.5pt; color: #1f2937;">
        <b style="color: #2563eb;">23</b>The idea seemed good to me; so I selected twelve of you, one man from each tribe. <b style="color: #2563eb;">24</b>They left and went up into the hill country, and came to the Valley of Eshcol and explored it.
    </p>
    <p class="MsoNormal" style="margin-top: 12pt; font-family: Calibri, sans-serif; font-size: 15pt; font-weight: bold;">Objectives:</p>
    <p class="MsoListParagraph" style="margin-left: 12pt; font-family: Verdana, sans-serif; font-size: 11pt;">• Improve performance</p>
    <p class="MsoListParagraph" style="margin-left: 48pt; text-indent: 18pt; font-family: 'Courier New', monospace; font-size: 13pt;">• Reduce manual work</p>
    <table style="width: 65%; border: 3px dashed red; background-color: #fef3c7; margin-top: 14px;">
        <tr style="background-color: #fde68a;">
            <td style="padding: 14px; font-family: Papyrus, fantasy; font-size: 15pt; color: #991b1b;"><b>Feature</b></td>
            <td style="padding: 4px; font-family: Impact, sans-serif; font-size: 14pt; color: #1e40af;"><b>Function</b></td>
        </tr>
        <tr>
            <td style="padding: 12px; font-size: 10pt; font-family: 'Times New Roman';">Smart Paste</td>
            <td style="padding: 2px; font-size: 13pt; font-family: Arial; color: #047857;">Automatically cleans pasted content</td>
        </tr>
        <tr>
            <td style="padding: 12px; font-size: 12pt; font-family: Courier;">Numbered Line Break</td>
            <td style="padding: 18px; font-size: 11pt; font-family: Georgia;">Automatically moves each numbered point/verse to a new line</td>
        </tr>
    </table>
</div>`;

const DEFAULT_RULES = {
    smartPasteEnabled: true,
    autoAlignment: true,
    fontNormalization: true,
    headingDetection: true,
    paragraphFormatting: true,
    listNormalization: true,
    tableFormatting: true,
    removeHiddenStyles: true,
    preserveImportantFormatting: true
};

/**
 * Core Smart Paste Engine:
 * Stage 1: Sanitize HTML (strip Word mso-*, Google Docs wrappers, scripts, hidden tags, inline styles)
 * Stage 2: Detect Structure (headings H1/H2/H3, pseudo-headings, bullet/numbered lists, tables, paragraphs)
 * Stage 3: Normalize Styles (fonts, alignment, list indentation, table widths/headers)
 * Stage 4: Apply Document Template (clean semantic HTML ready for TipTap document schema)
 */
export function runSmartPasteEngine(rawHtml, plainText = '', rules = DEFAULT_RULES, templateConfig = {}) {
    const metrics = {
        stylesRemoved: 0,
        fontsNormalized: 0,
        headingsDetected: 0,
        listsNormalized: 0,
        tablesFormatted: 0,
        paragraphsCleaned: 0
    };

    const bodyAlign = templateConfig.bodyAlignment || 'left';

    let workingHtml = (rawHtml || '').trim();
    if (!workingHtml && plainText) {
        const lines = plainText.replace(/\r\n/g, '\n').split('\n');
        const htmlParts = [];
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            htmlParts.push(`<p>${trimmed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`);
        });
        workingHtml = htmlParts.join('\n');
    }

    if (!workingHtml) {
        return { html: '', metrics };
    }

    // Stage 1: Pre-clean Word / Google Docs / PDF comments and XML tags
    if (rules.removeHiddenStyles) {
        workingHtml = workingHtml
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<\/?(?:o|w|v|st1|meta|link|style|script|xml|colgroup|col)[^>]*>/gi, '');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(workingHtml, 'text/html');
    const body = doc.body;

    // Count & strip unwanted attributes while preserving semantic structure
    const allElements = Array.from(body.querySelectorAll('*'));
    allElements.forEach(el => {
        const tag = el.tagName.toLowerCase();

        if (['script', 'style', 'meta', 'link', 'iframe', 'object', 'embed'].includes(tag)) {
            el.remove();
            return;
        }

        const styleAttr = el.getAttribute('style') || '';
        const classAttr = el.getAttribute('class') || '';

        if (/font-family/i.test(styleAttr) || el.hasAttribute('face')) {
            metrics.fontsNormalized += 1;
        }
        if (styleAttr || classAttr || el.hasAttribute('id') || el.hasAttribute('align')) {
            metrics.stylesRemoved += 1;
        }

        // Detect bold/italic/underline from inline spans before stripping styles
        if (rules.preserveImportantFormatting && tag === 'span') {
            const isBold = /font-weight\s*:\s*(bold|[6-9]00)/i.test(styleAttr);
            const isItalic = /font-style\s*:\s*italic/i.test(styleAttr);
            const isUnderline = /text-decoration[^;]*underline/i.test(styleAttr);

            let replacement = el;
            if (isBold) {
                const strong = doc.createElement('strong');
                while (replacement.firstChild) strong.appendChild(replacement.firstChild);
                replacement.appendChild(strong);
            }
            if (isItalic) {
                const em = doc.createElement('em');
                while (replacement.firstChild) em.appendChild(replacement.firstChild);
                replacement.appendChild(em);
            }
            if (isUnderline) {
                const u = doc.createElement('u');
                while (replacement.firstChild) u.appendChild(replacement.firstChild);
                replacement.appendChild(u);
            }
        }
    });

    const cleanInlineNodes = (node) => {
        const frag = doc.createDocumentFragment();
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === 3) {
                const cleanedText = (child.nodeValue || '').replace(/\u00A0/g, ' ');
                frag.appendChild(doc.createTextNode(cleanedText));
                return;
            }
            if (child.nodeType !== 1) return;

            const tag = child.tagName.toLowerCase();
            if (tag === 'br') {
                frag.appendChild(doc.createElement('br'));
                return;
            }

            if (rules.preserveImportantFormatting) {
                if (tag === 'b' || tag === 'strong') {
                    const strong = doc.createElement('strong');
                    strong.appendChild(cleanInlineNodes(child));
                    if (strong.textContent.trim()) frag.appendChild(strong);
                    return;
                }
                if (tag === 'i' || tag === 'em') {
                    const em = doc.createElement('em');
                    em.appendChild(cleanInlineNodes(child));
                    if (em.textContent.trim()) frag.appendChild(em);
                    return;
                }
                if (tag === 'u') {
                    const u = doc.createElement('u');
                    u.appendChild(cleanInlineNodes(child));
                    if (u.textContent.trim()) frag.appendChild(u);
                    return;
                }
                if (tag === 'a') {
                    const a = doc.createElement('a');
                    const href = child.getAttribute('href') || '#';
                    a.setAttribute('href', href);
                    a.setAttribute('target', '_blank');
                    a.setAttribute('rel', 'noopener noreferrer');
                    a.appendChild(cleanInlineNodes(child));
                    if (a.textContent.trim()) frag.appendChild(a);
                    return;
                }
                if (tag === 'code' || tag === 'sub' || tag === 'sup') {
                    const el = doc.createElement(tag);
                    el.appendChild(cleanInlineNodes(child));
                    frag.appendChild(el);
                    return;
                }
            }

            frag.appendChild(cleanInlineNodes(child));
        });
        return frag;
    };

    /**
     * Helper to split a paragraph's text or inline content when multiple numbered points/verses
     * are run together on the same line (e.g. "19Then ... Barnea. 20Then ... 21See, the Lord..."
     * or "6. Sixth point completed. 7. Seventh point...").
     * Ensures each numbered point/verse starts cleanly on its own line!
     */
    const splitInlineNumberedSegments = (rawText) => {
        if (!rawText) return [];
        const normalized = rawText
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Normalize run-together numbers at the very start or mid-sentence:
        // e.g. "19Then" -> "19. Then", "10(The Emites" -> "10. (The Emites", "Barnea. 20Then" -> "Barnea.\n20. Then",
        // or "completed. 7. Next" -> "completed.\n7. Next", "completed. 7) Next" -> "completed.\n7. Next"
        let withBreaks = normalized
            // Case A: Mid-paragraph or start-of-line run-together number attached to Capitalized or lowercase word, quote, or paren/bracket (e.g., "20Then", "17the", "29as", "10(The", "21“You")
            .replace(/(^|[\s.!?'"”’)\],;:\-—])(\d{1,3})\s*(?=(?:[“"‘'(\[]\s*)?(?:[A-Z][a-zA-Z]|(?!(?:st|nd|rd|th|px|pt|em|rem|vh|vw|ms|sec|min|hr|hrs|am|pm|kg|mg|cm|mm|km|gb|mb|kb|tb|fps|dpi|hz)\b)[a-z]{2,}))/g, (m, pre, num) => {
                if (!pre) return `${num}. `;
                return `${pre.trim()}\n${num}. `;
            })
            // Case B: Mid-paragraph number with dot/paren or space after sentence/clause punctuation (e.g., ". 20 Then", ". 10 (The", ". 7. Point")
            .replace(/([.!?'"”’)\],;:\-—]\s+)(?:\((\d{1,3})\)|(\d{1,3})[\.\)]?)\s*(?=[A-Z“"‘'(\[])/g, (m, pre, pNum, dNum) => {
                const num = pNum || dNum;
                return `${pre.trim()}\n${num}. `;
            })
            // Case C: Start-of-line number followed by optional space and letter, quote, or paren without dot (e.g. "19 Then", "17the", "10(The Emites")
            .replace(/^(\d{1,3})[\.\)]?\s*(?=(?:[“"‘'(\[]\s*)?(?:[A-Z]|(?!(?:st|nd|rd|th|px|pt|em|rem|vh|vw|ms|sec|min|hr|hrs|am|pm|kg|mg|cm|mm|km|gb|mb|kb|tb|fps|dpi|hz)\b)[a-z]{2,}))/, '$1. ');

        return withBreaks
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);
    };

    const outputBlocks = [];
    let pendingList = null;

    const flushPendingList = () => {
        if (!pendingList || pendingList.items.length === 0) return;
        const listEl = doc.createElement(pendingList.type);
        pendingList.items.forEach(itemFrag => {
            const li = doc.createElement('li');
            const p = doc.createElement('p');
            p.appendChild(itemFrag);
            li.appendChild(p);
            listEl.appendChild(li);
        });
        outputBlocks.push(listEl.outerHTML);
        metrics.listsNormalized += 1;
        pendingList = null;
    };

    const bulletRegex = /^[\s\u00A0]*(?:[•●○◦▪▫▸►–—\-\*]|\(\d+\))\s*/;
    const orderedRegex = /^[\s\u00A0]*(?:(\d{1,3})[\.\)]|([a-zA-Z])[\.\)])\s+/;

    const pushCleanSegment = (segText, styleAttr = '', classAttr = '', originalNode = null) => {
        const txt = segText.trim();
        if (!txt) return;

        const bulletMatch = bulletRegex.test(txt);
        const orderedMatch = txt.match(orderedRegex);

        if (rules.listNormalization && (bulletMatch || orderedMatch || /MsoListParagraph/i.test(classAttr))) {
            flushPendingList();
            // Render numbered points with their explicit number preserved (e.g. "1. Then...", "10. (The...", "19. Then...")
            // and hanging indent so wrapped lines align cleanly under the text column!
            if (orderedMatch) {
                const p = doc.createElement('p');
                p.setAttribute('data-numbered', 'true');
                p.className = 'smt-numbered-item';
                if (rules.autoAlignment && bodyAlign !== 'left') {
                    p.style.textAlign = bodyAlign;
                }
                const numLabel = orderedMatch[1] || orderedMatch[2];
                const restText = txt.replace(orderedRegex, '').trim();
                const strongNum = doc.createElement('strong');
                strongNum.textContent = `${numLabel}. `;
                p.appendChild(strongNum);
                p.appendChild(doc.createTextNode(restText));
                outputBlocks.push(p.outerHTML);
                metrics.listsNormalized += 1;
                metrics.paragraphsCleaned += 1;
                return;
            }

            // Bullet list items
            if (pendingList && pendingList.type !== 'ul') {
                flushPendingList();
            }
            if (!pendingList) {
                pendingList = { type: 'ul', items: [] };
            }
            const f = doc.createDocumentFragment();
            f.appendChild(doc.createTextNode(txt.replace(bulletRegex, '').trim()));
            pendingList.items.push(f);
            return;
        }

        flushPendingList();

        if (rules.headingDetection) {
            const fontSizeMatch = styleAttr.match(/font-size\s*:\s*([\d.]+)\s*(pt|px)/i);
            let fontSizePx = 0;
            if (fontSizeMatch) {
                const val = parseFloat(fontSizeMatch[1]);
                const unit = fontSizeMatch[2].toLowerCase();
                fontSizePx = unit === 'pt' ? val * 1.333 : val;
            }

            const hasOnlyBoldOrItalic = (() => {
                if (!originalNode) return false;
                const children = Array.from(originalNode.children || []);
                if (children.length === 1 && ['B', 'STRONG', 'I', 'EM'].includes(children[0].tagName)) {
                    return children[0].textContent.trim() === txt;
                }
                return /font-weight\s*:\s*(bold|[6-9]00)/i.test(styleAttr);
            })();

            const isShortTitle = txt.length <= 65 && !/[.!?]$/.test(txt);
            const isColonSectionLabel = txt.length <= 55 && txt.endsWith(':');

            if (fontSizePx >= 22 || (outputBlocks.length === 0 && isShortTitle && (hasOnlyBoldOrItalic || fontSizePx >= 18))) {
                const h1 = doc.createElement('h1');
                h1.textContent = txt;
                outputBlocks.push(h1.outerHTML);
                metrics.headingsDetected += 1;
                return;
            }

            if (isColonSectionLabel || (isShortTitle && (hasOnlyBoldOrItalic || fontSizePx >= 16))) {
                const h2 = doc.createElement('h2');
                h2.textContent = txt;
                outputBlocks.push(h2.outerHTML);
                metrics.headingsDetected += 1;
                return;
            }
        }

        const p = doc.createElement('p');
        if (rules.autoAlignment && bodyAlign !== 'left') {
            p.style.textAlign = bodyAlign;
        }
        if (originalNode && splitInlineNumberedSegments(originalNode.textContent || '').length <= 1) {
            p.appendChild(cleanInlineNodes(originalNode));
        } else {
            p.textContent = txt;
        }
        outputBlocks.push(p.outerHTML);
        metrics.paragraphsCleaned += 1;
    };

    const processNode = (node) => {
        if (node.nodeType === 3) {
            const rawLines = (node.nodeValue || '').replace(/\r\n/g, '\n').split('\n');
            rawLines.forEach(ln => {
                const segments = splitInlineNumberedSegments(ln);
                segments.forEach(seg => pushCleanSegment(seg));
            });
            return;
        }

        if (node.nodeType !== 1) return;
        const tag = node.tagName.toLowerCase();

        if (['div', 'section', 'article', 'main', 'header', 'footer', 'center', 'font'].includes(tag)) {
            const hasBlockChild = Array.from(node.children).some(ch =>
                ['DIV', 'P', 'UL', 'OL', 'TABLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'].includes(ch.tagName)
            );
            if (!hasBlockChild && (node.textContent || '').trim()) {
                processParagraphLikeElement(node);
                return;
            }
            Array.from(node.childNodes).forEach(processNode);
            return;
        }

        if (tag === 'ul' || tag === 'ol') {
            if (!rules.listNormalization) {
                flushPendingList();
                outputBlocks.push(node.outerHTML);
                return;
            }
            const isOrderedList = tag === 'ol';
            const liElements = Array.from(node.querySelectorAll('li'));
            const startAttr = parseInt(node.getAttribute('start') || '1', 10) || 1;

            if (isOrderedList) {
                flushPendingList();
                liElements.forEach((li, idx) => {
                    const clone = li.cloneNode(true);
                    Array.from(clone.querySelectorAll('ul, ol')).forEach(nested => nested.remove());
                    const segments = splitInlineNumberedSegments(clone.textContent || '');
                    segments.forEach((seg, sIdx) => {
                        const hasNumberPrefix = orderedRegex.test(seg);
                        const lineWithNumber = hasNumberPrefix ? seg : `${startAttr + idx + sIdx}. ${seg}`;
                        pushCleanSegment(lineWithNumber);
                    });
                });
                return;
            }

            if (pendingList && pendingList.type !== 'ul') {
                flushPendingList();
            }
            if (!pendingList) {
                pendingList = { type: 'ul', items: [] };
            }

            liElements.forEach(li => {
                const clone = li.cloneNode(true);
                Array.from(clone.querySelectorAll('ul, ol')).forEach(nested => nested.remove());
                const rawText = (clone.textContent || '').replace(bulletRegex, '').replace(orderedRegex, '').trim();
                if (!rawText) return;

                const cleanedFrag = cleanInlineNodes(clone);
                if (cleanedFrag.firstChild && cleanedFrag.firstChild.nodeType === 3) {
                    cleanedFrag.firstChild.nodeValue = cleanedFrag.firstChild.nodeValue
                        .replace(bulletRegex, '')
                        .replace(orderedRegex, '');
                }
                pendingList.items.push(cleanedFrag);
            });
            return;
        }

        if (tag === 'table') {
            flushPendingList();
            if (!rules.tableFormatting) {
                outputBlocks.push(node.outerHTML);
                return;
            }
            const rows = Array.from(node.querySelectorAll('tr'));
            if (rows.length === 0) return;

            const cleanTable = doc.createElement('table');
            const tbody = doc.createElement('tbody');

            rows.forEach((row, rIdx) => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                if (cells.length === 0) return;
                const tr = doc.createElement('tr');
                cells.forEach(cell => {
                    const isHeader = rIdx === 0 || cell.tagName.toLowerCase() === 'th';
                    const cellEl = doc.createElement(isHeader ? 'th' : 'td');
                    const p = doc.createElement('p');
                    const cleaned = cleanInlineNodes(cell);
                    if (isHeader) {
                        p.textContent = (cell.textContent || '').trim();
                    } else {
                        p.appendChild(cleaned);
                    }
                    cellEl.appendChild(p);
                    tr.appendChild(cellEl);
                });
                tbody.appendChild(tr);
            });

            cleanTable.appendChild(tbody);
            outputBlocks.push(cleanTable.outerHTML);
            metrics.tablesFormatted += 1;
            return;
        }

        if (/^h[1-6]$/.test(tag)) {
            flushPendingList();
            const rawText = (node.textContent || '').replace(/\s+/g, ' ').trim();
            if (!rawText) return;

            let level = parseInt(tag.charAt(1), 10);
            if (level > 3) level = 3;
            const hEl = doc.createElement(rules.headingDetection ? `h${level}` : 'p');
            hEl.textContent = rawText;
            outputBlocks.push(hEl.outerHTML);
            metrics.headingsDetected += 1;
            return;
        }

        if (['p', 'li', 'pre', 'blockquote'].includes(tag)) {
            processParagraphLikeElement(node);
        }
    };

    const processParagraphLikeElement = (node) => {
        const rawText = (node.textContent || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
        if (!rawText) return;

        const styleAttr = node.getAttribute('style') || '';
        const classAttr = node.getAttribute('class') || '';

        const segments = splitInlineNumberedSegments(rawText);
        if (segments.length > 1) {
            segments.forEach(seg => pushCleanSegment(seg, styleAttr, classAttr, null));
            return;
        }

        pushCleanSegment(segments[0] || rawText, styleAttr, classAttr, node);
    };

    Array.from(body.childNodes).forEach(processNode);
    flushPendingList();

    return {
        html: outputBlocks.join('\n'),
        metrics
    };
}

/**
 * Paginates normalized HTML blocks into one or more A4-sized page containers
 * (<div data-type="smt-page" class="smt-a4-page" data-page-number="1" data-total-pages="N">...</div>)
 * so that content exceeding one A4 sheet automatically renders across multiple A4 pages.
 */
function paginateHtmlIntoA4Pages(blocksHtml, font = 'Inter, sans-serif', spacing = '1.65', bodyAlign = 'left') {
    if (typeof document === 'undefined') {
        return {
            pagedHtml: `<div data-type="smt-page" class="smt-a4-page" data-page-number="1" data-total-pages="1">${blocksHtml || '<p></p>'}</div>`,
            pageCount: 1
        };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(blocksHtml || '<p></p>', 'text/html');

    // Unwrap any existing smt-page containers so we always paginate clean top-level blocks
    const sourceBlocks = [];
    Array.from(doc.body.children).forEach(child => {
        if (child.getAttribute('data-type') === 'smt-page' || child.classList.contains('smt-a4-page')) {
            Array.from(child.children).forEach(inner => {
                const cloned = inner.cloneNode(true);
                if (cloned.tagName === 'P') {
                    cloned.style.textAlign = bodyAlign;
                }
                sourceBlocks.push(cloned);
            });
        } else {
            const cloned = child.cloneNode(true);
            if (cloned.tagName === 'P') {
                cloned.style.textAlign = bodyAlign;
            }
            sourceBlocks.push(cloned);
        }
    });

    if (sourceBlocks.length === 0) {
        return {
            pagedHtml: `<div data-type="smt-page" class="smt-a4-page" data-page-number="1" data-total-pages="1"><p></p></div>`,
            pageCount: 1
        };
    }

    // Create off-screen A4 measurement sandbox matching exact A4 dimensions (210mm x 297mm, 20mm padding)
    const sandbox = document.createElement('div');
    sandbox.style.position = 'fixed';
    sandbox.style.left = '-10000px';
    sandbox.style.top = '0';
    sandbox.style.visibility = 'hidden';
    sandbox.style.pointerEvents = 'none';
    sandbox.style.width = '210mm';
    sandbox.style.padding = '0';
    sandbox.style.boxSizing = 'border-box';
    document.body.appendChild(sandbox);

    const probePage = document.createElement('div');
    probePage.style.width = '210mm';
    probePage.style.height = '297mm';
    probePage.style.padding = '20mm';
    probePage.style.boxSizing = 'border-box';
    sandbox.appendChild(probePage);

    const probeStyle = window.getComputedStyle(probePage);
    const fullPageHeightPx = probePage.offsetHeight || 1122;
    const padTopPx = parseFloat(probeStyle.paddingTop) || 75.6;
    const padBottomPx = parseFloat(probeStyle.paddingBottom) || 75.6;
    // Usable vertical content area inside one A4 sheet (leaving a small footer margin for page number)
    const maxContentHeightPx = Math.max(400, fullPageHeightPx - padTopPx - padBottomPx - 28);
    sandbox.removeChild(probePage);

    const createMeasurePage = () => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'smt-prosemirror-editor';
        pageDiv.style.width = '100%';
        pageDiv.style.paddingLeft = '20mm';
        pageDiv.style.paddingRight = '20mm';
        pageDiv.style.boxSizing = 'border-box';
        pageDiv.style.fontFamily = font;
        pageDiv.style.lineHeight = spacing;
        pageDiv.style.fontSize = '15px';
        sandbox.appendChild(pageDiv);
        return pageDiv;
    };

    const pagesHtml = [];
    let currentPageDiv = createMeasurePage();

    const finalizeCurrentPage = () => {
        if (currentPageDiv.children.length > 0) {
            pagesHtml.push(currentPageDiv.innerHTML);
        }
        if (currentPageDiv.parentNode === sandbox) {
            sandbox.removeChild(currentPageDiv);
        }
        currentPageDiv = createMeasurePage();
    };

    const popTrailingHeadingIfOrphaned = () => {
        if (currentPageDiv.children.length > 1) {
            const lastChild = currentPageDiv.lastElementChild;
            if (lastChild && /^H[1-3]$/.test(lastChild.tagName)) {
                currentPageDiv.removeChild(lastChild);
                return lastChild;
            }
        }
        return null;
    };

    const placeBlock = (block) => {
        const tag = (block.tagName || '').toLowerCase();

        // Try placing the whole block on the current page
        const candidate = block.cloneNode(true);
        currentPageDiv.appendChild(candidate);

        if (currentPageDiv.scrollHeight <= maxContentHeightPx) {
            return;
        }

        // It overflowed the current page; remove it and handle splitting or moving to next page
        currentPageDiv.removeChild(candidate);

        // Case 1: Ordered or Unordered List (<ol> / <ul>) -> split list items across pages
        if (tag === 'ol' || tag === 'ul') {
            const items = Array.from(block.children).filter(c => c.tagName.toLowerCase() === 'li');
            let runningStart = parseInt(block.getAttribute('start') || '1', 10);
            let idx = 0;

            while (idx < items.length) {
                const partialList = document.createElement(tag);
                if (tag === 'ol' && runningStart > 1) {
                    partialList.setAttribute('start', String(runningStart));
                }
                currentPageDiv.appendChild(partialList);

                let addedCount = 0;
                while (idx < items.length) {
                    const liClone = items[idx].cloneNode(true);
                    partialList.appendChild(liClone);

                    if (currentPageDiv.scrollHeight > maxContentHeightPx) {
                        // If current page is completely empty and a single list item is huge, keep it so we make progress
                        if (currentPageDiv.children.length === 1 && addedCount === 0) {
                            idx += 1;
                            addedCount += 1;
                            runningStart += 1;
                            break;
                        }
                        partialList.removeChild(liClone);
                        break;
                    }

                    idx += 1;
                    addedCount += 1;
                    runningStart += 1;
                }

                if (addedCount === 0) {
                    currentPageDiv.removeChild(partialList);
                    const orphanHeading = popTrailingHeadingIfOrphaned();
                    finalizeCurrentPage();
                    if (orphanHeading) {
                        currentPageDiv.appendChild(orphanHeading);
                    }
                } else if (idx < items.length) {
                    finalizeCurrentPage();
                }
            }
            return;
        }

        // Case 2: Table (<table> or .smt-table-wrapper)
        const tableEl = tag === 'table' ? block : block.querySelector?.('table');
        if (tableEl) {
            if (currentPageDiv.children.length > 0) {
                const orphanHeading = popTrailingHeadingIfOrphaned();
                finalizeCurrentPage();
                if (orphanHeading) {
                    currentPageDiv.appendChild(orphanHeading);
                }
            }

            const freshTableCandidate = block.cloneNode(true);
            currentPageDiv.appendChild(freshTableCandidate);
            if (currentPageDiv.scrollHeight <= maxContentHeightPx) {
                return;
            }
            currentPageDiv.removeChild(freshTableCandidate);

            const rows = Array.from(tableEl.querySelectorAll('tr'));
            if (rows.length <= 1) {
                currentPageDiv.appendChild(freshTableCandidate);
                return;
            }

            const hasHeaderRow = rows[0].querySelectorAll('th').length > 0;
            const headerRowTemplate = hasHeaderRow ? rows[0] : null;
            let rowIdx = hasHeaderRow ? 1 : 0;

            while (rowIdx < rows.length) {
                const wrapperDiv = document.createElement('div');
                wrapperDiv.className = 'smt-table-wrapper';
                const partTable = document.createElement('table');
                partTable.className = 'smt-normalized-table';
                const tbody = document.createElement('tbody');
                if (headerRowTemplate) {
                    tbody.appendChild(headerRowTemplate.cloneNode(true));
                }
                partTable.appendChild(tbody);
                wrapperDiv.appendChild(partTable);
                currentPageDiv.appendChild(wrapperDiv);

                let rowsPlaced = 0;
                while (rowIdx < rows.length) {
                    const trClone = rows[rowIdx].cloneNode(true);
                    tbody.appendChild(trClone);
                    if (currentPageDiv.scrollHeight > maxContentHeightPx && rowsPlaced > 0) {
                        tbody.removeChild(trClone);
                        break;
                    }
                    rowIdx += 1;
                    rowsPlaced += 1;
                    if (currentPageDiv.scrollHeight > maxContentHeightPx) {
                        break;
                    }
                }

                if (rowIdx < rows.length) {
                    finalizeCurrentPage();
                }
            }
            return;
        }

        // Case 3: Paragraph or Heading
        if (currentPageDiv.children.length > 0) {
            const orphanHeading = popTrailingHeadingIfOrphaned();
            finalizeCurrentPage();
            if (orphanHeading) {
                currentPageDiv.appendChild(orphanHeading);
            }
        }

        const freshCandidate = block.cloneNode(true);
        currentPageDiv.appendChild(freshCandidate);
        if (currentPageDiv.scrollHeight <= maxContentHeightPx) {
            return;
        }

        // If a single paragraph is even taller than a full blank A4 sheet, split it by sentences across pages
        if (tag === 'p') {
            currentPageDiv.removeChild(freshCandidate);
            const fullText = (block.textContent || '').trim();
            const sentences = fullText.split(/(?<=[.!?])\s+/).filter(Boolean);

            if (sentences.length > 1) {
                let sIdx = 0;
                while (sIdx < sentences.length) {
                    const pPart = document.createElement('p');
                    pPart.style.textAlign = block.style.textAlign || bodyAlign;
                    currentPageDiv.appendChild(pPart);

                    let currentStr = '';
                    let countInPart = 0;
                    while (sIdx < sentences.length) {
                        const nextStr = currentStr ? `${currentStr} ${sentences[sIdx]}` : sentences[sIdx];
                        pPart.textContent = nextStr;

                        if (currentPageDiv.scrollHeight > maxContentHeightPx && countInPart > 0) {
                            pPart.textContent = currentStr;
                            break;
                        }
                        currentStr = nextStr;
                        sIdx += 1;
                        countInPart += 1;
                        if (currentPageDiv.scrollHeight > maxContentHeightPx) {
                            break;
                        }
                    }

                    if (sIdx < sentences.length) {
                        finalizeCurrentPage();
                    }
                }
                return;
            }
        }
    };

    sourceBlocks.forEach(block => placeBlock(block));

    if (currentPageDiv.children.length > 0) {
        pagesHtml.push(currentPageDiv.innerHTML);
    }

    if (sandbox.parentNode) {
        sandbox.parentNode.removeChild(sandbox);
    }

    const finalPages = pagesHtml.length > 0 ? pagesHtml : ['<p></p>'];
    const totalPages = finalPages.length;
    const pagedHtml = finalPages
        .map(
            (pageContent, idx) =>
                `<div data-type="smt-page" class="smt-a4-page" data-page-number="${idx + 1}" data-total-pages="${totalPages}">${pageContent}</div>`
        )
        .join('');

    return { pagedHtml, pageCount: totalPages };
}

const SMTFormatter = () => {
    const [rules, setRules] = useState(DEFAULT_RULES);
    const [templateFont, setTemplateFont] = useState('Inter, sans-serif');
    const [bodyAlignment, setBodyAlignment] = useState('left');
    const [lineSpacing, setLineSpacing] = useState('1.65');
    // 'before' is displayed first when loaded or when putting new content; 'after' displays the A4 sheet(s)
    const [viewStep, setViewStep] = useState('before');
    const [pageCount, setPageCount] = useState(1);
    const [rawInputEmpty, setRawInputEmpty] = useState(true);
    const [lastCleanedBlocksHtml, setLastCleanedBlocksHtml] = useState('');
    const [lastMetrics, setLastMetrics] = useState({
        stylesRemoved: 0,
        fontsNormalized: 0,
        headingsDetected: 0,
        listsNormalized: 0,
        tablesFormatted: 0,
        paragraphsCleaned: 0
    });
    const [statusToast, setStatusToast] = useState(null);
    const [documentTitle, setDocumentTitle] = useState('SMT_Formatted_Document');
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [rulesDropdownOpen, setRulesDropdownOpen] = useState(false);

    const rawPasteBoxRef = useRef(null);
    const formattedOutputRef = useRef(null);
    const rulesDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (rulesDropdownRef.current && !rulesDropdownRef.current.contains(e.target)) {
                setRulesDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showNotice = (msg) => {
        setStatusToast(msg);
        setTimeout(() => {
            setStatusToast(prev => (prev === msg ? null : prev));
        }, 4000);
    };

    const editor = useEditor({
        extensions: [
            SMTDocument,
            SMTPageNode,
            SMTBlockAttributes,
            StarterKit.configure({
                document: false,
                heading: { levels: [1, 2, 3] }
            }),
            TextStyle,
            Color,
            FontFamily,
            SmartUnderlineMark,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            SmartTable,
            SmartTableRow,
            SmartTableHeader,
            SmartTableCell
        ],
        content: `<div data-type="smt-page" class="smt-a4-page smt-prosemirror-editor" data-page-number="1" data-total-pages="1"><p></p></div>`,
        editorProps: {
            attributes: {
                class: 'smt-prosemirror-editor focus:outline-none'
            },
            handlePaste: (view, event) => {
                if (!rules.smartPasteEnabled) return false;
                const clipboardData = event.clipboardData;
                if (!clipboardData) return false;

                const rawHtml = clipboardData.getData('text/html') || '';
                const plainText = clipboardData.getData('text/plain') || '';
                if (!rawHtml && !plainText) return false;

                event.preventDefault();
                const { html: cleanedHtml, metrics } = runSmartPasteEngine(
                    rawHtml,
                    plainText,
                    rules,
                    { bodyAlignment }
                );
                if (cleanedHtml && editor) {
                    const { pagedHtml, pageCount: total } = paginateHtmlIntoA4Pages(
                        cleanedHtml,
                        templateFont,
                        lineSpacing,
                        bodyAlignment
                    );
                    editor.commands.setContent(pagedHtml);
                    setLastCleanedBlocksHtml(cleanedHtml);
                    setPageCount(total);
                    setLastMetrics(metrics);
                    showNotice(
                        `Smart Paste Engine formatted content into ${total} A4 ${total === 1 ? 'page' : 'pages'}!`
                    );
                    return true;
                }
                return false;
            }
        }
    });

    // Apply alignment from toolbar buttons (Left, Center, Right, Justify)
    const handleApplyAlignment = useCallback(
        (align) => {
            setBodyAlignment(align);
            if (!editor) return;
            const { empty } = editor.state.selection;
            if (!empty) {
                editor.chain().focus().setTextAlign(align).run();
                return;
            }
            editor.chain().focus().selectAll().setTextAlign(align).setTextSelection(0).run();
        },
        [editor]
    );

    // Re-paginate A4 pages whenever font, line spacing, or auto-alignment changes in the 'after' view
    useEffect(() => {
        if (!editor || viewStep !== 'after' || !lastCleanedBlocksHtml) return;
        const { pagedHtml, pageCount: total } = paginateHtmlIntoA4Pages(
            lastCleanedBlocksHtml,
            templateFont,
            lineSpacing,
            bodyAlignment
        );
        editor.commands.setContent(pagedHtml);
        setPageCount(total);
    }, [templateFont, lineSpacing, bodyAlignment, viewStep, lastCleanedBlocksHtml, editor]);

    // Run Smart Paste Engine when clicking the "Smart Paste Engine" button inside Before Paste
    const handleRunSmartPasteEngine = useCallback(() => {
        if (!editor) return;

        const rawBoxEl = rawPasteBoxRef.current;
        const rawHtml = rawBoxEl ? rawBoxEl.innerHTML.trim() : '';
        const rawText = rawBoxEl ? (rawBoxEl.innerText || rawBoxEl.textContent || '').trim() : '';

        if (!rawHtml && !rawText) {
            showNotice('Please paste your content into the "Before Paste" box first.');
            return;
        }

        const { html: cleanedHtml, metrics } = runSmartPasteEngine(
            rawHtml,
            rawText,
            rules,
            { bodyAlignment }
        );

        if (cleanedHtml) {
            const { pagedHtml, pageCount: total } = paginateHtmlIntoA4Pages(
                cleanedHtml,
                templateFont,
                lineSpacing,
                bodyAlignment
            );
            editor.commands.setContent(pagedHtml);
            setLastCleanedBlocksHtml(cleanedHtml);
            setPageCount(total);
            setLastMetrics(metrics);
            setViewStep('after');
            showNotice(
                `Smart Paste Engine applied! Formatted into ${total} A4 ${total === 1 ? 'page' : 'pages'}.`
            );
        }
    }, [editor, rules, bodyAlignment, templateFont, lineSpacing]);

    const handleNewContent = () => {
        if (rawPasteBoxRef.current) {
            rawPasteBoxRef.current.innerHTML = '';
        }
        setRawInputEmpty(true);
        setLastCleanedBlocksHtml('');
        setPageCount(1);
        setViewStep('before');
        setLastMetrics({
            stylesRemoved: 0,
            fontsNormalized: 0,
            headingsDetected: 0,
            listsNormalized: 0,
            tablesFormatted: 0,
            paragraphsCleaned: 0
        });
        setTimeout(() => {
            rawPasteBoxRef.current?.focus();
        }, 30);
    };

    const handleLoadSampleContent = () => {
        if (rawPasteBoxRef.current) {
            rawPasteBoxRef.current.innerHTML = SAMPLE_MESSY_HTML;
            setRawInputEmpty(false);
        }
        setViewStep('before');
        showNotice('Sample content loaded in "Before Paste". Click "Smart Paste Engine" to format it!');
    };

    const getSafeFileName = (ext) => {
        const cleaned = (documentTitle || 'SMT_Formatted_Document')
            .trim()
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '');
        return `${cleaned || 'SMT_Formatted_Document'}.${ext}`;
    };

    const handleExportWord = () => {
        if (!editor) return;
        const plainTxt = (editor.getText() || '').trim();
        if (!plainTxt) {
            showNotice('Please format some content first before exporting to Word.');
            return;
        }

        // Extract each A4 page and join with Word page breaks if there is more than 1 page
        const parser = new DOMParser();
        const doc = parser.parseFromString(editor.getHTML(), 'text/html');
        const pageNodes = Array.from(doc.body.querySelectorAll('.smt-a4-page, div[data-type="smt-page"]'));
        const bodyContentHtml =
            pageNodes.length > 0
                ? pageNodes
                      .map(node => node.innerHTML)
                      .join('<br clear="all" style="mso-special-character:line-break;page-break-before:always" />')
                : editor.getHTML();

        const wordStyles = `
            <style>
                @page { size: A4; margin: 20mm; }
                body {
                    font-family: ${templateFont};
                    font-size: 12pt;
                    line-height: ${lineSpacing};
                    color: #111827;
                }
                h1 { font-size: 18pt; font-weight: bold; color: #0f172a; margin-top: 12pt; margin-bottom: 8pt; }
                h2 { font-size: 14pt; font-weight: bold; color: #0f172a; margin-top: 10pt; margin-bottom: 6pt; }
                h3 { font-size: 12.5pt; font-weight: bold; color: #1e293b; margin-top: 8pt; margin-bottom: 4pt; }
                p { margin-top: 0pt; margin-bottom: 8pt; text-align: ${bodyAlignment}; }
                p.smt-numbered-item { margin-left: 24pt; text-indent: -24pt; }
                ul, ol { margin-top: 4pt; margin-bottom: 8pt; padding-left: 18pt; }
                li { margin-bottom: 4pt; }
                table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
                th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; text-align: left; padding: 6pt 8pt; border: 1pt solid #cbd5e1; }
                td { padding: 6pt 8pt; border: 1pt solid #cbd5e1; color: #1e293b; vertical-align: top; }
                a { color: #2563eb; text-decoration: underline; }
            </style>
        `;

        const header =
            "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            `<head><meta charset='utf-8'><title>${documentTitle || 'SMT Formatted Document'}</title>${wordStyles}</head><body>`;
        const footer = '</body></html>';
        const sourceHTML = header + bodyContentHtml + footer;

        const blob = new Blob(['\ufeff', sourceHTML], {
            type: 'application/msword'
        });

        const filename = getSafeFileName('doc');
        const downloadLink = document.createElement('a');
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);

        showNotice(`Word document "${filename}" downloaded!`);
    };

    const handleExportPDF = async () => {
        if (!editor) return;
        const plainTxt = (editor.getText() || '').trim();
        if (!plainTxt) {
            showNotice('Please format some content first before exporting to PDF.');
            return;
        }

        const targetEl = formattedOutputRef.current;
        if (!targetEl) return;

        setIsExportingPdf(true);
        try {
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidthMm = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297mm
            const marginXMm = 18; // 18mm left & right margins
            const marginYMm = 18; // 18mm top & bottom margins
            const usableWidthMm = pageWidthMm - marginXMm * 2; // 174mm
            const usableHeightMm = pageHeightMm - marginYMm * 2; // 261mm

            const pageElements = Array.from(targetEl.querySelectorAll('.smt-a4-page'));
            const targets = pageElements.length > 0 ? pageElements : [targetEl];

            // Build an off-screen export stage that embeds all typography, alignment, and hanging-indent CSS
            // directly inside each captured node so html-to-image preserves 100% of formatting and alignment
            const exportHost = document.createElement('div');
            exportHost.style.position = 'fixed';
            exportHost.style.left = '0';
            exportHost.style.top = '0';
            exportHost.style.zIndex = '-9999';
            exportHost.style.opacity = '1';
            exportHost.style.pointerEvents = 'none';
            exportHost.style.background = '#ffffff';
            document.body.appendChild(exportHost);

            const contentWidthPx = 658; // 174mm at 96 DPI

            const embeddedCss = `
                .smt-pdf-render-box {
                    width: ${contentWidthPx}px;
                    background: #ffffff;
                    color: #111827;
                    font-family: ${templateFont};
                    line-height: ${lineSpacing};
                    font-size: 15px;
                    box-sizing: border-box;
                    margin: 0;
                    padding: 4px 2px;
                }
                .smt-pdf-render-box h1 {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-top: 4px;
                    margin-bottom: 12px;
                    line-height: 1.3;
                }
                .smt-pdf-render-box h2 {
                    font-size: 18.5px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-top: 14px;
                    margin-bottom: 8px;
                    line-height: 1.35;
                }
                .smt-pdf-render-box h3 {
                    font-size: 16.5px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-top: 12px;
                    margin-bottom: 6px;
                    line-height: 1.4;
                }
                .smt-pdf-render-box p {
                    margin-top: 0;
                    margin-bottom: 11px;
                    color: #1f2937;
                    text-align: ${bodyAlignment};
                }
                .smt-pdf-render-box p.smt-numbered-item,
                .smt-pdf-render-box p[data-numbered="true"] {
                    padding-left: 2.35em !important;
                    text-indent: -2.35em !important;
                }
                .smt-pdf-render-box p.smt-numbered-item > strong:first-child,
                .smt-pdf-render-box p[data-numbered="true"] > strong:first-child {
                    display: inline-block;
                    min-width: 2.35em;
                    text-indent: 0;
                    text-align: left;
                }
                .smt-pdf-render-box ul {
                    list-style-type: disc;
                    padding-left: 22px;
                    margin-top: 4px;
                    margin-bottom: 12px;
                }
                .smt-pdf-render-box ol {
                    list-style-type: decimal;
                    padding-left: 22px;
                    margin-top: 4px;
                    margin-bottom: 12px;
                }
                .smt-pdf-render-box li {
                    margin-bottom: 6px;
                    padding-left: 2px;
                }
                .smt-pdf-render-box li p {
                    margin-bottom: 3px;
                }
                .smt-pdf-render-box table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #cbd5e1;
                    font-size: 14px;
                    margin: 12px 0;
                    background: #ffffff;
                }
                .smt-pdf-render-box th {
                    background-color: #f1f5f9;
                    color: #0f172a;
                    font-weight: 800;
                    text-align: left;
                    padding: 9px 12px;
                    border: 1px solid #cbd5e1;
                }
                .smt-pdf-render-box td {
                    padding: 8px 12px;
                    border: 1px solid #cbd5e1;
                    color: #1e293b;
                    vertical-align: top;
                }
                .smt-pdf-render-box th p,
                .smt-pdf-render-box td p {
                    margin: 0;
                }
            `;

            const allPagesParagraphs = [];

            try {
                for (let i = 0; i < targets.length; i++) {
                    const pageNode = targets[i];
                    const renderBox = document.createElement('div');
                    renderBox.className = 'smt-pdf-render-box';

                    const styleTag = document.createElement('style');
                    styleTag.textContent = embeddedCss;
                    renderBox.appendChild(styleTag);

                    const contentClone = document.createElement('div');
                    contentClone.innerHTML = pageNode.innerHTML;

                    // Extract structured paragraphs for SMT Page (BookIndex) PDF extractor
                    const pageParas = [];
                    Array.from(contentClone.children).forEach(child => {
                        const tag = (child.tagName || '').toUpperCase();
                        if (['H1', 'H2', 'H3', 'P'].includes(tag)) {
                            const txt = (child.textContent || '').replace(/\s+/g, ' ').trim();
                            if (txt) pageParas.push(txt);
                        } else if (tag === 'UL' || tag === 'OL') {
                            Array.from(child.querySelectorAll('li')).forEach((li, idx) => {
                                const txt = (li.textContent || '').replace(/\s+/g, ' ').trim();
                                if (txt) {
                                    pageParas.push(tag === 'OL' ? `${idx + 1}. ${txt}` : `• ${txt}`);
                                }
                            });
                        } else if (tag === 'TABLE') {
                            Array.from(child.querySelectorAll('tr')).forEach(tr => {
                                const rowTxt = Array.from(tr.querySelectorAll('th, td'))
                                    .map(cell => (cell.textContent || '').replace(/\s+/g, ' ').trim())
                                    .filter(Boolean)
                                    .join(' | ');
                                if (rowTxt) pageParas.push(rowTxt);
                            });
                        } else {
                            const txt = (child.textContent || '').replace(/\s+/g, ' ').trim();
                            if (txt) pageParas.push(txt);
                        }
                    });
                    allPagesParagraphs.push(pageParas);

                    // Ensure numbered items and explicit alignments have inline styles for SVG foreignObject rendering
                    Array.from(contentClone.querySelectorAll('p')).forEach(pEl => {
                        const firstChild = pEl.firstElementChild;
                        const isNumbered =
                            pEl.getAttribute('data-numbered') === 'true' ||
                            pEl.classList.contains('smt-numbered-item') ||
                            (firstChild &&
                                firstChild.tagName === 'STRONG' &&
                                /^\d{1,3}\.\s*$/.test(firstChild.textContent || ''));

                        const alignVal = pEl.style.textAlign || bodyAlignment;
                        pEl.style.textAlign = alignVal;

                        if (isNumbered && (alignVal === 'left' || alignVal === 'justify')) {
                            pEl.setAttribute('data-numbered', 'true');
                            pEl.classList.add('smt-numbered-item');
                            pEl.style.paddingLeft = '2.35em';
                            pEl.style.textIndent = '-2.35em';
                            if (firstChild && firstChild.tagName === 'STRONG') {
                                firstChild.style.display = 'inline-block';
                                firstChild.style.minWidth = '2.35em';
                                firstChild.style.textIndent = '0';
                                firstChild.style.textAlign = 'left';
                            }
                        }
                    });

                    renderBox.appendChild(contentClone);
                    exportHost.appendChild(renderBox);

                    const boxHeightPx = Math.max(40, renderBox.scrollHeight);
                    const imgData = await toPng(renderBox, {
                        width: contentWidthPx,
                        height: boxHeightPx,
                        pixelRatio: 2,
                        cacheBust: true,
                        backgroundColor: '#ffffff'
                    });

                    exportHost.removeChild(renderBox);

                    if (i > 0) {
                        pdf.addPage();
                    }

                    // Write native text layer underneath so PyMuPDF / PDF text extractors always find text blocks
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(9.5);
                    pdf.setTextColor(31, 41, 55);
                    let textY = marginYMm + 5;
                    pageParas.forEach(para => {
                        const asciiSafe = para
                            .replace(/[\u2018\u2019]/g, "'")
                            .replace(/[\u201C\u201D]/g, '"')
                            .replace(/[\u2013\u2014]/g, '-');
                        const wrapped = pdf.splitTextToSize(asciiSafe, usableWidthMm);
                        if (textY + wrapped.length * 4 <= pageHeightMm - marginYMm) {
                            pdf.text(wrapped, marginXMm, textY);
                            textY += wrapped.length * 4 + 2;
                        }
                    });

                    // Cover underlying text layer with clean white page background before placing high-DPI rendered image
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, pageWidthMm, pageHeightMm, 'F');

                    const renderedHeightMm = Math.min(
                        usableHeightMm,
                        (boxHeightPx * usableWidthMm) / contentWidthPx
                    );
                    pdf.addImage(imgData, 'PNG', marginXMm, marginYMm, usableWidthMm, renderedHeightMm);
                }

                // Embed lossless UTF-8 structured paragraphs in PDF metadata for extract_pdf.py
                try {
                    const jsonStr = JSON.stringify(allPagesParagraphs);
                    const b64Str = window.btoa(unescape(encodeURIComponent(jsonStr)));
                    pdf.setProperties({
                        title: 'SMT Formatted Document',
                        subject: 'Smart Paste Engine Export',
                        keywords: `SMT_JSON_B64:${b64Str}`
                    });
                } catch (metaErr) {
                    console.warn('Could not attach SMT metadata to PDF:', metaErr);
                }
            } finally {
                if (exportHost.parentNode) {
                    exportHost.parentNode.removeChild(exportHost);
                }
            }

            const filename = getSafeFileName('pdf');
            pdf.save(filename);
            showNotice(`PDF document "${filename}" (${targets.length} ${targets.length === 1 ? 'page' : 'pages'}) downloaded!`);
        } catch (err) {
            console.error('Failed to export PDF:', err);
            showNotice('Failed to generate PDF document. Please try again.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const toggleRule = (key) => {
        setRules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const FEATURE_CONTROLS = [
        { key: 'smartPasteEnabled', label: 'Smart Paste', desc: 'Automatically cleans pasted content' },
        { key: 'autoAlignment', label: 'Auto Alignment', desc: 'Applies document alignment rules' },
        { key: 'fontNormalization', label: 'Font Normalization', desc: 'Converts external fonts to app font' },
        { key: 'headingDetection', label: 'Heading Detection', desc: 'Preserves H1, H2, H3 hierarchy' },
        { key: 'paragraphFormatting', label: 'Paragraph Formatting', desc: 'Applies consistent spacing' },
        { key: 'listNormalization', label: 'List Normalization', desc: 'Fixes bullets, numbering & indent' },
        { key: 'tableFormatting', label: 'Table Formatting', desc: 'Adjusts table width & cell styles' },
        { key: 'removeHiddenStyles', label: 'Remove Hidden Styles', desc: 'Removes unwanted HTML & CSS' },
        { key: 'preserveImportantFormatting', label: 'Preserve Formatting', desc: 'Keeps bold, italic, links & structure' }
    ];

    return (
        <div className="min-h-screen bg-[#f0f4f8] p-4 md:p-6 font-sans text-gray-800">
            <style>{`
                .smt-prosemirror-editor {
                    font-family: ${templateFont};
                    line-height: ${lineSpacing};
                    color: #111827;
                    font-size: 15px;
                }
                .smt-prosemirror-editor h1 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-top: 0.25rem;
                    margin-bottom: 0.75rem;
                    line-height: 1.3;
                    letter-spacing: -0.01em;
                }
                .smt-prosemirror-editor h2 {
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                    line-height: 1.35;
                }
                .smt-prosemirror-editor h3 {
                    font-size: 1.02rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-top: 0.85rem;
                    margin-bottom: 0.4rem;
                    line-height: 1.4;
                }
                .smt-prosemirror-editor p {
                    margin-top: 0;
                    margin-bottom: 0.75rem;
                    color: #1f2937;
                }
                .smt-prosemirror-editor p.smt-numbered-item,
                .smt-prosemirror-editor p[data-numbered="true"] {
                    padding-left: 2.35em;
                    text-indent: -2.35em;
                }
                .smt-prosemirror-editor p.smt-numbered-item > strong:first-child,
                .smt-prosemirror-editor p[data-numbered="true"] > strong:first-child {
                    display: inline-block;
                    min-width: 2.35em;
                    text-indent: 0;
                    text-align: left;
                }
                .smt-prosemirror-editor ul {
                    list-style-type: disc;
                    padding-left: 1.4rem;
                    margin-top: 0.25rem;
                    margin-bottom: 0.85rem;
                }
                .smt-prosemirror-editor ol {
                    list-style-type: decimal;
                    padding-left: 1.4rem;
                    margin-top: 0.25rem;
                    margin-bottom: 0.85rem;
                }
                .smt-prosemirror-editor li {
                    margin-bottom: 0.35rem;
                    padding-left: 0.15rem;
                }
                .smt-prosemirror-editor li p {
                    margin-bottom: 0.2rem;
                }
                .smt-prosemirror-editor a {
                    color: #2563eb;
                    text-decoration: underline;
                    font-weight: 600;
                }
                .smt-prosemirror-editor .smt-table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    margin: 1rem 0;
                }
                .smt-prosemirror-editor table.smt-normalized-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #cbd5e1;
                    font-size: 0.9rem;
                    background: #ffffff;
                }
                .smt-prosemirror-editor table.smt-normalized-table th {
                    background-color: #f1f5f9;
                    color: #0f172a;
                    font-weight: 800;
                    text-align: left;
                    padding: 0.65rem 0.85rem;
                    border: 1px solid #cbd5e1;
                }
                .smt-prosemirror-editor table.smt-normalized-table td {
                    padding: 0.6rem 0.85rem;
                    border: 1px solid #cbd5e1;
                    color: #1e293b;
                    vertical-align: top;
                }
                .smt-prosemirror-editor table.smt-normalized-table th p,
                .smt-prosemirror-editor table.smt-normalized-table td p {
                    margin: 0;
                }
                .smt-a4-page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: 0 auto 32px auto;
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.14), 0 4px 12px -2px rgba(15, 23, 42, 0.08);
                    border-radius: 3px;
                    box-sizing: border-box;
                    position: relative;
                }
                .smt-a4-page:last-child {
                    margin-bottom: 0;
                }
                .smt-a4-page::after {
                    content: "Page " attr(data-page-number) " of " attr(data-total-pages);
                    position: absolute;
                    bottom: 8mm;
                    right: 20mm;
                    font-size: 10px;
                    font-weight: 700;
                    color: #94a3b8;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    pointer-events: none;
                }
            `}</style>

            <div className="max-w-[1480px] mx-auto space-y-5">
                {/* Top Header with Centered Title and Full-Width Formatting Toolbar Below */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center shadow-md shrink-0">
                            <i className="pi pi-sliders-h text-xl"></i>
                        </div>
                        <h1 className="text-lg md:text-xl font-black text-[#1e3a8a] uppercase tracking-wider text-center">
                            SMT Formatter
                        </h1>
                    </div>

                    {/* Formatting Toolbar placed in two clean rows below SMT Formatter */}
                    <div className="w-full border-t border-gray-100 pt-3.5 space-y-3">
                        {/* First Line: H1, H2, H3, P, B, I, U, Bullet List, 1. Numbered List, Align Left, Center, Right, Justify */}
                        <div className="w-full flex flex-wrap items-center justify-center gap-2 pb-3 border-b border-gray-100">
                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold border transition-colors ${
                                    editor?.isActive('heading', { level: 1 })
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Heading 1"
                            >
                                H1
                            </button>
                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold border transition-colors ${
                                    editor?.isActive('heading', { level: 2 })
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Heading 2"
                            >
                                H2
                            </button>
                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold border transition-colors ${
                                    editor?.isActive('heading', { level: 3 })
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Heading 3"
                            >
                                H3
                            </button>
                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().setParagraph().run()}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                    editor?.isActive('paragraph')
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Paragraph"
                            >
                                P
                            </button>

                            <div className="h-5 w-px bg-gray-200 mx-1"></div>

                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                className={`p-1.5 px-3.5 rounded-lg text-xs font-black border transition-colors ${
                                    editor?.isActive('bold')
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Bold"
                            >
                                B
                            </button>
                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleItalic().run()}
                                className={`p-1.5 px-3.5 rounded-lg text-xs italic font-serif font-bold border transition-colors ${
                                    editor?.isActive('italic')
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Italic"
                            >
                                I
                            </button>
                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleSmartUnderline().run()}
                                className={`p-1.5 px-3.5 rounded-lg text-xs underline font-bold border transition-colors ${
                                    editor?.isActive('smartUnderline')
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Underline"
                            >
                                U
                            </button>

                            <div className="h-5 w-px bg-gray-200 mx-1"></div>

                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                className={`p-1.5 px-3.5 rounded-lg text-xs font-bold border transition-colors ${
                                    editor?.isActive('bulletList')
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Bullet List"
                            >
                                <i className="pi pi-list"></i>
                            </button>
                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                className={`p-1.5 px-3.5 rounded-lg text-xs font-bold border transition-colors ${
                                    editor?.isActive('orderedList')
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Numbered List"
                            >
                                1.
                            </button>

                            <div className="h-5 w-px bg-gray-200 mx-1"></div>

                            <button
                                type="button"
                                onClick={() => handleApplyAlignment('left')}
                                className={`p-1.5 px-3 rounded-lg text-xs border transition-colors ${
                                    bodyAlignment === 'left' || editor?.isActive({ textAlign: 'left' })
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Align Left"
                            >
                                <i className="pi pi-align-left"></i>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyAlignment('center')}
                                className={`p-1.5 px-3 rounded-lg text-xs border transition-colors ${
                                    bodyAlignment === 'center' || editor?.isActive({ textAlign: 'center' })
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Align Center"
                            >
                                <i className="pi pi-align-center"></i>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyAlignment('right')}
                                className={`p-1.5 px-3 rounded-lg text-xs border transition-colors ${
                                    bodyAlignment === 'right' || editor?.isActive({ textAlign: 'right' })
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Align Right"
                            >
                                <i className="pi pi-align-right"></i>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyAlignment('justify')}
                                className={`p-1.5 px-3 rounded-lg text-xs border transition-colors ${
                                    bodyAlignment === 'justify' || editor?.isActive({ textAlign: 'justify' })
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                                title="Justify"
                            >
                                <i className="pi pi-align-justify"></i>
                            </button>
                        </div>

                        {/* Second Line: Application Font, Auto Alignment, Paragraph Spacing, Smart Paste Rules, Format Summary */}
                        <div className="w-full flex flex-wrap items-end justify-between gap-3">
                            <div className="flex-1 min-w-[175px]">
                                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                    Application Font
                                </label>
                                <select
                                    value={templateFont}
                                    onChange={(e) => setTemplateFont(e.target.value)}
                                    className="w-full h-[34px] px-2.5 text-xs font-bold border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                                >
                                    <option value="Inter, sans-serif">Inter (Application Default)</option>
                                    <option value="'Segoe UI', Roboto, sans-serif">Segoe UI / Roboto</option>
                                    <option value="Georgia, serif">Georgia (Editorial Serif)</option>
                                    <option value="'Times New Roman', serif">Times New Roman</option>
                                    <option value="Arial, Helvetica, sans-serif">Arial / Helvetica</option>
                                </select>
                            </div>

                            <div className="flex-1 min-w-[130px]">
                                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                    Auto Alignment
                                </label>
                                <select
                                    value={bodyAlignment}
                                    onChange={(e) => handleApplyAlignment(e.target.value)}
                                    className="w-full h-[34px] px-2.5 text-xs font-bold border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                                >
                                    <option value="left">Left Align</option>
                                    <option value="justify">Justified</option>
                                    <option value="center">Centered</option>
                                    <option value="right">Right Align</option>
                                </select>
                            </div>

                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                    Paragraph Spacing
                                </label>
                                <select
                                    value={lineSpacing}
                                    onChange={(e) => setLineSpacing(e.target.value)}
                                    className="w-full h-[34px] px-2.5 text-xs font-bold border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                                >
                                    <option value="1.45">Compact (1.45)</option>
                                    <option value="1.65">Standard (1.65)</option>
                                    <option value="1.85">Relaxed (1.85)</option>
                                </select>
                            </div>

                            {/* Smart Paste Engine Rules Dropdown */}
                            <div className="relative" ref={rulesDropdownRef}>
                                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                    Smart Paste Rule
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setRulesDropdownOpen(prev => !prev)}
                                    className="h-[34px] px-3 rounded-lg text-xs font-extrabold border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] flex items-center gap-2 transition-colors cursor-pointer"
                                    title="Select Smart Paste Engine Rules"
                                >
                                    <i className="pi pi-sliders-h text-xs"></i>
                                    <span>Smart Paste Rules</span>
                                    <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-[#1e3a8a] text-white">
                                        {Object.values(rules).filter(Boolean).length}/{FEATURE_CONTROLS.length}
                                    </span>
                                    <i className={`pi ${rulesDropdownOpen ? 'pi-chevron-up' : 'pi-chevron-down'} text-[10px]`}></i>
                                </button>

                                {rulesDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl p-3.5 z-50 space-y-2">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <span className="text-xs font-black text-[#1e3a8a] uppercase tracking-wider">
                                                Smart Paste Engine Rules
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setRules(DEFAULT_RULES)}
                                                    className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 uppercase"
                                                >
                                                    Select All
                                                </button>
                                                <span className="text-gray-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setRules(
                                                            Object.keys(DEFAULT_RULES).reduce((acc, k) => {
                                                                acc[k] = false;
                                                                return acc;
                                                            }, {})
                                                        )
                                                    }
                                                    className="text-[10px] font-extrabold text-gray-500 hover:text-gray-700 uppercase"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>

                                        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                                            {FEATURE_CONTROLS.map(item => (
                                                <label
                                                    key={item.key}
                                                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={!!rules[item.key]}
                                                        onChange={() => toggleRule(item.key)}
                                                        className="mt-0.5 rounded text-[#1e3a8a] focus:ring-blue-500"
                                                    />
                                                    <div className="leading-tight">
                                                        <div className="text-xs font-extrabold text-gray-800">{item.label}</div>
                                                        <div className="text-[10px] font-medium text-gray-500 mt-0.5">{item.desc}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Format Summary placed directly after Smart Paste Rule */}
                            <div className="shrink-0">
                                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                    Format Summary
                                </label>
                                <div className="h-[34px] flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5">
                                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-gray-700">
                                        Styles: <strong className="font-black text-gray-900">{lastMetrics.stylesRemoved || 0}</strong>
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-gray-700">
                                        Fonts: <strong className="font-black text-blue-700">{lastMetrics.fontsNormalized || 0}</strong>
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-gray-700">
                                        Headings: <strong className="font-black text-purple-700">{lastMetrics.headingsDetected || 0}</strong>
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-gray-700">
                                        Lists &amp; Tables: <strong className="font-black text-emerald-700">{(lastMetrics.listsNormalized || 0) + (lastMetrics.tablesFormatted || 0)}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toast Notice */}
                {statusToast && (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                            <i className="pi pi-check-circle text-emerald-600 text-base"></i>
                            <span>{statusToast}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStatusToast(null)}
                            className="text-emerald-700 hover:text-emerald-900"
                        >
                            <i className="pi pi-times"></i>
                        </button>
                    </div>
                )}

                {/* Sequential View: 1. Before Paste (first) -> 2. After Smart Paste on A4 Sheet(s) */}
                <div className="space-y-4">
                    {/* Part 1: Before Paste (Displayed first on load or when putting new content) */}
                    <div className={viewStep === 'before' ? 'block' : 'hidden'}>
                        <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-sm flex flex-col overflow-hidden max-w-5xl mx-auto">
                            <div className="px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-blue-50/50">
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-clipboard text-blue-700 text-base"></i>
                                    <span className="font-extrabold text-sm text-gray-900">
                                        Before Paste (Paste Copied Content Here)
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleLoadSampleContent}
                                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 uppercase cursor-pointer"
                                    >
                                        Load Sample
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (rawPasteBoxRef.current) {
                                                rawPasteBoxRef.current.innerHTML = '';
                                                setRawInputEmpty(true);
                                                rawPasteBoxRef.current.focus();
                                            }
                                        }}
                                        className="text-[11px] font-bold text-red-600 hover:text-red-800 uppercase cursor-pointer"
                                    >
                                        Clear Input
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between bg-white">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-500">
                                            Copied content (Click inside below &amp; press{' '}
                                            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-bold">
                                                Ctrl+V
                                            </kbd>
                                            )
                                        </span>
                                        {!rawInputEmpty && (
                                            <button
                                                type="button"
                                                onClick={handleRunSmartPasteEngine}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 text-xs uppercase tracking-wider transition-all cursor-pointer"
                                            >
                                                <i className="pi pi-bolt"></i>
                                                <span>Smart Paste Engine →</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative">
                                        {rawInputEmpty && (
                                            <div className="pointer-events-none absolute inset-0 p-4 text-xs text-gray-400 font-medium select-none">
                                                Paste your copied content here from Website, Word, Google Docs, or PDF (Ctrl+V), then click the &ldquo;Smart Paste Engine&rdquo; button below...
                                            </div>
                                        )}
                                        <div
                                            ref={rawPasteBoxRef}
                                            contentEditable
                                            suppressContentEditableWarning
                                            onInput={(e) => {
                                                const txt = (e.currentTarget.textContent || '').trim();
                                                setRawInputEmpty(txt.length === 0);
                                            }}
                                            onPaste={() => {
                                                setTimeout(() => {
                                                    if (rawPasteBoxRef.current) {
                                                        const txt = (rawPasteBoxRef.current.textContent || '').trim();
                                                        setRawInputEmpty(txt.length === 0);
                                                    }
                                                }, 20);
                                            }}
                                            className="border-2 border-dashed border-blue-300 focus:border-blue-600 focus:outline-none rounded-xl p-4 bg-gray-50/40 min-h-[450px] max-h-[650px] overflow-y-auto cursor-text"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-red-500">
                                        {rawInputEmpty ? 'Waiting for pasted content...' : 'Content pasted — click Smart Paste Engine to format onto A4 sheet'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleRunSmartPasteEngine}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-5 rounded-lg shadow-sm flex items-center gap-2 text-xs uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        <i className="pi pi-bolt"></i>
                                        <span>Smart Paste Engine →</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Part 2: After Smart Paste (Displayed after clicking Smart Paste Engine, rendered on A4 Sheet(s)) */}
                    <div className={viewStep === 'after' ? 'block' : 'hidden'}>
                        <div className="bg-white border-2 border-emerald-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-emerald-50/50">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <i className="pi pi-check-circle text-emerald-600 text-base"></i>
                                    <span className="font-extrabold text-sm text-gray-900">
                                        After Smart Paste (Formatted Output)
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-extrabold uppercase tracking-wider">
                                        {pageCount} {pageCount === 1 ? 'Page' : 'Pages'} (A4 Sheet)
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setViewStep('before')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                                        title="Return to Before Paste to edit raw content"
                                    >
                                        <i className="pi pi-arrow-left text-[11px]"></i>
                                        <span>Before Paste</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNewContent}
                                        className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] border border-blue-200 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                                        title="Paste new content from scratch"
                                    >
                                        <i className="pi pi-plus text-[11px]"></i>
                                        <span>New Content</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportPDF}
                                        disabled={isExportingPdf}
                                        className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                                        title="Convert Formatted Content to PDF (.pdf)"
                                    >
                                        <i className={`pi ${isExportingPdf ? 'pi-spin pi-spinner' : 'pi-file-pdf'} text-xs`}></i>
                                        <span>Download PDF</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportWord}
                                        className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-blue-700 text-white hover:bg-blue-800 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                                        title="Convert Formatted Content to Word (.doc)"
                                    >
                                        <i className="pi pi-file-word text-xs"></i>
                                        <span>Download Word</span>
                                    </button>
                                </div>
                            </div>

                            {/* A4 Document Canvas: Renders 1 or multiple A4 sheets (210mm x 297mm) */}
                            <div className="p-4 md:p-8 bg-slate-200/75 overflow-x-auto">
                                <div ref={formattedOutputRef} className="mx-auto">
                                    <EditorContent editor={editor} />
                                </div>
                            </div>

                            <div className="px-5 py-3.5 border-t border-gray-200 bg-white flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-emerald-700">
                                    Formatted on {pageCount} A4 {pageCount === 1 ? 'sheet' : 'sheets'} (210mm × 297mm)
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleExportPDF}
                                        disabled={isExportingPdf}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer"
                                    >
                                        <i className={`pi ${isExportingPdf ? 'pi-spin pi-spinner' : 'pi-file-pdf'}`}></i>
                                        <span>Convert to PDF</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportWord}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-extrabold py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer"
                                    >
                                        <i className="pi pi-file-word"></i>
                                        <span>Convert to Word</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SMTFormatter;
