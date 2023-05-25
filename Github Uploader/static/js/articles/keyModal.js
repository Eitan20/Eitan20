import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

/* Dialogue component to store a user's API key */
export default function KeyModal(params) {
	
	const [key, setKey] = React.useState(params.keyInitial === undefined ? "" : params.keyInitial)
	const [keyExists, setKeyExists] = React.useState(params.keyInitial !== undefined)
	const [open, setOpen] = React.useState(false)

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setKeyExists(key !== "")
		setOpen(false);
	};

	const handleCloseAccept = () => {
		
		setKeyExists(key !== "")

		// If has storage, store key
		if(typeof localStorage != "undefined") {
			localStorage.apiKeyGPT = key
			setKey("")
		}
		else {
			console.error("No local storage available")
		}

		setOpen(false);
	};

	function buttonText() {
		return keyExists ? "Connected" : "Set API Key"
	}

	const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setKey(event.target.value)
	}

	const keyField = <TextField
		autoFocus
		margin="dense"
		id="user-key"
		label="Key"
		type=""
		fullWidth
		variant="standard"
		onChange={handleKeyChange}
	/>

	return (
		<div>
			<Button variant="outlined" onClick={handleClickOpen}>
				{buttonText()}
			</Button>
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>Set API Key</DialogTitle>
				<DialogContent sx={{minWidth: "30vw"}}>
					<DialogContentText>
						Please enter your API key.
					</DialogContentText>
					{keyField}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleCloseAccept}>Ok</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}