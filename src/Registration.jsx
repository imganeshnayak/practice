import React, { useState } from "react";
import "./App.css";

export default function Registration({ onRegister, onClose }) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState({});

	const validate = () => {
		const e = {};
		if (!name.trim()) e.name = "Name is required";
		if (!email.trim()) e.email = "Email is required";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
		if (!password) e.password = "Password is required";
		else if (password.length < 6) e.password = "Password must be at least 6 characters";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!validate()) return;

		const user = { name: name.trim(), email: email.trim() };
		// Let parent know about the new registration
		if (onRegister) onRegister(user);

		// Clear form
		setName("");
		setEmail("");
		setPassword("");
		setErrors({});
	};

	return (
		<div className="registration-container">
			<h3>Register</h3>
			<form className="registration-form" onSubmit={handleSubmit}>
				<label>
					Name
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Your name"
					/>
					{errors.name && <div className="error">{errors.name}</div>}
				</label>

				<label>
					Email
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
					/>
					{errors.email && <div className="error">{errors.email}</div>}
				</label>

				<label>
					Password
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="At least 6 characters"
					/>
					{errors.password && <div className="error">{errors.password}</div>}
				</label>

				<div className="form-actions">
					<button type="submit">Create account</button>
					<button type="button" className="secondary" onClick={onClose}>
						Back to chat
					</button>
				</div>
			</form>
		</div>
	);
}

