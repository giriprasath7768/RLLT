import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import pptxgen from "pptxgenjs";
import { jsPDF } from "jspdf";
import { toPng } from 'html-to-image';
import ScriptViewerModal from './ScriptViewerModal';
import DocumentNotesModal from './DocumentNotesModal';
import CChartModal from './CChartModal';
import LionChartModal from './LionChartModal';
import ImageGalleryModal from './ImageGalleryModal';
import ScrollMenuModal from './ScrollMenuModal';
import HebrewCalculatorModal from './HebrewCalculatorModal';
import GreekCalculatorModal from './GreekCalculatorModal';
import { ANTI_GRAVITY_SCRIPTS } from '../../data/antiGravityScripts';

const EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😮‍💨", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🫣", "🤗", "🫡", "🤔", "🫢", "🤭", "🤫", "🤥", "😶", "😶‍🌫️", "😐", "😑", "😬", "🫠", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
    "👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🫀", "🫁", "🧠", "🦷", "🦴", "👀", "👁", "👅", "👄", "💋", "🩸",
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "狼", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷", "🕸", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🦭", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🦬", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🪶", "🐓", "🦃", "🦤", "🦚", "🦜", "🦢", "🦩", "🕊", "🐇", "🦝", "🦨", "🦡", "🦫", "🦦", "🦥", "🐁", "🐀", "🐿", "🦔", "🐾", "🐉", "🐲", "🌵", "🎄", "🌲", "🌳", "🌴", "🪵", "🌱", "🌿", "☘️", "🍀", "🎍", "🪴", "🎋", "🍃", "🍂", "🍁", "🍄", "🐚", "🪨", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌎", "🌍", "🌏", "🪐", "💫", "⭐️", "🌟", "✨", "⚡️", "☄️", "💥", "🔥", "🌪", "🌈", "☀️", "🌤", "⛅️", "🌥", "☁️", "🌦", "🌧", "⛈", "🌩", "🌨", "❄️", "☃️", "⛄️", "🌬", "💨", "💧", "💦", "☔️", "☂️", "🌊", "🌫",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈️", "♉️", "♊️", "♋️", "♌️", "♍️", "♎️", "♏️", "♐️", "♑️", "♒️", "♓️", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚️", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕️", "🛑", "⛔️", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗️", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯️", "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿️", "🅿️", "🛗", "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅"
];

const UN_CODES = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN YE ZM ZW".split(' ');
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const COUNTRIES = UN_CODES.map(code => regionNames.of(code)).sort();

