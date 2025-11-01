class Dictionary {

    constructor(string) {
        const characters = string.split("");
        const dynamicCharMap = {};
        let codeCount = 0;

        characters.forEach(char => {
            if (!(char in dynamicCharMap)) {
                dynamicCharMap[char] = codeCount;
                codeCount++
        }
    });

    this.dictionary = dynamicCharMap;
    this.reverseDictionary = null;
    this.totalUniqueChars = codeCount;

    let bits = Math.ceil(Math.log2(codeCount)) || 1;
    this.bitsPerIndex = bits;
    }

    buildInverseMap() {
        this.reverseDictionary = Object.fromEntries(
        Object.entries(this.dictionary).map(([char, code]) => [code, char])
    );
    }

    getDictionary() {
        return this.dictionary;
    }
    getInverseMap() {
        if (!this.reverseDictionary) {
            this.buildInverseMap();
        }
        return this.reverseDictionary;
    }
    getCodeCount() {
        return this.totalUniqueChars;
    }
    getBitsPerIndex() {
        return this.bitsPerIndex;
    }
}

class Compression {

    constructor(dictionaryInstance) {
        this.dict = dictionaryInstance;
    }

    encode(string) {
        const dictionaryMap = this.dict.getDictionary();
        const bitsPerIndex = this.dict.getBitsPerIndex();

        let characters = string.split("")

        const binaryCodes = characters.map(char => {
            let decimal = dictionaryMap[char]

            // NOTE: Need to check for undefined, because of js
            if (decimal === undefined) {
                console.log(`Char not found: ${char}, marked as XXX`);
                return 'XXX'
            }
            
            // decimal -> binary
            let binaryString = decimal.toString(2);

            // fill the missing gap
            let binaryCode = binaryString.padStart(bitsPerIndex, 0);

            return binaryCode;
        })

       return {
            compressionCode: binaryCodes.join(""),

            dictionary: dictionaryMap,
            bitsPerIndex: bitsPerIndex,
       };
    }
}
class Decompression {

    constructor(dictionaryInstance) {
        this.dict = dictionaryInstance;
    }

    decode(compressionCode) {
        const inverseDictionary = this.dict.getInverseMap();
        let bitsPerIndex = this.dict.getBitsPerIndex();
        const original = [];

        if (bitsPerIndex === 0) {
            return original.join("");
        }

            for (let i = 0; i < compressionCode.length; i += bitsPerIndex) {

                const binary = compressionCode.slice(i, i + bitsPerIndex);

                const decimal = parseInt(binary, 2);

                const char = inverseDictionary[decimal];

                if (char === undefined) {
                    console.log(`Error in decode: Unokown Codeblock "${binary}"`);
                } else {
                    original.push(char)
                }
            }

        return original.join("");
    }
}

class StorageAnalysis {

    constructor(originalString, compressionResult, dictionaryInstance) {
        this.originalString = originalString;
        this.compressionCode = compressionResult.compressionCode;
        this.dictionary = dictionaryInstance.getDictionary();
    }

    #calculateOriginalSize(string) {
        return string.length * 8;
    }

    #calculateDictionarySize(dictionary) {
        return Object.keys(dictionary).length * 8;
    }

    #calculateCompressedCodeSize(compressionCode) {
        return compressionCode.length;
    }

    getAnalysis() {
        const originalSize = this.#calculateOriginalSize(this.originalString);
        const dictionarySize = this.#calculateDictionarySize(this.dictionary);
        const codeSize = this.#calculateCompressedCodeSize(this.compressionCode);
    

        let newStorage = codeSize + dictionarySize;
        let savedSize = originalSize - newStorage;

        return {
            originalSize: originalSize,
            newStorage: newStorage,
            savedSize: savedSize
        }        
    }
}

class UI {

    constructor(startCompression) {
        this.textAreaElement = document.querySelector("#textarea");
        this.submitButton = document.querySelector("#button");
        this.text = null;

        this.onSubmitting = startCompression;

        this.outputfield = document.querySelector("#outputfield");
        this.history = document.querySelector("#history");
    }
    eventHandler() {
        this.submitButton.addEventListener("click", this.submiting.bind(this))
        document.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                this.submiting(event);
            }
        })
    }

    submiting(event) {
        event.preventDefault();
        this.text = this.textAreaElement.value;
        this.onSubmitting(this.text);
    }
    #createElementP() {
        return document.createElement("p")
    }
    #appendElement(howmanyElements, wehere) {
        const allElement = []
        for(let i = 0; i < howmanyElements; i++) {
            let p = this.#createElementP();
            p.id = `paragrahElementID${i}`
            wehere.appendChild(p);
            allElement.push(p);
        }
        return allElement

    }
    uppdateUI(dataPackage) {
        const originalString = dataPackage.originalText;
        const compromissedString = dataPackage.compromissedText;
        const originalSize = dataPackage.analysisStorage.originalSize;
        const compromissedSize = dataPackage.analysisStorage.newStorage;
        const savedSize = dataPackage.analysisStorage.savedSize;

        const displayContent = [
            "Original Text:",
            `${originalString}`,
            "Compromissed Text:",
            `${compromissedString}`,
            "Storage Analysis",
            `original Size: ${originalSize} Bits`,
            `compromissed Size: ${compromissedSize} Bits`,
            `saved Bits: ${savedSize}`
        ]

        this.outputfield.innerText = "";

        const allParagraph = this.#appendElement(8, this.outputfield);

        allParagraph.forEach((p, i) => {
            p.innerText = displayContent[i]
        })

    }
}

function startEngine(string) {
    const map = new Dictionary(string);
    const compression = new Compression(map)
    const decompression = new Decompression(map)

    let code = compression.encode(string);
    let originalSentenceAgain = decompression.decode(code.compressionCode)


    const analysis = new StorageAnalysis(string,code,map);
    const storage = analysis.getAnalysis();

    const dataPackage = {
        originalText: originalSentenceAgain,
        compromissedText: code.compressionCode,
        analysisStorage: storage,
    }

    ui.uppdateUI(dataPackage);
}

//==============================================================================================


const ui = new UI(startEngine)

ui.eventHandler();
