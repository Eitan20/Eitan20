import { idToArticleStyle } from './defs-articles.js'

/*
Validate input params to the article writer
*/

class ValidationError extends Error {
  constructor(message, type) {
    super(message);
    this.name = "ValidationError";
    this.type = type;
  }
}

export function checkValidQueryAndStyle(q, idStyle) {
	if (!idToArticleStyle.hasOwnProperty(idStyle)) {
		console.error("Unknown idStyle", idStyle)
		throw new ValidationError(`Style ${idStyle} unknown`, "style value")
	}
	else if (q.trim() === "") {
		console.error("query is empty")
		throw new ValidationError("Query is empty", "query value")
	}
}

/* headerStr: newline or comma separated list of titles */
export function parseHeaderStr(headerStr) {

	function clean(lines) {
		return lines.map((line) => line.trim()).filter((line) => line !== "")
	}

	let base = headerStr.trim()

	let splitNewline = clean(base.split("\n"))
	let splitComma = clean(base.split(","))
	
	let nNewline = splitNewline.length
	let nComma = splitComma.length

	if (nNewline === 0 && nComma === 0) return []
	else if (nNewline > 1 && nNewline === nComma) {
		console.warn("Unknown parse result: ", headerStr)
		throw new ValidationError('Items must be separated by newline or comma', 'header/keyword value')
	}
	else {
		//if (nNewline > nComma) return splitNewline
		if (nNewline > 1) return splitNewline
		else return splitComma
	}
}

/* keywordMultiStr: newline or comma separated list of titles */
export function parseKeywordMultiStr(keywordMultiStr) {
	const strs = parseHeaderStr(keywordMultiStr)
	return [...new Set(strs)];
}