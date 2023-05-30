import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Typography } from '@mui/material';

/* Dialogue component to put URL links around keyword phrases that match a specific string

params:
setOpen: (boolean) => 
phrase: string
addLinksToPhrase: (phrase, linkText) =>
*/
export default function KeywordLinkModal(params) {
	
	const titleDefault = "Link Phrases"

	const [content, setContent] = React.useState("")
	const [contentVisibility, setContentVisibility] = React.useState("visible")
	// const [contentDisplay, setContentDisplay] = React.useState("block")
	const [dialogueTitleText, setDialogueTitleText] = React.useState(titleDefault)

	/* Side effects only, since main open in parent */
	const handleOpen = () => {
		// if (params.open) {
		// 	setContentDisplay("block")
		// }
	};

	const handleClose = () => {
		params.setOpen(false)
		// Delay or else it looks janky updating text before invisible
		setTimeout(function() {
			setContent("")
			setDialogueTitleText(titleDefault)
			setContentVisibility("visible")
			// setContentDisplay("block")
		}, 1000)
	};

	const handleSubmit = () => {
		/*
		setContentVisibility("hidden")
		// setContentDisplay("none")

		// Add Undo button *************************
		*/
		//let nReplacements = 0;
		let repl = content
		handleClose()
		
		if (content.trim() !== "") {
			//nReplacements = 
			params.addLinksToPhrase(params.phrase, repl)
		}

		//setDialogueTitleText("Used N / M links, X remaining:\n")
		// Would be nice to add span with color: #0061ff for the numbers
		//setDialogueTitleText(`Added ${nReplacements} links.`)
	};

	const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setContent(event.target.value)
	}

	const linksField = <TextField
		autoFocus
		margin="dense"
		id="links-phrases"
		// label="Feedback"
		multiline
		rows={6}
		label="Links"
		//type=""
		fullWidth
		//variant="standard"
		variant="outlined"
		placeholder="Add one or more URLs"
		onChange={handleFormChange}
	/>

	function titleStyle() {
		// if (contentVisibility !== "visible") return { "textAlign": "center" }
		// else 
		return { }
	}

	return (
		<div style={{textAlign: "right"}}>
			<Dialog 
				open={params.open} onChange={handleOpen} onClose={handleClose} maxWidth={"82%"}
				sx={{transform: "translate(-10%, -10%)", transition: "width 2.5s ease"}}
				BackdropProps={{
					style: {
					  // backgroundColor: 'rgba(0, 0, 0, 0.1)',
					  backgroundColor: 'transparent',
					  // boxShadow: 'none',
					},
				  }}
			>
				{/*sx={{backgroundColor: "#e6e6e6"}}*/}
				<DialogTitle mb={2} sx={titleStyle()}>{dialogueTitleText}</DialogTitle>
				{/*, display: contentDisplay*/}
				<DialogContent sx={{width: "46vw", visibility: contentVisibility }}> 
					<Typography sx={{mb: 2}}>
						Add hyperlinks to the phrase: <b>{params.phrase}</b>
					</Typography>
					{linksField}
				</DialogContent>
				{<DialogActions sx={{visibility: contentVisibility}}>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleSubmit}>Ok</Button>
				</DialogActions>}
			</Dialog>
		</div>
	);
}
