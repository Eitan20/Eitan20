import * as React from 'react';
import { Box, InputLabel, Typography, List, ListItem, ListItemButton, ListItemText, Select, Stack, MenuList, MenuItem, TextField, FormControl, Button, Slider, TextareaAutosize, Link } from '@mui/material';
//import Slide, { SlideProps } from '@mui/material/Slide';
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
//import { GPTWrapper } from './gpt-wrapper.js'
import KeyModal from './keyModal.js'
import FaqModal from './faqModal.js'
import KeywordLinkModal from './keyword-link-modal.js'
import ArticleMode from './articleMode.js'
import FeedbackModal from './feedbackModal.js'
import { idToArticleStyle } from './defs-articles.js'
import { Editor } from "react-draft-wysiwyg";
import { EditorState, ContentState } from 'draft-js'; // convertToRaw
import { stateToHTML } from 'draft-js-export-html';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
//import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { replaceOccurrencesHandleHtml } from '../js/utils/string-utils';
import { parseKeywordMultiStr } from './input-validation.js'
//import { sampleArticle } from './sample-article.js'
import { sampleKeywords } from './sample-keywords.js'
import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import { StatusCodes } from './defs.js'

const logService = "https://134-209-213-18.nip.io:4017"

const modeQuick = "Quick Workflow"

const modeCustom = "Custom Workflow"

// const baseUrl = "http://127.0.0.1:5001/word-galaxy-8f9c5/us-central1/"
// const createUrl = baseUrl + "createArticle"
// const progressUrl = baseUrl + "getArticleProgress"
const createUrl = "https://createarticle-la5j7prpkq-uc.a.run.app"
const progressUrl = "https://getarticleprogress-la5j7prpkq-uc.a.run.app"

const errorMessageGeneric = "There was an error generating the article. Please try again or contact support."
const errorMessageContinuing = "Something went wrong. Your article may still be in progress."

async function sendRequestAPI(url = "", jwt = "", data = {}) {
	
	if (jwt === "") throw new Error("Request requires JWT for auth")
  
	const response = await fetch(url, {
		method: "POST",
		//mode: "cors", // no-cors, *cors, same-origin
		//cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
		//credentials: "same-origin", // include, *same-origin, omit
		headers: {
		  "Content-Type": "application/json",
		  // 'Content-Type': 'application/x-www-form-urlencoded',
		  "Authorization": `Bearer ${jwt}` // JWT from client
		},
		//redirect: "follow", // manual, *follow, error
		//referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
		body: JSON.stringify(data), // body data type must match "Content-Type" header
	});

  return response
}

// Error logging
async function postData(url = "", data = {}) {
  const response = await fetch(url, {
	method: "POST",
	mode: "cors", // no-cors, *cors, same-origin
	cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
	credentials: "same-origin", // include, *same-origin, omit
	headers: {
	  "Content-Type": "application/json",
	  // 'Content-Type': 'application/x-www-form-urlencoded',
	},
	redirect: "follow", // manual, *follow, error
	referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
	body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

const sendFeedback = (message, emailOpt) => {

	let msg = {
		message: message
	}

	if (emailOpt !== "") msg.email = emailOpt
	postData(logService + "/saveFeedback", msg)
}

const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
	color: theme.palette.common.black,
  },
  [`& .${tooltipClasses.tooltip}`]: {
	backgroundColor: theme.palette.common.black,
  },
}));

