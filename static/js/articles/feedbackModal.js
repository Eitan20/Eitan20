import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Typography } from '@mui/material';
/* Dialogue component to accept article feedback from the user 

params:
sendFeedback: (text) => 
*/
export default function FeedbackModal(params) {
	
	const titleDefault = "Contact Us" //"How are the articles?"

	const [content, setContent] = React.useState("")
	const [email, setEmail] = React.useState("")
	const [contentDisplay, setContentDisplay] = React.useState("visible")
	const [dialogueTitleText, setDialogueTitleText] = React.useState(titleDefault)
	const [open, setOpen] = React.useState(false)

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setContent("")
		setEmail("")
		setContentDisplay("visible")
		setDialogueTitleText(titleDefault)
		setOpen(false);
	};

	const handleCloseAccept = () => {
		
		setDialogueTitleText("Thank you!")
		setContentDisplay("hidden")

		// Take 3k chars for safety
		if (content.trim() !== "") params.sendFeedback(content.slice(0, 3000), email)

		//setOpen(false);
	};

	const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setContent(event.target.value)
	}

	const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(event.target.value)
	}

	const userField = <TextField
		autoFocus
		margin="dense"
		id="user-feedback"
		// label="Feedback"
		multiline
		rows={6}
		//type=""
		fullWidth
		//variant="standard"
		variant="outlined"
		onChange={handleFormChange}
	/>

	const userFieldEmail = <TextField
		autoFocus
		margin="dense"
		id="user-email"
		label="Your Email"
		//type=""
		//fullWidth
		//variant="standard"
		variant="outlined"
		onChange={handleEmailChange}
	/>

	return (
		<div style={{textAlign: "right"}}>
			<Button onClick={handleClickOpen}>
				Feedback
			</Button>
			<Dialog open={open} onClose={handleClose} maxWidth={"82%"}>
				<DialogTitle>{dialogueTitleText}</DialogTitle>
				<DialogContent sx={{width: "56vw", visibility: contentDisplay}}>
					<Typography sx={{mb: 2}}>
						Please send your feedback. We use your suggestions to improve the Quick Article Workflow (we read every message!).
					</Typography>
					{/*<DialogContentText sx={{p: 4}}>
						Send Feedback
					</DialogContentText>*/}
					{userFieldEmail}
					{userField}
				</DialogContent>
				{<DialogActions sx={{visibility: contentDisplay}}>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleCloseAccept}>Submit</Button>
				</DialogActions>}
			</Dialog>
		</div>
	);
}
