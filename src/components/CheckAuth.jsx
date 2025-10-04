import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useCustom } from '../Store/Store';
import { isTokenExpired } from '../Services/Services';
import Axios from '../Services/Axios';

const CheckAuth = ({children}) => {
  const {token,setToken}=useCustom();
    const navigate = useNavigate();
        useEffect(()=>{
          const verifyToken=async()=>{
            if(!token){
              try {
                const res = await Axios.post("/refresh-token",{},{
                  withCredentials:true
                });
                setToken(res.data.accessToken);
              } catch (error) {
                console.log(error);
                navigate('/login');
              }
            }
               if(isTokenExpired(token)){
              try {
                const res = await Axios.post("/refresh-token",{},{
                  withCredentials:true
                });
                setToken(res.data.accessToken);
              } catch (error) {
                console.log(error);
                navigate('/login');
              }
            };
          };
      verifyToken();
        },[token])
  return (
    <div>{children}</div>
  )
}

export default CheckAuth