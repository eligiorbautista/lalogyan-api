export const authRoutesDocumenation = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Authentication API</title>
    <style>
        * {
            font-family: sans-serif;
        }
    </style>
</head>
<body>
    <h1>User Authentication API Documentation</h1>
    <p>This documentation provides details on how to use the authentication API, which includes endpoints for user registration, login, logout, password reset, and OTP verification.</p>

    <h2>Base URL</h2>
    <p>http"//127.0.0.1:3000/api/auth</p>
    <hr>
    <h2>Endpoints</h2>
        
    <h3>Register a New User</h3>
    <ul>
        <li><strong>URL:</strong> /api/auth/register</li>
        <li><strong>Method:</strong> POST</li>
        <li><strong>Description:</strong> Registers a new user.</li>
        <li><strong>Request Body:</strong>
            <pre>{
    "username": "user_name",
    "password": "user_password",
    "email": "user_email@example.com"
}</pre>
        </li>
        <li><strong>Responses:</strong>
            <pre>201 Created:
{
    "message": "User registered successfully"
}
400 Bad Request:
{
    "error": "Error message"
}</pre>
        </li>
    </ul>
    <hr>
    <h3>Login User</h3>
    <ul>
        <li><strong>URL:</strong> /api/auth/login</li>
        <li><strong>Method:</strong> POST</li>
        <li><strong>Description:</strong> Logs in a user.</li>
        <li><strong>Request Body:</strong>
            <pre>{
    "usernameOrEmail": "user_name / email",
    "password": "user_password"
}</pre>
        </li>
        <li><strong>Responses:</strong>
            <pre>200 OK:
{
    "message": "Logged in successfully"
}
400 Bad Request:
{
    "message": "Invalid credentials"
}</pre>
        </li>
    </ul>
    <hr>
    <h3>Logout User</h3>
    <ul>
        <li><strong>URL:</strong> /api/auth/logout</li>
        <li><strong>Method:</strong> POST</li>
        <li><strong>Description:</strong> Logs out a user.</li>
        <li><strong>Responses:</strong>
            <pre>200 OK:
{
    "message": "Logged out successfully"
}</pre>
        </li>
    </ul>
    <hr>
    <h3>Request Password Reset</h3>
    <ul>
        <li><strong>URL:</strong> /api/auth/reset-password</li>
        <li><strong>Method:</strong> POST</li>
        <li><strong>Description:</strong> Requests a password reset by generating an OTP.</li>
        <li><strong>Request Body:</strong>
            <pre>{
    "email": "user_email@example.com"
}</pre>
        </li>
        <li><strong>Responses:</strong>
            <pre>200 OK:
{
    "message": "OTP sent to email"
}
400 Bad Request:
{
    "message": "User not found"
}</pre>
        </li>
    </ul>
    <hr>
    <h3>Verify OTP</h3>
    <ul>
        <li><strong>URL:</strong> /api/auth/verify-otp</li>
        <li><strong>Method:</strong> POST</li>
        <li><strong>Description:</strong> Verifies the OTP for password reset.</li>
        <li><strong>Request Body:</strong>
            <pre>{
    "email": "user_email@example.com",
    "otp": "123456"
}</pre>
        </li>
        <li><strong>Responses:</strong>
            <pre>200 OK:
{
    "message": "OTP verified, proceed to reset password"
}
400 Bad Request:
{
    "message": "User not found"
}
{
    "message": "OTP expired"
}
{
    "message": "Invalid OTP"
}</pre>
        </li>
    </ul>
    <hr>
    <h3>Reset Password</h3>
    <ul>
        <li><strong>URL:</strong> /api/auth/reset-password-final</li>
        <li><strong>Method:</strong> POST</li>
        <li><strong>Description:</strong> Resets the user's password.</li>
        <li><strong>Request Body:</strong>
            <pre>{
    "email": "user_email@example.com",
    "otp": "123456",
    "newPassword": "new_password"
}</pre>
        </li>
        <li><strong>Responses:</strong>
            <pre>200 OK:
{
    "message": "Password reset successfully"
}
400 Bad Request:
{
    "message": "User not found"
}
{
    "message": "OTP expired"
}
{
    "message": "Invalid OTP"
}</pre>
        </li>
    </ul>
</body>
</html>
`;