export const SHAPES = {
    "Lines": [
        { name: "Line", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><line x1="10" y1="90" x2="90" y2="10" stroke="currentColor" stroke-width="4"/></svg>` },
        { name: "Arrow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="currentColor"/></marker></defs><line x1="10" y1="90" x2="90" y2="10" stroke="currentColor" stroke-width="4" marker-end="url(#arrowhead)"/></svg>` },
        { name: "Double Arrow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="currentColor"/></marker><marker id="arrowtail2" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto"><polygon points="10 0, 0 3.5, 10 7" fill="currentColor"/></marker></defs><line x1="15" y1="85" x2="85" y2="15" stroke="currentColor" stroke-width="4" marker-end="url(#arrowhead2)" marker-start="url(#arrowtail2)"/></svg>` },
        { name: "Curved Line", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 10 50 Q 50 10 90 50" fill="none" stroke="currentColor" stroke-width="4"/></svg>` },
        { name: "Elbow Connector", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 10 10 L 50 10 L 50 90 L 90 90" fill="none" stroke="currentColor" stroke-width="4"/></svg>` }
    ],
    "Rectangles": [
        { name: "Rectangle", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="20" width="80" height="60" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Rounded Rectangle", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="20" width="80" height="60" rx="15" ry="15" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Snip Single Corner", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,20 70,20 90,40 90,80 10,80" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Cut Rectangle", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="20,20 80,20 90,30 90,70 80,80 20,80 10,70 10,30" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` }
    ],
    "Basic Shapes": [
        { name: "Oval", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="40" ry="30" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Triangle", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Right Triangle", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,10 10,90 90,90" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Parallelogram", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,20 90,20 70,80 10,80" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Trapezoid", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,20 70,20 90,80 10,80" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Diamond", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,10 90,50 50,90 10,50" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Pentagon", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,10 95,45 75,90 25,90 5,45" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Hexagon", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Octagon", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Cross", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="40,10 60,10 60,40 90,40 90,60 60,60 60,90 40,90 40,60 10,60 10,40 40,40" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Cylinder", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 20 25 C 20 15 80 15 80 25 L 80 75 C 80 85 20 85 20 75 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/><ellipse cx="50" cy="25" rx="30" ry="10" fill="none" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Heart", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 50 85 C 50 85 10 55 10 30 C 10 15 25 5 40 15 C 50 25 50 25 50 25 C 50 25 50 25 60 15 C 75 5 90 15 90 30 C 90 55 50 85 50 85 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Lightning", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="60,5 20,55 50,55 40,95 80,45 50,45" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` }
    ],
    "Basic Arrows": [
        { name: "Right Arrow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,35 60,35 60,15 95,50 60,85 60,65 10,65" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Left Arrow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="90,35 40,35 40,15 5,50 40,85 40,65 90,65" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Up Arrow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="35,90 35,40 15,40 50,5 85,40 65,40 65,90" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Down Arrow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="35,10 35,60 15,60 50,95 85,60 65,60 65,10" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Left-Right Arrow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,35 70,35 70,15 95,50 70,85 70,65 30,65 30,85 5,50 30,15" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Up-Down Arrow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="35,30 35,70 15,70 50,95 85,70 65,70 65,30 85,30 50,5 15,30" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Notched Right Arrow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,35 60,35 60,15 95,50 60,85 60,65 10,65 25,50" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` }
    ],
    "Equation Shapes": [
        { name: "Plus", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="35,15 65,15 65,35 85,35 85,65 65,65 65,85 35,85 35,65 15,65 15,35 35,35" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Minus", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="40" width="70" height="20" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Multiply", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 20 20 L 80 80 M 80 20 L 20 80" stroke="currentColor" stroke-width="15" stroke-linecap="square"/></svg>` },
        { name: "Divide", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="20" r="12" fill="currentColor"/><rect x="15" y="42" width="70" height="16" fill="currentColor"/><circle cx="50" cy="80" r="12" fill="currentColor"/></svg>` },
        { name: "Equal", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="25" width="70" height="15" fill="currentColor"/><rect x="15" y="60" width="70" height="15" fill="currentColor"/></svg>` },
        { name: "Not Equal", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="25" width="70" height="15" fill="currentColor"/><rect x="15" y="60" width="70" height="15" fill="currentColor"/><line x1="25" y1="90" x2="75" y2="10" stroke="currentColor" stroke-width="10"/></svg>` }
    ],
    "Flowchart Shapes": [
        { name: "Process", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="30" width="80" height="40" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Alternate Process", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="30" width="80" height="40" rx="10" ry="10" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Decision", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,20 90,50 50,80 10,50" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Data", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="25,20 95,20 75,80 5,80" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Document", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 15 15 L 85 15 L 85 70 C 85 70 70 85 50 75 C 30 65 15 85 15 85 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Terminator", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="25" width="80" height="50" rx="25" ry="25" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Preparation", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,25 70,25 90,50 70,75 30,75 10,50" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` }
    ],
    "Stars and Banners": [
        { name: "4-Point Star", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 60,40 95,50 60,60 50,95 40,60 5,50 40,40" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "5-Point Star", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "6-Point Star", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 65,30 95,30 75,50 95,70 65,70 50,95 35,70 5,70 25,50 5,30 35,30" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "8-Point Star", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 60,30 85,15 70,40 95,50 70,60 85,85 60,70 50,95 40,70 15,85 30,60 5,50 30,40 15,15 40,30" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Up Ribbon", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 10 80 L 10 30 L 50 10 L 90 30 L 90 80 L 50 60 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Down Ribbon", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 10 20 L 10 70 L 50 90 L 90 70 L 90 20 L 50 40 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` }
    ],
    "Callouts": [
        { name: "Rectangular Callout", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,10 90,10 90,60 60,60 30,90 40,60 10,60" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Rounded Callout", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 20 10 C 10 10 10 20 10 20 L 10 50 C 10 60 20 60 20 60 L 40 60 L 30 90 L 60 60 L 80 60 C 90 60 90 50 90 50 L 90 20 C 90 10 80 10 80 10 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Oval Callout", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 50 10 C 10 10 10 40 10 40 C 10 60 30 70 30 70 L 20 90 L 50 70 C 90 70 90 40 90 40 C 90 10 50 10 50 10 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` },
        { name: "Cloud Callout", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 30 40 C 30 20 60 20 60 35 C 80 30 90 50 80 65 C 90 80 60 90 55 75 C 50 90 20 80 30 65 C 10 65 10 45 30 40 Z M 35 75 L 20 95 L 30 85 M 20 95 L 15 85 L 25 75" fill="none" stroke="currentColor" stroke-width="2"/><path d="M 30 40 C 30 20 60 20 60 35 C 80 30 90 50 80 65 C 90 80 60 90 55 75 C 50 90 20 80 30 65 C 10 65 10 45 30 40 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/></svg>` }
    ]
};

const DropdownPortal = ({ isOpen, anchorRef, children }) => {
    if (!isOpen || !anchorRef.current) return null;
    const rect = anchorRef.current.getBoundingClientRect();
    // Use wider offset for right bound menus so e.g. Emoji grid doesn't squash or clip
    return createPortal(
        <div
            className="fixed z-[99999] pointer-events-auto"
            style={{
                top: rect.bottom + 5,
                left: Math.min(rect.left, window.innerWidth - 300)
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
};

const WordToolbar = ({ toolbarId, quillRef, tiptapEditor, content, title, watermark, setWatermark, language, setLanguage, notes, setNotes, PAGE_SIZES, pageSize, setPageSize, setIsSidebarOpen, handleOpenMap, UN_COUNTRIES, regionNames, zoomLevel, setZoomLevel, isSaving, fetchSavedDocuments, spellCheckEnabled, setSpellCheckEnabled, setIsChartEditing, setChartProxy, setRlltToolbarOpen, setScrollMenuOpen, setDailyISIOpen }) => {
    const fileInputRef = useRef(null);
    const puzzleInputRef = useRef(null);
    const watermarkInputRef = useRef(null);
    const customSizeRangeRef = useRef(null);
    const fontSizeDropdownRef = useRef(null);
    const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
    const [currentSize, setCurrentSize] = useState('16');

    useEffect(() => {
        if (!tiptapEditor) return;
        const handleSelectionChange = () => {
            const attrs = tiptapEditor.getAttributes('textStyle');
            if (attrs && attrs.fontSize) {
                // Parse "16px" into "16"
                const sizeMatch = attrs.fontSize.match(/\d+/);
                if (sizeMatch) {
                    setCurrentSize(sizeMatch[0]);
                }
            }
        };
        tiptapEditor.on('selectionUpdate', handleSelectionChange);
        tiptapEditor.on('update', handleSelectionChange);
        return () => {
            tiptapEditor.off('selectionUpdate', handleSelectionChange);
            tiptapEditor.off('update', handleSelectionChange);
        };
    }, [tiptapEditor]);

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const interimRangeRef = useRef(null);

    const emojiDropdownRef = useRef(null);
    const [emojiDropdownOpen, setEmojiDropdownOpen] = useState(false);

    const chartsDropdownRef = useRef(null);
    const [chartsDropdownOpen, setChartsDropdownOpen] = useState(false);

    const graphsDropdownRef = useRef(null);
    const [graphsDropdownOpen, setGraphsDropdownOpen] = useState(false);

    const shapesDropdownRef = useRef(null);
    const [shapesDropdownOpen, setShapesDropdownOpen] = useState(false);

    const countryDropdownRef = useRef(null);
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');

    const imageDropdownRef = useRef(null);
    const [imageDropdownOpen, setImageDropdownOpen] = useState(false);

    const agScriptDropdownRef = useRef(null);
    const [agScriptDropdownOpen, setAgScriptDropdownOpen] = useState(false);
    const [viewerScript, setViewerScript] = useState(null);

    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [cChartModalOpen, setCChartModalOpen] = useState(false);
    const [lionChartModalOpen, setLionChartModalOpen] = useState(false);
    const [hebrewCalculatorOpen, setHebrewCalculatorOpen] = useState(false);
    const [greekCalculatorOpen, setGreekCalculatorOpen] = useState(false);
    
    // Keep track of modal states globally to prevent ReactQuill focus stealing
    useEffect(() => {
        const isEditing = cChartModalOpen || lionChartModalOpen;
        window.isChartEditing = isEditing;
        if (setIsChartEditing) setIsChartEditing(isEditing);
        
        if (!isEditing) {
            if (tiptapEditor) {
                if (window.forceWordEditorSync) {
                    window.forceWordEditorSync(tiptapEditor.getHTML());
                }
            }
        }
    }, [cChartModalOpen, lionChartModalOpen, tiptapEditor, setIsChartEditing]);

    const cChartCursorRef = useRef(null);

    const [galleryModalOpen, setGalleryModalOpen] = useState(false);

    const safeInsert = (callback) => {
        if (!tiptapEditor) return;
        const { selection } = tiptapEditor.state;
        if (
            tiptapEditor.isActive('resizableImage') || 
            tiptapEditor.isActive('shape') || 
            tiptapEditor.isActive('textbox') ||
            (selection && selection.node)
        ) {
            tiptapEditor.commands.setTextSelection(selection.to);
        }
        callback();
    };

    const insertGalleryImage = (url) => {
        safeInsert(() => {
            tiptapEditor.chain().focus().setImage({ src: url }).run();
            setGalleryModalOpen(false);
        });
    };

    const insertTextBox = () => {
        safeInsert(() => {
            tiptapEditor.chain().focus().insertContent({ type: 'textbox', attrs: { text: '' } }).run();
            setImageDropdownOpen(false);
        });
    };

    const insertShape = (svg) => {
        safeInsert(() => {
            tiptapEditor.chain().focus().insertContent({ type: 'shape', attrs: { svg: svg } }).run();
            setShapesDropdownOpen(false);
        });
    };

    const handleCChartInsert = (selectedText) => {
        safeInsert(() => {
            tiptapEditor.chain().focus().insertContent(selectedText + "<br>").run();
        });
    };

    const handleLionChartInsert = (base64Img) => {
        safeInsert(() => {
            tiptapEditor.chain().focus().setImage({ src: base64Img }).run();
            setLionChartModalOpen(false);
        });
    };

    const wisdomDropdownRef = useRef(null);
    const [wisdomOpen, setWisdomOpen] = useState(false);
    const [wisdomMode, setWisdomMode] = useState('highlight');

    const WISDOM_COLORS = ['#00C0FF', '#00A638', '#3340CD', '#FAFA33', '#BB43B1', '#FE6D01', '#FE0005'];
    const WISDOM_MODES = [
        { id: 'square', icon: 'pi pi-stop', label: 'Square' },
        { id: 'round', icon: 'pi pi-check-circle', label: 'Round' },
        { id: 'underline', icon: 'pi pi-minus', label: 'Underline' },
        { id: 'highlight', icon: 'pi pi-pencil', label: 'Highlight' }
    ];

    const textEffectDropdownRef = useRef(null);
    const [textEffectOpen, setTextEffectOpen] = useState(false);
    const [textEffectMode, setTextEffectMode] = useState('3d');

    const TEXT_EFFECT_MODES = [
        { id: '3d', icon: 'pi pi-box', label: '3D Text' },
        { id: '4d', icon: 'pi pi-clone', label: '4D Text' },
        { id: '5d', icon: 'pi pi-globe', label: '5D Text' },
        { id: '6d', icon: 'pi pi-star', label: '6D Text' },
        { id: '7d', icon: 'pi pi-star-fill', label: '7D Text' },
        { id: '8d', icon: 'pi pi-compass', label: '8D Text' },
        { id: '9d', icon: 'pi pi-bolt', label: '9D Text' },
        { id: '10d', icon: 'pi pi-sun', label: '10D Text' }
    ];

    const applyTextEffect = (color) => {
        if (!tiptapEditor) return;
        tiptapEditor.chain().focus().setTextEffect({ color, mode: textEffectMode }).run();
    };

    const clearTextEffect = () => {
        if (!tiptapEditor) return;
        tiptapEditor.chain().focus().unsetTextEffect().run();
        setTextEffectOpen(false);
    };

    const applyWisdom = (color) => {
        if (!tiptapEditor) return;
        tiptapEditor.chain().focus().setWisdom({ color, mode: wisdomMode }).run();
    };

    const clearWisdom = () => {
        if (!tiptapEditor) return;
        tiptapEditor.chain().focus().unsetWisdom().run();
        setWisdomOpen(false);
    };

    const [graphModal, setGraphModal] = useState({ isOpen: false, type: null });
    const [xData, setXData] = useState("");
    const [yData, setYData] = useState("");

    const [puzzleModalOpen, setPuzzleModalOpen] = useState(false);
    const [pendingPuzzleFile, setPendingPuzzleFile] = useState(null);
    const [puzzlePieces, setPuzzlePieces] = useState(10);
    const [lionChartSelectedText, setLionChartSelectedText] = useState("");

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        // The API uses BCP-47 language tags
        recognition.lang = language === 'zh' ? 'zh-CN' : (language === 'ar' ? 'ar-SA' : language);

        recognition.onstart = () => {
            setIsListening(true);
            interimRangeRef.current = null;
        };

        recognition.onresult = (event) => {
            if (!tiptapEditor) return;

            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript !== '') {
                const textToInsert = finalTranscript.trim() + ' ';
                tiptapEditor.chain().focus().insertContent(textToInsert).run();
            }

            // Simplified interim transcript for Phase 2 since cursor positions differ in Tiptap
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            interimRangeRef.current = null;
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [language, tiptapEditor]);

    const wordCount = React.useMemo(() => {
        if (!content) return 0;
        // Strip HTML tags and normalize whitespace to count words accurately
        const text = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
        return text.length > 0 ? text.split(/\s+/).length : 0;
    }, [content]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiDropdownRef.current && !emojiDropdownRef.current.contains(event.target)) {
                setEmojiDropdownOpen(false);
            }
            if (chartsDropdownRef.current && !chartsDropdownRef.current.contains(event.target)) {
                setChartsDropdownOpen(false);
            }
            if (graphsDropdownRef.current && !graphsDropdownRef.current.contains(event.target)) {
                setGraphsDropdownOpen(false);
            }
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setCountryDropdownOpen(false);
            }
            if (shapesDropdownRef.current && !shapesDropdownRef.current.contains(event.target)) {
                setShapesDropdownOpen(false);
            }
            if (imageDropdownRef.current && !imageDropdownRef.current.contains(event.target)) {
                setImageDropdownOpen(false);
            }
            if (agScriptDropdownRef.current && !agScriptDropdownRef.current.contains(event.target)) {
                setAgScriptDropdownOpen(false);
            }
            if (wisdomDropdownRef.current && !wisdomDropdownRef.current.contains(event.target)) {
                setWisdomOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const insertEmoji = (emoji) => {
        if (!tiptapEditor) return;
        tiptapEditor.chain().focus().insertContent(emoji).run();
        setEmojiDropdownOpen(false);
    };

    const handleWatermarkUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (setWatermark) setWatermark(reader.result);
        };
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const insertCountry = (countryName) => {
        if (!tiptapEditor) return;
        tiptapEditor.chain().focus().insertContent(countryName).run();
        setCountryDropdownOpen(false);
    };

    const toggleDictation = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                if (tiptapEditor) {
                    tiptapEditor.commands.focus();
                }
                recognitionRef.current.start();
            } catch (e) {
                console.error("Microphone start error:", e);
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleOutlineColor = (e) => {
        // Disabled in Phase 2
    };

    const handleShadowColor = (e) => {
        // Disabled in Phase 2
    };

    const handleExportPPT = async () => {
        let pptx = new pptxgen();

        // 1. Convert all images to Base64 first to avoid PPTXGenJS CORS cache errors
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;

        const images = Array.from(tempDiv.querySelectorAll('img'));
        await Promise.all(images.map((img) => {
            return new Promise(async (resolve) => {
                if (img.src.startsWith('data:')) {
                    return resolve();
                }
                const origSrc = img.src;
                try {
                    const fetchUrl = origSrc + (origSrc.includes('?') ? '&' : '?') + 'cacheBust=' + Date.now();
                    const response = await fetch(fetchUrl, { mode: 'cors' });
                    if (!response.ok) throw new Error('Network response was not ok');
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        img.src = reader.result;
                        resolve();
                    };
                    reader.onerror = () => resolve();
                    reader.readAsDataURL(blob);
                } catch (err) {
                    console.warn("Failed to convert image to base64 for PPT export:", origSrc, err);
                    resolve();
                }
            });
        }));

        let watermarkBase64 = watermark;
        if (watermark && !watermark.startsWith('data:')) {
            try {
                const fetchUrl = watermark + (watermark.includes('?') ? '&' : '?') + 'cacheBust=' + Date.now();
                const response = await fetch(fetchUrl, { mode: 'cors' });
                if (response.ok) {
                    const blob = await response.blob();
                    watermarkBase64 = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (err) {
                console.warn("Failed to convert watermark to base64", err);
            }
        }

        if (watermarkBase64) {
            const wmProps = watermarkBase64.startsWith('data:') ? { data: watermarkBase64 } : { path: watermarkBase64 };
            pptx.defineSlideMaster({
                title: "MASTER_SLIDE",
                background: { color: "FFFFFF" },
                objects: [
                    { image: { ...wmProps, x: 0, y: 0, w: "100%", h: "100%", sizing: { type: "contain" }, transparency: 50 } }
                ]
            });
        }

        const createSlide = () => {
            return watermarkBase64 ? pptx.addSlide({ masterName: "MASTER_SLIDE" }) : pptx.addSlide();
        };

        let slide = createSlide();

        // 2. Add Header Title
        slide.addText(title || "Document", { x: 0.5, y: 0.5, w: "90%", h: 0.5, fontSize: 24, bold: true, color: "051220", align: 'center' });

        let currentY = 1.2; // Start rendering content right below the title

        const checkNewSlide = (neededSpace) => {
            if (currentY + neededSpace > 5.2) {
                slide = createSlide();
                currentY = 0.5;
            }
        };

        const addImageToSlide = (imgSrc) => {
            checkNewSlide(4.5);
            const imageProps = imgSrc.startsWith('data:') ? { data: imgSrc } : { path: imgSrc };
            slide.addImage({ ...imageProps, x: 1.0, y: currentY, w: 8.0, h: 4.5, sizing: { type: 'contain', w: 8.0, h: 4.5 } });
            currentY += 4.8;
        };

        const addTextToSlide = (text, isHeader, customFormat = null) => {
            const h = isHeader ? 0.6 : 0.4;
            checkNewSlide(h);
            const format = customFormat || { fontSize: isHeader ? 20 : 16, color: "363636", bold: isHeader };
            slide.addText(text, { x: 0.5, y: currentY, w: "90%", ...format });
            currentY += h;
        };

        const processNode = (node) => {
            if (node.nodeName === 'IMG') {
                addImageToSlide(node.src);
                return;
            }

            if (node.getAttribute && node.getAttribute('data-type') === 'textbox') {
                const text = node.getAttribute('text');
                if (text) {
                    const configStr = node.getAttribute('data-text-config');
                    let formatting = { fontSize: 16, color: "363636" };
                    if (configStr) {
                        try {
                            const config = JSON.parse(configStr);
                            formatting.fontSize = config.fontSize || 16;
                            if (config.color) formatting.color = config.color.replace('#', '');
                            if (config.fontWeight === 'bold') formatting.bold = true;
                            if (config.fontStyle === 'italic') formatting.italic = true;
                            if (config.textAlign) formatting.align = config.textAlign;
                        } catch (e) {}
                    }
                    addTextToSlide(text, false, formatting);
                }
                return;
            }

            const hasImg = node.querySelectorAll && node.querySelectorAll('img').length > 0;
            const hasTextBox = node.querySelectorAll && node.querySelectorAll('[data-type="textbox"]').length > 0;
            
            if (hasImg || hasTextBox) {
                Array.from(node.childNodes).forEach(child => {
                    processNode(child);
                });
            } else {
                const text = node.textContent?.trim();
                if (text) {
                    const isHeader = /^H[1-6]$/.test(node.nodeName);
                    addTextToSlide(text, isHeader);
                }
            }
        };

        Array.from(tempDiv.childNodes).forEach(node => {
            processNode(node);
        });

        pptx.writeFile({ fileName: `${title ? title.trim() : 'Document'}.pptx` });
    };

    const handleShare = async () => {
        // MS Word HTML-to-RTF parser crashes heavily on "data:image/svg+xml" strings, leading to completely blank documents.
        // We must selectively intercept any SVG base64 nodes from Quill and asynchronously rasterize them to PNGs before compiling.
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;

        const images = Array.from(tempDiv.querySelectorAll('img[src^="data:image/svg+xml"]'));

        await Promise.all(images.map((img) => {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const svgImage = new Image();

                svgImage.onload = () => {
                    // Extract native width/height or default to safe boundaries
                    canvas.width = svgImage.width || 800;
                    canvas.height = svgImage.height || 500;

                    // Draw white background (SVGs are transparent, Word prefers solid backgrounds)
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw the SVG over it
                    ctx.drawImage(svgImage, 0, 0);

                    // Mutate the DOM node's src directly to the safe PNG format
                    img.src = canvas.toDataURL("image/png");
                    resolve();
                };

                svgImage.onerror = () => {
                    // If parsing fails simply strip the offending image to save the rest of the text document
                    img.remove();
                    resolve();
                };

                svgImage.src = img.src;
            });
        }));

        const safeContent = tempDiv.innerHTML;

        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            "<head><meta charset='utf-8'><title>Export HTML to Word Document Document</title></head><body style=\"font-family: Arial, sans-serif;\">";
        const footer = "</body></html>";
        const sourceHTML = header + safeContent + footer;

        const blob = new Blob(['\ufeff', sourceHTML], {
            type: 'application/msword'
        });

        const filename = `${title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'document'}.doc`;
        const docFile = new File([blob], filename, { type: 'application/msword' });

        if (navigator.canShare && navigator.canShare({ files: [docFile] })) {
            try {
                await navigator.share({
                    title: title || 'Document',
                    files: [docFile]
                });
            } catch (err) {
                console.error("Share failed", err);
                triggerDownload(blob, filename);
            }
        } else {
            triggerDownload(blob, filename);
        }
    };

    const handleExportPDF = async () => {
        if (!tiptapEditor) return;
        
        try {
            const editorEl = document.getElementById('pdf-export-container');
            if (!editorEl) return;
            
            const originalBg = editorEl.style.backgroundColor;
            const originalShadow = editorEl.style.boxShadow;
            const originalBorder = editorEl.style.border;
            const originalTransform = editorEl.style.transform;
            const originalMargin = editorEl.style.margin;
            
            editorEl.style.backgroundColor = '#ffffff';
            editorEl.style.boxShadow = 'none';
            editorEl.style.border = 'none';
            editorEl.style.transform = 'none'; // Ensure 1:1 scale for capture
            editorEl.style.margin = '0'; // Fix html-to-image alignment issue with mx-auto
            
            // Wait for document fonts to load
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            // Convert all images to Base64 using fetch -> blob -> FileReader
            const images = Array.from(editorEl.querySelectorAll('img'));
            const originalSrcs = new Map();
            const originalLoadings = new Map();
            const originalCrossOrigins = new Map();

            await Promise.all(images.map((img) => {
                return new Promise(async (resolve) => {
                    // Disable lazy loading during export
                    originalLoadings.set(img, img.getAttribute('loading'));
                    originalCrossOrigins.set(img, img.getAttribute('crossOrigin'));
                    img.setAttribute('loading', 'eager');
                    
                    if (img.src.startsWith('data:')) {
                        return resolve();
                    }
                    
                    const origSrc = img.src;
                    
                    try {
                        const fetchUrl = origSrc + (origSrc.includes('?') ? '&' : '?') + 'cacheBust=' + Date.now();
                        const response = await fetch(fetchUrl, { mode: 'cors' });
                        if (!response.ok) throw new Error('Network response was not ok');
                        const blob = await response.blob();
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            originalSrcs.set(img, origSrc);
                            img.src = reader.result;
                            img.crossOrigin = 'anonymous';
                            resolve();
                        };
                        reader.onerror = () => resolve();
                        reader.readAsDataURL(blob);
                    } catch (err) {
                        console.warn("Failed to convert image to base64 via fetch:", origSrc, err);
                        resolve(); // Continue even if one image fails
                    }
                });
            }));
            
            const pageNodes = Array.from(editorEl.querySelectorAll('.pdf-page-container'));
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            if (pageNodes.length > 0) {
                // Multi-page export
                for (let i = 0; i < pageNodes.length; i++) {
                    const node = pageNodes[i];
                    const imgData = await toPng(node, { pixelRatio: 2, cacheBust: true, useCORS: true });
                    if (!imgData || imgData === 'data:,') {
                        console.error('Generated empty image data for node', node);
                        continue;
                    }
                    const nodeHeightMm = (node.offsetHeight * pdfWidth) / node.offsetWidth;
                    
                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, nodeHeightMm);
                    
                    // If a single page node exceeds A4, still add pages to prevent clipping
                    let heightLeft = nodeHeightMm - pageHeight;
                    let position = -pageHeight;
                    while (heightLeft >= 0) {
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, nodeHeightMm);
                        heightLeft -= pageHeight;
                        position -= pageHeight;
                    }
                }
            } else {
                // Legacy Single-page export
                const imgData = await toPng(editorEl, { 
                    pixelRatio: 2, 
                    cacheBust: true,
                    useCORS: true
                });
                
                if (!imgData || imgData === 'data:,') throw new Error("Generated empty image data for legacy document");

                const pdfHeight = (editorEl.offsetHeight * pdfWidth) / editorEl.offsetWidth;
                let heightLeft = pdfHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                    position -= pageHeight; // Update: ensure position tracks correctly like original: position = heightLeft - pdfHeight
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;
                }
            }

            // Restore images and editor state
            originalSrcs.forEach((src, img) => {
                img.src = src;
            });
            originalLoadings.forEach((loading, img) => {
                if (loading === null) img.removeAttribute('loading');
                else img.setAttribute('loading', loading);
            });
            originalCrossOrigins.forEach((co, img) => {
                if (co === null) img.removeAttribute('crossOrigin');
                else img.setAttribute('crossOrigin', co);
            });
            editorEl.style.backgroundColor = originalBg;
            editorEl.style.boxShadow = originalShadow;
            editorEl.style.border = originalBorder;
            editorEl.style.transform = originalTransform;
            editorEl.style.margin = originalMargin;
            
            pdf.save(`${title || 'Document'}.pdf`);
            
        } catch (error) {
            console.error("Failed to generate PDF", error);
        }
    };

    // Helper for downloading
    const triggerDownload = (blob, filename) => {
        const downloadLink = document.createElement("a");
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    };

    const handlePuzzleUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !quillRef.current) return;

        setPendingPuzzleFile(file);
        setPuzzlePieces(10); // default
        setPuzzleModalOpen(true);
        e.target.value = null; // reset file input
    };

    const processPuzzleImage = () => {
        if (!pendingPuzzleFile || !quillRef.current) return;

        const pieces = parseInt(puzzlePieces, 10) || 10;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const imgRatio = img.width / img.height;
                let rows = Math.max(1, Math.round(Math.sqrt(pieces / imgRatio)));
                let cols = Math.max(1, Math.round(pieces / rows));

                // Calculate precise usable document area to mirror "covering the page"
                const widthStr = PAGE_SIZES[pageSize].width;
                let widthPx = 800;
                if (widthStr.endsWith('mm')) widthPx = parseFloat(widthStr) / 25.4 * 96;
                else if (widthStr.endsWith('in')) widthPx = parseFloat(widthStr) * 96;

                const padStr = PAGE_SIZES[pageSize].padding;
                let padPx = 0;
                if (padStr.endsWith('mm')) padPx = parseFloat(padStr) / 25.4 * 96;
                else if (padStr.endsWith('in')) padPx = parseFloat(padStr) * 96;

                canvas.width = Math.round(widthPx - 2 * padPx);
                canvas.height = Math.round(PAGE_SIZES[pageSize].linePx - 2 * padPx);

                // Draw original image with object-fit: cover matching the aspect ratio
                const pageRatio = canvas.width / canvas.height;
                let sWidth = img.width;
                let sHeight = img.height;
                let sx = 0;
                let sy = 0;

                if (imgRatio > pageRatio) {
                    sWidth = img.height * pageRatio;
                    sx = (img.width - sWidth) / 2;
                } else {
                    sHeight = img.width / pageRatio;
                    sy = (img.height - sHeight) / 2;
                }
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

                // Draw Puzzle Overlay
                const tileW = canvas.width / cols;
                const tileH = canvas.height / rows;

                ctx.lineWidth = Math.max(3, canvas.width * 0.003);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                ctx.shadowColor = "rgba(0,0,0,0.6)";
                ctx.shadowBlur = Math.max(4, canvas.width * 0.01);
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                const drawHorizontalEdge = (x, y, w, dir) => {
                    const tabSize = w * 0.2;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(w * 0.35, 0);
                    ctx.bezierCurveTo(w * 0.35, dir * tabSize * 1.5, w * 0.65, dir * tabSize * 1.5, w * 0.65, 0);
                    ctx.lineTo(w, 0);
                    ctx.stroke();
                    ctx.restore();
                };

                const drawVerticalEdge = (x, y, h, dir) => {
                    const tabSize = h * 0.2;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, h * 0.35);
                    ctx.bezierCurveTo(dir * tabSize * 1.5, h * 0.35, dir * tabSize * 1.5, h * 0.65, 0, h * 0.65);
                    ctx.lineTo(0, h);
                    ctx.stroke();
                    ctx.restore();
                };

                for (let r = 1; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const dir = (r + c) % 2 === 0 ? 1 : -1;
                        drawHorizontalEdge(c * tileW, r * tileH, tileW, dir);
                    }
                }

                for (let c = 1; c < cols; c++) {
                    for (let r = 0; r < rows; r++) {
                        const dir = (r + c) % 2 === 0 ? 1 : -1;
                        drawVerticalEdge(c * tileW, r * tileH, tileH, dir);
                    }
                }

                // Insert into Tiptap
                if (tiptapEditor) {
                    const base64Data = canvas.toDataURL('image/png');
                    safeInsert(() => {
                        tiptapEditor.chain().focus().setImage({ src: base64Data, isPuzzleImage: true, originalSrc: event.target.result, puzzlePieces: pieces }).run();
                    });
                }

                setPuzzleModalOpen(false);
                setPendingPuzzleFile(null);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(pendingPuzzleFile);
    };

    const handleLionChartLiveUpdate = (base64Img) => {
        setLastLionChartData(base64Img);
        // PHANTOM PROXY PATH: Only update decoupled preview layer in WordToolbar
        if (activeLionChartNodeRef.current && quillRef.current) {
            const editor = quillRef.current.getEditor();
            if (editor.root.contains(activeLionChartNodeRef.current)) {
                // Ensure placeholder has a reasonable size
                activeLionChartNodeRef.current.style.width = '100%';
                activeLionChartNodeRef.current.style.height = 'auto';
                activeLionChartNodeRef.current.style.minHeight = '300px';
                const rect = activeLionChartNodeRef.current.getBoundingClientRect();
                setLocalChartProxy({ src: base64Img, rect });
            }
        }
    };

    const handleGraphInsert = (type) => {
        setGraphModal({ isOpen: true, type });
        setGraphsDropdownOpen(false);
    };

    const submitGraph = () => {
        if (!graphModal.type || !quillRef.current) return;

        let svgContent = '';
        const xArr = xData.split(',').map(s => s.trim()).filter(s => s !== "");
        const yArr = yData.split(',').map(Number).filter(n => !isNaN(n));

        const len = Math.max(xArr.length, yArr.length) || 1;
        const labels = Array.from({ length: len }, (_, i) => xArr[i] || `X${i + 1}`);
        const values = Array.from({ length: len }, (_, i) => isNaN(yArr[i]) || yArr[i] === undefined ? 0 : yArr[i]);

        const width = 500;
        const height = 300;
        const padX = 50;
        const padY = 50;
        const chartW = width - padX * 2;
        const chartH = height - padY * 2;

        const maxValRaw = Math.max(...values, 1);

        const tickSpacingFunc = (range) => {
            let exponent = Math.floor(Math.log10(range));
            let fraction = range / Math.pow(10, exponent);
            let niceFraction;
            if (fraction < 1.5) niceFraction = 1;
            else if (fraction < 3) niceFraction = 2;
            else if (fraction < 7) niceFraction = 5;
            else niceFraction = 10;
            return niceFraction * Math.pow(10, exponent);
        };
        const tickSpacing = tickSpacingFunc(maxValRaw / 4) || 1;
        const maxVal = Math.ceil(maxValRaw / tickSpacing) * tickSpacing;

        const scaleY = chartH / maxVal;
        const stepX = chartW / (len > 1 ? len - 1 : 1);
        const colW = Math.min(40, chartW / len * 0.8);

        let grid = `<rect width="${width}" height="${height}" fill="#ffffff"/>`;
        grid += `<line x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" stroke="#333" stroke-width="2"/>`;
        grid += `<line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#333" stroke-width="2"/>`;

        let ticksCount = maxVal / tickSpacing;
        for (let i = 0; i <= ticksCount; i++) {
            let tickVal = i * tickSpacing;
            let y = height - padY - (tickVal * scaleY);
            grid += `<line x1="${padX - 5}" y1="${y}" x2="${padX}" y2="${y}" stroke="#333" stroke-width="1"/>`;
            if (i > 0) grid += `<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
            grid += `<text x="${padX - 10}" y="${y + 4}" font-family="sans-serif" font-size="12" text-anchor="end" fill="#666">${tickVal}</text>`;
        }

        switch (graphModal.type) {
            case 'bar':
                let bars = '';
                values.forEach((v, i) => {
                    let h = Math.max(v * scaleY, 0);
                    let x = padX + (chartW / len) * i + (chartW / len - colW) / 2;
                    let y = height - padY - h;
                    let barColor = i % 2 === 0 ? '#3b82f6' : '#10b981';
                    bars += `<rect x="${x}" y="${y}" width="${colW}" height="${h}" fill="${barColor}"><title>${labels[i]}: ${v}</title></rect>`;
                    bars += `<text x="${x + colW / 2}" y="${height - padY + 20}" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#666">${labels[i]}</text>`;
                });
                svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${grid}${bars}</svg>`;
                break;

            case 'line':
            case 'area':
                let points = values.map((v, i) => {
                    let x = padX + stepX * i;
                    let y = height - padY - Math.max(v * scaleY, 0);
                    return { x, y };
                });

                let ptsStr = points.map(p => `${p.x},${p.y}`).join(' ');
                let poly = `<polyline points="${ptsStr}" fill="none" stroke="#6366f1" stroke-width="4"/>`;
                let circles = points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#6366f1"><title>${labels[i]}: ${values[i]}</title></circle><text x="${p.x}" y="${height - padY + 20}" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#666">${labels[i]}</text>`).join('');

                if (graphModal.type === 'area') {
                    let areaPts = `${points[0].x},${height - padY} ${ptsStr} ${points[points.length - 1].x},${height - padY}`;
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${grid}<polygon points="${areaPts}" fill="#a78bfa" opacity="0.6"/><polyline points="${ptsStr}" fill="none" stroke="#8b5cf6" stroke-width="3"/>${circles}</svg>`;
                } else {
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${grid}${poly}${circles}</svg>`;
                }
                break;

            case 'pie':
                let total = values.reduce((a, b) => a + b, 0) || 1;
                let cx = width / 2;
                let cy = height / 2;
                let r = Math.min(chartW, chartH) / 2;

                let piePaths = '';
                let legend = '';
                let startAngle = 0;
                let colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

                values.forEach((v, i) => {
                    let sliceAngle = (v / total) * 360;
                    if (sliceAngle === 360) sliceAngle = 359.9;
                    let endAngle = startAngle + sliceAngle;

                    let x1 = cx + r * Math.cos(Math.PI * startAngle / 180);
                    let y1 = cy + r * Math.sin(Math.PI * startAngle / 180);
                    let x2 = cx + r * Math.cos(Math.PI * endAngle / 180);
                    let y2 = cy + r * Math.sin(Math.PI * endAngle / 180);
                    let largeArc = sliceAngle > 180 ? 1 : 0;

                    piePaths += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}"><title>${labels[i]}: ${v}</title></path>`;
                    legend += `<circle cx="${padX}" cy="${padY + i * 20}" r="5" fill="${colors[i % colors.length]}"/><text x="${padX + 15}" y="${padY + i * 20 + 5}" font-family="sans-serif" font-size="12" fill="#666">${labels[i]} (${v})</text>`;
                    startAngle = endAngle;
                });
                svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#ffffff"/>${piePaths}${legend}</svg>`;
                break;
        }

        const safeSvg = encodeURIComponent(svgContent).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1));
        const base64Data = `data:image/svg+xml;base64,${btoa(safeSvg)}`;

        if (tiptapEditor) {
            safeInsert(() => {
                tiptapEditor.chain().focus().setImage({ src: base64Data }).run();
            });
        }

        setGraphModal({ isOpen: false, type: null });
        setXData("");
        setYData("");
    };

    return (
        <div
            className="bg-white border-b z-10 sticky top-0 shadow-sm text-sm flex flex-col"
            style={{ width: '100%' }}
        >
            <style>{`
                .word-toolbar-wrapper::-webkit-scrollbar { display: none; }
                .word-toolbar-wrapper { overflow: visible !important; }
            `}</style>
            
            {/* FIRST ROW */}
            <div className="px-2 py-1 flex flex-nowrap items-center gap-2 overflow-x-auto custom-scrollbar w-full">
            {/* Quill's Internal Toolbar Container - restricted to only native Quill formats! */}
            <div id={toolbarId} className="flex flex-nowrap items-center gap-1 border-none border-0 m-0 p-0 shadow-none bg-transparent word-toolbar-wrapper shrink-0">
                {/* Typography Group */}
                <div className="flex items-center gap-0 border-r pr-2">
                    <span className="ql-formats m-0 mr-1 flex items-center gap-0">
                        <select 
                            className="text-xs border rounded p-1" 
                            defaultValue="sans-serif"
                            onChange={(e) => tiptapEditor?.chain().focus().setFontFamily(e.target.value).run()}
                        >
                            <option value="sans-serif">Sans Serif</option>
                            <option value="serif">Serif</option>
                            <option value="monospace">Monospace</option>
                            <option value="bungee-shade">Bungee Shade (3D)</option>
                            <option value="nabla">Nabla (3D Color)</option>
                            <option value="rampart-one">Rampart One (3D Layered)</option>
                            <option value="bungee">Bungee (Layer Base)</option>
                            <option value="londrina">Londrina Solid (Layer Base)</option>
                            <option value="alfa-slab-one">Alfa Slab One (Block)</option>
                            <option value="rubik">Rubik Black (Block)</option>
                            <option value="anton">Anton (Tall Block)</option>
                        </select>
                        <div className="relative border border-gray-200 rounded flex items-center h-[24px] mx-1 bg-white hover:border-gray-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors">
                            <input 
                                type="number" 
                                value={currentSize}
                                onChange={(e) => {
                                    const sz = parseInt(e.target.value);
                                    setCurrentSize(e.target.value);
                                    if (sz && tiptapEditor) {
                                        tiptapEditor.chain().setFontSize(sz).run();
                                    }
                                }}
                                min="1"
                                max="999"
                                className="w-16 px-1 text-xs outline-none bg-transparent text-center m-0"
                                title="Font Size (px)"
                            />
                        </div>
                        <div className="flex items-center ml-1 bg-white border border-gray-200 rounded overflow-hidden h-[24px]" title="Text Color">
                            <i className="pi pi-palette text-xs text-gray-400 px-1"></i>
                            <input 
                                type="color" 
                                className="w-5 h-6 p-0 border-0 bg-transparent cursor-pointer" 
                                onChange={(e) => tiptapEditor?.chain().focus().setColor(e.target.value).run()}
                            />
                        </div>
                    </span>
                </div>

                {/* Text Effect Tool (3D, 4D, 5D) */}
                <div className="flex items-center relative pl-2" ref={textEffectDropdownRef}>
                    <button
                        onClick={() => setTextEffectOpen(!textEffectOpen)}
                        className={`flex justify-center items-center gap-1 w-8 h-8 rounded transition-colors ${textEffectOpen ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-500'}`}
                        title="Text Effects (3D/4D/5D)"
                    >
                        <i className="pi pi-box"></i>
                    </button>
                    <DropdownPortal isOpen={textEffectOpen} anchorRef={textEffectDropdownRef}>
                        <div className="bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-52 p-3 animate-fadein">
                            <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">Dimension</div>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {TEXT_EFFECT_MODES.map(m => (
                                    <button
                                        key={m.id}
                                        onMouseDown={(e) => { e.preventDefault(); setTextEffectMode(m.id); }}
                                        className={`py-2 px-1 border rounded flex flex-col justify-center items-center transition-all ${textEffectMode === m.id ? 'bg-purple-50 border-purple-300 text-purple-600 ring-1 ring-purple-300 shadow-inner' : 'hover:bg-gray-50 text-gray-400 border-gray-200'}`}
                                        title={m.label}
                                    >
                                        <i className={m.icon}></i>
                                        <span className="text-[8px] font-bold mt-1">{m.id.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">Shadow Color</div>
                            <div className="grid grid-cols-8 gap-1">
                                {WISDOM_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className="w-full aspect-square rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] hover:scale-110 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-400"
                                        style={{ backgroundColor: color }}
                                        onMouseDown={(e) => { e.preventDefault(); applyTextEffect(color); }}
                                        title={`Apply Color`}
                                    />
                                ))}
                                <div className="w-full aspect-square rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] hover:scale-110 hover:-translate-y-0.5 transition-all flex items-center justify-center bg-[conic-gradient(red,yellow,green,cyan,blue,magenta,red)] overflow-hidden cursor-pointer relative" title="Custom Color">
                                    <input 
                                        type="color" 
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-0 cursor-pointer"
                                        onChange={(e) => applyTextEffect(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button onMouseDown={(e) => { e.preventDefault(); clearTextEffect(); }} className="w-full mt-4 py-1.5 text-xs text-red-600 font-medium hover:bg-red-50 rounded border border-red-100 transition-colors flex justify-center items-center gap-1">
                                <i className="pi pi-eraser text-[10px]"></i> Clear Effect
                            </button>
                        </div>
                    </DropdownPortal>
                </div>

                {/* Wisdom Overlay Tool */}
                <div className="flex items-center relative pl-2" ref={wisdomDropdownRef}>
                    <button
                        onClick={() => setWisdomOpen(!wisdomOpen)}
                        className={`flex justify-center items-center gap-1 w-8 h-8 rounded transition-colors ${wisdomOpen ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100 text-gray-500'}`}
                        title="Wisdom Overlay Toolkit"
                    >
                        <i className="pi pi-sparkles"></i>
                    </button>
                    <DropdownPortal isOpen={wisdomOpen} anchorRef={wisdomDropdownRef}>
                        <div className="bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-52 p-3 animate-fadein">
                            <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">Form Overlay</div>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {WISDOM_MODES.map(m => (
                                    <button
                                        key={m.id}
                                        onMouseDown={(e) => { e.preventDefault(); setWisdomMode(m.id); }}
                                        className={`py-2 px-1 border rounded flex justify-center items-center transition-all ${wisdomMode === m.id ? 'bg-amber-50 border-amber-300 text-amber-600 ring-1 ring-amber-300 shadow-inner' : 'hover:bg-gray-50 text-gray-400 border-gray-200'}`}
                                        title={m.label}
                                    >
                                        <i className={m.icon}></i>
                                    </button>
                                ))}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">Wisdom Application</div>
                            <div className="grid grid-cols-8 gap-1">
                                {WISDOM_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className="w-full aspect-square rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] hover:scale-110 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400"
                                        style={{ backgroundColor: color }}
                                        onMouseDown={(e) => { e.preventDefault(); applyWisdom(color); }}
                                        title={`Apply Color`}
                                    />
                                ))}
                                <div className="w-full aspect-square rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] hover:scale-110 hover:-translate-y-0.5 transition-all flex items-center justify-center bg-[conic-gradient(red,yellow,green,cyan,blue,magenta,red)] overflow-hidden cursor-pointer relative" title="Custom Color">
                                    <input 
                                        type="color" 
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-0 cursor-pointer"
                                        onChange={(e) => applyWisdom(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button onMouseDown={(e) => { e.preventDefault(); clearWisdom(); }} className="w-full mt-4 py-1.5 text-xs text-red-600 font-medium hover:bg-red-50 rounded border border-red-100 transition-colors flex justify-center items-center gap-1">
                                <i className="pi pi-eraser text-[10px]"></i> Clear Form
                            </button>
                        </div>
                    </DropdownPortal>
                </div>

                {/* Watermark Upload Background Tool */}
                <div className="flex items-center gap-1 border-r pr-2 pl-2 ml-1">
                    <button
                        onClick={() => watermarkInputRef.current?.click()}
                        className="flex justify-center items-center gap-1 w-8 h-8 rounded transition-colors text-gray-500 hover:bg-blue-50 hover:text-blue-600 shadow-sm border border-gray-100 bg-white"
                        title="Set Background Transparent Watermark"
                    >
                        <i className="pi pi-images"></i>
                    </button>
                    {watermark && (
                        <button
                            onClick={() => setWatermark && setWatermark('')}
                            className="flex justify-center items-center gap-1 w-8 h-8 rounded transition-colors text-red-400 hover:bg-red-50 hover:text-red-500"
                            title="Remove Watermark"
                        >
                            <i className="pi pi-times"></i>
                        </button>
                    )}
                    <input
                        type="file"
                        ref={watermarkInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleWatermarkUpload}
                    />
                </div>

                {/* History (Undo / Redo) */}
                <div className="flex items-center gap-1 border-r pr-2">
                    <span className="ql-formats m-0 flex items-center gap-1">
                        <button 
                            onClick={() => tiptapEditor?.chain().focus().undo().run()}
                            disabled={!tiptapEditor?.can().undo()}
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${!tiptapEditor?.can().undo() ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'}`}
                            title="Undo"
                        >
                            <i className="pi pi-undo"></i>
                        </button>
                        <button 
                            onClick={() => tiptapEditor?.chain().focus().redo().run()}
                            disabled={!tiptapEditor?.can().redo()}
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${!tiptapEditor?.can().redo() ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'}`}
                            title="Redo"
                        >
                            <i className="pi pi-refresh"></i>
                        </button>
                    </span>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 border-r pr-2">
                    <span className="ql-formats m-0 flex items-center gap-1">
                        <button 
                            onClick={() => tiptapEditor?.chain().focus().setTextAlign('left').run()}
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 ${tiptapEditor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'text-gray-600'}`}
                            title="Align Left"
                        ><i className="pi pi-align-left"></i></button>
                        <button 
                            onClick={() => tiptapEditor?.chain().focus().setTextAlign('center').run()}
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 ${tiptapEditor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'text-gray-600'}`}
                            title="Align Center"
                        ><i className="pi pi-align-center"></i></button>
                        <button 
                            onClick={() => tiptapEditor?.chain().focus().setTextAlign('right').run()}
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 ${tiptapEditor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'text-gray-600'}`}
                            title="Align Right"
                        ><i className="pi pi-align-right"></i></button>
                    </span>
                </div>

                {/* B, I, U, AA, aa */}
                <div className="flex items-center gap-1 border-r pr-2">
                    <span className="ql-formats m-0 flex items-center gap-1">
                        <button 
                            onClick={() => tiptapEditor?.chain().focus().toggleBold().run()}
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${tiptapEditor?.isActive('bold') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
                            title="Bold"
                        ><span className="font-bold text-lg font-serif leading-none">B</span></button>
                        <button 
                            onClick={() => tiptapEditor?.chain().focus().toggleItalic().run()}
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${tiptapEditor?.isActive('italic') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
                            title="Italic"
                        ><span className="font-bold italic text-lg font-serif leading-none">I</span></button>
                        <button 
                            onClick={() => tiptapEditor?.chain().focus().toggleUnderline().run()}
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${tiptapEditor?.isActive('underline') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
                            title="Underline"
                        ><span className="font-bold underline text-lg font-serif leading-none">U</span></button>
                        
                        <div className="w-px h-5 bg-gray-300 mx-1"></div>

                        <button 
                            onClick={() => {
                                if (!tiptapEditor) return;
                                const { from, to, empty } = tiptapEditor.state.selection;
                                if (!empty) {
                                    const text = tiptapEditor.state.doc.textBetween(from, to, ' ');
                                    tiptapEditor.chain().focus().insertContentAt({from, to}, text.toUpperCase()).setTextSelection({from, to}).run();
                                }
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                            title="Uppercase"
                        ><span className="font-bold text-sm leading-none pt-0.5">AA</span></button>
                        <button 
                            onClick={() => {
                                if (!tiptapEditor) return;
                                const { from, to, empty } = tiptapEditor.state.selection;
                                if (!empty) {
                                    const text = tiptapEditor.state.doc.textBetween(from, to, ' ');
                                    tiptapEditor.chain().focus().insertContentAt({from, to}, text.toLowerCase()).setTextSelection({from, to}).run();
                                }
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                            title="Lowercase"
                        ><span className="font-bold text-sm leading-none pt-0.5">aa</span></button>
                    </span>
                </div>

                {/* Spellcheck */}
                <div className="flex items-center gap-1 border-r pr-2">
                    <button
                        onClick={() => setSpellCheckEnabled(!spellCheckEnabled)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors hidden lg:flex ${spellCheckEnabled ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
                        title={spellCheckEnabled ? 'Spell Check Enabled' : 'Enable Spell Check'}
                    >
                        <i className={`pi ${spellCheckEnabled ? 'pi-check-square' : 'pi-stop'}`}></i>
                        <span className="hidden xl:inline">Spellcheck</span>
                    </button>
                </div>





            </div> {/* END QUILL CONTAINER */}

            {/* Document Assets - Native React Components outside Quill's scope! */}
            <div className="flex items-center gap-1 border-r pr-2 shrink-0">
                <div className="relative shrink-0" ref={imageDropdownRef}>
                    <button
                        onClick={() => setImageDropdownOpen(!imageDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${imageDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} hidden xl:flex`}
                        title="Image Tools"
                    >
                        <i className="pi pi-image text-gray-500"></i>
                        Image
                    </button>
                    <button
                        onClick={() => setImageDropdownOpen(!imageDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${imageDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} xl:hidden`}
                        title="Image Tools"
                    >
                        <i className="pi pi-image text-gray-500"></i>
                    </button>

                    <DropdownPortal isOpen={imageDropdownOpen} anchorRef={imageDropdownRef}>
                        <div className="w-48 bg-white border border-gray-200 shadow-2xl rounded-lg p-1 flex flex-col gap-1">
                            <button
                                onMouseDown={(e) => { e.preventDefault(); setImageDropdownOpen(false); puzzleInputRef.current?.click(); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-table text-blue-500"></i>
                                Upload Puzzle
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); insertTextBox(); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-file-edit text-orange-500"></i>
                                Add Text Box
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); setImageDropdownOpen(false); setGalleryModalOpen(true); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-images text-indigo-500"></i>
                                7 Transformation Image
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); setImageDropdownOpen(false); fileInputRef.current?.click(); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-image text-emerald-500"></i>
                                Add Watermark
                            </button>
                        </div>
                    </DropdownPortal>
                </div>

                <input
                    type="file"
                    ref={puzzleInputRef}
                    onChange={handlePuzzleUpload}
                    accept="image/*"
                    className="hidden"
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleWatermarkUpload}
                    accept="image/*"
                    className="hidden"
                />





                <div className="relative" ref={chartsDropdownRef}>
                    <button
                        onClick={() => setChartsDropdownOpen(!chartsDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${chartsDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} hidden xl:flex`}
                        title="Charts"
                    >
                        <i className="pi pi-chart-bar text-gray-500"></i>
                        Charts
                    </button>
                    <button
                        onClick={() => setChartsDropdownOpen(!chartsDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${chartsDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} xl:hidden`}
                        title="Charts"
                    >
                        <i className="pi pi-chart-bar text-gray-500"></i>
                    </button>

                    <DropdownPortal isOpen={chartsDropdownOpen} anchorRef={chartsDropdownRef}>
                        <div className="w-48 bg-white border border-gray-200 shadow-2xl rounded-lg p-1 flex flex-col gap-1">
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setChartsDropdownOpen(false);
                                    cChartCursorRef.current = quillRef.current?.getEditor()?.getSelection()?.index || quillRef.current?.getEditor()?.getLength() || 0;
                                    setCChartModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-chart-pie text-blue-500"></i>
                                C Chart
                            </button>
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setChartsDropdownOpen(false);
                                    setLionChartModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-chart-line text-orange-500"></i>
                                Lion Chart
                            </button>
                        </div>
                    </DropdownPortal>
                </div>


                <div className="relative" ref={graphsDropdownRef}>
                    <button
                        onClick={() => setGraphsDropdownOpen(!graphsDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${graphsDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} hidden xl:flex`}
                        title="Graphs"
                    >
                        <i className="pi pi-chart-scatter text-gray-500"></i>
                        Graphs
                    </button>
                    <button
                        onClick={() => setGraphsDropdownOpen(!graphsDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${graphsDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} xl:hidden`}
                        title="Graphs"
                    >
                        <i className="pi pi-chart-scatter text-gray-500"></i>
                    </button>

                    <DropdownPortal isOpen={graphsDropdownOpen} anchorRef={graphsDropdownRef}>
                        <div className="w-40 bg-white border border-gray-200 shadow-2xl rounded-lg p-1 flex flex-col gap-1">
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('bar'); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-align-left rotate-90 text-blue-500"></i> {/* Pseudo Bar Icon */}
                                Bar Graph
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('line'); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-wave-pulse text-indigo-500"></i>
                                Line Graph
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('pie'); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-chart-pie text-red-500"></i>
                                Pie Chart
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('area'); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-image text-purple-500"></i>
                                Area Chart
                            </button>
                        </div>
                    </DropdownPortal>
                </div>


                {/* Dictation */}
                <button
                    onClick={toggleDictation}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors hidden xl:flex ${isListening ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100 text-gray-700'}`}
                    title={isListening ? 'Listening...' : 'Start Dictation'}
                >
                    <i className={`pi pi-microphone ${isListening ? 'animate-pulse text-red-600' : 'text-gray-500'}`}></i>
                    {isListening ? <span className="animate-pulse">Listening...</span> : "Dictation"}
                </button>
                <button
                    onClick={toggleDictation}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors shrink-0 xl:hidden ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 text-gray-700'}`}
                    title="Voice to Text Dictation"
                >
                    <i className={`pi pi-microphone ${isListening ? 'animate-pulse text-red-600' : 'text-gray-500'}`}></i>
                </button>
            </div>

            {/* Layout and Addons */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3 ml-1 h-5 hidden lg:flex shrink-0">
                <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                    <i className="pi pi-file text-gray-400 text-sm"></i>
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value)}
                        className="bg-transparent border-none rounded outline-none focus:ring-0 cursor-pointer text-sm font-medium text-gray-700 hover:text-blue-600 appearance-none"
                    >
                        {PAGE_SIZES && Object.keys(PAGE_SIZES).map(key => (
                            <option key={key} value={key}>{PAGE_SIZES[key].name}</option>
                        ))}
                    </select>
                    <i className="pi pi-angle-down text-gray-400 text-[10px] pointer-events-none -ml-1"></i>
                </div>
            </div>

            {/* Advanced Actions */}
            <div className="flex items-center gap-1 ml-auto shrink-0">
                <div className="flex items-center gap-1 px-3 py-1 mr-1 border-r border-gray-200 text-gray-600 hidden md:flex" title="Word Count">
                    <i className="pi pi-comment text-gray-400"></i>
                    <span className="font-bold">{wordCount}</span>
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400">words</span>
                </div>
            </div>
            </div>
            
            {/* SECOND ROW */}
            <div className="flex flex-nowrap items-center gap-2 px-2 py-1 w-full overflow-x-auto custom-scrollbar border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded transition-colors text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium text-sm shrink-0"
                        title="Open Bible Index"
                    >
                        <i className="pi pi-book text-blue-500"></i>
                        <span className="hidden xl:inline font-medium">Books</span>
                    </button>

                    <div className="border-l border-gray-300 h-4 mx-1"></div>

                    <button
                        onClick={() => setHebrewCalculatorOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-gray-100 text-gray-700 shrink-0"
                        title="Hebrew Calculator"
                    >
                        <i className="pi pi-compass text-emerald-500"></i>
                        <span className="hidden xl:inline font-medium">Hebrew</span>
                    </button>

                    <button
                        onClick={() => setGreekCalculatorOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-gray-100 text-gray-700 shrink-0"
                        title="Greek Calculator"
                    >
                        <i className="pi pi-compass text-emerald-500"></i>
                        <span className="hidden xl:inline font-medium">Greek</span>
                    </button>

                    <div className="relative shrink-0" ref={agScriptDropdownRef}>
                        <button
                            onClick={() => setAgScriptDropdownOpen(!agScriptDropdownOpen)}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${agScriptDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`}
                            title="Other Scripts"
                        >
                            <i className="pi pi-moon text-indigo-500"></i>
                            <span className="hidden xl:inline font-medium">Scripts</span>
                        </button>
                        <DropdownPortal isOpen={agScriptDropdownOpen} anchorRef={agScriptDropdownRef}>
                            <div className="w-48 bg-gray-900 border border-gray-700 shadow-2xl rounded-lg p-1 flex flex-col gap-1 text-gray-200 pointer-events-auto">
                                {Object.values(ANTI_GRAVITY_SCRIPTS)
                                    .map(script => (
                                        <button
                                            key={script.id}
                                            onMouseDown={(e) => { e.preventDefault(); setAgScriptDropdownOpen(false); setViewerScript(script); }}
                                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded text-gray-300 transition-colors w-full text-left"
                                        >
                                            <i className="pi pi-compass text-emerald-500"></i>
                                            {script.name}
                                        </button>
                                    ))}
                            </div>
                        </DropdownPortal>
                    </div>

                    <div className="border-l border-gray-300 h-4 mx-1"></div>

                    <div className="relative shrink-0">
                        <button
                            onClick={() => setDailyISIOpen(true)}
                            className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-gray-100 text-gray-700"
                            title="RLLT ISI"
                        >
                            <i className="pi pi-mobile text-lg text-emerald-500"></i>
                            <span className="hidden lg:inline font-medium">RLLT ISI</span>
                        </button>
                    </div>

                    <div className="border-l border-gray-300 h-4 mx-1"></div>

                    <div className="relative shrink-0">
                        <button
                            onClick={() => setRlltToolbarOpen(true)}
                            className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-gray-100 text-gray-700"
                            title="RLLT Toolbar"
                        >
                            <i className="pi pi-th-large text-lg text-blue-500"></i>
                            <span className="hidden lg:inline font-medium">RLLT Toolbar</span>
                        </button>
                    </div>

                    <div className="border-l border-gray-300 h-4 mx-1"></div>

                    <button
                        onClick={() => setScrollMenuOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-orange-50 text-[#8b5a2b] shrink-0"
                        title="Scroll Formats"
                    >
                        <span className="text-lg leading-none">📜</span>
                        <span className="hidden xl:inline font-medium">Scroll</span>
                    </button>
                </div>
                
                {/* Advanced Document Tools moved to Second Row */}
                <div className="flex items-center gap-1 ml-auto shrink-0">
                    <button
                        onClick={() => {
                            if (tiptapEditor) {
                                tiptapEditor.chain().focus().insertContentAt(tiptapEditor.state.doc.content.size, { type: 'page', content: [{ type: 'paragraph' }] }).run();
                            }
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded font-semibold transition-colors border border-green-200 mr-1"
                        title="Add another page"
                    >
                        <i className="pi pi-file-plus"></i>
                        <span className="hidden md:inline">Add Page</span>
                    </button>

                    <button
                        onClick={handleExportPPT}
                        className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded font-semibold transition-colors border border-orange-200"
                        title="Export as PowerPoint"
                    >
                        <i className="pi pi-file-export"></i>
                        <span className="hidden md:inline">PPT</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded font-semibold transition-colors border border-red-200 ml-1"
                        title="Download as PDF"
                    >
                        <i className="pi pi-file-pdf"></i>
                        <span className="hidden md:inline">PDF</span>
                    </button>

                    <div className="flex items-center bg-gray-100 rounded-md p-0.5 mx-1">
                        <button
                            onClick={() => setZoomLevel(prev => Math.max(0.3, prev - 0.1))}
                            className="flex items-center justify-center w-6 h-6 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all focus:outline-none"
                            title="Zoom Out"
                        >
                            <i className="pi pi-minus text-[10px]"></i>
                        </button>
                        <button
                            onClick={() => setZoomLevel(1)}
                            className="flex items-center justify-center min-w-[36px] px-1 text-[11px] font-bold text-gray-700 hover:text-blue-600 cursor-pointer focus:outline-none"
                            title="Reset Zoom"
                        >
                            {Math.round((zoomLevel || 1) * 100)}%
                        </button>
                        <button
                            onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.1))}
                            className="flex items-center justify-center w-6 h-6 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all focus:outline-none"
                            title="Zoom In"
                        >
                            <i className="pi pi-plus text-[10px]"></i>
                        </button>
                    </div>

                    <div className="border-l border-gray-200 h-5 mx-1 hidden md:block"></div>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-gray-700 transition-colors"
                        title="Print Document"
                    >
                        <i className="pi pi-print"></i>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-gray-700 transition-colors border-r border-gray-200 pr-3 mr-1"
                        title="Download"
                    >
                        <i className="pi pi-download"></i>
                    </button>
                    <button
                        onClick={() => setNotesModalOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-amber-100 rounded text-amber-700 transition-colors ml-1 font-medium"
                        title="Document Notes"
                    >
                        <i className="pi pi-clipboard"></i>
                        <span className="hidden sm:inline">Notes</span>
                    </button>

                    <div className="border-l border-gray-200 h-5 mx-1 hidden md:block"></div>

                    <div className="relative shrink-0" ref={countryDropdownRef}>
                        <button
                            onClick={() => {
                                setCountryDropdownOpen(!countryDropdownOpen);
                                if (!countryDropdownOpen) setCountrySearchTerm('');
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${countryDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`}
                            title="Insert Country"
                        >
                            <i className="pi pi-globe text-emerald-600"></i>
                            <span className="hidden xl:inline font-medium">Country</span>
                        </button>
                        <DropdownPortal isOpen={countryDropdownOpen} anchorRef={countryDropdownRef}>
                            <div className="w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg py-1 flex flex-col custom-scrollbar relative">
                                <div className="px-2 pb-1 sticky top-0 bg-white z-10 border-b border-gray-100">
                                    <div className="relative">
                                        <i className="pi pi-search absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                        <input
                                            type="text"
                                            className="w-full text-sm pl-7 pr-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="Search country..."
                                            value={countrySearchTerm}
                                            onChange={(e) => setCountrySearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                {(UN_COUNTRIES || [])
                                    .filter(code => {
                                        if (!countrySearchTerm) return true;
                                        const countryName = regionNames ? regionNames.of(code) : code;
                                        return countryName.toLowerCase().includes(countrySearchTerm.toLowerCase());
                                    })
                                    .map(code => {
                                    const countryName = regionNames ? regionNames.of(code) : code;
                                    return (
                                        <div key={code} className="flex items-center hover:bg-gray-100 transition-colors border-b border-gray-50 last:border-0 w-full group">
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); insertCountry(countryName); }}
                                                className="px-4 py-2 text-left text-gray-700 text-sm flex-1 truncate focus:outline-none"
                                                title={`Insert ${countryName}`}
                                            >
                                                {countryName}
                                            </button>
                                            <button
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setCountryDropdownOpen(false);
                                                    if (handleOpenMap) handleOpenMap(code, countryName);
                                                }}
                                                className="px-3 py-2 flex items-center justify-center border-l border-transparent group-hover:border-gray-200 focus:outline-none"
                                                title={`Open Map for ${countryName}`}
                                            >
                                                <img
                                                    src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                                    srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
                                                    width="20"
                                                    alt={code}
                                                    className="block rounded-sm drop-shadow-sm hover:scale-125 transition-transform"
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </DropdownPortal>
                    </div>

                    <div className="relative shrink-0" ref={shapesDropdownRef}>
                        <button
                            onClick={() => setShapesDropdownOpen(!shapesDropdownOpen)}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${shapesDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`}
                            title="Shapes"
                        >
                            <i className="pi pi-clone text-purple-500"></i>
                            <span className="hidden xl:inline font-medium">Shapes</span>
                        </button>
                        <DropdownPortal isOpen={shapesDropdownOpen} anchorRef={shapesDropdownRef}>
                            <div className="w-80 bg-white border border-gray-200 shadow-2xl rounded-lg p-3 max-h-96 overflow-y-auto custom-scrollbar">
                                {Object.entries(SHAPES).map(([category, shapesList]) => (
                                    <div key={category} className="mb-4 last:mb-0">
                                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{category}</div>
                                        <div className="grid grid-cols-5 gap-2">
                                            {shapesList.map(shape => (
                                                <button
                                                    key={shape.name}
                                                    onMouseDown={(e) => { e.preventDefault(); insertShape(shape.svg); }}
                                                    className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 text-gray-600 transition-colors bg-white focus:outline-none"
                                                    title={shape.name}
                                                    dangerouslySetInnerHTML={{ __html: shape.svg }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DropdownPortal>
                    </div>

                    <div className="border-l border-gray-300 h-4 mx-1"></div>

                    <div className="relative shrink-0" ref={emojiDropdownRef}>
                        <button
                            onClick={() => setEmojiDropdownOpen(!emojiDropdownOpen)}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${emojiDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`}
                            title="Insert Emoji"
                        >
                            <i className="pi pi-face-smile text-lg text-yellow-500"></i>
                            <span className="hidden lg:inline font-medium">Emoji</span>
                        </button>
                        <DropdownPortal isOpen={emojiDropdownOpen} anchorRef={emojiDropdownRef}>
                            <div className="w-72 max-h-64 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg p-2 grid grid-cols-8 gap-1 custom-scrollbar">
                                {EMOJIS.map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); }}
                                        className="text-xl hover:bg-gray-100 rounded p-1 transition-transform hover:scale-125 focus:outline-none flex justify-center items-center"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </DropdownPortal>
                    </div>
                </div>
            </div>


        {/* Puzzle Configuration Modal */}
            {puzzleModalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-sm flex flex-col transform transition-all scale-100 opacity-100">
                        <div className="px-5 py-4 bg-gray-100 border-b flex justify-between items-center bg-gradient-to-r from-gray-100 to-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <i className="pi pi-th-large text-blue-500 text-lg"></i>
                                Enter Puzzle Configuration
                            </h3>
                            <button onClick={() => { setPuzzleModalOpen(false); setPendingPuzzleFile(null); }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors focus:outline-none">
                                <i className="pi pi-times"></i>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Pieces</label>
                                <input type="number" min="1" value={puzzlePieces} onChange={e => setPuzzlePieces(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => { setPuzzleModalOpen(false); setPendingPuzzleFile(null); }} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors focus:outline-none">Cancel</button>
                            <button onClick={processPuzzleImage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow cursor-pointer transition-transform hover:scale-105 focus:outline-none">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Graph Data Prompt Modal */}
            {graphModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md flex flex-col transform transition-all scale-100 opacity-100">
                        <div className="px-5 py-4 bg-gray-100 border-b flex justify-between items-center bg-gradient-to-r from-gray-100 to-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <i className="pi pi-chart-bar text-blue-500 text-lg"></i>
                                {graphModal.type.charAt(0).toUpperCase() + graphModal.type.slice(1)} Graph Data
                            </h3>
                            <button onClick={() => setGraphModal({ isOpen: false, type: null })} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors focus:outline-none">
                                <i className="pi pi-times"></i>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">X-Axis Labels (comma separated)</label>
                                <input type="text" value={xData} onChange={e => setXData(e.target.value)} placeholder="e.g. Jan, Feb, Mar, Apr" className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Y-Axis Values (comma separated)</label>
                                <input type="text" value={yData} onChange={e => setYData(e.target.value)} placeholder="e.g. 10, 25, 45, 80" className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => setGraphModal({ isOpen: false, type: null })} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors focus:outline-none">Cancel</button>
                            <button onClick={submitGraph} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow cursor-pointer transition-transform hover:scale-105 focus:outline-none">Generate</button>
                        </div>
                    </div>
                </div>
            )}

            <ScriptViewerModal
                isOpen={!!viewerScript}
                onClose={() => setViewerScript(null)}
                scriptData={viewerScript}
                onInsert={(glyph) => { insertCountry(glyph); setViewerScript(null); }}
            />

            <DocumentNotesModal
                isOpen={notesModalOpen}
                onClose={() => setNotesModalOpen(false)}
                notes={notes}
                setNotes={setNotes}
            />

            <CChartModal
                visible={cChartModalOpen}
                onHide={() => setCChartModalOpen(false)}
                onInsert={handleCChartInsert}
            />

            <LionChartModal
                visible={lionChartModalOpen}
                onHide={() => setLionChartModalOpen(false)}
                onInsert={handleLionChartInsert}
            />


            <ImageGalleryModal
                isOpen={galleryModalOpen}
                onClose={() => setGalleryModalOpen(false)}
                onInsert={insertGalleryImage}
            />


            <HebrewCalculatorModal
                isOpen={hebrewCalculatorOpen}
                onClose={() => setHebrewCalculatorOpen(false)}
            />

            <GreekCalculatorModal
                isOpen={greekCalculatorOpen}
                onClose={() => setGreekCalculatorOpen(false)}
                onInsert={handleCChartInsert}
            />

            <style>{`
                #${toolbarId} .ql-formats { margin-right: 0; }
                #${toolbarId} button { padding: 3px 5px !important; width: auto !important; height: auto !important; }
                #${toolbarId} .ql-picker.ql-font { width: 110px !important; }
                #${toolbarId} .ql-picker.ql-size { width: 55px !important; }
                #${toolbarId} .ql-picker.ql-color, #${toolbarId} .ql-picker.ql-background { width: 28px !important; }

                .ql-font-bungee-shade { font-family: 'Bungee Shade', cursive; letter-spacing: 1px; }
                .ql-font-nabla { font-family: 'Nabla', system-ui; }
                .ql-font-rampart-one { font-family: 'Rampart One', cursive; }
                .ql-font-bungee { font-family: 'Bungee', cursive; }
                .ql-font-londrina { font-family: 'Londrina Solid', cursive; }
                .ql-font-alfa-slab-one { font-family: 'Alfa Slab One', serif; font-weight: 400; }
                .ql-font-rubik { font-family: 'Rubik', sans-serif; font-weight: 900; }
                .ql-font-anton { font-family: 'Anton', sans-serif; }

                /* Also preview them in the toolbar dropdown */
                .ql-picker.ql-font .ql-picker-item[data-value="bungee-shade"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="bungee-shade"]::before { content: 'Bungee Shade'; font-family: 'Bungee Shade', cursive; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="nabla"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="nabla"]::before { content: 'Nabla'; font-family: 'Nabla', system-ui; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="rampart-one"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="rampart-one"]::before { content: 'Rampart One'; font-family: 'Rampart One', cursive; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="bungee"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="bungee"]::before { content: 'Bungee'; font-family: 'Bungee', cursive; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="londrina"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="londrina"]::before { content: 'Londrina Solid'; font-family: 'Londrina Solid', cursive; font-weight: 900; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="alfa-slab-one"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="alfa-slab-one"]::before { content: 'Alfa Slab One'; font-family: 'Alfa Slab One', serif; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="rubik"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="rubik"]::before { content: 'Rubik (Black)'; font-family: 'Rubik', sans-serif; font-weight: 900; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="anton"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="anton"]::before { content: 'Anton'; font-family: 'Anton', sans-serif; }

                /* Style Numerical Size overrides to render labels instead of generic sizes natively if requested */
                #${toolbarId} .ql-picker.ql-size .ql-picker-options {
                    max-height: 250px;
                    overflow-y: auto;
                }
                .ql-picker.ql-size .ql-picker-item[data-value]::before {
                    content: attr(data-value) !important;
                }
                .ql-picker.ql-size .ql-picker-label[data-value]::before {
                    content: attr(data-value) !important;
                }

                /* Alignment dropdown horizontal format */
                #${toolbarId} .ql-picker.ql-align .ql-picker-item {
                    margin-bottom: 0 !important;
                }
                #${toolbarId} .ql-picker.ql-align.ql-expanded .ql-picker-options {
                    display: flex;
                    flex-direction: row;
                    gap: 4px;
                    width: max-content !important;
                    padding: 6px;
                }
            `}</style>
        </div>
    );
};

export default WordToolbar;
