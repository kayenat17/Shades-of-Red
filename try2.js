
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');
});

signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');
});

const signUpForm = document.getElementById('signUp');
const signInForm = document.getElementById('signIn');

signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const signUpName = document.getElementById('signUpName').value;
    const signUpEmail = document.getElementById('signUpEmail').value;
    const signUpPassword = document.getElementById('signUpPassword').value;
    // Perform sign up logic here
    console.log('Sign up:', signUpName, signUpEmail, signUpPassword);
});

signInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const signInEmail = document.getElementById('signInEmail').value;
    const signInPassword = document.getElementById('signInPassword').value;
    // Perform sign in logic here
    console.log('Sign in:', signInEmail, signInPassword);
});
