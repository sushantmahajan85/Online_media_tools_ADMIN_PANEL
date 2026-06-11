import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from "react-redux";
import { login, logout, selectAdmin } from '../../Store/authSlice';
import {
  isAdminRouteAllowed,
  getAdminRouteRedirect,
} from '../../utils/adminProfile';
import CryptoJS from 'crypto-js';

const secretEnKey = process.env.REACT_APP_SECRET_ENC_KEY


export const PrivateRouteAdmin = ({ element }) => {
  const [session, setSession] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const adminAuth = useSelector(selectAdmin);

  // useEffect(() => {
  //   async function checkuser() {

  //     try {
  //       const jwtadmintoken = localStorage.getItem('admintoken');

  //       if (!jwtadmintoken) {
  //         throw new Error('Token not found');
  //       }


  //       const response = await axios.get(`${serverURL}/api/verify/${storeAdmin._id}/tokenAuth`, {
  //         headers: {
  //           authorization: jwtadmintoken,
  //         },
  //       });


  //       if (response.data.message === 'Invalid Token') {

  //         toast.error('Token is invalid');
  //         navigate('/');

  //       } else if (response.data.message === 'User not found') {
  //         toast.error('User not found');
  //         navigate('/');

  //       } else if (response.data.message === 'Access denied') {
  //         toast.error('Access is denied');
  //         navigate('/');

  //       } else if (response.data.message === 'Unauthorized') {
  //         toast.error('You are Not authorized');
  //         navigate('/');

  //       } else if (response.data.message === 'Access Granted') {
  //         //   toast('Welcome to your dashboard');
  //         setDashboard(true);
  //       }
  //     } catch (error) {

  //       toast.error('Unable to Load User, try Again Later');
  //       navigate('/');
  //     }


  //   }
  //   checkuser()

  //   // Check if a token is already in localStorage

  // }, [id, navigate, storeAdmin]);

  const decryptUserData = (data) => {
    const decryptedBytes = CryptoJS.AES.decrypt(data, secretEnKey);
    const decryptedData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;

  }

  useEffect(() => {
    async function checkuser() {
      try {

        const storedData = localStorage.getItem('OMB_ADMIN_DATA');
        if (storedData) {
          const { admin, expiration } = JSON.parse(storedData);
          if (expiration > Date.now()) {
            const adminData = decryptUserData(admin);
            // // console.log(userData);
            dispatch(login(adminData))
            setSession(true)

          } else {
            localStorage.removeItem('OMB_ADMIN_DATA');
            setSession(false)
            dispatch(logout())
            navigate('/Login')
          }
        }

      } catch (error) {
        toast.error('Unable to Load User, try Again Later');
        setSession(false)
        navigate('/Login');
      }
    }
    checkuser()


  }, [dispatch, navigate]);

  if (!session) return null;

  if (!isAdminRouteAllowed(adminAuth, pathname)) {
    return <Navigate to={getAdminRouteRedirect(adminAuth)} replace />;
  }

  return element;
};

