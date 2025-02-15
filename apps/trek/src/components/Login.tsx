import {
	Box,
	Button,
	Container,
	Step,
	StepContent,
	StepLabel,
	Stepper,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { SpaceFillingBox, SpaceFillingBoxContainer } from "./misc/SpaceFillingBox";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../util/api";
import { useLocation, useNavigate } from "react-router-dom";

export const Login = () => {
	const theme = useTheme();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [activeStep, setActiveStep] = useState(0);
	const location = useLocation();
	const navigate = useNavigate();
	const { mutate: startLogin } = useMutation({
		onMutate: () => setActiveStep((step) => step + 1),
		mutationFn: () => api.startLogin.mutate({ email, next: location.pathname }), // TODO pathname is not right!!!
	});
	const { mutate: completeLogin } = useMutation({
		onMutate: () => setActiveStep((step) => step + 1),
		mutationFn: () => api.completeLogin.mutate({ email, password }).then(() => navigate(location.pathname)),
	});

	return (
		<SpaceFillingBoxContainer flexDirection="column">
			<SpaceFillingBox>
				<Container maxWidth="md">
					<Box width="100%" height="100%" display="flex" flexDirection="column">
						<Box marginTop="1em">
							<Typography variant="h2" color={theme.palette.text.primary}>
								Login
							</Typography>
						</Box>
						<Box
							width="100%"
							height="100%"
							justifyContent="center"
							alignItems="center"
							display="flex"
							flex={1}
						>
							<Box minWidth="300px" width="75%" boxSizing="border-box" padding="1em">
								<Stepper activeStep={activeStep} orientation="vertical">
									<Step>
										<StepLabel>Email</StepLabel>
										<StepContent>
											<Typography>What's your email?</Typography>
											<TextField
												label="Email"
												value={email}
												onChange={(event) => setEmail(event.target.value)}
												autoComplete="off"
												fullWidth
												sx={{ mt: 1, mr: 1 }}
											/>
											<Box sx={{ mb: 2 }}>
												<Button
													variant="contained"
													onClick={() => startLogin()}
													sx={{ mt: 1, mr: 1 }}
													disabled={!/.+@.+\..+/.test(email)}
												>
													Next
												</Button>
											</Box>
										</StepContent>
									</Step>

									<Step>
										<StepLabel>One Time Password</StepLabel>
										<StepContent>
											<Typography>A password has been sent to</Typography>
											<Typography>{email}</Typography>
											<TextField
												label="Password"
												value={password}
												onChange={(event) => setPassword(event.target.value)}
												autoComplete="off"
												fullWidth
												sx={{ mt: 1, mr: 1 }}
											/>
											<Box sx={{ mb: 2 }}>
												<Button
													variant="contained"
													onClick={() => completeLogin()}
													sx={{ mt: 1, mr: 1 }}
													disabled={!password}
												>
													Login
												</Button>
												<Button
													onClick={() => setActiveStep((step) => step - 1)}
													sx={{ mt: 1, mr: 1 }}
												>
													Back
												</Button>
											</Box>
										</StepContent>
									</Step>
								</Stepper>
							</Box>
						</Box>
					</Box>
				</Container>
			</SpaceFillingBox>
		</SpaceFillingBoxContainer>
	);
};
