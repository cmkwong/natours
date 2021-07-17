import axios from 'axios';
import {showAlert} from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login', // send the post request to server
      data: {
        email: email,
        password: password
      }
    });

    if (res.data.status === 'success') {      // after login, direct to home page automatically. #189 1610
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });
    if(res.data.status === 'success') location.reload(true);
  } catch(err) {
    showAlert('error', "Error Logging out! Try again.");
  }
}
