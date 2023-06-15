import * as React from 'react';
import Button from '@mui/material/Button';
//import { Typography } from '@mui/material' 

/* Menu button for switching article mode */
export default function ArticleMode(params) {
	return (
		<div style={{textAlign: "right"}}>
			<Button onClick={params.toggleMode}>
				{params.modeDisplayed}
			</Button>
		</div>
	);
}