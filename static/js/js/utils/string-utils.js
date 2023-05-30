/* 
Returns text with occurrences of target string replaced by values in replacements array 

targetIsWordOrPhrase: 
  if true, match occurrence as word/phrase, for example,
  if the target is "dog" match in "I walked my dog.", but not "I ate a hotdog."

Replacements is an array containing objects, for example:

To replace target (cats) with the word "dogs"
target=cats
replacements = [{ 
  text: "dogs",
  textBefore: "",
  textAfter: ""
}]

To prepend / append to the target, to change "dogs" => "sheep dogs":
{
  text: "", // Empty allows the replacement to use the original text of the target unchanged, for when original casing matters
  textBefore: "sheep ",
  textAfter: ""
}

The main intended use for the before / after is for creating links, 
target: "dogs" => "<a href...>dogs</a>"
target: "dogs" => "<a href...>Dogs</a>", casing is maintained that matches the original text
{
  text: "",
  textBefore: '<a href="https://...">',
  textAfter: '</a>'
} 
*/
function replaceOccurrences(text, target, replacements, caseInsensitive, targetIsWordOrPhrase, debug) {

  if (text.length === 0 || target.length === 0 || replacements.length === 0) return { text: text, numReplacements: 0 }

  let replacedText = "";
  let remainingText = text
  let replacementIndex = 0;
  
  let regex;

  // Use word boundaries to require a non-alphanumeric character before and after the target word / phrase to know the exact word is being matched, and not "dog" in "hotdog"
  //let regexTarget = `(?<!\w)${target}(?!\w)`
  let regexTarget = `\\b${target}\\b`

  // If the target is not a word or phrase, match any occurrences
  if (!targetIsWordOrPhrase) regexTarget = `${target}`

  if (caseInsensitive) regex = new RegExp(regexTarget, 'i')
  else regex = new RegExp(regexTarget)

  let match = regex.exec(remainingText);
  if (debug) console.log("Match ", match)

  while (match !== null) {
    
    let r = replacements[(replacementIndex + 1) % replacements.length];
    let hasBefore = r.hasOwnProperty('textBefore') && r.textBefore !== ""
    let hasAfter = r.hasOwnProperty('textAfter') && r.textAfter !== ""
    if ((hasBefore || hasAfter) && r.text !== "") {
      console.error("Replacement cannot have before/after and text, just combine into .text", r)
    }

    // Use the original matched text in between if replacement has prefix / suffix 
    if (hasBefore && hasAfter) {
      r = r.textBefore + match[0] + r.textAfter
    }
    else if (hasBefore) {
      r = r.textBefore + match[0]
    }
    else if (hasAfter) {
      r = match[0] + r.textAfter
    }
    else {
      r = r.text
    }
    
    if (debug) console.log(`M: [${match[0]}]`, " repl: ", r)
    replacedText += remainingText.slice(0, match.index) + r
    remainingText = remainingText.slice(match.index + match[0].length);
    replacementIndex += 1
    match = regex.exec(remainingText);
  }

  if (remainingText.length > 0) {
    replacedText += remainingText
  }

  if (debug) console.log("Repls: ", replacementIndex, replacedText)

  return { text: replacedText, numReplacements: replacementIndex };
}

/* 
Returns text with occurrences of target string replaced by values in replacements array 

See definition for replaceOccurrencesHandleHTML

For use with text containing HTML,
Avoids replacement in html element tags, excluding <p> tags
For example, if an a-href contains "dogs", it will not be replaced if "dogs" is the target,
Also for titles like h1, their text will not be affected by replacements
*/
export function replaceOccurrencesHandleHtml(text, target, replacements, caseInsensitive, targetIsWordOrPhrase, debug) {

  if (text.length === 0 || target.length === 0 || replacements.length === 0) return text

  // Protect any HTML spans from modification, excluding contents of p tags
  const regexHtml = new RegExp(/<([^p]*?)\s*?.*?>.*?<\/\1>/)

  let replacedText = text;
  let match = regexHtml.exec(text);
  let htmlReplacements = {}
  let replIdx = 0
  function replToken() { return "$$REPL_" + replIdx + "_" }

  while (match !== null) {
    if (debug) console.log(`M: [${match[0]}]`)
    replacedText = replacedText.slice(0, match.index) + replToken() + replacedText.slice(match.index + match[0].length);
    htmlReplacements[replToken()] = match[0]
    replIdx += 1
    match = regexHtml.exec(replacedText);
  }

  let withTargets = replaceOccurrences(replacedText, target, replacements, caseInsensitive, targetIsWordOrPhrase, debug)
  let withTargetsReplaced = withTargets.text
 
  Object.keys(htmlReplacements).forEach((rToken) => {
    withTargetsReplaced = withTargetsReplaced.replace(rToken, htmlReplacements[rToken])
  })

  if (debug) {
    console.log("\nAfter HTML:  ", replacedText)
    console.log("After repl:  ", withTargets)

    console.log("Phrase:   ", target)
    console.log("Original: ", text)
    console.log("Result:   ", withTargetsReplaced)
  }

  return { text: withTargetsReplaced, numReplacements: withTargets.numReplacements };
}

// /* Returns text with occurrences of target string replaced by values in replacements array */
// export function replaceOccurrences(text, target, replacements) {

//  if (text.length === 0 || target.length === 0 || replacements.length === 0) return text

//  let replacedText = text;
//  let replacementIndex = 0;
//  let currentIndex = replacedText.indexOf(target);

//  while (currentIndex !== -1) {
//    replacedText = replacedText.slice(0, currentIndex) + replacements[replacementIndex] + replacedText.slice(currentIndex + target.length);
//    replacementIndex = (replacementIndex + 1) % replacements.length;
//    currentIndex = replacedText.indexOf(target, currentIndex + replacements[replacementIndex].length);
//  }

//  return replacedText;
// }


// export {
// 	replaceOccurrencesHandleHTML,
// 	replaceOccurrences
// }

// module.exports = {
//     replaceOccurrences,
//     replaceOccurrencesHandleHTML
// }