/* 
Interface for Quick + Custom Article Workflow
*/
export default function GeneratorSimple() {

	const [mode, setMode] = React.useState(modeQuick)
	const [keyword, setKeyword] = React.useState("");
	const [keywordHasError, setKeywordHasError] = React.useState(false)
	const [keywordMultiInput, setKeywordMultiInput] = React.useState("");
	const [headerInput, setHeaderInput] = React.useState("");
	const [articleStyle, setArticleStyle] = React.useState(0);
	const [articleLengthSlider, setArticleLengthSlider] = React.useState(3);

	const [articleProgress, setArticleProgress] = React.useState(-1.0)
	const [articleAnalysis, setArticleAnalysis] = React.useState({
		keywordPhrases: []
	})

	// For attaching hyperlinks to keyword phrases (KeywordLinkModal)
	const [linkModalOpen, setLinkModalOpen] = React.useState(false)
	const [linkModalPhrase, setLinkModalPhrase] = React.useState("")

	// Now this is being used for error, and editor div is used for an actual article result
	const [articleResult, setArticleResult] = React.useState("")

	const [createButtonEnabled, setCreateButtonEnabled] = React.useState(true)

	const [editorState, setEditorState] = React.useState(EditorState.createEmpty());

	//let gptWrapper;

	function articleProgressText() {
		return articleProgress >= 0 ? parseInt(articleProgress).toString() + "%" : ""
	}

	/* value: EditorState */
	const onEditorStateChange = (value) => {
		setEditorState(value);
	};

	const toggleMode = () => {
		// Don't allow mode change if article in progress
		if (createButtonEnabled) {
			setMode(mode === modeQuick ? modeCustom : modeQuick)
		}
	}

	const handleStyleChange = (event: SelectChangeEvent) => {
		setArticleStyle(event.target.value);
	};

	const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const kw = event.target.value;
		// Validate
		if (keywordHasError) setKeywordHasError(false)
		setKeyword(kw)
	}

	const handleHeadersChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const text = event.target.value;
		setHeaderInput(text)
	}

	const handleKeywordMultiChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const text = event.target.value;
		setKeywordMultiInput(text)
	}

	/*
	{ status: 'success', result: { status: 1, progress: 50 }}
	{ status: 'success', result: { status: -1, errorShowUser: "Sorry." }}
	*/
	const checkProgress = async (documentId, jwt, depth=0) => {

		try {
			const respRaw = await sendRequestAPI(progressUrl, jwt, { documentId: documentId })
			const resp = await respRaw.json()

			if (respRaw.status !== 200) {

				if (respRaw.status === 500 && depth < 5) {
					
					// In case article not yet in database, continue several checks (although it should be because it returned an ID)
					setTimeout(function() {
						checkProgress(documentId, jwt, depth+1)
					}, (8000 + (4000 * depth)))

					return;
				}
				else {
					console.error("Failed progress check: ", resp)
					throw new Error(resp.errorShowUser ? resp.errorShowUser : "599")
				}
			}

			if (resp.status !== 'success') {
				let msg = "Unknown error: " + documentId
				console.error(msg, resp)
				handleArticleResultError(msg, resp)
			}
			else {

				// Successful response, check article status
				let r = resp.result

				if (r.status === StatusCodes.started || 
					r.status === StatusCodes.new
				) {

					if (r.hasOwnProperty('progress') && r.progress >= 0 && r.progress <= 100) {
						// If job in database, display at least 1 percent
						setArticleProgress(Math.max(1, r.progress))
					}
					else console.warn("Progress missing from resp: ", resp)

					// Continue polling
					setTimeout(function() {
						checkProgress(documentId, jwt, depth+1)
					}, 8000)
				}
				else if (r.status === StatusCodes.finished) {
					
					setArticleProgress(100)

					try {
						let parsed = JSON.parse(r.json)
						handleArticleResult(parsed.text)
					}
					catch (error) {
						// Still try to give user back their text, in case of some kind of json parse error
						console.error("Err parsing resp text: ", r)
						handleArticleResult("There was an error formatting this text.\n\n" + r.json)
					}

					// result has full article
					handleArticleResult(JSON.parse(r.json).text)
				}
				else if (r.status === StatusCodes.error) {

					setArticleProgress(100)

					console.log("Error generating: ", r)
					if (r.errorShowUser) handleArticleResultError(r.errorShowUser)
					else handleArticleResultError(errorMessageGeneric)
				}
			}
		}
		catch (error) {
			console.error("Error checking prog for doc id: ", documentId, error)
			handleArticleResultError(errorMessageContinuing + " id: " + documentId)
		}
	}

	async function handleCreateArticle() {
		
		let kw = keyword.trim()

		if (kw === "") {
			setKeywordHasError(true)
			return
		}
		else if (localStorage === undefined) {
			console.error("No local storage")
			return;
		} 
		else if (!localStorage.hasOwnProperty("apiKeyGPT")) {
			console.error("No local storagekey not set")
			setArticleResult("Please set your API key first.")
			return;
		}
		else if (localStorage.apiKeyGPT.trim() === "") {
			console.error("API key cannot be empty")
			setArticleResult("API key cannot be empty. Please set your API key.")
			return;
		}

		let key = localStorage.apiKeyGPT;
		setCreateButtonEnabled(false)
		// If any previous errors, hide them
		setArticleResult("")

		// if (gptWrapper === undefined) {
		// 	gptWrapper = new GPTWrapper(key)
		// }
		
		// const updateArticleProgress = (count, max) => {
		// 	setArticleProgress(parseInt((count / parseFloat(max)) * 100))
		// }

		let request;

		let mock = false;


		// TODO: Using test JWT *************************************************************
		const jwt = "HXSarnvqD8VdDldNfsT0Yc4oZPf2"


		if (mock) {
			// For testing
			// keywordInput.value = "Keto Trail Mix"
			setKeyword("Keto Trail Mix")
			//keywordMultiInputElem.setInnerHTML = sampleKeywords
			console.log(keywordMultiInputElem)
			setKeywordMultiInput(sampleKeywords)

			class MockResponse {
				ok() { return true }
				async json() { 
					return new Promise((resolve, reject) => {
						resolve({ status: 'success', result: { articleId: 'i2bASv7MSTbWWG2Nd6A4' } } )
					})
				}
			}

			request = new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve(new MockResponse());
				}, 1000)
			})

			// request = new Promise((resolve, reject) => {
			// 	setTimeout(() => {
			// 		resolve({status: 200, text: sampleArticle });
			// 	}, 1000)
			// })
		}
		else if (mode === modeQuick || mode === modeCustom) {

			let params = {
				apiKey: key,
				keyword: kw,
				articleStyle: articleStyle,
				articleLengthSlider: articleLengthSlider,
				headerInput: "",
				keywordMultiInput: ""
			}

			if (mode === modeCustom) {
				params.headerInput = headerInput
				params.keywordMultiInput = keywordMultiInput
			}

			request = sendRequestAPI(createUrl, jwt, params)

			//request = gptWrapper.WriteArticle_(kw, articleStyle, articleLengthSlider, "", "", updateArticleProgress)
			//request = gptWrapper.WriteArticle_(kw, articleStyle, articleLengthSlider, headerInput, keywordMultiInput, updateArticleProgress)
		}
		else {
			let err = `Unrecognized article mode: ${mode}`
			console.error(err)
			handleArticleResultError(err, {})
			return;
		}

		try {
			let respRaw = await request
			let res = await respRaw.json();
			console.log("Resp to create: ", res)

			/*
			{ status: 'success', result: { text: '' } }
			{ status: 'success', error: 'debug msg', errorShowUser: 'We're sorry!' }
			*/
				
			let msgToShow = errorMessageGeneric

			if (respRaw.ok && res.status === 'success') {

				if (!res.result.articleId) {
					console.error("Request success, but no article id", res)
					handleArticleResultError(msgToShow, res)
				}
				else {
					// Poll for progress / result, delay first call for a second
					setArticleProgress(0)
					setTimeout(() => {
						checkProgress(res.result.articleId, jwt)
					}, 2500)
				}
			}
			else {

				// If direct error from the API, display to user
				if (res.hasOwnProperty('errorShowUser')) {
					msgToShow = res.errorShowUser	
				}

				handleArticleResultError(
					msgToShow,
					res
				);
			}
		}
		catch (error) {
			console.error("Create resp: ", error)
			handleArticleResultError(errorMessageGeneric, {})
		}
	

	}

	const handleArticleResult = (result) => {
		
		if (articleProgress !== 100) setArticleProgress(100)

		if (result === undefined || result === "") {
			console.error("Empty result in handleArticleRes")
		}
		else updateEditorContent(result)

		// Update keywords for Link replacement
		try {
			let kws = parseKeywordMultiStr(keywordMultiInput)
			let phrasesAndCounts = kws.map((phrase) => {

				// Count case insensitive
				const count = (result.match(new RegExp(`${phrase}`, "gi")) || []).length;
				
				return { 
					phrase: phrase,
					count: count
				}
			})

			// Sort in descending order
			phrasesAndCounts.sort((a, b) => b.count - a.count);

			setArticleAnalysis({
				keywordPhrases: phrasesAndCounts
			})
		}
		catch (err) {
			console.warn("Error parsing kw multi input: ", keywordMultiInput, err)
			console.trace()
		}
		
		//setArticleResult(result)
		setCreateButtonEnabled(true);
		//logMessages(keyword, result, "")
	}

	const handleArticleResultError = (msgToUser, error) => {
		setArticleResult(msgToUser)
		setCreateButtonEnabled(true);
		logMessages(keyword, "", error)
	}

	const logMessages = (query, text, error) => {
		try {
			//postData(logService + "/saveArticleQAM", { query: query, text: text, error: error })
		}
		catch (error) {
			console.error("Error processing", error)
		}
	}

	const inputElemMaxWidth = "48vw"

	const rightColumnMaxWidth = "20vw"

	const keywordInput = <TextField 
		id="select-keyword" 
		label="Keyword" // Prompt
		variant="outlined" 
		style={{ width: inputElemMaxWidth }}
		inputProps={{ maxLength: 100 }}
		onChange={handleKeywordChange}
	/>

	const keywordInputError = <TextField
		error
		id="outlined-error-helper-text"
		label="Error"
		defaultValue=""
		helperText="Enter a valid keyword phrase."
		onChange={handleKeywordChange}
	/>

	const headerInputElem = <div className="m2"><TextField
		id="select-headers"
		label="Headers"
		multiline
		rows={8}
		defaultValue=""
		placeholder="Headers (separate lines or by commas)"
		style={{ width: inputElemMaxWidth }}
		onChange={handleHeadersChange}
	/></div>

	/* Increase the frequency or presence of these terms */
	const keywordMultiInputElem = 	
		<div className="m2" style={{position: "relative"}}>
			<TextField
				id="select-headers"
				label="Keywords (Additional)"
				multiline
				rows={12}
				defaultValue=""
				style={{ width: rightColumnMaxWidth }}
				onChange={handleKeywordMultiChange}
			/>
			<BootstrapTooltip title="Increase the presence and frequency of these terms." placement="top" arrow>
				<div style={{position: "absolute", top: "5%", right: "5%", display: "flex", 
				justifyContent: "center", alignItems: "center", width: "0.4vw", height: "0.4vw",
				border: "1px solid gray", fontSize: "0.8rem", borderRadius: "8px", padding: "1vmin",
				cursor: "help"}}>
					<span>?</span>
				</div>
			</BootstrapTooltip>
		</div>
		

	const articleResultTextArea = <TextareaAutosize
		aria-label="Result"
		placeholder=""
		style={{ 
			width: "88vw", 
			visibility: articleResult === "" ? "hidden" : "visible",
			borderRadius: "8px",
			padding: "2vmin"
		}}
		value={articleResult}
	/>

	function apiKeyIfExists() {
		if (localStorage !== undefined) return localStorage.apiKeyGPT
		else return undefined
	}
	
	const updateEditorContent = (textWithHtml) => {
		
		console.log("Updating editor w/ result", textWithHtml)
		
		if (textWithHtml !== undefined) {
			try {
				const contentBlock = htmlToDraft(textWithHtml);
				const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
				const doc = EditorState.createWithContent(contentState);
				//console.log("Editor state: ", doc)
				setEditorState(doc)
			}
			catch (error) {
				console.warn("Error parsing result html to editor state: ", error)
				console.log(textWithHtml)
				setArticleResult(textWithHtml)
			}
		}
	}


	// setTimeout(function() {
	// 	//updateEditorContent("<p>THIS IS A TEST.</p>\n<h1>Big text</h1><p>Ok here is a para.\nHere is the next sent.\nHere's the one after.</p><h2>here is title</h2>")
	// 	updateEditorContent('<p>THIS IS <span style="background-color: #ddd;">A TEST</span>.</p>\n<h1>Big text</h1>')
	// }, 3000)

	
	// https://jpuri.github.io/react-draft-wysiwyg/#/docs
	const EditorComponent = <Editor
		// toolbarHidden
		editorStyle={{fontSize: 12}}
		editorState={editorState}
		// toolbarClassName="toolbarClassName"
		// wrapperClassName="wrapperClassName"
		// editorClassName="editorClassName"
		onEditorStateChange={onEditorStateChange}
		toolbar={{
			options: ['inline', 'blockType'],
			inline: {
				options: ['bold', 'italic', 'underline'],//, 'strikethrough', 'monospace'],
				bold: { className: 'bordered-option-classname' },
				italic: { className: 'bordered-option-classname' },
				underline: { className: 'bordered-option-classname' },
				strikethrough: { className: 'bordered-option-classname' },
				code: { className: 'bordered-option-classname' },
			},
			blockType: {
				className: 'bordered-option-classname',
			},
			// fontSize: {
			// 	className: 'bordered-option-classname',
			// 	options: [12]
			// },
			// fontFamily: {
			// 	className: 'bordered-option-classname',
			// },
		}}
	/>;







	// TODO: Extract

	// For keywords list / replacement
	const [selectedIndex, setSelectedIndex] = React.useState(-1);

	/* 
	When user clicks a keyword phrase, 
	highlight occurrences of the phrase in the document
	and pop up a modal so they can paste hyperlinks to replace
	*/
	const handleListItemClick = (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>,
		index: number,
	) => {
		setSelectedIndex(index);


		// TODO: Update counts as article content changes from edits
		// Possibly some case involving overlapping keywords


		let phraseAndCount = articleAnalysis.keywordPhrases[index]

		if (linkModalOpen) {
			setLinkModalOpen(false)
			setLinkModalPhrase("")
		}
		else {
			// Only open if phrase exists to do replacement
			if (phraseAndCount.count > 0) {
				setLinkModalPhrase(phraseAndCount.phrase)
				setLinkModalOpen(true)
			}
		}
	};

	/* linkText: the value of the input field, newline separated URLs */
	const addLinksToPhrase = (phrase, linkText) => {

		let urls = linkText.split("\n").map((link) => link.trim()).filter((link) => link !== "")
		
		if (urls.length === 0) return 0;
		else {

			// Find keyword phrase occurrences in the text

			//const editorState = editorRef.current.getEditorState();
			//const selectedText = editorState.getSelection().toString();

			// Text with no HTML
			// .blocks, List of blocks, each has .text
			//let content = convertToRaw(editorState.getCurrentContent())
			//let text = content.blocks.map((block) => block.text).join('\n')
			//console.log("Current text: ", text)
			const textWithHtml = stateToHTML(editorState.getCurrentContent());


			// Do replacement but protect titles, html, except p tags
			let replacements = urls.map((url) => { return {
				text: "",
				textBefore: `<a href="${url}" target="_blank" rel="noopener">`,
				textAfter: '</a>'
			}})

			let caseInsensitive = true
			let targetIsWordOrPhrase = true;
			let debug = false
			let result;

			// Try skip meta title, meta description, main title, to prevent doing link replacements
			let metadataAndTitle = ""; 
			let articleBody = textWithHtml;
			//let articleStartIdx = textWithHtml.indexOf("<p>")
			let articleStartIdx = textWithHtml.indexOf("</h1>")

			if (articleStartIdx !== -1) {
				metadataAndTitle = textWithHtml.slice(0, articleStartIdx)
				articleBody = textWithHtml.slice(articleStartIdx + 5) // +5 length of h1 closing
			}

			try {
				result = replaceOccurrencesHandleHtml(articleBody, phrase, replacements, caseInsensitive, targetIsWordOrPhrase, debug)
				if (result.numReplacements > 0) {
					let rejoined = metadataAndTitle + result.text
					if (debug) console.log("Result after URL repl: ", rejoined)
					updateEditorContent(rejoined)
					//enqueueSnackbar(`Added ${result.numReplacements} links`, { autoHideDuration: 3000 })
				}

				enqueueSnackbar(`Added ${result.numReplacements} links`, { autoHideDuration: 3000 })
			}
			catch (error) {
				console.error("Error with link replacement: ", error, result)
				console.trace()
				result = { numReplacements: 0 }
				enqueueSnackbar(`Failed to add links.`, { autoHideDuration: 1700 })
			}

			return result.numReplacements
		}
	}

	// setTimeout(function() {
	// 	enqueueSnackbar(`Failed to add links.`, { autoHideDuration: 3200, style: { backgroundColor: "rgb(59, 161, 82)" }} )
	// }, 1000)

	const keywordList = 
		<div style={{width: "26vw", height: "fit-content", "padding": "1vw", borderRadius: "8px", border: "1px solid gray", marginBottom: "2vw"}}>
		{/*cdcdcd*/}
			<div className="flex-row" style={{
				justifyContent: "center", alignItems: "center", fontWeight: "600", paddingBottom: "1vw", paddingTop: "1vw"
			}}>
				Keyword Phrases
			</div>
			<KeywordLinkModal open={linkModalOpen} setOpen={setLinkModalOpen} phrase={linkModalPhrase} addLinksToPhrase={addLinksToPhrase} />
			<div className="flex-col" style={{alignItems: "center"}}>
				<Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
						<List dense={true} component="nav" aria-label="secondary">
							{articleAnalysis.keywordPhrases.map((phraseAndCount, i) => (
								<ListItem key={i} disablePadding>
									<ListItemButton
										sx={{
											'borderRadius': '8px',
											'color': phraseAndCount.count > 0 ? "" : "#9f9f9f",
											'&.Mui-selected': {
											  backgroundColor: 'rgb(224, 224, 224)'
											},
											"&.Mui-hover": {
												backgroundColor: 'rgb(224, 224, 224)'
											},
											"&.Mui-selected:hover": {
												backgroundColor: 'rgb(224, 224, 224)'	
											}
										}}
										// disabled={phraseAndCount.count <= 0}
										selected={selectedIndex === i}
										onClick={(event) => handleListItemClick(event, i)}
									>
										{/* Could chop phrase at 30 chars */}
										<ListItemText primary={phraseAndCount.phrase}/>
										<ListItemText primary={phraseAndCount.count} sx={{textAlign: "right"}}/>
									</ListItemButton>
								</ListItem>
							))}
						</List>
				</Box>
			</div>
		</div>

	const pageTitle = <h2>{mode === modeQuick ? "Quick" : "Custom"} Article Workflow</h2>

	// would be nice to set ".rdw-editor-toolbar" padding-left to 0

	return (
		<div className="gen-simple flex-col">
			<div className="flex-row" style={{width: "100%", justifyContent: "space-between"}}>
				<div className="qaw-left flex-col">
					<div className="flex-row" style={{justifyContent: "center"}}>
						<div className="gen-title">{pageTitle}
						</div>
						<div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
							<KeyModal keyInitial={apiKeyIfExists()} />
						</div>
					</div>

					<div className="gen-content flex-col m2">
						<div className="flex-row">
							<div className="flex-col">
								<div className="m2">
									{keywordHasError ? keywordInputError : keywordInput} 
								</div>
								{mode === modeCustom ? headerInputElem : "" }
								<div className="m2">
									<FormControl>
										<InputLabel id="select-style-label">Style</InputLabel>
											<Select
												labelId="select-style-label"
												id="select-style"
												value={articleStyle}
												label="Style"
												onChange={handleStyleChange}
											>
											<MenuItem value={0}>{idToArticleStyle[0]}</MenuItem>
											<MenuItem value={1}>{idToArticleStyle[1]}</MenuItem>
											<MenuItem value={2}>{idToArticleStyle[2]}</MenuItem>
										</Select>
									</FormControl>
								</div>
							</div>
							<div className="flex-col">
								{mode === modeCustom ? keywordMultiInputElem : "" }
							</div>
						</div>
						<div className="m2" style={{width: "30vw"}}>
							<Typography id="article-length-slider-label" gutterBottom>
								Article Length
							</Typography>
							<Slider 
								defaultValue={3} 
								aria-label="Paragraphs per section" 
								valueLabelDisplay="auto"
								step={1}
								min={1}
								max={5}
								onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
									setArticleLengthSlider(event.target.value);
								}}
							/>
						</div>
						<div className="flex-row m2">
							<Button 
								variant="contained" 
								disabled={!createButtonEnabled}
								onClick={handleCreateArticle}
							>Create Article
							</Button>
							<Box className="m2">
								{articleProgressText()}
							</Box>
						</div>
					</div>
				</div>
				<div className="qaw-right flex-col m4">

					<Stack direction="row" spacing={2} sx={{width: "10vw", justifyContent: "flex-end"}}>
					  {/*<Paper>*/}
						<MenuList>
						 {/*<MenuItem>F3</MenuItem>*/}
						 <ArticleMode 
							modeDisplayed={mode === modeQuick ? modeCustom : modeQuick} 
							toggleMode={toggleMode} 
						 />
						  <FaqModal />
						  <FeedbackModal sendFeedback={sendFeedback} />

						  {/*<MenuItem>My account</MenuItem>
						  <MenuItem>Logout</MenuItem>*/}
						  <div style={{color: "#cccccc", width: "100%", textAlign: "right"}}>
							<Link href="/privacyPolicy.txt" 
								underline="hover" color="inherit" target="_blank" 
								style={{fontSize: "0.8rem", fontWeight: "bold", textAlign: "right"}}
								sx={{pr: 2}}>
								Privacy Policy
							</Link>
						</div>
						</MenuList>
					  {/*</Paper>*/}
					</Stack>

						
				</div>
			</div>
			
			<div className="gen-result m4">
				{articleResultTextArea}
			</div>
			<div id="editor-container" className="flex-row" style={{width: "92vw", justifyContent: "center"}}>
				{/*, backgroundColor: "#e5e5e5"*/}
				<div style={{minWidth: "64vw", maxWidth: "64vw", minHeight: "92vh", marginLeft: "2vw", marginRight: "3vw", marginBottom: "6vh"}}>{EditorComponent}</div>
				{mode === modeCustom ? keywordList : ""}
			</div>
		{/*59, 161, 82 green*/}
			{/*<SnackbarProvider style={{ backgroundColor: "rgb(27, 151, 210)" }}/>*/}
			<SnackbarProvider style={{ backgroundColor: "rgb(27, 120, 204)" }}/>
		</div>
	);
}

/*
// delete localStorage.somekey;
// setLocalStorate(name, val) { localStorage.setItme(name, JSON.stringify(val)); }
*/