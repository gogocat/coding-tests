const units = {
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
    '10': 'ten',
    '11': 'eleven',
    '12': 'twelve',
    '13': 'thirteen',
    '14': 'fourteen',
    '15': 'fifteen',
    '16': 'sixteen',
    '17': 'seventeen',
    '18': 'eighteen',
    '19': 'nineteen'
};

const tens = {
    '0': '',
    '1': '',
    '2': 'twenty',
    '3': 'thirty',
    '4': 'forty',
    '5': 'fifty',
    '6': 'sixty',
    '7': 'seventy',
    '8': 'eighty',
    '9': 'ninety'
};

const scales = [
    'hundred',
    'thousand',
    'million',
    'billion',
    'trillion',
    'quadrillion',
    'quintillion',
    'sextillion',
    'septillion',
    'octillion',
    'nonillion',
    'decillion',
    'undecillion',
    'duodecillion',
    'tredecillion',
    'quatttuor-decillion',
    'quindecillion',
    'sexdecillion',
    'septen-decillion',
    'octodecillion',
    'novemdecillion',
    'vigintillion',
    'centillion'
];

const REGEX = {
    whiteSpaceComma: /\s|\,/g,
    num: /[0-9]/,
    match3: /.{1,3}/g,
    lineBreaks: /\n|\r/g
};

function currencyToWord(currency) {
    let num = currency.replace(REGEX.whiteSpaceComma, '');
    let symbol = '';
    let numLength = 0;
    let ret = '';

    if (!REGEX.num.test(num.charAt(0))) {
        symbol = num.charAt(0);
        num = num.substring(1);
    }

    numLength = num.length;

    if (!parseFloat(num) > 0) {
        return 'zero';
    }

    if (numLength === 1) {
        // dollar 1
        ret = toDollar(num);
    } else if (numLength === 2) {
        // tens 10
        ret = toTens(num);
    } else if (numLength === 3) {
        // hundred 100
        ret = toHundred(num);
    } else if (numLength >= 4) {
        // thousand 1,000 | 12,345 | 123,456
        ret = toXlion(num);
    }

    return ret.trim().replace(REGEX.lineBreaks, '');
}

/**
 * breakToChunks
 * @description 
 * break string into array of 3 characters per value. 
 * eg million '1234567' -> ['1', 234', '567'] 
 * @param {string} str 
 * @returns {array} 
 */
function breakToChunks(str) {
    let ret = [];
    const strLength = str.length;

    if (strLength <= 3) {
        return [str];
    }
    // example '1234567'
    const startPos = str.length % 3; // start position of chunks -> 1
    const chunkString = str.substring(startPos); // remove non 3 characters from startPos -> 234567
    const headString = str.substring(0, startPos); // keep the removed head part -> 1

    ret = chunkString.match(REGEX.match3); // convert to array on every 3 character -> ['234', '567']

    if (headString) {
        // add back non 3 character to front -> ['1', 234', '567']
        ret.unshift(headString);
    }

    return ret;
}

function toDollar(numString) {
    return units[numString];
}

function toTens(numString) {
    const unit = toDollar(numString);

    if (unit) {
        return unit;
    }

    let dollar = numString.charAt(1) === '0' ? '' : toDollar(numString.charAt(1));

    return `
        ${tens[numString.charAt(0)]} 
        ${dollar}
    `;
}

function toHundred(numString) {
    const num = parseFloat(numString);

    if (!num > 0) {
        return '';
    }
    // eg user input 099
    if (num <= 99) {
        return toTens(String(num));
    }

    return `
        ${units[numString.charAt(0)]} 
        ${scales[0]} 
        ${toTens(numString.substring(1))}
    `;
}

function toXlion(numString) {
    const chunks = breakToChunks(numString);
    const chunksLength = chunks.length;
    const getUnit = strg => {
        return strg.length < 3 ? units[strg] : toHundred(strg);
    };

    let ret = [];

    chunks.forEach((strg, index) => {
        if (index === 0) {
            ret.push(getUnit(strg));
        } else {
            ret.push(scales[chunksLength - index]);
            ret.push(toHundred(strg));
        }
    });

    return ret.join(' ');
}

// dom inputs
const $input = document.getElementById('currency');
const $result = document.getElementById('result');

window.decounceTimer = null;

function handleConversion(e) {
    clearTimeout(window.decounceTimer);
    window.decounceTimer = setTimeout(() => {
        const ret = currencyToWord(e.target.value);
        $result.textContent = ret;
        speak(ret);
    }, 500);
}

$input.addEventListener('keyup', handleConversion);

/**
 * speak
 * @description
 * use closure to store choosen voice settings
 * @returns {function}
 */
const speak = (() => {
    if (!typeof SpeechSynthesisUtterance === 'function') {
        return () => {};
    }
    let voices;
    let googleFemaleVoice;
    let voice;

    // browser getVoices is asynchronous, therefore poll until we get it
    let setVoiceTimer = setInterval(() => {
        voices = window.speechSynthesis.getVoices();
        if (voices && voices.length) {
            voices.forEach(voice => {
                // Google Female voice is the best :)
                if (voice.voiceURI === 'Google UK English Female') {
                    googleFemaleVoice = voice;
                }
            });
            voice = googleFemaleVoice || voices[0];
            clearInterval(setVoiceTimer);
        }
    }, 20);

    return message => {
        // cancel any non finish speach first
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(message);
        msg.voice = voice;
        window.speechSynthesis.speak(msg);
    };
})();


