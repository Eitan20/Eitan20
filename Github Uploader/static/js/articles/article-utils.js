
const pOpenTag = "<p>"
const pCloseTag = "</p>"

/* 
Find the number of sentences in the next para 
Start from index of <p> tag
end at next closing </p> tag
*/
function numSentsInParagraph(start, section, groupSize) {

	let sentsInPara = -1

	// Find idx of end of paragraph
	let endIdx = -1
	for (let j = start; j < section.length; j++) {
		if (section[j] === pCloseTag) {
			endIdx = j
			break
		}
	}

	//console.log("Looking at section: ", start, endIdx, section)

	if (endIdx === -1) {
		// Should never happen since sent elements manually wrapped w/ p tags
		sentsInPara = 0
	}
	else {
		let sectionLength = endIdx - start

		if (sectionLength <= groupSize) {
			sentsInPara = sectionLength
		}
		else {
			let remainder = sectionLength % groupSize
			//let nGroups = Math.floor(sectionLength / groupSize)
			let nFirst = groupSize + remainder
			sentsInPara = nFirst
		}
	}

	return sentsInPara
}

export function splitSectionToGroups(section, groupSize) {

	let ss = []
	let sentsInPara = -1

	for (let i = 0; i < section.length; i++) {

		let sent = section[i];

		if (sent.startsWith(pOpenTag)) {
			sentsInPara = 1 + numSentsInParagraph(i+1, section, groupSize) // +1 for pOpenTag
			//console.log("-found start: ", sentsInPara - 1, "sents")
		}
		else if (sent.startsWith(pCloseTag)) {
			
		}
		else if (sent.startsWith("<h")) {
			// Don't count in paragraph
			sentsInPara = -1
		}
		
		// If ending a group of sents,
		// closing tag already exists or add it
		if (sentsInPara === 0) {
			if (sent !== pCloseTag) {
				//console.log("Added: </p><p>")
				ss.push("</p>")
				ss.push("<p>")
				// update sents in para using next idx!
				sentsInPara = numSentsInParagraph(i, section, groupSize)
			}
		}

		ss.push(sent)
		sentsInPara -= 1
		//console.log("Added: ", sent, "remaining: ", sentsInPara)
	}

	return ss
}


