/* eslint-disable */
import axios from 'axios';
import { showAlert} from './alerts';

// type is either 'password' or data
export const updateSettings = async (data, type) => {
  try {
    const url =
      (type === 'password')
        ?'/api/v1/users/updateMyPassword' //- this api is from authController
        :'/api/v1/users/updateMe'

    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Data updated successfully!`);
    }
  } catch(err) {
    showAlert('error', err.response.data.message);
  }
}
